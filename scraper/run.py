"""
祥晋古泉 — 主控爬虫脚本
一键启动华夏古泉 + 首席收藏全量爬取
"""
import asyncio
import argparse
import logging
import os
import sys

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'scrape.log'), encoding='utf-8'),
    ]
)
logger = logging.getLogger('main')


async def run_huaxia(db):
    from huaxia_scraper import HuaxiaScraper
    scraper = HuaxiaScraper(db)
    await scraper.setup()
    try:
        await scraper.scrape_all()
    finally:
        await scraper.teardown()


async def run_shouxi(db, mode='session', start_id=1, end_id=1400000):
    from shouxi_scraper import ShouxiScraper
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

    scraper = ShouxiScraper(db)
    await scraper.setup()
    try:
        if mode == 'id':
            await scraper.scrape_by_id_range(start_id, end_id)
        elif mode == 'session':
            await scraper.scrape_all_sessions()
    finally:
        await scraper.teardown()


async def run_sbp(db):
    from sbp_scraper import SBPScraper
    scraper = SBPScraper(db)
    await scraper.setup()
    try:
        await scraper.scrape_all()
    finally:
        await scraper.teardown()


async def run_hosane(db):
    from hosane_scraper import HosaneScraper
    scraper = HosaneScraper(db)
    await scraper.setup()
    try:
        await scraper.scrape_all()
    finally:
        await scraper.teardown()


async def run_heritage(db):
    from heritage_scraper import HeritageScraper
    scraper = HeritageScraper(db)
    await scraper.setup()
    try:
        await scraper.scrape_all()
    finally:
        await scraper.teardown()


async def run_hongxi(db):
    from hongxi_scraper import HongxiScraper
    import urllib3
    urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
    scraper = HongxiScraper(db)
    await scraper.setup()
    try:
        await scraper.scrape_all()
    finally:
        await scraper.teardown()


async def export_data(db, output_dir):
    from db import export_to_json, get_coin_count
    os.makedirs(output_dir, exist_ok=True)

    total = await get_coin_count(db)
    all_sources = ['huaxia', 'shouxi', 'sbp', 'hosane', 'heritage', 'hongxi']
    counts = {}
    for src in all_sources:
        counts[src] = await get_coin_count(db, src)

    logger.info(f'Database: total={total}, ' + ', '.join(f'{k}={v}' for k, v in counts.items() if v > 0))

    # Export all
    all_path = os.path.join(output_dir, 'all_coins.json')
    n = await export_to_json(db, all_path)
    logger.info(f'Exported {n} records to {all_path}')

    # Export by source
    for src, cnt in counts.items():
        if cnt > 0:
            path = os.path.join(output_dir, f'{src}_coins.json')
            n = await export_to_json(db, path, src)
            logger.info(f'Exported {n} {src} records to {path}')

    # Export CSV summary
    import csv
    csv_path = os.path.join(output_dir, 'coins_summary.csv')
    cursor = await db.execute(
        "SELECT source, source_id, name, dynasty, category, grade_service, grade, "
        "price, price_currency, auction_house, auction_date, status, source_url "
        "FROM coins ORDER BY source, id"
    )
    rows = await cursor.fetchall()
    with open(csv_path, 'w', newline='', encoding='utf-8-sig') as f:
        writer = csv.writer(f)
        writer.writerow(['来源', 'ID', '名称', '朝代', '分类', '评级公司', '评级',
                         '价格', '币种', '拍卖行', '日期', '状态', '链接'])
        writer.writerows(rows)
    logger.info(f'Exported CSV summary: {csv_path}')

    return total


async def main():
    parser = argparse.ArgumentParser(description='祥晋古泉 — 全量爬虫')
    parser.add_argument('action', choices=['huaxia', 'shouxi', 'sbp', 'hosane', 'heritage', 'hongxi', 'all', 'export', 'status'],
                        help='执行动作: huaxia/shouxi/sbp/hosane/heritage/hongxi/all/export/status')
    parser.add_argument('--shouxi-mode', choices=['session', 'id'], default='session',
                        help='首席爬取模式')
    parser.add_argument('--start-id', type=int, default=1)
    parser.add_argument('--end-id', type=int, default=1400000)
    parser.add_argument('--output', default=os.path.join(os.path.dirname(__file__), 'export'),
                        help='导出目录')
    args = parser.parse_args()

    from db import init_db, get_coin_count, get_progress
    db = await init_db()

    try:
        if args.action == 'status':
            total = await get_coin_count(db)
            sources = ['huaxia', 'shouxi', 'sbp', 'hosane', 'heritage', 'hongxi']
            print(f'\n📊 数据库状态:')
            print(f'  总计: {total:,} 条记录')
            for src in sources:
                n = await get_coin_count(db, src)
                if n > 0:
                    print(f'  {src}: {n:,} 条')

            # Show progress
            for source in sources:
                cursor = await db.execute(
                    "SELECT task_type, last_page, total_count, status FROM scrape_progress WHERE source=?",
                    (source,)
                )
                rows = await cursor.fetchall()
                for row in rows:
                    print(f'  [{source}] {row[0]}: page={row[1]}, count={row[2]}, status={row[3]}')
            print()

        elif args.action == 'huaxia':
            logger.info('🏛️ Starting 华夏古泉 scraper...')
            await run_huaxia(db)

        elif args.action == 'shouxi':
            logger.info('📊 Starting 首席收藏 scraper...')
            await run_shouxi(db, args.shouxi_mode, args.start_id, args.end_id)

        elif args.action == 'sbp':
            logger.info("📊 Starting Stack's Bowers scraper...")
            await run_sbp(db)

        elif args.action == 'hosane':
            logger.info('📊 Starting 泓盛拍卖 scraper...')
            await run_hosane(db)

        elif args.action == 'heritage':
            logger.info('📊 Starting Heritage Auctions scraper...')
            await run_heritage(db)

        elif args.action == 'hongxi':
            logger.info('📊 Starting 鸿禧美术馆 data collector...')
            await run_hongxi(db)

        elif args.action == 'all':
            logger.info('🚀 Starting full scrape (all sources)...')
            logger.info('--- Phase 1: 华夏古泉 ---')
            await run_huaxia(db)
            logger.info('--- Phase 2: 首席收藏 ---')
            await run_shouxi(db, args.shouxi_mode, args.start_id, args.end_id)
            logger.info("--- Phase 3: Stack's Bowers ---")
            await run_sbp(db)
            logger.info('--- Phase 4: 泓盛拍卖 ---')
            await run_hosane(db)
            logger.info('--- Phase 5: Heritage Auctions ---')
            await run_heritage(db)
            logger.info('--- Phase 6: 鸿禧美术馆 ---')
            await run_hongxi(db)
            logger.info('--- Phase 7: Export ---')
            await export_data(db, args.output)

        elif args.action == 'export':
            total = await export_data(db, args.output)
            print(f'\n✅ 导出完成: {total:,} 条记录 → {args.output}/')

    except KeyboardInterrupt:
        logger.info('\n⏸️  已暂停，进度已保存。再次运行将从断点继续。')
    finally:
        await db.close()


if __name__ == '__main__':
    asyncio.run(main())
