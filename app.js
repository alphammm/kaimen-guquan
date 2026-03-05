// ============================================
// 祥晋古泉 — 全交互逻辑
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initHeroCoins();
  initScrollAnimations();
  initDynastyNav();
  initCoinCards();
  initFamousCoins();
  initAuctionShowcase();
  initAuctionTable();
  initGuquanYayu();
  initAIAppraisal();
  initSearch();
  initModal();
  initCountUp();
  initNavScroll();
  initKnowledge();
  initTimeline();
  initStatsClick();
});

// ===== Hero (photo background handled by CSS/HTML) =====
function initHeroCoins() {
  // Photo background now handled directly in HTML/CSS
  // No JS initialization needed
}

// ===== Auction Top Records Showcase =====
function initAuctionShowcase() {
  const container = document.getElementById('auctionShowcase');
  if (!container || typeof AUCTION_RECORDS === 'undefined') return;
  // Curate 8 diverse, representative high-value records with distinct images
  const showcaseCoins = [
    '奉天癸卯一两银币样币',           // ¥46,575,000 — guangXu
    '宣统三年·大清银币·长须龙样币·阴叶', // ¥19,800,000 — daQingYinBi
    '上海中外通宝·壹两',              // ¥19,320,000 — shanghaiTael
    '孙中山像·地球双旗·壹圆样币',      // ¥17,250,000 — sunYatSen
    '袁世凯像·壹圆·七分脸签字版',      // ¥4,600,000 — yuanShiKai
    '广东省造·寿字壹两·双龙',          // ¥2,300,000 — kwangtungDragon
    '段祺瑞像·执政纪念币',            // ¥1,725,000 — duanQirui
    '三孔布·上尃',                    // ¥1,380,000 — sanKongBu
  ];
  const sorted = showcaseCoins
    .map(name => AUCTION_RECORDS.find(r => r.coin === name))
    .filter(Boolean);

  container.innerHTML = sorted.map((r, i) => {
    const imgSrc = findCoinImg(r);
    return `
      <div class="auction-showcase-card" onclick="openAuctionDetail(${AUCTION_RECORDS.indexOf(r)})">
        <span class="asc-rank">${i + 1}</span>
        <div class="asc-img">
          ${imgSrc ? `<img src="${imgSrc}" alt="${r.coin}" onerror="this.outerHTML='<span style=font-size:60px;opacity:0.3>&#x1FA99;</span>'">` : '<span style="font-size:60px;opacity:0.3">&#x1FA99;</span>'}
        </div>
        <div class="asc-body">
          <div class="asc-name">${r.coin}</div>
          <div class="asc-meta">${r.house} · ${r.date} · ${r.grade}</div>
          <div class="asc-price">${r.price}</div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== 通用弹窗 =====
function showModal(html) {
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modalContent');
  modal.innerHTML = html;
  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

function initModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
}

// ===== Scroll Animations =====
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ===== Nav =====
function initNavScroll() {
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 100 ? 'rgba(67,27,31,0.98)' : 'rgba(67,27,31,0.96)';
  });
}

function toggleMobileNav() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  if (links.style.display === 'flex') {
    Object.assign(links.style, {
      position: 'absolute', top: '64px', left: '0', right: '0',
      background: 'rgba(26,26,26,0.98)', flexDirection: 'column',
      padding: '20px 24px', gap: '16px', borderBottom: '1px solid rgba(197,165,90,0.2)'
    });
  }
}

// ===== Stats 点击跳转 =====
function initStatsClick() {
  // Hero stats
  document.querySelectorAll('.hero-stat').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const label = el.querySelector('.hero-stat-label')?.textContent;
      if (label?.includes('钱币')) document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
      else if (label?.includes('朝代')) document.getElementById('about')?.scrollIntoView({behavior:'smooth'});
      else if (label?.includes('拍卖')) document.getElementById('auction')?.scrollIntoView({behavior:'smooth'});
      else if (label?.includes('历史')) document.getElementById('about')?.scrollIntoView({behavior:'smooth'});
    });
  });
  // Stats bar items
  document.querySelectorAll('.stats-grid > div').forEach(el => {
    el.style.cursor = 'pointer';
    el.addEventListener('click', () => {
      const label = el.querySelector('.stat-item-label')?.textContent || '';
      const mapping = {'先秦':'pre-qin','秦汉':'qin','宋辽':'song','清代':'qing','机制':'jizhi'};
      for (const [key, val] of Object.entries(mapping)) {
        if (label.includes(key)) {
          // Click the dynasty chip
          const chip = document.querySelector(`.dynasty-chip[href="#${val}"]`);
          if (chip) chip.click();
          document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
          return;
        }
      }
      document.getElementById('catalog')?.scrollIntoView({behavior:'smooth'});
    });
  });
}

// ===== Dynasty Navigation =====
function initDynastyNav() {
  document.querySelectorAll('.dynasty-chip').forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.dynasty-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const targetId = chip.getAttribute('href').substring(1);
      renderCoins(targetId === 'all' ? COINS : COINS.filter(c => c.dynasty === targetId));
      document.getElementById('coinGrid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ===== Famous Coins 名誉品 =====
function initFamousCoins() {
  const grid = document.getElementById('famousGrid');
  if (!grid || typeof FAMOUS_COINS === 'undefined') return;

  grid.innerHTML = FAMOUS_COINS.map((coin, i) => `
    <div class="famous-card" onclick="openFamousCoinDetail(${i})">
      <div class="famous-card-img">
        ${coin.img
          ? `<img src="${coin.img}" alt="${coin.name}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span style="display:none;font-size:60px">🪙</span>`
          : `<span style="font-size:60px">🪙</span>`}
        <span class="famous-card-era">${coin.era}</span>
      </div>
      <div class="famous-card-body">
        <div class="famous-card-name">${coin.name}</div>
        <div class="famous-card-sub">${coin.sub}</div>
        <div class="famous-card-desc">${coin.desc}</div>
        <div class="famous-card-price">${coin.price} <small>参考价</small></div>
      </div>
    </div>
  `).join('');
}

function openFamousCoinDetail(index) {
  const fc = FAMOUS_COINS[index];
  if (!fc) return;
  // Try to find matching coin
  const match = COINS.find(c => fc.name.includes(c.name.split('·')[0]) || c.name.includes(fc.name.split('·')[0]));
  if (match) { openCoinModal(match.id); return; }
  // Fallback modal
  showModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-header">
      <div class="modal-coin-img" style="background:#1a1a1a">
        ${fc.img ? `<img src="${fc.img}" style="width:80%;height:80%;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))">` : '<span style="font-size:80px">🪙</span>'}
      </div>
      <div class="modal-coin-info">
        <div class="modal-coin-name">${fc.name}</div>
        <div class="modal-coin-sub">${fc.sub}</div>
        <div class="modal-tags"><span class="modal-tag">${fc.era}</span></div>
        <div style="font-family:'Noto Serif SC',serif;font-size:20px;font-weight:700;color:#8B3A3A">
          ${fc.price} <span style="font-size:13px;font-weight:400;color:#888">市场参考价</span>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section"><h4>简介</h4><p style="font-size:14px;line-height:1.8;color:#4A4A4A">${fc.desc}</p></div>
    </div>
  `);
}

// ===== Coin Cards =====
function initCoinCards() { renderCoins(COINS); }

function renderCoins(coins) {
  const grid = document.getElementById('coinGrid');
  if (!grid) return;

  grid.innerHTML = coins.map(coin => {
    const dynasty = DYNASTIES.find(d => d.id === coin.dynasty);
    const stars = Array.from({length: 5}, (_, i) => `<span class="star ${i < coin.rarity ? '' : 'empty'}">★</span>`).join('');
    const imgContent = coin.img
      ? `<img src="${coin.img}" alt="${coin.name}" loading="lazy" style="width:70%;height:70%;object-fit:contain;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.15))" onerror="this.style.display='none';this.nextElementSibling.style.display='block'"><span class="coin-emoji" style="display:none">${dynasty ? dynasty.icon : '🪙'}</span>`
      : `<span class="coin-emoji">${dynasty ? dynasty.icon : '🪙'}</span>`;

    return `
      <div class="coin-card fade-up visible" onclick="openCoinModal(${coin.id})">
        <div class="coin-card-img">
          ${imgContent}
          <span class="coin-card-dynasty">${dynasty ? dynasty.name : ''}</span>
          ${coin.rarity >= 4 ? '<span class="coin-card-grade">珍</span>' : ''}
        </div>
        <div class="coin-card-body">
          <div class="coin-card-name">${coin.name}</div>
          <div class="coin-card-variety">${coin.variety}</div>
          <div class="coin-card-meta">
            <span class="coin-card-price">¥${coin.priceRange} <small>参考价</small></span>
            <span class="coin-card-rarity">${stars}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ===== Coin Modal =====
function openCoinModal(coinId) {
  const coin = COINS.find(c => c.id === coinId);
  if (!coin) return;

  const dynasty = DYNASTIES.find(d => d.id === coin.dynasty);
  const relatedAuctions = AUCTION_RECORDS.filter(r =>
    r.coin.includes(coin.name.split('·')[0]) || coin.name.includes(r.coin.split('·')[0])
  );
  const stars = Array.from({length: 5}, (_, i) => `<span class="star ${i < coin.rarity ? '' : 'empty'}">★</span>`).join('');
  const imgContent = coin.img
    ? `<img src="${coin.img}" alt="${coin.name}" style="width:80%;height:80%;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3))" onerror="this.outerHTML='<span style=font-size:80px>${dynasty ? dynasty.icon : '🪙'}</span>'">`
    : `<span style="font-size:80px">${dynasty ? dynasty.icon : '🪙'}</span>`;

  // Find same-dynasty coins for "相关钱币"
  const relatedCoins = COINS.filter(c => c.dynasty === coin.dynasty && c.id !== coin.id).slice(0, 4);

  showModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-header">
      <div class="modal-coin-img" ${coin.img ? 'style="background:linear-gradient(135deg, #2d2520, #1a1a1a)"' : ''}>
        ${imgContent}
      </div>
      <div class="modal-coin-info">
        <div class="modal-coin-name">${coin.name}</div>
        <div class="modal-coin-sub">${coin.variety}</div>
        <div class="modal-tags">
          <span class="modal-tag">${dynasty ? dynasty.name : ''}</span>
          <span class="modal-tag">${coin.period}</span>
          <span class="modal-tag">${coin.material}</span>
          <span class="modal-tag">稀有度 ${stars}</span>
        </div>
        <div style="font-family:'Noto Serif SC',serif;font-size:20px;font-weight:700;color:#8B3A3A">
          ¥${coin.priceRange} <span style="font-size:13px;font-weight:400;color:#888">市场参考价</span>
        </div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <h4>钱币简介</h4>
        <p style="font-size:14px;line-height:1.8;color:#4A4A4A">${coin.desc}</p>
      </div>
      <div class="modal-section">
        <h4>基本信息</h4>
        <div class="modal-detail-grid">
          <div class="modal-detail-item"><span class="modal-detail-label">朝代</span><span class="modal-detail-value">${dynasty ? dynasty.name : '-'}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">年代</span><span class="modal-detail-value">${coin.period}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">材质</span><span class="modal-detail-value">${coin.material}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">重量</span><span class="modal-detail-value">${coin.weight || '-'}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">尺寸</span><span class="modal-detail-value">${coin.size || '-'}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">稀有度</span><span class="modal-detail-value">${'★'.repeat(coin.rarity)}${'☆'.repeat(5-coin.rarity)}</span></div>
        </div>
      </div>
      ${relatedAuctions.length > 0 ? `
        <div class="modal-section">
          <h4>拍卖成交纪录</h4>
          ${relatedAuctions.map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 14px;background:rgba(0,0,0,0.03);border-radius:8px;margin-bottom:8px;font-size:13px;border:1px solid rgba(0,0,0,0.04)">
              <div><div style="font-weight:600;color:#2C2418">${r.coin}</div><div style="color:#888;font-size:12px;margin-top:2px">${r.house} · ${r.date} · ${r.grade}</div></div>
              <div style="text-align:right"><div style="font-weight:700;color:#8B3A3A;font-size:15px">${r.price}</div><div style="color:#888;font-size:11px">${r.priceUSD}</div></div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      ${relatedCoins.length > 0 ? `
        <div class="modal-section">
          <h4>同朝代钱币</h4>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
            ${relatedCoins.map(rc => `
              <div onclick="closeModal();setTimeout(()=>openCoinModal(${rc.id}),300)" style="padding:12px;background:rgba(0,0,0,0.02);border-radius:8px;cursor:pointer;border:1px solid rgba(0,0,0,0.04);transition:all 0.2s" onmouseover="this.style.borderColor='#C5A55A'" onmouseout="this.style.borderColor='rgba(0,0,0,0.04)'">
                <div style="font-family:'Noto Serif SC',serif;font-size:14px;font-weight:600">${rc.name}</div>
                <div style="font-size:12px;color:#6B5E4F;margin-top:2px">${rc.variety}</div>
                <div style="font-size:13px;color:#8B3A3A;font-weight:600;margin-top:4px">¥${rc.priceRange}</div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `);
}

// ===== Auction Table (可点击每一行) =====
function initAuctionTable() {
  renderAuctions(AUCTION_RECORDS);
  document.querySelectorAll('.auction-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.auction-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      if (filter === 'all') { renderAuctions(AUCTION_RECORDS); return; }
      const filtered = AUCTION_RECORDS.filter(r => r.dynasty === filter || r.house.includes(filter));
      renderAuctions(filtered.length > 0 ? filtered : AUCTION_RECORDS);
    });
  });
}

function findCoinImg(r) {
  if (r.imgUrl) return r.imgUrl;
  // Try matching from COINS or FAMOUS_COINS
  const keyword = r.coin.split('·')[0].replace(/像|省造|年/g, '');
  const match = COINS.find(c => r.coin.includes(c.name.split('·')[0]) || c.name.includes(keyword));
  if (match?.img) return match.img;
  const fmatch = FAMOUS_COINS.find(c => r.coin.includes(c.name.split('·')[0]) || c.name.includes(keyword));
  if (fmatch?.img) return fmatch.img;
  // Fallback by dynasty keyword
  if (r.coin.includes('袁世凯') || r.coin.includes('袁大头')) return IMG.yuanShiKai;
  if (r.coin.includes('张作霖')) return IMG.yuanShiKai;
  if (r.coin.includes('孙中山') || r.coin.includes('船洋')) return IMG.sunYatSen;
  if (r.coin.includes('光绪元宝')) return IMG.guangXu;
  if (r.coin.includes('大清银币') || r.coin.includes('宣统')) return IMG.daQingYinBi;
  if (r.coin.includes('段祺瑞')) return IMG.duanQirui;
  if (r.coin.includes('曹锟')) return IMG.caoKun;
  if (r.coin.includes('徐世昌')) return IMG.xuShichang;
  if (r.coin.includes('洪宪')) return IMG.hongxianFeiLong;
  if (r.coin.includes('开国纪念')) return IMG.sunMemento;
  if (r.coin.includes('贵州') || r.coin.includes('竹子')) return IMG.kweichowAuto;
  if (r.coin.includes('四川卢比')) return IMG.sichuanRupee;
  if (r.coin.includes('崇宁')) return IMG.chongNing;
  if (r.coin.includes('咸丰')) return IMG.xianfengDangQian;
  if (r.coin.includes('靖康')) return IMG.jingKang;
  if (r.coin.includes('大观')) return IMG.daGuan;
  if (r.coin.includes('开元')) return IMG.kaiYuan;
  if (r.coin.includes('王莽') || r.coin.includes('一刀')) return IMG.wangMangYiDao;
  if (r.coin.includes('西藏') || r.coin.includes('雪岗')) return IMG.xueGang;
  if (r.coin.includes('新疆')) return IMG.xinjiangXiangYin;
  if (r.coin.includes('上海一两') || r.coin.includes('上海壹两')) return IMG.shanghaiTael;
  if (r.coin.includes('广东') || r.coin.includes('双龙寿')) return IMG.kwangtungDragon;
  if (r.coin.includes('湖北')) return IMG.hubeiSilver;
  if (r.coin.includes('北洋')) return IMG.guangxuSilver;
  if (r.coin.includes('造币总厂')) return IMG.guangxuDragon;
  if (r.coin.includes('奉天')) return IMG.guangxuDragon;
  if (r.coin.includes('福建')) return IMG.guangxuSilver;
  if (r.coin.includes('浙江')) return IMG.guangxuSilver;
  if (r.coin.includes('陕西')) return IMG.guangxuDragon;
  if (r.coin.includes('湖南')) return IMG.guangxuSilver;
  if (r.coin.includes('江南')) return IMG.guangxuSilver;
  if (r.coin.includes('户部')) return IMG.guangxuDragon;
  if (r.coin.includes('雍正')) return IMG.yongZheng;
  if (r.coin.includes('康熙')) return IMG.kangxi;
  if (r.coin.includes('顺治')) return IMG.shunzhi;
  if (r.coin.includes('乾隆')) return IMG.qianlong;
  if (r.coin.includes('三孔布')) return IMG.sanKongBu;
  if (r.coin.includes('郢爰')) return IMG.yingYuan;
  if (r.coin.includes('永乐')) return IMG.yongle;
  if (r.coin.includes('淳化')) return IMG.chunhuaBack;
  if (r.coin.includes('川陕') || r.coin.includes('川字')) return IMG.chuanYang;
  if (r.coin.includes('大清铜')) return IMG.daQingCopper;
  // Dynasty-level fallbacks
  if (r.dynasty === '机制币') return IMG.guangXu;
  if (r.dynasty === '民国') return IMG.yuanShiKai;
  if (r.dynasty === '清朝' || r.dynasty === '清代') return IMG.qianlong;
  if (r.dynasty === '两宋' || r.dynasty === '北宋' || r.dynasty === '南宋') return IMG.chongNing;
  if (r.dynasty === '唐朝' || r.dynasty === '唐代') return IMG.kaiYuan;
  return IMG.kaiYuan; // ultimate fallback
}

function renderAuctions(records) {
  const tbody = document.getElementById('auctionBody');
  if (!tbody) return;
  tbody.innerHTML = records.map((r, i) => {
    const globalIdx = AUCTION_RECORDS.indexOf(r);
    const imgSrc = findCoinImg(r);
    const thumb = imgSrc ? `<img src="${imgSrc}" style="width:32px;height:32px;border-radius:6px;object-fit:cover;vertical-align:middle;margin-right:8px;border:1px solid rgba(197,165,90,0.2)" onerror="this.style.display='none'">` : '';
    return `
    <tr onclick="openAuctionDetail(${globalIdx})" style="cursor:pointer">
      <td style="color:rgba(245,240,232,0.4)">${i + 1}</td>
      <td class="coin-name-cell">${thumb}${r.coin}</td>
      <td><span class="auction-house-tag">${r.house}</span></td>
      <td>${r.date}</td>
      <td><span class="grade-tag">${r.grade}</span></td>
      <td class="price-cell">${r.price}</td>
      <td style="color:rgba(245,240,232,0.5)">${r.priceUSD}</td>
    </tr>`;
  }).join('');
}

function openAuctionDetail(index) {
  const r = AUCTION_RECORDS[index];
  if (!r) return;

  // Try to find matching coin
  const match = COINS.find(c =>
    r.coin.includes(c.name.split('·')[0]) || c.name.includes(r.coin.split('·')[0])
  );

  const dynasty = match ? DYNASTIES.find(d => d.id === match.dynasty) : null;
  const allSameHouse = AUCTION_RECORDS.filter(a => a.house === r.house && a !== r).slice(0, 3);

  showModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-header">
      <div class="modal-coin-img" style="background:linear-gradient(135deg, #2d2520, #1a1a1a)">
        ${findCoinImg(r)
          ? `<img src="${findCoinImg(r)}" style="width:80%;height:80%;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5))" onerror="this.outerHTML='<span style=font-size:80px>🪙</span>'">`
          : `<span style="font-size:80px">🪙</span>`}
      </div>
      <div class="modal-coin-info">
        <div class="modal-coin-name">${r.coin}</div>
        <div class="modal-coin-sub">${r.dynasty}</div>
        <div class="modal-tags">
          <span class="modal-tag">${r.house}</span>
          <span class="modal-tag">${r.date}</span>
          <span class="modal-tag">${r.grade}</span>
        </div>
        <div style="font-family:'Noto Serif SC',serif;font-size:24px;font-weight:700;color:#8B3A3A">
          ${r.price}
        </div>
        <div style="font-size:14px;color:#888;margin-top:4px">${r.priceUSD}</div>
      </div>
    </div>
    <div class="modal-body">
      <div class="modal-section">
        <h4>拍卖详情</h4>
        <div class="modal-detail-grid">
          <div class="modal-detail-item"><span class="modal-detail-label">拍卖行</span><span class="modal-detail-value">${r.house}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">拍卖日期</span><span class="modal-detail-value">${r.date}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">评级</span><span class="modal-detail-value">${r.grade}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">朝代</span><span class="modal-detail-value">${r.dynasty}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">成交价(CNY)</span><span class="modal-detail-value" style="color:#8B3A3A">${r.price}</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">成交价(USD)</span><span class="modal-detail-value">${r.priceUSD}</span></div>
        </div>
      </div>
      ${match ? `
        <div class="modal-section">
          <h4>钱币资料</h4>
          <p style="font-size:14px;line-height:1.8;color:#4A4A4A">${match.desc}</p>
          <div style="margin-top:12px">
            <span style="display:inline-block;padding:6px 16px;background:rgba(197,165,90,0.1);border:1px solid rgba(197,165,90,0.3);border-radius:20px;cursor:pointer;font-size:13px;color:#C5A55A;font-weight:600" onclick="closeModal();setTimeout(()=>openCoinModal(${match.id}),300)">
              查看「${match.name}」完整资料 →
            </span>
          </div>
        </div>
      ` : ''}
      ${allSameHouse.length > 0 ? `
        <div class="modal-section">
          <h4>${r.house} 其他成交</h4>
          ${allSameHouse.map((a, ai) => `
            <div onclick="closeModal();setTimeout(()=>openAuctionDetail(${AUCTION_RECORDS.indexOf(a)}),300)" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:rgba(0,0,0,0.02);border-radius:6px;margin-bottom:6px;font-size:13px;cursor:pointer;border:1px solid rgba(0,0,0,0.04);transition:border-color 0.2s" onmouseover="this.style.borderColor='#C5A55A'" onmouseout="this.style.borderColor='rgba(0,0,0,0.04)'">
              <span style="font-weight:500">${a.coin}</span>
              <span style="font-weight:700;color:#8B3A3A">${a.price}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `);
}

// ===== 古泉祥晋 Section =====
function initGuquanYayu() {
  renderYayuSources();
}

function renderYayuSources() {
  const container = document.getElementById('yayuSources');
  if (!container || typeof GUQUAN_YAYU_CONFIG === 'undefined') return;
  container.innerHTML = GUQUAN_YAYU_CONFIG.sources.map((s, i) => `
    <div class="yayu-source-card" onclick="openSourceDetail(${i})" style="cursor:pointer">
      <span class="yayu-source-dot ${s.type}"></span>
      <span class="yayu-source-name">${s.name}</span>
      <span class="yayu-source-count">${s.records}</span>
      ${s.volume ? `<span class="yayu-source-volume">${s.volume}</span>` : ''}
    </div>
  `).join('');
}

function openSourceDetail(index) {
  const s = GUQUAN_YAYU_CONFIG.sources[index];
  if (!s) return;
  // Find auction records — aggregators show all, direct sources match by name
  const records = s.type === 'aggregator'
    ? AUCTION_RECORDS.slice(0, 30)
    : AUCTION_RECORDS.filter(r => r.house.includes(s.name) || s.name.includes(r.house));

  showModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div style="padding:32px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px">
        <span style="width:12px;height:12px;border-radius:50%;background:${s.type==='aggregator'?'#3B6E8F':'#4A7C59'}"></span>
        <h2 style="font-family:var(--font-brush);font-size:28px;color:#2C2418">${s.name}</h2>
        <span style="padding:4px 12px;background:${s.type==='aggregator'?'rgba(59,110,143,0.15)':'rgba(74,124,89,0.15)'};color:${s.type==='aggregator'?'#3B6E8F':'#4A7C59'};border-radius:12px;font-size:12px;font-weight:600">${s.type==='aggregator'?'数据聚合':'直连拍卖行'}</span>
      </div>
      <div class="modal-detail-grid" style="margin-bottom:24px">
        <div class="modal-detail-item"><span class="modal-detail-label">数据来源类型</span><span class="modal-detail-value">${s.type==='aggregator'?'聚合平台 (含50+拍卖行)':'拍卖行直连'}</span></div>
        <div class="modal-detail-item"><span class="modal-detail-label">收录记录数</span><span class="modal-detail-value" style="color:#8B3A3A">${s.records}</span></div>
        ${s.volume ? `<div class="modal-detail-item"><span class="modal-detail-label">成交总额</span><span class="modal-detail-value" style="color:#8B3A3A;font-weight:700">${s.volume}</span></div>` : ''}
        ${s.houses ? `<div class="modal-detail-item" style="grid-column:span 2"><span class="modal-detail-label">覆盖拍卖行</span><span class="modal-detail-value">${s.houses}家</span></div>` : ''}
      </div>
      ${records.length > 0 ? `
        <h4 style="font-family:var(--font-song);font-size:15px;font-weight:600;letter-spacing:2px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(0,0,0,0.06)">来自${s.name}的成交纪录</h4>
        ${records.map(r => `
          <div onclick="closeModal();setTimeout(()=>openAuctionDetail(${AUCTION_RECORDS.indexOf(r)}),300)" style="display:flex;align-items:center;gap:12px;padding:12px 14px;background:rgba(0,0,0,0.02);border-radius:8px;margin-bottom:8px;cursor:pointer;border:1px solid rgba(0,0,0,0.04);transition:border-color 0.2s" onmouseover="this.style.borderColor='#C5A55A'" onmouseout="this.style.borderColor='rgba(0,0,0,0.04)'">
            ${r.imgUrl ? `<img src="${r.imgUrl}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">` : ''}
            <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.coin}</div><div style="color:#888;font-size:12px;margin-top:2px">${r.house} · ${r.date} · ${r.grade}</div></div>
            <div style="font-weight:700;color:#8B3A3A;font-size:15px;flex-shrink:0">${r.price}</div>
          </div>
        `).join('')}
      ` : '<p style="color:#888;font-size:14px">暂无来自该来源的成交记录展示</p>'}
    </div>
  `);
}

function openYayuFeature(type) {
  const content = {
    'price-trend': `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div style="padding:32px">
        <h2 style="font-family:var(--font-brush);font-size:28px;color:#2C2418;margin-bottom:16px">价格走势分析</h2>
        <p style="font-size:14px;line-height:1.8;color:#4A4A4A;margin-bottom:24px">基于首席收藏120万+拍卖成交记录，追踪各品种历年价格变动趋势。</p>
        <div class="modal-section"><h4>年度Top1成交价走势 (万元)</h4>
        <div style="display:flex;align-items:flex-end;gap:12px;height:200px;padding:16px 0;border-bottom:1px solid rgba(0,0,0,0.06)">
          ${[
            {y:'2021',v:2599,c:'#8B3A3A'},
            {y:'2022',v:4657,c:'#C5A55A'},
            {y:'2023',v:1840,c:'#8B3A3A'},
            {y:'2024',v:1932,c:'#8B3A3A'},
            {y:'2025',v:3335,c:'#4A7C59'}
          ].map(d => {
            const h = Math.round(d.v / 4657 * 160);
            return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px"><div style="font-size:11px;font-weight:700;color:'+d.c+'">'+d.v+'</div><div style="width:100%;max-width:48px;height:'+h+'px;background:'+d.c+';border-radius:4px 4px 0 0;transition:height 0.3s"></div><div style="font-size:11px;color:#6B5E4F">'+d.y+'</div></div>';
          }).join('')}
        </div></div>
        <div class="modal-section" style="margin-top:20px"><h4>近年市场趋势</h4>
        <div style="font-size:14px;line-height:2;color:#4A4A4A">
          <p><b>2022年·巅峰之年：</b>奉天癸卯一两以4657万创历史新高，张作霖伍拾圆金币3450万紧随其后。Top20中6席属于2022年。</p>
          <p><b>2023年·张作霖年：</b>张作霖系列持续霸榜，民国17年版1840万领衔。地球双旗等珍品热度不减。</p>
          <p><b>2024年·结构分化：</b>顶级珍品价格坚挺(上海壹两1932万)，但中端品种有所回调。古钱(崇宁铁母、咸丰大钱)表现活跃。</p>
          <p><b>2025年·金币崛起：</b>张作霖伍拾圆金币再度刷新纪录至3335万(中贸圣佳)，金币板块成为新热点。</p>
        </div></div>
      </div>`,
    'grade': `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div style="padding:32px">
        <h2 style="font-family:var(--font-brush);font-size:28px;color:#2C2418;margin-bottom:16px">评级对照表</h2>
        <p style="font-size:14px;line-height:1.8;color:#4A4A4A;margin-bottom:24px">PCGS/NGC国际评级标准 与 中国传统品相术语对照</p>
        <div class="modal-detail-grid" style="gap:8px">
          <div class="modal-detail-item"><span class="modal-detail-label">MS/SP 70</span><span class="modal-detail-value">完美未流通</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">MS/SP 65-69</span><span class="modal-detail-value">精制未流通 (Gem)</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">MS/SP 63-64</span><span class="modal-detail-value">优选未流通 (Choice)</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">MS/SP 60-62</span><span class="modal-detail-value">未流通 (Mint State)</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">AU 55-58</span><span class="modal-detail-value">近未流通 (About Unc)</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">XF 40-45</span><span class="modal-detail-value">极美品</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">VF 25-35</span><span class="modal-detail-value">美品</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">F 12-15</span><span class="modal-detail-value">上品</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">VG 8-10</span><span class="modal-detail-value">中品</span></div>
          <div class="modal-detail-item"><span class="modal-detail-label">G 4-6</span><span class="modal-detail-value">下品</span></div>
        </div>
        <div style="margin-top:20px;font-size:13px;color:#6B5E4F;line-height:1.8">
          <p><b>SP (Specimen)</b> = 样币/试铸币专用评级</p>
          <p><b>PF (Proof)</b> = 精制币评级</p>
          <p><b>华夏古泉评级</b> = 中国古钱专用，满分100分，80分以上为极美品</p>
        </div>
      </div>`,
    'market': (() => {
      // Compute house stats dynamically
      const houseTotals = {};
      AUCTION_RECORDS.forEach(r => {
        const p = parseInt(r.price.replace(/[¥,]/g, ''));
        const h = r.house.replace(/\s*\(.*\)/, '');
        if (!houseTotals[h]) houseTotals[h] = { count: 0, total: 0 };
        houseTotals[h].count++;
        houseTotals[h].total += p;
      });
      const sorted = Object.entries(houseTotals).sort((a,b) => b[1].total - a[1].total).slice(0, 8);
      const maxTotal = sorted[0][1].total;
      const houseChart = sorted.map(([name, d]) => {
        const w = Math.round(d.total / maxTotal * 100);
        return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><div style="width:80px;font-size:12px;text-align:right;color:#4A4A4A;flex-shrink:0">' + name.slice(0,6) + '</div><div style="flex:1;background:rgba(0,0,0,0.04);border-radius:4px;height:22px;overflow:hidden"><div style="width:' + w + '%;height:100%;background:linear-gradient(90deg,#8B3A3A,#C5A55A);border-radius:4px"></div></div><div style="font-size:11px;color:#8B3A3A;font-weight:600;width:70px;flex-shrink:0">¥' + (d.total/10000).toFixed(0) + '万</div></div>';
      }).join('');
      const grandTotal = Object.values(houseTotals).reduce((s,d) => s + d.total, 0);
      // Yearly transaction totals for curve chart
      const yearlyTotals = {};
      AUCTION_RECORDS.forEach(r => {
        const y = r.date.slice(0, 4);
        const p = parseInt(r.price.replace(/[¥,]/g, ''));
        if (!yearlyTotals[y]) yearlyTotals[y] = { count: 0, total: 0 };
        yearlyTotals[y].count++;
        yearlyTotals[y].total += p;
      });
      const years = Object.keys(yearlyTotals).sort();
      const maxYearTotal = Math.max(...years.map(y => yearlyTotals[y].total));
      // SVG line chart
      const chartW = 600, chartH = 180, padX = 50, padY = 20;
      const plotW = chartW - padX * 2, plotH = chartH - padY * 2;
      const points = years.map((y, i) => {
        const x = padX + (i / Math.max(years.length - 1, 1)) * plotW;
        const yPos = padY + plotH - (yearlyTotals[y].total / maxYearTotal) * plotH;
        return { x, y: yPos, year: y, total: yearlyTotals[y].total, count: yearlyTotals[y].count };
      });
      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
      const areaPath = linePath + ` L${points[points.length-1].x},${padY+plotH} L${points[0].x},${padY+plotH} Z`;
      const yearChart = `<svg viewBox="0 0 ${chartW} ${chartH}" style="width:100%;height:auto;margin:12px 0">
        <defs><linearGradient id="areGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8B3A3A" stop-opacity="0.3"/><stop offset="100%" stop-color="#8B3A3A" stop-opacity="0.02"/></linearGradient></defs>
        <line x1="${padX}" y1="${padY+plotH}" x2="${padX+plotW}" y2="${padY+plotH}" stroke="rgba(0,0,0,0.1)" stroke-width="1"/>
        <path d="${areaPath}" fill="url(#areGrad)"/>
        <path d="${linePath}" fill="none" stroke="#8B3A3A" stroke-width="2.5" stroke-linejoin="round"/>
        ${points.map(p => `<circle cx="${p.x}" cy="${p.y}" r="4" fill="#8B3A3A" stroke="#fff" stroke-width="1.5"/><text x="${p.x}" y="${padY+plotH+16}" text-anchor="middle" font-size="11" fill="#6B5E4F">${p.year}</text><text x="${p.x}" y="${p.y-10}" text-anchor="middle" font-size="10" font-weight="600" fill="#8B3A3A">¥${(p.total/10000).toFixed(0)}万</text>`).join('')}
      </svg>`;
      return `
      <button class="modal-close" onclick="closeModal()">✕</button>
      <div style="padding:32px">
        <h2 style="font-family:var(--font-brush);font-size:28px;color:#2C2418;margin-bottom:16px">市场行情</h2>
        <p style="font-size:14px;color:#4A4A4A;margin-bottom:8px">收录成交记录 <b>${AUCTION_RECORDS.length}</b> 笔 · 总成交额 <b style="color:#8B3A3A">¥${(grandTotal/100000000).toFixed(2)}亿</b></p>
        <div class="modal-section"><h4>年度成交额走势曲线</h4>${yearChart}</div>
        <div class="modal-section"><h4>各拍卖行成交额</h4>${houseChart}</div>
        <div class="modal-section" style="margin-top:20px"><h4>Top20成交分布</h4>
        <div style="font-size:14px;line-height:2;color:#4A4A4A">
          <p><b>按币种：</b>张作霖系列占7席(35%)，户部一两占3席，上海壹两占2席，孙中山地球占2席</p>
          <p><b>按拍卖行：</b>北京诚轩7席(已于2024年停拍)，泓盛3席，SBP 2席，泰星2席</p>
          <p><b>按年份：</b>2022年6席(巅峰)，2021年5席，2023年4席，2024年2席，2025年1席</p>
          <p><b>清代vs民国：</b>各占10席(50:50)</p>
          <p><b>价格门槛：</b>进入Top20需¥1150万以上</p>
        </div></div>
      </div>`;
    })()
  };
  if (content[type]) showModal(content[type]);
}

// ===== Knowledge 泉识学堂 (可点击展开文章) =====
const KNOWLEDGE_ARTICLES = [
  { tag: '入门必读', title: '中国古钱币发展简史', icon: '🐚', img: IMG.beibi,
    content: `<p>中国是世界上最早使用货币的国家之一，货币发展史长达三千余年。</p>
    <h5>一、贝币时代（商代-春秋）</h5><p>天然海贝是中国最早的货币，商代已广泛用于交易。随着贸易扩大，出现了铜贝、骨贝等仿贝。汉字中与财富相关的字多从"贝"，如财、货、贵、贫。</p>
    <h5>二、先秦多元时代（春秋-前221年）</h5><p>春秋战国时期，各国铸币各具特色：中原地区流通布币（铲形），齐国和燕国使用刀币，楚国铸蚁鼻钱（鬼脸钱），秦国铸圜钱。四大货币体系并存。</p>
    <h5>三、方孔圆钱时代（前221年-1911年）</h5><p>秦始皇统一货币为"半两"，确立圆形方孔制式，影响中国两千余年。汉武帝铸"五铢"，流通七百余年。唐高祖铸"开元通宝"，开创通宝、元宝年号钱制度。</p>
    <h5>四、机制币时代（1889-1949年）</h5><p>清末引进西方造币机器，铸造光绪元宝。民国时期袁世凯像银元（袁大头）成为流通最广的银币。方孔钱就此终结，中国货币进入现代。</p>` },
  { tag: '鉴定技巧', title: '古钱币真伪鉴定十大要诀', icon: '🔍', img: IMG.kaiYuan,
    content: `<p>古钱币鉴定需从多维度综合判断，以下十大要诀供参考：</p>
    <h5>1. 看铜质</h5><p>真品铜质温润，假币多为现代合金，色泽偏亮或偏暗。</p>
    <h5>2. 观锈色</h5><p>真锈层次分明，入骨三分。假锈浮于表面，颜色单一。真品绿锈有"硬绿""水银古"等特征。</p>
    <h5>3. 审文字</h5><p>每个时代有独特书风。如宋钱书法精美，清钱工整端庄。假币文字往往软弱无力或过于僵硬。</p>
    <h5>4. 验铸工</h5><p>古代翻砂铸造有细微砂眼，机制币有均匀的齿边和平整地章。</p>
    <h5>5. 听声音</h5><p>真品古铜钱声音沉闷，新仿品声音清脆。银币用指弹测"银声"。</p>
    <h5>6. 量尺寸重量</h5><p>真品尺寸和重量在标准范围内，伪品常偏大偏重或偏小偏轻。</p>
    <h5>7. 看穿孔</h5><p>方孔钱穿口的修整痕迹、流通磨损痕迹是重要鉴定依据。</p>
    <h5>8. 察包浆</h5><p>老包浆自然均匀，有岁月感。做旧包浆不均匀、有化学气味。</p>
    <h5>9. 查版别</h5><p>对照图谱核实版别特征。一些稀有版别被大量仿制。</p>
    <h5>10. 综合判断</h5><p>任何单一特征都不能绝对判定真伪，需多维度交叉验证。多看真品是最好的学习方式。</p>` },
  { tag: '版别研究', title: '崇宁通宝版别大全图解', icon: '📜', img: IMG.chongNing,
    content: `<p>崇宁通宝是北宋徽宗崇宁年间（1102-1106）铸造的钱币，以宋徽宗赵佶亲笔题写的瘦金体书法闻名于世。</p>
    <h5>主要版别分类</h5>
    <p><b>大字版：</b>字体较大，笔画粗壮有力。又分"正字""斜字""宽字"等。</p>
    <p><b>小字版：</b>字体较小，精致秀美。以"美制"小字最为珍贵。</p>
    <p><b>抽示版：</b>"崇"字的"示"部笔画上抽，为典型版别特征。</p>
    <p><b>铁母：</b>用于翻铸铁钱的母钱，铜质精良，字口深峻。存世极少，价值极高。</p>
    <p><b>折十大钱：</b>直径34-35mm，重约10-12g。是崇宁通宝最常见的规格。</p>
    <h5>收藏价值</h5>
    <p>普通版崇宁通宝存世量大，价格亲民（10-100元），适合入门收藏。铁母、美制等珍稀版别可达数万元。版别鉴赏是古钱收藏的重要乐趣。</p>` },
  { tag: '市场分析', title: '2024古钱币市场行情报告', icon: '💰', img: IMG.yuanShiKai,
    content: `<h5>总体趋势</h5><p>2024年古钱币市场呈现结构性分化。珍稀品种持续走高，普通品种表现平淡。</p>
    <h5>先秦钱币</h5><p>先秦刀布币价格持续攀升，三孔布以420万成交创下新高。齐大刀、郢爰等名品表现强劲。</p>
    <h5>宋钱</h5><p>崇宁通宝铁母以350万成交，大观通宝折十铁母185万。宋代御书钱成为热门收藏方向。靖康通宝依然是两宋钱币中的"天花板"。</p>
    <h5>清钱</h5><p>咸丰大钱市场活跃，宝泉当千520万元成交。雍正通宝各局持续走高，成套收藏需求旺盛。</p>
    <h5>机制币</h5><p>奉天癸卯一两以4657万元蝉联中国钱币拍卖纪录榜首(2022年诚轩)。张作霖系列持续霸榜Top10。袁大头签字版等顶级珍品价格坚挺。普通版袁大头、船洋等大众品种价格回调。</p>
    <h5>投资建议</h5><p>重品质、重版别、重传承。名家旧藏、评级高分币溢价明显。避免追高普通品种。</p>` },
  { tag: '专题研究', title: '王莽货币改制与钱币艺术', icon: '🏛️', img: IMG.wangMangYiDao,
    content: `<p>王莽（公元9-23年）在位仅14年，却进行了四次大规模货币改革，创造了中国钱币史上最具艺术性的一批钱币。</p>
    <h5>第一次改制：居摄二年（7年）</h5><p>铸造"大泉五十"和"契刀五百""一刀平五千"。一刀平五千以环柄嵌金"一刀"二字，工艺精湛，为历代钱币收藏家梦寐以求的珍品。</p>
    <h5>第二次改制：始建国元年（9年）</h5><p>废除刀币，推行"宝货制"，包含五种货币28个品种，过于复杂导致民间混乱。</p>
    <h5>第三次改制：天凤元年（14年）</h5><p>简化为"货泉"和"货布"两种。货泉篆书优美，尤其"悬针篆"货泉文字飘逸如悬针，是中国古钱币书法艺术的代表。</p>
    <h5>第四次改制：</h5><p>铸布泉，重新采用布币形制与圆钱并行。</p>
    <h5>艺术价值</h5><p>王莽钱币在铸造工艺、文字书法、造型设计上都达到了极高水准，被誉为"中国古钱之冠"。</p>` },
  { tag: '收藏指南', title: '机制币入门：从袁大头开始', icon: '⚙️', img: IMG.sunMemento,
    content: `<p>袁世凯像银元（俗称"袁大头"）是中国机制银币收藏的最佳入门品种。</p>
    <h5>年份版别</h5>
    <p><b>民国三年（1914）：</b>铸量最大，版别最多。普通版存世量充足，适合入门。签字版L.GIORGI极为珍罕，价值数百万。</p>
    <p><b>民国八年（1919）：</b>铸量较少，牛口造、大耳版等有特色。</p>
    <p><b>民国九年（1920）：</b>精发版、粗发版之分。精发版铸造精美。</p>
    <p><b>民国十年（1921）：</b>铸量较大，价格适中。</p>
    <h5>评级标准</h5><p>机制币采用国际通行的谢尔登评级法（1-70分）。XF（极美）以上品相适合收藏。MS（未流通）级别溢价显著。PCGS和NGC是两大权威评级机构。</p>
    <h5>入门建议</h5><p>建议从PCGS/NGC评级的XF-AU品相开始收藏，三年普通版目前市价约2000-5000元。切忌贪便宜买裸币或来路不明的"便宜货"。</p>` },
];

function initKnowledge() {
  const grid = document.getElementById('knowledgeGrid');
  if (!grid) return;
  grid.innerHTML = KNOWLEDGE_ARTICLES.map((a, i) => `
    <div class="knowledge-card" onclick="openKnowledgeArticle(${i})">
      <div class="knowledge-card-img">${a.img ? `<img src="${a.img}" alt="${a.title}">` : a.icon}</div>
      <div class="knowledge-card-body">
        <span class="knowledge-card-tag">${a.tag}</span>
        <h3 class="knowledge-card-title">${a.title}</h3>
        <p class="knowledge-card-excerpt">${a.content.replace(/<[^>]*>/g, '').substring(0, 80)}...</p>
      </div>
    </div>
  `).join('');
}

function openKnowledgeArticle(index) {
  const article = KNOWLEDGE_ARTICLES[index];
  if (!article) return;

  showModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div style="padding:0">
      <div style="background:linear-gradient(135deg, #2d2520, #1a1a1a);padding:40px 32px;text-align:center">
        <span style="font-size:64px;display:block;margin-bottom:16px">${article.icon}</span>
        <span style="display:inline-block;padding:4px 14px;background:rgba(197,165,90,0.2);color:#C5A55A;border-radius:12px;font-size:12px;font-weight:600;letter-spacing:1px;margin-bottom:12px">${article.tag}</span>
        <h2 style="font-family:var(--font-brush);font-size:28px;color:#C5A55A;letter-spacing:4px">${article.title}</h2>
      </div>
      <div style="padding:32px">
        <div class="article-content" style="font-size:14px;line-height:2;color:#4A4A4A">
          ${article.content}
        </div>
      </div>
    </div>
  `);
}

// ===== Timeline 点击展开 =====
const TIMELINE_DETAILS = [
  { title: '先秦', coins: ['天然贝币','铜贝','空首布','齐刀','燕明刀','蚁鼻钱','郢爰','圜钱'] },
  { title: '秦汉', coins: ['秦半两','五铢','王莽·一刀平五千','王莽·货泉','王莽·大泉五十'] },
  { title: '唐宋', coins: ['开元通宝','崇宁通宝','大观通宝','靖康通宝'] },
  { title: '明清', coins: ['洪武通宝','永乐通宝','康熙通宝','乾隆通宝','咸丰元宝'] },
  { title: '近代', coins: ['光绪元宝·广东省造','大清银币·宣统三年','袁世凯像·壹圆','孙中山像·开国纪念币'] },
];

function initTimeline() {
  document.querySelectorAll('.timeline-item').forEach((item, i) => {
    item.style.cursor = 'pointer';
    item.addEventListener('click', () => openTimelineDetail(i));
  });
}

function openTimelineDetail(index) {
  const detail = TIMELINE_DETAILS[index];
  if (!detail) return;

  const matchedCoins = detail.coins.map(name => COINS.find(c => c.name.includes(name.split('·')[0]) || name.includes(c.name.split('·')[0]))).filter(Boolean);

  showModal(`
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div style="padding:32px">
      <h2 style="font-family:var(--font-brush);font-size:28px;color:#2C2418;margin-bottom:4px">${detail.title}时代代表钱币</h2>
      <p style="color:#6B5E4F;font-size:14px;margin-bottom:24px">点击任意钱币查看详情</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
        ${matchedCoins.map(coin => {
          const dynasty = DYNASTIES.find(d => d.id === coin.dynasty);
          return `
            <div onclick="closeModal();setTimeout(()=>openCoinModal(${coin.id}),300)" style="display:flex;gap:12px;padding:14px;background:rgba(0,0,0,0.02);border-radius:10px;cursor:pointer;border:1px solid rgba(0,0,0,0.04);transition:all 0.2s" onmouseover="this.style.borderColor='#C5A55A';this.style.background='rgba(197,165,90,0.05)'" onmouseout="this.style.borderColor='rgba(0,0,0,0.04)';this.style.background='rgba(0,0,0,0.02)'">
              <div style="width:56px;height:56px;border-radius:8px;background:linear-gradient(135deg,#f0ebe0,#e8e0d0);display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
                ${coin.img ? `<img src="${coin.img}" style="width:90%;height:90%;object-fit:contain">` : `<span style="font-size:28px">${dynasty?.icon||'🪙'}</span>`}
              </div>
              <div>
                <div style="font-family:'Noto Serif SC',serif;font-size:14px;font-weight:600">${coin.name}</div>
                <div style="font-size:12px;color:#6B5E4F">${coin.period} · ${coin.material}</div>
                <div style="font-size:13px;color:#8B3A3A;font-weight:600;margin-top:2px">¥${coin.priceRange}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `);
}

// ===== AI Examples =====
const AI_EXAMPLES = [
  { img: IMG.chongNing, name: '崇宁通宝', result: '北宋 · 瘦金体 · 折十', grade: '美品 85分', price: '¥800-3,000', confidence: 98 },
  { img: IMG.kaiYuan, name: '开元通宝', result: '唐代 · 初铸大字', grade: '上美 80分', price: '¥200-1,500', confidence: 96 },
  { img: IMG.yuanShiKai, name: '袁大头三年', result: '民国三年 · 普通版', grade: 'XF45', price: '¥2,000-5,000', confidence: 99 },
  { img: IMG.wangMangYiDao, name: '一刀平五千', result: '新朝 · 金错刀', grade: '美品', price: '¥30,000-80,000', confidence: 94 },
  { img: IMG.chunhuaBack, name: '淳化元宝', result: '北宋 · 背双佛金钱', grade: '极美', price: '¥300,000+', confidence: 92 },
  { img: IMG.qinBanLiang, name: '秦半两', result: '秦代 · 统一半两', grade: '上品', price: '¥500-3,000', confidence: 97 },
];

function initAIExamples() {
  const grid = document.getElementById('aiExamples');
  if (!grid) return;
  grid.innerHTML = AI_EXAMPLES.map(e => `
    <div class="ai-example-card">
      <div class="ai-example-img">
        <img src="${e.img}" alt="${e.name}" onerror="this.outerHTML='<span style=font-size:50px;opacity:0.3>🪙</span>'">
        <span class="ai-example-confidence">AI ${e.confidence}%</span>
      </div>
      <div class="ai-example-body">
        <div class="ai-example-name">${e.name}</div>
        <div class="ai-example-result">${e.result}</div>
        <div class="ai-example-meta">
          <span class="ai-example-grade">${e.grade}</span>
          <span class="ai-example-price">${e.price}</span>
        </div>
      </div>
    </div>
  `).join('');
}

// ===== AI Appraisal =====
function initAIAppraisal() {
  initAIExamples();
  const uploadArea = document.getElementById('aiUpload');
  const fileInput = document.getElementById('aiFileInput');
  if (!uploadArea || !fileInput) return;

  uploadArea.addEventListener('click', () => fileInput.click());
  uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = '#C5A55A'; uploadArea.style.background = 'rgba(197,165,90,0.08)'; });
  uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = 'rgba(197,165,90,0.3)'; uploadArea.style.background = 'rgba(255,255,255,0.02)'; });
  uploadArea.addEventListener('drop', (e) => { e.preventDefault(); handleAppraisal(); });
  fileInput.addEventListener('change', () => { if (fileInput.files.length > 0) handleAppraisal(); });
}

function handleAppraisal() {
  const resultPanel = document.getElementById('aiResult');
  const uploadArea = document.getElementById('aiUpload');
  if (!resultPanel) return;

  uploadArea.innerHTML = `<div class="ai-scan-ring" style="opacity:1"></div><span class="ai-upload-icon"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#00d4ff" stroke-width="2"><circle cx="12" cy="12" r="10" stroke-dasharray="4 3"><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1.5s" repeatCount="indefinite"/></circle></svg></span><div class="ai-upload-text" style="color:#00d4ff">AI 深度分析中...</div><div class="ai-upload-hint">扫描钱币特征 · 比对120万+数据库记录</div>`;

  setTimeout(() => {
    const samples = [
      { name: '崇宁通宝·折十', dynasty: '北宋', period: '崇宁年间 (1102-1106)', material: '青铜', weight: '10.2g', size: '34.5mm', grade: '美品 (VF)', confidence: '94.7%', estimate: '¥3,000-8,000', features: '瘦金体御书，字口深峻，铜质精良。轮廓规整，穿口干净。' },
      { name: '康熙通宝·宝源局', dynasty: '清朝', period: '康熙年间 (1662-1722)', material: '黄铜', weight: '4.1g', size: '26.8mm', grade: '上美品 (XF)', confidence: '97.2%', estimate: '¥200-800', features: '满汉文对读，字体端庄。地章平整，包浆温润自然。' },
      { name: '袁大头·三年·普通版', dynasty: '民国', period: '民国三年 (1914)', material: '银', weight: '26.5g', size: '39mm', grade: 'XF45', confidence: '96.1%', estimate: '¥2,000-5,000', features: '袁世凯侧面像清晰，嘉禾纹饰完整。边齿规整，银色正常。' },
    ];
    const s = samples[Math.floor(Math.random() * samples.length)];

    uploadArea.innerHTML = `<div class="ai-scan-ring"></div><span class="ai-upload-icon"><svg width="64" height="64" viewBox="0 0 64 64" fill="none"><rect x="4" y="4" width="56" height="56" rx="12" stroke="rgba(197,165,90,0.4)" stroke-width="2" stroke-dasharray="6 4"/><circle cx="32" cy="28" r="10" stroke="#C5A55A" stroke-width="2"/><path d="M20 48c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="#C5A55A" stroke-width="2" stroke-linecap="round"/><path d="M46 18l4-4m0 0h-6m6 0v6" stroke="#00d4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></span><div class="ai-upload-text">点击或拖拽上传钱币照片</div><div class="ai-upload-hint">AI深度学习 · 覆盖先秦至民国 · 秒级响应</div>`;

    resultPanel.classList.add('show');
    resultPanel.innerHTML = `
      <div class="ai-result-header">
        <div class="ai-result-title">${s.name}</div>
        <span class="ai-confidence">置信度 ${s.confidence}</span>
      </div>
      <div class="ai-result-grid">
        <div class="ai-result-item"><div class="ai-result-label">朝代</div><div class="ai-result-value">${s.dynasty}</div></div>
        <div class="ai-result-item"><div class="ai-result-label">年代</div><div class="ai-result-value">${s.period}</div></div>
        <div class="ai-result-item"><div class="ai-result-label">材质</div><div class="ai-result-value">${s.material}</div></div>
        <div class="ai-result-item"><div class="ai-result-label">重量</div><div class="ai-result-value">${s.weight}</div></div>
        <div class="ai-result-item"><div class="ai-result-label">尺寸</div><div class="ai-result-value">${s.size}</div></div>
        <div class="ai-result-item"><div class="ai-result-label">品相评级</div><div class="ai-result-value">${s.grade}</div></div>
        <div class="ai-result-item" style="grid-column:span 2"><div class="ai-result-label">估价区间</div><div class="ai-result-value" style="color:#8B3A3A;font-size:20px">${s.estimate}</div></div>
        <div class="ai-result-item" style="grid-column:span 2"><div class="ai-result-label">鉴定特征</div><div class="ai-result-value" style="font-size:14px;font-weight:400;line-height:1.7">${s.features}</div></div>
      </div>
      <div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(0,212,255,0.15);display:flex;gap:12px">
        <button onclick="alert('闪电回收意向已提交！我们将在24小时内联系您报价。')" style="flex:1;padding:14px;background:linear-gradient(135deg,#00d4ff,#0099cc);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;letter-spacing:2px;font-family:var(--font-sans);transition:all 0.3s" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 8px 24px rgba(0,212,255,0.3)'" onmouseout="this.style.transform='';this.style.boxShadow=''">&#9889; 闪电回收</button>
        <button onclick="handleAppraisal()" style="flex:1;padding:14px;background:rgba(197,165,90,0.15);color:#C5A55A;border:1px solid rgba(197,165,90,0.3);border-radius:10px;font-size:14px;cursor:pointer;letter-spacing:2px;font-family:var(--font-sans);transition:all 0.3s" onmouseover="this.style.borderColor='#C5A55A'" onmouseout="this.style.borderColor='rgba(197,165,90,0.3)'">重新鉴定</button>
      </div>
    `;
  }, 2000);
}

// ===== Search =====
function initSearch() {
  document.querySelectorAll('.search-input, .nav-search input').forEach(input => {
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length < 1) { renderCoins(COINS); return; }
      const filtered = COINS.filter(c =>
        c.name.toLowerCase().includes(query) || c.variety.toLowerCase().includes(query) ||
        c.desc.toLowerCase().includes(query) || c.period.toLowerCase().includes(query)
      );
      renderCoins(filtered);
      const grid = document.getElementById('coinGrid');
      if (grid && filtered.length > 0) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ===== Count Up =====
function initCountUp() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        animateCount(el, 0, parseInt(el.dataset.target), 2000);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-target]').forEach(el => observer.observe(el));
}

function animateCount(el, start, end, duration) {
  const startTime = performance.now();
  const format = el.dataset.format === 'true';
  function update(t) {
    const p = Math.min((t - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (format ? Math.floor(start + (end - start) * eased).toLocaleString() : Math.floor(start + (end - start) * eased));
    if (p < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
