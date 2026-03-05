/**
 * Top 20 Chinese Coin Auction Records (中国钱币拍卖成交纪录 Top 20)
 *
 * Data compiled from: 首席收藏网 (ShouXi.com), NGC, PCGS, 各大拍卖行公开数据
 * Last updated: 2026-03-05
 *
 * Notes:
 * - All prices are 含佣金 (buyer's premium included) unless noted
 * - USD conversions use approximate exchange rates at time of sale
 * - Rankings are by CNY equivalent final price
 */

const TOP_20_CHINESE_COIN_AUCTIONS = [
  {
    rank: 1,
    coin: '奉天癸卯一两银币样币 (光绪二十九年)',
    coinEn: 'Fengtian Kuimao One Tael Silver Pattern, Guangxu Year 29 (1903)',
    dynasty: '清 Qing',
    house: '北京诚轩',
    houseEn: 'Beijing Chengxuan',
    date: '2022-08',
    grade: 'PCGS AU55',
    hammerPrice: '¥40,500,000',
    price: '¥46,575,000',
    priceUSD: '$6,600,000',
    note: '中国钱币公开拍卖最高成交纪录。存世仅此一枚，近120年孤品。耿爱德/古德曼/张秀青/周大为旧藏。',
    imgUrl: null
  },
  {
    rank: 2,
    coin: '民国16年张作霖像伍拾圆金币样币',
    coinEn: 'Zhang Zuolin 50 Yuan Gold Pattern, Republic Year 16 (1927)',
    dynasty: '民国 Republic',
    house: '北京诚轩',
    houseEn: 'Beijing Chengxuan',
    date: '2022-08',
    grade: 'PCGS SP64',
    hammerPrice: '¥30,000,000',
    price: '¥34,500,000',
    priceUSD: '$4,890,000',
    note: '中国金币公开拍卖最高纪录。首枚突破3000万的中国钱币。天津造币厂铸，存世约3-5枚。',
    imgUrl: null
  },
  {
    rank: 3,
    coin: '民国16年张作霖像伍拾圆金币样币',
    coinEn: 'Zhang Zuolin 50 Yuan Gold Pattern, Republic Year 16 (1927)',
    dynasty: '民国 Republic',
    house: '中贸圣佳',
    houseEn: 'China Trading Shengjia',
    date: '2025-12',
    grade: 'PCGS SP64+',
    hammerPrice: '¥29,000,000',
    price: '¥33,350,000',
    priceUSD: '$4,580,000',
    note: '张作霖直系家属传承，附张学良孙女亲笔信证实为家族唯一珍藏。该评级公司唯一冠军分。',
    imgUrl: null
  },
  {
    rank: 4,
    coin: '民国15年张作霖像陆海军大元帅壹圆银币样币',
    coinEn: 'Zhang Zuolin Grand Marshal One Dollar Silver Pattern, Republic Year 15 (1926)',
    dynasty: '民国 Republic',
    house: '北京诚轩',
    houseEn: 'Beijing Chengxuan',
    date: '2021-12',
    grade: 'PCGS SP62',
    hammerPrice: '¥22,600,000',
    price: '¥25,990,000',
    priceUSD: '$4,080,000',
    note: '海内外公开拍卖首枚超过2000万的中国钱币。天津造币厂试铸。',
    imgUrl: null
  },
  {
    rank: 5,
    coin: '户部光绪元宝一两银币样币',
    coinEn: 'Board of Revenue Guangxu Yuanbao One Tael Silver Pattern (1903)',
    dynasty: '清 Qing',
    house: '北京诚轩',
    houseEn: 'Beijing Chengxuan',
    date: '2022-08',
    grade: 'PCGS SP63+',
    hammerPrice: '¥20,000,000',
    price: '¥23,000,000',
    priceUSD: '$3,260,000',
    note: '"三两银"之一（与北洋一两、上海壹两并称），存世极罕。此品种公开拍卖最高价。',
    imgUrl: null
  },
  {
    rank: 6,
    coin: '光绪33年北洋造一两银币样币（直线版）',
    coinEn: 'Beiyang One Tael Silver Pattern, Guangxu Year 33 (1907), Straight Line',
    dynasty: '清 Qing',
    house: '上海泓盛',
    houseEn: 'Shanghai Hosane',
    date: '2022-08',
    grade: 'PCGS MS61',
    hammerPrice: '¥18,000,000',
    price: '¥20,700,000',
    priceUSD: '$2,940,000',
    note: '清代"圆两之争"最后一种两制银币。此品种公开拍卖纪录。浅金色原味包浆。',
    imgUrl: null
  },
  {
    rank: 7,
    coin: '宣统三年大清银币壹圆长须龙样币（阴叶）',
    coinEn: 'Xuantong Year 3 "Long Whisker Dragon" Dollar Pattern (1911)',
    dynasty: '清 Qing',
    house: 'SBP (Stack\'s Bowers)',
    houseEn: 'Stack\'s Bowers and Ponterio',
    date: '2022-05',
    grade: 'PCGS SP63+',
    hammerPrice: '$2,500,000',
    price: '¥19,800,000',
    priceUSD: '$3,000,000',
    note: 'Dragon Dollar公开拍卖最高纪录。含20%买方佣金$3,000,000。PCGS认证不足25枚此版。',
    imgUrl: null
  },
  {
    rank: 8,
    coin: '上海中外通宝壹两银币样币',
    coinEn: 'Shanghai Zhongwai Tongbao One Tael Silver Pattern',
    dynasty: '清 Qing',
    house: '上海泓盛',
    houseEn: 'Shanghai Hosane',
    date: '2024-06',
    grade: 'PCGS SP62',
    hammerPrice: '¥16,800,000',
    price: '¥19,320,000',
    priceUSD: '$2,660,000',
    note: '2024年度机制币榜首。中国机制银元十大名珍之一，民间已知存世仅4枚。耿爱德/刘改造旧藏。',
    imgUrl: null
  },
  {
    rank: 9,
    coin: '民国17年张作霖像大元帅壹圆银币样币',
    coinEn: 'Zhang Zuolin Grand Marshal One Dollar Silver Pattern, Republic Year 17 (1928)',
    dynasty: '民国 Republic',
    house: '安徽邓通',
    houseEn: 'Anhui Dengtong',
    date: '2023-06',
    grade: 'PCGS SP61',
    hammerPrice: '¥16,000,000',
    price: '¥18,400,000',
    priceUSD: '$2,540,000',
    note: '2023年度机制币榜首。天津造币厂试铸。',
    imgUrl: null
  },
  {
    rank: 10,
    coin: '民国15年张作霖像陆海军大元帅壹圆银币样币',
    coinEn: 'Zhang Zuolin Grand Marshal One Dollar Silver Pattern, Republic Year 15 (1926)',
    dynasty: '民国 Republic',
    house: '北京诚轩',
    houseEn: 'Beijing Chengxuan',
    date: '2023-06',
    grade: 'PCGS SP53',
    hammerPrice: '¥15,000,000',
    price: '¥17,250,000',
    priceUSD: '$2,380,000',
    note: '2023年度第二名。虽分数较低(SP53)，品种极珍罕仍获高价。',
    imgUrl: null
  },
  {
    rank: 11,
    coin: '民国18年孙中山像地球双旗壹圆银币样币',
    coinEn: 'Sun Yat-sen Globe & Double Flags One Dollar Pattern, Republic Year 18 (1929)',
    dynasty: '民国 Republic',
    house: '海南德泉缘',
    houseEn: 'Hainan Dequanyuan',
    date: '2021-12',
    grade: 'PCGS SP61',
    hammerPrice: '¥15,000,000',
    price: '¥17,250,000',
    priceUSD: '$2,710,000',
    note: '被誉为"中国银币最美一品"。天津造币厂试铸。2021年度第二名。',
    imgUrl: null
  },
  {
    rank: 12,
    coin: '民国17年张作霖像大元帅壹圆银币样币',
    coinEn: 'Zhang Zuolin Grand Marshal One Dollar Silver Pattern, Republic Year 17 (1928)',
    dynasty: '民国 Republic',
    house: 'SBP (Stack\'s Bowers)',
    houseEn: 'Stack\'s Bowers and Ponterio',
    date: '2021-10',
    grade: 'PCGS MS62',
    hammerPrice: null,
    price: '¥15,000,000',
    priceUSD: '$2,280,000',
    note: '含佣$2,280,000（约合1500万人民币）。2021年度第三名。',
    imgUrl: null
  },
  {
    rank: 13,
    coin: '民国16年张作霖像陆海空大元帅壹圆银币样币（错配龙凤背）',
    coinEn: 'Zhang Zuolin Military Uniform Dragon-Phoenix Silver Pattern, Republic Year 16 (1927)',
    dynasty: '民国 Republic',
    house: '泰星 (Taisei)',
    houseEn: 'Taisei Coins, Tokyo',
    date: '2022-04',
    grade: 'NGC MS62',
    hammerPrice: null,
    price: '¥14,080,000',
    priceUSD: '$2,125,000',
    note: '含佣2.76亿日元。泰星拍卖史上最高成交纪录。耿爱德旧藏。错配十六年龙凤背。',
    imgUrl: null
  },
  {
    rank: 14,
    coin: '民国17年张作霖像大元帅壹圆银币',
    coinEn: 'Zhang Zuolin Grand Marshal One Dollar Silver, Republic Year 17 (1928)',
    dynasty: '民国 Republic',
    house: 'Heritage Auctions (海瑞得)',
    houseEn: 'Heritage Auctions, Hong Kong',
    date: '2021-12',
    grade: 'NGC MS62',
    hammerPrice: null,
    price: '¥13,820,000',
    priceUSD: '$2,170,000',
    note: '浅杏色包浆。2021年度第四名。',
    imgUrl: null
  },
  {
    rank: 15,
    coin: '户部光绪元宝一两银币样币',
    coinEn: 'Board of Revenue Guangxu Yuanbao One Tael Silver Pattern (1903)',
    dynasty: '清 Qing',
    house: '北京阿城哥',
    houseEn: 'Beijing Achengge',
    date: '2023-08',
    grade: 'PCGS SP62',
    hammerPrice: null,
    price: '¥13,340,000',
    priceUSD: '$1,840,000',
    note: '2023年度第三名。',
    imgUrl: null
  },
  {
    rank: 16,
    coin: '上海壹两银币样币（射线版）',
    coinEn: 'Shanghai One Tael Silver Pattern (Rays Version)',
    dynasty: '清 Qing',
    house: '泰星 (Taisei)',
    houseEn: 'Taisei Coins, Tokyo',
    date: '2022-04',
    grade: 'NGC PF63+',
    hammerPrice: null,
    price: '¥13,200,000',
    priceUSD: '$1,690,000',
    note: '含佣约2.25亿日元。底光绚丽，浅棕包浆，龙图饱满。',
    imgUrl: null
  },
  {
    rank: 17,
    coin: '民国18年孙中山像地球双旗壹圆银币样币',
    coinEn: 'Sun Yat-sen Globe & Double Flags One Dollar Pattern, Republic Year 18 (1929)',
    dynasty: '民国 Republic',
    house: '北京诚轩',
    houseEn: 'Beijing Chengxuan',
    date: '2021-12',
    grade: 'PCGS SP61',
    hammerPrice: '¥11,000,000',
    price: '¥12,650,000',
    priceUSD: '$1,990,000',
    note: '马定祥旧藏。2021年度第五名。',
    imgUrl: null
  },
  {
    rank: 18,
    coin: '上海壹两银币样币（无射线版）',
    coinEn: 'Shanghai One Tael Silver Pattern (Without Rays)',
    dynasty: '清 Qing',
    house: '上海泓盛',
    houseEn: 'Shanghai Hosane',
    date: '2023-06',
    grade: 'PCGS PR63+',
    hammerPrice: '¥11,100,000',
    price: '¥12,765,000',
    priceUSD: '$1,760,000',
    note: '2023年度第四名。',
    imgUrl: null
  },
  {
    rank: 19,
    coin: '户部光绪元宝一两银币样币',
    coinEn: 'Board of Revenue Guangxu Yuanbao One Tael Silver Pattern (1903)',
    dynasty: '清 Qing',
    house: '北京诚轩',
    houseEn: 'Beijing Chengxuan',
    date: '2024-06',
    grade: 'PCGS SP63',
    hammerPrice: '¥10,500,000',
    price: '¥12,075,000',
    priceUSD: '$1,660,000',
    note: '2024年度第二名。"三两银"之一。',
    imgUrl: null
  },
  {
    rank: 20,
    coin: '造币总厂七钱二分中心点样币',
    coinEn: 'General Mint 7 Mace 2 Candareens Center Dot Pattern',
    dynasty: '清 Qing',
    house: '海南德泉缘',
    houseEn: 'Hainan Dequanyuan',
    date: '2023-06',
    grade: 'PCGS SP64+',
    hammerPrice: '¥10,000,000',
    price: '¥11,500,000',
    priceUSD: '$1,590,000',
    note: '2023年度第五名（并列）。造币总厂试铸，存世极罕。',
    imgUrl: null
  }
];

// === Summary Statistics ===
// Total: 20 records, all above ¥11,500,000 (含佣)
// Price range: ¥46,575,000 (#1) — ¥11,500,000 (#20)
//
// By Dynasty/Era:
//   清 Qing: 10 records (50%)
//   民国 Republic: 10 records (50%)
//
// By Coin Type (appearances):
//   张作霖系列: 7 records (#2,3,4,9,10,12,13,14) — dominates Republic era
//   户部一两: 3 records (#5,15,19)
//   孙中山地球双旗: 2 records (#11,17)
//   上海壹两: 2 records (#16,18)
//   奉天癸卯一两: 1 record (#1) — 孤品之王
//   宣三长须龙: 1 record (#7)
//   中外通宝壹两: 1 record (#8)
//   北洋一两: 1 record (#6)
//   造币总厂中心点: 1 record (#20)
//
// By Auction House:
//   北京诚轩: 7 records — dominant house for top Chinese coins
//   上海泓盛: 3 records
//   SBP: 2 records
//   泰星 Taisei: 2 records
//   海南德泉缘: 2 records
//   安徽邓通: 1 record
//   Heritage: 1 record
//   中贸圣佳: 1 record
//   北京阿城哥: 1 record
//
// By Year:
//   2021: 5 records
//   2022: 6 records (peak year — includes #1 and #2)
//   2023: 4 records
//   2024: 2 records
//   2025: 1 record
//
// USD Exchange Rates Used (approximate at time of sale):
//   2021: 1 USD ≈ 6.37 CNY
//   2022: 1 USD ≈ 6.70-7.05 CNY
//   2023: 1 USD ≈ 7.25 CNY
//   2024: 1 USD ≈ 7.27 CNY
//   2025: 1 USD ≈ 7.28 CNY

export default TOP_20_CHINESE_COIN_AUCTIONS;
