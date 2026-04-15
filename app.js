// =============================================
// app.js — 삼천리 피드 (네이버 관련기사 포함)
// =============================================

let allItems = [];

function setDate() {
  const n = new Date();
  document.getElementById('date-badge').textContent =
    n.getFullYear() + '.' + String(n.getMonth()+1).padStart(2,'0') + '.' + String(n.getDate()).padStart(2,'0');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const diff = Math.floor((Date.now() - d) / 86400000);
  if (diff === 0) return '오늘';
  if (diff === 1) return '어제';
  if (diff < 7)  return diff + '일 전';
  return (d.getMonth()+1) + '/' + d.getDate();
}

function isNew(dateStr) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr) < 1000 * 60 * 60 * 48;
}

async function fetchSocial() {
  try {
    const res = await fetch(CONFIG.socialCenterApi);
    const data = await res.json();
    return data.map(item => ({
      type: item.type, title: item.title, url: item.url,
      date: item.date, thumb: item.thumbnail || '', source: item.typeName || '',
    }));
  } catch(e) { console.error('소셜센터 오류:', e); return []; }
}

async function fetchNews() {
  try {
    const res = await fetch(CONFIG.newsCenterApi);
    const data = await res.json();
    return data.map(item => ({
      type: 'news', title: item.title, url: item.url,
      date: item.date, thumb: item.thumbnail || '', source: item.typeName || '뉴스',
    }));
  } catch(e) { console.error('뉴스센터 오류:', e); return []; }
}

async function fetchRelatedNews(title, btnEl, listEl) {
  btnEl.textContent = '검색 중...';
  btnEl.disabled = true;
  const keyword = title.replace(/[^\w\s가-힣]/g, '').trim().slice(0, 20);
  try {
    const res = await fetch('/api/naver-news?query=' + encodeURIComponent(keyword));
    const data = await res.json();
    if (!data.items || data.items.length === 0) {
      listEl.innerHTML = '<div class="related-empty">관련 기사를 찾을 수 없어요</div>';
      btnEl.style.display = 'none';
      return;
    }
    listEl.innerHTML = data.items.map(item => `
      <a class="related-item" href="${item.url}" target="_blank" rel="noopener">
        <span class="related-title">${item.title}</span>
        <span class="related-meta">${item.source || ''}${item.pubDate ? ' · ' + formatDate(item.pubDate) : ''}</span>
      </a>`).join('');
    btnEl.style.display = 'none';
  } catch(e) {
    listEl.innerHTML = '<div class="related-empty">불러오기 실패</div>';
    btnEl.textContent = '+ 관련 기사 보기';
    btnEl.disabled = false;
  }
}

const TAG_LABEL = { news:'뉴스', YOUTUBE:'유튜브', INSTAGRAM:'인스타', BLOG:'블로그', COMPANY_MAGAZINE:'사보' };
const TAG_CLASS  = { news:'tag-news', YOUTUBE:'tag-yt', INSTAGRAM:'tag-insta', BLOG:'tag-blog', COMPANY_MAGAZINE:'tag-sabo' };

function makeCard(item) {
  const newDot   = isNew(item.date) ? '<span class="new-dot"></span>' : '';
  const tagLabel = TAG_LABEL[item.type] || item.source || item.type;
  const tagClass = TAG_CLASS[item.type] || 'tag-news';
  const meta     = [item.source, formatDate(item.date)].filter(Boolean).join(' · ');

  if (item.type === 'YOUTUBE') {
    const isShort = item.url.includes('/shorts/');
    return `<a class="card" href="${item.url}" target="_blank" rel="noopener">
      <div class="thumb yt-bg">
        ${item.thumb ? `<img src="${item.thumb}" alt="" loading="lazy">` : ''}
        <div class="play-btn"></div>
        <span class="yt-label">${isShort ? 'Shorts' : '▶ 영상'}</span>
      </div>
      <div class="card-body">
        <div class="tag-row"><span class="tag tag-yt">유튜브</span>${newDot}</div>
        <div class="card-title">${item.title}</div>
        <div class="card-meta">${meta}</div>
      </div></a>`;
  }

  if (item.type === 'news') {
    const safeTitle = item.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const thumbHtml = item.thumb ? `<div class="thumb"><img src="${item.thumb}" alt="" loading="lazy"></div>` : '';
    return `<div class="card">
      <a href="${item.url}" target="_blank" rel="noopener" style="text-decoration:none;color:inherit;display:block;">
        ${thumbHtml}
        <div class="card-body">
          <div class="tag-row"><span class="tag tag-news">뉴스</span>${newDot}</div>
          <div class="card-title">${item.title}</div>
          <div class="card-meta">${meta}</div>
        </div>
      </a>
      <div class="related-section">
        <button class="related-btn" onclick="toggleRelated(this,'${safeTitle}')">+ 관련 기사 보기</button>
        <div class="related-list"></div>
      </div></div>`;
  }

  const thumbHtml = item.thumb ? `<div class="thumb"><img src="${item.thumb}" alt="" loading="lazy"></div>` : '';
  return `<a class="card" href="${item.url}" target="_blank" rel="noopener">
    ${thumbHtml}
    <div class="card-body">
      <div class="tag-row"><span class="tag ${tagClass}">${tagLabel}</span>${newDot}</div>
      <div class="card-title">${item.title}</div>
      <div class="card-meta">${meta}</div>
    </div></a>`;
}

window.toggleRelated = function(btnEl, title) {
  const listEl = btnEl.nextElementSibling;
  if (listEl.innerHTML) {
    const isHidden = listEl.style.display === 'none';
    listEl.style.display = isHidden ? 'block' : 'none';
    btnEl.textContent = isHidden ? '- 접기' : '+ 관련 기사 보기';
    return;
  }
  btnEl.textContent = '- 접기';
  fetchRelatedNews(title, btnEl, listEl);
};

function render(tab) {
  const list = tab === 'all' ? allItems : allItems.filter(x => x.type === tab);
  document.getElementById('feed').innerHTML = list.length
    ? list.map(makeCard).join('')
    : '<div class="empty">콘텐츠가 없어요</div>';
}

document.getElementById('tabs').addEventListener('click', e => {
  const tb = e.target.closest('.tab');
  if (!tb) return;
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('on'));
  tb.classList.add('on');
  render(tb.dataset.t);
});

async function init() {
  setDate();
  const [socialItems, newsItems] = await Promise.all([fetchSocial(), fetchNews()]);
  allItems = [...socialItems, ...newsItems].sort((a, b) => new Date(b.date||0) - new Date(a.date||0));
  render('all');
}

init();
