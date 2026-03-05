"""
Hosane (Shanghai Holly / Hosane) Auction Scraper
Scrapes from www.hosane.com using Nuxt3 SSR data payloads.
Shanghai Holly is a top Chinese coin auction house.
"""
import asyncio
import httpx
import json
import re
import logging
import random
from db import upsert_coins_batch, get_progress, save_progress, get_coin_count

logger = logging.getLogger('hosane')

BASE_URL = 'https://www.hosane.com'
IMAGE_BASE = 'https://imageoss.hosane.com'

USER_AGENTS = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
]

# Known season codes (YYYYMM format)
# Hosane holds Spring (04-06) and Autumn (10-12) auctions since ~2005
KNOWN_SEASONS = []
for year in range(2005, 2026):
    for month in ['05', '06', '11', '12']:
        KNOWN_SEASONS.append(f'{year}{month}')


class HosaneScraper:
    def __init__(self, db, delay_range=(2.0, 4.0)):
        self.db = db
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
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'zh-CN,zh;q=0.9',
        }

    def _parse_nuxt_data(self, html):
        """Extract and parse __NUXT_DATA__ from HTML"""
        m = re.search(r'id="__NUXT_DATA__"[^>]*>(.*?)</script>', html, re.DOTALL)
        if not m:
            return None
        try:
            raw = m.group(1)
            data = json.loads(raw)
            return data
        except (json.JSONDecodeError, TypeError):
            return None

    def _resolve_nuxt_value(self, data, index):
        """Resolve a value from NUXT_DATA array by index"""
        if index is None or not isinstance(data, list):
            return None
        if isinstance(index, int) and 0 <= index < len(data):
            val = data[index]
            if isinstance(val, str) and val == 'null':
                return None
            return val
        return index

    async def fetch_season(self, season_code):
        """Fetch a season page and extract season + special (session) info"""
        url = f'{BASE_URL}/season/{season_code}'
        try:
            resp = await self.client.get(url, headers=self._headers())
            if resp.status_code != 200:
                return None
            nuxt = self._parse_nuxt_data(resp.text)
            if not nuxt:
                return None
            return nuxt
        except Exception as e:
            logger.warning(f'Error fetching season {season_code}: {e}')
            return None

    async def fetch_auction_detail(self, auction_code):
        """Fetch individual lot detail from /auction/detail/{code}"""
        url = f'{BASE_URL}/auction/detail/{auction_code}'
        try:
            resp = await self.client.get(url, headers=self._headers())
            if resp.status_code != 200:
                return None
            nuxt = self._parse_nuxt_data(resp.text)
            if not nuxt:
                return None
            return nuxt
        except Exception as e:
            logger.debug(f'Error fetching auction {auction_code}: {e}')
            return None

    def parse_season_specials(self, nuxt_data):
        """Parse season NUXT data to extract special (session) info"""
        specials = []
        if not isinstance(nuxt_data, list):
            return specials

        # Find specialInfo array and extract specialCode, specialName, sum_piece
        raw = json.dumps(nuxt_data, ensure_ascii=False)

        # Find specialCode patterns like "A2024111"
        for m in re.finditer(r'"(A\d{6,})"', raw):
            code = m.group(1)
            if code not in [s['code'] for s in specials]:
                specials.append({'code': code, 'name': '', 'piece_count': 0})

        # Find specialName associations
        for m in re.finditer(r'"specialName".*?"(\d+)".*?"([^"]+)"', raw):
            pass

        # Extract from structured data: look for specialCode fields
        for i, val in enumerate(nuxt_data):
            if isinstance(val, dict) and 'specialCode' in val:
                # This is a schema descriptor - the actual values follow
                pass
            if isinstance(val, str) and re.match(r'^A\d{6,}$', val):
                # Look backwards for specialName
                found = False
                for j in range(max(0, i-20), i):
                    v = nuxt_data[j]
                    if isinstance(v, str) and len(v) > 2 and not v.startswith('A') and not v.startswith('http'):
                        if any(k in v for k in ['币', '钱', '金', '银', '纸', '邮', '古', '珍', '夜', 'Coin', 'Gold', 'Silver', 'Note', 'Stamp']):
                            existing = [s for s in specials if s['code'] == val]
                            if existing:
                                existing[0]['name'] = v
                            found = True
                            break

        return specials

    def parse_auction_detail(self, nuxt_data, auction_code=''):
        """Parse auction detail NUXT data into a coin record"""
        if not isinstance(nuxt_data, list):
            return None

        raw = json.dumps(nuxt_data, ensure_ascii=False)

        # Check for 404 error
        if '"statusCode"' in raw and '404' in raw:
            return None

        # Extract key fields from the structured data
        coin = {
            'source': 'hosane',
            'source_id': auction_code,
            'name': '',
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
            'image_urls': [],
            'thumbnail_url': '',
            'auction_house': 'Hosane',
            'auction_session': '',
            'auction_date': '',
            'lot_number': '',
            'estimate_low': '',
            'estimate_high': '',
            'price': '',
            'price_currency': 'CNY',
            'status': '',
            'source_url': f'{BASE_URL}/auction/detail/{auction_code}',
            'raw_data': '',
        }

        # Find description text (usually the longest Chinese text)
        descriptions = []
        for val in nuxt_data:
            if isinstance(val, str) and len(val) > 20 and '<' not in val[:5]:
                if any('\u4e00' <= c <= '\u9fff' for c in val[:20]):
                    descriptions.append(val)

        # Find HTML descriptions
        html_descs = []
        for val in nuxt_data:
            if isinstance(val, str) and '<' in val and len(val) > 20:
                html_descs.append(val)

        # Use first plain text description as name, or extract from HTML
        if descriptions:
            desc = descriptions[0]
            # First line or first sentence as name
            name_text = desc.split('\n')[0][:200]
            # Try to get a cleaner name
            m = re.match(r'(.*?)(?:，|,|\s{2}|直径|重量|尺寸)', name_text)
            if m:
                coin['name'] = m.group(1).strip()
            else:
                coin['name'] = name_text.strip()
            coin['description'] = desc

        if html_descs:
            # Extract clean text from HTML for description
            from bs4 import BeautifulSoup
            for hd in html_descs:
                soup = BeautifulSoup(hd, 'html.parser')
                text = soup.get_text(strip=True)
                if len(text) > len(coin.get('description', '')):
                    coin['description'] = text
                    if not coin['name']:
                        name_text = text[:200]
                        m = re.match(r'(.*?)(?:，|,|\s{2}|直径|重量)', name_text)
                        coin['name'] = m.group(1).strip() if m else name_text

        # Find images
        images = []
        for val in nuxt_data:
            if isinstance(val, str) and 'hosane.com' in val and ('jpg' in val.lower() or 'png' in val.lower()):
                if '!300w' not in val:
                    images.append(val)
        if not images:
            for val in nuxt_data:
                if isinstance(val, str) and 'hosane.com' in val and ('jpg' in val.lower() or 'png' in val.lower()):
                    images.append(val)
        coin['image_urls'] = images[:10]
        if images:
            coin['thumbnail_url'] = images[0]

        # Find lot number (usually a 4-digit string)
        for val in nuxt_data:
            if isinstance(val, str) and re.match(r'^\d{4,5}$', val):
                coin['lot_number'] = val
                break

        # Find hammer price (large number)
        prices = []
        for val in nuxt_data:
            if isinstance(val, (int, float)) and val > 100 and val < 100000000:
                prices.append(val)
        # The hammer price is typically one of the larger numbers
        if prices:
            # Filter: hammer price should be in reasonable range
            reasonable = [p for p in prices if 100 < p < 50000000]
            if reasonable:
                coin['price'] = str(max(reasonable))

        # Find specialCode for session
        for val in nuxt_data:
            if isinstance(val, str) and re.match(r'^A\d{6,}$', val) and val != auction_code:
                pass
        # Find auction name
        for val in nuxt_data:
            if isinstance(val, str) and re.match(r'^A\d{7}$', val):
                coin['auction_session'] = val

        # Find auction date (timestamp > year 2000)
        for val in nuxt_data:
            if isinstance(val, (int, float)) and 946684800000 < val < 2000000000000:
                from datetime import datetime
                try:
                    dt = datetime.fromtimestamp(val / 1000)
                    coin['auction_date'] = dt.strftime('%Y-%m-%d')
                    break
                except (ValueError, OSError):
                    pass

        # Extract grading from name/description
        text = coin['name'] + ' ' + coin.get('description', '')
        for svc in ['PCGS', 'NGC', 'GBCA', 'CNCS', 'NPGS']:
            if svc in text.upper():
                coin['grade_service'] = svc
                gm = re.search(rf'{svc}\s*([\w]+-?\d+)', text, re.I)
                if gm:
                    coin['grade'] = gm.group(1)
                break

        # Detect status from price
        status_val = None
        for val in nuxt_data:
            if isinstance(val, (int,)) and val in [1003, 1004, 1005, 1006]:
                status_val = val
        if status_val == 1003:
            coin['status'] = 'completed'
        elif status_val == 1004:
            coin['status'] = 'unsold'

        if coin['price'] and int(float(coin['price'])) > 0:
            coin['status'] = 'sold'

        return coin if coin['name'] else None

    async def scrape_season(self, season_code):
        """Scrape all lots in a season"""
        logger.info(f'Fetching season {season_code}...')
        nuxt = await self.fetch_season(season_code)
        if not nuxt:
            logger.info(f'Season {season_code}: no data')
            return 0

        # Extract all auction codes from the season page
        raw = json.dumps(nuxt, ensure_ascii=False)
        auction_codes = list(set(re.findall(r'A\d{8,}', raw)))

        if not auction_codes:
            logger.info(f'Season {season_code}: no auction codes found')
            return 0

        logger.info(f'Season {season_code}: found {len(auction_codes)} auction codes')

        # Also find special codes from season data
        special_codes = list(set(re.findall(r'A\d{7}(?!\d)', raw)))
        for sc in special_codes:
            logger.info(f'  Special: {sc}')

        # Scrape each auction detail
        count = 0
        batch = []
        for i, code in enumerate(auction_codes):
            nuxt_detail = await self.fetch_auction_detail(code)
            if nuxt_detail:
                coin = self.parse_auction_detail(nuxt_detail, code)
                if coin:
                    batch.append(coin)
                    count += 1

            if len(batch) >= 20:
                await upsert_coins_batch(self.db, batch)
                total = await get_coin_count(self.db, 'hosane')
                logger.info(f'  Season {season_code}: {i+1}/{len(auction_codes)} lots, batch saved, db_total={total}')
                batch = []

            await self.delay()

        if batch:
            await upsert_coins_batch(self.db, batch)

        total = await get_coin_count(self.db, 'hosane')
        logger.info(f'Season {season_code}: scraped {count} lots, db_total={total}')
        return count

    async def discover_auction_codes(self, season_code):
        """Discover auction codes by probing sequential IDs within a special"""
        nuxt = await self.fetch_season(season_code)
        if not nuxt:
            return []

        raw = json.dumps(nuxt, ensure_ascii=False)

        # Extract all codes - both 8+ digit (lot codes) and 7-digit (special codes)
        all_codes = set(re.findall(r'A\d{7,}', raw))
        return sorted(all_codes)

    async def scrape_by_homepage_links(self):
        """Scrape lots linked from the homepage"""
        logger.info('Fetching homepage auction links...')
        try:
            resp = await self.client.get(BASE_URL, headers=self._headers())
            if resp.status_code != 200:
                return

            # Extract all auction detail links
            codes = list(set(re.findall(r'/auction/detail/(A\d+)', resp.text)))
            logger.info(f'Homepage: found {len(codes)} auction links')

            batch = []
            for i, code in enumerate(codes):
                nuxt = await self.fetch_auction_detail(code)
                if nuxt:
                    coin = self.parse_auction_detail(nuxt, code)
                    if coin:
                        batch.append(coin)

                if len(batch) >= 20:
                    await upsert_coins_batch(self.db, batch)
                    batch = []

                if (i + 1) % 10 == 0:
                    total = await get_coin_count(self.db, 'hosane')
                    logger.info(f'  Homepage lots: {i+1}/{len(codes)}, db_total={total}')

                await self.delay()

            if batch:
                await upsert_coins_batch(self.db, batch)

        except Exception as e:
            logger.error(f'Homepage scrape error: {e}')

    async def scrape_by_id_range(self, prefix='A2510', start=1, end=9999):
        """Scrape lots by probing auction IDs in range.
        Hosane codes: A{YYMM}{lot_number} e.g. A25100013
        prefix = 'A2510' for 2025 autumn (month 10)
        Lot numbers are not sequential, so we probe all in range.
        """
        task_key = f'id_range_{prefix}'
        progress = await get_progress(self.db, 'hosane', task_key)
        if progress and progress['status'] == 'completed':
            logger.info(f'ID range {prefix} already completed, skipping')
            return
        if progress and progress['status'] == 'running' and progress.get('last_id'):
            try:
                start = int(progress['last_id']) + 1
            except ValueError:
                pass

        logger.info(f'Probing {prefix}{start:04d} to {prefix}{end:04d}...')
        batch = []
        found = 0
        miss_streak = 0

        for num in range(start, end + 1):
            code = f'{prefix}{num:04d}'
            nuxt = await self.fetch_auction_detail(code)

            if nuxt:
                coin = self.parse_auction_detail(nuxt, code)
                if coin:
                    batch.append(coin)
                    found += 1
                    miss_streak = 0
                else:
                    miss_streak += 1
            else:
                miss_streak += 1

            if len(batch) >= 20:
                await upsert_coins_batch(self.db, batch)
                total = await get_coin_count(self.db, 'hosane')
                await save_progress(self.db, 'hosane', task_key,
                                    last_id=str(num), total_count=total)
                logger.info(f'  ID probe {code}: found={found}, db_total={total}')
                batch = []

            # If we miss 500 in a row, stop this range
            if miss_streak >= 500:
                logger.info(f'  500 consecutive misses at {code}, stopping range')
                break

            # Faster delay for misses
            if miss_streak > 0:
                await asyncio.sleep(0.5)
            else:
                await self.delay()

        if batch:
            await upsert_coins_batch(self.db, batch)

        total = await get_coin_count(self.db, 'hosane')
        await save_progress(self.db, 'hosane', task_key,
                            last_id=str(num), total_count=total, status='completed')
        logger.info(f'ID range {prefix}: found {found} lots')

    async def scrape_all(self):
        """Full scrape: seasons + homepage + ID probing"""
        logger.info('=== Hosane Scraper Started ===')

        # Phase 1: Homepage links
        await self.scrape_by_homepage_links()

        # Phase 2: Known seasons
        for season in reversed(KNOWN_SEASONS):  # Start from most recent
            task_key = f'season_{season}'
            progress = await get_progress(self.db, 'hosane', task_key)
            if progress and progress['status'] == 'completed':
                logger.info(f'Season {season} already completed, skipping')
                continue

            n = await self.scrape_season(season)
            await save_progress(self.db, 'hosane', task_key,
                                total_count=n, status='completed')

        # Phase 3: Probe ID ranges
        # Hosane codes: A{YYMM}{lot_number} where YYMM = 2-digit year + 2-digit month
        # e.g., A25100013 = year 25, month 10, lot 00013
        # Seasons: spring (05/06), autumn (10/11/12)
        # Lot numbers range roughly 0001-9999
        for year in range(25, 10, -1):  # 2025 down to 2011
            for month in ['11', '10', '06', '05', '12']:
                prefix = f'A{year}{month}'
                await self.scrape_by_id_range(prefix, 1, 9999)

        total = await get_coin_count(self.db, 'hosane')
        logger.info(f'=== Hosane complete! Total: {total} records ===')


async def main():
    from db import init_db
    db = await init_db()
    scraper = HosaneScraper(db)
    await scraper.setup()
    try:
        await scraper.scrape_all()
    except KeyboardInterrupt:
        logger.info('Interrupted! Progress saved.')
    finally:
        await scraper.teardown()
        total = await get_coin_count(db, 'hosane')
        logger.info(f'Final Hosane count: {total}')
        await db.close()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(name)s: %(message)s')
    asyncio.run(main())
