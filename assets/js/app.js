/* Placar — interface */

/* ================= Armazenamento ================= */
const KEY = 'placar.v1';
const Store = {
  d: null,
  load() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(KEY)); } catch (e) { raw = null; }
    this.d = Object.assign({ overrides: {}, custom: [], removed: [], comps: [] }, raw || {});
    this.d.settings = Object.assign({ chaos: 25, homeAdv: 1, goals: 1, altitude: 1, speed: 'normal' }, (raw && raw.settings) || {});
  },
  save() {
    try { localStorage.setItem(KEY, JSON.stringify(this.d)); }
    catch (e) { toast('Não foi possível salvar: o armazenamento do navegador está cheio ou bloqueado.'); }
  }
};

/* ================= Clubes ================= */
const Teams = {
  map: {},
  list: [],
  refresh() {
    const { overrides, custom, removed } = Store.d;
    const base = BASE_TEAMS.filter(t => !removed.includes(t.id)).map(t => ({ ...t, ...(overrides[t.id] || {}), edited: !!overrides[t.id] }));
    this.list = [...base, ...custom.map(t => ({ ...t, custom: true }))];
    this.map = Object.fromEntries(this.list.map(t => [t.id, t]));
  },
  get(id) { return this.map[id] || null; },
  base(id) { return BASE_TEAMS.find(t => t.id === id); }
};

/* ================= Utilidades ================= */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pct = x => `${Math.round(x * 100)}%`;
const ovr = t => Math.round((t.atk + t.def) / 2);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const nameOf = id => (Teams.get(id) || { name: 'Clube removido' }).name;
const shortOf = id => (Teams.get(id) || { short: '???' }).short;

const I = {
  undo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="width:15px;height:15px;margin-right:4px;vertical-align:-3px"><path d="M9 14 4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  bracket: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 4h5v5H3zM3 15h5v5H3zM8 6.5h3v11H8M11 12h4M15 9.5h6v5h-6z"/></svg>',
  ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7.5l3.8 2.8-1.4 4.4H9.6l-1.4-4.4z"/><path d="M12 7.5V3.2M15.8 10.3l4-1.4M14.4 14.7l2.6 3.6M9.6 14.7L7 18.3M8.2 10.3l-4-1.4"/></svg>',
  table: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M3 14h18M9 9v11"/></svg>',
  groups: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  swiss: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6h7M6 8.5v7M8 8l8 8M16 8l-8 8M8.5 18h7M18 8.5v7"/></svg>',
  play: '<svg viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4v14M7 4L3.5 7.5M7 4l3.5 3.5M17 20V6M17 20l3.5-3.5M17 20l-3.5-3.5"/></svg>',
  reroll: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/></svg>',
  x: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  plus: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  left: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
  mountain: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M3 20l6.5-11 4 6.5 2.5-4L21 20z"/></svg>',
  dice: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.2" fill="currentColor"/><circle cx="15" cy="15" r="1.2" fill="currentColor"/><circle cx="15" cy="9" r="1.2" fill="currentColor"/><circle cx="9" cy="15" r="1.2" fill="currentColor"/></svg>',
  info: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  pause: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>',
  skip: '<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M5 5.5v13l9-6.5zM15 5h3v14h-3z"/></svg>',
  edit: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4L19 9l-4-4L4 16z"/></svg>'
};
const FORMAT_ICON = { league: I.table, groups: I.groups, knockout: I.bracket, swiss: I.swiss };

function crest(idOrTeam, size = 32) {
  const t = typeof idOrTeam === 'string' ? Teams.get(idOrTeam) : idOrTeam;
  const s = `style="--s:${size}px"`;
  if (!t) return `<span class="crest" ${s}><svg viewBox="0 0 40 46"><path d="M20 2l17 6v14c0 12-8 18.5-17 22C11 40.5 3 34 3 22V8z" fill="#D6DBCD"/></svg></span>`;
  if (t.logo) return `<span class="crest" ${s}><img src="${esc(t.logo)}" alt="" loading="lazy"></span>`;
  const [c1, c2] = t.colors || ['#888', '#fff'];
  const light = isLight(c1);
  const txt = (t.short || '?').slice(0, 3);
  return `<span class="crest" ${s}><svg viewBox="0 0 40 46" aria-hidden="true">
    <path d="M20 2l17 6v14c0 12-8 18.5-17 22C11 40.5 3 34 3 22V8z" fill="${esc(c1)}" stroke="${light ? 'rgba(0,0,0,.18)' : 'rgba(0,0,0,.08)'}" stroke-width="1.5"/>
    <path d="M3 30.5c4 0 30 0 34 0" stroke="${esc(c2)}" stroke-width="3" opacity=".85"/>
    <text x="20" y="${txt.length > 2 ? 23.5 : 24}" text-anchor="middle" font-family="Lexend, sans-serif" font-weight="700" font-size="${txt.length > 2 ? 10.5 : 13}" fill="${esc(isLight(c2) === light ? (light ? '#161916' : '#fff') : c2)}">${esc(txt)}</text>
  </svg></span>`;
}
function isLight(hex) {
  const h = (hex || '#888').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

let toastTimer;
function toast(html) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast'; el.innerHTML = html;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2800);
}

/* ================= Modal ================= */
const Modal = {
  el: null, renderFn: null,
  open(renderFn, cls = '') {
    this.close();
    this.renderFn = renderFn;
    const bg = document.createElement('div');
    bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true"></div>`;
    bg.addEventListener('mousedown', e => { if (e.target === bg) Modal.close(); });
    document.body.appendChild(bg);
    this.el = bg;
    this.refresh();
    const f = bg.querySelector('input[type=text], button');
    if (f) f.focus({ preventScroll: true });
  },
  refresh() { if (this.el) this.el.firstElementChild.innerHTML = this.renderFn(); },
  close() { if (this.el) { this.el.remove(); this.el = null; this.renderFn = null; } }
};
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { stopAnim(); Modal.close(); }
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !Modal.el && !/INPUT|TEXTAREA|SELECT/.test((e.target.tagName || ''))) {
    const c = currentComp(); if (c && undoStack(c).length) { e.preventDefault(); undoComp(c); }
  }
  if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('si')) {
    e.preventDefault();
    const all = [...document.querySelectorAll('.si:not([disabled])')];
    const next = all[all.indexOf(e.target) + 1];
    if (next) { next.focus(); next.select(); } else e.target.blur();
  }
});

/* ================= Estado de UI ================= */
const UI = {
  match: { h: 'real-madrid', a: 'sport', neutral: true, legs: 1, decider: 'none', result: null, mc: null },
  comp: {},           // por competição: { tab, date, evoSrc, evoSel }
  undo: {},           // por competição: pilha de cópias para desfazer
  clubs: { filter: 'BRA-A', search: '' },
  picker: null,
  wizard: null,
  hero: null,
  anim: null,
  skipAll: false
};

/* ================= Animação de partida ================= */
// velocidade: milissegundos para os 90 minutos
const SPEEDS = { lenta: 40000, normal: 15000, rapida: 5000, instant: 0 };
const SPEED_LABELS = [['lenta', 'Lenta'], ['normal', 'Normal'], ['rapida', 'Rápida'], ['instant', 'Instantâneo']];

function animate(m, onFrame, onDone, fixedMs) {
  const total = m.et ? 120 : 90;
  const ctl = { paused: false, stopped: false, minute: 0, done: false, skip() { ctl.minute = total; ctl.paused = false; }, stop() { ctl.stopped = true; } };
  const per = () => (fixedMs ?? SPEEDS[Store.d.settings.speed] ?? SPEEDS.normal) / 90;
  const finish = () => { ctl.done = true; onDone && onDone(); syncPlaybar(); };
  if (reduced || per() === 0 || (fixedMs == null && UI.skipAll)) { onFrame(total, true); finish(); return ctl; }
  let last = null, shown = -1;
  const tick = ts => {
    if (ctl.stopped) return;
    if (last == null) last = ts;
    const dt = Math.min(100, ts - last); last = ts;
    const p = per();
    if (!ctl.paused) ctl.minute = p === 0 ? total : Math.min(total, ctl.minute + dt / p);
    const fin = ctl.minute >= total;
    const mi = Math.floor(ctl.minute);
    if (mi !== shown || fin) { shown = mi; onFrame(mi, fin); }
    if (!fin) requestAnimationFrame(tick); else finish();
  };
  requestAnimationFrame(tick);
  return ctl;
}
function stopAnim() { if (UI.anim) { UI.anim.stop(); UI.anim = null; } }

function speedSeg() {
  const sp = Store.d.settings.speed;
  return `<div class="seg speed-seg" role="group" aria-label="Velocidade da partida">${SPEED_LABELS.map(([k, l]) => `<button class="${sp === k ? 'on' : ''}" data-act="setSpeed" data-v="${k}">${l}</button>`).join('')}</div>`;
}
function playbarHTML() {
  return `<div class="playbar">
    <span class="pb-label">Velocidade</span>${speedSeg()}
    <span class="pb-btns">
      <button class="btn btn-ghost btn-sm" data-act="animPause" data-pb="pause">${I.pause} Pausar</button>
      <button class="btn btn-ghost btn-sm" data-act="animSkip" data-pb="skip">${I.skip} Pular para o fim</button>
    </span>
  </div>`;
}
function syncPlaybar() {
  const live = UI.anim && !UI.anim.done;
  document.querySelectorAll('[data-pb]').forEach(b => { b.disabled = !live; });
  document.querySelectorAll('[data-pb=pause]').forEach(b => { b.innerHTML = UI.anim && UI.anim.paused ? `${I.play.replace('<svg', '<svg width="15" height="15"')} Continuar` : `${I.pause} Pausar`; });
  const sp = Store.d.settings.speed;
  document.querySelectorAll('.speed-seg button').forEach(b => b.classList.toggle('on', b.dataset.v === sp));
}

const scoreAt = (m, min, final) => {
  if (final) return [m.hg, m.ag];
  const g = (m.ev || []).filter(e => e.k === 'goal' && e.m < min + 1);
  return [g.filter(e => e.s === 0).length, g.filter(e => e.s === 1).length];
};

/* subtítulo do placar */
function matchSub(m, ctx = {}) {
  const parts = [];
  if (ctx.agg) {
    const [x, y] = ctx.agg; // do ponto de vista do time "a" do confronto
    parts.push(`Agregado ${x} × ${y}`);
  }
  if (m.pen) {
    const w = m.pen.h > m.pen.a ? m.h : m.a;
    parts.push(`Pênaltis ${m.pen.h} × ${m.pen.a}: ${esc(nameOf(w))} ${ctx.agg ? 'se classifica' : 'vence'}`);
  } else if (ctx.agg && ctx.winner) {
    parts.push(`${esc(nameOf(ctx.winner))} se classifica`);
  } else if (m.et) parts.push('Após prorrogação');
  else if (!ctx.agg) parts.push('Fim de jogo');
  return parts.join(' · ');
}

function boardHTML(m, minute, final, ctx = {}) {
  const [sh, sa] = scoreAt(m, minute, final);
  const evs = (m.ev || []).filter(e => final || e.m < minute + 1);
  let tl = '', ht = false, et = false;
  evs.forEach(e => {
    if (!ht && e.m > 45.99) { tl += `<div class="tl sep">Intervalo</div>`; ht = true; }
    if (!et && e.m > 90.99) { tl += `<div class="tl sep">Prorrogação</div>`; et = true; }
    const lbl = e.k === 'goal' ? `Gol · ${esc(shortOf(e.s ? m.a : m.h))}` : 'Expulsão';
    const ico = `<i class="ico ${e.k === 'red' ? 'red' : ''}"></i>`;
    tl += `<div class="tl"><span class="l">${e.s === 0 ? `${lbl}${ico}` : ''}</span><span class="min">${e.t}'</span><span>${e.s === 1 ? `${ico}${lbl}` : ''}</span></div>`;
  });
  const clock = final ? 'Encerrado' : `<span class="live">${minute}'</span>`;
  const pens = final && m.pen && m.pen.kh ? `<div class="pens-row"><div class="pens">${m.pen.kh.map(k => `<i class="${k ? '' : 'miss'}"></i>`).join('')}</div><span>pênaltis</span><div class="pens">${m.pen.ka.map(k => `<i class="${k ? '' : 'miss'}"></i>`).join('')}</div></div>` : '';
  return `<div class="scoreboard">
    <div class="clock"><span>${esc(ctx.title || (m.neutral ? 'Campo neutro' : `Casa: ${nameOf(m.h)}`))}</span>${clock}</div>
    <div class="score-line">
      <div class="score-team">${crest(m.h, 64)}<span>${esc(nameOf(m.h))}</span></div>
      <div class="score-num">${sh}<span style="opacity:.35;margin:0 8px">×</span>${sa}</div>
      <div class="score-team">${crest(m.a, 64)}<span>${esc(nameOf(m.a))}</span></div>
    </div>
    <div class="sub">${final ? matchSub(m, ctx) : ''}</div>
    ${pens}
    <div class="timeline">${tl || (final ? `<div class="tl sep">${m.manual ? 'Resultado lançado por você' : 'Sem gols'}</div>` : '')}</div>
  </div>`;
}

function statsHTML(ms, title) {
  // ms: lista de partidas do ponto de vista do primeiro mandante (h de ms[0])
  if (ms.some(m => !m.st)) return `<div class="stats-card"><h3>Estatísticas</h3><p class="hint" style="margin-top:10px">Resultado lançado por você: sem estatísticas de jogo. Para ter posse, finalizações e linha do tempo, apague o placar e use a simulação.</p></div>`;
  const A = ms[0].h;
  const acc = { pos: [0, 0], shots: [0, 0], sot: [0, 0], xg: [0, 0] };
  ms.forEach(m => {
    const flip = m.h !== A;
    ['pos', 'shots', 'sot', 'xg'].forEach(k => {
      const v = flip ? [m.st[k][1], m.st[k][0]] : m.st[k];
      acc[k][0] += v[0]; acc[k][1] += v[1];
    });
  });
  acc.pos = acc.pos.map(v => Math.round(v / ms.length));
  acc.xg = acc.xg.map(v => Math.round(v * 10) / 10);
  const row = (label, [x, y], fmt = v => v) => {
    const tot = (x + y) || 1;
    return `<div class="stat"><div class="top"><b>${fmt(x)}</b><span>${label}</span><b>${fmt(y)}</b></div>
      <div class="dual"><span style="flex:${x / tot}"></span><span style="flex:${y / tot}"></span></div></div>`;
  };
  const B = ms[0].a;
  return `<div class="stats-card">
    <div class="section-head" style="margin-bottom:18px"><h3>${esc(title || 'Estatísticas')}</h3>
      <span class="small muted" style="display:flex;gap:8px;align-items:center">${crest(A, 20)} ${esc(shortOf(A))} × ${esc(shortOf(B))} ${crest(B, 20)}</span></div>
    ${row('Posse de bola', acc.pos, v => v + '%')}
    ${row('Finalizações', acc.shots)}
    ${row('No alvo', acc.sot)}
    ${row('Gols esperados (xG)', acc.xg, v => v.toFixed(1))}
  </div>`;
}

/* ================= Páginas ================= */
const Pages = {};

/* ---------- Início ---------- */
Pages.home = () => {
  const serieA = Teams.list.filter(t => t.league === 'BRA-A');
  const top5 = Teams.list.slice().sort((a, b) => ovr(b) - ovr(a) || b.atk - a.atk).slice(0, 5);
  const comps = Store.d.comps.slice(-3).reverse();
  const collage = serieA.slice(0, 9);
  return `
  <section class="hero"><div class="wrap">
    <div>
      <h1>Simule ligas, copas e clássicos <span class="green">do seu jeito</span></h1>
      <p class="lede">Monte campeonatos com tabela, sorteio e mata-mata, ajuste a força de cada clube e veja quem leva o título. Tudo roda aqui, no seu computador.</p>
      <div class="hero-cta">
        <a class="btn btn-lime" href="#/partida">Simular uma partida</a>
        <a class="play-link" href="#/competicoes" data-act="newComp"><span class="icon-btn">${I.play}</span>Criar competição</a>
      </div>
      <div class="hero-chips">
        <a class="chip" href="#/competicoes" data-act="newFromTemplate" data-id="brasileirao-2026">Brasileirão 2026</a>
        <a class="chip" href="#/competicoes" data-act="newFromTemplate" data-id="premier-2627">Premier League</a>
        <a class="chip" href="#/competicoes" data-act="newFromTemplate" data-id="laliga-2627">LaLiga</a>
        <a class="chip" href="#/competicoes" data-act="newFromTemplate" data-id="champions-2627">Champions League</a>
        <a class="chip" href="#/competicoes" data-act="newFormat" data-id="knockout">Mata-mata</a>
        <a class="chip" href="#/competicoes" data-act="newFormat" data-id="groups">Grupos</a>
        <a class="chip" href="#/clubes">Ranking dos clubes</a>
      </div>
    </div>
    <div class="stage" id="heroStage">
      <div class="ring"></div>
      <div class="float card-stats" id="heroStats"></div>
      <div class="float card-prob" id="heroProb"></div>
      <div class="float card-score" id="heroScore"></div>
      <div class="float card-ovr" id="heroFav"></div>
      <button class="icon-btn reroll" data-act="heroReroll" title="Simular outro clássico" aria-label="Simular outro jogo">${I.reroll}</button>
    </div>
  </div></section>

  <section class="clubs-strip"><div class="wrap">
    <p>Clubes da Série A 2026</p>
    <div class="strip">${serieA.map(t => `<a href="#/clubes" title="${esc(t.name)}">${crest(t, 38)}</a>`).join('')}</div>
  </div></section>

  <section class="section"><div class="wrap">
    <div class="section-head"><span class="pill">Modos</span><span class="aside">Tudo o que precisa para simular, nada além disso.</span></div>
    <p class="statement">Organize <span class="g">campeonatos inteiros</span> ou decida um único jogo, com tabela, sorteio, prorrogação e <span class="t">pênaltis</span> resolvidos pelo simulador.</p>
    <div class="modes">
      <a class="mode m1" href="#/clubes">
        <div class="mode-collage">${collage.map(t => crest(t, 36)).join('')}</div>
        <div><h3>Ranking dos clubes</h3><p>Ataque e defesa de cada time, do seu jeito.</p></div>
      </a>
      <a class="mode m2" href="#/competicoes">
        <span class="glyph">${I.trophy}</span>
        <h3>Competições oficiais</h3>
        <p>Brasileirão, as cinco grandes ligas da Europa e a Champions, com os clubes da temporada. Troque qualquer time antes de começar.</p>
      </a>
      <a class="mode m3" href="#/competicoes" data-act="newComp">
        <span class="glyph">${I.bracket}</span>
        <h3>Suas competições</h3>
        <p>Pontos corridos, grupos, mata-mata ou liga suíça. O site sorteia, monta as fases e cruza o chaveamento.</p>
      </a>
      <a class="mode m4" href="#/partida">
        <span class="glyph">${I.ball}</span>
        <h3>Partida avulsa</h3>
        <p>Real Madrid × Sport? Escolha os dois, o mando e o que acontece se empatar.</p>
      </a>
    </div>
  </div></section>

  <section class="band">
    <div class="watermark" aria-hidden="true">placar</div>
    <div class="wrap">
      <div class="rank-card">
        <div class="top"><span class="tag">${I.trophy.replace('<svg', '<svg width="15" height="15"')} Ranking geral</span><span class="small" style="color:rgba(255,255,255,.5)">${Teams.list.length} clubes</span></div>
        <p class="label">Os mais fortes agora (OVR)</p>
        <div>${top5.map((t, i) => `<div class="rank-row"><span class="n">${i + 1}</span>${crest(t, 26)}<span>${esc(t.name)}</span><span class="o">${ovr(t)}</span></div>`).join('')}</div>
        <div class="actions"><a class="btn btn-line btn-sm" href="#/clubes">Editar ranking</a></div>
      </div>
      <div class="steps">
        <h2>Comece em três passos</h2>
        <ol>
          <li><span class="n">1</span><span><b>Ajuste o ranking.</b> Ataque e defesa de cada clube definem a chance de gol, e é isso que deixa os placares realistas.</span></li>
          <li><span class="n">2</span><span><b>Escolha a competição.</b> Use um modelo pronto ou crie a sua no formato que quiser.</span></li>
          <li><span class="n">3</span><span><b>Simule.</b> Rodada a rodada ou tudo de uma vez, acompanhando tabela e chaveamento.</span></li>
        </ol>
      </div>
    </div>
  </section>

  ${comps.length ? `<section class="section"><div class="wrap">
    <div class="section-head"><h2 style="font-size:24px">Suas competições</h2><a class="btn btn-ghost btn-sm" href="#/competicoes">Ver todas</a></div>
    <div class="comp-list">${comps.map(compCard).join('')}</div>
  </div></section>` : ''}
  `;
};

function heroDemo() {
  if (UI.hero) UI.hero.stop();
  const pool = Teams.list.filter(t => t.league === 'BRA-A');
  if (pool.length < 2) return;
  const [h, a] = Engine.shuffle(pool).slice(0, 2).map(t => t.id);
  const m = Engine.playMatch(Engine.newMatch(h, a));
  const [ph, pd, pa] = Engine.probabilities(h, a, false);
  const fav = ph >= pa ? h : a;
  $('#heroProb').innerHTML = `
    <div class="row"><small>Probabilidade antes do jogo</small><small>Casa: ${esc(shortOf(h))}</small></div>
    <div class="probbar"><span style="flex:${ph};background:var(--grass)"></span><span style="flex:${pd};background:rgba(15,61,36,.3)"></span><span style="flex:${pa};background:#fff"></span></div>
    <div class="row"><div><small>${esc(shortOf(h))}</small><div class="big">${pct(ph)}</div></div><div style="text-align:center"><small>Empate</small><div class="big">${pct(pd)}</div></div><div style="text-align:right"><small>${esc(shortOf(a))}</small><div class="big">${pct(pa)}</div></div></div>`;
  $('#heroFav').innerHTML = `${crest(fav, 26)}<span>Favorito: <b>${esc(nameOf(fav))}</b> · OVR ${ovr(Teams.get(fav))}</span>`;
  const statsCard = (min, final) => {
    const k = final ? 1 : min / 90;
    const s1 = Math.round(m.st.shots[0] * k), s2 = Math.round(m.st.shots[1] * k);
    const mx = Math.max(1, m.st.shots[0], m.st.shots[1]);
    return `<h4>Finalizações</h4>
      <div class="hbar"><span>${esc(shortOf(h))}</span><i style="width:${Math.max(3, s1 / mx * 100)}%"></i><b>${s1}</b></div>
      <div class="hbar b"><span>${esc(shortOf(a))}</span><i style="width:${Math.max(3, s2 / mx * 100)}%"></i><b>${s2}</b></div>`;
  };
  const frame = (min, final) => {
    const [sh, sa] = scoreAt(m, min, final);
    const goals = m.ev.filter(e => e.k === 'goal' && (final || e.m < min + 1)).slice(-2);
    $('#heroScore').innerHTML = `
      <div class="clock"><span>Série A · ao vivo</span>${final ? '<span>Encerrado</span>' : `<span class="live">${min}'</span>`}</div>
      <div class="score-line">
        <div class="score-team">${crest(h, 46)}<span>${esc(nameOf(h))}</span></div>
        <div class="score-num">${sh} <span style="opacity:.35">×</span> ${sa}</div>
        <div class="score-team">${crest(a, 46)}<span>${esc(nameOf(a))}</span></div>
      </div>
      <div class="goals">${goals.map(g => `<span>${g.t}' · gol do ${esc(nameOf(g.s ? a : h))}</span>`).join('')}</div>`;
    $('#heroStats').innerHTML = statsCard(min, final);
  };
  UI.hero = animate(m, frame, null, 5200);
}

/* ---------- Partida avulsa ---------- */
Pages.partida = () => {
  const S = UI.match;
  const H = Teams.get(S.h), A = Teams.get(S.a);
  const neutral = S.legs === 1 && S.neutral;
  const [ph, pd, pa] = H && A ? Engine.probabilities(S.h, S.a, neutral) : [0, 0, 0];
  const side = (t, role, key) => `<div class="side">
    <span class="role">${role}</span>
    ${t ? crest(t, 108) : crest(null, 108)}
    <div class="name">${t ? esc(t.name) : 'Escolha um clube'}</div>
    ${t && t.alt >= 1500 ? `<span class="alt-badge" title="Altitude do estádio">${I.mountain} ${t.alt.toLocaleString('pt-BR')} m</span>` : ''}
    ${t ? `<div class="ratings"><div class="rating"><small>ATA</small><b>${t.atk}</b></div><div class="rating"><small>DEF</small><b>${t.def}</b></div><div class="rating ovr"><small>OVR</small><b>${ovr(t)}</b></div></div>` : ''}
    <div class="pick"><button class="btn btn-line btn-sm" data-act="pickSide" data-k="${key}">Trocar clube</button></div>
  </div>`;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${S[k] === v ? 'on' : ''}" data-act="matchOpt" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
  return `<section class="page"><div class="wrap">
    <div class="page-head"><div><h1>Partida avulsa</h1><p>Qualquer clube contra qualquer clube. A chance de cada um vem do ranking (ataque × defesa), do mando e do fator zebra.</p></div></div>
    <div class="match-setup">
      ${side(H, S.legs === 2 ? 'Mandante na ida' : (neutral ? 'Clube 1' : 'Mandante'), 'h')}
      <div class="middle">
        <div><label class="f">Formato</label>${seg('legs', [[1, 'Jogo único'], [2, 'Ida e volta']])}</div>
        ${S.legs === 1 ? `
          <div><label class="f">Local</label>${seg('neutral', [[false, 'Casa'], [true, 'Campo neutro']])}</div>
          <div><label class="f">Se empatar</label>${seg('decider', [['none', 'Empate'], ['et', 'Prorrogação'], ['pens', 'Pênaltis']])}</div>` :
          `<p class="small" style="color:rgba(255,255,255,.6)">Na volta, se o agregado empatar: prorrogação e pênaltis. Sem gol fora.</p>`}
        <div>
          <label class="f">${S.legs === 2 ? 'Probabilidade no jogo de ida' : 'Probabilidade'}</label>
          <div class="probbar"><span style="flex:${ph};background:var(--lime)"></span><span style="flex:${pd};background:#5B6355"></span><span style="flex:${pa};background:#2E8C9A"></span></div>
          <div class="prob-legend"><span><b>${pct(ph)}</b>${esc(H ? H.short : '')}</span><span style="text-align:center"><b>${pct(pd)}</b>Empate</span><span style="text-align:right"><b>${pct(pa)}</b>${esc(A ? A.short : '')}</span></div>
        </div>
        <div><label class="f">Velocidade da partida</label>${speedSeg()}</div>
        <div class="go">
          <button class="btn btn-lime" data-act="simMatch" ${H && A ? '' : 'disabled'}>Simular partida</button>
          <button class="btn btn-ghost btn-sm" data-act="simMany" ${H && A ? '' : 'disabled'}>Simular 1.000 vezes</button>
          <button class="btn btn-ghost btn-sm" data-act="swapSides">${I.swap.replace('<svg', '<svg width="15" height="15"')} Inverter mando</button>
        </div>
      </div>
      ${side(A, S.legs === 2 ? 'Mandante na volta' : (neutral ? 'Clube 2' : 'Visitante'), 'a')}
    </div>
    <div id="matchResult"></div>
  </div></section>`;
};

function runMatch() {
  const S = UI.match;
  stopAnim();
  UI.skipAll = false;
  const box = $('#matchResult');
  if (S.legs === 2) {
    const tie = Engine.newTie(S.h, S.a, 2);
    Engine.playTieLeg(tie, 0); Engine.playTieLeg(tie, 1);
    const [m1, m2] = tie.m;
    const agg = Engine.tieAggregate(tie);
    box.innerHTML = `${playbarHTML()}<div class="result"><div id="b1"></div><div id="b2"><div class="scoreboard" style="opacity:.35;min-height:300px;display:grid;place-items:center">Volta</div></div></div><div class="result" id="statsRow" style="grid-template-columns:1fr"></div>`;
    UI.anim = animate(m1, (min, fin) => $('#b1').innerHTML = boardHTML(m1, min, fin, { title: 'Ida' }), () => {
      UI.anim = animate(m2, (min, fin) => $('#b2').innerHTML = boardHTML(m2, min, fin, { title: 'Volta', agg: [agg[1], agg[0]], winner: tie.w }), () => {
        $('#statsRow').innerHTML = statsHTML([m1, m2], 'Estatísticas somadas (ida + volta)');
      });
      syncPlaybar();
    });
  } else {
    const m = Engine.playMatch(Engine.newMatch(S.h, S.a, { neutral: S.neutral }), { neutral: S.neutral, decider: S.decider });
    box.innerHTML = `${playbarHTML()}<div class="result"><div id="b1"></div><div id="statsBox"></div></div>`;
    UI.anim = animate(m, (min, fin) => $('#b1').innerHTML = boardHTML(m, min, fin), () => {
      $('#statsBox').innerHTML = statsHTML([m]);
    });
  }
  syncPlaybar();
  box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
}

function runMany() {
  const S = UI.match;
  stopAnim();
  const r = Engine.monteCarlo(S.h, S.a, { legs: S.legs, neutral: S.neutral, decider: S.decider }, 1000);
  const H = Teams.get(S.h), A = Teams.get(S.a);
  const maxP = Math.max(...r.top.map(t => t.p));
  const showAdv = S.legs === 2 || S.decider !== 'none';
  $('#matchResult').innerHTML = `<div class="panel mc">
    <div class="section-head" style="margin-bottom:0"><h3>1.000 simulações ${S.legs === 2 ? '(placar agregado)' : ''}</h3>
      <span class="small muted">Média de gols: ${esc(H.short)} ${r.gh.toFixed(2)} × ${r.ga.toFixed(2)} ${esc(A.short)}</span></div>
    <div class="mc-grid">
      <div>
        <div class="big-probs">
          <div><small>${esc(H.name)}</small><b>${pct(r.w)}</b><small>vitórias</small></div>
          <div><small>Empates</small><b>${pct(r.d)}</b><small>${S.legs === 2 ? 'no agregado' : 'no tempo normal'}</small></div>
          <div><small>${esc(A.name)}</small><b>${pct(r.l)}</b><small>vitórias</small></div>
        </div>
        ${showAdv ? `<p class="small muted" style="margin-top:14px">Contando prorrogação e pênaltis: <b style="color:var(--ink)">${esc(H.short)} ${pct(r.adv[0])}</b> · <b style="color:var(--ink)">${esc(A.short)} ${pct(r.adv[1])}</b> ${S.legs === 2 ? 'de chance de classificação' : 'de chance de vencer'}.</p>` : ''}
      </div>
      <div>
        <p class="small muted" style="margin-bottom:10px">Placares mais frequentes</p>
        <div class="score-dist">${r.top.map(t => `<div class="r"><b>${t.score.replace('-', ' × ')}</b><span class="bar" style="width:${t.p / maxP * 100}%"></span><span>${(t.p * 100).toFixed(1)}%</span></div>`).join('')}</div>
      </div>
    </div>
  </div>`;
}

/* ---------- Competições ---------- */
const tplOf = c => TEMPLATES.find(t => t.id === c.template);
function compFormatLine(c) {
  if (c.reg) { const t = tplOf(c); return t ? t.short : 'Regulamento oficial'; }
  const f = FORMATS[c.format].name;
  const n = c.teams.length;
  if (c.format === 'league') return `${f} · ${n} clubes · ${c.cfg.legs === 2 ? 'turno e returno' : 'turno único'}`;
  if (c.format === 'groups') return `${f} · ${n} clubes · ${c.cfg.groups} grupo${c.cfg.groups > 1 ? 's' : ''}`;
  if (c.format === 'knockout') return `${f} · ${n} clubes · ${c.cfg.koLegs === 2 ? 'ida e volta' : 'jogo único'}`;
  return `${f} · ${n} clubes`;
}
function compCrest(c) {
  if (c.crest) return c.crest;
  const t = c.template && (Array.isArray(TEMPLATES) ? TEMPLATES.find(x => x.id === c.template) : TEMPLATES[c.template]);
  return t ? t.crest || null : null;
}
function compBadge(c, size = 40) {
  const cr = compCrest(c);
  if (cr) return `<span class="crest" style="--s:${size}px"><img src="${esc(cr)}" alt=""></span>`;
  return `<span class="tpl" style="all:unset;display:grid;place-items:center;width:${size}px;height:${size}px;border-radius:12px;background:var(--lime-3);color:var(--grass)"><span style="width:${size * .5}px;height:${size * .5}px;display:block">${FORMAT_ICON[c.format] || I.trophy}</span></span>`;
}
function compCard(c) {
  const p = Engine.progress(c);
  return `<a class="comp-card" href="#/c/${c.id}">
    <div class="t">${compBadge(c)}<div><h4>${esc(c.name)}</h4><div class="f">${esc(compFormatLine(c))}</div></div></div>
    <div class="progress"><span style="width:${p * 100}%"></span></div>
    <div class="foot">${c.champion ? `<span class="champ-tag">${crest(c.champion, 20)} Campeão: ${esc(nameOf(c.champion))}</span>` : `<span>${Math.round(p * 100)}% concluído</span>`}<span>${new Date(c.created).toLocaleDateString('pt-BR')}</span></div>
  </a>`;
}

function tplIcon(t) {
  if (t.crest) return `<span class="ic"><img src="${t.crest}" alt="" style="width:30px;height:30px;object-fit:contain"></span>`;
  const top = Object.values(t.entries).flat().map(id => Teams.get(id)).filter(Boolean).sort((a, b) => ovr(b) - ovr(a)).slice(0, 3);
  return `<span class="ic-stack">${top.map(tm => `<span>${crest(tm, 26)}</span>`).join('')}</span>`;
}
Pages.competicoes = () => {
  const comps = Store.d.comps.slice().reverse();
  const groups = TEMPLATE_GROUPS.map(g => [g, TEMPLATES.filter(t => (t.group || 'Outras ligas') === g)]).filter(([, l]) => l.length);
  return `<section class="page"><div class="wrap">
    <div class="page-head"><div><h1>Competições</h1><p>Os modelos oficiais seguem o regulamento de cada competição (fases, desempates, playoffs, acesso e rebaixamento) e deixam trocar qualquer clube antes do sorteio. Ou crie uma do zero.</p></div>
      <button class="btn btn-lime" data-act="newComp">${I.plus} Nova competição</button></div>
    ${comps.length ? `<div class="section-head"><h2 style="font-size:22px">Salvas</h2><span class="aside">${comps.length} competiç${comps.length === 1 ? 'ão' : 'ões'}</span></div>
      <div class="comp-list" style="margin-bottom:44px">${comps.map(compCard).join('')}</div>` : ''}
    ${groups.map(([g, list], gi) => `
      <div class="section-head" style="margin-top:${gi ? 34 : 0}px"><h2 style="font-size:19px">${esc(g)}</h2></div>
      <div class="tpl-grid">
        ${list.map(t => `<button class="tpl" data-act="newFromTemplate" data-id="${t.id}">${tplIcon(t)}
          <div><h4>${esc(t.name)}</h4><p>${esc(t.short)}</p></div></button>`).join('')}
        ${gi === 0 ? `<button class="tpl custom" data-act="newComp"><span class="ic">${I.plus.replace('width="16" height="16"', 'width="22" height="22"')}</span>
          <div><h4>Personalizada</h4><p>Pontos corridos, grupos, mata-mata ou liga suíça, com os clubes que quiser.</p></div></button>` : ''}
      </div>`).join('')}
  </div></section>`;
};

/* ---------- Assistente de criação ---------- */
const DEFAULT_CFG = {
  league: { legs: 2 },
  groups: { groups: 8, groupLegs: 2, qualify: 2, koLegs: 2, finalLegs: 1 },
  knockout: { koLegs: 2, finalLegs: 1, seeding: 'ranking' },
  swiss: { koLegs: 2, finalLegs: 1 }
};
function startTplWizard(id) {
  const tpl = TEMPLATES.find(t => t.id === id);
  UI.wizard = { mode: 'tpl', template: id, name: tpl.name, entries: JSON.parse(JSON.stringify(tpl.entries)), picking: null, filter: 'ALL', search: '' };
  Modal.open(wizardHTML, 'wide');
}
function leagueSelect(scope, value, extra = '') {
  const leagues = Object.keys(LEAGUES).filter(k => Teams.list.some(t => t.league === k));
  return `<select class="lg-select" data-inp="leagueSel" data-scope="${scope}" aria-label="Filtrar por liga">
    <option value="ALL" ${value === 'ALL' ? 'selected' : ''}>Todas as ligas</option>${extra}
    ${leagues.map(k => `<option value="${k}" ${value === k ? 'selected' : ''}>${esc(LEAGUES[k])} (${Teams.list.filter(t => t.league === k).length})</option>`).join('')}
  </select>`;
}
function tplWizardHTML() {
  const W = UI.wizard, tpl = TEMPLATES.find(t => t.id === W.template);
  const head = t => `<div class="modal-head"><h3>${t}</h3><button class="close" data-act="close" aria-label="Fechar">${I.x}</button></div>`;
  const used = new Set(Object.values(W.entries).flat());
  if (W.picking) {
    const cur = W.entries[W.picking.role][W.picking.i];
    const q = W.search.trim().toLowerCase();
    const list = Teams.list.filter(t => (t.id === cur || !used.has(t.id)) && (W.filter === 'ALL' || t.league === W.filter) && (!q || t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q)))
      .sort((a, b) => ovr(b) - ovr(a));
    return head(`Trocar ${esc(nameOf(cur))}`) + `
      <div class="toolbar">${leagueSelect('wiz', W.filter)}<input class="search" type="text" data-inp="wizSearch" placeholder="Buscar clube" value="${esc(W.search)}"></div>
      <div class="picker-grid">${list.map(t => `<button class="pick-team ${t.id === cur ? 'on' : ''}" data-act="tplPick" data-id="${t.id}">${crest(t, 26)}<span>${esc(t.name)}</span><span class="o">${ovr(t)}</span></button>`).join('') || '<p class="hint">Nenhum clube disponível.</p>'}</div>
      <div class="modal-foot"><button class="btn btn-ghost" data-act="tplCancelPick">Voltar</button><span class="hint">Clubes que já estão na competição não aparecem.</span></div>`;
  }
  const roles = Object.keys(W.entries);
  return head(esc(tpl.name)) + `
    <div class="field"><label>Nome</label><input type="text" data-inp="wizName" value="${esc(W.name)}" maxlength="60"></div>
    <div class="reg-box"><b>Regulamento</b><ul>${tpl.rules.slice(0, 3).map(r => `<li>${esc(r)}</li>`).join('')}</ul><span class="hint">O regulamento completo e as fontes ficam na aba Regulamento da competição.</span></div>
    ${roles.map(role => `<div class="section-head" style="margin:18px 0 10px"><h4 style="font-size:14px">${esc((tpl.roles || {})[role] || 'Clubes')}</h4><span class="aside">${W.entries[role].length} clubes · clique para trocar</span></div>
      <div class="picker-grid">${W.entries[role].map((id, i) => `<button class="pick-team slot" data-act="tplSlot" data-role="${role}" data-i="${i}">${crest(id, 26)}<span>${esc(nameOf(id))}</span><span class="o">${Teams.get(id) ? ovr(Teams.get(id)) : '–'}</span></button>`).join('')}</div>`).join('')}
    <div class="modal-foot">
      <button class="btn btn-ghost" data-act="tplReset">Restaurar clubes originais</button>
      <button class="btn btn-lime" data-act="tplCreate">Criar e sortear</button>
    </div>`;
}
function startWizard(opts = {}) {
  const tpl = opts.template ? TEMPLATES.find(t => t.id === opts.template) : null;
  const format = tpl ? tpl.format : (opts.format || 'league');
  UI.wizard = {
    step: tpl || opts.format ? 2 : 1,
    template: tpl ? tpl.id : null,
    format,
    name: tpl ? tpl.name : '',
    cfg: { ...DEFAULT_CFG[format], ...(tpl ? tpl.cfg : {}) },
    teams: tpl ? tpl.teams.filter(id => Teams.get(id)) : [],
    zones: tpl ? tpl.zones : [],
    crest: tpl ? tpl.crest || null : null,
    filter: tpl ? (Teams.get(tpl.teams[0]) || {}).league || 'ALL' : 'BRA-A',
    search: '',
    error: ''
  };
  Modal.open(wizardHTML, 'wide');
}
function defaultZones(format, n) {
  if (format === 'league') return [{ from: 1, to: 1, color: ZONE_COLORS.lib, label: 'Campeão' }];
  if (format === 'swiss') {
    const KO = n >= 24 ? 16 : 8, d = KO / 2;
    return [
      { from: 1, to: d, color: ZONE_COLORS.lib, label: KO === 16 ? 'Oitavas de final' : 'Quartas de final' },
      { from: d + 1, to: d + KO, color: ZONE_COLORS.prelib, label: 'Playoff' },
      ...(n > d + KO ? [{ from: d + KO + 1, to: n, color: ZONE_COLORS.rel, label: 'Eliminado' }] : [])
    ];
  }
  return [];
}
function wizardHTML() {
  const W = UI.wizard;
  if (W.mode === 'tpl') return tplWizardHTML();
  const steps = `<div class="wizard-steps">${[1, 2, 3].map(i => `<span class="${W.step >= i ? 'on' : ''}"></span>`).join('')}</div>`;
  const head = t => `<div class="modal-head"><h3>${t}</h3><button class="close" data-act="close" aria-label="Fechar">${I.x}</button></div>`;
  if (W.step === 1) {
    return head('Nova competição') + steps + `
      <p class="hint" style="margin-bottom:14px">Escolha o formato. Na próxima etapa você ajusta turnos, grupos e mata-mata.</p>
      <div class="fmt-grid">${Object.entries(FORMATS).map(([k, f]) => `<button class="fmt ${W.format === k ? 'on' : ''}" data-act="wizFormat" data-v="${k}">
        <span style="display:block;width:24px;height:24px;color:var(--leaf);margin-bottom:10px">${FORMAT_ICON[k]}</span><h4>${f.name}</h4><p>${f.desc}</p></button>`).join('')}</div>
      <div class="modal-foot"><span></span><button class="btn btn-dark" data-act="wizNext">Continuar</button></div>`;
  }
  if (W.step === 2) {
    const c = W.cfg;
    const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button class="${c[k] === v ? 'on' : ''}" data-act="wizCfg" data-k="${k}" data-v="${v}">${l}</button>`).join('')}</div>`;
    const field = (label, inner) => `<div class="field"><label>${label}</label>${inner}</div>`;
    const ko = field('Mata-mata', seg('koLegs', [[1, 'Jogo único'], [2, 'Ida e volta']])) + field('Final', seg('finalLegs', [[1, 'Jogo único (neutro)'], [2, 'Ida e volta']]));
    let opts = '';
    if (W.format === 'league') opts = field('Turnos', seg('legs', [[1, 'Turno único'], [2, 'Turno e returno']]));
    if (W.format === 'groups') opts =
      field('Número de grupos', seg('groups', [[1, '1'], [2, '2'], [4, '4'], [8, '8'], [16, '16']])) +
      field('Jogos na fase de grupos', seg('groupLegs', [[1, 'Só ida'], [2, 'Ida e volta']])) +
      field('Classificados por grupo', seg('qualify', [[1, '1'], [2, '2']])) + ko;
    if (W.format === 'knockout') opts = ko + field('Chaveamento', seg('seeding', [['ranking', 'Por ranking'], ['random', 'Sorteio livre']]));
    if (W.format === 'swiss') opts = ko;
    return head(W.template ? 'Configurar competição' : `Nova competição · ${FORMATS[W.format].name}`) + steps + `
      <div class="field"><label>Nome</label><input type="text" data-inp="wizName" value="${esc(W.name)}" placeholder="Ex.: Copa dos Campeões 2026" maxlength="60"></div>
      <div class="form-grid">${opts}</div>
      <p class="hint">${W.format === 'league' ? 'Desempate na tabela: pontos, vitórias, saldo e gols marcados.' : 'Empate no mata-mata vai para prorrogação e pênaltis. Não existe gol fora de casa.'}
      ${W.format === 'swiss' ? ' Cada clube faz 8 jogos (2 contra cada pote). Do 1º ao 8º vai direto às oitavas; do 9º ao 24º disputa o playoff.' : ''}
      ${W.format === 'groups' ? ' O sorteio usa potes pelo ranking: cada grupo recebe um clube de cada pote.' : ''}</p>
      <div class="modal-foot"><button class="btn btn-ghost" data-act="wizBack">${W.template ? 'Cancelar' : 'Voltar'}</button><button class="btn btn-dark" data-act="wizNext">Escolher clubes</button></div>`;
  }
  // etapa 3: clubes
  const err = Engine.validate(W.format, W.teams, W.cfg);
  const q = W.search.trim().toLowerCase();
  const list = Teams.list.filter(t =>
    (W.filter === 'ALL' || (W.filter === 'SEL' ? W.teams.includes(t.id) : t.league === W.filter)) &&
    (!q || t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q))
  ).sort((a, b) => ovr(b) - ovr(a));
  return head('Escolha os clubes') + steps + `
    <div class="toolbar">${leagueSelect('wiz', W.filter, `<option value="SEL" ${W.filter === 'SEL' ? 'selected' : ''}>Selecionados (${W.teams.length})</option>`)}<input class="search" type="text" data-inp="wizSearch" placeholder="Buscar clube" value="${esc(W.search)}">
      <button class="btn btn-ghost btn-sm" data-act="wizAll">Marcar visíveis</button><button class="btn btn-ghost btn-sm" data-act="wizNone">Limpar seleção</button></div>
    <div class="picker-grid" id="wizGrid">${list.map(t => `<button class="pick-team ${W.teams.includes(t.id) ? 'on' : ''}" data-act="wizToggle" data-id="${t.id}">${crest(t, 26)}<span>${esc(t.name)}</span><span class="o">${ovr(t)}</span></button>`).join('') || '<p class="hint">Nenhum clube encontrado.</p>'}</div>
    <div class="modal-foot">
      <button class="btn btn-ghost" data-act="wizBack">Voltar</button>
      <span class="${err ? 'error' : 'hint'}">${err ? esc(err) : `${W.teams.length} clubes selecionados`}</span>
      <button class="btn btn-lime" data-act="wizCreate" ${err ? 'disabled' : ''}>Criar e sortear</button>
    </div>`;
}

/* ---------- Página da competição ---------- */
function compTabs(c) {
  const P = ['prob', 'Probabilidades'];
  const V = evoSources(c).length ? [['evo', 'Evolução']] : [];
  if (c.reg) return [...c.spec.map((sp, i) => ['p' + i, sp.name]), ['games', 'Jogos'], ...V, P, ['rules', 'Regulamento']];
  if (c.format === 'league') return [['table', 'Classificação'], ['games', 'Jogos'], ...V, P];
  if (c.format === 'groups') return [['groups', 'Grupos'], ['games', 'Jogos'], ['bracket', 'Mata-mata'], ...V, P];
  if (c.format === 'swiss') return [['table', 'Fase de liga'], ['games', 'Jogos'], ['bracket', 'Mata-mata'], ...V, P];
  return [['bracket', 'Chaveamento'], ['games', 'Jogos'], P];
}
function defaultTab(c) {
  if (!c.reg) return compTabs(c)[0][0];
  const cur = Engine.currentStage(c);
  const i = c.stages.indexOf(cur);
  return 'p' + Math.max(0, i);
}

// lista de "datas" (rodadas) com os jogos
function koDates(st, prefix) {
  const out = [];
  st.rounds.forEach(rd => {
    const legs = Math.max(...rd.ties.map(t => t.m.length));
    const bo3 = rd.ties.some(t => t.bo3);
    for (let l = 0; l < legs; l++) {
      const items = rd.ties.filter(t => t.m[l]).map(t => ({ m: t.m[l], tie: t, leg: l }));
      const nm = prefix && prefix !== rd.name ? `${prefix} · ${rd.name}` : rd.name;
      if (items.length) out.push({ label: legs > 1 ? `${nm} · ${bo3 ? `jogo ${l + 1}` : l === 0 ? 'ida' : 'volta'}` : nm, items });
    }
  });
  return out;
}
function compDates(c) {
  const out = [];
  if (c.reg) {
    c.stages.forEach((st, i) => {
      if (!st || st.type === 'agg' || st.auto) return;
      const sp = c.spec[i];
      if (st.type === 'rr') {
        const gOf = {};
        if (st.groups.length > 1) st.groups.forEach(g => g.teams.forEach(id => { gOf[id] = g.name; }));
        st.rounds.forEach((r, k) => out.push({ label: `${sp.name} · rodada ${k + 1}`, items: r.map(m => ({ m, note: st.groups.length > 1 ? (gOf[m.h] === gOf[m.a] ? gOf[m.h] : 'Interzonal') : null })) }));
      } else out.push(...koDates(st, sp.name));
    });
    return out;
  }
  c.stages.forEach(st => {
    if (st.type === 'league' || st.type === 'swiss') st.rounds.forEach((r, i) => out.push({ label: `Rodada ${i + 1}`, items: r.map(m => ({ m })) }));
    if (st.type === 'groups') {
      const R = Math.max(...st.groups.map(g => g.rounds.length));
      for (let i = 0; i < R; i++) out.push({ label: `Grupos · ${i + 1}ª rodada`, items: st.groups.flatMap(g => (g.rounds[i] || []).map(m => ({ m, note: g.name }))) });
    }
    if (st.type === 'knockout') st.rounds.forEach(rd => {
      const legs = Math.max(...rd.ties.map(t => t.m.length));
      for (let l = 0; l < legs; l++) {
        const items = rd.ties.filter(t => t.m[l]).map(t => ({ m: t.m[l], tie: t, leg: l }));
        if (items.length) out.push({ label: legs > 1 ? `${rd.name} · ${l === 0 ? 'ida' : 'volta'}` : rd.name, items });
      }
    });
  });
  return out;
}

function tableHTML(c, ids, matches, zones = []) {
  return rowsTableHTML(Engine.table(ids, matches), zones);
}
function rowsTableHTML(rows, zones = [], legend = true) {
  const zoneOf = pos => zones.find(z => pos >= z.from && pos <= z.to);
  return `<div class="table-wrap"><table class="tbl">
    <thead><tr><th>#</th><th class="l">Clube</th><th>P</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>Últimos</th></tr></thead>
    <tbody>${rows.map((r, i) => {
      const z = zoneOf(i + 1);
      return `<tr><td class="pos" style="${z ? `--zc:${z.color}` : ''}">${i + 1}</td>
        <td class="l"><span class="team">${crest(r.id, 24)}${esc(nameOf(r.id))}</span></td>
        <td class="pts">${r.p}</td><td>${r.j}</td><td>${r.v}</td><td>${r.e}</td><td>${r.d}</td><td>${r.gp}</td><td>${r.gc}</td><td>${r.sg > 0 ? '+' : ''}${r.sg}</td>
        <td><span class="form">${r.form.map(f => `<i class="${f}">${f}</i>`).join('')}</span></td></tr>`;
    }).join('')}</tbody></table></div>
    ${legend && zones.length ? `<div class="legend">${zones.map(z => `<span><i style="background:${z.color}"></i>${esc(z.label)}</span>`).join('')}</div>` : ''}`;
}

function gameRow(item, c) {
  const { m, tie, leg } = item;
  const L = Engine.locate(c, m.id);
  const editable = Engine.canEdit(c, m.id);
  const win = m.played ? Engine.matchWinner(m) : null;
  const hw = m.played && (tie ? (m.hg > m.ag || (m.hg === m.ag && win === m.h)) : m.hg > m.ag);
  const aw = m.played && (tie ? (m.ag > m.hg || (m.hg === m.ag && win === m.a)) : m.ag > m.hg);
  const meta = [];
  if (m.played && m.et && !m.pen) meta.push('após prorrogação');
  if (m.played && m.pen) meta.push(`pênaltis ${m.pen.h}–${m.pen.a}`);
  if (tie && !tie.bo3 && leg === 1 && m.played) { const [x, y] = Engine.tieAggregate(tie); meta.push(`agregado ${y}–${x}`); }
  if (tie && tie.bo3 && m.played) { const [x, y] = Engine.tieAggregate(tie); meta.push(`série ${m.h === tie.a ? `${x}–${y}` : `${y}–${x}`}`); }
  if (tie && leg >= 1 && !editable) meta.push(tie.bo3 ? 'libera depois do jogo anterior' : 'libera depois da ida');
  if (tie && tie.rule && !tie.rule.pens && tie.better && !tie.bo3 && leg === tie.m.length - 1 && !m.played) meta.push(`empate classifica ${shortOf(tie.better)}`);
  const needPen = m.played && L && Engine.needsPens(L, m.hg, m.ag);
  const inp = (side, v, label) => `<input class="si" type="text" inputmode="numeric" maxlength="2" autocomplete="off" data-inp="score" data-id="${m.id}" data-side="${side}" value="${v ?? ''}" ${editable ? '' : 'disabled'} aria-label="${esc(label)}">`;
  return `<div class="game ${m.played ? 'done' : ''} ${needPen && !m.pen ? 'warn' : ''}">
    <span class="tm r"><span class="${hw ? 'w' : ''}">${esc(nameOf(m.h))}</span>${crest(m.h, 26)}</span>
    <span class="score-in">${inp('h', m.played ? m.hg : '', `Gols ${nameOf(m.h)}`)}<span class="x">×</span>${inp('a', m.played ? m.ag : '', `Gols ${nameOf(m.a)}`)}</span>
    <span class="tm">${crest(m.a, 26)}<span class="${aw ? 'w' : ''}">${esc(nameOf(m.a))}</span></span>
    <span class="g-acts">${m.played
      ? `<button data-act="openMatch" data-id="${m.id}" tabindex="-1" title="Ver detalhes" aria-label="Ver detalhes">${I.info}</button>`
      : `<button data-act="playOne" data-id="${m.id}" tabindex="-1" title="Simular este jogo" aria-label="Simular este jogo" ${editable ? '' : 'disabled'}>${I.dice}</button>`}</span>
    ${needPen ? `<span class="pen-in">Pênaltis ${inp('ph', m.pen ? m.pen.h : '', 'Pênaltis mandante')}<span class="x">×</span>${inp('pa', m.pen ? m.pen.a : '', 'Pênaltis visitante')}${m.pen ? '' : '<em>empatou: preencha os pênaltis</em>'}</span>` : ''}
    ${meta.length ? `<span class="meta">${meta.join(' · ')}</span>` : ''}
  </div>`;
}

function gamesHTML(c) {
  const dates = compDates(c);
  const st = UI.comp[c.id];
  if (st.date == null || st.date >= dates.length) {
    const i = dates.findIndex(d => d.items.some(x => !x.m.played));
    st.date = i < 0 ? dates.length - 1 : i;
  }
  const d = dates[st.date];
  let body = '';
  const groupsInDate = [...new Set(d.items.map(x => x.note).filter(Boolean))];
  if (groupsInDate.length) {
    body = groupsInDate.map(g => `<p class="game-label">${esc(g)}</p><div class="games">${d.items.filter(x => x.note === g).map(x => gameRow(x, c)).join('')}</div>`).join('');
  } else body = `<div class="games">${d.items.map(x => gameRow(x, c)).join('')}</div>`;
  return `<div class="round-nav">
      <span class="title">${esc(d.label)}</span>
      <span class="navb">
        ${d.items.some(x => !x.m.played) ? `<button class="btn btn-dark btn-sm" data-act="simDate">${I.dice} Simular os jogos que faltam</button>` : ''}
        <button class="close" data-act="dateNav" data-v="-1" ${st.date === 0 ? 'disabled' : ''} aria-label="Rodada anterior">${I.left}</button>
        <select data-inp="dateSel" aria-label="Escolher rodada">${dates.map((x, i) => `<option value="${i}" ${i === st.date ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select>
        <button class="close" data-act="dateNav" data-v="1" ${st.date === dates.length - 1 ? 'disabled' : ''} aria-label="Próxima rodada">${I.right}</button>
      </span>
    </div>${body}
    ${Engine.finished(c) ? '' : `<p class="hint" style="margin-top:14px">Digite o placar para lançar um resultado (Tab ou Enter passa para o próximo campo), ou use o dado para simular só aquele jogo. Para desfazer, apague os dois números.</p>`}`;
}

function bracketHTML(c) {
  const ko = c.stages.find(s => s && s.type === 'knockout');
  if (!ko) {
    return `<div class="panel empty"><h3>Chaveamento ainda não definido</h3><p>${c.format === 'groups' ? 'Ele é montado automaticamente quando a fase de grupos terminar.' : 'Ele é montado automaticamente quando a fase de liga terminar.'}</p></div>`;
  }
  return bracketStageHTML(c, ko, null);
}
function bracketStageHTML(c, ko, i) {
  const spec = i != null ? c.spec[i] : {};
  if (ko.auto) return `<div class="panel empty"><h3>Sem disputa</h3><p>${crest(ko.winner, 40)}</p><p style="margin-top:8px"><b>${esc(nameOf(ko.winner))}</b> ocupou as duas vagas e avança direto, como manda o regulamento.</p></div>`;
  const cols = ko.rounds.map(rd => ({ name: rd.name, ties: rd.ties }));
  const done = i != null ? Reg.stageDone(c, i) : !!c.champion;
  let last = ko.rounds[ko.rounds.length - 1];
  let n = last.playoff ? (ko.directSeeds || []).length : last.ties.length / 2;
  let r = ko.rounds.length;
  while (!done && n >= 1 && (!spec.maxRounds || r < spec.maxRounds)) {
    const names = { 1: 'Final', 2: 'Semifinal', 4: 'Quartas de final', 8: 'Oitavas de final', 16: '16 avos de final', 32: '32 avos de final' };
    cols.push({ name: (spec.roundNames && spec.roundNames[r]) || names[n] || `Fase de ${n * 2}`, ties: Array.from({ length: n }, () => null) });
    n = n / 2; r++;
    if (n < 1) break;
  }
  const tieCard = (t, isFinal) => {
    if (!t) return `<div class="tie" style="opacity:.5"><div class="ln"><span class="crest" style="--s:20px"></span><span class="muted">A definir</span><b></b></div><div class="ln"><span class="crest" style="--s:20px"></span><span class="muted">A definir</span><b></b></div></div>`;
    if (t.bye) return `<div class="tie"><div class="ln won">${crest(t.a, 20)}<span>${esc(nameOf(t.a))}</span><b></b></div><div class="note">Avança direto</div></div>`;
    const [ga, gb] = Engine.tieAggregate(t);
    const any = t.m.some(m => m.played);
    const lastM = t.m[t.m.length - 1];
    const notes = [];
    if (t.bo3) t.m.forEach((m, k) => { if (m.played) notes.push(`J${k + 1} ${m.hg}–${m.ag}${m.pen ? ` (pên. ${m.pen.h}–${m.pen.a})` : ''}`); });
    else {
      if (t.m.length === 2) t.m.forEach((m, k) => { if (m.played) notes.push(`${k ? 'Volta' : 'Ida'} ${m.hg}–${m.ag}`); });
      if (lastM.pen) notes.push(`pên. ${lastM.h === t.a ? `${lastM.pen.h}–${lastM.pen.a}` : `${lastM.pen.a}–${lastM.pen.h}`}`);
      else if (lastM.et) notes.push('prorrogação');
      if (t.w && t.better && ga === gb && !lastM.pen) notes.push('melhor campanha');
    }
    const cls = id => t.w ? (t.w === id ? 'won' : 'lost') : '';
    return `<button class="tie ${isFinal ? 'final' : ''}" data-act="${any ? 'openMatch' : 'playOne'}" data-id="${(t.m.slice().reverse().find(m => m.played) || t.m[0]).id}">
      <div class="ln ${cls(t.a)}">${crest(t.a, 20)}<span>${esc(nameOf(t.a))}</span><b>${any ? ga : ''}</b></div>
      <div class="ln ${cls(t.b)}">${crest(t.b, 20)}<span>${esc(nameOf(t.b))}</span><b>${any ? gb : ''}</b></div>
      ${notes.length ? `<div class="note">${notes.join(' · ')}</div>` : ''}
    </button>`;
  };
  return `<div class="bracket">${cols.map(col => `<div class="b-col"><h4>${esc(col.name)}</h4><div class="b-ties">${col.ties.map(t => tieCard(t, col.ties.length === 1 && cols[cols.length - 1] === col)).join('')}</div></div>`).join('')}</div>
  ${ko.directSeeds ? `<p class="hint">Classificados direto às oitavas: ${ko.directSeeds.map(id => esc(shortOf(id))).join(', ')}.</p>` : ''}`;
}

function phaseHTML(c, i) {
  const spec = c.spec[i], st = c.stages[i];
  if (!st && spec.confirm) return confirmHTML(c, i);
  if (!st) {
    const deps = (spec.after || []).map(d => (typeof d === 'number' ? c.spec[d].name : `${c.spec[d.phase].name} (até a rodada ${d.round + 1})`));
    return `<div class="panel empty"><h3>${esc(spec.name)}</h3><p>Esta fase é montada automaticamente quando ${deps.length ? esc(deps.join(' e ')) : 'a fase anterior'} terminar.</p></div>`;
  }
  if (st.type === 'knockout') return bracketStageHTML(c, st, i);
  const groups = st.type === 'agg' ? [{ name: st.name }] : st.groups;
  const zonesFor = g => (spec.groupZones ? spec.groupZones[g] : spec.zonesEach) || (groups.length === 1 ? spec.zones : null) || [];
  const carry = st.carry ? `<p class="hint" style="margin-bottom:12px">Os pontos da fase anterior foram mantidos${st.carry.factors && st.carry.factors.some(f => f !== 1) ? ' (no grupo marcado, pela metade)' : ''}.</p>` : '';
  if (groups.length === 1) return carry + rowsTableHTML(Reg.rank(c, i, 0), zonesFor(0));
  const legendZones = [];
  groups.forEach((g, gi) => zonesFor(gi).forEach(z => { if (!legendZones.some(x => x.label === z.label)) legendZones.push(z); }));
  return carry + `<div class="groups-grid ${groups.length > 4 ? 'many' : ''}">${groups.map((g, gi) => `<div><h4>${esc(g.name)}</h4>${rowsTableHTML(Reg.rank(c, i, gi), zonesFor(gi), false)}</div>`).join('')}</div>
    ${legendZones.length ? `<div class="legend">${legendZones.map(z => `<span><i style="background:${z.color}"></i>${esc(z.label)}</span>`).join('')}</div>` : ''}`;
}
/* ---------- Fase que espera confirmação de clubes (ex.: 3ºs da Libertadores na Sul-Americana) ---------- */
function confirmHTML(c, i) {
  const spec = c.spec[i], cf = spec.confirm, ids = c.entries[cf.role] || [];
  const ready = Reg.awaiting(c) === i;
  const libs = Store.d.comps.filter(x => x.reg && x.template === 'libertadores-2026' && x.stages[0] && Reg.stageDone(x, 0));
  return `<div class="panel">
    <div class="section-head" style="margin-bottom:6px"><h3>${esc(spec.name)}: ${esc(cf.label)}</h3><span class="aside">${ids.length} clubes · clique para trocar</span></div>
    <p class="hint" style="margin-bottom:14px">${ready ? 'A fase anterior terminou. Confira os clubes que entram agora e confirme para montar os confrontos.' : 'Esta fase começa quando a anterior terminar. Você já pode ajustar os clubes que vão entrar.'}</p>
    <div class="picker-grid">${ids.map((id, k) => `<button class="pick-team slot" data-act="guestSlot" data-phase="${i}" data-i="${k}">${crest(id, 26)}<span>${esc(nameOf(id))}</span><span class="o">${Teams.get(id) ? ovr(Teams.get(id)) : '–'}</span></button>`).join('')}</div>
    <div class="modal-foot">
      ${libs.length ? `<select class="lg-select" data-inp="guestImport" data-phase="${i}"><option value="">Importar 3ºs de uma Libertadores salva…</option>${libs.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select>` : '<span class="hint">Dica: se você tiver uma Libertadores salva com a fase de grupos encerrada, dá para importar os 3ºs colocados dela.</span>'}
      ${ready ? `<button class="btn btn-lime" data-act="guestConfirm" data-phase="${i}">Confirmar e montar ${esc(spec.name.toLowerCase())}</button>` : ''}
    </div>
  </div>`;
}


/* ---------- Evolução de posição (gráfico rodada a rodada) ---------- */
// cada fonte é uma tabela (fase de pontos corridos ou grupo) que dá para recalcular depois de cada rodada
function evoSources(c) {
  const out = [];
  const roundsOf = (rounds, ids) => { const set = new Set(ids); return rounds.map(rd => rd.filter(m => set.has(m.h) || set.has(m.a))); };
  if (c.reg) {
    c.spec.forEach((spec, i) => {
      const st = c.stages[i];
      if (!st || st.type !== 'rr') return;
      const zonesFor = g => (spec.groupZones ? spec.groupZones[g] : spec.zonesEach) || (st.groups.length === 1 ? spec.zones : null) || [];
      st.groups.forEach((g, gi) => {
        const rds = roundsOf(st.rounds, g.teams).map((rd, r) => ({ rd, r })).filter(x => x.rd.length);
        if (rds.length < 2) return;
        out.push({ key: `${i}:${gi}`, label: st.groups.length > 1 ? `${spec.name} · ${g.name}` : spec.name, n: g.teams.length, zones: zonesFor(gi),
          rounds: rds.map(x => x.rd), rankAt: k => Reg.rank(c, i, gi, rds[k].r).map(r => r.id) });
      });
    });
  } else {
    const st = c.stages[0];
    if (!st) return out;
    if (st.type === 'league' || st.type === 'swiss') {
      if (st.rounds.length >= 2) out.push({ key: '0:0', label: st.name || 'Classificação', n: st.teams.length, zones: c.zones || [], rounds: st.rounds,
        rankAt: k => Engine.table(st.teams, st.rounds.slice(0, k + 1).flat()).map(r => r.id) });
    } else if (st.type === 'groups') {
      st.groups.forEach((g, gi) => {
        if (g.rounds.length >= 2) out.push({ key: '0:' + gi, label: g.name, n: g.teams.length, zones: [{ from: 1, to: c.cfg.qualify, color: ZONE_COLORS.lib, label: 'Classificados' }], rounds: g.rounds,
          rankAt: k => Engine.table(g.teams, g.rounds.slice(0, k + 1).flat()).map(r => r.id) });
      });
    }
  }
  return out;
}
function lineColor(t) {
  const lum = hex => { const h = (hex || '#888888').replace('#', ''); const n = parseInt(h.length === 3 ? h.replace(/./g, x => x + x) : h, 16); return (0.299 * (n >> 16 & 255) + 0.587 * (n >> 8 & 255) + 0.114 * (n & 255)) / 255; };
  const [a, b] = (t && t.colors) || ['#888888', '#888888'];
  if (lum(a) < 0.82) return a;
  if (lum(b) < 0.82) return b;
  return '#8A9488';
}
function evoHTML(c) {
  const S = UI.comp[c.id];
  const srcs = evoSources(c);
  if (!srcs.length) return `<div class="panel empty"><h3>Sem tabela para acompanhar</h3><p>O gráfico aparece nas fases de pontos corridos e de grupos.</p></div>`;
  let src = srcs.find(x => x.key === S.evoSrc);
  if (!src) {
    // padrão: a fase de pontos corridos que está em andamento (ou a última jogada)
    const live = srcs.filter(x => x.rounds.some(rd => rd.some(m => m.played)));
    src = live.length ? live[live.length - 1] : srcs[0];
  }
  const played = src.rounds.map(rd => rd.some(m => m.played));
  const last = played.lastIndexOf(true);
  const sel = new Set(S.evoSel || []);
  const pick = srcs.length > 1 ? `<select class="lg-select" data-inp="evoSrc">${srcs.map(x => `<option value="${x.key}" ${x.key === src.key ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select>` : '';
  const head = `<div class="evo-head"><div><h3>Evolução na tabela</h3><p class="hint">Posição de cada clube depois de cada rodada. Passe o mouse ou toque em um escudo para destacar; dá para marcar vários.</p></div>${pick}</div>`;
  if (last < 0) return head + `<div class="panel empty"><h3>Nenhuma rodada jogada</h3><p>Simule ou lance resultados para ver o gráfico.</p></div>`;

  const R = src.rounds.length, N = src.n;
  const ranks = []; for (let k = 0; k <= last; k++) ranks.push(src.rankAt(k));
  const pos = {}; ranks.forEach((ids, k) => ids.forEach((id, p) => { (pos[id] = pos[id] || [])[k] = p + 1; }));
  const rowH = N > 24 ? 20 : N > 12 ? 26 : 34, L = 34, Rm = 48, step = Math.max(26, Math.min(110, 900 / Math.max(1, R - 1))), top = 14;
  const W = L + step * (R - 1) + Rm, H = top * 2 + rowH * (N - 1) + 18;
  const X = k => L + k * step, Y = p => top + (p - 1) * rowH;
  const cs = Math.min(rowH - 4, 24);
  const bands = src.zones.map(z => `<rect x="${L - 10}" y="${Y(z.from) - rowH / 2}" width="${step * (R - 1) + 20}" height="${rowH * (Math.min(z.to, N) - z.from + 1)}" fill="${z.color}" opacity=".13" rx="6"/>`).join('');
  const grid = Array.from({ length: N }, (_, p) => `<text x="${L - 16}" y="${Y(p + 1) + 4}" class="ax">${p + 1}</text>`).join('');
  const every = R > 30 ? 5 : R > 14 ? 2 : 1;
  const xs = Array.from({ length: R }, (_, k) => (k % every === 0 || k === R - 1 || k === last) ? `<text x="${X(k)}" y="${H - 2}" class="ax ${k === last ? 'cur' : ''}">${k + 1}</text>` : '').join('');
  const cur = `<line x1="${X(last)}" x2="${X(last)}" y1="${top - 8}" y2="${H - 16}" class="cur-line"/>`;
  const ids = ranks[last];
  const lines = ids.slice().reverse().map(id => {
    const t = Teams.get(id), col = lineColor(t), ps = pos[id];
    const pts = ps.map((p, k) => `${X(k)},${Y(p)}`).join(' ');
    const y = Y(ps[last]);
    const mark = t && t.logo ? `<image href="${esc(t.logo)}" x="${X(last) + 6}" y="${y - cs / 2}" width="${cs}" height="${cs}" preserveAspectRatio="xMidYMid meet"/>`
      : `<circle cx="${X(last) + 6 + cs / 2}" cy="${y}" r="${cs / 2}" fill="${col}"/><text x="${X(last) + 6 + cs / 2}" y="${y + 3}" class="sh">${esc(shortOf(id).slice(0, 3))}</text>`;
    return `<g class="tm ${sel.has(id) ? 'on' : ''}" data-act="evoPick" data-id="${id}"><title>${esc(nameOf(id))}: ${ps[last]}º após ${last + 1} rodada(s)</title>
      <polyline points="${pts}" fill="none" stroke="${col}" class="ln"/>${ps.map((p, k) => `<circle cx="${X(k)}" cy="${Y(p)}" r="2.6" fill="${col}" class="dt"/>`).join('')}
      <rect x="${X(last) + 4}" y="${y - cs / 2 - 1}" width="${cs + 4}" height="${cs + 2}" fill="transparent"/>${mark}</g>`;
  }).join('');
  const chips = ids.map((id, p) => `<button class="evo-chip ${sel.has(id) ? 'on' : ''}" data-act="evoPick" data-id="${id}" style="--lc:${lineColor(Teams.get(id))}"><b>${p + 1}</b>${crest(id, 20)}<span>${esc(shortOf(id))}</span></button>`).join('');
  return head + `<div class="panel evo">
    <div class="evo-wrap" data-x="${X(last) + cs + 10}"><svg class="evo-svg ${sel.size ? 'has-sel' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Gráfico de evolução de posições">${bands}${grid}${xs}${cur}${lines}</svg></div>
    <div class="evo-chips">${chips}${sel.size ? '<button class="btn btn-ghost btn-sm" data-act="evoClear">Limpar destaque</button>' : ''}</div>
    <p class="hint" style="margin-top:10px">Rodada ${last + 1} de ${R}${src.zones.length ? ' · faixas coloridas = zonas da tabela' : ''}.</p>
  </div>`;
}

/* ---------- Probabilidades (Monte Carlo do restante da competição) ---------- */
function probSetup(c) {
  const cols = [{ key: 'champ', label: 'Campeão', color: ZONE_COLORS.lib }];
  let teams, rankFn;
  if (c.reg) {
    teams = [...new Set(Object.values(c.entries).flat())];
    const cp = c.champSpec.phase;
    const main = ['rr', 'agg'].includes(c.spec[cp].type) ? cp : c.spec.findIndex(s => s.type === 'rr');
    const spec = c.spec[main];
    const zonesFor = g => (spec.groupZones ? spec.groupZones[g] : spec.zonesEach) || spec.zones || [];
    const nG = spec.groups && spec.groups.pattern ? spec.groups.pattern.length : spec.groups && spec.groups.roles ? spec.groups.roles.length : spec.groups && spec.groups.count ? spec.groups.count : 1;
    for (let g = 0; g < nG; g++) zonesFor(g).forEach(z => { if (!cols.some(x => x.label === z.label)) cols.push({ key: 'z:' + z.label, label: z.label, color: z.color }); });
    const tpl = tplOf(c);
    // destaques que só repetem posições da tabela principal (ex.: rebaixados = zona de rebaixamento) não viram coluna
    const onlyMain = src => { const ph = new Set(); const walk = x => { if (!x) return; if (x.phase != null) { ph.add(x.phase); if (!x.pos) ph.add(-1); } (x.list || x.uniqueFill || []).forEach(walk); if (x.from) walk(x.from); }; walk(src); return ph.size === 1 && ph.has(main); };
    (tpl && tpl.outcomes || []).forEach(o => { if (!onlyMain(o.src) && !cols.some(x => x.label === o.label)) cols.push({ key: 'o:' + o.label, label: o.label, color: o.color || ZONE_COLORS.up }); });
    const pattern = spec.groups && spec.groups.method === 'pattern';
    rankFn = x => {
      const out = [];
      const st = x.stages[main];
      if (!st) return out;
      const groups = st.type === 'agg' ? [0] : st.groups.map((_, g) => g);
      let offset = 0;
      groups.forEach(g => {
        const rows = Reg.rank(x, main, g);
        rows.forEach((r, k) => {
          const z = zonesFor(g).find(z => k + 1 >= z.from && k + 1 <= z.to);
          out.push({ id: r.id, pos: (pattern ? offset : 0) + k + 1, zone: z && z.label });
        });
        offset += rows.length;
      });
      if (tpl) Reg.outcomes(x, tpl).forEach(o => o.ids.forEach(id => out.push({ id, outcome: o.label })));
      return out;
    };
  } else {
    teams = c.teams.slice();
    const st0 = c.stages[0];
    const isTable = st0 && (st0.type === 'league' || st0.type === 'swiss');
    if (isTable) (c.zones || []).forEach(z => { if (!cols.some(x => x.label === z.label)) cols.push({ key: 'z:' + z.label, label: z.label, color: z.color }); });
    rankFn = x => {
      if (!isTable) return [];
      const s0 = x.stages[0];
      return Engine.table(s0.teams, s0.rounds.flat()).map((r, k) => { const z = (c.zones || []).find(z => k + 1 >= z.from && k + 1 <= z.to); return { id: r.id, pos: k + 1, zone: z && z.label }; });
    };
  }
  return { cols, teams, rankFn };
}
function runProb(c, n) {
  const { cols, teams, rankFn } = probSetup(c);
  const acc = {};
  teams.forEach(id => { acc[id] = { champ: 0, pos: 0, posN: 0, z: {}, o: {} }; });
  const json = JSON.stringify(c);
  let done = 0;
  UI.probRun = { id: c.id, done: 0, n };
  const batch = () => {
    if (!UI.probRun || UI.probRun.id !== c.id) return;
    Engine.setFast(true);
    try {
      const t0 = performance.now();
      while (done < n && performance.now() - t0 < 40) {
        const x = JSON.parse(json);
        for (let k = 0; k < 6; k++) {
          Engine.simulateAll(x);
          const w = x.reg ? Reg.awaiting(x) : -1;
          if (w >= 0) Reg.confirm(x, w); else break;
        }
        if (x.champion && acc[x.champion]) acc[x.champion].champ++;
        rankFn(x).forEach(r => {
          const a = acc[r.id]; if (!a) return;
          if (r.pos) { a.pos += r.pos; a.posN++; }
          if (r.zone) a.z[r.zone] = (a.z[r.zone] || 0) + 1;
          if (r.outcome) a.o[r.outcome] = (a.o[r.outcome] || 0) + 1;
        });
        done++;
      }
    } finally { Engine.setFast(false); }
    UI.probRun.done = done;
    const bar = $('#probBar');
    if (bar) bar.style.width = `${(done / n) * 100}%`;
    const lbl = $('#probLbl');
    if (lbl) lbl.textContent = `${done.toLocaleString('pt-BR')} de ${n.toLocaleString('pt-BR')} simulações`;
    if (done < n) { setTimeout(batch, 0); return; }
    const rows = teams.map(id => {
      const a = acc[id];
      const vals = { champ: a.champ / n };
      cols.slice(1).forEach(col => { const [kind, label] = [col.key.slice(0, 1), col.key.slice(2)]; vals[col.key] = ((kind === 'z' ? a.z : a.o)[label] || 0) / n; });
      return { id, vals, pos: a.posN ? a.pos / a.posN : null };
    }).sort((x, y) => y.vals.champ - x.vals.champ || (x.pos ?? 99) - (y.pos ?? 99));
    c.prob = { n, at: Date.now(), played: Engine.allMatches(c).filter(m => m.played).length, cols, rows };
    UI.probRun = null;
    Store.save();
    if (UI.comp[c.id] && UI.comp[c.id].tab === 'prob' && currentComp() === c) render();
  };
  setTimeout(batch, 0);
}
function probHTML(c) {
  const running = UI.probRun && UI.probRun.id === c.id;
  const played = Engine.allMatches(c).filter(m => m.played).length;
  const P = c.prob;
  const head = `<div class="prob-head">
    <div><h3>Chances até o fim</h3><p class="hint">O simulador joga o que falta da competição milhares de vezes, a partir dos resultados atuais (inclusive os que você lançou), e conta quantas vezes cada clube termina em cada situação.</p></div>
    <div class="prob-acts">
      <button class="btn btn-lime btn-sm" data-act="probRun" data-n="1000" ${running ? 'disabled' : ''}>${P ? 'Recalcular' : 'Calcular'} (1.000)</button>
      <button class="btn btn-ghost btn-sm" data-act="probRun" data-n="5000" ${running ? 'disabled' : ''}>Mais preciso (5.000)</button>
    </div>
  </div>`;
  if (running) return head + `<div class="panel"><p id="probLbl" class="hint">Preparando…</p><div class="progress" style="margin-top:10px"><span id="probBar" style="width:${(UI.probRun.done / UI.probRun.n) * 100}%"></span></div></div>`;
  if (Engine.finished(c) && !P) return head + `<div class="panel empty"><h3>Competição encerrada</h3><p>Não há mais nada para simular.</p></div>`;
  if (!P) return head + `<div class="panel empty"><h3>Ainda não calculado</h3><p>Clique em Calcular. Leva poucos segundos.</p></div>`;
  const stale = played !== P.played ? `<p class="hint stale">${played - P.played > 0 ? `${played - P.played} jogo(s) novos` : 'Resultados mudaram'} desde o último cálculo. Recalcule para atualizar.</p>` : '';
  const pct = v => (v === 0 ? '–' : v < 0.001 ? '<0,1%' : v > 0.999 && v < 1 ? '>99,9%' : `${(v * 100).toFixed(v < 0.1 ? 1 : 0).replace('.', ',')}%`);
  const hasPos = P.rows.some(r => r.pos != null);
  return head + stale + `<p class="hint" style="margin-bottom:10px">${P.n.toLocaleString('pt-BR')} simulações · calculado com ${P.played} jogo(s) disputados · ${new Date(P.at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</p>
    <div class="table-wrap"><table class="tbl prob">
      <thead><tr><th class="l">Clube</th>${P.cols.map(col => `<th><span class="ph" style="--zc:${col.color}">${esc(col.label)}</span></th>`).join('')}${hasPos ? '<th>Pos. média</th>' : ''}</tr></thead>
      <tbody>${P.rows.map(r => `<tr><td class="l"><span class="team">${crest(r.id, 22)}${esc(nameOf(r.id))}</span></td>
        ${P.cols.map(col => { const v = r.vals[col.key] || 0; return `<td class="pc" style="--pv:${Math.round(v * 100)}%;--zc:${col.color}">${pct(v)}</td>`; }).join('')}
        ${hasPos ? `<td>${r.pos != null ? r.pos.toFixed(1).replace('.', ',') : '–'}</td>` : ''}</tr>`).join('')}</tbody>
    </table></div>`;
}

function rulesHTML(c) {
  const t = tplOf(c);
  if (!t) return `<div class="panel empty"><h3>Regulamento indisponível</h3></div>`;
  return `<div class="panel rules">
    <h3>Como funciona</h3><ul>${t.rules.map(r => `<li>${esc(r)}</li>`).join('')}</ul>
    ${t.notes && t.notes.length ? `<h3 style="margin-top:22px">Simplificações no simulador</h3><ul>${t.notes.map(r => `<li>${esc(r)}</li>`).join('')}</ul>` : ''}
    ${t.sources && t.sources.length ? `<h3 style="margin-top:22px">Fontes</h3><ul>${t.sources.map(s => `<li><a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.t)}</a></li>`).join('')}</ul>` : ''}
  </div>`;
}
function outcomesHTML(c) {
  const t = tplOf(c);
  if (!t) return '';
  const outs = Reg.outcomes(c, t);
  if (!outs.length) return '';
  return `<div class="outcomes">${outs.map(o => `<div class="outcome" style="--oc:${o.color || ZONE_COLORS.up}"><small>${esc(o.label)}</small><div>${o.ids.map(id => `<span>${crest(id, 22)}${esc(nameOf(id))}</span>`).join('')}</div></div>`).join('')}</div>`;
}

Pages.comp = id => {
  const c = Store.d.comps.find(x => x.id === id);
  if (!c) return `<section class="page"><div class="wrap"><div class="panel empty"><h3>Competição não encontrada</h3><p>Ela pode ter sido excluída.</p><p style="margin-top:14px"><a class="btn btn-dark" href="#/competicoes">Ver competições</a></p></div></div></section>`;
  if (!UI.comp[id]) UI.comp[id] = { tab: defaultTab(c), date: null };
  const S = UI.comp[id];
  const p = Engine.progress(c);
  const st = Engine.currentStage(c);
  let body = '';
  if (S.tab === 'prob') body = probHTML(c);
  else if (S.tab === 'evo') body = evoHTML(c);
  else if (c.reg && S.tab[0] === 'p' && S.tab !== 'prob') body = phaseHTML(c, +S.tab.slice(1));
  else if (S.tab === 'rules') body = rulesHTML(c);
  else if (S.tab === 'table') {
    const stage = c.stages[0];
    body = tableHTML(c, stage.teams, stage.rounds.flat(), c.zones);
  } else if (S.tab === 'groups') {
    const stage = c.stages[0];
    const q = c.cfg.qualify;
    body = `<div class="groups-grid">${stage.groups.map(g => `<div><h4>${esc(g.name)}</h4>${tableHTML(c, g.teams, g.rounds.flat(), [{ from: 1, to: q, color: ZONE_COLORS.lib, label: '' }]).replace(/<div class="legend">[\s\S]*?<\/div>$/, '')}</div>`).join('')}</div>
      <div class="legend"><span><i style="background:${ZONE_COLORS.lib}"></i>Classificados ao mata-mata</span></div>`;
  } else if (S.tab === 'games') body = gamesHTML(c);
  else if (S.tab === 'bracket') body = bracketHTML(c);

  return `<section class="page"><div class="wrap">
    <div class="comp-hero">
      <div class="badge ${compCrest(c) ? '' : 'plain'}">${compCrest(c) ? `<img src="${esc(compCrest(c))}" alt="">` : FORMAT_ICON[c.format] || I.trophy}</div>
      <div>
        <h1>${esc(c.name)}</h1>
        <div class="f">${esc(compFormatLine(c))} · ${Engine.finished(c) ? 'encerrada' : `fase atual: ${esc(c.reg ? Reg.currentLabel(c) : (st.type === 'knockout' ? st.rounds[st.rounds.length - 1].name : st.name))}`}</div>
        <div class="progress"><span style="width:${p * 100}%"></span></div>
      </div>
      <div class="acts">
        <button class="btn btn-lime" data-act="compStep" ${Engine.finished(c) ? 'disabled' : ''}>Simular próxima rodada</button>
        <button class="btn btn-line" style="border-color:var(--lime);color:var(--lime)" data-act="compAll" ${Engine.finished(c) ? 'disabled' : ''}>Simular até o fim</button>
        <div class="row">
          <button class="btn btn-ghost btn-sm" data-act="compUndo" ${undoStack(c).length ? `title="Desfazer: ${esc(undoStack(c)[undoStack(c).length - 1].label)} (Ctrl+Z)"` : 'disabled title="Nada para desfazer"'}>${I.undo} Desfazer${undoStack(c).length ? `<span class="undo-n">${undoStack(c).length}</span>` : ''}</button>
          <button class="btn btn-ghost btn-sm" data-act="compClear" title="Apaga os resultados e mantém o sorteio">Limpar resultados</button>
          <button class="btn btn-ghost btn-sm" data-act="compRedraw" title="Faz um novo sorteio de tabela/grupos/chave">Novo sorteio</button>
          <button class="btn btn-ghost btn-sm btn-danger" data-act="compDelete">Excluir</button>
        </div>
      </div>
    </div>
    ${c.champion ? `<div class="champion">${crest(c.champion, 64)}<div><small>Campeão</small><h2>${esc(nameOf(c.champion))}</h2></div><span style="margin-left:auto;width:42px;height:42px;display:block">${I.trophy}</span></div>` : ''}
    ${c.reg ? outcomesHTML(c) : ''}
    ${c.reg && Reg.awaiting(c) >= 0 ? `<div class="callout"><div><b>${esc(c.spec[Reg.awaiting(c)].name)} prontos para começar.</b> Confirme os ${c.spec[Reg.awaiting(c)].confirm.count} clubes que entram nesta fase (${esc(c.spec[Reg.awaiting(c)].confirm.label)}).</div><button class="btn btn-dark btn-sm" data-act="compTab" data-v="p${Reg.awaiting(c)}">Revisar e confirmar</button></div>` : ''}
    <div class="tabs" role="tablist">${compTabs(c).map(([k, l]) => `<button role="tab" class="${S.tab === k ? 'on' : ''}" data-act="compTab" data-v="${k}">${l}</button>`).join('')}</div>
    ${body}
  </div></section>`;
};

function findMatch(c, id) {
  for (const st of c.stages) {
    if (!st) continue;
    if (st.type === 'knockout') {
      for (const rd of st.rounds) for (const t of rd.ties) {
        const i = t.m.findIndex(m => m.id === id);
        if (i >= 0) return { m: t.m[i], tie: t, leg: i, round: rd.name };
      }
    } else {
      const m = Engine.stageMatches(st).find(x => x.id === id);
      if (m) return { m };
    }
  }
  return null;
}

function openMatchModal(c, id, animateIt) {
  const f = findMatch(c, id);
  if (!f || !f.m.played) return;
  const { m, tie, leg } = f;
  const ctx = { title: f.round ? `${f.round}${tie.bo3 ? ` · jogo ${leg + 1}` : tie.m.length > 1 ? (leg ? ' · volta' : ' · ida') : ''}` : (m.neutral ? 'Campo neutro' : `Casa: ${nameOf(m.h)}`) };
  if (tie && !tie.bo3 && leg === 1) { const [x, y] = Engine.tieAggregate(tie); ctx.agg = [y, x]; ctx.winner = tie.w; }
  stopAnim();
  UI.skipAll = false;
  const live = animateIt && !m.manual;
  Modal.open(() => `<div class="modal-head"><h3>Detalhes do jogo</h3><button class="close" data-act="close" aria-label="Fechar">${I.x}</button></div>
    ${live ? playbarHTML() : ''}
    <div class="result" style="margin-top:0"><div id="mBoard">${live ? '' : boardHTML(m, 120, true, ctx)}</div><div id="mStats">${live ? '' : statsHTML([m])}</div></div>`, 'wide');
  if (live) {
    UI.anim = animate(m, (min, fin) => { const b = $('#mBoard'); if (b) b.innerHTML = boardHTML(m, min, fin, ctx); }, () => { const s = $('#mStats'); if (s) s.innerHTML = statsHTML([m]); });
    syncPlaybar();
  }
}

/* ---------- Clubes ---------- */
Pages.clubes = () => {
  const S = UI.clubs, set = Store.d.settings;
  const q = S.search.trim().toLowerCase();
  const leagues = ['ALL', ...Object.keys(LEAGUES).filter(k => Teams.list.some(t => t.league === k))];
  const list = Teams.list.filter(t => (S.filter === 'ALL' || t.league === S.filter) && (!q || t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q)))
    .sort((a, b) => ovr(b) - ovr(a) || b.atk - a.atk);
  return `<section class="page"><div class="wrap">
    <div class="page-head"><div><h1>Clubes e ranking</h1><p>Ataque (ATA) e defesa (DEF) de 40 a 99. O OVR é a média dos dois. Um time com ATA alto marca mais; com DEF alto sofre menos.</p></div>
      <button class="btn btn-lime" data-act="newTeam">${I.plus} Adicionar clube</button></div>
    <div class="panel">
      <div class="settings-grid">
        <div class="slider-row"><label>Fator zebra <span id="chaosLbl">${chaosLabel(set.chaos)}</span></label>
          <input type="range" min="0" max="100" step="5" value="${set.chaos}" data-inp="setting" data-k="chaos" aria-label="Fator zebra">
          <p>Quanto maior, mais o resultado de um jogo foge do ranking (dias ruins, viradas, zebras).</p></div>
        <div class="slider-row"><label>Força do mando de campo <span id="homeLbl">${homeLabel(set.homeAdv)}</span></label>
          <input type="range" min="0" max="2" step="0.1" value="${set.homeAdv}" data-inp="setting" data-k="homeAdv" aria-label="Força do mando de campo">
          <p>Vantagem de quem joga em casa. Não vale em campo neutro.</p></div>
        <div class="slider-row"><label>Média de gols <span id="goalsLbl">${goalsLabel(set.goals)}</span></label>
          <input type="range" min="0.7" max="1.4" step="0.05" value="${set.goals}" data-inp="setting" data-k="goals" aria-label="Média de gols">
          <p>Nível geral de gols. O padrão dá cerca de 2,2 por jogo entre times parecidos.</p></div>
        <div class="slider-row"><label>Efeito da altitude <span id="altLbl">${altLabel(set.altitude)}</span></label>
          <input type="range" min="0" max="2" step="0.1" value="${set.altitude}" data-inp="setting" data-k="altitude" aria-label="Efeito da altitude">
          <p>Vantagem extra de quem joga em casa muito acima do visitante (La Paz, Quito, Cusco, Bogotá, Toluca…). A altitude de cada clube fica em Editar.</p></div>
      </div>
    </div>
    <div class="toolbar" style="margin-top:26px">
      ${leagueSelect('clubs', S.filter)}
      <input class="search" type="text" data-inp="clubSearch" placeholder="Buscar clube" value="${esc(S.search)}" style="margin-left:auto">
    </div>
    <div class="table-wrap"><table class="tbl" id="clubTable">
      <thead><tr><th>#</th><th class="l">Clube</th><th class="l">Liga</th><th>ATA</th><th>DEF</th><th>OVR</th><th></th></tr></thead>
      <tbody>${list.map((t, i) => `<tr data-row="${t.id}">
        <td class="pos">${i + 1}</td>
        <td class="l"><span class="team">${crest(t, 28)}${esc(t.name)}${t.edited ? '<i class="edited" title="Editado por você"></i>' : ''}</span></td>
        <td class="l"><span class="lg-tag">${esc(LEAGUES[t.league] || t.league)}</span></td>
        <td><input class="num" type="number" min="40" max="99" value="${t.atk}" data-inp="rating" data-id="${t.id}" data-k="atk" aria-label="Ataque ${esc(t.name)}"></td>
        <td><input class="num" type="number" min="40" max="99" value="${t.def}" data-inp="rating" data-id="${t.id}" data-k="def" aria-label="Defesa ${esc(t.name)}"></td>
        <td><span class="ovr-badge" data-ovr="${t.id}">${ovr(t)}</span></td>
        <td><button class="btn btn-ghost btn-sm" data-act="editTeam" data-id="${t.id}">${I.edit} Editar</button></td>
      </tr>`).join('')}</tbody></table></div>
    <div class="modal-foot"><span class="hint">${list.length} clubes · alterações salvas automaticamente</span>
      <button class="btn btn-ghost btn-sm btn-danger" data-act="resetTeams">Restaurar todos os clubes ao padrão</button></div>
  </div></section>`;
};
const altLabel = v => (+v === 0 ? 'desligado' : `${(+v).toFixed(1)}×`);
const goalsLabel = v => `≈ ${(2.24 * v).toFixed(1).replace('.', ',')} por jogo`;
const chaosLabel = v => v <= 15 ? `${v} · realista` : v <= 40 ? `${v} · equilibrado` : v <= 70 ? `${v} · imprevisível` : `${v} · caos total`;
const homeLabel = v => (+v === 0 ? 'sem mando' : +v < 0.8 ? `${(+v).toFixed(1)}× · fraca` : +v <= 1.2 ? `${(+v).toFixed(1)}× · normal` : `${(+v).toFixed(1)}× · caldeirão`);

let teamDraft = null;
function openTeamEditor(id) {
  const t = id ? Teams.get(id) : null;
  teamDraft = t ? { ...t, colors: [...t.colors] } : { id: null, name: '', short: '', league: 'CUSTOM', colors: ['#0F3D24', '#B8F23A'], atk: 70, def: 70, logo: null, alt: 0 };
  Modal.open(teamEditorHTML);
}
function teamEditorHTML() {
  const t = teamDraft;
  const isBase = t.id && Teams.base(t.id);
  return `<div class="modal-head"><h3>${t.id ? 'Editar clube' : 'Novo clube'}</h3><button class="close" data-act="close" aria-label="Fechar">${I.x}</button></div>
    <div style="display:flex;gap:20px;align-items:center;margin-bottom:20px">
      <span id="draftCrest">${crest(t, 84)}</span>
      <div style="display:flex;flex-direction:column;gap:8px">
        <label class="btn btn-line btn-sm" style="cursor:pointer">Enviar escudo (PNG/SVG)<input type="file" accept="image/*" data-inp="logoFile" hidden></label>
        ${t.logo ? `<button class="btn btn-ghost btn-sm" data-act="removeLogo">Usar escudo genérico</button>` : '<span class="hint">Sem imagem: usa um escudo com a sigla e as cores.</span>'}
      </div>
    </div>
    <div class="form-grid">
      <div class="field"><label>Nome</label><input type="text" data-inp="draft" data-k="name" value="${esc(t.name)}" maxlength="40"></div>
      <div class="field"><label>Sigla (até 3 letras)</label><input type="text" data-inp="draft" data-k="short" value="${esc(t.short)}" maxlength="3"></div>
      <div class="field"><label>Liga</label><select data-inp="draft" data-k="league">${Object.entries(LEAGUES).map(([k, v]) => `<option value="${k}" ${t.league === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div class="field"><label>Cores</label><div class="color-row"><input type="color" data-inp="draftColor" data-i="0" value="${t.colors[0]}" aria-label="Cor principal"><input type="color" data-inp="draftColor" data-i="1" value="${t.colors[1]}" aria-label="Cor secundária"></div></div>
      <div class="field"><label>Ataque (ATA): <b id="dAtk">${t.atk}</b></label><input type="range" min="40" max="99" value="${t.atk}" data-inp="draftRange" data-k="atk"></div>
      <div class="field"><label>Defesa (DEF): <b id="dDef">${t.def}</b></label><input type="range" min="40" max="99" value="${t.def}" data-inp="draftRange" data-k="def"></div>
      <div class="field"><label>Altitude do estádio (m)</label><input type="text" inputmode="numeric" data-inp="draft" data-k="alt" value="${t.alt || 0}" maxlength="4"></div>
    </div>
    <p class="error" id="draftErr"></p>
    <div class="modal-foot">
      <span style="display:flex;gap:6px">
        ${t.id ? `<button class="btn btn-ghost btn-sm btn-danger" data-act="deleteTeam">${t.custom ? 'Excluir clube' : 'Ocultar clube'}</button>` : ''}
        ${isBase && t.edited ? `<button class="btn btn-ghost btn-sm" data-act="restoreTeam">Restaurar padrão</button>` : ''}
      </span>
      <span style="display:flex;gap:8px"><button class="btn btn-ghost" data-act="close">Cancelar</button><button class="btn btn-dark" data-act="saveTeam">Salvar clube</button></span>
    </div>`;
}

/* ---------- Seletor de clube (partida) ---------- */
function openPicker(onPick, current, exclude) {
  UI.picker = { onPick, current, filter: 'ALL', search: '', exclude: exclude || null };
  Modal.open(pickerHTML, 'wide');
}
function pickerHTML() {
  const P = UI.picker;
  const leagues = ['ALL', ...Object.keys(LEAGUES).filter(k => Teams.list.some(t => t.league === k))];
  const q = P.search.trim().toLowerCase();
  const list = Teams.list.filter(t => (!P.exclude || t.id === P.current || !P.exclude.has(t.id)) && (P.filter === 'ALL' || t.league === P.filter) && (!q || t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q)))
    .sort((a, b) => ovr(b) - ovr(a));
  return `<div class="modal-head"><h3>Escolha o clube</h3><button class="close" data-act="close" aria-label="Fechar">${I.x}</button></div>
    <div class="toolbar">${leagueSelect('picker', P.filter)}<input class="search" type="text" data-inp="pickerSearch" placeholder="Buscar clube" value="${esc(P.search)}" style="flex:1"></div>
    <div class="picker-grid" id="pickerGrid">${pickerGrid(list, P.current)}</div>`;
}
const pickerGrid = (list, cur) => list.map(t => `<button class="pick-team ${t.id === cur ? 'on' : ''}" data-act="pickTeam" data-id="${t.id}">${crest(t, 28)}<span>${esc(t.name)}</span><span class="o">${ovr(t)}</span></button>`).join('') || '<p class="hint">Nenhum clube encontrado.</p>';

/* ================= Desfazer =================
   Antes de cada ação que muda resultados guardamos uma cópia da competição (só nesta sessão do navegador). */
const UNDO_MAX = 25;
const undoStack = c => (UI.undo[c.id] = UI.undo[c.id] || []);
function pushUndo(c, label) {
  const st = undoStack(c);
  const { prob, ...rest } = c;            // as probabilidades não entram na cópia (pesam e são recalculáveis)
  st.push({ label, snap: JSON.stringify(rest), prob });
  if (st.length > UNDO_MAX) st.shift();
}
function undoComp(c) {
  const st = undoStack(c);
  const last = st.pop();
  if (!last) return toast('Nada para desfazer.');
  const restored = JSON.parse(last.snap);
  if (last.prob) restored.prob = last.prob;
  const i = Store.d.comps.findIndex(x => x.id === c.id);
  Store.d.comps[i] = restored;
  UI.comp[c.id].date = null;
  if (UI.comp[c.id].tab[0] === 'p' && UI.comp[c.id].tab !== 'prob' && !restored.stages[+UI.comp[c.id].tab.slice(1)] && !(restored.spec[+UI.comp[c.id].tab.slice(1)] || {}).confirm) UI.comp[c.id].tab = defaultTab(restored);
  Store.save(); render();
  toast(`Desfeito: ${esc(last.label)}.`);
}
const stepLabel = c => { try { return c.reg ? Reg.currentLabel(c) : 'rodada'; } catch (e) { return 'rodada'; } };

/* ================= Ações ================= */
const saveComp = () => { Store.save(); render(); };
const currentComp = () => {
  const id = location.hash.split('/')[2];
  return Store.d.comps.find(c => c.id === id);
};

const Actions = {
  close: () => { stopAnim(); Modal.close(); },
  setSpeed: el => {
    Store.d.settings.speed = el.dataset.v; Store.save();
    if (el.dataset.v === 'instant' && UI.anim && !UI.anim.done) { UI.skipAll = true; UI.anim.skip(); }
    syncPlaybar();
  },
  animPause: () => { if (UI.anim) { UI.anim.paused = !UI.anim.paused; syncPlaybar(); } },
  animSkip: () => { if (UI.anim) { UI.skipAll = true; UI.anim.skip(); } },
  simDate: () => {
    const c = currentComp();
    const d = compDates(c)[UI.comp[c.id].date];
    pushUndo(c, d.label);
    let n = 0;
    d.items.forEach(x => { if (!x.m.played && Engine.playOne(c, x.m.id)) n++; });
    if (!n) { undoStack(c).pop(); return toast('Estes jogos ainda não podem ser simulados: termine a fase atual antes.'); }
    Store.save(); render(); toast(`${n} jogo${n > 1 ? 's' : ''} simulado${n > 1 ? 's' : ''}.`);
  },
  heroReroll: () => heroDemo(),

  // partida
  pickSide: el => openPicker(id => {
    UI.match[el.dataset.k] = id; Modal.close(); render();
  }, UI.match[el.dataset.k]),
  pickTeam: el => UI.picker && UI.picker.onPick(el.dataset.id),
  pickerFilter: el => { UI.picker.filter = el.dataset.v; Modal.refresh(); },
  matchOpt: el => {
    const k = el.dataset.k; let v = el.dataset.v;
    if (k === 'legs') v = +v; if (k === 'neutral') v = v === 'true';
    UI.match[k] = v; render();
  },
  swapSides: () => { const S = UI.match; [S.h, S.a] = [S.a, S.h]; render(); },
  simMatch: () => runMatch(),
  simMany: () => runMany(),

  // competições
  newComp: (el, e) => { e.preventDefault(); startWizard(); },
  newFromTemplate: (el, e) => { e.preventDefault(); startTplWizard(el.dataset.id); },
  tplSlot: el => { const W = UI.wizard; W.picking = { role: el.dataset.role, i: +el.dataset.i }; const cur = Teams.get(W.entries[W.picking.role][W.picking.i]); const used = new Set(Object.values(W.entries).flat());
    W.filter = cur && Teams.list.some(t => t.league === cur.league && !used.has(t.id)) ? cur.league : 'ALL'; W.search = ''; Modal.refresh(); },
  tplPick: el => { const W = UI.wizard; W.entries[W.picking.role][W.picking.i] = el.dataset.id; W.picking = null; Modal.refresh(); },
  tplCancelPick: () => { UI.wizard.picking = null; Modal.refresh(); },
  tplReset: () => { const W = UI.wizard; W.entries = JSON.parse(JSON.stringify(TEMPLATES.find(t => t.id === W.template).entries)); Modal.refresh(); },
  tplCreate: () => {
    const W = UI.wizard, tpl = TEMPLATES.find(t => t.id === W.template);
    try {
      const c = Reg.create(tpl, W.entries, W.name.trim() || tpl.name);
      Store.d.comps.push(c); Store.save();
      Modal.close();
      location.hash = `#/c/${c.id}`;
      toast(`Sorteio feito: <b>${esc(c.name)}</b> criada.`);
    } catch (err) { console.error(err); toast('Não foi possível criar: ' + esc(err.message)); }
  },
  newFormat: (el, e) => { e.preventDefault(); startWizard({ format: el.dataset.id }); },
  wizFormat: el => { const W = UI.wizard; W.format = el.dataset.v; W.cfg = { ...DEFAULT_CFG[W.format] }; Modal.refresh(); },
  wizCfg: el => { const k = el.dataset.k, v = el.dataset.v; UI.wizard.cfg[k] = isNaN(+v) ? v : +v; Modal.refresh(); },
  wizNext: () => {
    const W = UI.wizard;
    if (W.step === 2 && !W.name.trim()) W.name = `${FORMATS[W.format].name} ${new Date().getFullYear()}`;
    W.step = Math.min(3, W.step + 1);
    if (W.step === 3 && !W.teams.length) W.filter = 'BRA-A';
    Modal.refresh();
  },
  wizBack: () => {
    const W = UI.wizard;
    if (W.step === 2 && W.template) return Modal.close();
    W.step = Math.max(1, W.step - 1); Modal.refresh();
  },
  wizFilter: el => { UI.wizard.filter = el.dataset.v; Modal.refresh(); },
  wizToggle: el => {
    const W = UI.wizard, id = el.dataset.id, i = W.teams.indexOf(id);
    if (i >= 0) W.teams.splice(i, 1); else W.teams.push(id);
    Modal.refresh();
  },
  wizAll: () => {
    const W = UI.wizard;
    document.querySelectorAll('#wizGrid [data-id]').forEach(b => { if (!W.teams.includes(b.dataset.id)) W.teams.push(b.dataset.id); });
    Modal.refresh();
  },
  wizNone: () => { UI.wizard.teams = []; Modal.refresh(); },
  wizCreate: () => {
    const W = UI.wizard;
    try {
      const tplChanged = W.template && (() => { const t = TEMPLATES.find(x => x.id === W.template); return t.teams.length !== W.teams.length; })();
      const c = Engine.create({
        name: W.name.trim() || FORMATS[W.format].name, format: W.format, teams: W.teams, cfg: W.cfg,
        zones: W.template && !tplChanged ? W.zones : defaultZones(W.format, W.teams.length),
        template: W.template, crest: W.crest
      });
      Store.d.comps.push(c); Store.save();
      Modal.close();
      location.hash = `#/c/${c.id}`;
      toast(`Sorteio feito: <b>${esc(c.name)}</b> criada.`);
    } catch (err) { toast(esc(err.message)); }
  },
  compTab: el => { UI.comp[currentComp().id].tab = el.dataset.v; render(); },
  compStep: () => {
    const c0 = currentComp(); pushUndo(c0, stepLabel(c0));
    const c = c0; const label = Engine.step(c);
    if (!label) undoStack(c).pop(); else undoStack(c)[undoStack(c).length - 1].label = label.replace(/<[^>]+>/g, '');
    UI.comp[c.id].date = null;
    if (c.reg) UI.comp[c.id].tab = ['games', 'rules', 'prob'].includes(UI.comp[c.id].tab) ? UI.comp[c.id].tab : defaultTab(c);
    const aw = c.reg ? Reg.awaiting(c) : -1;
    if (aw >= 0 && !label) { UI.comp[c.id].tab = 'p' + aw; toast(`Antes de seguir, confirme os clubes da fase <b>${esc(c.spec[aw].name)}</b>.`); }
    else if (Engine.finished(c) && c.champion) toast(`Fim! <b>${esc(nameOf(c.champion))}</b> é campeão.`);
    else if (label) toast(`${esc(label)} simulada.`);
    saveComp();
  },
  compAll: () => {
    const c = currentComp(); pushUndo(c, 'simular até o fim'); Engine.simulateAll(c); UI.comp[c.id].date = null;
    if (c.reg && UI.comp[c.id].tab[0] === 'p' && UI.comp[c.id].tab !== 'prob') UI.comp[c.id].tab = 'p' + c.champSpec.phase;
    const aw = c.reg ? Reg.awaiting(c) : -1;
    if (aw >= 0) { UI.comp[c.id].tab = 'p' + aw; toast(`Simulado até a fase <b>${esc(c.spec[aw].name)}</b>: confirme os clubes que entram nela para continuar.`); }
    else if (c.champion) toast(`<b>${esc(nameOf(c.champion))}</b> é campeão.`);
    saveComp();
  },
  probRun: el => { const c = currentComp(); runProb(c, +el.dataset.n); render(); },
  guestSlot: el => {
    const c = currentComp(), i = +el.dataset.phase, role = c.spec[i].confirm.role, k = +el.dataset.i;
    const inComp = new Set(Object.values(c.entries).flat());
    openPicker(id => { c.entries[role][k] = id; Store.save(); Modal.close(); render(); }, c.entries[role][k], inComp);
  },
  guestConfirm: el => {
    const c = currentComp(), i = +el.dataset.phase;
    pushUndo(c, `confirmar ${c.spec[i].name}`); Reg.confirm(c, i); UI.comp[c.id].date = null; Store.save(); render();
    toast(`<b>${esc(c.spec[i].name)}</b> montados.`);
  },
  compClear: () => {
    const c = currentComp();
    if (!confirm('Apagar todos os resultados desta competição? O sorteio é mantido.')) return;
    pushUndo(c, 'limpar resultados'); Engine.clearResults(c); UI.comp[c.id].date = null; saveComp();
  },
  compRedraw: () => {
    const c = currentComp();
    if (!confirm('Fazer um novo sorteio? Todos os resultados serão apagados.')) return;
    pushUndo(c, 'novo sorteio'); Engine.redraw(c); UI.comp[c.id].date = null; saveComp(); toast('Novo sorteio feito.');
  },
  compDelete: () => {
    const c = currentComp();
    if (!confirm(`Excluir "${c.name}"? Não dá para desfazer.`)) return;
    Store.d.comps = Store.d.comps.filter(x => x.id !== c.id); Store.save();
    location.hash = '#/competicoes';
  },
  dateNav: el => { const c = currentComp(); UI.comp[c.id].date += +el.dataset.v; render(); },
  playOne: el => {
    const c = currentComp();
    pushUndo(c, `${nameOf((Engine.locate(c, el.dataset.id) || { m: {} }).m.h)} × ${nameOf((Engine.locate(c, el.dataset.id) || { m: {} }).m.a)}`);
    if (Engine.playOne(c, el.dataset.id)) { Store.save(); render(); openMatchModal(c, el.dataset.id, true); }
    else { undoStack(c).pop(); toast('Este jogo ainda não pode ser simulado: termine a fase atual antes.'); }
  },
  openMatch: el => openMatchModal(currentComp(), el.dataset.id, false),
  compUndo: () => undoComp(currentComp()),
  evoPick: el => { const S = UI.comp[currentComp().id]; const set = new Set(S.evoSel || []); const id = el.dataset.id; if (set.has(id)) set.delete(id); else set.add(id); S.evoSel = [...set]; render(); },
  evoClear: () => { UI.comp[currentComp().id].evoSel = []; render(); },

  // clubes
  clubFilter: el => { UI.clubs.filter = el.dataset.v; render(); },
  newTeam: () => openTeamEditor(null),
  editTeam: el => openTeamEditor(el.dataset.id),
  removeLogo: () => { teamDraft.logo = null; Modal.refresh(); },
  saveTeam: () => {
    const t = teamDraft;
    t.name = t.name.trim(); t.short = (t.short || '').trim().toUpperCase();
    if (!t.name) { $('#draftErr').textContent = 'Dê um nome ao clube.'; return; }
    if (!t.short) t.short = t.name.slice(0, 3).toUpperCase();
    const fields = { name: t.name, short: t.short, league: t.league, colors: t.colors, atk: +t.atk, def: +t.def, logo: t.logo, alt: Math.max(0, Math.min(5000, parseInt(t.alt, 10) || 0)) };
    if (!t.id) {
      const id = 'c-' + Engine.uid();
      Store.d.custom.push({ id, ...fields });
    } else if (t.custom) {
      const i = Store.d.custom.findIndex(x => x.id === t.id);
      Store.d.custom[i] = { id: t.id, ...fields };
    } else {
      const b = Teams.base(t.id), diff = {};
      Object.entries(fields).forEach(([k, v]) => { if (JSON.stringify(v) !== JSON.stringify(b[k])) diff[k] = v; });
      if (Object.keys(diff).length) Store.d.overrides[t.id] = diff; else delete Store.d.overrides[t.id];
    }
    Store.save(); Teams.refresh(); Modal.close(); render(); toast(`<b>${esc(t.name)}</b> salvo.`);
  },
  deleteTeam: () => {
    const t = teamDraft;
    if (!confirm(t.custom ? `Excluir ${t.name}?` : `Ocultar ${t.name} da lista? Dá para trazer de volta em "Restaurar todos os clubes".`)) return;
    if (t.custom) Store.d.custom = Store.d.custom.filter(x => x.id !== t.id);
    else Store.d.removed.push(t.id);
    Store.save(); Teams.refresh(); Modal.close(); render();
  },
  restoreTeam: () => {
    delete Store.d.overrides[teamDraft.id];
    Store.save(); Teams.refresh(); Modal.close(); render(); toast('Clube restaurado ao padrão.');
  },
  resetTeams: () => {
    if (!confirm('Restaurar todos os clubes oficiais aos ratings e dados originais? Clubes que você criou continuam.')) return;
    Store.d.overrides = {}; Store.d.removed = [];
    Store.save(); Teams.refresh(); render(); toast('Clubes restaurados.');
  }
};

function rerenderKeepFocus(forceKey) {
  setTimeout(() => {
    const a = document.activeElement;
    const key = forceKey || (a && a.dataset && a.dataset.id && a.dataset.side ? [a.dataset.id, a.dataset.side] : null);
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    if (key) {
      const n = document.querySelector(`[data-id="${key[0]}"][data-side="${key[1]}"]`);
      if (n && !n.disabled) { n.focus({ preventScroll: true }); n.select(); }
    }
  }, 0);
}

const Inputs = {
  guestImport: (el, type) => {
    if (type !== 'change' || !el.value) return;
    const c = currentComp(), i = +el.dataset.phase, role = c.spec[i].confirm.role;
    const L = Store.d.comps.find(x => x.id === el.value);
    const ids = Reg.resolve(L, { phase: 0, perGroup: [3, 3] }).filter(id => !Object.entries(c.entries).some(([r, l]) => r !== role && l.includes(id)));
    if (ids.length < c.spec[i].confirm.count) { toast('Essa Libertadores não tem clubes suficientes disponíveis.'); el.value = ''; return; }
    c.entries[role] = ids.slice(0, c.spec[i].confirm.count);
    Store.save(); render(); toast(`3ºs colocados de <b>${esc(L.name)}</b> importados.`);
  },
  evoSrc: (el, type) => { if (type !== 'change') return; UI.comp[currentComp().id].evoSrc = el.value; render(); },
  leagueSel: el => {
    const v = el.value, sc = el.dataset.scope;
    if (sc === 'clubs') { UI.clubs.filter = v; render(); }
    else if (sc === 'picker') { UI.picker.filter = v; Modal.refresh(); }
    else { UI.wizard.filter = v; Modal.refresh(); }
  },
  score: (el, type) => {
    if (type !== 'change') return;
    const c = currentComp(); if (!c) return;
    const id = el.dataset.id;
    const row = el.closest('.game');
    const get = side => { const n = row.querySelector(`[data-side="${side}"]`); return n ? n.value.trim() : ''; };
    const ok = v => /^\d{1,2}$/.test(v);
    const h = get('h'), a = get('a'), ph = get('ph'), pa = get('pa');
    const L = Engine.locate(c, id); if (!L) return;
    const m = L.m;
    if (h === '' && a === '') {
      if (!m.played) return;
      const lost = Engine.wouldDiscard(c, id);
      if (lost && !confirm(`Apagar este resultado também apaga ${lost} jogo(s) das fases seguintes. Continuar?`)) return rerenderKeepFocus();
      pushUndo(c, `apagar ${nameOf(m.h)} × ${nameOf(m.a)}`); Engine.clearResult(c, id); Store.save(); return rerenderKeepFocus();
    }
    if (!ok(h) || !ok(a)) { if (h !== '' && a !== '') toast('Use só números no placar.'); return; }
    const pen = ok(ph) && ok(pa) ? [+ph, +pa] : null;
    if (pen && pen[0] === pen[1]) { toast('Os pênaltis não podem terminar empatados.'); return; }
    const same = m.played && m.hg === +h && m.ag === +a && (!pen || (m.pen && m.pen.h === pen[0] && m.pen.a === pen[1]));
    if (same) return;
    const lost = Engine.wouldDiscard(c, id);
    if (lost && !confirm(`Mudar este resultado apaga ${lost} jogo(s) das fases seguintes, que serão remontadas. Continuar?`)) return rerenderKeepFocus();
    pushUndo(c, `${nameOf(m.h)} ${h} × ${a} ${nameOf(m.a)}`);
    Engine.setResult(c, id, +h, +a, pen);
    Store.save();
    const L2 = Engine.locate(c, id);
    if (c.champion) toast(`<b>${esc(nameOf(c.champion))}</b> é campeão.`);
    rerenderKeepFocus(L2 && Engine.needsPens(L2, +h, +a) && !L2.m.pen ? [id, 'ph'] : null);
  },
  pickerSearch: el => {
    UI.picker.search = el.value;
    const P = UI.picker, q = el.value.trim().toLowerCase();
    const list = Teams.list.filter(t => (!P.exclude || t.id === P.current || !P.exclude.has(t.id)) && (P.filter === 'ALL' || t.league === P.filter) && (!q || t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q))).sort((a, b) => ovr(b) - ovr(a));
    $('#pickerGrid').innerHTML = pickerGrid(list, P.current);
  },
  wizName: el => { UI.wizard.name = el.value; },
  wizSearch: el => {
    UI.wizard.search = el.value;
    const pos = el.selectionStart;
    Modal.refresh();
    const n = $('[data-inp=wizSearch]'); n.focus(); n.setSelectionRange(pos, pos);
  },
  dateSel: el => { UI.comp[currentComp().id].date = +el.value; render(); },
  clubSearch: el => {
    UI.clubs.search = el.value;
    const pos = el.selectionStart;
    render();
    const n = $('[data-inp=clubSearch]'); n.focus(); n.setSelectionRange(pos, pos);
  },
  setting: el => {
    const k = el.dataset.k;
    Store.d.settings[k] = +el.value;
    if (k === 'chaos') $('#chaosLbl').textContent = chaosLabel(+el.value);
    else if (k === 'goals') $('#goalsLbl').textContent = goalsLabel(+el.value);
    else if (k === 'altitude') $('#altLbl').textContent = altLabel(+el.value);
    else $('#homeLbl').textContent = homeLabel(+el.value);
    Store.save();
  },
  rating: (el, type) => {
    if (type !== 'change') return;
    const id = el.dataset.id, k = el.dataset.k;
    const v = Math.max(40, Math.min(99, Math.round(+el.value || 0)));
    el.value = v;
    const base = Teams.base(id);
    if (base) {
      const o = Store.d.overrides[id] || {};
      if (v === base[k]) delete o[k]; else o[k] = v;
      if (Object.keys(o).length) Store.d.overrides[id] = o; else delete Store.d.overrides[id];
    } else {
      const c = Store.d.custom.find(x => x.id === id); if (c) c[k] = v;
    }
    Store.save(); Teams.refresh();
    const badge = document.querySelector(`[data-ovr="${id}"]`);
    if (badge) badge.textContent = ovr(Teams.get(id));
  },
  draft: el => { teamDraft[el.dataset.k] = el.value; $('#draftCrest').innerHTML = crest(teamDraft, 84); },
  draftColor: el => { teamDraft.colors[+el.dataset.i] = el.value; $('#draftCrest').innerHTML = crest(teamDraft, 84); },
  draftRange: el => { teamDraft[el.dataset.k] = +el.value; $(el.dataset.k === 'atk' ? '#dAtk' : '#dDef').textContent = el.value; },
  logoFile: (el, type) => {
    if (type !== 'change' || !el.files[0]) return;
    const file = el.files[0], reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const S = 128, cv = document.createElement('canvas');
        const r = Math.min(S / img.width, S / img.height);
        cv.width = Math.round(img.width * r); cv.height = Math.round(img.height * r);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        teamDraft.logo = cv.toDataURL('image/png');
        Modal.refresh();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = Actions[el.dataset.act];
  if (fn) fn(el, e);
});
['input', 'change'].forEach(type => document.addEventListener(type, e => {
  const el = e.target.closest('[data-inp]');
  if (!el) return;
  const fn = Inputs[el.dataset.inp];
  if (!fn) return;
  // campos de texto reagem no "input"; números, selects e arquivos no "change"
  const isText = el.type === 'text' || el.type === 'range' || el.type === 'color';
  if (['rating', 'logoFile', 'score', 'guestImport'].includes(el.dataset.inp) || el.tagName === 'SELECT') { if (type === 'change') fn(el, type); return; }
  if (isText && type === 'input') fn(el, type);
}));

/* ================= Rotas ================= */
function render() {
  if (UI.hero) { UI.hero.stop(); UI.hero = null; }
  stopAnim();
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const page = parts[0] || '';
  const app = $('#app');
  if (page === '') app.innerHTML = Pages.home();
  else if (page === 'partida') app.innerHTML = Pages.partida();
  else if (page === 'competicoes') app.innerHTML = Pages.competicoes();
  else if (page === 'c') app.innerHTML = Pages.comp(parts[1]);
  else if (page === 'clubes') app.innerHTML = Pages.clubes();
  else app.innerHTML = Pages.home();
  document.querySelectorAll('#navlinks a').forEach(a => a.classList.toggle('active', a.dataset.r === (page === 'c' ? 'competicoes' : page)));
  if (page === '') heroDemo();
  // gráfico de evolução: em telas estreitas, rola até a rodada atual
  const ew = document.querySelector('.evo-wrap');
  if (ew && ew.scrollWidth > ew.clientWidth) ew.scrollLeft = Math.max(0, +ew.dataset.x - ew.clientWidth * 0.75);
}

window.addEventListener('hashchange', () => { Modal.close(); render(); window.scrollTo(0, 0); });
window.addEventListener('scroll', () => $('#nav').classList.toggle('scrolled', window.scrollY > 8), { passive: true });

Store.load();
Teams.refresh();
Engine.configure({ getTeam: id => Teams.get(id), settings: Store.d.settings });
render();
