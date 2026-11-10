/* Placar — telas do modo Copa do Mundo (lista de ciclos, assistente de criação e painel do ciclo).
   Só declara funções; app.js chama wcInit() antes de desenhar a primeira tela. */

const WC_STAGE = { qual: 'Eliminatórias', playoff: 'Repescagem mundial', draw: 'Sorteio dos grupos', cup: 'Copa do Mundo', done: 'Encerrado' };
const WC_UNDO_MAX = 8;
const wcCycle = id => (Store.d.cycles || []).find(c => c.id === id);
const wcCurrent = () => wcCycle(location.hash.split('/')[2]);
const wcConf = k => WC.CONFS.find(c => c.k === k);
const wcHostsLine = cy => cy.hosts.map(id => `<span class="wc-host">${crest(id, 20)}${esc(nameOf(id))}</span>`).join('');

/* ---------- desfazer do ciclo (todas as etapas juntas) ---------- */
function wcPushUndo(cy, label) {
  const st = (UI.wcUndo[cy.id] = UI.wcUndo[cy.id] || []);
  st.push({ label, snap: JSON.stringify({ cy, comps: WC.compsOf(Store.d, cy) }) });
  if (st.length > WC_UNDO_MAX) st.shift();
}
function wcUndo(cy) {
  const last = (UI.wcUndo[cy.id] || []).pop();
  if (!last) return toast('Nada para desfazer.');
  const snap = JSON.parse(last.snap);
  Store.d.comps = Store.d.comps.filter(c => c.cycle !== cy.id).concat(snap.comps);
  Store.d.cycles[Store.d.cycles.findIndex(c => c.id === cy.id)] = snap.cy;
  snap.comps.forEach(c => { delete UI.undo[c.id]; });
  Store.save(); render();
  toast(`Desfeito: ${esc(last.label)}.`);
}

/* ---------- chamada na página de competições ---------- */
function wcPromoHTML() {
  const n = (Store.d.cycles || []).length;
  return `<a class="wc-promo" href="#/copa">
    <img src="${WC.CUP_LOGO}" alt="Copa do Mundo">
    <div><h3>Modo Copa do Mundo</h3><p>Escolha as sedes, jogue as eliminatórias das seis confederações, a repescagem mundial e a Copa de 48 seleções, com ranking próprio e ciclos seguidos.</p></div>
    <span class="btn btn-lime btn-sm">${n ? `Abrir (${n} ciclo${n > 1 ? 's' : ''})` : 'Começar'}</span>
  </a>`;
}

/* ---------- lista de ciclos ---------- */
function wcCycleCard(cy) {
  const S = WC.status(Store.d, cy), p = WC.podium(Store.d, cy);
  const pct = S.stage === 'done' ? 1 : S.stage === 'cup' ? 0.75 + 0.25 * Engine.progress(S.finals) : Math.min(0.75, (S.qualified.length / 48) * 0.75);
  return `<a class="comp-card" href="#/copa/${cy.id}">
    <div class="t"><span class="wc-badge ${WC.TROPHY ? 'img' : ''}">${WC.TROPHY ? `<img src="${WC.TROPHY}" alt="">` : I.trophy}</span><div><h4>${esc(cy.name)}</h4><div class="f">Sede${cy.hosts.length > 1 ? 's' : ''}: ${esc(cy.hosts.map(nameOf).join(', '))}</div></div></div>
    <div class="progress"><span style="width:${pct * 100}%"></span></div>
    <div class="foot">${p ? `<span class="champ-tag">${crest(p.champion, 20)} Campeã: ${esc(nameOf(p.champion))}</span>` : `<span>${WC_STAGE[S.stage]} · ${S.qualified.length} de 48 classificadas</span>`}<span>${new Date(cy.created).toLocaleDateString('pt-BR')}</span></div>
  </a>`;
}
function wcHallHTML(series) {
  const H = WC.hall(Store.d, series);
  const done = H.eds.filter(e => e.p).reverse();
  const sim = done.some(e => !e.real);
  return `<p class="hint" style="margin-bottom:12px">Seleções que já terminaram uma Copa entre as três primeiras, desde 1930. ${sim ? 'As Copas simuladas deste ciclo entram na conta depois do histórico real.' : 'Quando a Copa deste ciclo terminar, ela entra na conta.'}</p>
    <div class="table-wrap"><table class="tbl wc-hall">
      <thead><tr><th>#</th><th class="l">Seleção</th><th>Títulos</th><th class="l">Anos</th><th>Vices</th><th>3º lugar</th></tr></thead>
      <tbody>${H.rows.map((r, i) => `<tr><td class="pos">${i + 1}</td><td class="l"><span class="team">${crest(r.id, 24)}<span>${esc(nameOf(r.id))}${r.titles.length ? `<small class="wc-yrs">${r.titles.join(', ')}</small>` : ''}</span></span></td>
        <td class="pts">${r.titles.length || '–'}</td><td class="l">${r.titles.join(', ') || '–'}</td><td>${r.second || '–'}</td><td>${r.third || '–'}</td></tr>`).join('')}</tbody></table></div>
    <div class="section-head" style="margin-top:28px"><h3>Edições</h3></div>
    <div class="table-wrap"><table class="tbl wc-eds">
      <thead><tr><th class="l">Copa</th><th class="l">Sedes</th><th class="l">Campeã</th><th class="l">Vice</th><th class="l">3º lugar</th></tr></thead>
      <tbody>${done.map(e => `<tr><td class="l">${e.real ? e.year : `<a href="#/copa/${e.cy.id}">${e.year}</a> <span class="lg-tag">simulada</span>`}</td><td class="l">${esc(e.real ? e.hosts : e.cy.hosts.map(shortOf).join(', '))}</td>
        ${[e.p.champion, e.p.runnerUp, e.p.third].map(id => `<td class="l"><span class="team">${crest(id, 22)}<span class="nm-l">${esc(nameOf(id))}</span><span class="nm-s">${esc(shortOf(id))}</span></span></td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function wcListPage() {
  const cycles = (Store.d.cycles || []).slice().sort((a, b) => b.created - a.created);
  const series = [...new Set(cycles.map(c => c.series))];
  return `<section class="page"><div class="wrap">
    <div class="page-head"><div><img class="wc-wordmark" src="${WC.CUP_LOGO}" alt="Copa do Mundo"><p>Um ciclo completo: você escolhe as sedes, o site ajusta as vagas e o formato das eliminatórias de cada confederação, e tudo segue até a final da Copa de 48 seleções.</p></div>
      <button class="btn btn-lime" data-act="wcNew">${I.plus} Novo ciclo</button></div>
    ${cycles.length ? `<div class="comp-list">${cycles.map(wcCycleCard).join('')}</div>
      ${series.map((s, i) => `<div class="section-head" style="margin-top:40px"><h2 style="font-size:22px">Seleções campeãs${series.length > 1 ? ` · série ${series.length - i}` : ''}</h2></div>${wcHallHTML(s)}`).join('')}`
    : `<div class="panel empty"><h3>Nenhum ciclo criado</h3><p>Comece escolhendo as sedes. As eliminatórias são sorteadas na hora.</p><p style="margin-top:14px"><button class="btn btn-dark" data-act="wcNew">Criar o primeiro ciclo</button></p></div>`}
  </div></section>`;
}

/* ---------- assistente de criação ---------- */
function wcStartWizard(prev) {
  const last = prev || null;
  const W = { year: last ? last.year + 4 : 2030, hosts: [], series: last ? last.series : null, prev: last ? last.id : null };
  W.quotas = WC.suggestQuotas(W.hosts);
  UI.wcWizard = W;
  Modal.open(wcWizardHTML, 'wide');
}
// − valor + : funciona igual no computador e no celular, sem depender do teclado
function wcStepper(c, k, n) {
  const W = UI.wcWizard, q = W.quotas[c.k], v = q[k], [mn, mx, mp] = WC.LIMITS[c.k];
  const lo = k === 'd' ? mn : 0;
  const hi = Math.min(k === 'd' ? mx : mp, Math.max(0, n - 1) - (k === 'd' ? q.p : q.d));
  const lbl = `${k === 'd' ? 'vagas diretas' : 'vagas na repescagem'} ${c.name}`;
  return `<span class="wc-step"><button data-act="wcQ" data-c="${c.k}" data-k="${k}" data-v="-1" ${v <= lo ? 'disabled' : ''} aria-label="Diminuir ${esc(lbl)}">−</button><b>${v}</b><button data-act="wcQ" data-c="${c.k}" data-k="${k}" data-v="1" ${v >= hi ? 'disabled' : ''} aria-label="Aumentar ${esc(lbl)}">+</button></span>`;
}
function wcWizardHTML() {
  const W = UI.wcWizard;
  const errs = WC.validateQuotas(W.quotas, W.hosts);
  const sumD = WC.CONFS.reduce((s, c) => s + W.quotas[c.k].d, 0), sumP = WC.CONFS.reduce((s, c) => s + W.quotas[c.k].p, 0);
  return `<div class="modal-head"><h3>${W.prev ? 'Próximo ciclo de Copa do Mundo' : 'Novo ciclo de Copa do Mundo'}</h3><button class="close" data-act="close" aria-label="Fechar">${I.x}</button></div>
    <div class="wc-wiz">
      <label class="wc-year">Ano da Copa <input class="num" type="number" min="1930" max="2200" step="1" value="${W.year}" data-inp="wcYear" aria-label="Ano da Copa"></label>
      <h4>Sedes</h4>
      <p class="hint">Até ${WC.MAX_HOSTS}, de qualquer confederação. As sedes já estão na Copa e não jogam as eliminatórias; cada uma ocupa uma vaga direta da sua confederação.</p>
      <div class="wc-hosts">
        ${W.hosts.map(id => `<span class="wc-hostchip">${crest(id, 26)}<b>${esc(nameOf(id))}</b><small>${esc(wcConf(WC.confOf(id)).name)}</small><button data-act="wcHostRemove" data-id="${id}" aria-label="Tirar ${esc(nameOf(id))}">${I.x}</button></span>`).join('')}
        ${W.hosts.length < WC.MAX_HOSTS ? `<button class="btn btn-line btn-sm" data-act="wcHostAdd">${I.plus} Adicionar sede</button>` : ''}
      </div>
      <h4>Vagas</h4>
      <p class="hint">Sugestão calculada pelas sedes, a partir da divisão de 2026. Você pode ajustar: as diretas somam ${46 - W.hosts.length} e a repescagem mundial tem 6 seleções disputando 2 vagas. A UEFA nunca joga a repescagem.</p>
      <div class="table-wrap"><table class="tbl wc-quota">
        <thead><tr><th class="l">Confederação</th><th>Sedes</th><th>Disputam</th><th>Vagas diretas</th><th>Repescagem mundial</th></tr></thead>
        <tbody>${WC.CONFS.map(c => {
          const h = W.hosts.filter(id => WC.confOf(id) === c.k).length, n = WC.members(c.k).filter(id => !W.hosts.includes(id)).length;
          return `<tr><td class="l"><span class="team"><img class="wc-conf-ic" src="${c.logo}" alt="">${esc(c.name)} <small class="muted">${esc(c.full)}</small></span></td><td>${h || '–'}</td><td>${n}</td>
            <td>${wcStepper(c, 'd', n)}</td>
            <td>${c.k === 'UEFA' ? '–' : wcStepper(c, 'p', n)}</td></tr>`;
        }).join('')}
        <tr class="wc-total"><td class="l">Total</td><td>${W.hosts.length}</td><td></td><td class="${sumD === 46 - W.hosts.length ? '' : 'wc-off'}">${sumD} de ${46 - W.hosts.length}</td><td class="${sumP === 6 ? '' : 'wc-off'}">${sumP} de 6</td></tr></tbody></table></div>
      ${errs.length ? `<ul class="wc-errs">${errs.map(e => `<li>${esc(e)}</li>`).join('')}</ul>` : ''}
    </div>
    <div class="modal-foot">
      <button class="btn btn-ghost btn-sm" data-act="wcSuggest">Voltar à sugestão</button>
      <button class="btn btn-lime" data-act="wcCreate" ${errs.length ? 'disabled' : ''}>Criar ciclo e sortear as eliminatórias</button>
    </div>`;
}

/* ---------- painel do ciclo ---------- */
function wcSlots(ids, total, cls = '') {
  let h = '';
  for (let i = 0; i < total; i++) {
    const id = ids[i];
    h += id ? `<span class="wc-slot on ${cls}" title="${esc(nameOf(id))}">${crest(id, 30)}<small>${esc(shortOf(id))}</small></span>` : `<span class="wc-slot ${cls}"><i></i><small>&nbsp;</small></span>`;
  }
  return h;
}
function wcPathHTML(cy, S) {
  const fin = S.finals;
  const blocks = WC.CONFS.map(c => {
    const x = S.confs[c.k], hosts = cy.hosts.filter(id => WC.confOf(id) === c.k);
    return `<div class="wc-block">
      <div class="wc-block-h"><img src="${c.logo}" alt=""><div><h4>${esc(c.name)}</h4><span>${x.direct.length + hosts.length} de ${x.d + hosts.length} na Copa${x.comp ? '' : ' · sem eliminatórias'}</span></div>
        ${x.comp ? `<a class="btn btn-ghost btn-sm" href="#/c/${x.comp.id}">Abrir</a>` : ''}</div>
      <div class="wc-slots">${wcSlots(hosts, hosts.length, 'host')}${wcSlots(x.direct, x.d)}</div>
      ${x.p ? `<div class="wc-po"><span>Repescagem mundial</span><div class="wc-slots">${wcSlots(x.playoff, x.p, 'po')}</div></div>` : ''}
      ${x.comp ? `<div class="wc-block-f">${x.awaiting ? '<b>Falta confirmar as seleções da Liga das Nações</b>' : x.done ? 'Encerradas' : esc(Reg.currentLabel(x.comp))}</div>` : ''}
    </div>`;
  }).join('');
  const po = `<div class="wc-block">
      <div class="wc-block-h"><span class="wc-badge ${WC.TROPHY ? 'img' : ''}">${WC.TROPHY ? `<img src="${WC.TROPHY}" alt="">` : I.bracket}</span><div><h4>Repescagem mundial</h4><span>${S.poWinners.length} de 2 na Copa</span></div>
        ${S.playoff ? `<a class="btn btn-ghost btn-sm" href="#/c/${S.playoff.id}">Abrir</a>` : ''}</div>
      <div class="wc-slots">${wcSlots(S.poWinners, 2)}</div>
      <div class="wc-po"><span>Disputam</span><div class="wc-slots">${wcSlots(S.playoff ? S.playoff.entries.teams : S.poTeams, 6, 'po')}</div></div>
      <div class="wc-block-f">${S.playoff ? (Reg.finished(S.playoff) ? 'Encerrada' : esc(Reg.currentLabel(S.playoff))) : 'Montada quando todas as eliminatórias terminarem'}</div>
    </div>`;
  const groups = fin ? `<div class="section-head" style="margin-top:34px"><h3>Grupos da Copa</h3><span class="aside"><a href="#/c/${fin.id}">Abrir a Copa</a></span></div>
    <div class="wc-groups">${fin.stages[0].groups.map((g, gi) => `<div class="wc-group"><h5>${esc(g.name)}</h5>${Reg.rank(fin, 0, gi).map(r => `<span class="team">${crest(r.id, 22)}${esc(nameOf(r.id))}${cy.hosts.includes(r.id) ? '<em>sede</em>' : ''}<b>${r.j ? r.p : ''}</b></span>`).join('')}</div>`).join('')}</div>` : '';
  return `<div class="wc-count"><b>${S.qualified.length}</b> de 48 seleções classificadas</div>
    <div class="wc-grid">${blocks}${po}</div>${groups}`;
}
function wcStagesHTML(cy, S) {
  const cards = WC.CONFS.map(c => S.confs[c.k].comp).filter(Boolean).map(compCard).join('');
  const ph = (t, d) => `<div class="comp-card wc-ph"><div class="t"><span class="wc-badge">${I.bracket}</span><div><h4>${t}</h4><div class="f">${d}</div></div></div></div>`;
  return `<div class="section-head"><h3>Eliminatórias</h3></div><div class="comp-list">${cards}</div>
    <div class="section-head" style="margin-top:30px"><h3>Repescagem mundial e Copa</h3></div>
    <div class="comp-list">${S.playoff ? compCard(S.playoff) : ph('Repescagem mundial', 'Montada quando todas as eliminatórias terminarem')}
      ${S.finals ? compCard(S.finals) : ph(esc(cy.name), 'Os grupos são sorteados depois da repescagem mundial')}</div>`;
}
function wcRankHTML(cy) {
  const U = UI.wc[cy.id], R = WC.ranking(Store.d, cy);
  const rows = R.rows.filter(r => !U.rankConf || WC.confOf(r.id) === U.rankConf);
  const shown = U.rankAll ? rows : rows.slice(0, 50);
  const arrow = n => (n > 0 ? `<span class="wc-up">▲ ${n}</span>` : n < 0 ? `<span class="wc-down">▼ ${-n}</span>` : '<span class="muted">–</span>');
  const sign = v => (Math.abs(v) < 0.05 ? '<span class="muted">0</span>' : `<span class="${v > 0 ? 'wc-up' : 'wc-down'}">${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(1).replace('.', ',')}</span>`);
  return `<div class="toolbar"><div class="chips">
      <button class="chip ${!U.rankConf ? 'on' : ''}" data-act="wcRankConf" data-v="">Todas</button>
      ${WC.CONFS.map(c => `<button class="chip ${U.rankConf === c.k ? 'on' : ''}" data-act="wcRankConf" data-v="${c.k}">${esc(c.name)}</button>`).join('')}</div></div>
    <div class="table-wrap"><table class="tbl">
      <thead><tr><th>#</th><th>Posições</th><th class="l">Seleção</th><th class="l">Confederação</th><th>Pontos</th><th>No ciclo</th></tr></thead>
      <tbody>${shown.map(r => `<tr><td class="pos">${r.pos}</td><td>${arrow(r.dpos)}</td><td class="l"><span class="team">${crest(r.id, 24)}${esc(nameOf(r.id))}</span></td>
        <td class="l"><span class="lg-tag">${esc(wcConf(WC.confOf(r.id)).name)}</span></td><td class="pts">${r.pts.toFixed(1).replace('.', ',')}</td><td>${sign(r.d)}</td></tr>`).join('')}</tbody></table></div>
    ${rows.length > shown.length ? `<p style="margin-top:14px"><button class="btn btn-line btn-sm" data-act="wcRankAll">Mostrar as ${rows.length} seleções</button></p>` : ''}
    <p class="hint" style="margin-top:14px">Ranking próprio deste modo: parte ${cy.prev ? 'de como terminou o ciclo anterior' : `do ranking FIFA de ${RANKING_FIFA_DATA}`} e muda a cada jogo pela fórmula da FIFA (o ganho depende da força do adversário). Para equiparar calendários diferentes, nas eliminatórias cada seleção conta no máximo o equivalente a 10 jogos: quem joga 18 partidas tem cada uma pesando menos. Jogos da Copa valem o dobro, e derrota no mata-mata não tira pontos. Este ranking define os potes dos sorteios do ciclo e não altera a força nem o ranking geral das seleções.</p>`;
}

function wcCyclePage(id) {
  const cy = wcCycle(id);
  if (!cy) return `<section class="page"><div class="wrap"><div class="panel empty"><h3>Ciclo não encontrado</h3><p>Ele pode ter sido excluído.</p><p style="margin-top:14px"><a class="btn btn-dark" href="#/copa">Ver ciclos</a></p></div></div></section>`;
  WC.sync(Store.d, cy);
  WC.compsOf(Store.d, cy).forEach(c => WC.prepare(Store.d, c));
  if (!UI.wc[id]) UI.wc[id] = { tab: 'path', rankConf: '', rankAll: false };
  const U = UI.wc[id], S = WC.status(Store.d, cy), p = WC.podium(Store.d, cy);
  const undo = UI.wcUndo[id] || [];
  const pend = WC.pending(Store.d, cy);
  const next = (Store.d.cycles || []).find(c => c.prev === cy.id);
  const order = ['qual', 'playoff', 'draw', 'cup'], at = S.stage === 'done' ? 4 : order.indexOf(S.stage);
  const main = S.stage === 'qual' ? ['wcStep', 'Avançar data FIFA', 'wcRun', 'Simular até o fim das eliminatórias']
    : S.stage === 'playoff' ? ['wcStep', 'Simular próxima rodada da repescagem', 'wcRun', 'Simular a repescagem até o fim']
    : S.stage === 'draw' ? ['wcDraw', 'Sortear os grupos da Copa', null, null]
    : S.stage === 'cup' ? ['wcStep', 'Simular próxima rodada da Copa', 'wcRun', 'Simular a Copa até o fim'] : [null, null, null, null];
  const body = U.tab === 'stages' ? wcStagesHTML(cy, S) : U.tab === 'rank' ? wcRankHTML(cy) : U.tab === 'hall' ? wcHallHTML(cy.series) : wcPathHTML(cy, S);
  const canRedraw = S.finals && !WC.played(S.finals);
  return `<section class="page"><div class="wrap">
    <a class="back-link" href="#/copa">${I.left} Ciclos de Copa do Mundo</a>
    <div class="comp-hero wc-hero">
      <div class="badge ${WC.TROPHY ? '' : 'plain'}">${WC.TROPHY ? `<img src="${WC.TROPHY}" alt="">` : I.trophy}</div>
      <div>
        <h1>${esc(cy.name)}</h1>
        <div class="f wc-hostline">Sede${cy.hosts.length > 1 ? 's' : ''}: ${wcHostsLine(cy)}</div>
        <ol class="wc-steps">${order.map((k, i) => `<li class="${i < at ? 'done' : i === at ? 'now' : ''}">${WC_STAGE[k]}</li>`).join('')}</ol>
      </div>
      <div class="acts">
        ${main[0] ? `<button class="btn btn-lime" data-act="${main[0]}">${main[1]}</button>` : next ? `<a class="btn btn-lime" href="#/copa/${next.id}">Abrir o ciclo de ${next.year}</a>` : `<button class="btn btn-lime" data-act="wcNext">Criar o próximo ciclo</button>`}
        ${main[2] ? `<button class="btn btn-line" style="border-color:var(--lime);color:var(--lime)" data-act="${main[2]}">${main[3]}</button>` : ''}
        <div class="row">
          <button class="btn btn-ghost btn-sm" data-act="wcUndo" ${undo.length ? `title="Desfazer: ${esc(undo[undo.length - 1].label)}"` : 'disabled title="Nada para desfazer"'}>${I.undo} Desfazer${undo.length ? `<span class="undo-n">${undo.length}</span>` : ''}</button>
          ${canRedraw ? `<button class="btn btn-ghost btn-sm" data-act="wcRedraw">Refazer o sorteio</button>` : ''}
          <button class="btn btn-ghost btn-sm btn-danger" data-act="wcDelete">Excluir ciclo</button>
        </div>
      </div>
    </div>
    ${p ? `<div class="champion">${crest(p.champion, 64)}<div><small>Campeã do mundo</small><h2>${esc(nameOf(p.champion))}</h2></div><span class="wc-podium">Vice: ${esc(nameOf(p.runnerUp))} · 3º: ${esc(nameOf(p.third))} · 4º: ${esc(nameOf(p.fourth))}</span></div>` : ''}
    ${pend.map(c => `<div class="callout"><div><b>Repescagem europeia: falta confirmar.</b> Os grupos da UEFA terminaram. Confirme as seleções vindas da Liga das Nações para a repescagem continuar.</div><a class="btn btn-dark btn-sm" href="#/c/${c.id}">Revisar e confirmar</a></div>`).join('')}
    ${S.stage === 'draw' ? `<div class="callout"><div><b>As 48 seleções estão definidas.</b> Sorteie os grupos: sedes como cabeças dos primeiros grupos, potes pelo ranking do ciclo e no máximo uma seleção por confederação em cada grupo (UEFA: até duas).</div><button class="btn btn-dark btn-sm" data-act="wcDraw">Sortear os grupos</button></div>` : ''}
    <div class="tabs" role="tablist">${[['path', 'Caminho para a Copa'], ['stages', 'Etapas'], ['rank', 'Ranking'], ['hall', 'Campeãs']].map(([k, l]) => `<button role="tab" class="${U.tab === k ? 'on' : ''}" data-act="wcTab" data-v="${k}">${l}</button>`).join('')}</div>
    ${body}
  </div></section>`;
}

/* ---------- ligação com o app ---------- */
function wcInit() {
  Pages.copa = id => (id ? wcCyclePage(id) : wcListPage());
  const reopen = () => Modal.open(wcWizardHTML, 'wide');
  const act = (label, fn) => () => { const cy = wcCurrent(); if (!cy) return; wcPushUndo(cy, label); const r = fn(cy); if (r === false) UI.wcUndo[cy.id].pop(); Store.save(); render(); };
  Object.assign(Actions, {
    wcNew: () => wcStartWizard(null),
    wcNext: () => { const cy = wcCurrent(); if (cy) wcStartWizard(cy); },
    wcHostAdd: () => {
      const W = UI.wcWizard, ok = new Set(WC.allNations().filter(id => id !== 'sel-russia' && !W.hosts.includes(id)));
      openPicker(id => { W.hosts.push(id); W.quotas = WC.suggestQuotas(W.hosts); reopen(); }, null, new Set(Teams.list.filter(t => !ok.has(t.id)).map(t => t.id)));
      UI.picker.filter = 'NATIONS'; UI.picker.back = reopen; Modal.refresh();
    },
    wcQ: el => {
      const W = UI.wcWizard, q = W.quotas[el.dataset.c];
      q[el.dataset.k] = Math.max(0, q[el.dataset.k] + +el.dataset.v);
      const bg = Modal.el, y = bg ? bg.scrollTop : 0, my = bg ? bg.firstElementChild.scrollTop : 0;
      Modal.refresh();
      if (Modal.el) { Modal.el.scrollTop = y; Modal.el.firstElementChild.scrollTop = my; const n = Modal.el.querySelector(`[data-act=wcQ][data-c="${el.dataset.c}"][data-k="${el.dataset.k}"][data-v="${el.dataset.v}"]`); if (n && !n.disabled) n.focus({ preventScroll: true }); }
    },
    wcHostRemove: el => { const W = UI.wcWizard; W.hosts = W.hosts.filter(id => id !== el.dataset.id); W.quotas = WC.suggestQuotas(W.hosts); Modal.refresh(); },
    wcSuggest: () => { const W = UI.wcWizard; W.quotas = WC.suggestQuotas(W.hosts); Modal.refresh(); },
    wcCreate: () => {
      const W = UI.wcWizard;
      if (WC.validateQuotas(W.quotas, W.hosts).length) return;
      const prev = W.prev && wcCycle(W.prev);
      try {
        const rank0 = prev ? WC.ranking(Store.d, prev).pts : null;
        const cy = WC.createCycle(Store.d, { name: `Copa do Mundo ${W.year}`, year: W.year, hosts: W.hosts, quotas: W.quotas, rank0, series: W.series, prev: W.prev });
        if (prev) WC.compact(Store.d, prev);
        Store.save(); Modal.close(); UI.wcWizard = null;
        location.hash = `#/copa/${cy.id}`;
        toast(`<b>${esc(cy.name)}</b> criada: eliminatórias sorteadas.`);
      } catch (err) { console.error(err); toast(esc(err.message)); }
    },
    wcStep: act('rodada', cy => {
      const before = WC.status(Store.d, cy).stage, r = WC.stepAll(Store.d, cy);
      if (!r.length) { toast(WC.pending(Store.d, cy).length ? 'Falta confirmar as seleções da Liga das Nações na repescagem europeia.' : 'Nada para simular agora.'); return false; }
      const after = WC.status(Store.d, cy), p = WC.podium(Store.d, cy);
      if (p) toast(`Fim! <b>${esc(nameOf(p.champion))}</b> é campeã do mundo.`);
      else if (after.stage !== before) toast(`${WC_STAGE[before]} encerrada${before === 'qual' ? 's' : ''}. Próxima etapa: ${WC_STAGE[after.stage].toLowerCase()}.`);
      else if (before === 'qual') toast(`Data FIFA simulada em ${r.length} confederaç${r.length > 1 ? 'ões' : 'ão'}.${WC.pending(Store.d, cy).length ? ' A UEFA espera a confirmação da Liga das Nações.' : ''}`);
      else toast('Rodada simulada.');
    }),
    wcRun: act('simular etapa', cy => {
      const before = WC.status(Store.d, cy).stage, n = WC.runStage(Store.d, cy);
      const after = WC.status(Store.d, cy), p = WC.podium(Store.d, cy);
      if (!n) { toast(WC.pending(Store.d, cy).length ? 'Falta confirmar as seleções da Liga das Nações na repescagem europeia.' : 'Nada para simular agora.'); return false; }
      if (p) toast(`<b>${esc(nameOf(p.champion))}</b> é campeã do mundo.`);
      else if (after.stage === before) toast('Simulado até a repescagem europeia: confirme as seleções da Liga das Nações para continuar.');
      else toast(`${WC_STAGE[before]} encerrada${before === 'qual' ? 's' : ''}. Próxima etapa: ${WC_STAGE[after.stage].toLowerCase()}.`);
    }),
    wcDraw: act('sorteio dos grupos', cy => {
      const fin = WC.drawFinals(Store.d, cy);
      if (!fin) { toast('Ainda não dá para sortear: as 48 seleções precisam estar definidas.'); return false; }
      UI.wc[cy.id].tab = 'path'; toast('Grupos sorteados.');
    }),
    wcRedraw: act('refazer o sorteio', cy => {
      if (!WC.undrawFinals(Store.d, cy)) { toast('A Copa já começou: não dá mais para refazer o sorteio.'); return false; }
      WC.drawFinals(Store.d, cy); toast('Novo sorteio feito.');
    }),
    wcUndo: () => { const cy = wcCurrent(); if (cy) wcUndo(cy); },
    wcDelete: () => {
      const cy = wcCurrent(); if (!cy) return;
      if (!confirm(`Excluir "${cy.name}" com todas as eliminatórias e a Copa? Não dá para desfazer.`)) return;
      WC.removeCycle(Store.d, cy); Store.save(); location.hash = '#/copa';
    },
    wcTab: el => { UI.wc[wcCurrent().id].tab = el.dataset.v; render(); },
    wcRankConf: el => { const U = UI.wc[wcCurrent().id]; U.rankConf = el.dataset.v; U.rankAll = false; render(); },
    wcRankAll: () => { UI.wc[wcCurrent().id].rankAll = true; const y = window.scrollY; render(); window.scrollTo(0, y); }
  });
  Object.assign(Inputs, {
    wcYear: el => { const v = parseInt(el.value, 10); if (v) UI.wcWizard.year = v; },
    wcQuota: (el, type) => {
      if (type !== 'change') return;
      const W = UI.wcWizard, v = Math.max(0, parseInt(el.value, 10) || 0);
      W.quotas[el.dataset.c][el.dataset.k] = v; Modal.refresh();
    }
  });
}
