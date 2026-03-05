"""
Hongxi (Chang Foundation / Taiwan) Coin Catalog Data Collector
The Chang Foundation Museum published famous catalogs of Chinese modern coins.
Since there's no dedicated website, this scraper collects coins with Hongxi provenance
from multiple auction databases (Shouxi, Heritage, SBP, etc.) and known catalog data.
"""
import asyncio
import httpx
import json
import re
import logging
import random
from bs4 import BeautifulSoup
from db import upsert_coins_batch, get_progress, save_progress, get_coin_count

logger = logging.getLogger('hongxi')

# Shouxi search for Hongxi provenance
SHOUXI_SEARCH = 'http://data.shouxi.com/item_list.php'

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
]

# Known Hongxi catalog coins (from public records)
# These are the most famous pieces from the Chang Foundation collection
KNOWN_HONGXI_COINS = [
    {'name': '奉天一两金币', 'dynasty': '清代', 'category': '机制币', 'description': '光绪二十九年奉天省造一两金币 鸿禧美术馆旧藏 中国近代钱币之王'},
    {'name': '庚子京局制造光绪元宝七钱二分', 'dynasty': '清代', 'category': '机制币', 'description': '庚子京局制造光绪元宝库平七钱二分银币 鸿禧美术馆旧藏'},
    {'name': '光绪丁未一两银币', 'dynasty': '清代', 'category': '机制币', 'description': '光绪丁未年造大清金币一两 鸿禧美术馆旧藏 张璜先生旧藏'},
    {'name': '宣统三年大清银币长须龙', 'dynasty': '清代', 'category': '机制币', 'description': '宣统三年大清银币壹圆长须龙配普通龙版 鸿禧美术馆旧藏'},
    {'name': '民国十八年孙中山像壹圆金质样币', 'dynasty': '民国', 'category': '机制币', 'description': '民国十八年孙中山像背嘉禾壹圆金质样币 鸿禧美术馆旧藏'},
    {'name': '袁世凯像共和纪念壹圆签字版', 'dynasty': '民国', 'category': '机制币', 'description': '袁世凯像共和纪念币壹圆签字版 L.GIORGI签字 鸿禧美术馆旧藏'},
    {'name': '张作霖像大元帅纪念币', 'dynasty': '民国', 'category': '机制币', 'description': '民国十七年张作霖像背龙凤大元帅纪念币壹圆 鸿禧美术馆旧藏'},
]


class HongxiScraper:
    def __init__(self, db, delay_range=(2.0, 4.0)):
        self.db = db
        self.delay_range = delay_range
        self.client = None

    async def setup(self):
        self.client = httpx.AsyncClient(
            timeout=30,
            verify=False,  # shouxi.com SSL expired
            follow_redirects=True,
            limits=httpx.Limits(max_connections=3, max_keepalive_connections=1),
        )

    async def teardown(self):
        if self.client:
            await self.client.aclose()

    async def delay(self):
        await asyncio.sleep(random.uniform(*self.delay_range))

    def _headers(self):
        return {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'zh-CN,zh;q=0.9',
        }

    async def search_shouxi(self, keyword, page=1):
        """Search Shouxi.com for coins with Hongxi provenance"""
        params = {
            'a': 's',
            'k': keyword,
            'per_page': '',
            'cid': '0',
            'list_type': '0',
        }
        if page > 1:
            params['p'] = str(page)

        try:
            resp = await self.client.get(SHOUXI_SEARCH, params=params, headers=self._headers())
            if resp.status_code == 200:
                return resp.text
        except Exception as e:
            logger.warning(f'Shouxi search error: {e}')
        return None

    def parse_shouxi_results(self, html):
        """Parse Shouxi search results for Hongxi items"""
        if not html:
            return []

        soup = BeautifulSoup(html, 'html.parser')
        items = []

        for link in soup.select('a[href*="item.php"]'):
            href = link.get('href', '')
            text = link.get_text(strip=True)

            if not text or len(text) < 3:
                continue

            item_id = ''
            m = re.search(r'id=(\d+)', href)
            if m:
                item_id = m.group(1)
            else:
                continue

            # Find price in sibling/parent elements
            price = ''
            parent = link.find_parent('tr') or link.find_parent('div')
            if parent:
                price_el = parent.select_one('.color-c31b1f, .price, [style*="color"]')
                if price_el:
                    price_text = price_el.get_text(strip=True)
                    m = re.search(r'([\d,]+)', price_text)
                    if m:
                        price = m.group(1).replace(',', '')

            # Find image
            thumbnail = ''
            img = None
            if parent:
                img = parent.select_one('img')
            if img:
                thumbnail = img.get('src', '') or img.get('data-src', '')

            items.append({
                'source': 'hongxi',
                'source_id': f'shouxi_{item_id}',
                'name': text[:200],
                'name_en': '',
                'dynasty': '',
                'category': '机制币',
                'subcategory': '',
                'variety': '',
                'material': '',
                'weight': '',
                'diameter': '',
                'grade_service': '',
                'grade': '',
                'certification_no': '',
                'description': f'鸿禧美术馆相关 | {text}',
                'image_urls': [thumbnail] if thumbnail else [],
                'thumbnail_url': thumbnail,
                'auction_house': '',
                'auction_session': '',
                'auction_date': '',
                'lot_number': '',
                'estimate_low': '',
                'estimate_high': '',
                'price': price,
                'price_currency': '',
                'status': 'sold' if price else '',
                'source_url': f'http://data.shouxi.com/{href}' if not href.startswith('http') else href,
                'raw_data': '',
            })

        return items

    async def search_sbp_archive(self, keyword):
        """Search SBP archive for Hongxi provenance coins"""
        try:
            query = f'!0!0!200!1!!!list!{keyword}!!!!!!!!Titles & Descriptions'
            resp = await self.client.get(
                'https://archive.stacksbowers.com/Home/getSearch',
                params={'query': query},
                headers=self._headers(),
            )
            if resp.status_code == 200:
                data = resp.json()
                packages = data.get('Packages', [])
                items = []
                for pkg in packages:
                    title = pkg.get('TitleSort', '')
                    chinese_title = pkg.get('ChineseTitle', '')
                    name = chinese_title or title
                    item_id = str(pkg.get('Id', ''))
                    if not item_id:
                        continue

                    items.append({
                        'source': 'hongxi',
                        'source_id': f'sbp_{item_id}',
                        'name': name[:200],
                        'name_en': title[:200],
                        'dynasty': '',
                        'category': '机制币',
                        'subcategory': '',
                        'variety': '',
                        'material': '',
                        'weight': '',
                        'diameter': '',
                        'grade_service': '',
                        'grade': '',
                        'certification_no': '',
                        'description': f'鸿禧美术馆相关 | {title}',
                        'image_urls': [pkg.get('ZoomImageURL', '')] if pkg.get('ZoomImageURL') else [],
                        'thumbnail_url': pkg.get('ImageURL', ''),
                        'auction_house': "Stack's Bowers",
                        'auction_session': pkg.get('AuctionName', ''),
                        'auction_date': (pkg.get('AuctionEndDate', '') or '').split(' ')[0],
                        'lot_number': pkg.get('LotNumber', ''),
                        'estimate_low': '',
                        'estimate_high': '',
                        'price': str(pkg.get('SoldPrice', '')),
                        'price_currency': 'USD',
                        'status': pkg.get('Status', ''),
                        'source_url': pkg.get('detailPage', ''),
                        'raw_data': pkg,
                    })
                return items
        except Exception as e:
            logger.warning(f'SBP search error: {e}')
        return []

    async def save_known_coins(self):
        """Save known Hongxi catalog coins"""
        coins = []
        for i, coin_data in enumerate(KNOWN_HONGXI_COINS):
            coins.append({
                'source': 'hongxi',
                'source_id': f'catalog_{i+1}',
                'name': coin_data['name'],
                'name_en': '',
                'dynasty': coin_data.get('dynasty', ''),
                'category': coin_data.get('category', '机制币'),
                'subcategory': '',
                'variety': '',
                'material': '',
                'weight': '',
                'diameter': '',
                'grade_service': '',
                'grade': '',
                'certification_no': '',
                'description': coin_data.get('description', ''),
                'image_urls': [],
                'thumbnail_url': '',
                'auction_house': '鸿禧美术馆',
                'auction_session': '《中国近代金、银币选集》',
                'auction_date': '',
                'lot_number': '',
                'estimate_low': '',
                'estimate_high': '',
                'price': '',
                'price_currency': '',
                'status': '',
                'source_url': '',
                'raw_data': coin_data,
            })

        if coins:
            await upsert_coins_batch(self.db, coins)
            logger.info(f'Saved {len(coins)} known Hongxi catalog coins')

    async def scrape_all(self):
        """Collect all Hongxi-related data"""
        logger.info('=== Hongxi (Chang Foundation) Data Collector Started ===')

        # Phase 1: Save known catalog coins
        await self.save_known_coins()

        # Phase 2: Search Shouxi for Hongxi provenance
        search_terms = ['鸿禧', '鸿禧美术馆', 'Chang Foundation', '张秀清']
        for term in search_terms:
            logger.info(f'Searching Shouxi for: {term}')
            page = 1
            while page <= 20:
                html = await self.search_shouxi(term, page)
                items = self.parse_shouxi_results(html)
                if not items:
                    break
                await upsert_coins_batch(self.db, items)
                total = await get_coin_count(self.db, 'hongxi')
                logger.info(f'  Shouxi [{term}] page {page}: {len(items)} items, total={total}')
                page += 1
                await self.delay()

        # Phase 3: Search SBP archive
        for term in ['Chang Foundation', 'Hung Hsi', 'Hong Xi']:
            logger.info(f'Searching SBP for: {term}')
            items = await self.search_sbp_archive(term)
            if items:
                await upsert_coins_batch(self.db, items)
                total = await get_coin_count(self.db, 'hongxi')
                logger.info(f'  SBP [{term}]: {len(items)} items, total={total}')
            await self.delay()

        total = await get_coin_count(self.db, 'hongxi')
        logger.info(f'=== Hongxi complete! Total: {total} records ===')


async def main():
    from db import init_db
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    db = await init_db()
    scraper = HongxiScraper(db)
    await scraper.setup()
    try:
        await scraper.scrape_all()
    except KeyboardInterrupt:
        logger.info('Interrupted! Progress saved.')
    finally:
        await scraper.teardown()
        total = await get_coin_count(db, 'hongxi')
        logger.info(f'Final Hongxi count: {total}')
        await db.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
    asyncio.run(main())
