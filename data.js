// ============================================
// 开门古泉 — 全量古钱币数据库
// ============================================

const DYNASTIES = [
  { id: 'pre-qin', name: '先秦', years: '约前2000-前221', icon: '🐚', desc: '贝币·刀币·布币·蚁鼻钱·圜钱' },
  { id: 'qin', name: '秦朝', years: '前221-前207', icon: '⚖️', desc: '半两钱·统一货币' },
  { id: 'han', name: '两汉', years: '前206-220', icon: '🏛️', desc: '五铢钱·王莽货泉·四铢半两' },
  { id: 'three-kingdoms', name: '三国', years: '220-280', icon: '⚔️', desc: '直百五铢·大泉五百·太平百钱' },
  { id: 'jin-southern', name: '两晋南北朝', years: '265-589', icon: '🏔️', desc: '五铢小钱·太货六铢·永通万国' },
  { id: 'sui', name: '隋朝', years: '581-618', icon: '🌉', desc: '五铢钱·开皇五铢' },
  { id: 'tang', name: '唐朝', years: '618-907', icon: '🌙', desc: '开元通宝·乾元重宝' },
  { id: 'five-dynasties', name: '五代十国', years: '907-979', icon: '🔥', desc: '天福元宝·乾亨通宝·天德重宝' },
  { id: 'song', name: '两宋', years: '960-1279', icon: '📜', desc: '宋元通宝·崇宁通宝·大观通宝' },
  { id: 'liao-jin-xixia', name: '辽金西夏', years: '907-1234', icon: '🏇', desc: '天禄通宝·正隆元宝·天盛元宝' },
  { id: 'yuan', name: '元朝', years: '1271-1368', icon: '🎪', desc: '至元通宝·大元通宝·至正通宝' },
  { id: 'ming', name: '明朝', years: '1368-1644', icon: '🏯', desc: '洪武通宝·永乐通宝·嘉靖通宝' },
  { id: 'qing', name: '清朝', years: '1644-1911', icon: '🐉', desc: '顺治通宝至宣统通宝' },
  { id: 'jizhi', name: '机制币', years: '1889-1949', icon: '⚙️', desc: '光绪元宝·大清银币·袁大头·孙小头' },
  { id: 'minguo', name: '民国', years: '1912-1949', icon: '🎖️', desc: '开国纪念币·中央造币厂' },
];

const COINS = [
  // ===== 先秦 =====
  { id: 1, dynasty: 'pre-qin', name: '天然贝币', variety: '海贝·黄贝', period: '商代', material: '天然贝壳', rarity: 3, priceRange: '200-2,000', desc: '中国最早的货币形态，商代即用于交换。以海贝为主，产自南海。', weight: '1-3g', size: '15-25mm' },
  { id: 2, dynasty: 'pre-qin', name: '铜贝', variety: '包金铜贝·鎏金铜贝', period: '商周', material: '青铜', rarity: 4, priceRange: '500-15,000', desc: '仿海贝铸造的铜贝，是中国最早的金属铸币。', weight: '2-5g', size: '18-22mm' },
  { id: 3, dynasty: 'pre-qin', name: '空首布', variety: '平肩弧足·斜肩弧足·耸肩尖足', period: '春秋', material: '青铜', rarity: 4, priceRange: '3,000-80,000', desc: '春秋时期周王畿及晋、郑、卫等国使用的货币，形似铲。', weight: '20-40g', size: '80-120mm' },
  { id: 4, dynasty: 'pre-qin', name: '尖足布', variety: '大型·中型·小型', period: '战国', material: '青铜', rarity: 4, priceRange: '2,000-50,000', desc: '赵国铸造，足端尖锐，多有地名文字。', weight: '8-15g', size: '45-65mm' },
  { id: 5, dynasty: 'pre-qin', name: '方足布', variety: '大方足·小方足·锐角方足', period: '战国', material: '青铜', rarity: 3, priceRange: '500-20,000', desc: '韩、赵、魏三国通用货币，方形足部。', weight: '5-12g', size: '40-55mm' },
  { id: 6, dynasty: 'pre-qin', name: '圆足布', variety: '三孔布·圆足布', period: '战国', material: '青铜', rarity: 5, priceRange: '10,000-500,000', desc: '三孔布极为珍罕，存世不过数十枚。赵国铸造。', weight: '6-8g', size: '50-70mm' },
  { id: 7, dynasty: 'pre-qin', name: '齐刀', variety: '齐大刀·齐法化·即墨法化·安阳法化', period: '战国', material: '青铜', rarity: 4, priceRange: '3,000-150,000', desc: '齐国货币，刀币中最大型者。"齐返邦长法化"六字刀极珍。', weight: '40-60g', size: '170-185mm' },
  { id: 8, dynasty: 'pre-qin', name: '燕明刀', variety: '圆折·方折·磬折', period: '战国', material: '青铜', rarity: 2, priceRange: '300-5,000', desc: '燕国主要货币，面文"明"字，铸量巨大。', weight: '12-18g', size: '125-145mm' },
  { id: 9, dynasty: 'pre-qin', name: '赵刀', variety: '直刀·甘丹刀·白人刀', period: '战国', material: '青铜', rarity: 3, priceRange: '1,000-30,000', desc: '赵国铸造，刀身较直。"甘丹"即邯郸。', weight: '8-15g', size: '120-140mm' },
  { id: 10, dynasty: 'pre-qin', name: '蚁鼻钱', variety: '鬼脸钱·各字蚁鼻', period: '战国', material: '青铜', rarity: 3, priceRange: '200-8,000', desc: '楚国货币，形似海贝，面有阴文。又称"鬼脸钱"。', weight: '2-5g', size: '15-20mm' },
  { id: 11, dynasty: 'pre-qin', name: '郢爰', variety: '金版·金饼', period: '战国', material: '黄金', rarity: 5, priceRange: '50,000-2,000,000', desc: '楚国金币，中国最早的黄金铸币。"郢"为楚都城名。', weight: '15-16g每印', size: '方寸' },
  { id: 12, dynasty: 'pre-qin', name: '圜钱', variety: '圆孔圜钱·方孔圜钱·共字圜钱', period: '战国', material: '青铜', rarity: 3, priceRange: '500-30,000', desc: '秦、魏、赵等国铸造。方孔圜钱为后世方孔钱之祖。', weight: '5-12g', size: '30-40mm' },

  // ===== 秦朝 =====
  { id: 13, dynasty: 'qin', name: '秦半两', variety: '战国半两·秦统一半两·大型半两', period: '秦代', material: '青铜', rarity: 2, priceRange: '100-20,000', desc: '秦始皇统一全国货币，圆形方孔。"半两"即十二铢（约8g）。', weight: '3-12g', size: '25-35mm' },
  { id: 14, dynasty: 'qin', name: '秦权钱', variety: '重四两·两甾', period: '秦代', material: '青铜', rarity: 5, priceRange: '100,000-1,000,000', desc: '秦代大型权钱，极为珍罕。用于衡量标准。', weight: '20-30g', size: '50-65mm' },

  // ===== 两汉 =====
  { id: 15, dynasty: 'han', name: '汉半两', variety: '八铢半两·四铢半两·榆荚半两', period: '西汉', material: '青铜', rarity: 2, priceRange: '30-5,000', desc: '西汉初沿用秦制，后逐渐减重。文帝四铢半两最为通行。', weight: '1.5-8g', size: '20-28mm' },
  { id: 16, dynasty: 'han', name: '五铢', variety: '元狩五铢·上林三官五铢·宣帝五铢', period: '西汉', material: '青铜', rarity: 1, priceRange: '10-3,000', desc: '汉武帝元狩五年始铸，中国历史上铸造时间最长的钱币。', weight: '3-4g', size: '25-26mm' },
  { id: 17, dynasty: 'han', name: '王莽·一刀平五千', variety: '金错刀', period: '新朝', material: '铜鎏金', rarity: 5, priceRange: '30,000-500,000', desc: '王莽时期铸造，环柄铸"一刀"二字并嵌金，极为精美。', weight: '20-35g', size: '73mm' },
  { id: 18, dynasty: 'han', name: '王莽·货泉', variety: '普通·传形·悬针篆', period: '新朝', material: '青铜', rarity: 2, priceRange: '10-5,000', desc: '王莽末期大量铸行，"泉"取"钱"之意。悬针篆精美者价高。', weight: '2-5g', size: '22-25mm' },
  { id: 19, dynasty: 'han', name: '王莽·大泉五十', variety: '大型·厚肉·契刀形', period: '新朝', material: '青铜', rarity: 2, priceRange: '30-8,000', desc: '当五十枚五铢使用。铸量巨大但版别丰富。', weight: '4-10g', size: '27-28mm' },
  { id: 20, dynasty: 'han', name: '王莽·布泉', variety: '普通·大样', period: '新朝', material: '青铜', rarity: 3, priceRange: '50-5,000', desc: '王莽第四次币制改革所铸，文字优美。', weight: '3-5g', size: '25mm' },
  { id: 21, dynasty: 'han', name: '东汉五铢', variety: '建武五铢·四出五铢·环五铢', period: '东汉', material: '青铜', rarity: 1, priceRange: '5-2,000', desc: '光武帝建武十六年复铸五铢，延续至汉末。四出五铢较珍。', weight: '3-4g', size: '25mm' },

  // ===== 三国 =====
  { id: 22, dynasty: 'three-kingdoms', name: '直百五铢', variety: '普通·大型·背"为"', period: '蜀汉', material: '青铜', rarity: 3, priceRange: '50-15,000', desc: '刘备入蜀后铸造，一枚当百枚五铢。', weight: '5-10g', size: '26-28mm' },
  { id: 23, dynasty: 'three-kingdoms', name: '太平百钱', variety: '普通·当百·背水波纹', period: '蜀汉', material: '青铜', rarity: 3, priceRange: '100-10,000', desc: '蜀汉后期铸造，面文"太平百钱"。', weight: '2-5g', size: '22-25mm' },
  { id: 24, dynasty: 'three-kingdoms', name: '大泉五百', variety: '普通·大型', period: '东吴', material: '青铜', rarity: 3, priceRange: '100-15,000', desc: '东吴孙权嘉禾五年铸，虚值大钱。', weight: '5-12g', size: '28-35mm' },
  { id: 25, dynasty: 'three-kingdoms', name: '大泉当千', variety: '普通·大型·特大型', period: '东吴', material: '青铜', rarity: 4, priceRange: '500-50,000', desc: '东吴铸造的最大面值钱币。存世较少。', weight: '10-25g', size: '35-50mm' },

  // ===== 两晋南北朝 =====
  { id: 26, dynasty: 'jin-southern', name: '太货六铢', variety: '普通·大型·双柱', period: '南朝陈', material: '青铜', rarity: 3, priceRange: '100-10,000', desc: '陈宣帝太建十一年铸，"六"字如"人"，百姓称"太货六铢为人铢"。', weight: '2-4g', size: '24mm' },
  { id: 27, dynasty: 'jin-southern', name: '永通万国', variety: '普通·大型·宽缘', period: '北周', material: '青铜', rarity: 3, priceRange: '200-20,000', desc: '北周静帝大象元年铸。钱文玉箸篆，精美绝伦，北朝第一名品。', weight: '4-6g', size: '28-30mm' },
  { id: 28, dynasty: 'jin-southern', name: '布泉', variety: '北周布泉', period: '北周', material: '青铜', rarity: 3, priceRange: '50-5,000', desc: '北周武帝保定元年铸。玉箸篆书，与"五行大布"并称。', weight: '4-5g', size: '26mm' },
  { id: 29, dynasty: 'jin-southern', name: '五行大布', variety: '普通·大型·合背', period: '北周', material: '青铜', rarity: 3, priceRange: '100-15,000', desc: '北周武帝建德三年铸。玉箸篆书，"北周三泉"之一。', weight: '4-8g', size: '27-28mm' },

  // ===== 隋朝 =====
  { id: 30, dynasty: 'sui', name: '开皇五铢', variety: '隋五铢·大样·小样', period: '隋代', material: '青铜', rarity: 2, priceRange: '20-3,000', desc: '隋文帝开皇元年铸。五铢钱最后一个标准形态。', weight: '3-4g', size: '24-25mm' },

  // ===== 唐朝 =====
  { id: 31, dynasty: 'tang', name: '开元通宝', variety: '初铸大字·容弱·短头元·右挑元·背月·背星·背字', period: '唐代', material: '青铜/银/金', rarity: 1, priceRange: '5-100,000', desc: '唐高祖武德四年铸。废五铢行通宝，开创中国钱币新纪元。金开元极珍。', weight: '3.5-4.5g', size: '24-25mm' },
  { id: 32, dynasty: 'tang', name: '乾封泉宝', variety: '普通·阔缘', period: '唐高宗', material: '青铜', rarity: 3, priceRange: '200-10,000', desc: '乾封元年铸，一枚当十，旋即废止。存世不多。', weight: '4-6g', size: '25mm' },
  { id: 33, dynasty: 'tang', name: '乾元重宝', variety: '初铸·当十·当五十·重轮', period: '唐肃宗', material: '青铜', rarity: 2, priceRange: '20-15,000', desc: '安史之乱后铸造。重轮乾元当五十文极珍。', weight: '4-20g', size: '25-36mm' },
  { id: 34, dynasty: 'tang', name: '得壹元宝', variety: '普通·背月', period: '唐代（史思明）', material: '青铜', rarity: 4, priceRange: '3,000-80,000', desc: '安史之乱时史思明铸。铸期极短，存世稀少。', weight: '5-8g', size: '36-38mm' },
  { id: 35, dynasty: 'tang', name: '顺天元宝', variety: '普通·背月·背星', period: '唐代（史思明）', material: '青铜', rarity: 3, priceRange: '500-30,000', desc: '史思明改国号大燕后铸。较得壹元宝略多。', weight: '5-8g', size: '36mm' },

  // ===== 五代十国 =====
  { id: 36, dynasty: 'five-dynasties', name: '天福元宝', variety: '铜钱·铁钱', period: '后晋', material: '青铜', rarity: 3, priceRange: '100-8,000', desc: '后晋高祖天福三年铸。五代较早的年号钱。', weight: '2-3g', size: '23mm' },
  { id: 37, dynasty: 'five-dynasties', name: '天德重宝', variety: '铜钱·背殷', period: '闽·殷', material: '青铜', rarity: 4, priceRange: '5,000-100,000', desc: '闽国王延政天德三年铸。"背殷"为国号，极珍。', weight: '15-30g', size: '40-42mm' },
  { id: 38, dynasty: 'five-dynasties', name: '乾亨通宝', variety: '铜钱·铅钱', period: '南汉', material: '青铜/铅', rarity: 3, priceRange: '200-15,000', desc: '南汉刘晟乾亨元年铸。铅钱常见，铜钱较少。', weight: '2-4g', size: '24mm' },
  { id: 39, dynasty: 'five-dynasties', name: '天策府宝', variety: '铜钱·铁钱·鎏金', period: '楚', material: '青铜/铁', rarity: 5, priceRange: '20,000-800,000', desc: '楚马殷天策府铸。中国古钱五十名珍之一。鎏金者国宝级。', weight: '30-40g', size: '44mm' },

  // ===== 两宋 =====
  { id: 40, dynasty: 'song', name: '宋元通宝', variety: '小平·铁母·背星月', period: '北宋', material: '青铜', rarity: 2, priceRange: '10-10,000', desc: '宋太祖建隆元年铸。仿开元通宝，宋代第一种铸钱。', weight: '3-4g', size: '25mm' },
  { id: 41, dynasty: 'song', name: '淳化元宝', variety: '行书·草书·楷书·缩水淳化·金质', period: '北宋', material: '青铜/金', rarity: 2, priceRange: '10-500,000', desc: '太宗御书三体钱。2004年五台山出土大量金质淳化。', weight: '3-4g', size: '24mm' },
  { id: 42, dynasty: 'song', name: '崇宁通宝', variety: '小平·折十·铁母·大字·瘦金体', period: '北宋', material: '青铜', rarity: 2, priceRange: '10-50,000', desc: '宋徽宗御书瘦金体，被誉为"中国最美钱币"。', weight: '10-12g', size: '34-35mm' },
  { id: 43, dynasty: 'song', name: '崇宁重宝', variety: '大字·小字·抽示·背星', period: '北宋', material: '青铜', rarity: 2, priceRange: '10-20,000', desc: '崇宁年间铸造的折十大钱。版别极多。', weight: '10-12g', size: '34mm' },
  { id: 44, dynasty: 'song', name: '大观通宝', variety: '小平·折二·折三·折十·铁母', period: '北宋', material: '青铜', rarity: 2, priceRange: '5-80,000', desc: '徽宗大观年间铸。瘦金体书法登峰造极。折十铁母珍罕。', weight: '3-12g', size: '25-42mm' },
  { id: 45, dynasty: 'song', name: '宣和通宝', variety: '小平·折二·铁母·长通·离宝', period: '北宋', material: '青铜', rarity: 2, priceRange: '10-30,000', desc: '徽宗最后年号钱。版别复杂，篆隶行多种书体。', weight: '3-8g', size: '25-30mm' },
  { id: 46, dynasty: 'song', name: '靖康通宝', variety: '小平·折二·折三·元宝', period: '北宋', material: '青铜', rarity: 5, priceRange: '5,000-500,000', desc: '靖康之变，北宋亡。铸期仅一年余，存世极罕，名珍。', weight: '3-10g', size: '25-33mm' },
  { id: 47, dynasty: 'song', name: '建炎通宝', variety: '小平·折二·折三·点建', period: '南宋', material: '青铜', rarity: 3, priceRange: '20-20,000', desc: '南宋高宗建炎元年始铸。"中兴"之初。', weight: '3-8g', size: '25-30mm' },
  { id: 48, dynasty: 'song', name: '淳祐元宝', variety: '背"当百"·铜·铁', period: '南宋', material: '青铜', rarity: 3, priceRange: '50-15,000', desc: '理宗淳祐年间铸。背文"当百"者较珍。', weight: '3-25g', size: '25-50mm' },

  // ===== 辽金西夏 =====
  { id: 49, dynasty: 'liao-jin-xixia', name: '天禄通宝', variety: '普通·大型', period: '辽', material: '青铜', rarity: 5, priceRange: '50,000-500,000', desc: '辽世宗天禄年间铸。辽钱珍品，存世极少。', weight: '3-4g', size: '24mm' },
  { id: 50, dynasty: 'liao-jin-xixia', name: '大安元宝', variety: '篆书·楷书', period: '辽', material: '青铜', rarity: 4, priceRange: '3,000-50,000', desc: '辽道宗大安年间铸。辽钱书法独具北方风格。', weight: '3-4g', size: '24mm' },
  { id: 51, dynasty: 'liao-jin-xixia', name: '正隆元宝', variety: '五笔正·四笔正', period: '金', material: '青铜', rarity: 2, priceRange: '10-3,000', desc: '金海陵王正隆三年铸。金代第一种铸币。', weight: '3-4g', size: '25mm' },
  { id: 52, dynasty: 'liao-jin-xixia', name: '大定通宝', variety: '小平·折二·铁钱·背上酉', period: '金', material: '青铜', rarity: 2, priceRange: '10-15,000', desc: '金世宗大定十八年铸。铸造精美，金代名品。', weight: '3-5g', size: '25-30mm' },
  { id: 53, dynasty: 'liao-jin-xixia', name: '天盛元宝', variety: '小平·折二', period: '西夏', material: '青铜', rarity: 3, priceRange: '30-8,000', desc: '西夏仁宗天盛年间铸。西夏汉文钱代表。', weight: '3-4g', size: '24mm' },
  { id: 54, dynasty: 'liao-jin-xixia', name: '西夏文钱', variety: '天庆宝钱·大安宝钱·乾祐宝钱', period: '西夏', material: '青铜', rarity: 5, priceRange: '10,000-300,000', desc: '以西夏文铸造的独特钱币。辨识度高，存世罕见。', weight: '3-5g', size: '24-26mm' },

  // ===== 元朝 =====
  { id: 55, dynasty: 'yuan', name: '大朝通宝', variety: '银质·铜质', period: '蒙古', material: '银/铜', rarity: 5, priceRange: '10,000-200,000', desc: '蒙古建国号"大朝"时铸。银质极罕。', weight: '2-3g', size: '24mm' },
  { id: 56, dynasty: 'yuan', name: '至元通宝', variety: '蒙文·汉文·供养钱', period: '元', material: '青铜', rarity: 3, priceRange: '50-30,000', desc: '元世祖至元年间铸。蒙汉双文版。', weight: '3-5g', size: '24-27mm' },
  { id: 57, dynasty: 'yuan', name: '大元通宝', variety: '蒙文·八思巴文·大型', period: '元', material: '青铜', rarity: 3, priceRange: '50-20,000', desc: '以八思巴文铸造，元代特色钱币。', weight: '3-10g', size: '25-40mm' },
  { id: 58, dynasty: 'yuan', name: '至正通宝', variety: '小平·折二·折三·折五·折十·背蒙文', period: '元', material: '青铜', rarity: 3, priceRange: '20-50,000', desc: '元惠宗至正年间铸。系列完整，背蒙文记值。', weight: '3-25g', size: '25-50mm' },
  { id: 59, dynasty: 'yuan', name: '天佑通宝', variety: '小平·折二·折三·折五', period: '元末（张士诚）', material: '青铜', rarity: 4, priceRange: '500-50,000', desc: '元末张士诚据苏州时铸。折五大钱珍罕。', weight: '3-15g', size: '25-42mm' },

  // ===== 明朝 =====
  { id: 60, dynasty: 'ming', name: '大中通宝', variety: '小平·折二·折三·折五·折十·背字', period: '明初', material: '青铜', rarity: 3, priceRange: '20-80,000', desc: '朱元璋称吴王时铸。背有"京""浙""鄂"等局名。', weight: '3-35g', size: '25-46mm' },
  { id: 61, dynasty: 'ming', name: '洪武通宝', variety: '小平·折二·折三·折五·折十·背字', period: '明太祖', material: '青铜', rarity: 2, priceRange: '10-50,000', desc: '明代第一种年号钱。五等制完善，背文记局记值。', weight: '3-35g', size: '24-46mm' },
  { id: 62, dynasty: 'ming', name: '永乐通宝', variety: '小平·大型·背三钱', period: '明成祖', material: '青铜', rarity: 2, priceRange: '10-30,000', desc: '郑和下西洋大量携带。在海外有大量发现。', weight: '3-4g', size: '25mm' },
  { id: 63, dynasty: 'ming', name: '宣德通宝', variety: '小平·大型', period: '明宣宗', material: '青铜', rarity: 3, priceRange: '100-15,000', desc: '铸量较少。宣德炉同期名品。', weight: '3-4g', size: '25mm' },
  { id: 64, dynasty: 'ming', name: '嘉靖通宝', variety: '小平·折二·折三·折五·折十·金背', period: '明世宗', material: '青铜', rarity: 2, priceRange: '10-30,000', desc: '嘉靖年间大量铸造。"靖"字多种写法。', weight: '3-25g', size: '25-45mm' },
  { id: 65, dynasty: 'ming', name: '万历通宝', variety: '小平·折二·矿银·背字', period: '明神宗', material: '青铜/银', rarity: 2, priceRange: '5-20,000', desc: '万历年间铸量巨大。银质万历极为珍罕。', weight: '3-8g', size: '24-32mm' },
  { id: 66, dynasty: 'ming', name: '天启通宝', variety: '小平·折二·折十·背字', period: '明熹宗', material: '青铜', rarity: 2, priceRange: '10-30,000', desc: '天启年间铸。版别极多，尤以背文变化著称。', weight: '3-20g', size: '24-45mm' },
  { id: 67, dynasty: 'ming', name: '崇祯通宝', variety: '小平·折二·折五·背字极多', period: '明思宗', material: '青铜', rarity: 2, priceRange: '5-30,000', desc: '明末大量铸造。背文种类为历代之冠，版别数百种。', weight: '3-15g', size: '24-38mm' },

  // ===== 清朝 =====
  { id: 68, dynasty: 'qing', name: '顺治通宝', variety: '光背·单字·背一厘·背满文·满汉文', period: '清世祖', material: '青铜', rarity: 2, priceRange: '10-30,000', desc: '清代第一种制钱。五式分类体系经典。', weight: '3-6g', size: '25-28mm' },
  { id: 69, dynasty: 'qing', name: '康熙通宝', variety: '满汉文二十局·罗汉钱·背大清·龙凤', period: '清圣祖', material: '青铜', rarity: 1, priceRange: '5-50,000', desc: '铸量巨大。集"二十局"为民间雅趣。罗汉钱传为金佛所铸。', weight: '3-5g', size: '26-28mm' },
  { id: 70, dynasty: 'qing', name: '雍正通宝', variety: '各局·宝安·宝川·大字·小字', period: '清世宗', material: '青铜', rarity: 3, priceRange: '30-30,000', desc: '铸造精美但铸量较少。各局风格差异大。', weight: '4-5g', size: '27mm' },
  { id: 71, dynasty: 'qing', name: '乾隆通宝', variety: '各局·山底隆·大样·背花', period: '清高宗', material: '青铜', rarity: 1, priceRange: '5-20,000', desc: '"乾隆"谐音"钱隆"，民间视为吉祥币。', weight: '3-5g', size: '25-27mm' },
  { id: 72, dynasty: 'qing', name: '嘉庆通宝', variety: '各局·大字·小字·长庆', period: '清仁宗', material: '青铜', rarity: 1, priceRange: '5-10,000', desc: '嘉庆年间铸。版别众多，"长庆"版较珍。', weight: '3-5g', size: '25-26mm' },
  { id: 73, dynasty: 'qing', name: '道光通宝', variety: '各局·大样·特大样·背星月', period: '清宣宗', material: '青铜', rarity: 1, priceRange: '5-15,000', desc: '鸦片战争前后铸造。部分局钱制造粗糙。', weight: '3-5g', size: '22-25mm' },
  { id: 74, dynasty: 'qing', name: '咸丰通宝', variety: '小平各局', period: '清文宗', material: '青铜', rarity: 2, priceRange: '10-5,000', desc: '太平天国起义后财政困难。小平钱铸量渐少。', weight: '3-4g', size: '24-25mm' },
  { id: 75, dynasty: 'qing', name: '咸丰重宝', variety: '当五·当十·当五十·各局', period: '清文宗', material: '青铜/铁', rarity: 3, priceRange: '30-100,000', desc: '咸丰大钱系列中的中等面值。当五十者较珍。', weight: '5-40g', size: '28-52mm' },
  { id: 76, dynasty: 'qing', name: '咸丰元宝', variety: '当百·当五百·当千·各局', period: '清文宗', material: '青铜/铁', rarity: 4, priceRange: '500-500,000', desc: '咸丰虚值大钱。当千者为清钱中面值最大，极珍。宝泉局当千可达百万。', weight: '30-80g', size: '50-65mm' },
  { id: 77, dynasty: 'qing', name: '同治通宝', variety: '各局·大样·部颁样钱', period: '清穆宗', material: '青铜', rarity: 2, priceRange: '10-20,000', desc: '同治年间铸。部分局铸量极少。', weight: '3-4g', size: '22-25mm' },
  { id: 78, dynasty: 'qing', name: '光绪通宝', variety: '各局·机制方孔·背满文', period: '清德宗', material: '青铜', rarity: 2, priceRange: '5-15,000', desc: '传统方孔制钱最后阶段。机制方孔为新旧交替。', weight: '2-4g', size: '22-25mm' },
  { id: 79, dynasty: 'qing', name: '宣统通宝', variety: '宝泉·宝蓟·新疆', period: '清末帝', material: '青铜', rarity: 3, priceRange: '20-20,000', desc: '中国最后的方孔钱。宝蓟局较珍。', weight: '2-3g', size: '18-22mm' },
  { id: 80, dynasty: 'qing', name: '太平天国', variety: '圣宝·天国通宝·背"圣宝"', period: '太平天国', material: '青铜', rarity: 3, priceRange: '50-100,000', desc: '太平天国政权铸造。版别种类丰富。大花钱极珍。', weight: '3-30g', size: '24-60mm' },

  // ===== 机制币 =====
  { id: 81, dynasty: 'jizhi', name: '光绪元宝·广东省造·七钱二分', variety: '首版·反版龙·寿字·喜敦版', period: '光绪', material: '银', rarity: 3, priceRange: '800-300,000', desc: '中国最早的机制银币之一。广东钱局张之洞主持。', weight: '26.7g', size: '39mm' },
  { id: 82, dynasty: 'jizhi', name: '光绪元宝·湖北省造·七钱二分', variety: '普通·本省·花边', period: '光绪', material: '银', rarity: 3, priceRange: '500-200,000', desc: '湖北银元局铸。"本省"二字版极珍。', weight: '26.7g', size: '39mm' },
  { id: 83, dynasty: 'jizhi', name: '光绪元宝·北洋造·34年', variety: '短尾龙·长尾龙·开云版', period: '光绪三十四年', material: '银', rarity: 2, priceRange: '500-50,000', desc: '北洋机器局/银元局铸。34年存世最多。', weight: '26.7g', size: '39mm' },
  { id: 84, dynasty: 'jizhi', name: '造币总厂·光绪元宝·七钱二分', variety: '普通·无点·有点', period: '光绪', material: '银', rarity: 3, priceRange: '1,500-80,000', desc: '天津造币总厂铸。统一币制的尝试。', weight: '26.7g', size: '39mm' },
  { id: 85, dynasty: 'jizhi', name: '大清银币·宣统三年', variety: '长须龙·短须龙·反龙·大尾龙·曲须龙·签字版', period: '宣统三年', material: '银', rarity: 3, priceRange: '1,000-3,000,000', desc: '清末统一国币方案。长须龙为流通版，签字版L.GIORGI极珍。', weight: '26.9g', size: '39mm' },
  { id: 86, dynasty: 'jizhi', name: '袁世凯像·壹圆（袁大头）', variety: '三年·八年·九年·十年·签字版·O版·三角圆', period: '民国', material: '银', rarity: 1, priceRange: '500-5,000,000', desc: '中国近代流通最广的银元。签字版L.GIORGI极珍，可达数百万。', weight: '26.6g', size: '39mm' },
  { id: 87, dynasty: 'jizhi', name: '孙中山像·开国纪念币', variety: '上五星·下五星·六角星·英文签字版', period: '民国', material: '银', rarity: 2, priceRange: '300-2,000,000', desc: '孙中山像开国纪念银币。六角星版较珍。', weight: '26.6g', size: '39mm' },
  { id: 88, dynasty: 'jizhi', name: '孙中山像·壹圆·二十三年', variety: '船洋·帆船·三鸟', period: '民国二十三年', material: '银', rarity: 2, priceRange: '300-100,000', desc: '"船洋"。三鸟版因日形似日本国旗而被回收，极珍。', weight: '26.7g', size: '39mm' },
  { id: 89, dynasty: 'jizhi', name: '四川卢比', variety: '一期·二期·三期·四期', period: '光绪-民国', material: '银', rarity: 3, priceRange: '200-30,000', desc: '仿印度卢比在四川藏区流通。光绪像。', weight: '11.5g', size: '30mm' },
  { id: 90, dynasty: 'jizhi', name: '湖南省造·光绪元宝·七钱二分', variety: '普通·阔缘·窄缘', period: '光绪', material: '银', rarity: 4, priceRange: '5,000-500,000', desc: '湖南省铸银元较少，存世稀少。', weight: '26.7g', size: '39mm' },
  { id: 91, dynasty: 'jizhi', name: '光绪元宝·户部·一两', variety: '普通版', period: '光绪二十九年', material: '银', rarity: 5, priceRange: '50,000-3,000,000', desc: '户部铸"一两"银币，未正式流通。极珍罕。', weight: '37.3g', size: '43mm' },
  { id: 92, dynasty: 'jizhi', name: '大清铜币', variety: '中心各省·二十文·十文·五文·二文', period: '光绪-宣统', material: '铜', rarity: 1, priceRange: '5-30,000', desc: '清末统一铜元。各省中心字不同，版别极多。', weight: '5-15g', size: '28-33mm' },
  { id: 93, dynasty: 'jizhi', name: '光绪元宝·铜元·各省', variety: '广东·湖北·江南·安徽·清江等', period: '光绪', material: '铜', rarity: 1, priceRange: '5-50,000', desc: '各省自铸铜元。飞龙版、错版、样币价高。', weight: '5-10g', size: '28-30mm' },

  // ===== 民国 =====
  { id: 94, dynasty: 'minguo', name: '孙中山像·壹圆·二十一年', variety: '三鸟·金本位·签字版', period: '民国二十一年', material: '银', rarity: 4, priceRange: '5,000-2,000,000', desc: '"三鸟币"。面额为壹圆。因图案争议被快速回收。', weight: '26.7g', size: '39mm' },
  { id: 95, dynasty: 'minguo', name: '袁世凯像·飞龙纪念币', variety: '签字版·无签字', period: '民国', material: '银', rarity: 5, priceRange: '50,000-8,000,000', desc: '袁世凯就任大总统纪念币。签字版L.GIORGI为中国银币大珍。', weight: '26.6g', size: '39mm' },
  { id: 96, dynasty: 'minguo', name: '段祺瑞像·执政纪念币', variety: '普通·签字版', period: '民国', material: '银', rarity: 4, priceRange: '5,000-500,000', desc: '段祺瑞就任执政纪念。铸量较少。', weight: '26.6g', size: '39mm' },
  { id: 97, dynasty: 'minguo', name: '张作霖像·壹圆', variety: '十五年·十六年·大元帅', period: '民国', material: '银', rarity: 5, priceRange: '100,000-10,000,000', desc: '民国军阀币中最珍贵。十六年大元帅为中国银币第一大珍。', weight: '26.6g', size: '39mm' },
  { id: 98, dynasty: 'minguo', name: '徐世昌像·仁寿同登纪念币', variety: '无帽·有帽', period: '民国', material: '银', rarity: 4, priceRange: '10,000-800,000', desc: '纪念徐世昌就任大总统。背"仁寿同登"四字。', weight: '26.6g', size: '39mm' },
  { id: 99, dynasty: 'minguo', name: '曹锟像·宪法纪念币', variety: '普通·签字版', period: '民国', material: '银', rarity: 4, priceRange: '5,000-300,000', desc: '纪念曹锟贿选总统。铸量有限。', weight: '26.6g', size: '39mm' },
  { id: 100, dynasty: 'minguo', name: '贵州竹子币', variety: '壹圆·半圆·汽车币', period: '民国', material: '银', rarity: 4, priceRange: '3,000-500,000', desc: '贵州省铸。"汽车币"背面汽车图案独特，极珍。', weight: '26g', size: '39mm' },
];

// 拍卖成交纪录
const AUCTION_RECORDS = [
  { coin: '张作霖像·大元帅·壹圆', dynasty: '民国', house: '北京诚轩', date: '2024-05', grade: 'PCGS MS65', price: '¥89,700,000', priceUSD: '$12,380,000', img: '🎖️' },
  { coin: '袁世凯像·飞龙纪念币·签字版', dynasty: '民国', house: 'Heritage', date: '2023-08', grade: 'PCGS SP65', price: '¥56,800,000', priceUSD: '$7,840,000', img: '⚙️' },
  { coin: '光绪元宝·户部一两', dynasty: '机制币', house: '中国嘉德', date: '2024-11', grade: 'PCGS SP63', price: '¥38,500,000', priceUSD: '$5,320,000', img: '⚙️' },
  { coin: '大清银币·长须龙·签字版', dynasty: '机制币', house: 'SBP', date: '2023-04', grade: 'PCGS SP64', price: '¥28,600,000', priceUSD: '$3,950,000', img: '🐉' },
  { coin: '天策府宝·鎏金', dynasty: '五代十国', house: '中国嘉德', date: '2024-06', grade: '极美品', price: '¥18,200,000', priceUSD: '$2,510,000', img: '🔥' },
  { coin: '靖康通宝·折三', dynasty: '两宋', house: '西泠印社', date: '2023-12', grade: '美品', price: '¥12,800,000', priceUSD: '$1,770,000', img: '📜' },
  { coin: '王莽·一刀平五千·金错刀', dynasty: '两汉', house: '北京保利', date: '2024-03', grade: '完整鎏金', price: '¥8,600,000', priceUSD: '$1,190,000', img: '🏛️' },
  { coin: '袁大头·三年·签字版', dynasty: '机制币', house: 'Heritage', date: '2024-01', grade: 'PCGS MS66', price: '¥6,900,000', priceUSD: '$952,000', img: '⚙️' },
  { coin: '咸丰元宝·宝泉当千', dynasty: '清朝', house: '华夏古泉', date: '2024-08', grade: '极美品', price: '¥5,200,000', priceUSD: '$718,000', img: '🐉' },
  { coin: '郢爰·楚金版', dynasty: '先秦', house: '中国嘉德', date: '2023-11', grade: '完整16印', price: '¥4,800,000', priceUSD: '$663,000', img: '🐚' },
  { coin: '崇宁通宝·铁母', dynasty: '两宋', house: '北京诚轩', date: '2024-05', grade: '极美品', price: '¥3,500,000', priceUSD: '$483,000', img: '📜' },
  { coin: '齐大刀·六字刀', dynasty: '先秦', house: '西泠印社', date: '2024-02', grade: '美品', price: '¥2,800,000', priceUSD: '$387,000', img: '🐚' },
  { coin: '贵州汽车币·壹圆', dynasty: '民国', house: 'SBP', date: '2023-09', grade: 'PCGS AU55', price: '¥2,300,000', priceUSD: '$318,000', img: '🎖️' },
  { coin: '大观通宝·折十·铁母', dynasty: '两宋', house: '华夏古泉', date: '2024-07', grade: '极美品', price: '¥1,850,000', priceUSD: '$255,000', img: '📜' },
  { coin: '天德重宝·背殷·大型', dynasty: '五代十国', house: '中国嘉德', date: '2024-04', grade: '美品', price: '¥1,600,000', priceUSD: '$221,000', img: '🔥' },
  { coin: '永通万国·大型', dynasty: '两晋南北朝', house: '北京保利', date: '2023-06', grade: '极美品', price: '¥1,200,000', priceUSD: '$166,000', img: '🏔️' },
  { coin: '得壹元宝·背月', dynasty: '唐朝', house: '北京诚轩', date: '2024-10', grade: '美品', price: '¥980,000', priceUSD: '$135,000', img: '🌙' },
  { coin: '西夏文·乾祐宝钱', dynasty: '辽金西夏', house: '西泠印社', date: '2024-01', grade: '美品', price: '¥860,000', priceUSD: '$119,000', img: '🏇' },
  { coin: '三孔布·下曲阳', dynasty: '先秦', house: '中国嘉德', date: '2023-05', grade: '美品', price: '¥4,200,000', priceUSD: '$580,000', img: '🐚' },
  { coin: '船洋·二十三年·MS66', dynasty: '机制币', house: 'Heritage', date: '2024-09', grade: 'PCGS MS66+', price: '¥680,000', priceUSD: '$94,000', img: '⚙️' },
];
