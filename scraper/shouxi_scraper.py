"""
首席收藏 (data.shouxi.com) 全量爬虫
~154万条拍品数据，支持断点续爬

页面结构 (经过实测分析):
- 标题: h2.singlePage → "Lot:1931  张作霖像民国15年壹圆 NGC MS 62"
- 主图: #item1_img[src]
- 分类面包屑: a[href*=item_list.php] (机制银币 > 纪念币 > 张作霖像 > 民国15年 > 壹圆)
- 右侧信息: .rightSide → 品相/成交价/拍卖公司/状态
- 估价: p.mt15 → "拍品估价：RMB 1800000-2200000"
- 专场: p.mt15 → "拍品专场：北京诚轩2017年春拍-古钱 银锭 机制币"
- 日期: p.mt15 → "开拍日期：2017-06-21"
- 同专场拍品: .transactionCard (名称+价格+图片)
- 价格需登录（公开页显示"登录查看价格"）
- 同专场卡片价格公开: .transactionCard span.color-c31b1f → 纯数字价格
"""
import asyncio
import httpx
import json
import re
import logging
import random
from bs4 import BeautifulSoup
from db import init_db, upsert_coins_batch, upsert_coin, get_progress, save_progress, get_coin_count

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('shouxi')

BASE_URL = 'http://data.shouxi.com'

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15',
]


class ShouxiScraper:
    def __init__(self, db, batch_size=50, delay_range=(1.5, 3.0)):
        self.db = db
        self.batch_size = batch_size
        self.delay_range = delay_range
        self.client = None
        self.stats = {'scraped': 0, 'errors': 0, 'skipped': 0}

    async def setup(self):
        self.client = httpx.AsyncClient(
            timeout=30, verify=False, follow_redirects=True,
            limits=httpx.Limits(max_connections=5, max_keepalive_connections=2),
        )

    async def teardown(self):
        if self.client:
            await self.client.aclose()

    async def delay(self):
        await asyncio.sleep(random.uniform(*self.delay_range))

    async def fetch(self, url, retries=3):
        for attempt in range(retries):
            try:
                resp = await self.client.get(url, headers={
                    'User-Agent': random.choice(USER_AGENTS),
                    'Accept': 'text/html,application/xhtml+xml,*/*',
                    'Accept-Language': 'zh-CN,zh;q=0.9',
                    'Referer': BASE_URL + '/',
                })
                if resp.status_code == 200:
                    return resp.text
                if resp.status_code == 429:
                    logger.warning(f'Rate limited, sleeping 30s...')
                    await asyncio.sleep(30 + random.uniform(5, 15))
            except Exception as e:
                logger.warning(f'Fetch error ({attempt+1}/{retries}): {e}')
                await asyncio.sleep(5 * (attempt + 1))
        return None

    # ============ 核心方法1: 按专场遍历 (推荐，最高效) ============

    async def scrape_all_sessions(self):
        """爬取所有拍卖专场，每个专场包含数十到上千件拍品"""
        progress = await get_progress(self.db, 'shouxi', 'sessions')
        start_page = progress['last_page'] if progress and progress['status'] == 'running' else 1

        page = start_page
        total_sessions = 0
        while True:
            url = f'{BASE_URL}/special_list.php?p={page}'
            html = await self.fetch(url)
            if not html:
                break

            soup = BeautifulSoup(html, 'lxml')
            # 找所有专场链接
            session_links = []
            for a in soup.select('a[href*="auction_special.php"]'):
                href = a.get('href', '')
                m = re.search(r'id=(\d+)', href)
                if m:
                    sid = m.group(1)
                    name = a.get_text(strip=True)
                    if name and sid not in [s[0] for s in session_links]:
                        session_links.append((sid, name))

            if not session_links:
                logger.info(f'No sessions on page {page}, done.')
                break

            for sid, sname in session_links:
                logger.info(f'📦 Session [{sid}] {sname}')
                count = await self.scrape_session(sid, sname)
                total_sessions += 1
                self.stats['scraped'] += count
                await self.delay()

            await save_progress(self.db, 'shouxi', 'sessions', last_page=page,
                                total_count=await get_coin_count(self.db, 'shouxi'))
            logger.info(f'✅ Page {page} done. Sessions so far: {total_sessions}, '
                        f'total records: {await get_coin_count(self.db, "shouxi")}')
            page += 1
            await self.delay()

        await save_progress(self.db, 'shouxi', 'sessions', last_page=page, status='completed',
                            total_count=await get_coin_count(self.db, 'shouxi'))

    async def scrape_session(self, session_id, session_name=''):
        """爬取一个专场：收集所有 item ID + 缩略图，再批量详情"""
        count = 0
        page = 1
        all_item_ids = []

        while True:
            url = f'{BASE_URL}/auction_special.php?id={session_id}&p={page}'
            html = await self.fetch(url)
            if not html:
                break

            soup = BeautifulSoup(html, 'lxml')

            # 收集所有 item IDs (imgBox + text links)
            page_ids = set()
            items_with_name = {}

            # imgBox: 有图无名
            for box in soup.select('.imgBox a[href*="item.php"]'):
                href = box.get('href', '')
                m = re.search(r'id=(\d+)', href)
                if m:
                    iid = m.group(1)
                    page_ids.add(iid)
                    img = box.select_one('img')
                    thumb = img.get('src', '') if img else ''
                    alt = img.get('alt', '') if img else ''
                    if alt:
                        items_with_name[iid] = (alt, thumb)
                    elif iid not in items_with_name:
                        items_with_name[iid] = ('', thumb)

            # 文字链接: 有名
            for a in soup.select('a[href*="item.php"]'):
                href = a.get('href', '')
                m = re.search(r'id=(\d+)', href)
                if not m:
                    continue
                iid = m.group(1)
                page_ids.add(iid)
                text = a.get_text(strip=True)
                if text and len(text) > 3:
                    existing = items_with_name.get(iid, ('', ''))
                    if not existing[0]:
                        items_with_name[iid] = (text, existing[1])

            if not page_ids:
                break

            # 存储已有名称的项目
            batch = []
            for iid in page_ids:
                name, thumb = items_with_name.get(iid, ('', ''))
                if name:
                    grade_service, grade = self._extract_grade(name)
                    batch.append(self._make_record(
                        item_id=iid, name=name, thumbnail=thumb,
                        grade_service=grade_service, grade=grade,
                        auction_session=session_name,
                    ))
                else:
                    # 只有 ID 和缩略图的，也存入（名称后续补充）
                    batch.append(self._make_record(
                        item_id=iid, name=f'[待补充] session={session_id} lot={iid}',
                        thumbnail=thumb, auction_session=session_name,
                    ))

            if batch:
                await upsert_coins_batch(self.db, batch)
                count += len(batch)

            all_item_ids.extend(page_ids)
            logger.info(f'  page {page}: {len(page_ids)} IDs collected ({len([i for i in page_ids if items_with_name.get(i, ("",""))[0]])} with names)')

            # Pagination: check for next page link
            next_page = False
            for a in soup.select('a'):
                text = a.get_text(strip=True)
                if text in ('下一页', '»', '>', 'Next') or text == str(page + 1):
                    next_page = True
                    break
            if not next_page:
                break

            page += 1
            await self.delay()

        return count

    def parse_session_list(self, soup, session_id='', session_name=''):
        """解析专场拍品列表页 — 提取 .transactionCard 或表格行"""
        items = []

        # 方式1: transactionCard 卡片
        for card in soup.select('.transactionCard'):
            try:
                link = card.select_one('a[href*="item.php"]')
                if not link:
                    continue
                href = link.get('href', '')
                m = re.search(r'id=(\d+)', href)
                if not m:
                    continue
                item_id = m.group(1)

                # Name from .textEllipsis or alt
                name = ''
                name_el = card.select_one('.textEllipsis, p:first-of-type')
                if name_el:
                    name = name_el.get_text(strip=True)
                if not name:
                    img = card.select_one('img')
                    if img:
                        name = img.get('alt', '')
                if not name or len(name) < 2:
                    continue

                # Price from span.color-c31b1f
                price = ''
                price_currency = 'CNY'
                price_el = card.select_one('.color-c31b1f, span[class*="color"]')
                if price_el:
                    price = price_el.get_text(strip=True)
                # Currency from .mt5 text
                curr_el = card.select_one('.mt5, p:nth-of-type(2)')
                if curr_el:
                    ct = curr_el.get_text(strip=True)
                    if 'USD' in ct: price_currency = 'USD'
                    elif 'HKD' in ct: price_currency = 'HKD'
                    elif 'EUR' in ct: price_currency = 'EUR'
                    elif 'GBP' in ct: price_currency = 'GBP'

                # Thumbnail
                thumbnail = ''
                img = card.select_one('img')
                if img:
                    thumbnail = img.get('src', '') or img.get('data-src', '')
                    if thumbnail.startswith('//'):
                        thumbnail = 'http:' + thumbnail

                # Extract grade from name
                grade_service, grade = self._extract_grade(name)

                items.append(self._make_record(
                    item_id=item_id, name=name, thumbnail=thumbnail,
                    price=price, price_currency=price_currency,
                    grade_service=grade_service, grade=grade,
                    auction_session=session_name,
                ))
            except Exception as e:
                logger.debug(f'Card parse error: {e}')

        # 方式2: 表格行 (某些专场用表格展示)
        if not items:
            for row in soup.select('tr'):
                link = row.select_one('a[href*="item.php"]')
                if not link:
                    continue
                href = link.get('href', '')
                m = re.search(r'id=(\d+)', href)
                if not m:
                    continue

                item_id = m.group(1)
                name = link.get_text(strip=True)
                if not name or len(name) < 2:
                    continue

                img = row.select_one('img')
                thumbnail = ''
                if img:
                    thumbnail = img.get('src', '') or ''
                    if thumbnail.startswith('//'):
                        thumbnail = 'http:' + thumbnail

                grade_service, grade = self._extract_grade(name)

                items.append(self._make_record(
                    item_id=item_id, name=name, thumbnail=thumbnail,
                    grade_service=grade_service, grade=grade,
                    auction_session=session_name,
                ))

        # 方式3: imgBox 链接 (如拍品详情页底部的同类推荐)
        if not items:
            for box in soup.select('.imgBox a[href*="item.php"]'):
                href = box.get('href', '')
                m = re.search(r'id=(\d+)', href)
                if not m:
                    continue
                item_id = m.group(1)
                img = box.select_one('img')
                name = img.get('alt', '') if img else ''
                thumbnail = img.get('src', '') if img else ''
                if not name:
                    continue

                grade_service, grade = self._extract_grade(name)
                items.append(self._make_record(
                    item_id=item_id, name=name, thumbnail=thumbnail,
                    grade_service=grade_service, grade=grade,
                    auction_session=session_name,
                ))

        return items

    # ============ 核心方法2: 逐 ID 详情爬取 ============

    async def scrape_by_id_range(self, start_id=1, end_id=1400000):
        """遍历所有 item ID，爬取详情页"""
        progress = await get_progress(self.db, 'shouxi', 'item_by_id')
        if progress and progress['status'] == 'running' and progress['last_id']:
            start_id = int(progress['last_id']) + 1
            logger.info(f'Resuming from ID {start_id}')

        batch = []
        for current_id in range(start_id, end_id + 1):
            item = await self.scrape_item_detail(current_id)
            if item:
                batch.append(item)
                self.stats['scraped'] += 1
            else:
                self.stats['skipped'] += 1

            if len(batch) >= self.batch_size:
                await upsert_coins_batch(self.db, batch)
                count = await get_coin_count(self.db, 'shouxi')
                await save_progress(self.db, 'shouxi', 'item_by_id',
                                    last_id=str(current_id), total_count=count)
                logger.info(f'ID={current_id} | DB={count} | scraped={self.stats["scraped"]} | skip={self.stats["skipped"]}')
                batch = []

            await self.delay()

        if batch:
            await upsert_coins_batch(self.db, batch)
        count = await get_coin_count(self.db, 'shouxi')
        await save_progress(self.db, 'shouxi', 'item_by_id',
                            last_id=str(end_id), total_count=count, status='completed')
        logger.info(f'ID range complete! Total: {count}')

    async def scrape_item_detail(self, item_id):
        """爬取单条拍品详情页"""
        url = f'{BASE_URL}/item.php?id={item_id}'
        html = await self.fetch(url)
        if not html:
            return None
        try:
            return self._parse_detail_page(html, item_id)
        except Exception as e:
            logger.debug(f'Parse error item {item_id}: {e}')
            return None

    def _parse_detail_page(self, html, item_id):
        """解析拍品详情页 (实测结构)"""
        soup = BeautifulSoup(html, 'lxml')

        # Title: h2.singlePage → "Lot:1931  张作霖像民国15年壹圆 NGC MS 62"
        h2 = soup.select_one('h2.singlePage, h2')
        if not h2:
            return None
        title = h2.get_text(strip=True)
        if not title or len(title) < 4:
            return None

        # Parse lot number and name from title
        lot_number = ''
        name = title
        lot_match = re.match(r'Lot[:\s]*(\S+)\s+(.*)', title, re.I)
        if lot_match:
            lot_number = lot_match.group(1)
            name = lot_match.group(2).strip()

        # Main image: #item1_img
        main_img = ''
        img_el = soup.select_one('#item1_img')
        if img_el:
            main_img = img_el.get('src', '')

        # 分类面包屑: a[href*=item_list.php]
        category = ''
        subcategory = ''
        breadcrumbs = []
        for a in soup.select('a[href*="item_list.php"]'):
            text = a.get_text(strip=True)
            if text and text not in breadcrumbs:
                breadcrumbs.append(text)
        if breadcrumbs:
            category = breadcrumbs[0] if breadcrumbs else ''
            subcategory = ' > '.join(breadcrumbs[1:]) if len(breadcrumbs) > 1 else ''

        # 右侧信息: .rightSide
        right_text = ''
        right = soup.select_one('.rightSide')
        if right:
            right_text = right.get_text(separator='|', strip=True)

        # 品相/评级
        grade_service, grade = self._extract_grade(name)
        if not grade and right_text:
            gm = re.search(r'品相[：:]\s*(.+?)(?:\||$)', right_text)
            if gm:
                g = gm.group(1).strip()
                grade_service, grade = self._extract_grade(g)
                if not grade_service:
                    grade = g

        # 拍卖公司
        auction_house = ''
        hm = re.search(r'拍卖公司[：:]\s*(.+?)(?:\||$)', right_text)
        if hm:
            auction_house = hm.group(1).strip().strip('|')
        if not auction_house:
            company_link = soup.select_one('a[href*="company_auction.php"]')
            if company_link:
                auction_house = company_link.get_text(strip=True)

        # 拍卖状态
        status = ''
        sm = re.search(r'拍卖状态[：:]\s*(.+?)(?:\||$)', right_text)
        if sm:
            s = sm.group(1).strip()
            if '成交' in s: status = '成交'
            elif '流拍' in s: status = '流拍'

        # 价格 (需登录, 但有时公开可见)
        price = ''
        price_currency = 'CNY'
        pm = re.search(r'成交价格[：:]\s*([\d,\.]+)', right_text)
        if pm:
            price = pm.group(1)

        # Estimate from p.mt15
        estimate_low = ''
        estimate_high = ''
        for p in soup.select('p.mt15'):
            text = p.get_text(strip=True)
            em = re.search(r'估价[：:]\s*(\w+)\s*([\d,]+)\s*-\s*([\d,]+)', text)
            if em:
                curr = em.group(1)
                estimate_low = em.group(2)
                estimate_high = em.group(3)
                if 'USD' in curr: price_currency = 'USD'
                elif 'HKD' in curr: price_currency = 'HKD'
                elif 'EUR' in curr: price_currency = 'EUR'

        # 专场
        auction_session = ''
        for p in soup.select('p.mt15'):
            text = p.get_text(strip=True)
            if '专场' in text:
                auction_session = text.replace('拍品专场：', '').replace('拍品专场:', '').strip()

        # 日期
        auction_date = ''
        for p in soup.select('p.mt15'):
            text = p.get_text(strip=True)
            dm = re.search(r'(\d{4}-\d{2}-\d{2})', text)
            if dm:
                auction_date = dm.group(1)
                break

        # Also collect same-session items from transactionCards (bonus data!)
        bonus_items = self.parse_session_list(soup, session_name=auction_session)

        return self._make_record(
            item_id=str(item_id), name=name, thumbnail=main_img,
            category=category, subcategory=subcategory,
            grade_service=grade_service, grade=grade,
            auction_house=auction_house, auction_session=auction_session,
            auction_date=auction_date, lot_number=lot_number,
            estimate_low=estimate_low, estimate_high=estimate_high,
            price=price, price_currency=price_currency, status=status,
            image_urls=[main_img] if main_img else [],
        )

    # ============ 核心方法3: 按分类搜索 ============

    async def scrape_by_category(self, c_cid='1'):
        """按分类爬取 (c_cid=1: 机制银币, c_cid=3: 古钱等)"""
        page = 1
        while True:
            url = f'{BASE_URL}/item_list.php?a=s&c_cid={c_cid}&per_page=100&p={page}'
            html = await self.fetch(url)
            if not html:
                break

            soup = BeautifulSoup(html, 'lxml')
            items = self.parse_session_list(soup)
            if not items:
                break

            await upsert_coins_batch(self.db, items)
            count = await get_coin_count(self.db, 'shouxi')
            logger.info(f'Category {c_cid} page {page}: {len(items)} items, total={count}')

            if not soup.select_one('a:contains("下一页"), a.next'):
                break
            page += 1
            await self.delay()

    # ============ Helper methods ============

    def _extract_grade(self, text):
        """从文本中提取评级信息"""
        for svc in ['PCGS', 'NGC', 'GBCA', 'CNCS']:
            if svc in text.upper():
                # Match patterns like "PCGS MS 62", "NGC AU 58", "PCGS XF45"
                m = re.search(rf'{svc}\s*([\w]+[\s\-]*\d+\+?)', text, re.I)
                if m:
                    return svc, m.group(1).strip()
                return svc, ''
        # Chinese grades
        for cg in ['极美品', '上美品', '美品', '近未流通', '完未流通', '极美', '上美']:
            if cg in text:
                return '', cg
        return '', ''

    def _make_record(self, item_id='', name='', thumbnail='', category='',
                     subcategory='', grade_service='', grade='',
                     auction_house='', auction_session='', auction_date='',
                     lot_number='', estimate_low='', estimate_high='',
                     price='', price_currency='CNY', status='',
                     image_urls=None):
        return {
            'source': 'shouxi',
            'source_id': str(item_id),
            'name': name,
            'name_en': '',
            'dynasty': '',
            'category': category,
            'subcategory': subcategory,
            'variety': '',
            'material': '',
            'weight': '',
            'diameter': '',
            'grade_service': grade_service,
            'grade': grade,
            'certification_no': '',
            'description': '',
            'image_urls': image_urls or ([thumbnail] if thumbnail else []),
            'thumbnail_url': thumbnail,
            'auction_house': auction_house,
            'auction_session': auction_session,
            'auction_date': auction_date,
            'lot_number': lot_number,
            'estimate_low': estimate_low,
            'estimate_high': estimate_high,
            'price': price,
            'price_currency': price_currency,
            'status': status,
            'source_url': f'{BASE_URL}/item.php?id={item_id}',
            'raw_data': '',
        }


async def main():
    import argparse
    parser = argparse.ArgumentParser(description='首席收藏全量爬虫')
    parser.add_argument('--mode', choices=['session', 'id', 'category'], default='session')
    parser.add_argument('--start', type=int, default=1)
    parser.add_argument('--end', type=int, default=1400000)
    parser.add_argument('--cid', default='1', help='分类ID')
    parser.add_argument('--batch', type=int, default=50)
    args = parser.parse_args()

    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    db = await init_db()
    scraper = ShouxiScraper(db, batch_size=args.batch)
    await scraper.setup()

    try:
        if args.mode == 'session':
            await scraper.scrape_all_sessions()
        elif args.mode == 'id':
            await scraper.scrape_by_id_range(args.start, args.end)
        elif args.mode == 'category':
            await scraper.scrape_by_category(args.cid)
    except KeyboardInterrupt:
        logger.info('Interrupted! Progress saved.')
    finally:
        await scraper.teardown()
        count = await get_coin_count(db, 'shouxi')
        logger.info(f'Final shouxi count: {count}')
        await db.close()


if __name__ == '__main__':
    asyncio.run(main())
