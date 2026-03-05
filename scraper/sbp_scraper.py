"""
Stack's Bowers and Ponterio (SBP) Archive Scraper
Uses the archive.stacksbowers.com API to scrape Chinese coin auction records.
~119,000+ Chinese coin lots across all China-related categories.
"""
import asyncio
import httpx
import json
import re
import logging
import random
from db import upsert_coins_batch, get_progress, save_progress, get_coin_count

logger = logging.getLogger('sbp')

ARCHIVE_BASE = 'https://archive.stacksbowers.com'

# All China-related category IDs from SBP archive
CHINA_CATEGORIES = [
    'CHINA',                    # 78,065
    'CHINA--REPUBLIC',          # 8,245
    'CHINA--PEOPLE\'S REPUBLIC',# 5,290
    'CHINA--EMPIRE',            # 1,056
    'CHINA--PROVINCIAL BANKS',  # 4,611
    'CHINA--FOREIGN BANKS',     # 2,218
    'CHINA--COMMUNIST BANKS',   # 1,854
    'CHINA--PUPPET BANKS',      # 1,550
    'CHINA--TAIWAN',            # 611
    'CHINA--TIBET',             # 385
    'CHINA--MILITARY',          # 592
    'CHINA--MISCELLANEOUS',     # 2,386
    'CHINA--PRIVATE ISSUE',     # 240
    'HONG KONG (SAR)',          # 10,281
    'MACAU (SAR)',              # 1,536
]

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
]


class SBPScraper:
    def __init__(self, db, page_size=200, delay_range=(1.5, 3.0)):
        self.db = db
        self.page_size = page_size
        self.delay_range = delay_range
        self.client = None

    async def setup(self):
        self.client = httpx.AsyncClient(
            timeout=30,
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
            'Accept': 'application/json',
            'Referer': ARCHIVE_BASE,
        }

    def _build_query(self, category='', page=1, query_text='', query_id='', total=0, total_pages=0):
        """Build the SBP archive query string.
        21 fields separated by !:
        LastQueryID!Total!TotalPages!PageSize!Page!Sort!View!Query!ElapsedMs!Type!Category!
        Auction!Session!Status!Strike!CoinGrade!CurrencyGrade!GradingService!CoinProperties!
        CurrencyDenomination!SearchField
        """
        parts = [
            query_id,     # 0: LastQueryID
            str(total),   # 1: Total
            str(total_pages),  # 2: TotalPages
            str(self.page_size),  # 3: PageSize
            str(page),    # 4: Page
            '',           # 5: Sort
            'list',       # 6: CurrentView
            query_text,   # 7: Query (search text)
            '0',          # 8: ElapsedMilliseconds
            '',           # 9: Type
            category,     # 10: Category
            '',           # 11: Auction
            '',           # 12: Session
            '',           # 13: Status
            '',           # 14: Strike
            '',           # 15: CoinGrade
            '',           # 16: CurrencyGrade
            '',           # 17: GradingService
            '',           # 18: CoinProperties
            '',           # 19: CurrencyDenomination
            'Titles & Descriptions',  # 20: SearchField
        ]
        return '!'.join(parts)

    async def create_search_session(self, category='', query_text='', retries=3):
        """Create a search session via POST saveQuery, returns query ID"""
        query = self._build_query(category=category, query_text=query_text)
        for attempt in range(retries):
            try:
                resp = await self.client.post(
                    f'{ARCHIVE_BASE}/Home/saveQuery',
                    json={'query': query, 'ip': ''},
                    headers={**self._headers(), 'Content-Type': 'application/json'},
                )
                if resp.status_code == 200:
                    return resp.text.strip().strip('"')
                logger.warning(f'saveQuery {resp.status_code} (attempt {attempt+1})')
            except Exception as e:
                logger.warning(f'saveQuery error (attempt {attempt+1}): {e}')
                await asyncio.sleep(5 * (attempt + 1))
        return None

    async def search(self, category='', page=1, query_text='', query_id='', total=0, total_pages=0, retries=3):
        """Search SBP archive API using a query session"""
        query = self._build_query(category, page, query_text, query_id, total, total_pages)
        for attempt in range(retries):
            try:
                resp = await self.client.get(
                    f'{ARCHIVE_BASE}/Home/getSearch',
                    params={'query': query},
                    headers=self._headers(),
                )
                if resp.status_code == 200:
                    return resp.json()
                logger.warning(f'SBP API {resp.status_code} (attempt {attempt+1})')
                if resp.status_code == 429:
                    await asyncio.sleep(30)
            except Exception as e:
                logger.warning(f'SBP error (attempt {attempt+1}): {e}')
                await asyncio.sleep(5 * (attempt + 1))
        return None

    def parse_item(self, item, category=''):
        """Parse SBP archive item into coin record"""
        item_id = str(item.get('Id', ''))
        if not item_id:
            return None

        title = item.get('TitleSort', '')
        chinese_title = item.get('ChineseTitle', '')
        name = chinese_title if chinese_title else title
        if not name:
            return None

        price_str = item.get('FormatSoldPrice', '')
        price = re.sub(r'[,\s]', '', price_str) if price_str else ''
        sold_price = item.get('SoldPrice', 0)

        status = item.get('Status', '')
        status_map = {'sold': 'sold', 'unsold': 'unsold', 'available': 'available'}
        status = status_map.get(status.lower(), status) if status else ''

        thumbnail = item.get('ImageURL', '')
        zoom_img = item.get('ZoomImageURL', '')
        images = [img for img in [zoom_img, thumbnail] if img]

        auction_name = item.get('AuctionName', '')
        auction_date = item.get('AuctionEndDate', '')
        if auction_date:
            auction_date = auction_date.split(' ')[0]

        lot_number = item.get('LotNumber', '')
        detail_page = item.get('detailPage', '')
        currency_symbol = item.get('CurrencySymbol', '$')
        currency = 'USD' if currency_symbol == '$' else currency_symbol

        # Extract grading info from title
        grade_service = ''
        grade = ''
        for svc in ['PCGS', 'NGC', 'ANACS', 'ICG', 'GBCA', 'CNCS']:
            if svc in title.upper():
                grade_service = svc
                gm = re.search(rf'{svc}[.\s]*([\w]+-?\d+)', title, re.I)
                if gm:
                    grade = gm.group(1)
                break

        return {
            'source': 'sbp',
            'source_id': item_id,
            'name': name,
            'name_en': title if chinese_title else '',
            'dynasty': '',
            'category': category,
            'subcategory': '',
            'variety': '',
            'material': '',
            'weight': '',
            'diameter': '',
            'grade_service': grade_service,
            'grade': grade,
            'certification_no': '',
            'description': title,
            'image_urls': images,
            'thumbnail_url': thumbnail,
            'auction_house': "Stack's Bowers",
            'auction_session': auction_name,
            'auction_date': auction_date,
            'lot_number': lot_number,
            'estimate_low': '',
            'estimate_high': '',
            'price': str(sold_price) if sold_price else price,
            'price_currency': currency,
            'status': status,
            'source_url': detail_page or f'https://auctions.stacksbowers.com/lots/view/{item.get("AMID", "")}',
            'raw_data': item,
        }

    async def scrape_category(self, category):
        """Scrape all items in a category"""
        task_key = f'category_{category[:20]}'
        progress = await get_progress(self.db, 'sbp', task_key)
        start_page = 1
        if progress and progress['status'] == 'running':
            start_page = max(progress['last_page'], 1)

        # Step 1: Create search session with category filter
        query_id = await self.create_search_session(category=category)
        if not query_id:
            logger.error(f'Failed to create search session for {category}')
            return 0

        page = start_page
        total_in_cat = 0
        total_pages = 0

        while True:
            data = await self.search(
                category=category, page=page, query_id=query_id,
                total=total_in_cat, total_pages=total_pages
            )
            if not data:
                logger.warning(f'No data for {category} page {page}')
                break

            total = data.get('Total', 0)
            total_pages = data.get('TotalPages', 0)
            if page == start_page:
                total_in_cat = total
                logger.info(f'Category [{category}]: {total:,} items total, {total_pages} pages')

            packages = data.get('Packages', [])
            if not packages:
                break

            coins = []
            for item in packages:
                coin = self.parse_item(item, category)
                if coin:
                    coins.append(coin)

            if coins:
                await upsert_coins_batch(self.db, coins)

            count = await get_coin_count(self.db, 'sbp')
            await save_progress(self.db, 'sbp', task_key,
                                last_page=page, total_count=count)
            logger.info(f'  [{category}] page {page}/{total_pages}: {len(coins)} items, db_total={count}')

            if page >= total_pages:
                break

            page += 1
            await self.delay()

        count = await get_coin_count(self.db, 'sbp')
        await save_progress(self.db, 'sbp', task_key,
                            last_page=page, total_count=count, status='completed')
        return total_in_cat

    async def scrape_all(self):
        """Scrape all Chinese coin categories"""
        logger.info('=== SBP Archive Scraper Started ===')
        grand_total = 0

        for category in CHINA_CATEGORIES:
            logger.info(f'--- Scraping: {category} ---')
            n = await self.scrape_category(category)
            grand_total += n

        count = await get_coin_count(self.db, 'sbp')
        logger.info(f'=== SBP complete! Total: {count} records ===')


async def main():
    from db import init_db
    db = await init_db()
    scraper = SBPScraper(db)
    await scraper.setup()
    try:
        await scraper.scrape_all()
    except KeyboardInterrupt:
        logger.info('Interrupted! Progress saved.')
    finally:
        await scraper.teardown()
        count = await get_coin_count(db, 'sbp')
        logger.info(f'Final SBP count: {count}')
        await db.close()


if __name__ == '__main__':
    asyncio.run(main())
