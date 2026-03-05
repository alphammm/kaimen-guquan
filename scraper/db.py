"""
祥晋古泉 — SQLite 数据存储层
支持断点续爬、批量写入
"""
import aiosqlite
import json
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'coins.db')

CREATE_TABLES = """
CREATE TABLE IF NOT EXISTS coins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,           -- 'huaxia','shouxi','sbp','hosane','heritage','hongxi'
    source_id TEXT NOT NULL,        -- 原始站点 ID
    name TEXT,                      -- 钱币名称
    name_en TEXT,                   -- 英文名（如有）
    dynasty TEXT,                   -- 朝代
    category TEXT,                  -- 大分类（古钱/机制币/纸币等）
    subcategory TEXT,               -- 子分类
    variety TEXT,                   -- 版别
    material TEXT,                  -- 材质
    weight TEXT,                    -- 重量
    diameter TEXT,                  -- 直径
    grade_service TEXT,             -- 评级公司 (PCGS/NGC/华夏)
    grade TEXT,                     -- 评级分数
    certification_no TEXT,          -- 评级编号
    description TEXT,               -- 描述
    image_urls TEXT,                -- JSON array of image URLs
    thumbnail_url TEXT,             -- 缩略图
    auction_house TEXT,             -- 拍卖行
    auction_session TEXT,           -- 拍卖专场
    auction_date TEXT,              -- 拍卖日期
    lot_number TEXT,                -- 拍品号
    estimate_low TEXT,              -- 估价低
    estimate_high TEXT,             -- 估价高
    price TEXT,                     -- 成交价
    price_currency TEXT,            -- 币种
    status TEXT,                    -- 成交/流拍/在拍
    source_url TEXT,                -- 原始链接
    raw_data TEXT,                  -- 原始 JSON
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_id)
);

CREATE TABLE IF NOT EXISTS scrape_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    task_type TEXT NOT NULL,        -- 'item_list', 'item_detail', 'category', 'session'
    last_id TEXT,                   -- 最后处理的 ID
    last_page INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running',  -- running/paused/completed
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, task_type)
);

CREATE INDEX IF NOT EXISTS idx_coins_source ON coins(source);
CREATE INDEX IF NOT EXISTS idx_coins_dynasty ON coins(dynasty);
CREATE INDEX IF NOT EXISTS idx_coins_category ON coins(category);
CREATE INDEX IF NOT EXISTS idx_coins_name ON coins(name);
CREATE INDEX IF NOT EXISTS idx_coins_source_id ON coins(source, source_id);
"""

async def init_db(db_path=None):
    path = db_path or DB_PATH
    db = await aiosqlite.connect(path)
    await db.executescript(CREATE_TABLES)
    await db.commit()
    return db

async def upsert_coin(db, coin_data: dict):
    """插入或更新一条钱币记录"""
    cols = [
        'source', 'source_id', 'name', 'name_en', 'dynasty', 'category',
        'subcategory', 'variety', 'material', 'weight', 'diameter',
        'grade_service', 'grade', 'certification_no', 'description',
        'image_urls', 'thumbnail_url', 'auction_house', 'auction_session',
        'auction_date', 'lot_number', 'estimate_low', 'estimate_high',
        'price', 'price_currency', 'status', 'source_url', 'raw_data'
    ]
    values = []
    for col in cols:
        v = coin_data.get(col, '')
        if isinstance(v, (list, dict)):
            v = json.dumps(v, ensure_ascii=False)
        values.append(v or '')

    placeholders = ','.join(['?'] * len(cols))
    col_names = ','.join(cols)
    update_set = ','.join(f'{c}=excluded.{c}' for c in cols if c not in ('source', 'source_id'))

    await db.execute(
        f"INSERT INTO coins ({col_names}) VALUES ({placeholders}) "
        f"ON CONFLICT(source, source_id) DO UPDATE SET {update_set}, scraped_at=CURRENT_TIMESTAMP",
        values
    )

async def upsert_coins_batch(db, coins: list):
    """批量插入"""
    for coin in coins:
        await upsert_coin(db, coin)
    await db.commit()

async def get_progress(db, source: str, task_type: str):
    """获取爬取进度"""
    cursor = await db.execute(
        "SELECT last_id, last_page, total_count, status FROM scrape_progress WHERE source=? AND task_type=?",
        (source, task_type)
    )
    row = await cursor.fetchone()
    if row:
        return {'last_id': row[0], 'last_page': row[1], 'total_count': row[2], 'status': row[3]}
    return None

async def save_progress(db, source: str, task_type: str, last_id: str = None, last_page: int = 0, total_count: int = 0, status: str = 'running'):
    """保存爬取进度"""
    await db.execute(
        "INSERT INTO scrape_progress (source, task_type, last_id, last_page, total_count, status, updated_at) "
        "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) "
        "ON CONFLICT(source, task_type) DO UPDATE SET "
        "last_id=excluded.last_id, last_page=excluded.last_page, "
        "total_count=excluded.total_count, status=excluded.status, updated_at=CURRENT_TIMESTAMP",
        (source, task_type, last_id, last_page, total_count, status)
    )
    await db.commit()

async def get_coin_count(db, source: str = None):
    """获取记录数"""
    if source:
        cursor = await db.execute("SELECT COUNT(*) FROM coins WHERE source=?", (source,))
    else:
        cursor = await db.execute("SELECT COUNT(*) FROM coins")
    row = await cursor.fetchone()
    return row[0]

async def export_to_json(db, output_path: str, source: str = None):
    """导出为 JSON"""
    if source:
        cursor = await db.execute("SELECT * FROM coins WHERE source=? ORDER BY id", (source,))
    else:
        cursor = await db.execute("SELECT * FROM coins ORDER BY id")

    columns = [desc[0] for desc in cursor.description]
    rows = await cursor.fetchall()

    coins = []
    for row in rows:
        coin = dict(zip(columns, row))
        # Parse JSON fields
        for field in ('image_urls', 'raw_data'):
            if coin.get(field):
                try:
                    coin[field] = json.loads(coin[field])
                except (json.JSONDecodeError, TypeError):
                    pass
        coins.append(coin)

    import aiofiles
    async with aiofiles.open(output_path, 'w', encoding='utf-8') as f:
        await f.write(json.dumps(coins, ensure_ascii=False, indent=2))

    return len(coins)
