'use strict';
const ICONS = { dev: 'fa-code', hardware: 'fa-microchip', photo: 'fa-camera', writer: 'fa-feather-pointed' };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const tags = (a = [], cls = '') => a.map(t => `<span class="tag ${cls}">${esc(t)}</span>`).join('');
const link = (u, i, t) => u ? `<a class="btn" href="${esc(u)}" target="_blank" rel="noopener"><i class="${i}"></i>${esc(t)}</a>` : '';
const imgFail = `onerror="this.style.display='none'"`;

let DATA, KEYS = [], VISIBLE = [], LB = { items: [], i: 0 }, FS = 19;

/* ---------- Рендеры разделов ---------- */
const RENDER = {
  dev: s => `
    ${s.stack?.length ? `<div class="flex flex-wrap gap-2 mb-8">${tags(s.stack)}</div>` : ''}
    <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${(s.projects || []).map(p => `
      <article class="card flex flex-col">
        ${p.image ? `<img class="cover" src="${esc(p.image)}" alt="Скриншот: ${esc(p.title)}" loading="lazy" ${imgFail}>` : ''}
        <div class="p-5 flex flex-col gap-3 grow">
          <h3 class="text-lg font-semibold">${esc(p.title)}</h3>
          <p class="text-sm muted grow">${esc(p.description)}</p>
          <div class="flex flex-wrap gap-2">${tags(p.tags)}</div>
          <div class="flex flex-wrap gap-2 pt-1">${link(p.github, 'fa-brands fa-github', 'GitHub')}${link(p.demo, 'fa-solid fa-play', 'Демо')}</div>
        </div>
      </article>`).join('')}
    </div>`,

  hardware: s => `
    <div class="grid gap-5 md:grid-cols-2">${(s.projects || []).map((p, i) => `
      <article class="card flex flex-col">
        ${p.image ? `<button class="cover-btn" data-hw="${i}" data-start="0" aria-label="Открыть фото"><img class="cover" src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy" ${imgFail}></button>` : ''}
        <div class="p-5 flex flex-col gap-3 grow">
          <div class="flex items-start justify-between gap-3">
            <h3 class="text-lg font-semibold">${esc(p.title)}</h3>
            ${p.mcu ? `<span class="tag mono shrink-0">${esc(p.mcu)}</span>` : ''}
          </div>
          <p class="text-sm muted grow">${esc(p.description)}</p>
          <div class="flex flex-wrap gap-2">${tags(p.components, 'mono')}</div>
          <div class="flex flex-wrap gap-2 pt-1">
            ${p.schematic ? `<button class="btn" data-hw="${i}" data-start="1"><i class="fa-solid fa-diagram-project"></i>Схема</button>` : ''}
            ${link(p.datasheet, 'fa-solid fa-file-lines', 'Datasheet')}${link(p.github, 'fa-brands fa-github', 'Прошивка')}
          </div>
        </div>
      </article>`).join('')}
    </div>`,

  photo: s => {
    const cats = ['all', ...new Set((s.photos || []).map(p => p.category).filter(Boolean))];
    return `<div class="flex flex-wrap gap-2 mb-8" id="chips">${cats.map(c =>
      `<button class="chip ${c === 'all' ? 'on' : ''}" data-filter="${esc(c)}">${c === 'all' ? 'Все' : esc(c)}</button>`).join('')}</div>
      <div class="gallery" id="gallery">${gallery(s.photos || [], 'all')}</div>`;
  },

  writer: s => `
    <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">${(s.works || []).map((w, i) => `
      <article class="card flex flex-col p-6 gap-3">
        <span class="tag self-start">${esc(w.type)}</span>
        <h3 class="text-xl font-semibold" style="font-family:Literata,serif">${esc(w.title)}</h3>
        <p class="text-sm muted grow" style="font-family:Literata,serif">${esc(w.excerpt)}</p>
        <div class="flex items-center justify-between gap-3 pt-1">
          <span class="text-xs muted">${esc(w.date)}</span>
          <button class="btn" data-work="${i}"><i class="fa-solid fa-book-open"></i>Читать</button>
        </div>
      </article>`).join('')}
    </div>`
};

function gallery(list, f) {
  VISIBLE = f === 'all' ? list : list.filter(p => p.category === f);
  return VISIBLE.map((p, i) => `
    <figure data-ph="${i}" tabindex="0" role="button" aria-label="${esc(p.title)}">
      <img src="${esc(p.thumb || p.src)}" alt="${esc(p.title)}" loading="lazy" ${imgFail}>
      <figcaption>${esc(p.title)}</figcaption>
    </figure>`).join('');
}

/* ---------- Переключение разделов ---------- */
function show(key) {
  if (!KEYS.includes(key)) key = KEYS[0];
  const s = DATA.sections[key];
  document.body.dataset.sec = key;
  $('#dd-label').textContent = s.label;
  $('#dd-icon').className = 'fa-solid ' + ICONS[key];
  document.querySelectorAll('#dd-menu button').forEach(b => b.setAttribute('aria-current', b.dataset.k === key));
  const v = $('#view');
  v.classList.remove('enter'); void v.offsetWidth;
  v.innerHTML = `<div class="sec-head"><h2><i class="fa-solid ${ICONS[key]}"></i>${esc(s.title)}</h2><p>${esc(s.subtitle)}</p></div>` + RENDER[key](s);
  v.classList.add('enter');
  document.title = `${s.label} — ${DATA.profile.name}`;
  window.scrollTo({ top: 0 });
}
const route = () => show(location.hash.slice(1));

/* ---------- Lightbox ---------- */
function openLB(items, i) { LB = { items, i }; drawLB(); $('#lightbox').classList.add('open'); document.body.style.overflow = 'hidden'; }
function drawLB() {
  const it = LB.items[LB.i];
  $('#lb-img').src = it.src;
  $('#lb-cap').innerHTML = `<b>${esc(it.title)}</b>${it.caption ? ' — ' + esc(it.caption) : ''} <span class="muted">(${LB.i + 1}/${LB.items.length})</span>`;
  document.querySelectorAll('.lb-prev,.lb-next').forEach(b => b.style.display = LB.items.length > 1 ? '' : 'none');
}
const stepLB = d => { LB.i = (LB.i + d + LB.items.length) % LB.items.length; drawLB(); };
const closeLB = () => { $('#lightbox').classList.remove('open'); document.body.style.overflow = ''; };

/* ---------- Ридер ---------- */
async function openReader(w) {
  let text = w.text || '';
  if (w.file) { try { text = await (await fetch(w.file)).text(); } catch { text = 'Не удалось загрузить файл: ' + w.file; } }
  $('#rd-body').innerHTML = `<p class="meta">${esc(w.type)}, ${esc(w.date)}</p><h1>${esc(w.title)}</h1>
    <div class="${w.kind === 'poem' ? 'poem' : 'story'}">${marked.parse(text, { breaks: true })}</div>`;
  $('#reader').classList.add('open'); document.body.style.overflow = 'hidden';
  $('#rd-scroll').scrollTop = 0; $('#rd-progress').style.width = '0';
}
const closeReader = () => { $('#reader').classList.remove('open'); document.body.style.overflow = ''; };
const setFS = d => { FS = Math.min(28, Math.max(15, FS + d)); $('#rd-body').style.setProperty('--fs', FS + 'px'); };

/* ---------- Инициализация ---------- */
async function init() {
  try {
    const r = await fetch('data.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    DATA = await r.json();
  } catch (e) {
    $('#dd-label').textContent = 'Ошибка';
    $('#view').innerHTML = `<div class="card p-6"><b>Не удалось загрузить data.json</b><p class="muted mt-2">${esc(e.message)}. Проверьте синтаксис JSON. При локальном просмотре откройте сайт через сервер: <code>python -m http.server</code>, а не двойным кликом по файлу.</p></div>`;
    return;
  }
  const P = DATA.profile || {};
  KEYS = Object.keys(DATA.sections).filter(k => RENDER[k]);
  $('#brand').textContent = P.name || 'Портфолио';
  $('#foot-name').textContent = `© ${new Date().getFullYear()} ${P.name || ''}`;
  $('#foot-links').innerHTML = [[P.github, 'fa-brands fa-github', 'GitHub'], [P.telegram, 'fa-brands fa-telegram', 'Telegram'], [P.email && 'mailto:' + P.email, 'fa-solid fa-envelope', 'Email']]
    .filter(x => x[0]).map(([u, i, t]) => `<a href="${esc(u)}" target="_blank" rel="noopener"><i class="${i}"></i> ${t}</a>`).join('');

  $('#dd-menu').innerHTML = KEYS.map(k => `<li><button data-k="${k}"><i class="fa-solid ${ICONS[k]} ico" style="--ac:${{ dev: '#8b9bff', hardware: '#44e0a0', photo: '#ff7a6b', writer: '#f0b27a' }[k]}"></i>${esc(DATA.sections[k].label)}</button></li>`).join('');

  const dd = $('#dd-menu'), btn = $('#dd-btn');
  const setMenu = o => { dd.classList.toggle('open', o); btn.setAttribute('aria-expanded', o); };
  btn.onclick = e => { e.stopPropagation(); setMenu(!dd.classList.contains('open')); };
  dd.onclick = e => { const b = e.target.closest('button'); if (!b) return; setMenu(false); location.hash === '#' + b.dataset.k ? show(b.dataset.k) : (location.hash = b.dataset.k); };
  document.addEventListener('click', () => setMenu(false));

  $('#view').addEventListener('click', e => {
    const t = e.target.closest('[data-ph],[data-hw],[data-work],[data-filter]'); if (!t) return;
    const d = t.dataset;
    if (d.ph !== undefined) openLB(VISIBLE.map(p => ({ src: p.src, title: p.title, caption: p.caption })), +d.ph);
    else if (d.hw !== undefined) {
      const p = DATA.sections.hardware.projects[+d.hw];
      const it = [{ src: p.image, title: p.title, caption: 'Фото' }, { src: p.schematic, title: p.title, caption: 'Схема' }].filter(x => x.src);
      openLB(it, Math.min(+d.start, it.length - 1));
    } else if (d.work !== undefined) openReader(DATA.sections.writer.works[+d.work]);
    else if (d.filter) {
      $('#gallery').innerHTML = gallery(DATA.sections.photo.photos, d.filter);
      document.querySelectorAll('#chips .chip').forEach(c => c.classList.toggle('on', c === t));
    }
  });
  $('#view').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.dataset.ph !== undefined) { e.preventDefault(); e.target.click(); } });

  $('#lb-close').onclick = closeLB; $('#lb-prev').onclick = () => stepLB(-1); $('#lb-next').onclick = () => stepLB(1);
  $('#lightbox').addEventListener('click', e => { if (e.target.id === 'lightbox') closeLB(); });
  let x0 = 0;
  $('#lightbox').addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
  $('#lightbox').addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50 && LB.items.length > 1) stepLB(dx < 0 ? 1 : -1); });

  $('#rd-close').onclick = closeReader; $('#rd-minus').onclick = () => setFS(-1); $('#rd-plus').onclick = () => setFS(1);
  $('#rd-scroll').addEventListener('scroll', e => { const s = e.target; $('#rd-progress').style.width = (s.scrollTop / Math.max(1, s.scrollHeight - s.clientHeight) * 100) + '%'; });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeLB(); closeReader(); setMenu(false); }
    if ($('#lightbox').classList.contains('open')) { if (e.key === 'ArrowLeft') stepLB(-1); if (e.key === 'ArrowRight') stepLB(1); }
  });

  window.addEventListener('hashchange', route);
  route();
}
init();
