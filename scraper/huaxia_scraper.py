"""
华夏古泉 (hxguquan.com) 全量爬虫
REST API + 网页回退，~2.2万拍品
"""
import asyncio
import httpx
import json
import re
import logging
import random
from bs4 import BeautifulSoup
from db import init_db, upsert_coins_batch, get_progress, save_progress, get_coin_count

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('huaxia')

# API base (Solr-backed)
API_BASE = 'https://qgrading.huaxiaguquan.com'
# Web base
WEB_BASE = 'https://wwwn.hxguquan.com'
# Mobile app
APP_BASE = 'https://app.huaxiaguquan.com'
# Image CDN
IMG_CDN = 'https://imghz.huaxiaguquan.com'

USER_AGENTS = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
]

# 华夏分类 gtype
GTYPES = {
    '古钱': ['先秦', '秦汉', '三国两晋', '隋唐五代', '宋辽金', '元明清', '花钱'],
    '机制币': ['金币', '银币', '铜元', '镍币铝币'],
    '纸币': ['古代纸币', '近代纸币', '当代纸币'],
    '银锭': ['银锭'],
    '杂项': ['杂项'],
}


class HuaxiaScraper:
    def __init__(self, db, batch_size=50, delay_range=(2.0, 4.0)):
        self.db = db
        self.batch_size = batch_size
        self.delay_range = delay_range
        self.client = None
        self.stats = {'scraped': 0, 'errors': 0, 'skipped': 0}

    async def setup(self):
        self.client = httpx.AsyncClient(
            timeout=30,
            verify=True,
            follow_redirects=True,
            limits=httpx.Limits(max_connections=3, max_keepalive_connections=1),
        )

    async def teardown(self):
        if self.client:
            await self.client.aclose()

    async def delay(self):
        await asyncio.sleep(random.uniform(*self.delay_range))

    def get_headers(self, referer=None):
        return {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'application/json, text/html, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Referer': referer or APP_BASE,
        }

    async def fetch_json(self, url, params=None, retries=3):
        """Fetch JSON from API"""
        for attempt in range(retries):
            try:
                resp = await self.client.get(url, params=params, headers=self.get_headers())
                if resp.status_code == 200:
                    return resp.json()
                logger.warning(f'API {resp.status_code}: {url}')
                if resp.status_code == 429:
                    await asyncio.sleep(30)
            except Exception as e:
                logger.warning(f'API error (attempt {attempt+1}): {e}')
                await asyncio.sleep(5 * (attempt + 1))
        return None

    async def fetch_html(self, url, retries=3):
        """Fetch HTML page"""
        for attempt in range(retries):
            try:
                resp = await self.client.get(url, headers=self.get_headers())
                if resp.status_code == 200:
                    return resp.text
            except Exception as e:
                logger.warning(f'Fetch error (attempt {attempt+1}): {e}')
                await asyncio.sleep(5 * (attempt + 1))
        return None

    # ============ API 方式 (无需登录的公开接口) ============

    async def try_api_search(self, gtype='', keyword='', page=1, page_size=50):
        """尝试使用 API 搜索"""
        params = {
            'gtype': gtype,
            'gname': keyword,
            'pageNum': page,
            'pageSize': page_size,
        }
        data = await self.fetch_json(f'{API_BASE}/priceSearch/solrQueryVif', params)
        return data

    async def get_categories_api(self):
        """通过 API 获取一级分类"""
        data = await self.fetch_json(f'{API_BASE}/priceSearch/solrQueryLevel1Name')
        return data

    # ============ 网页爬取 (主要方法) ============

    async def scrape_auction_list(self, status='sold'):
        """爬取拍卖列表页 (已成交/在拍)"""
        progress = await get_progress(self.db, 'huaxia', f'auction_{status}')
        start_page = 1
        if progress and progress['status'] == 'running':
            start_page = progress['last_page'] or 1

        page = start_page
        while True:
            # 尝试旧版页面
            url = f'{WEB_BASE}/auction/auction_list.php?status={status}&page={page}'
            html = await self.fetch_html(url)

            if not html:
                # 尝试另一个 URL 格式
                url = f'https://wwwh.huaxiaguquan.com/show/view.jsp?STYPE={status}&p={page}'
                html = await self.fetch_html(url)

            if not html:
                logger.info(f'No more pages at {page}')
                break

            soup = BeautifulSoup(html, 'lxml')
            items = self.parse_auction_list(soup, status)

            if not items:
                # Try alternative parsing
                items = self.parse_gallery_page(soup)

            if not items:
                logger.info(f'No items found on page {page}')
                break

            await upsert_coins_batch(self.db, items)
            count = await get_coin_count(self.db, 'huaxia')
            await save_progress(self.db, 'huaxia', f'auction_{status}',
                                last_page=page, total_count=count)
            logger.info(f'Auction [{status}] page {page}: {len(items)} items, total={count}')

            page += 1
            await self.delay()

        count = await get_coin_count(self.db, 'huaxia')
        await save_progress(self.db, 'huaxia', f'auction_{status}',
                            last_page=page, total_count=count, status='completed')

    def parse_auction_list(self, soup, status=''):
        """解析拍品列表"""
        items = []
        # 尝试多种选择器
        for item_el in soup.select('.auction-item, .item, .lot-item, .goods-item, li.clearfix, .list-group-item'):
            try:
                link = item_el.select_one('a[href]')
                if not link:
                    continue

                href = link.get('href', '')
                # 提取 ID
                item_id = ''
                m = re.search(r'[?&]id=(\d+)', href) or re.search(r'/(\d+)\.', href) or re.search(r'gid=(\d+)', href)
                if m:
                    item_id = m.group(1)
                else:
                    continue

                name = link.get_text(strip=True)
                if not name or len(name) < 2:
                    title_el = item_el.select_one('.title, .name, h3, h4')
                    if title_el:
                        name = title_el.get_text(strip=True)

                if not name:
                    continue

                # 图片
                thumbnail = ''
                img = item_el.select_one('img')
                if img:
                    thumbnail = img.get('src', '') or img.get('data-src', '') or img.get('data-original', '')
                    if thumbnail and not thumbnail.startswith('http'):
                        thumbnail = IMG_CDN + thumbnail

                # 价格
                price = ''
                price_el = item_el.select_one('.price, .gprice, .amount, .money')
                if price_el:
                    price = price_el.get_text(strip=True)

                # 状态
                item_status = status or ''
                status_el = item_el.select_one('.status, .state, .badge')
                if status_el:
                    st = status_el.get_text(strip=True)
                    if '成交' in st:
                        item_status = '成交'
                    elif '流拍' in st:
                        item_status = '流拍'
                    elif '在拍' in st or '进行' in st:
                        item_status = '在拍'

                # 分类猜测
                category = ''
                dynasty = ''
                for cat_name, sub_cats in GTYPES.items():
                    for sub in sub_cats:
                        if sub in name:
                            category = cat_name
                            dynasty = sub
                            break

                # 评级
                grade_service = ''
                grade = ''
                for svc in ['PCGS', 'NGC', 'GBCA', 'CNCS', '华夏评级']:
                    if svc.upper() in name.upper():
                        grade_service = svc
                        gm = re.search(rf'{svc}\s*([\w]+[\s\-]?\d+)', name, re.I)
                        if gm:
                            grade = gm.group(1).strip()
                        break

                items.append({
                    'source': 'huaxia',
                    'source_id': item_id,
                    'name': name,
                    'name_en': '',
                    'dynasty': dynasty,
                    'category': category,
                    'subcategory': '',
                    'variety': '',
                    'material': '',
                    'weight': '',
                    'diameter': '',
                    'grade_service': grade_service,
                    'grade': grade,
                    'certification_no': '',
                    'description': '',
                    'image_urls': [thumbnail] if thumbnail else [],
                    'thumbnail_url': thumbnail,
                    'auction_house': '华夏古泉',
                    'auction_session': '',
                    'auction_date': '',
                    'lot_number': '',
                    'estimate_low': '',
                    'estimate_high': '',
                    'price': price,
                    'price_currency': 'CNY',
                    'status': item_status,
                    'source_url': href if href.startswith('http') else WEB_BASE + href,
                    'raw_data': '',
                })
            except Exception as e:
                logger.debug(f'Parse error: {e}')
                continue

        return items

    def parse_gallery_page(self, soup):
        """解析 gallery/展览页面"""
        items = []
        for item in soup.select('.gallery-item, .show-item, .pro-item, div[onclick], a.thumbnail'):
            try:
                # Extract from onclick or href
                onclick = item.get('onclick', '')
                href = item.get('href', '') if item.name == 'a' else ''

                item_id = ''
                m = re.search(r'(\d{4,})', onclick or href)
                if m:
                    item_id = m.group(1)

                link = item.select_one('a[href]') if not href else item
                if link:
                    href = link.get('href', '')
                    if not item_id:
                        m = re.search(r'(\d{4,})', href)
                        if m:
                            item_id = m.group(1)

                if not item_id:
                    continue

                name = item.get_text(strip=True)[:200]  # Truncate
                img = item.select_one('img')
                thumbnail = ''
                if img:
                    thumbnail = img.get('src', '') or img.get('data-src', '')

                if name and len(name) >= 2:
                    items.append({
                        'source': 'huaxia',
                        'source_id': item_id,
                        'name': name,
                        'name_en': '',
                        'dynasty': '',
                        'category': '',
                        'subcategory': '',
                        'variety': '',
                        'material': '',
                        'weight': '',
                        'diameter': '',
                        'grade_service': '',
                        'grade': '',
                        'certification_no': '',
                        'description': '',
                        'image_urls': [thumbnail] if thumbnail else [],
                        'thumbnail_url': thumbnail,
                        'auction_house': '华夏古泉',
                        'auction_session': '',
                        'auction_date': '',
                        'lot_number': '',
                        'estimate_low': '',
                        'estimate_high': '',
                        'price': '',
                        'price_currency': 'CNY',
                        'status': '',
                        'source_url': href if href.startswith('http') else WEB_BASE + '/' + href,
                        'raw_data': '',
                    })
            except Exception as e:
                logger.debug(f'Gallery parse error: {e}')
                continue

        return items

    # ============ Mobile API 爬取 ============

    async def scrape_mobile_api(self, gtype='古钱'):
        """通过移动端 API 爬取"""
        progress = await get_progress(self.db, 'huaxia', f'mobile_{gtype}')
        start_page = 1
        if progress and progress['status'] == 'running':
            start_page = progress['last_page'] or 1

        page = start_page
        page_size = 50

        while True:
            # 尝试多种 API 端点
            data = await self.try_api_search(gtype=gtype, page=page, page_size=page_size)

            if not data:
                # Try search endpoint
                url = f'{APP_BASE}/search-list-new.html?stype=sold&gtype={gtype}&page={page}'
                html = await self.fetch_html(url)
                if html:
                    soup = BeautifulSoup(html, 'lxml')
                    items = self.parse_auction_list(soup, 'sold')
                    if items:
                        await upsert_coins_batch(self.db, items)
                        count = await get_coin_count(self.db, 'huaxia')
                        logger.info(f'Mobile [{gtype}] page {page}: {len(items)} items')
                        page += 1
                        await self.delay()
                        continue
                break

            # Parse API response
            if isinstance(data, dict):
                items_data = data.get('data', data.get('rows', data.get('list', [])))
                if isinstance(items_data, dict):
                    items_data = items_data.get('list', items_data.get('rows', []))
            else:
                items_data = data

            if not items_data:
                break

            coins = []
            for item in items_data:
                if not isinstance(item, dict):
                    continue
                coin = self.parse_api_item(item, gtype)
                if coin:
                    coins.append(coin)

            if coins:
                await upsert_coins_batch(self.db, coins)
                count = await get_coin_count(self.db, 'huaxia')
                await save_progress(self.db, 'huaxia', f'mobile_{gtype}',
                                    last_page=page, total_count=count)
                logger.info(f'API [{gtype}] page {page}: {len(coins)} items, total={count}')
                self.stats['scraped'] += len(coins)
            else:
                break

            page += 1
            await self.delay()

        count = await get_coin_count(self.db, 'huaxia')
        await save_progress(self.db, 'huaxia', f'mobile_{gtype}',
                            last_page=page, total_count=count, status='completed')

    def parse_api_item(self, item, category=''):
        """解析 API 返回的单条数据"""
        item_id = str(item.get('gid', '') or item.get('id', '') or item.get('itemId', ''))
        if not item_id:
            return None

        name = item.get('gname', '') or item.get('itemname', '') or item.get('name', '') or item.get('title', '')
        if not name:
            return None

        price = str(item.get('gprice', '') or item.get('itemcprice', '') or item.get('price', ''))
        thumbnail = item.get('img', '') or item.get('image', '') or item.get('pic', '')
        if thumbnail and not thumbnail.startswith('http'):
            thumbnail = IMG_CDN + '/' + thumbnail.lstrip('/')

        grade_service = ''
        grade = ''
        for svc in ['PCGS', 'NGC', 'GBCA', 'CNCS']:
            if svc in name.upper():
                grade_service = svc
                m = re.search(rf'{svc}\s*([\w]+[\s\-]?\d+)', name, re.I)
                if m:
                    grade = m.group(1)
                break

        return {
            'source': 'huaxia',
            'source_id': item_id,
            'name': name,
            'name_en': '',
            'dynasty': '',
            'category': category,
            'subcategory': item.get('pgname', '') or item.get('groupname', ''),
            'variety': '',
            'material': '',
            'weight': '',
            'diameter': '',
            'grade_service': grade_service,
            'grade': grade,
            'certification_no': '',
            'description': item.get('gcontent', '') or item.get('content', ''),
            'image_urls': [thumbnail] if thumbnail else [],
            'thumbnail_url': thumbnail,
            'auction_house': '华夏古泉',
            'auction_session': item.get('groupname', ''),
            'auction_date': item.get('dealTime', '') or item.get('gdate', ''),
            'lot_number': item.get('itemcode', ''),
            'estimate_low': '',
            'estimate_high': '',
            'price': price,
            'price_currency': 'CNY',
            'status': '成交' if price and float(re.sub(r'[^\d.]', '', price) or '0') > 0 else '',
            'source_url': f'{WEB_BASE}/auction/item.php?id={item_id}',
            'raw_data': item,
        }

    # ============ 全量爬取入口 ============

    async def scrape_all(self):
        """全量爬取"""
        # 1. 先尝试 API
        logger.info('=== Phase 1: Trying API endpoints ===')
        categories_data = await self.get_categories_api()
        if categories_data:
            logger.info(f'API available! Categories: {categories_data}')

        # 2. 通过各分类爬取
        logger.info('=== Phase 2: Scraping by category via API ===')
        for gtype in ['古钱', '机制币', '银锭', '纸币', '花钱']:
            logger.info(f'--- Category: {gtype} ---')
            await self.scrape_mobile_api(gtype)

        # 3. 网页拍卖列表
        logger.info('=== Phase 3: Web auction lists ===')
        await self.scrape_auction_list('sold')
        await self.scrape_auction_list('auctioning')

        count = await get_coin_count(self.db, 'huaxia')
        logger.info(f'=== Huaxia complete! Total: {count} records ===')


async def main():
    import argparse
    parser = argparse.ArgumentParser(description='华夏古泉全量爬虫')
    parser.add_argument('--mode', choices=['all', 'api', 'web'], default='all',
                        help='爬取模式: all=全部, api=仅API, web=仅网页')
    parser.add_argument('--gtype', default='', help='指定分类 (如: 古钱, 机制币)')
    parser.add_argument('--batch', type=int, default=50, help='批量大小')
    args = parser.parse_args()

    db = await init_db()
    scraper = HuaxiaScraper(db, batch_size=args.batch)
    await scraper.setup()

    try:
        if args.mode == 'all':
            await scraper.scrape_all()
        elif args.mode == 'api':
            gtype = args.gtype or '古钱'
            await scraper.scrape_mobile_api(gtype)
        elif args.mode == 'web':
            await scraper.scrape_auction_list('sold')
    except KeyboardInterrupt:
        logger.info('Interrupted! Progress saved.')
    finally:
        await scraper.teardown()
        count = await get_coin_count(db, 'huaxia')
        logger.info(f'Final huaxia count: {count}')
        await db.close()


if __name__ == '__main__':
    asyncio.run(main())
