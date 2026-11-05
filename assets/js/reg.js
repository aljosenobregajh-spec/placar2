/* Placar — competições com regulamento oficial (fases encadeadas)
   Cada modelo descreve fases em JSON (ver templates.js):
   - rr   : pontos corridos (1 ou vários grupos/zonas/conferências), com turnos, jogos interzonais,
            liga suíça (8 ou 6 jogos), espelho de outra fase (Clausura) e pontos herdados (split).
   - agg  : tabela acumulada de várias fases (ex.: tabela anual).
   - ko   : mata-mata com regras próprias (ida e volta, sem prorrogação, melhor campanha avança,
            melhor de 3, final única em campo neutro, rechaveamento...). */

const Reg = (() => {
  const E = Engine;
  const rand = Math.random;
  const shuffle = a => E.shuffle(a);
  const uid = () => E.uid();
  const T = id => E.T(id);
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ================= Classificação ================= */
  function blankRow(id) { return { id, p: 0, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, ag: 0, aw: 0, form: [] }; }
  function addMatch(rows, m) {
    const H = rows[m.h], A = rows[m.a];
    const res = m.hg > m.ag ? 'H' : m.hg < m.ag ? 'A' : 'D';
    if (H) {
      H.j++; H.gp += m.hg; H.gc += m.ag;
      if (res === 'H') { H.v++; H.p += 3; H.form.push('V'); } else if (res === 'A') { H.d++; H.form.push('D'); } else { H.e++; H.p++; H.form.push('E'); }
    }
    if (A) {
      A.j++; A.gp += m.ag; A.gc += m.hg; A.ag += m.ag;
      if (res === 'A') { A.v++; A.aw++; A.p += 3; A.form.push('V'); } else if (res === 'H') { A.d++; A.form.push('D'); } else { A.e++; A.p++; A.form.push('E'); }
    }
  }
  function computeRows(ids, matches, carry) {
    const rows = {};
    ids.forEach(id => {
      rows[id] = blankRow(id);
      const c = carry && carry[id];
      if (c) Object.assign(rows[id], { p: c.p, j: c.j, v: c.v, e: c.e, d: c.d, gp: c.gp, gc: c.gc, ag: c.ag, aw: c.aw, form: c.form.slice() });
    });
    matches.filter(m => m.played).forEach(m => addMatch(rows, m));
    Object.values(rows).forEach(r => { r.sg = r.gp - r.gc; });
    return rows;
  }
  const VAL = { pts: r => r.p, w: r => r.v, gd: r => r.sg, gf: r => r.gp, ag: r => r.ag, aw: r => r.aw };
  function rankList(list, crit, matches) {
    if (list.length < 2) return list;
    if (!crit.length) return list.slice().sort((x, y) => T(x.id).name.localeCompare(T(y.id).name));
    const [c, ...rest] = crit;
    let key;
    if (c === 'h2h') {
      const ids = new Set(list.map(r => r.id));
      const mini = computeRows([...ids], matches.filter(m => ids.has(m.h) && ids.has(m.a)));
      key = r => [mini[r.id].p, mini[r.id].sg, mini[r.id].gp];
    } else key = r => [VAL[c](r)];
    const keyed = list.map(r => ({ r, k: key(r) }));
    keyed.sort((x, y) => { for (let i = 0; i < x.k.length; i++) if (y.k[i] !== x.k[i]) return y.k[i] - x.k[i]; return 0; });
    const out = [];
    for (let i = 0; i < keyed.length;) {
      let j = i;
      while (j < keyed.length && keyed[j].k.every((v, t) => v === keyed[i].k[t])) j++;
      out.push(...rankList(keyed.slice(i, j).map(x => x.r), rest, matches));
      i = j;
    }
    return out;
  }
  const DEFAULT_TB = ['pts', 'w', 'gd', 'gf'];

  // todas as partidas de um estágio (para mini-tabelas e acumuladas)
  const matchesOf = st => E.stageMatches(st);

  // tabela de um grupo de um estágio rr/agg
  function rank(comp, i, g = 0, upTo = null) {
    const st = comp.stages[i];
    if (!st) return [];
    const spec = comp.spec[i];
    const tb = spec.tiebreak || DEFAULT_TB;
    if (st.type === 'agg') {
      const ms = st.sources.flatMap(k => comp.stages[k] ? matchesOf(comp.stages[k]) : []);
      const rows = computeRows(st.teams, ms);
      return rankList(Object.values(rows), tb, ms).map(r => ({ ...r, form: r.form.slice(-5) }));
    }
    if (st.type !== 'rr') return [];
    const grp = st.groups[g];
    const ms = upTo == null ? matchesOf(st) : st.rounds.slice(0, upTo + 1).flat();
    let carry = null;
    if (st.carry) {
      const f = st.carry.factors ? st.carry.factors[g] : (st.carry.factor ?? 1);
      const src = st.carry.rows || {};
      carry = {};
      grp.teams.forEach(id => {
        const c = src[id];
        if (!c) return;
        carry[id] = f === 1 ? c : { ...blankRow(id), p: Math.ceil(c.p * f) };
      });
    }
    const rows = computeRows(grp.teams, ms, carry);
    return rankList(Object.values(rows), tb, ms).map(r => ({ ...r, form: r.form.slice(-5) }));
  }

  /* ================= Fontes de clubes ================= */
  function stageDone(comp, i) {
    const st = comp.stages[i];
    if (!st) return false;
    if (st.type === 'agg') return st.sources.every(k => stageDone(comp, k));
    if (st.type === 'rr') return matchesOf(st).every(m => m.played);
    if (st.type === 'knockout') {
      if (st.auto) return true;
      const last = st.rounds[st.rounds.length - 1];
      if (!last || !last.ties.every(t => t.w)) return false;
      const spec = comp.spec[i];
      if (spec.maxRounds && st.rounds.length >= spec.maxRounds) return true;
      return last.ties.length === 1 && !last.playoff;
    }
    return false;
  }
  function roundDone(comp, i, r) {
    const st = comp.stages[i];
    if (!st || st.type !== 'knockout') return false;
    const rd = st.rounds[r];
    return !!rd && rd.ties.every(t => t.w);
  }
  function depReady(comp, d) {
    if (typeof d === 'number') return stageDone(comp, d);
    return roundDone(comp, d.phase, d.round);
  }

  function koWinner(st) {
    if (!st) return null;
    if (st.auto) return st.winner;
    const last = st.rounds[st.rounds.length - 1];
    return last && last.ties.length === 1 ? last.ties[0].w : null;
  }
  function campaignRows(comp, phases) {
    const ms = phases.flatMap(k => comp.stages[k] ? matchesOf(comp.stages[k]) : []);
    const ids = [...new Set(ms.flatMap(m => [m.h, m.a]))];
    const rows = computeRows(ids, ms);
    return rankList(Object.values(rows), ['pts', 'w', 'gd', 'gf'], ms);
  }
  function sortIds(comp, ids, by) {
    if (!by) return ids;
    let order;
    if (by.campaign) order = campaignRows(comp, by.campaign).map(r => r.id);
    else if (by.phase != null) {
      const st = comp.stages[by.phase];
      order = st.type === 'agg' || st.groups.length === 1 ? rank(comp, by.phase, by.group || 0).map(r => r.id) : rankedPerGroup(comp, by.phase, 1, 99);
    }
    const pos = id => { const k = order.indexOf(id); return k < 0 ? 999 : k; };
    return ids.slice().sort((x, y) => pos(x) - pos(y));
  }
  // 1ºs de todos os grupos (ordenados por campanha), depois 2ºs, ...
  function rankedPerGroup(comp, i, a, b) {
    const st = comp.stages[i];
    const out = [];
    for (let p = a; p <= b; p++) {
      const level = st.groups.map((g, gi) => rank(comp, i, gi)[p - 1]).filter(Boolean);
      level.sort((x, y) => y.p - x.p || y.sg - x.sg || y.gp - x.gp || y.v - x.v);
      out.push(...level.map(r => r.id));
    }
    return out;
  }

  function resolve(comp, src) {
    if (!src) return [];
    let ids = [];
    if (src.entry) ids = (comp.entries[src.entry] || []).slice();
    else if (src.list) ids = src.list.flatMap(s => resolve(comp, s));
    else if (src.uniqueFill) {
      const seen = new Set();
      src.uniqueFill.forEach(s => resolve(comp, s).forEach(id => { if (!seen.has(id)) { seen.add(id); ids.push(id); } }));
      resolve(comp, src.from).forEach(id => { if (ids.length < src.count && !seen.has(id)) { seen.add(id); ids.push(id); } });
    } else if (src.phase != null) {
      const st = comp.stages[src.phase];
      if (!st) return [];
      if (src.pos) ids = rank(comp, src.phase, src.group || 0).slice(src.pos[0] - 1, src.pos[1]).map(r => r.id);
      else if (src.perGroup) ids = rankedPerGroup(comp, src.phase, src.perGroup[0], src.perGroup[1]);
      else if (src.winner) ids = [koWinner(st)].filter(Boolean);
      else if (src.runnerUp) {
        const last = st.rounds[st.rounds.length - 1];
        const t = last && last.ties[0];
        ids = t && t.w ? [t.w === t.a ? t.b : t.a] : [];
      } else if (src.winners) {
        if (st.auto) ids = [st.winner];
        else ids = st.rounds[st.rounds.length - 1].ties.map(t => t.w).filter(Boolean);
      } else if (src.roundLosers != null) {
        const rd = st.rounds[src.roundLosers];
        ids = rd ? rd.ties.filter(t => t.w && !t.bye).map(t => (t.w === t.a ? t.b : t.a)) : [];
      } else if (src.roundParticipants != null) {
        const rd = st.rounds[src.roundParticipants];
        ids = rd ? rd.ties.flatMap(t => [t.a, t.b]).filter(Boolean) : [];
      } else if (src.roundWinners != null) {
        const rd = st.rounds[src.roundWinners];
        ids = rd ? rd.ties.map(t => t.w).filter(Boolean) : [];
      }
    }
    if (src.sortBy) ids = sortIds(comp, ids, src.sortBy);
    return ids;
  }

  /* ================= Construção das fases ================= */
  function buildRR(comp, i) {
    const spec = comp.spec[i];
    const st = { type: 'rr', name: spec.name, groups: [], rounds: [] };
    let entr = resolve(comp, spec.teams);
    const G = spec.groups;
    if (!G) st.groups = [{ name: spec.groupName || spec.name, teams: entr }];
    else if (G.method === 'roles') st.groups = G.roles.map((role, k) => ({ name: (G.names || [])[k] || role, teams: (comp.entries[role] || []).slice() }));
    else if (G.method === 'pattern') st.groups = G.pattern.map((idx, k) => ({ name: (G.names || [])[k] || `Grupo ${'ABCDEFGHIJKLMNOP'[k]}`, teams: idx.map(x => entr[x]).filter(Boolean) }));
    else {
      // potes pela ordem de entrada (ranking/colocação); cada grupo recebe um clube de cada pote
      const n = G.count;
      if (G.byRating) entr = entr.slice().sort((x, y) => E.ovr(T(y)) - E.ovr(T(x)));
      const groups = Array.from({ length: n }, (_, k) => ({ name: (G.names || [])[k] || `Grupo ${'ABCDEFGHIJKLMNOP'[k]}`, teams: [] }));
      for (let p = 0; p * n < entr.length; p++) {
        let pot = entr.slice(p * n, (p + 1) * n);
        if (!(p === 0 && G.fixedFirst)) pot = shuffle(pot);
        pot.forEach((id, k) => groups[k].teams.push(id));
      }
      st.groups = groups;
    }

    if (spec.mirror != null) {
      const src = comp.stages[spec.mirror];
      st.rounds = src.rounds.map(rd => rd.map(m => E.newMatch(m.a, m.h)));
    } else if (spec.swiss) {
      st.rounds = swissRounds(st.groups[0].teams.slice().sort((x, y) => E.ovr(T(y)) - E.ovr(T(x))), spec.swiss);
    } else if (spec.cross) {
      st.rounds = crossRounds(st.groups);
    } else {
      const per = st.groups.map((g, gi) => {
        const legs = spec.legsEach ? spec.legsEach[gi] : spec.legs;
        let rds = E.roundRobin(g.teams, legs >= 2 ? 2 : 1);
        if (legs === 3) rds = rds.concat(E.roundRobin(g.teams, 1));
        if (legs === 4) rds = rds.concat(E.roundRobin(g.teams, 2));
        return rds;
      });
      const R = Math.max(...per.map(x => x.length));
      for (let r = 0; r < R; r++) st.rounds.push(per.flatMap(x => x[r] || []));
      if (spec.inter && st.groups.length === 2) {
        const inter = interRounds(st.groups[0].teams, st.groups[1].teams, spec.inter);
        // espalha as rodadas interzonais ao longo da fase
        inter.forEach((rd, k) => {
          const at = Math.round(((k + 1) * st.rounds.length) / (inter.length + 1)) + k;
          st.rounds.splice(at, 0, rd);
        });
      }
    }
    if (spec.carry) {
      const rowsArr = rank(comp, spec.carry.phase, 0);
      const all = {};
      const src = comp.stages[spec.carry.phase];
      src.groups.forEach((g, gi) => rank(comp, spec.carry.phase, gi).forEach(r => { all[r.id] = r; }));
      st.carry = { factors: spec.carry.factors, factor: spec.carry.factor, rows: all };
      void rowsArr;
    }
    return st;
  }
  // só jogos contra o grupo parceiro (A×B, C×D...), turno único; o grupo da esquerda tem o mando extra quando o número é ímpar
  function crossRounds(groups) {
    const out = [];
    for (let g = 0; g + 1 < groups.length; g += 2) {
      const X = groups[g].teams, Y = shuffle(groups[g + 1].teams), n = Math.min(X.length, Y.length);
      const h = Math.ceil(n / 2);
      const home = Array.from({ length: h }, (_, k) => k), away = Array.from({ length: n - h }, (_, k) => h + k);
      const order = [];
      for (let k = 0; k < n; k++) { const src = k % 2 === 0 ? home : away; if (src.length) order.push(src.shift()); else order.push((home.length ? home : away).shift()); }
      order.forEach((d, r) => {
        const rd = X.slice(0, n).map((x, k) => { const y = Y[(k + d) % n]; return d < h ? E.newMatch(x, y) : E.newMatch(y, x); });
        out[r] = (out[r] || []).concat(rd);
      });
    }
    return out;
  }
  function interRounds(A, B, n) {
    const P = shuffle(B);
    const out = [];
    const L = Math.min(A.length, P.length);
    for (let r = 0; r < n; r++) {
      const rd = [];
      for (let k = 0; k < L; k++) {
        const x = A[k], y = P[(k + r) % L];
        rd.push((k + r) % 2 === 0 ? E.newMatch(x, y) : E.newMatch(y, x));
      }
      out.push(rd);
    }
    return out;
  }

  // liga suíça: 8 jogos (4 potes) ou 6 jogos (6 potes, um adversário de cada pote, inclusive o próprio)
  function swissRounds(sorted, games) {
    if (games === 8) {
      let best = null, bestPen = Infinity;
      for (let t = 0; t < 120 && bestPen > 0; t++) {
        const g = E.swissGames(sorted);
        const r = E.matchdays(g.games, sorted, 8);
        if (!r) continue;
        for (let k = 0; k < 40; k++) {
          const cand = shuffle(r);
          const p = E.venuePenalty(cand, sorted);
          if (p < bestPen) { bestPen = p; best = cand; }
          if (p === 0) break;
        }
      }
      if (!best) best = E.assignRounds(E.swissGames(sorted).games, 8);
      return best.map(rd => shuffle(rd).map(([h, a]) => E.newMatch(h, a)));
    }
    const P = 6, n = sorted.length / P;
    const pots = Array.from({ length: P }, (_, p) => sorted.slice(p * n, (p + 1) * n));
    let best = null, bestPen = Infinity;
    for (let t = 0; t < 150 && bestPen > 0; t++) {
      const edges = [];
      pots.forEach(pot => { const q = shuffle(pot); for (let k = 0; k + 1 < q.length; k += 2) edges.push([q[k], q[k + 1]]); });
      for (let a = 0; a < P; a++) for (let b = a + 1; b < P; b++) {
        const Q = shuffle(pots[b]);
        pots[a].forEach((id, k) => edges.push([id, Q[k]]));
      }
      const oriented = eulerOrient(edges, sorted);
      const r = E.matchdays(oriented, sorted, games);
      if (!r) continue;
      for (let k = 0; k < 40; k++) {
        const cand = shuffle(r);
        const p = E.venuePenalty(cand, sorted);
        if (p < bestPen) { bestPen = p; best = cand; }
        if (p === 0) break;
      }
    }
    if (!best) return [];
    return best.map(rd => shuffle(rd).map(([h, a]) => E.newMatch(h, a)));
  }
  // orienta arestas para que cada clube tenha metade dos jogos em casa (circuito euleriano)
  function eulerOrient(edges, ids) {
    const adj = {}; ids.forEach(id => adj[id] = []);
    edges.forEach((e, k) => { adj[e[0]].push(k); adj[e[1]].push(k); });
    const used = new Array(edges.length).fill(false), out = [];
    ids.forEach(start => {
      const stack = [start];
      while (stack.length) {
        const v = stack[stack.length - 1];
        while (adj[v].length && used[adj[v][adj[v].length - 1]]) adj[v].pop();
        if (!adj[v].length) { stack.pop(); continue; }
        const k = adj[v].pop(); used[k] = true;
        const [x, y] = edges[k];
        const w = x === v ? y : x;
        out.push([v, w]);
        stack.push(w);
      }
    });
    return out;
  }

  // ---- mata-mata ----
  function roundCfg(spec, roundIdx, isFinal) {
    const base = { legs: spec.legs ?? 2, et: spec.et ?? true, pens: spec.pens ?? true, better: !!spec.better, neutral: !!spec.neutral, bo3: false };
    const per = spec.roundsCfg && spec.roundsCfg[roundIdx];
    const fin = isFinal && spec.final;
    return { ...base, ...(per || {}), ...(fin || {}) };
  }
  function mkTie(x, y, cfg, seedOf) {
    if (y == null) return E.newTie(x, null, 1);
    const [better, worse] = seedOf(x) <= seedOf(y) ? [x, y] : [y, x];
    const rule = { et: cfg.et, pens: cfg.pens, better: cfg.better ? better : null, bo3: cfg.bo3 };
    if (cfg.bo3) return E.newTie(better, worse, 3, false, rule);
    if (cfg.legs === 2) return E.newTie(worse, better, 2, false, rule);
    return E.newTie(better, worse, 1, cfg.neutral, rule);
  }
  function seedFn(comp, spec, entrants) {
    if (spec.seedBy) {
      const order = sortIds(comp, entrants.slice(), spec.seedBy);
      return id => { const k = order.indexOf(id); return k < 0 ? 999 : k; };
    }
    return id => { const k = entrants.indexOf(id); return k < 0 ? 999 : k; };
  }
  function roundLabel(spec, nTeams, roundIdx) {
    if (spec.roundNames && spec.roundNames[roundIdx]) return spec.roundNames[roundIdx];
    return E.roundName(nTeams);
  }
  function buildKO(comp, i) {
    const spec = comp.spec[i];
    if (spec.autoIfSame) {
      const [a, b] = spec.autoIfSame.map(s => resolve(comp, s)[0]);
      if (a && a === b) return { type: 'knockout', name: spec.name, auto: true, winner: a, rounds: [] };
    }
    let entr;
    if (spec.pairing === 'crossGroups') {
      const src = comp.stages[spec.teams.phase];
      const k = spec.teams.groupTop;
      const tables = src.groups.map((g, gi) => rank(comp, spec.teams.phase, gi).slice(0, k).map(r => r.id));
      entr = tables.flat();
      const seedOf = seedFn(comp, spec, rankedPerGroup(comp, spec.teams.phase, 1, k));
      const cfg = roundCfg(spec, 0, false);
      const top = [], bottom = [];
      const order = E.bracketOrder(k / 2 || 1);
      for (let g = 0; g < tables.length; g += 2) {
        const X = tables[g], Y = tables[g + 1];
        const sideX = [], sideY = [];
        for (let p = 0; p < k / 2; p++) { sideX.push([X[p], Y[k - 1 - p]]); sideY.push([Y[p], X[k - 1 - p]]); }
        const ord = arr => (k / 2 > 1 ? order.map(s => arr[s - 1]) : arr);
        top.push(...ord(sideX)); bottom.push(...ord(sideY));
      }
      const pairs = [...top, ...bottom];
      const ties = pairs.map(([x, y]) => mkTie(x, y, cfg, seedOf));
      return { type: 'knockout', name: spec.name, entrants: rankedPerGroup(comp, spec.teams.phase, 1, k), rounds: [{ name: roundLabel(spec, pairs.length * 2, 0), ties }] };
    }
    entr = resolve(comp, spec.teams);
    const seedOf = seedFn(comp, spec, entr);
    const st = { type: 'knockout', name: spec.name, entrants: entr, rounds: [] };
    let pairs = [];
    const N = entr.length;
    if (spec.pairing === 'pairs') pairs = spec.pairs.map(([x, y]) => [entr[x], entr[y]]);
    else if (spec.pairing === 'wr') {
      // vencedores x segundos colocados por sorteio; chave seguinte pela ordem dos vencedores
      const h = N / 2, W = entr.slice(0, h), Rr = shuffle(entr.slice(h));
      const raw = W.map((w, k) => [w, Rr[k]]);
      pairs = E.bracketOrder(h).map(s => raw[s - 1]);
    } else if (spec.pairing === 'halves') {
      const h = N / 2, A = entr.slice(0, h), B = shuffle(entr.slice(h));
      pairs = A.map((x, k) => [x, B[k]]);
    } else if (spec.pairing === 'uefa') {
      const KO = N >= 24 ? 16 : 8, direct = KO / 2;
      st.directSeeds = entr.slice(0, direct);
      const po = entr.slice(direct, direct + KO);
      for (let p = 0; p < direct; p++) pairs.push([po[p], po[KO - 1 - p]]);
      const cfg = roundCfg(spec, 0, false);
      st.rounds.push({ name: 'Playoff', playoff: true, ties: pairs.map(([x, y]) => mkTie(x, y, cfg, seedOf)) });
      return st;
    } else {
      const P = E.nextPow2(N), order = E.bracketOrder(P);
      const slots = order.map(s => entr[s - 1] ?? null);
      for (let k = 0; k < P; k += 2) pairs.push([slots[k], slots[k + 1]]);
    }
    const isFinal = pairs.length === 1;
    const cfg = roundCfg(spec, 0, isFinal);
    st.rounds.push({ name: roundLabel(spec, pairs.length * 2, 0), ties: pairs.map(([x, y]) => mkTie(x, y, cfg, seedOf)) });
    return st;
  }
  function nextKORound(comp, i) {
    const spec = comp.spec[i], st = comp.stages[i];
    const last = st.rounds[st.rounds.length - 1];
    const r = st.rounds.length;
    const seedOf = spec.seedBy ? seedFn(comp, spec, st.entrants || []) : seedFn(comp, spec, st.entrants || []);
    let pairs = [];
    if (last.playoff && st.directSeeds) {
      const D = st.directSeeds.length;
      const raw = st.directSeeds.map((seed, k) => [seed, last.ties[D - 1 - k].w]);
      pairs = E.bracketOrder(D).map(s => raw[s - 1]);
    } else {
      let winners = last.ties.map(t => t.w);
      const reseed = spec.reseed || (spec.reseedAt != null && r === spec.reseedAt);
      if (reseed) {
        winners = winners.slice().sort((x, y) => seedOf(x) - seedOf(y));
        if (spec.reseedAt != null && r === spec.reseedAt) {
          const order = E.bracketOrder(winners.length);
          const slots = order.map(s => winners[s - 1]);
          for (let k = 0; k < slots.length; k += 2) pairs.push([slots[k], slots[k + 1]]);
        } else for (let k = 0; k < winners.length / 2; k++) pairs.push([winners[k], winners[winners.length - 1 - k]]);
      } else for (let k = 0; k < winners.length; k += 2) pairs.push([winners[k], winners[k + 1]]);
    }
    const isFinal = pairs.length === 1;
    const cfg = roundCfg(spec, r, isFinal);
    st.rounds.push({ name: roundLabel(spec, pairs.length * 2, r), ties: pairs.map(([x, y]) => mkTie(x, y, cfg, seedOf)) });
  }

  function build(comp, i) {
    const spec = comp.spec[i];
    if (spec.type === 'rr') return buildRR(comp, i);
    if (spec.type === 'agg') return { type: 'agg', name: spec.name, sources: spec.sources, teams: spec.teams ? resolve(comp, spec.teams) : [...new Set(spec.sources.flatMap(k => comp.stages[k].groups ? comp.stages[k].groups.flatMap(g => g.teams) : []))] };
    if (spec.type === 'ko') return buildKO(comp, i);
  }

  /* ================= Ciclo de vida ================= */
  function advance(comp) {
    for (let guard = 0; guard < 200; guard++) {
      let changed = false;
      comp.spec.forEach((spec, i) => {
        const st = comp.stages[i];
        if (!st) {
          if ((spec.after || []).every(d => depReady(comp, d))) {
            if (spec.confirm && !(comp.confirmed || {})[i]) return;   // aguardando o usuário confirmar os clubes
            comp.stages[i] = build(comp, i); changed = true;
          }
          return;
        }
        if (st.type === 'knockout' && !st.auto) {
          const last = st.rounds[st.rounds.length - 1];
          last.ties.forEach(E.updateTie);
          if (last.ties.every(t => t.w) && !stageDone(comp, i)) { nextKORound(comp, i); changed = true; }
        }
      });
      if (!changed) break;
    }
    const ch = comp.champSpec;
    if (ch && stageDone(comp, ch.phase)) {
      const st = comp.stages[ch.phase];
      comp.champion = st.type === 'knockout' ? koWinner(st) : (rank(comp, ch.phase, ch.group || 0)[0] || {}).id || null;
    } else comp.champion = null;
  }

  function create(tpl, entries, name) {
    const comp = {
      id: uid(), name: name || tpl.name, reg: true, template: tpl.id, format: tpl.icon || 'league', crest: tpl.crest || null,
      created: Date.now(), spec: clone(tpl.phases), champSpec: clone(tpl.champion || { phase: 0 }), entries: clone(entries),
      stages: tpl.phases.map(() => null), champion: null
    };
    advance(comp);
    return comp;
  }

  // dependências transitivas
  function dependents(comp, si) {
    const out = new Set();
    let grew = true;
    while (grew) {
      grew = false;
      comp.spec.forEach((spec, j) => {
        if (out.has(j) || j === si) return;
        const deps = (spec.after || []).map(d => (typeof d === 'number' ? d : d.phase));
        if (spec.mirror != null) deps.push(spec.mirror);
        if (deps.some(d => d === si || out.has(d))) { out.add(j); grew = true; }
      });
    }
    return out;
  }
  function wouldDiscard(comp, id) {
    const L = E.locate(comp, id);
    if (!L) return 0;
    let n = 0;
    dependents(comp, L.si).forEach(j => { if (comp.stages[j]) n += matchesOf(comp.stages[j]).filter(m => m.played).length; });
    if (L.st.type === 'knockout') L.st.rounds.forEach((rd, ri) => { if (ri > L.ri) n += rd.ties.flatMap(t => t.m).filter(m => m.played).length; });
    return n;
  }
  function invalidate(comp, L) {
    comp.champion = null;
    dependents(comp, L.si).forEach(j => { comp.stages[j] = null; if (comp.confirmed) delete comp.confirmed[j]; });
    if (L.st.type === 'knockout') {
      L.st.rounds = L.st.rounds.slice(0, L.ri + 1);
      if (!L.tie.bye) L.tie.w = null;
    }
  }

  function pendingIn(st) {
    if (!st || st.type === 'agg' || st.auto) return false;
    return matchesOf(st).some(m => !m.played) || (st.type === 'knockout' && st.rounds[st.rounds.length - 1].ties.some(t => !t.w));
  }
  // fase pronta para começar, mas esperando confirmação dos clubes convidados
  function awaiting(comp) {
    return comp.spec.findIndex((spec, i) => spec.confirm && !comp.stages[i] && !(comp.confirmed || {})[i] && (spec.after || []).every(d => depReady(comp, d)));
  }
  function confirm(comp, i) {
    comp.confirmed = { ...(comp.confirmed || {}), [i]: true };
    advance(comp);
  }
  function finished(comp) {
    return comp.spec.every((s, i) => comp.stages[i] && !pendingIn(comp.stages[i]));
  }
  function step(comp) {
    for (let i = 0; i < comp.stages.length; i++) {
      const st = comp.stages[i];
      if (!pendingIn(st)) continue;
      const spec = comp.spec[i];
      let label = '';
      if (st.type === 'rr') {
        const r = st.rounds.findIndex(rd => rd.some(m => !m.played));
        st.rounds[r].forEach(m => { if (!m.played) E.playMatch(m); });
        label = `${spec.name} · rodada ${r + 1}`;
      } else {
        const rd = st.rounds[st.rounds.length - 1];
        const pending = rd.ties.filter(t => !t.w);
        // jogos completos mas indefinidos (lançados à mão sem pênaltis): decide nos pênaltis
        pending.filter(t => !t.bo3 && t.m.every(m => m.played)).forEach(t => {
          const last = t.m[t.m.length - 1];
          if (!t.rule || t.rule.pens) last.pen = E.shootout(T(last.h), T(last.a));
          E.updateTie(t);
        });
        const open = pending.filter(t => !t.w && t.m.some(m => !m.played));
        const legs = open.map(t => t.m.findIndex(m => !m.played));
        const leg = legs.length ? Math.min(...legs) : 0;
        open.forEach(t => { const k = t.m.findIndex(m => !m.played); if (k === leg) E.playTieLeg(t, k); });
        const multi = rd.ties.some(t => t.m.length > 1);
        label = `${spec.name} · ${rd.name}${multi ? (rd.ties.some(t => t.bo3) ? ` · jogo ${leg + 1}` : leg === 0 ? ' · ida' : ' · volta') : ''}`;
      }
      advance(comp);
      return label;
    }
    advance(comp);
    return null;
  }
  function simulateAll(comp) {
    for (let g = 0; g < 3000; g++) if (step(comp) === null) break;
  }
  function playOne(comp, id) {
    const L = E.locate(comp, id);
    if (!L || L.m.played) return false;
    if (L.st.type === 'knockout') {
      if (L.ri < L.st.rounds.length - 1) return false;
      if (L.tie.bo3 && L.tie.m.slice(0, L.leg).some(m => !m.played)) return false;
      E.playTieLeg(L.tie, L.leg);
    } else E.playMatch(L.m);
    advance(comp);
    return true;
  }
  function clearResults(comp) {
    comp.champion = null;
    comp.confirmed = {};
    comp.spec.forEach((spec, i) => {
      const initial = !(spec.after && spec.after.length) && spec.mirror == null;
      if (!initial) { comp.stages[i] = null; return; }
      const st = comp.stages[i];
      if (!st) return;
      if (st.type === 'knockout') {
        st.rounds = [st.rounds[0]];
        st.rounds[0].ties.forEach(t => { E.restoreBo3(t); t.m.forEach(m => { ['hg', 'ag', 'et', 'pen', 'ev', 'st', 'manual'].forEach(k => delete m[k]); m.played = false; }); if (!t.bye) t.w = null; });
      } else matchesOf(st).forEach(m => { ['hg', 'ag', 'et', 'pen', 'ev', 'st', 'manual'].forEach(k => delete m[k]); m.played = false; });
    });
    advance(comp);
  }
  function redraw(comp) {
    comp.stages = comp.spec.map(() => null);
    comp.confirmed = {};
    comp.champion = null;
    advance(comp);
  }
  function progress(comp) {
    if (finished(comp)) return 1;
    let played = 0, total = 0;
    comp.stages.forEach((st, i) => {
      if (!st) { total += 12; return; }
      const ms = matchesOf(st);
      played += ms.filter(m => m.played).length; total += ms.length;
      if (st.type === 'knockout' && !stageDone(comp, i)) total += 2;
    });
    return Math.min(0.99, played / Math.max(1, total));
  }
  function currentStage(comp) {
    for (let i = 0; i < comp.stages.length; i++) if (pendingIn(comp.stages[i])) return comp.stages[i];
    return comp.stages.filter(Boolean).pop();
  }
  function currentLabel(comp) {
    const st = currentStage(comp);
    if (!st) return '';
    if (st.type === 'knockout' && st.rounds.length) return `${st.name} · ${st.rounds[st.rounds.length - 1].name}`;
    return st.name;
  }
  // resultados de destaque (acesso, rebaixados, vagas...) quando já definidos
  function outcomes(comp, tpl) {
    return (tpl.outcomes || []).map(o => {
      const deps = new Set();
      const walk = s => { if (!s) return; if (s.phase != null) deps.add(s.phase); (s.list || s.uniqueFill || []).forEach(walk); if (s.from) walk(s.from); };
      walk(o.src);
      const ready = [...deps].every(k => stageDone(comp, k));
      return { label: o.label, color: o.color, ids: ready ? resolve(comp, o.src) : null };
    }).filter(o => o.ids && o.ids.length);
  }

  return { resolve, awaiting, confirm, finished, create, advance, step, simulateAll, playOne, clearResults, redraw, progress, rank, stageDone, wouldDiscard, invalidate, currentStage, currentLabel, outcomes, dependents };
})();
