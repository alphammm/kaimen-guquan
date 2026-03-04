// ============================================
// 开门古泉 — 交互逻辑
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  initScrollAnimations();
  initDynastyNav();
  initCoinCards();
  initAuctionTable();
  initAIAppraisal();
  initSearch();
  initModal();
  initCountUp();
  initNavScroll();
});

// ===== Scroll Animations =====
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

// ===== Nav Scroll Effect =====
function initNavScroll() {
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      nav.style.background = 'rgba(26, 26, 26, 0.98)';
    } else {
      nav.style.background = 'rgba(26, 26, 26, 0.95)';
    }
  });
}

// ===== Dynasty Navigation =====
function initDynastyNav() {
  const chips = document.querySelectorAll('.dynasty-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      e.preventDefault();
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const targetId = chip.getAttribute('href').substring(1);
      if (targetId === 'all') {
        renderCoins(COINS);
        return;
      }
      const filtered = COINS.filter(c => c.dynasty === targetId);
      renderCoins(filtered);

      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ===== Coin Cards =====
function initCoinCards() {
  renderCoins(COINS);
}

function renderCoins(coins) {
  const grid = document.getElementById('coinGrid');
  if (!grid) return;

  grid.innerHTML = coins.map(coin => {
    const dynasty = DYNASTIES.find(d => d.id === coin.dynasty);
    const stars = Array.from({length: 5}, (_, i) =>
      `<span class="star ${i < coin.rarity ? '' : 'empty'}">★</span>`
    ).join('');

    return `
      <div class="coin-card fade-up visible" onclick="openCoinModal(${coin.id})">
        <div class="coin-card-img">
          <span class="coin-emoji">${dynasty ? dynasty.icon : '🪙'}</span>
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

// ===== Auction Table =====
function initAuctionTable() {
  renderAuctions(AUCTION_RECORDS);

  document.querySelectorAll('.auction-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.auction-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;
      if (filter === 'all') {
        renderAuctions(AUCTION_RECORDS);
      } else {
        const filtered = AUCTION_RECORDS.filter(r =>
          r.dynasty === filter || r.house.includes(filter)
        );
        renderAuctions(filtered.length > 0 ? filtered : AUCTION_RECORDS);
      }
    });
  });
}

function renderAuctions(records) {
  const tbody = document.getElementById('auctionBody');
  if (!tbody) return;

  tbody.innerHTML = records.map((r, i) => `
    <tr>
      <td style="color:rgba(245,240,232,0.4)">${i + 1}</td>
      <td class="coin-name-cell">${r.coin}</td>
      <td><span class="auction-house-tag">${r.house}</span></td>
      <td>${r.date}</td>
      <td><span class="grade-tag">${r.grade}</span></td>
      <td class="price-cell">${r.price}</td>
      <td style="color:rgba(245,240,232,0.5)">${r.priceUSD}</td>
    </tr>
  `).join('');
}

// ===== AI Appraisal =====
function initAIAppraisal() {
  const uploadArea = document.getElementById('aiUpload');
  const fileInput = document.getElementById('aiFileInput');
  const resultPanel = document.getElementById('aiResult');

  if (!uploadArea || !fileInput) return;

  uploadArea.addEventListener('click', () => fileInput.click());

  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#C5A55A';
    uploadArea.style.background = 'rgba(197,165,90,0.08)';
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.style.borderColor = 'rgba(197,165,90,0.3)';
    uploadArea.style.background = 'rgba(255,255,255,0.02)';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    handleAppraisal();
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleAppraisal();
  });
}

function handleAppraisal() {
  const resultPanel = document.getElementById('aiResult');
  const uploadArea = document.getElementById('aiUpload');
  if (!resultPanel) return;

  // Simulate AI processing
  uploadArea.innerHTML = `
    <span class="ai-upload-icon">⏳</span>
    <div class="ai-upload-text">AI 鉴定分析中...</div>
    <div class="ai-upload-hint">正在识别钱币特征、比对数据库</div>
  `;

  setTimeout(() => {
    // Pick a random coin for demo
    const sampleCoins = [
      { name: '崇宁通宝·折十', dynasty: '北宋', period: '崇宁年间 (1102-1106)', material: '青铜', weight: '10.2g', size: '34.5mm', grade: '美品 (VF)', confidence: '94.7%', estimate: '¥3,000-8,000', features: '瘦金体御书，字口深峻，铜质精良。轮廓规整，穿口干净。' },
      { name: '康熙通宝·宝源局', dynasty: '清朝', period: '康熙年间 (1662-1722)', material: '黄铜', weight: '4.1g', size: '26.8mm', grade: '上美品 (XF)', confidence: '97.2%', estimate: '¥200-800', features: '满汉文对读，字体端庄。地章平整，包浆温润自然。' },
      { name: '袁大头·三年·普通版', dynasty: '民国', period: '民国三年 (1914)', material: '银', weight: '26.5g', size: '39mm', grade: 'XF45', confidence: '96.1%', estimate: '¥2,000-5,000', features: '袁世凯侧面像清晰，嘉禾纹饰完整。边齿规整，银色正常。' },
    ];
    const sample = sampleCoins[Math.floor(Math.random() * sampleCoins.length)];

    uploadArea.innerHTML = `
      <span class="ai-upload-icon">📸</span>
      <div class="ai-upload-text">点击或拖拽上传钱币照片</div>
      <div class="ai-upload-hint">支持正反面照片，AI将自动识别朝代、版别与真伪</div>
    `;

    resultPanel.classList.add('show');
    resultPanel.innerHTML = `
      <div class="ai-result-header">
        <div class="ai-result-title">${sample.name}</div>
        <span class="ai-confidence">置信度 ${sample.confidence}</span>
      </div>
      <div class="ai-result-grid">
        <div class="ai-result-item">
          <div class="ai-result-label">朝代</div>
          <div class="ai-result-value">${sample.dynasty}</div>
        </div>
        <div class="ai-result-item">
          <div class="ai-result-label">年代</div>
          <div class="ai-result-value">${sample.period}</div>
        </div>
        <div class="ai-result-item">
          <div class="ai-result-label">材质</div>
          <div class="ai-result-value">${sample.material}</div>
        </div>
        <div class="ai-result-item">
          <div class="ai-result-label">重量</div>
          <div class="ai-result-value">${sample.weight}</div>
        </div>
        <div class="ai-result-item">
          <div class="ai-result-label">尺寸</div>
          <div class="ai-result-value">${sample.size}</div>
        </div>
        <div class="ai-result-item">
          <div class="ai-result-label">品相评级</div>
          <div class="ai-result-value">${sample.grade}</div>
        </div>
        <div class="ai-result-item" style="grid-column: span 2">
          <div class="ai-result-label">估价区间</div>
          <div class="ai-result-value" style="color:#E23D28;font-size:20px">${sample.estimate}</div>
        </div>
        <div class="ai-result-item" style="grid-column: span 2">
          <div class="ai-result-label">鉴定特征</div>
          <div class="ai-result-value" style="font-size:14px;font-weight:400;line-height:1.7">${sample.features}</div>
        </div>
      </div>
    `;
  }, 2000);
}

// ===== Search =====
function initSearch() {
  const searchInputs = document.querySelectorAll('.search-input, .nav-search input');
  searchInputs.forEach(input => {
    input.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (query.length < 1) {
        renderCoins(COINS);
        return;
      }
      const filtered = COINS.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.variety.toLowerCase().includes(query) ||
        c.desc.toLowerCase().includes(query) ||
        c.period.toLowerCase().includes(query)
      );
      renderCoins(filtered);

      // scroll to coin grid
      const grid = document.getElementById('coinGrid');
      if (grid && filtered.length > 0) {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

// ===== Coin Modal =====
function initModal() {
  const overlay = document.getElementById('modalOverlay');
  if (!overlay) return;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
}

function openCoinModal(coinId) {
  const coin = COINS.find(c => c.id === coinId);
  if (!coin) return;

  const dynasty = DYNASTIES.find(d => d.id === coin.dynasty);
  const overlay = document.getElementById('modalOverlay');
  const modal = document.getElementById('modalContent');

  // Find related auction records
  const relatedAuctions = AUCTION_RECORDS.filter(r =>
    r.coin.includes(coin.name.split('·')[0]) || coin.name.includes(r.coin.split('·')[0])
  );

  const stars = Array.from({length: 5}, (_, i) =>
    `<span class="star ${i < coin.rarity ? '' : 'empty'}">★</span>`
  ).join('');

  modal.innerHTML = `
    <button class="modal-close" onclick="closeModal()">✕</button>
    <div class="modal-header">
      <div class="modal-coin-img">
        <span style="font-size:80px">${dynasty ? dynasty.icon : '🪙'}</span>
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
        <div style="font-family:'Noto Serif SC',serif;font-size:20px;font-weight:700;color:#E23D28">
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
          <div class="modal-detail-item">
            <span class="modal-detail-label">朝代</span>
            <span class="modal-detail-value">${dynasty ? dynasty.name : '-'}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">年代</span>
            <span class="modal-detail-value">${coin.period}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">材质</span>
            <span class="modal-detail-value">${coin.material}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">重量</span>
            <span class="modal-detail-value">${coin.weight || '-'}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">尺寸</span>
            <span class="modal-detail-value">${coin.size || '-'}</span>
          </div>
          <div class="modal-detail-item">
            <span class="modal-detail-label">稀有度</span>
            <span class="modal-detail-value">${'★'.repeat(coin.rarity)}${'☆'.repeat(5-coin.rarity)}</span>
          </div>
        </div>
      </div>
      ${relatedAuctions.length > 0 ? `
        <div class="modal-section">
          <h4>相关拍卖纪录</h4>
          ${relatedAuctions.map(r => `
            <div style="display:flex;justify-content:space-between;padding:10px 12px;background:rgba(0,0,0,0.02);border-radius:6px;margin-bottom:8px;font-size:13px">
              <span>${r.coin}</span>
              <span style="color:#888">${r.house} · ${r.date}</span>
              <span style="font-weight:700;color:#E23D28">${r.price}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;

  overlay.classList.add('show');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  document.body.style.overflow = '';
}

// ===== Count Up Animation =====
function initCountUp() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.target);
        animateCount(el, 0, target, 2000);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('[data-target]').forEach(el => observer.observe(el));
}

function animateCount(el, start, end, duration) {
  const startTime = performance.now();
  const format = el.dataset.format === 'true';

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * eased);

    el.textContent = format ? current.toLocaleString() : current;

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

// ===== Mobile Nav Toggle =====
function toggleMobileNav() {
  const links = document.querySelector('.nav-links');
  links.style.display = links.style.display === 'flex' ? 'none' : 'flex';
  if (links.style.display === 'flex') {
    links.style.position = 'absolute';
    links.style.top = '64px';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(26,26,26,0.98)';
    links.style.flexDirection = 'column';
    links.style.padding = '20px 24px';
    links.style.gap = '16px';
    links.style.borderBottom = '1px solid rgba(197,165,90,0.2)';
  }
}
