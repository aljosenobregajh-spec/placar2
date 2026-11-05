/* Placar — motor de simulação
   Modelo: gols ~ Poisson(λ). λ depende de ATA do time vs DEF do adversário,
   mando de campo e um "fator forma" aleatório por jogo (controlado pelo fator zebra). */

const Engine = (() => {
  let getTeam = () => null;
  let fast = false;   // modo rápido (probabilidades): sem eventos nem estatísticas
  let settings = { chaos: 25, homeAdv: 1, goals: 1, altitude: 1 };

  const rand = Math.random;
  const uid = () => Math.random().toString(36).slice(2, 10);
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ovr = t => Math.round((t.atk + t.def) / 2);

  function poisson(l) {
    const L = Math.exp(-l); let k = 0, p = 1;
    do { k++; p *= rand(); } while (p > L);
    return k - 1;
  }
  function gauss() {
    let u = 0, v = 0;
    while (!u) u = rand();
    while (!v) v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }
  function shuffle(a) {
    a = a.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  const fallbackTeam = id => ({ id, name: 'Clube removido', short: '???', atk: 60, def: 60, colors: ['#999', '#fff'] });
  const T = id => getTeam(id) || fallbackTeam(id);

  /* ---------- Força e expectativa de gols ---------- */
  function baseLambdas(h, a, neutral) {
    const chaos = settings.chaos / 100;
    const k = 0.047 * (1 - chaos * 0.45);
    const base = 1.0 * (settings.goals ?? 1);
    const hadv = neutral ? 0 : 0.13 * settings.homeAdv;
    // diferença de força "saturada": um gigante contra um pequeno não vira goleada todo jogo
    const sat = d => 34 * Math.tanh(d / 34);
    // altitude: quem joga em casa muito acima do visitante ganha vantagem extra (La Paz, Quito, Cusco, Bogotá...)
    const altKm = neutral ? 0 : Math.max(0, (h.alt || 0) - (a.alt || 0) - 1000) / 1000 * (settings.altitude ?? 1);
    const lh = base * Math.exp(k * sat(h.atk - a.def) + hadv + 0.11 * altKm);
    const la = base * Math.exp(k * sat(a.atk - h.def) - hadv * 0.7 - 0.13 * altKm);
    return [clamp(lh, 0.1, 5), clamp(la, 0.1, 5)];
  }
  const sigma = () => 0.06 + (settings.chaos / 100) * 0.34;

  function poissonPmf(l, n) {
    const out = []; let p = Math.exp(-l);
    for (let k = 0; k <= n; k++) { out.push(p); p = p * l / (k + 1); }
    return out;
  }

  // Probabilidade (vitória mandante, empate, vitória visitante), já considerando o fator forma
  function probabilities(hId, aId, neutral) {
    const [lh, la] = baseLambdas(T(hId), T(aId), neutral);
    const s = sigma();
    const nodes = [-1.6, -0.8, 0, 0.8, 1.6];
    const w = nodes.map(z => Math.exp(-z * z / 2));
    const ws = w.reduce((x, y) => x + y, 0);
    let pH = 0, pD = 0, pA = 0;
    nodes.forEach((zh, i) => nodes.forEach((za, j) => {
      const wt = (w[i] / ws) * (w[j] / ws);
      const ph = poissonPmf(lh * Math.exp(s * zh), 10);
      const pa = poissonPmf(la * Math.exp(s * za), 10);
      for (let x = 0; x <= 10; x++) for (let y = 0; y <= 10; y++) {
        const p = ph[x] * pa[y] * wt;
        if (x > y) pH += p; else if (x === y) pD += p; else pA += p;
      }
    }));
    const tot = pH + pD + pA;
    return [pH / tot, pD / tot, pA / tot];
  }

  /* ---------- Partida ---------- */
  function goalMinutes(n, from, to, stoppage) {
    const out = [];
    for (let i = 0; i < n; i++) {
      if (to === 90 && rand() < 0.1) {
        const half = rand() < 0.4 ? 45 : 90;
        const extra = 1 + Math.floor(rand() * stoppage);
        out.push({ m: half + extra / 10, t: `${half}+${extra}` });
      } else {
        const m = from + Math.floor(rand() * (to - from + 1));
        out.push({ m, t: String(m) });
      }
    }
    return out;
  }

  function shootout(h, a) {
    const conv = (x, y) => clamp(0.75 + (x.atk - y.def) * 0.004, 0.6, 0.88);
    const ph = conv(h, a), pa = conv(a, h);
    const kh = [], ka = [];
    const sum = arr => arr.filter(Boolean).length;
    for (let r = 0; r < 5; r++) {
      kh.push(rand() < ph);
      if (sum(kh) > sum(ka) + (5 - ka.length) || sum(ka) > sum(kh) + (5 - kh.length)) break;
      ka.push(rand() < pa);
      if (sum(kh) > sum(ka) + (5 - ka.length) || sum(ka) > sum(kh) + (5 - kh.length)) break;
    }
    while (sum(kh) === sum(ka)) {
      kh.push(rand() < ph);
      ka.push(rand() < pa);
    }
    return { h: sum(kh), a: sum(ka), kh, ka };
  }

  /* opts: neutral, decider ('none'|'et'|'pens'), prior: [golsMandanteAntes, golsVisitanteAntes] */
  function playMatch(m, opts = {}) {
    const h = T(m.h), a = T(m.a);
    const neutral = opts.neutral ?? m.neutral;
    const decider = opts.decider ?? m.decider ?? 'none';
    const prior = opts.prior ?? [0, 0];
    let [lh, la] = baseLambdas(h, a, neutral);
    const s = sigma();
    lh *= Math.exp(s * gauss());
    la *= Math.exp(s * gauss());

    const hg = poisson(lh), ag = poisson(la);
    const ev = [];
    goalMinutes(hg, 1, 90, 5).forEach(g => ev.push({ ...g, s: 0, k: 'goal' }));
    goalMinutes(ag, 1, 90, 5).forEach(g => ev.push({ ...g, s: 1, k: 'goal' }));
    // cartões vermelhos ocasionais (decorativos)
    [0, 1].forEach(side => {
      if (rand() < 0.07) {
        const mm = 20 + Math.floor(rand() * 70);
        ev.push({ m: mm, t: String(mm), s: side, k: 'red' });
      }
    });

    const res = { hg, ag, et: null, pen: null };
    const tied = () => (res.hg + prior[0]) === (res.ag + prior[1]);

    if (decider !== 'none' && tied()) {
      if (decider === 'et' || decider === 'etOnly') {
        const eh = poisson(lh * 0.3), ea = poisson(la * 0.3);
        goalMinutes(eh, 91, 120, 2).forEach(g => ev.push({ ...g, s: 0, k: 'goal' }));
        goalMinutes(ea, 91, 120, 2).forEach(g => ev.push({ ...g, s: 1, k: 'goal' }));
        res.et = { hg: eh, ag: ea };
        res.hg += eh; res.ag += ea;
      }
      if (tied() && decider !== 'etOnly') res.pen = shootout(h, a);
    }

    if (fast) { Object.assign(m, { played: true, hg: res.hg, ag: res.ag, et: res.et, pen: res.pen, ev: [], st: null }); return m; }
    // estatísticas
    const pos = Math.round(clamp(50 + (ovr(h) - ovr(a)) * 0.7 + (neutral ? 0 : 3) + gauss() * 4, 28, 72));
    const shotsH = res.hg + poisson(lh * 6 + 3), shotsA = res.ag + poisson(la * 6 + 3);
    const sotH = Math.min(shotsH, res.hg + poisson(lh * 1.4 + 0.8));
    const sotA = Math.min(shotsA, res.ag + poisson(la * 1.4 + 0.8));
    const xg = x => Math.round(Math.max(0.1, x) * 10) / 10;

    Object.assign(m, {
      played: true,
      hg: res.hg, ag: res.ag, et: res.et, pen: res.pen,
      ev: ev.sort((x, y) => x.m - y.m),
      st: {
        pos: [pos, 100 - pos],
        shots: [shotsH, shotsA],
        sot: [sotH, sotA],
        xg: [xg(lh * 0.9 + res.hg * 0.1 + gauss() * 0.15), xg(la * 0.9 + res.ag * 0.1 + gauss() * 0.15)]
      }
    });
    return m;
  }

  const newMatch = (h, a, extra = {}) => ({ id: uid(), h, a, played: false, ...extra });
  const resetMatch = m => {
    ['hg', 'ag', 'et', 'pen', 'ev', 'st', 'manual'].forEach(k => delete m[k]);
    m.played = false;
  };

  // vencedor de uma partida isolada (com pênaltis); null = empate
  function matchWinner(m) {
    if (!m.played) return null;
    if (m.hg !== m.ag) return m.hg > m.ag ? m.h : m.a;
    if (m.pen) return m.pen.h > m.pen.a ? m.h : m.a;
    return null;
  }

  /* ---------- Confronto (mata-mata) ---------- */
  // rule: { et, pens, better (id do melhor colocado: avança no empate), bo3 }
  const deciderOf = r => r.et && r.pens ? 'et' : r.et ? 'etOnly' : r.pens ? 'pens' : 'none';
  function newTie(a, b, legs, neutralFinal, rule) {
    const tie = { id: uid(), a, b, legs, m: [], w: null };
    if (b == null) { tie.w = a; tie.bye = true; return tie; }
    if (rule) { tie.rule = { et: !!rule.et, pens: !!rule.pens }; if (rule.better) tie.better = rule.better; if (rule.bo3) tie.bo3 = true; }
    const r = tie.rule || { et: true, pens: true };
    if (tie.bo3) {
      // melhor de 3: jogos 1 e 3 na casa de "a" (melhor campanha); empate em cada jogo vai direto aos pênaltis
      tie.m.push(newMatch(a, b, { decider: 'pens', game: 1 }), newMatch(b, a, { decider: 'pens', game: 2 }), newMatch(a, b, { decider: 'pens', game: 3 }));
    } else if (legs === 1) tie.m.push(newMatch(a, b, { neutral: !!neutralFinal, decider: deciderOf(r) }));
    else tie.m.push(newMatch(a, b, { decider: 'none' }), newMatch(b, a, { decider: deciderOf(r), leg2: true }));
    return tie;
  }
  function tieAggregate(tie) {
    let ga = 0, gb = 0;
    if (tie.bo3) {
      tie.m.forEach(m => { const w = matchWinner(m); if (w === tie.a) ga++; else if (w === tie.b) gb++; });
      return [ga, gb];
    }
    tie.m.forEach(m => {
      if (!m.played) return;
      if (m.h === tie.a) { ga += m.hg; gb += m.ag; } else { ga += m.ag; gb += m.hg; }
    });
    return [ga, gb];
  }
  function updateTie(tie) {
    if (tie.bye || tie.w) return;
    if (tie.bo3) {
      const [wa, wb] = tieAggregate(tie);
      if (wa >= 2 || wb >= 2) {
        tie.w = wa >= 2 ? tie.a : tie.b;
        tie.m = tie.m.filter(m => m.played);   // jogo 3 não é necessário
      }
      return;
    }
    if (!tie.m.every(m => m.played)) return;
    const last = tie.m[tie.m.length - 1];
    const [ga, gb] = tieAggregate(tie);
    if (ga !== gb) tie.w = ga > gb ? tie.a : tie.b;
    else if (last.pen) tie.w = last.pen.h > last.pen.a ? last.h : last.a;
    else if (tie.better && tie.rule && !tie.rule.pens) tie.w = tie.better;
  }
  // garante que a série melhor de 3 tenha o jogo 3 de volta quando algum resultado for apagado/alterado
  function restoreBo3(tie) {
    if (!tie.bo3) return;
    if (tie.m.length < 3 && !tie.m.some(m => m.game === 3)) tie.m.push(newMatch(tie.a, tie.b, { decider: 'pens', game: 3 }));
    if (tie.m.length < 2) tie.m.splice(1, 0, newMatch(tie.b, tie.a, { decider: 'pens', game: 2 }));
  }
  function playTieLeg(tie, idx) {
    const m = tie.m[idx];
    if (!m || m.played) return;
    if (tie.bo3) { playMatch(m); updateTie(tie); return; }
    if (idx === 1) {
      const l1 = tie.m[0];
      if (!l1.played) playMatch(l1);
      // gols prévios do ponto de vista do mandante do jogo de volta (= visitante da ida)
      playMatch(m, { prior: [l1.ag, l1.hg] });
    } else playMatch(m);
    updateTie(tie);
  }

  /* ---------- Geração de tabelas/jogos ---------- */
  // Tabela de pontos corridos (método do círculo) com mando alternado:
  // ninguém joga mais de 2 seguidas em casa ou fora, e o returno espelha o turno com mando invertido.
  function roundRobin(ids, legs) {
    let best = null;
    for (let attempt = 0; attempt < 300; attempt++) {
      const res = roundRobinOnce(ids, legs);
      if (!best || res.score < best.score) best = res;
      if (best.score === 0) break;
    }
    return best.rounds.map(rd => rd.map(([x, y]) => newMatch(x, y)));
  }
  function roundRobinOnce(ids, legs) {
    let t = shuffle(ids);
    if (t.length % 2) t.push(null);
    const n = t.length, pairings = [];
    for (let r = 0; r < n - 1; r++) {
      const rd = [];
      for (let i = 0; i < n / 2; i++) rd.push([t[i], t[n - 1 - i]]);
      pairings.push(rd);
      t = [t[0], t[n - 1], ...t.slice(1, n - 1)];
    }
    // orientação gulosa: manda em casa quem jogou fora na rodada anterior; desempate por menos jogos em casa
    const last = {}, run = {}, homes = {};
    ids.forEach(id => { last[id] = null; run[id] = 0; homes[id] = 0; });
    const turn = pairings.map(rd => shuffle(rd).filter(([x, y]) => x != null && y != null).map(([x, y]) => {
      const want = id => (last[id] === 'A' ? 2 * run[id] : last[id] === 'H' ? -2 * run[id] : 0) - homes[id] * 0.5 + rand() * 0.1;
      const [h, a] = want(x) >= want(y) ? [x, y] : [y, x];
      return [h, a];
    }).map(([h, a]) => {
      [[h, 'H'], [a, 'A']].forEach(([id, v]) => { run[id] = last[id] === v ? run[id] + 1 : 1; last[id] = v; if (v === 'H') homes[id]++; });
      return [h, a];
    }));
    const rounds = legs === 2 ? [...turn, ...turn.map(rd => rd.map(([x, y]) => [y, x]))] : turn;
    return { rounds, score: venuePenalty(rounds, ids) };
  }
  // penalidade: sequências de 3+ jogos no mesmo mando pesam muito; desequilíbrio casa/fora no turno pesa pouco
  function venuePenalty(rounds, ids) {
    let pen = 0;
    ids.forEach(id => {
      let lastV = null, len = 0, h = 0, played = 0;
      rounds.forEach(rd => {
        const g = rd.find(([x, y]) => x === id || y === id);
        if (!g) return;
        const v = g[0] === id ? 'H' : 'A';
        len = v === lastV ? len + 1 : 1; lastV = v;
        if (len >= 3) pen += 100 * (len - 2);
        if (v === 'H') h++; played++;
      });
      pen += Math.max(0, Math.abs(h - played / 2) - 1) * 10;
    });
    return pen;
  }
  function maxRun(rounds, id) {
    let lastV = null, len = 0, mx = 0;
    rounds.forEach(rd => {
      const g = rd.find(m => m.h === id || m.a === id);
      if (!g) return;
      const v = g.h === id ? 'H' : 'A';
      len = v === lastV ? len + 1 : 1; lastV = v; mx = Math.max(mx, len);
    });
    return mx;
  }

  function bracketOrder(P) {
    let arr = [1];
    while (arr.length < P) {
      const m = arr.length * 2;
      arr = arr.flatMap(s => [s, m + 1 - s]);
    }
    return arr;
  }
  const nextPow2 = n => { let p = 1; while (p < n) p *= 2; return p; };
  const isPow2 = n => n >= 2 && (n & (n - 1)) === 0;

  function roundName(teamsInRound, isPlayoff) {
    if (isPlayoff) return 'Playoff';
    const map = { 2: 'Final', 4: 'Semifinal', 8: 'Quartas de final', 16: 'Oitavas de final', 32: '16 avos de final', 64: '32 avos de final', 128: '64 avos de final' };
    return map[teamsInRound] || `Fase de ${teamsInRound}`;
  }

  const byOvr = ids => ids.slice().sort((x, y) => (ovr(T(y)) - ovr(T(x))) || (rand() - 0.5));

  // par ordenado: no jogo único o melhor manda; na ida e volta o melhor decide em casa
  function seededTie(better, worse, legs, neutralFinal) {
    if (worse == null) return newTie(better, null, legs);
    return legs === 2 ? newTie(worse, better, 2) : newTie(better, worse, 1, neutralFinal);
  }

  function knockoutFromSeeds(seeds, cfg) {
    const N = seeds.length, P = nextPow2(N);
    const order = bracketOrder(P);
    const slots = order.map(s => seeds[s - 1] ?? null);
    const ties = [];
    const isFinal = P === 2;
    const legs = isFinal ? cfg.finalLegs : cfg.koLegs;
    for (let i = 0; i < P; i += 2) ties.push(seededTie(slots[i], slots[i + 1], legs, isFinal && cfg.finalLegs === 1));
    return { name: roundName(P), ties };
  }

  /* ---------- Liga suíça ---------- */
  function swissGames(ids) {
    const n = ids.length / 4;
    const pots = [0, 1, 2, 3].map(p => ids.slice(p * n, (p + 1) * n));
    const games = [];
    for (let i = 0; i < 4; i++) {
      const q = shuffle(pots[i]);
      for (let k = 0; k < n; k++) games.push([q[k], q[(k + 1) % n]]);
      for (let j = i + 1; j < 4; j++) {
        const P = shuffle(pots[i]), Q = shuffle(pots[j]);
        for (let k = 0; k < n; k++) {
          games.push([P[k], Q[k]]);
          games.push([Q[(k + 1) % n], P[k]]);
        }
      }
    }
    return { pots, games };
  }
  // divide os jogos em rodadas completas (cada clube joga 1x por rodada) via emparelhamento perfeito
  function matchdays(games, ids, nRounds) {
    let left = games.slice();
    const rounds = [];
    for (let r = 0; r < nRounds; r++) {
      const pm = perfectMatching(left, ids);
      if (!pm) return null;
      rounds.push(pm);
      const used = new Set(pm);
      left = left.filter(g => !used.has(g));
    }
    return rounds;
  }
  function perfectMatching(edges, ids) {
    const adj = {};
    ids.forEach(id => adj[id] = []);
    shuffle(edges).forEach(e => { adj[e[0]].push(e); adj[e[1]].push(e); });
    const free = new Set(ids), chosen = [];
    let budget = 4000;
    function dfs() {
      if (!free.size) return true;
      if (--budget < 0) return false;
      // vértice com menos opções primeiro
      let best = null, bestOpts = null;
      for (const v of free) {
        const opts = adj[v].filter(e => free.has(e[0]) && free.has(e[1]));
        if (!opts.length) return false;
        if (!best || opts.length < bestOpts.length) { best = v; bestOpts = opts; }
      }
      for (const e of bestOpts) {
        free.delete(e[0]); free.delete(e[1]); chosen.push(e);
        if (dfs()) return true;
        chosen.pop(); free.add(e[0]); free.add(e[1]);
      }
      return false;
    }
    return dfs() ? chosen.slice() : null;
  }

  function assignRounds(games, nRounds, tries = 300) {
    let best = null;
    for (let t = 0; t < tries; t++) {
      const rounds = Array.from({ length: nRounds }, () => ({ g: [], busy: new Set() }));
      const order = shuffle(games);
      let ok = true;
      const extra = [];
      for (const g of order) {
        const cands = rounds.filter(r => !r.busy.has(g[0]) && !r.busy.has(g[1]));
        if (!cands.length) { ok = false; extra.push(g); continue; }
        // prioriza a rodada mais cheia (empacotamento)
        cands.sort((x, y) => y.g.length - x.g.length || rand() - 0.5);
        const r = cands[0];
        r.g.push(g); r.busy.add(g[0]); r.busy.add(g[1]);
      }
      if (ok) return rounds.map(r => r.g);
      if (!best || extra.length < best.extra.length) best = { rounds: rounds.map(r => r.g), extra };
    }
    // fallback: rodadas extras para o que não coube
    const out = best.rounds;
    best.extra.forEach(g => {
      let r = out.slice(nRounds).find(rr => !rr.some(x => x.includes(g[0]) || x.includes(g[1])));
      if (!r) { r = []; out.push(r); }
      r.push(g);
    });
    return out;
  }

  /* ---------- Classificação ---------- */
  function table(teamIds, matches) {
    const rows = {};
    teamIds.forEach(id => rows[id] = { id, p: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, form: [] });
    matches.filter(m => m.played).forEach(m => {
      const H = rows[m.h], A = rows[m.a];
      if (!H || !A) return;
      H.j++; A.j++;
      H.gp += m.hg; H.gc += m.ag; A.gp += m.ag; A.gc += m.hg;
      if (m.hg > m.ag) { H.v++; A.d++; H.p += 3; H.form.push('V'); A.form.push('D'); }
      else if (m.hg < m.ag) { A.v++; H.d++; A.p += 3; H.form.push('D'); A.form.push('V'); }
      else { H.e++; A.e++; H.p++; A.p++; H.form.push('E'); A.form.push('E'); }
    });
    return Object.values(rows).map(r => ({ ...r, sg: r.gp - r.gc, form: r.form.slice(-5) }))
      .sort((x, y) => y.p - x.p || y.v - x.v || y.sg - x.sg || y.gp - x.gp || T(x.id).name.localeCompare(T(y.id).name));
  }

  /* ---------- Competição ---------- */
  const GROUP_LETTERS = 'ABCDEFGHIJKLMNOP';

  function validate(format, teams, cfg) {
    const n = teams.length;
    if (format === 'league') {
      if (n < 2) return 'Escolha pelo menos 2 clubes.';
    }
    if (format === 'knockout') {
      if (n < 2) return 'Escolha pelo menos 2 clubes.';
    }
    if (format === 'groups') {
      const g = cfg.groups;
      if (n < g * 2) return `Com ${g} grupos, são necessários pelo menos ${g * 2} clubes.`;
      if (n % g) return `${n} clubes não se dividem igualmente em ${g} grupos.`;
      if (cfg.qualify > n / g) return 'Classificados por grupo maior que o tamanho do grupo.';
      if (!isPow2(g * cfg.qualify)) return `${g} grupos × ${cfg.qualify} classificados = ${g * cfg.qualify}; o mata-mata precisa de 2, 4, 8, 16 ou 32 clubes.`;
      if (cfg.qualify === 2 && g > 1 && g % 2) return 'Com 2 classificados por grupo, use um número par de grupos (ou 1 grupo).';
    }
    if (format === 'swiss') {
      if (n < 16 || n % 4) return 'A liga suíça precisa de 16, 20, 24, 28, 32 ou 36 clubes (múltiplo de 4, mínimo 16).';
    }
    return null;
  }

  function create({ name, format, teams, cfg, zones, template, crest }) {
    const err = validate(format, teams, cfg);
    if (err) throw new Error(err);
    const comp = { id: uid(), name, format, teams: teams.slice(), cfg: { ...cfg }, zones: zones || [], template: template || null, crest: crest || null, created: Date.now(), stages: [], champion: null };
    comp.stages.push(firstStage(comp));
    advance(comp);
    return comp;
  }

  function firstStage(comp) {
    const { format, teams, cfg } = comp;
    if (format === 'league') return { type: 'league', name: 'Pontos corridos', teams: teams.slice(), rounds: roundRobin(teams, cfg.legs) };
    if (format === 'groups') {
      const G = cfg.groups, sorted = byOvr(teams), size = teams.length / G;
      const groups = Array.from({ length: G }, (_, i) => ({ name: `Grupo ${GROUP_LETTERS[i]}`, teams: [] }));
      for (let p = 0; p < size; p++) {
        const pot = shuffle(sorted.slice(p * G, (p + 1) * G));
        pot.forEach((id, i) => groups[i].teams.push(id));
      }
      groups.forEach(g => g.rounds = roundRobin(g.teams, cfg.groupLegs));
      return { type: 'groups', name: 'Fase de grupos', groups };
    }
    if (format === 'knockout') {
      const seeds = cfg.seeding === 'ranking' ? byOvr(teams) : shuffle(teams);
      return { type: 'knockout', name: 'Mata-mata', rounds: [knockoutFromSeeds(seeds, cfg)] };
    }
    if (format === 'swiss') {
      const sorted = byOvr(teams);
      // gera várias tabelas válidas e fica com a de mando mais alternado
      let res = null, order = null, bestPen = Infinity;
      for (let t = 0; t < 120 && bestPen > 0; t++) {
        const g = swissGames(sorted);
        const r = matchdays(g.games, sorted, 8);
        if (!r) continue;
        if (!res) res = { pots: g.pots, rounds: r };
        for (let k = 0; k < 60; k++) {
          const cand = shuffle(r);
          const p = venuePenalty(cand, sorted);
          if (p < bestPen) { bestPen = p; order = cand; res = { pots: g.pots, rounds: r }; }
          if (p === 0) break;
        }
      }
      if (!res) { const g = swissGames(sorted); res = { pots: g.pots, rounds: assignRounds(g.games, 8) }; order = res.rounds; }
      const { pots } = res;
      const rounds = order.map(rd => shuffle(rd).map(([h, a]) => newMatch(h, a)));
      return { type: 'swiss', name: 'Fase de liga', teams: sorted, pots, rounds };
    }
  }

  const stageMatches = st => {
    if (!st) return [];
    if (st.type === 'league' || st.type === 'swiss' || st.type === 'rr') return st.rounds.flat();
    if (st.type === 'agg') return [];
    if (st.type === 'groups') return st.groups.flatMap(g => g.rounds.flat());
    if (st.type === 'knockout') return st.rounds.flatMap(r => r.ties.flatMap(t => t.m));
    return [];
  };
  const allMatches = comp => comp.stages.filter(Boolean).flatMap(stageMatches);

  function stageDone(st) {
    if (st.type === 'knockout') {
      const last = st.rounds[st.rounds.length - 1];
      return last.ties.length === 1 && !!last.ties[0].w;
    }
    return stageMatches(st).every(m => m.played);
  }

  function groupKnockout(comp, st) {
    const q = comp.cfg.qualify;
    const tables = st.groups.map(g => table(g.teams, g.rounds.flat()).map(r => r.id));
    const legs = comp.cfg.koLegs, G = tables.length;
    const ties = [];
    const isFinal = G * q === 2;
    const L = isFinal ? comp.cfg.finalLegs : legs;
    const mk = (first, second) => seededTie(first, second, L, isFinal && comp.cfg.finalLegs === 1);
    if (q === 2) {
      if (G === 1) ties.push(mk(tables[0][0], tables[0][1]));
      else {
        const top = [], bottom = [];
        for (let i = 0; i < G; i += 2) {
          top.push(mk(tables[i][0], tables[i + 1][1]));
          bottom.push(mk(tables[i + 1][0], tables[i][1]));
        }
        ties.push(...top, ...bottom);
      }
    } else {
      // 1 por grupo: campeões semeados por campanha
      const winners = tables.map(t => t[0]);
      const allRows = st.groups.flatMap(g => table(g.teams, g.rounds.flat()));
      const ranked = winners.slice().sort((x, y) => {
        const rx = allRows.find(r => r.id === x), ry = allRows.find(r => r.id === y);
        return ry.p - rx.p || ry.sg - rx.sg || ry.gp - rx.gp;
      });
      return { type: 'knockout', name: 'Mata-mata', rounds: [knockoutFromSeeds(ranked, { koLegs: legs, finalLegs: comp.cfg.finalLegs })] };
    }
    return { type: 'knockout', name: 'Mata-mata', rounds: [{ name: roundName(G * q), ties }] };
  }

  function swissKnockout(comp, st) {
    const ids = table(st.teams, st.rounds.flat()).map(r => r.id);
    const N = ids.length;
    const KO = N >= 24 ? 16 : 8;
    const direct = KO / 2;
    const playoffTeams = ids.slice(direct, direct + KO);
    const ties = [];
    for (let p = 0; p < direct; p++) ties.push(seededTie(playoffTeams[p], playoffTeams[KO - 1 - p], comp.cfg.koLegs));
    return { type: 'knockout', name: 'Mata-mata', directSeeds: ids.slice(0, direct), rounds: [{ name: 'Playoff', playoff: true, ties }] };
  }

  function nextRound(comp, st) {
    const last = st.rounds[st.rounds.length - 1];
    let pairs = [];
    if (last.playoff && st.directSeeds) {
      const D = st.directSeeds.length;
      // 1º enfrenta o vencedor do playoff 16º×17º, 2º o do 15º×18º...; chaveamento (1,8), (4,5), (2,7), (3,6)
      const raw = st.directSeeds.map((seed, i) => [seed, last.ties[D - 1 - i].w]);
      pairs = bracketOrder(D).map(s => raw[s - 1]);
    } else {
      for (let i = 0; i < last.ties.length; i += 2) {
        let x = last.ties[i].w, y = last.ties[i + 1].w;
        if (ovr(T(y)) > ovr(T(x))) [x, y] = [y, x];
        pairs.push([x, y]);
      }
    }
    const isFinal = pairs.length === 1;
    const legs = isFinal ? comp.cfg.finalLegs : comp.cfg.koLegs;
    const ties = pairs.map(([x, y]) => seededTie(x, y, legs, isFinal && comp.cfg.finalLegs === 1));
    st.rounds.push({ name: roundName(pairs.length * 2), ties });
  }

  // avança estrutura: cria próximas fases/rodadas quando a atual termina
  function advance(comp) {
    if (comp.reg) return Reg.advance(comp);
    for (let guard = 0; guard < 50; guard++) {
      const st = comp.stages[comp.stages.length - 1];
      if (st.type === 'knockout') {
        const last = st.rounds[st.rounds.length - 1];
        last.ties.forEach(updateTie);
        if (!last.ties.every(t => t.w)) return;
        if (last.ties.length === 1 && !last.playoff) { comp.champion = last.ties[0].w; return; }
        nextRound(comp, st);
        continue;
      }
      if (!stageDone(st)) return;
      if (st.type === 'league') { comp.champion = table(st.teams, st.rounds.flat())[0].id; return; }
      if (st.type === 'groups') { comp.stages.push(groupKnockout(comp, st)); continue; }
      if (st.type === 'swiss') { comp.stages.push(swissKnockout(comp, st)); continue; }
      return;
    }
  }

  const currentStage = comp => comp.reg ? Reg.currentStage(comp) : comp.stages[comp.stages.length - 1];

  // Simula a próxima "rodada" (data) da competição. Retorna descrição do que foi jogado.
  function step(comp) {
    if (comp.reg) return Reg.step(comp);
    if (comp.champion) return null;
    const st = currentStage(comp);
    let label = '';
    if (st.type === 'league' || st.type === 'swiss') {
      const i = st.rounds.findIndex(r => r.some(m => !m.played));
      if (i < 0) { advance(comp); return null; }
      st.rounds[i].forEach(m => { if (!m.played) playMatch(m); });
      label = `${st.type === 'swiss' ? 'Rodada' : 'Rodada'} ${i + 1}`;
    } else if (st.type === 'groups') {
      const R = Math.max(...st.groups.map(g => g.rounds.length));
      let i = -1;
      for (let r = 0; r < R && i < 0; r++) if (st.groups.some(g => g.rounds[r] && g.rounds[r].some(m => !m.played))) i = r;
      if (i < 0) { advance(comp); return null; }
      st.groups.forEach(g => (g.rounds[i] || []).forEach(m => { if (!m.played) playMatch(m); }));
      label = `${i + 1}ª rodada da fase de grupos`;
    } else if (st.type === 'knockout') {
      const rd = st.rounds[st.rounds.length - 1];
      const pending = rd.ties.filter(t => !t.w);
      // confrontos com todos os jogos preenchidos, mas empatados sem pênaltis: decide nos pênaltis
      pending.filter(t => t.m.every(m => m.played)).forEach(t => {
        const last = t.m[t.m.length - 1];
        last.pen = shootout(T(last.h), T(last.a));
        updateTie(t);
      });
      const open = pending.filter(t => !t.w && t.m.some(m => !m.played));
      const legs = open.map(t => t.m.findIndex(m => !m.played));
      const leg = legs.length ? Math.min(...legs) : 0;
      open.forEach(t => playTieLeg(t, leg));
      label = rd.ties.some(t => t.legs === 2) ? `${rd.name} · ${leg === 0 ? 'ida' : 'volta'}` : rd.name;
    }
    advance(comp);
    return label;
  }

  function simulateAll(comp) {
    if (comp.reg) return Reg.simulateAll(comp);
    for (let g = 0; g < 500 && !comp.champion; g++) if (step(comp) === null && !comp.champion) break;
  }

  // simula um jogo específico (se for permitido agora)
  function playOne(comp, matchId) {
    if (comp.reg) return Reg.playOne(comp, matchId);
    const L = locate(comp, matchId);
    if (L && L.m.played) return false;
    if (L && (L.si < comp.stages.length - 1 || (L.tie && L.ri < L.st.rounds.length - 1))) return false;
    const st = currentStage(comp);
    if (st.type === 'knockout') {
      for (const rd of st.rounds) for (const t of rd.ties) {
        const idx = t.m.findIndex(m => m.id === matchId);
        if (idx >= 0) { playTieLeg(t, idx); advance(comp); return true; }
      }
      return false;
    }
    const m = stageMatches(st).find(x => x.id === matchId);
    if (!m || m.played) return false;
    playMatch(m);
    advance(comp);
    return true;
  }

  /* ---------- Resultados preenchidos à mão ---------- */
  function locate(comp, id) {
    for (let si = 0; si < comp.stages.length; si++) {
      const st = comp.stages[si];
      if (!st) continue;
      if (st.type === 'knockout') {
        for (let ri = 0; ri < st.rounds.length; ri++) for (const tie of st.rounds[ri].ties) {
          const leg = tie.m.findIndex(m => m.id === id);
          if (leg >= 0) return { si, ri, tie, leg, m: tie.m[leg], st };
        }
      } else {
        const m = stageMatches(st).find(x => x.id === id);
        if (m) return { si, m, st };
      }
    }
    return null;
  }

  // quantos jogos já disputados seriam descartados se este resultado mudar
  function wouldDiscard(comp, id) {
    if (comp.reg) return Reg.wouldDiscard(comp, id);
    const L = locate(comp, id);
    if (!L) return 0;
    let n = 0;
    comp.stages.forEach((st, si) => {
      if (si > L.si) n += stageMatches(st).filter(m => m.played).length;
    });
    if (L.st.type === 'knockout') L.st.rounds.forEach((rd, ri) => {
      if (ri > L.ri) n += rd.ties.flatMap(t => t.m).filter(m => m.played).length;
    });
    return n;
  }

  function invalidateAfter(comp, L) {
    if (comp.reg) return Reg.invalidate(comp, L);
    comp.champion = null;
    comp.stages = comp.stages.slice(0, L.si + 1);
    if (L.st.type === 'knockout') {
      L.st.rounds = L.st.rounds.slice(0, L.ri + 1);
      if (!L.tie.bye) L.tie.w = null;
    }
  }

  // o jogo pode receber resultado agora? (volta só depois da ida)
  function canEdit(comp, id) {
    const L = locate(comp, id);
    if (!L) return false;
    if (L.tie && L.tie.bo3) return L.leg === 0 || L.tie.m.slice(0, L.leg).every(m => m.played);
    if (L.tie && L.leg === 1 && !L.tie.m[0].played) return false;
    return true;
  }

  // precisa de pênaltis? (jogo decisivo de mata-mata empatado no placar/agregado)
  function needsPens(L, hg, ag) {
    if (!L.tie) return false;
    if (L.tie.bo3) return hg === ag;
    if (L.tie.rule && !L.tie.rule.pens) return false;
    if (L.leg !== L.tie.m.length - 1) return false;
    if (L.tie.m.length === 1) return hg === ag;
    const l1 = L.tie.m[0];
    return (hg + l1.ag) === (ag + l1.hg);
  }

  function setResult(comp, id, hg, ag, pen) {
    const L = locate(comp, id);
    if (!L || !canEdit(comp, id)) return false;
    invalidateAfter(comp, L);
    const m = L.m;
    resetMatch(m);
    Object.assign(m, { played: true, manual: true, hg, ag, et: null, pen: null, ev: [], st: null });
    if (needsPens(L, hg, ag) && pen && pen[0] !== pen[1]) m.pen = { h: pen[0], a: pen[1], kh: null, ka: null };
    if (L.tie && L.tie.bo3) restoreBo3(L.tie);
    // ida alterada com a volta já jogada: recalcula a situação da volta
    if (L.tie && !L.tie.bo3 && L.leg === 0 && L.tie.m[1] && L.tie.m[1].played) {
      const l2 = L.tie.m[1];
      const L2 = { ...L, leg: 1, m: l2 };
      if (!needsPens(L2, l2.hg, l2.ag)) l2.pen = null;
    }
    if (L.tie) updateTie(L.tie);
    advance(comp);
    return true;
  }

  function clearResult(comp, id) {
    const L = locate(comp, id);
    if (!L) return false;
    invalidateAfter(comp, L);
    resetMatch(L.m);
    delete L.m.manual;
    // apagar a ida apaga também a volta
    if (L.tie && L.tie.bo3) { L.tie.m.slice(L.leg + 1).forEach(resetMatch); restoreBo3(L.tie); }
    else if (L.tie && L.leg === 0 && L.tie.m[1]) { resetMatch(L.tie.m[1]); delete L.tie.m[1].manual; }
    advance(comp);
    return true;
  }

  function clearResults(comp) {
    if (comp.reg) return Reg.clearResults(comp);
    comp.stages = [comp.stages[0]];
    comp.champion = null;
    const st = comp.stages[0];
    if (st.type === 'knockout') {
      st.rounds = [st.rounds[0]];
      st.rounds[0].ties.forEach(t => { t.m.forEach(resetMatch); if (!t.bye) t.w = null; });
    } else stageMatches(st).forEach(resetMatch);
    advance(comp);
  }

  function redraw(comp) {
    if (comp.reg) return Reg.redraw(comp);
    const fresh = create({ name: comp.name, format: comp.format, teams: comp.teams, cfg: comp.cfg, zones: comp.zones, template: comp.template, crest: comp.crest });
    Object.assign(comp, { stages: fresh.stages, champion: null });
  }

  function progress(comp) {
    if (comp.reg) return Reg.progress(comp);
    if (comp.champion) return 1;
    const ms = allMatches(comp);
    const played = ms.filter(m => m.played).length;
    // estimativa: em mata-mata ainda faltam rodadas não criadas
    let est = ms.length;
    if (comp.format === 'knockout' || comp.format === 'groups' || comp.format === 'swiss') {
      const st = currentStage(comp);
      if (st.type !== 'knockout') est += comp.format === 'swiss' ? 30 : 14;
      else est += 2;
    }
    return Math.min(0.99, played / Math.max(1, est));
  }

  // Monte Carlo para partida avulsa
  function monteCarlo(hId, aId, opts, n = 1000) {
    const scores = {};
    let w = 0, d = 0, l = 0, gh = 0, ga = 0, adv = [0, 0];
    for (let i = 0; i < n; i++) {
      if (opts.legs === 2) {
        const tie = newTie(hId, aId, 2);
        playTieLeg(tie, 0); playTieLeg(tie, 1);
        adv[tie.w === hId ? 0 : 1]++;
        const [x, y] = tieAggregate(tie);
        gh += x; ga += y;
        const key = `${x}-${y}`; scores[key] = (scores[key] || 0) + 1;
        if (x > y) w++; else if (x === y) d++; else l++;
      } else {
        const m = playMatch(newMatch(hId, aId), { neutral: opts.neutral, decider: opts.decider });
        gh += m.hg; ga += m.ag;
        const key = `${m.hg}-${m.ag}`; scores[key] = (scores[key] || 0) + 1;
        if (m.hg > m.ag) w++; else if (m.hg === m.ag) d++; else l++;
        const wn = matchWinner(m);
        if (wn) adv[wn === hId ? 0 : 1]++;
      }
    }
    const top = Object.entries(scores).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ score: k, p: v / n }));
    return { n, w: w / n, d: d / n, l: l / n, gh: gh / n, ga: ga / n, top, adv: [adv[0] / n, adv[1] / n] };
  }

  return {
    finished: comp => comp.reg ? Reg.finished(comp) : !!comp.champion,
    T, roundRobin, matchdays, venuePenalty, swissGames, assignRounds, bracketOrder, roundName, shootout, updateTie, restoreBo3, nextPow2,
    setFast(v) { fast = !!v; },
    configure(o) { if (o.getTeam) getTeam = o.getTeam; if (o.settings) settings = o.settings; },
    ovr, uid, shuffle, probabilities, playMatch, newMatch, newTie, playTieLeg, tieAggregate, matchWinner,
    table, create, validate, step, simulateAll, playOne, clearResults, redraw, progress, monteCarlo,
    stageMatches, allMatches, currentStage, isPow2, maxRun, locate, wouldDiscard, canEdit, needsPens, setResult, clearResult
  };
})();
