"""
Heritage Auctions (ha.com) Chinese Coins Scraper
Heritage uses heavy JS rendering and DataDome captcha protection.
Strategy: scrape via their structured search URLs with server-rendered HTML fallback.
"""
import asyncio
import httpx
import json
import re
import logging
import random
from bs4 import BeautifulSoup
from db import upsert_coins_batch, get_progress, save_progress, get_coin_count

logger = logging.getLogger('heritage')

BASE_URL = 'https://coins.ha.com'

# Heritage Chinese coin category hierarchy
# N= parameter values for filtering
CHINA_CATEGORIES = {
    'Chinese Coins': '790+231+4294947475',
    'Chinese Paper Money': '790+231+4294947466',
}

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
]


class HeritageScraper:
    def __init__(self, db, delay_range=(3.0, 6.0)):
        self.db = db
        self.delay_range = delay_range
        self.client = None

    async def setup(self):
        self.client = httpx.AsyncClient(
            timeout=30,
            follow_redirects=True,
            limits=httpx.Limits(max_connections=2, max_keepalive_connections=1),
            http2=True,
        )

    async def teardown(self):
        if self.client:
            await self.client.aclose()

    async def delay(self):
        await asyncio.sleep(random.uniform(*self.delay_range))

    def _headers(self):
        return {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
        }

    async def fetch_search_page(self, category_n, offset=0, retries=3):
        """Fetch Heritage search results page"""
        params = {
            'N': category_n,
            'No': str(offset),
            'Nrpp': '96',
            'mode': 'archive',
            'ic4': 'ListView',
        }
        url = f'{BASE_URL}/c/search/results.zx'

        for attempt in range(retries):
            try:
                resp = await self.client.get(url, params=params, headers=self._headers())

                if resp.status_code == 200:
                    # Check for captcha redirect
                    text = resp.text
                    if 'captcha-delivery' in text or 'geo.captcha' in text:
                        logger.warning(f'Captcha detected at offset {offset}, waiting 60s...')
                        await asyncio.sleep(60)
                        continue
                    return text

                if resp.status_code == 403:
                    logger.warning(f'403 Forbidden at offset {offset}, waiting 120s...')
                    await asyncio.sleep(120)
                    continue

                logger.warning(f'Heritage {resp.status_code} at offset {offset}')
            except Exception as e:
                logger.warning(f'Heritage error (attempt {attempt+1}): {e}')
                await asyncio.sleep(10 * (attempt + 1))

        return None

    async def fetch_lot_page(self, lot_url, retries=3):
        """Fetch individual lot detail page"""
        for attempt in range(retries):
            try:
                resp = await self.client.get(lot_url, headers=self._headers())
                if resp.status_code == 200:
                    if 'captcha-delivery' in resp.text:
                        await asyncio.sleep(60)
                        continue
                    return resp.text
                if resp.status_code in (403, 429):
                    await asyncio.sleep(60)
            except Exception as e:
                logger.warning(f'Lot page error: {e}')
                await asyncio.sleep(10)
        return None

    def parse_search_results(self, html, category=''):
        """Parse Heritage search results page"""
        if not html:
            return [], 0

        soup = BeautifulSoup(html, 'lxml')
        items = []

        # Try to find total results
        total = 0
        total_el = soup.select_one('.results-total, .search-count, [data-total]')
        if total_el:
            m = re.search(r'([\d,]+)', total_el.get_text())
            if m:
                total = int(m.group(1).replace(',', ''))

        # Parse search result items
        for item_el in soup.select('.search-result-item, .lot-card, [class*="search-result"], [class*="lot-listing"]'):
            try:
                coin = self._parse_result_item(item_el, category)
                if coin:
                    items.append(coin)
            except Exception as e:
                logger.debug(f'Parse error: {e}')

        # Alternative: parse from structured data / JSON-LD
        for script in soup.select('script[type="application/ld+json"]'):
            try:
                ld = json.loads(script.string)
                if isinstance(ld, dict) and ld.get('@type') == 'Product':
                    coin = self._parse_jsonld(ld, category)
                    if coin:
                        items.append(coin)
                elif isinstance(ld, list):
                    for item in ld:
                        if isinstance(item, dict) and item.get('@type') == 'Product':
                            coin = self._parse_jsonld(item, category)
                            if coin:
                                items.append(coin)
            except (json.JSONDecodeError, TypeError):
                pass

        # Try parsing from any visible lot data
        if not items:
            for link in soup.select('a[href*="/itm/"]'):
                href = link.get('href', '')
                text = link.get_text(strip=True)
                if text and len(text) > 5:
                    lot_id = re.search(r'/itm/(\d+)', href)
                    if lot_id:
                        items.append({
                            'source': 'heritage',
                            'source_id': lot_id.group(1),
                            'name': text[:200],
                            'name_en': text[:200],
                            'dynasty': '',
                            'category': category,
                            'subcategory': '',
                            'variety': '',
                            'material': '',
                            'weight': '',
                            'diameter': '',
                            'grade_service': '',
                            'grade': '',
                            'certification_no': '',
                            'description': text,
                            'image_urls': [],
                            'thumbnail_url': '',
                            'auction_house': 'Heritage Auctions',
                            'auction_session': '',
                            'auction_date': '',
                            'lot_number': '',
                            'estimate_low': '',
                            'estimate_high': '',
                            'price': '',
                            'price_currency': 'USD',
                            'status': '',
                            'source_url': f'https://coins.ha.com{href}' if href.startswith('/') else href,
                            'raw_data': '',
                        })

        return items, total

    def _parse_result_item(self, el, category=''):
        """Parse a single search result item element"""
        # Find lot link and title
        title_link = el.select_one('a[href*="/itm/"], a.lot-title, a.search-result-title, h3 a, h4 a')
        if not title_link:
            return None

        href = title_link.get('href', '')
        title = title_link.get_text(strip=True)
        if not title or len(title) < 3:
            return None

        # Extract lot ID
        lot_id = ''
        m = re.search(r'/itm/(\d+)', href) or re.search(r'[?&]a=(\d+)', href)
        if m:
            lot_id = m.group(1)
        else:
            return None

        # Image
        img = el.select_one('img')
        thumbnail = ''
        if img:
            thumbnail = img.get('src', '') or img.get('data-src', '') or img.get('data-lazy', '')

        # Price
        price = ''
        price_el = el.select_one('.price, .sold-price, [class*="price"], .lot-price')
        if price_el:
            price_text = price_el.get_text(strip=True)
            m = re.search(r'[\$]?([\d,]+)', price_text)
            if m:
                price = m.group(1).replace(',', '')

        # Auction info
        auction_info = ''
        info_el = el.select_one('.auction-info, .lot-info, .sub-title')
        if info_el:
            auction_info = info_el.get_text(strip=True)

        # Extract grading
        grade_service = ''
        grade = ''
        for svc in ['PCGS', 'NGC', 'ANACS', 'ICG']:
            if svc in title:
                grade_service = svc
                gm = re.search(rf'{svc}\s*([\w]+-?\d+)', title, re.I)
                if gm:
                    grade = gm.group(1)
                break

        return {
            'source': 'heritage',
            'source_id': lot_id,
            'name': title[:200],
            'name_en': title[:200],
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
            'image_urls': [thumbnail] if thumbnail else [],
            'thumbnail_url': thumbnail,
            'auction_house': 'Heritage Auctions',
            'auction_session': auction_info,
            'auction_date': '',
            'lot_number': '',
            'estimate_low': '',
            'estimate_high': '',
            'price': price,
            'price_currency': 'USD',
            'status': 'sold' if price else '',
            'source_url': f'https://coins.ha.com{href}' if href.startswith('/') else href,
            'raw_data': '',
        }

    def _parse_jsonld(self, ld, category=''):
        """Parse JSON-LD product data"""
        name = ld.get('name', '')
        if not name:
            return None

        lot_id = ''
        url = ld.get('url', '')
        m = re.search(r'/itm/(\d+)', url)
        if m:
            lot_id = m.group(1)
        else:
            lot_id = str(hash(name))[:10]

        image = ld.get('image', '')
        if isinstance(image, list):
            image = image[0] if image else ''

        price = ''
        offers = ld.get('offers', {})
        if isinstance(offers, dict):
            price = str(offers.get('price', ''))

        return {
            'source': 'heritage',
            'source_id': lot_id,
            'name': name[:200],
            'name_en': name[:200],
            'dynasty': '',
            'category': category,
            'subcategory': '',
            'variety': '',
            'material': '',
            'weight': '',
            'diameter': '',
            'grade_service': '',
            'grade': '',
            'certification_no': '',
            'description': ld.get('description', name),
            'image_urls': [image] if image else [],
            'thumbnail_url': image,
            'auction_house': 'Heritage Auctions',
            'auction_session': '',
            'auction_date': '',
            'lot_number': '',
            'estimate_low': '',
            'estimate_high': '',
            'price': price,
            'price_currency': 'USD',
            'status': 'sold' if price else '',
            'source_url': url,
            'raw_data': ld,
        }

    async def scrape_past_auctions(self):
        """Scrape Heritage past auction schedule for Chinese coin auctions"""
        url = f'{BASE_URL}/heritage-auctions-schedule.s?category=coins&view=past'
        try:
            resp = await self.client.get(url, headers=self._headers())
            if resp.status_code != 200:
                return []

            soup = BeautifulSoup(resp.text, 'lxml')
            auctions = []
            for link in soup.select('a[href*="auction"]'):
                text = link.get_text(strip=True).lower()
                if any(k in text for k in ['chinese', 'china', 'hong kong', 'world coin', 'asian']):
                    auctions.append({
                        'name': link.get_text(strip=True),
                        'url': link.get('href', ''),
                    })
            return auctions
        except Exception as e:
            logger.warning(f'Past auctions error: {e}')
            return []

    async def scrape_category(self, cat_name, cat_n):
        """Scrape a Heritage category by paginating through search results"""
        task_key = f'cat_{cat_name[:20]}'
        progress = await get_progress(self.db, 'heritage', task_key)
        start_offset = 0
        if progress and progress['status'] == 'running':
            start_offset = (progress['last_page'] or 0) * 96

        offset = start_offset
        page = start_offset // 96

        logger.info(f'Scraping Heritage [{cat_name}] from offset {offset}...')

        consecutive_empty = 0

        while True:
            html = await self.fetch_search_page(cat_n, offset)
            if not html:
                logger.warning(f'No HTML at offset {offset}')
                consecutive_empty += 1
                if consecutive_empty >= 3:
                    break
                await self.delay()
                offset += 96
                page += 1
                continue

            items, total = self.parse_search_results(html, cat_name)

            if not items:
                consecutive_empty += 1
                if consecutive_empty >= 3:
                    logger.info(f'3 empty pages in a row, stopping')
                    break
            else:
                consecutive_empty = 0
                await upsert_coins_batch(self.db, items)

            count = await get_coin_count(self.db, 'heritage')
            await save_progress(self.db, 'heritage', task_key,
                                last_page=page, total_count=count)
            logger.info(f'  [{cat_name}] offset {offset}: {len(items)} items, total_in_cat={total}, db_total={count}')

            if total > 0 and offset + 96 >= total:
                break

            offset += 96
            page += 1
            await self.delay()

        count = await get_coin_count(self.db, 'heritage')
        await save_progress(self.db, 'heritage', task_key,
                            last_page=page, total_count=count, status='completed')

    async def scrape_all(self):
        """Full Heritage scrape"""
        logger.info('=== Heritage Auctions Scraper Started ===')
        logger.info('Note: Heritage uses captcha protection. Results may be limited.')

        for cat_name, cat_n in CHINA_CATEGORIES.items():
            logger.info(f'--- Scraping: {cat_name} ---')
            await self.scrape_category(cat_name, cat_n)

        count = await get_coin_count(self.db, 'heritage')
        logger.info(f'=== Heritage complete! Total: {count} records ===')


async def main():
    from db import init_db
    db = await init_db()
    scraper = HeritageScraper(db)
    await scraper.setup()
    try:
        await scraper.scrape_all()
    except KeyboardInterrupt:
        logger.info('Interrupted! Progress saved.')
    finally:
        await scraper.teardown()
        count = await get_coin_count(db, 'heritage')
        logger.info(f'Final Heritage count: {count}')
        await db.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
    asyncio.run(main())
