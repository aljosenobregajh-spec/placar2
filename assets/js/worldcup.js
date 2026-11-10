/* Placar — modo Copa do Mundo (ciclo completo: sedes → vagas → eliminatórias → repescagem mundial → sorteio → Copa)
   Cada etapa é uma competição normal do motor de regulamentos (reg.js); este arquivo monta os formatos
   conforme as sedes e as vagas, liga as etapas entre si e calcula o ranking do ciclo. */

const WC = (() => {
  const Z = ZONE_COLORS;
  const zone = (from, to, color, label) => ({ from, to, color, label });
  const CONFS = [
    { k: 'UEFA', name: 'UEFA', full: 'Europa', logo: 'assets/logos/lg-conf-uefa.png' },
    { k: 'CAF', name: 'CAF', full: 'África', logo: 'assets/logos/lg-conf-caf.png' },
    { k: 'AFC', name: 'AFC', full: 'Ásia', logo: 'assets/logos/lg-conf-afc.png' },
    { k: 'CONMEBOL', name: 'Conmebol', full: 'América do Sul', logo: 'assets/logos/lg-conf-conmebol.png' },
    { k: 'CONCACAF', name: 'Concacaf', full: 'Américas do Norte e Central', logo: 'assets/logos/lg-conf-concacaf.png' },
    { k: 'OFC', name: 'OFC', full: 'Oceania', logo: 'assets/logos/lg-conf-ofc.png' }
  ];
  const CUP_LOGO = 'assets/logos/lg-world-cup.png';
  const TROPHY = null;   // taça como escudo da Copa e da repescagem: aponte para o arquivo (ex.: 'assets/logos/lg-taca.png') quando houver uma imagem limpa
  const BASE = { UEFA: [16, 0], CAF: [9, 1], AFC: [8, 1], CONMEBOL: [6, 1], CONCACAF: [6, 1], OFC: [1, 1] };   // [diretas, repescagem]
  const LIMITS = { UEFA: [8, 20, 0], CAF: [2, 13, 2], AFC: [0, 8, 2], CONMEBOL: [0, 9, 2], CONCACAF: [0, 9, 2], OFC: [0, 2, 2] };   // [mín. diretas, máx. diretas, máx. repescagem]
  const MAX_HOSTS = 6;
  const TB = ['pts', 'gd', 'gf', 'h2h'];
  const TB_UEFA = ['pts', 'gd', 'gf', 'w', 'h2h'];
  const base = id => BASE_TEAMS.find(t => t.id === id);
  const confOf = id => { const t = base(id); return t && t.nat && t.fifaRank ? t.league.replace('SEL-', '') : null; };
  const members = k => BASE_TEAMS.filter(t => t.nat && t.fifaRank && t.league === 'SEL-' + k && t.id !== 'sel-russia').map(t => t.id);
  const allNations = () => BASE_TEAMS.filter(t => t.nat && t.fifaRank).map(t => t.id);
  const nm = id => (base(id) || { name: id }).name;

  /* ================= Vagas ================= */
  // sugestão: cada sede ocupa uma vaga direta da sua confederação; a 6ª vaga da repescagem mundial vai para a
  // confederação (fora a UEFA, que nunca joga a repescagem) com mais sedes
  function suggestQuotas(hosts) {
    const q = {}; CONFS.forEach(c => { q[c.k] = { d: BASE[c.k][0], p: BASE[c.k][1] }; });
    const hc = {}; hosts.forEach(id => { const c = confOf(id); hc[c] = (hc[c] || 0) + 1; });
    let debt = 0;
    Object.entries(hc).forEach(([c, n]) => { q[c].d -= n; if (q[c].d < 0) { debt += -q[c].d; q[c].d = 0; } });
    q.UEFA.d -= debt;
    // CONCACAF tem 1 vaga de repescagem na base e ganha a 2ª como sede em 2026: a vaga extra segue a confederação-sede
    q.CONCACAF.p = 1;
    const cand = Object.entries(hc).filter(([c]) => c !== 'UEFA').sort((a, b) => b[1] - a[1]);
    const extra = cand.length ? cand[0][0] : 'CAF';
    q[extra].p += 1;
    // limites do formato de cada eliminatória
    CONFS.forEach(c => {
      const n = members(c.k).filter(id => !hosts.includes(id)).length;
      const maxP = Math.min(LIMITS[c.k][2], Math.max(0, n - 1 - q[c.k].d));
      if (q[c.k].p > maxP) { const over = q[c.k].p - maxP; q[c.k].p = maxP; const alt = CONFS.find(x => x.k !== 'UEFA' && x.k !== c.k && q[x.k].p < LIMITS[x.k][2]); if (alt) q[alt.k].p += over; }
    });
    return q;
  }
  function validateQuotas(q, hosts) {
    const errs = [];
    const sumD = CONFS.reduce((s, c) => s + q[c.k].d, 0), sumP = CONFS.reduce((s, c) => s + q[c.k].p, 0);
    if (hosts.length < 1) errs.push('Escolha pelo menos uma sede.');
    if (sumD + hosts.length !== 46) errs.push(`As vagas diretas precisam somar ${46 - hosts.length} (46 menos as ${hosts.length} sede${hosts.length === 1 ? '' : 's'}); hoje somam ${sumD}.`);
    if (sumP !== 6) errs.push(`A repescagem mundial tem 6 seleções; hoje somam ${sumP}.`);
    if (q.UEFA.p) errs.push('A UEFA não joga a repescagem mundial.');
    CONFS.forEach(c => {
      const [mn, mx, mp] = LIMITS[c.k], n = members(c.k).filter(id => !hosts.includes(id)).length, { d, p } = q[c.k];
      if (d < mn || d > mx) errs.push(`${c.name}: o formato aceita de ${mn} a ${mx} vagas diretas.`);
      if (p > mp) errs.push(`${c.name}: no máximo ${mp} vaga${mp === 1 ? '' : 's'} na repescagem.`);
      if (d + p > Math.max(0, n - 1)) errs.push(`${c.name}: só ${n} seleções disputam, não dá para ${d + p} vagas.`);
      if (c.k === 'OFC' && d + p > 2) errs.push('OFC: no máximo 2 vagas somando diretas e repescagem.');
      if (c.k === 'CONCACAF' && d + p > 9) errs.push('Concacaf: no máximo 9 vagas somando diretas e repescagem.');
    });
    return errs;
  }

  /* ================= Formatos das eliminatórias ================= */
  // repescagem interna: dos M candidatos (em ordem), saem P vagas
  function poPhase(phases, name, after, src, M, P, cfg = {}) {
    if (!P) return null;
    const E = M >= 4 * P ? 4 * P : M >= 2 * P ? 2 * P : P;
    if (E === P) return { ...src, take: [0, P] };
    const pairs = [];
    if (E === 2 * P) for (let k = 0; k < P; k++) pairs.push([k, 2 * P - 1 - k]);
    else for (let k = 0; k < P; k++) pairs.push([k, 4 * P - 1 - k], [P + k, 3 * P - 1 - k]);
    phases.push({ type: 'ko', name, after, teams: { ...src, take: [0, E] }, pairing: 'pairs', pairs, legs: 1, neutral: true, et: true, pens: true,
      maxRounds: E === 2 * P ? 1 : 2, roundNames: E === 2 * P ? ['Decisão'] : ['Semifinal', 'Final'], ...cfg });
    return { phase: phases.length - 1, winners: true };
  }
  // fase preliminar: as 2k piores do ranking jogam ida e volta
  function prelim(phases, N, k, name) {
    if (k <= 0) return { entry: 'teams' };
    phases.push({ type: 'ko', name, teams: { entry: 'teams', take: [N - 2 * k, N] }, pairing: 'pairs', pairs: Array.from({ length: k }, (_, i) => [i, 2 * k - 1 - i]), legs: 2, et: true, pens: true, maxRounds: 1, roundNames: [name] });
    return { list: [{ entry: 'teams', take: [0, N - 2 * k] }, { phase: phases.length - 1, winners: true }] };
  }

  const BUILD = {
    UEFA(N, D) {
      const paths = Math.max(2, Math.min(4, D - 12)), G = D - paths, ru = 3 * paths;
      const pairs = [];
      for (let k = 0; k < paths; k++) pairs.push([k, 3 * paths + k], [paths + k, 2 * paths + k]);
      const phases = [
        { type: 'rr', name: 'Fase de grupos', teams: { entry: 'teams' }, groups: { count: G }, legs: 2, tiebreak: TB_UEFA,
          zonesEach: [zone(1, 1, Z.lib, 'Classificado para a Copa'), zone(2, 2, Z.prelib, ru >= G ? 'Repescagem europeia' : `Os ${ru} melhores 2ºs vão à repescagem`)] },
        { type: 'ko', name: 'Repescagem', after: [0], confirm: { role: 'nl', count: paths, label: 'vindas da Liga das Nações', kind: 'nl' },
          teams: { list: [{ phase: 0, perGroup: [2, 2], fair: true, take: [0, ru] }, { entry: 'nl' }] }, pairing: 'pairs', pairs, legs: 1, et: true, pens: true, maxRounds: 2,
          roundNames: ['Semifinal da repescagem', 'Final da repescagem'] }
      ];
      return {
        phases, extra: { nl: [] },
        direct: [{ label: 'Campeões de grupo', src: { phase: 0, perGroup: [1, 1] } }, { label: 'Vencedores da repescagem', src: { phase: 1, winners: true } }], playoff: [],
        rules: [`${N} seleções em ${G} grupos, ida e volta. Os ${G} campeões de grupo vão à Copa.`,
          `Repescagem com ${4 * paths} seleções em ${paths} caminhos: ${ru >= G ? `os ${G} segundos colocados` : `os ${ru} melhores segundos colocados`} e ${paths} seleções vindas da Liga das Nações, que você confirma quando os grupos terminarem. Semifinal e final em jogo único, na casa da mais bem colocada; o vencedor de cada caminho vai à Copa.`]
      };
    },
    CONMEBOL(N, D, P) {
      const zones = [zone(1, D, Z.lib, 'Classificado para a Copa')]; if (P) zones.push(zone(D + 1, D + P, Z.prelib, 'Repescagem mundial'));
      return {
        phases: [{ type: 'rr', name: 'Eliminatórias', teams: { entry: 'teams' }, legs: 2, tiebreak: TB, zones: zones.filter(z => z.to >= z.from) }],
        direct: D ? [{ label: 'Classificados', src: { phase: 0, pos: [1, D] } }] : [], playoff: P ? [{ label: 'Repescagem mundial', src: { phase: 0, pos: [D + 1, D + P] } }] : [],
        rules: [`${N} seleções em pontos corridos, ida e volta. ${D ? `Os ${D} primeiros vão à Copa` : 'Nenhuma vaga direta'}${P ? `; ${P === 1 ? `o ${D + 1}º vai` : `o ${D + 1}º e o ${D + 2}º vão`} à repescagem mundial` : ''}.`]
      };
    },
    CAF(N, D, P) {
      // 1 vaga por grupo; com poucas vagas (muitas sedes africanas) os grupos não passam de 6 seleções e só os melhores campeões vão direto
      const G = Math.max(D, Math.ceil(N / 6)), all = G === D;
      const phases = [{ type: 'rr', name: 'Fase de grupos', teams: { entry: 'teams' }, groups: { count: G }, legs: 2, tiebreak: TB,
        zonesEach: [zone(1, 1, Z.lib, all ? 'Classificado para a Copa' : `Os ${D} melhores campeões vão à Copa`), ...(P ? [zone(2, 2, Z.prelib, 'Os melhores 2ºs disputam a vaga na repescagem mundial')] : [])] }];
      const cand = all ? { phase: 0, perGroup: [2, 2], fair: true } : { list: [{ phase: 0, perGroup: [1, 2], fair: true, take: [D, 2 * G] }] };
      const po = poPhase(phases, 'Repescagem africana', [0], cand, all ? G : 2 * G - D, P);
      return {
        phases, direct: [{ label: 'Campeões de grupo', src: all ? { phase: 0, perGroup: [1, 1] } : { phase: 0, perGroup: [1, 1], fair: true, take: [0, D] } }], playoff: po ? [{ label: 'Repescagem mundial', src: po }] : [],
        rules: [`${N} seleções em ${G} grupos, ida e volta. ${all ? `Os ${D} campeões de grupo vão à Copa.` : `Os ${D} campeões de melhor campanha vão à Copa.`}`,
          ...(P ? [`${all ? 'Os melhores segundos colocados' : 'Os outros campeões e os melhores segundos colocados'} disputam, em jogo único e campo neutro, ${P === 1 ? 'a vaga' : `as ${P} vagas`} da África na repescagem mundial.`] : [])]
      };
    },
    AFC(N, D, P) {
      const phases = [], k = Math.max(0, N - 36);
      const src2 = prelim(phases, N, k, '1ª fase');
      const r2 = phases.length;
      phases.push({ type: 'rr', name: '2ª fase', after: k ? [0] : [], teams: src2, groups: { count: 9 }, legs: 2, tiebreak: TB, zonesEach: [zone(1, 2, Z.up, 'Avança à 3ª fase')] });
      const r3 = phases.length, d3 = Math.min(D, 6), D4 = D - d3;
      phases.push({ type: 'rr', name: '3ª fase', after: [r2], teams: { phase: r2, perGroup: [1, 2] }, groups: { count: 3 }, legs: 2, tiebreak: TB,
        zonesEach: D >= 6 ? [zone(1, 2, Z.lib, 'Classificado para a Copa'), ...(D4 + P ? [zone(3, 4, Z.prelib, '4ª fase')] : [])] : [zone(1, 1, Z.lib, 'Classificado para a Copa'), zone(2, 4, Z.prelib, 'Depende da campanha: vaga direta ou 4ª fase')] });
      const direct = d3 ? [{ label: 'Classificados na 3ª fase', src: { phase: r3, perGroup: [1, 2], take: [0, d3] } }] : [];
      const playoff = [];
      if (D4 + P > 0) {
        const r4 = phases.length;
        phases.push({ type: 'rr', name: '4ª fase', after: [r3], teams: { phase: r3, perGroup: [1, 4], take: [d3, d3 + 6] }, groups: { count: 2 }, legs: 1, tiebreak: TB,
          zonesEach: [zone(1, 1, Z.lib, D4 === 2 ? 'Classificado para a Copa' : D4 === 1 ? 'Decide a vaga direta' : 'Disputa a repescagem mundial'), ...((D4 === 2 && P) || (D4 === 1 && P === 2) ? [zone(2, 2, Z.prelib, 'Disputa a repescagem mundial')] : [])] });
        const Wn = { phase: r4, perGroup: [1, 1] }, Rn = { phase: r4, perGroup: [2, 2] };
        const tie = (teams, pairs) => { phases.push({ type: 'ko', name: '5ª fase', after: [r4], teams, pairing: 'pairs', pairs, legs: 2, et: true, pens: true, maxRounds: 1, roundNames: ['5ª fase'] }); return phases.length - 1; };
        if (D4 === 2) {
          direct.push({ label: 'Campeões da 4ª fase', src: Wn });
          if (P === 1) playoff.push({ label: 'Repescagem mundial', src: { phase: tie(Rn, [[0, 1]]), winners: true } });
          if (P === 2) playoff.push({ label: 'Repescagem mundial', src: Rn });
        } else if (D4 === 1) {
          const f = tie(P === 2 ? { list: [Wn, Rn] } : Wn, P === 2 ? [[0, 1], [2, 3]] : [[0, 1]]);
          direct.push({ label: 'Vencedor da 5ª fase', src: { phase: f, roundWinners: 0, take: [0, 1] } });
          if (P >= 1) playoff.push({ label: 'Repescagem mundial', src: P === 2 ? { list: [{ phase: f, roundLosers: 0, take: [0, 1] }, { phase: f, roundWinners: 0, take: [1, 2] }] } : { phase: f, roundLosers: 0 } });
        } else if (P === 1) playoff.push({ label: 'Repescagem mundial', src: { phase: tie(Wn, [[0, 1]]), winners: true } });
        else if (P === 2) playoff.push({ label: 'Repescagem mundial', src: Wn });
      }
      return {
        phases, direct, playoff,
        rules: [...(k ? [`1ª fase: as ${2 * k} piores do ranking jogam ida e volta; as vencedoras se juntam às outras ${N - 2 * k}.`] : []),
          '2ª fase: 9 grupos, ida e volta; os 2 primeiros de cada grupo avançam.',
          `3ª fase: 3 grupos de 6, ida e volta. ${D >= 6 ? 'Os 2 primeiros de cada grupo vão à Copa.' : `As ${d3} melhores campanhas entre 1ºs e 2ºs vão à Copa.`}`,
          ...(D4 + P > 0 ? [`4ª fase: as 6 seguintes em 2 grupos de 3, turno único. ${D4 === 2 ? 'Os campeões vão à Copa' : D4 === 1 ? 'Os campeões decidem a última vaga direta em ida e volta (5ª fase)' : 'Os campeões disputam a repescagem mundial'}${P ? `; ${P === 1 ? '1 seleção vai' : '2 seleções vão'} à repescagem mundial` : ''}.`] : [])]
      };
    },
    CONCACAF(N, D, P) {
      const phases = [], k = Math.max(0, N - 30);
      const src2 = prelim(phases, N, k, '1ª fase');
      const r2 = phases.length;
      phases.push({ type: 'rr', name: '2ª fase', after: k ? [0] : [], teams: src2, groups: { count: 6 }, legs: 1, tiebreak: TB, zonesEach: [zone(1, 2, Z.up, 'Avança à 3ª fase')] });
      const r3 = phases.length, w = Math.min(D, 3);
      const zs = [];
      if (D >= 3) zs.push(zone(1, D >= 6 ? 2 : 1, Z.lib, 'Classificado para a Copa'));
      if (D < 6 && D + P > w) zs.push(zone(D >= 3 ? 2 : 1, D + P > 3 ? 2 : 1, Z.prelib, D > 3 || (D > 0 && D < 3) ? 'Depende da campanha: Copa ou repescagem mundial' : D === 0 ? 'Melhores campanhas vão à repescagem mundial' : 'Os melhores 2ºs vão à repescagem mundial'));
      phases.push({ type: 'rr', name: '3ª fase', after: [r2], teams: { phase: r2, perGroup: [1, 2] }, groups: { count: 3 }, legs: 2, tiebreak: TB, zonesEach: zs });
      const order = { phase: r3, perGroup: [1, 4] };
      return {
        phases, direct: D ? [{ label: 'Classificados', src: { ...order, take: [0, D] } }] : [], playoff: P ? [{ label: 'Repescagem mundial', src: { ...order, take: [D, D + P] } }] : [],
        rules: [...(k ? [`1ª fase: as ${2 * k} piores do ranking jogam ida e volta; as vencedoras se juntam às outras ${N - 2 * k}.`] : []),
          '2ª fase: 6 grupos em turno único; os 2 primeiros de cada grupo avançam.',
          `3ª fase: 3 grupos de 4, ida e volta. ${D === 3 ? 'Os 3 campeões vão à Copa' : D === 6 ? 'Campeões e vices vão à Copa' : D ? `As ${D} melhores campanhas (campeões primeiro, depois os melhores 2ºs) vão à Copa` : 'Não há vaga direta'}${P ? `; ${D === 3 ? `${P === 1 ? 'o melhor 2º vai' : 'os 2 melhores 2ºs vão'}` : `${P === 1 ? 'a seguinte vai' : 'as 2 seguintes vão'}`} à repescagem mundial` : ''}.`]
      };
    },
    OFC(N, D, P) {
      const phases = [], k = N > 8 ? N - 7 : 0;
      let src = { entry: 'teams' };
      if (k === 2) src = prelim(phases, N, 1, '1ª fase');
      else if (k > 2) {
        phases.push({ type: 'rr', name: '1ª fase', teams: { entry: 'teams', take: [N - k, N] }, legs: 1, neutral: true, tiebreak: TB, zones: [zone(1, 1, Z.up, 'Avança à 2ª fase')] });
        src = { list: [{ entry: 'teams', take: [0, N - k] }, { phase: 0, pos: [1, 1] }] };
      }
      const g = phases.length;
      phases.push({ type: 'rr', name: '2ª fase', after: k ? [0] : [], teams: src, groups: { count: 2 }, legs: 1, neutral: true, tiebreak: TB, zonesEach: [zone(1, 2, Z.up, 'Semifinal')] });
      const S = D + P, two = S === 2 && D !== 1;
      phases.push({ type: 'ko', name: '3ª fase', after: [g], teams: { list: [{ phase: g, group: 0, pos: [1, 2] }, { phase: g, group: 1, pos: [1, 2] }] }, pairing: 'pairs', pairs: [[0, 3], [2, 1]],
        legs: 1, neutral: true, et: true, pens: true, maxRounds: two ? 1 : 2, roundNames: ['Semifinal', 'Final'] });
      const f = g + 1, direct = [], playoff = [];
      if (two) (D === 2 ? direct : playoff).push({ label: D === 2 ? 'Vencedores das semifinais' : 'Repescagem mundial', src: { phase: f, winners: true } });
      else {
        (D === 1 ? direct : playoff).push({ label: D === 1 ? 'Campeão' : 'Repescagem mundial', src: { phase: f, winner: true } });
        if (S === 2) playoff.push({ label: 'Repescagem mundial', src: { phase: f, runnerUp: true } });
      }
      return {
        phases, direct, playoff,
        rules: [...(k ? [`1ª fase: as ${k} piores do ranking disputam 1 vaga na 2ª fase.`] : []),
          '2ª fase: 2 grupos em turno único e campo neutro; os 2 primeiros de cada grupo vão às semifinais.',
          two ? `3ª fase: os vencedores das semifinais ${D === 2 ? 'vão à Copa' : 'vão à repescagem mundial'}.` : `3ª fase: semifinais e final. O campeão ${D === 1 ? 'vai à Copa' : 'vai à repescagem mundial'}${S === 2 ? '; o vice vai à repescagem mundial' : ''}.`]
      };
    }
  };

  const TPL = {};
  const SOURCES = [
    { t: 'Wikipedia — Eliminatórias da Copa do Mundo de 2026 (vagas e formatos)', u: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_qualification' },
    { t: 'Wikipedia — Copa do Mundo de 2026: mata-mata', u: 'https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_knockout_stage' }
  ];
  const tpl = (id, o) => {
    if (!TPL[id]) { TPL[id] = { id, group: '_oculto', icon: 'groups', entries: {}, roles: {}, champion: { phase: 0 }, phases: [], rules: [], sources: SOURCES, ...o }; TEMPLATES.push(TPL[id]); }
    return TPL[id];
  };
  CONFS.forEach(c => tpl('wc-' + c.k.toLowerCase(), { name: `Eliminatórias · ${c.name}`, short: `Eliminatórias da Copa do Mundo · ${c.full}`, crest: c.logo,
    rules: ['Formato das eliminatórias de 2026, ajustado às sedes e às vagas deste ciclo. As sedes não jogam: já estão na Copa.', 'Potes dos sorteios pelo ranking do ciclo.'],
    notes: c.k === 'UEFA' ? ['As seleções da Liga das Nações que entram na repescagem não são calculadas sozinhas: você confirma (ou importa de uma Liga das Nações salva) quando os grupos terminam.', 'Na repescagem real, os caminhos são sorteados por potes; aqui os potes são distribuídos em ordem.'] : [] }));
  tpl('wc-playoff', { name: 'Repescagem mundial', short: '6 seleções · 2 vagas na Copa', icon: 'knockout', crest: TROPHY || CUP_LOGO,
    rules: ['Seis seleções em jogo único e campo neutro. As 2 mais bem ranqueadas esperam na final; as outras 4 jogam as semifinais.', 'Os 2 vencedores das finais vão à Copa do Mundo.'],
    notes: ['No torneio real, duas seleções da mesma confederação ficam em caminhos diferentes; aqui a chave segue só o ranking.'] });
  tpl('wc-finals', { name: 'Copa do Mundo', short: '48 seleções · 12 grupos + mata-mata', crest: TROPHY || CUP_LOGO,
    rules: ['48 seleções em 12 grupos de 4, turno único. As sedes jogam em casa; os outros jogos são em campo neutro.',
      'Avançam os 2 primeiros de cada grupo e os 8 melhores 3ºs. Desempate: pontos, confronto direto, saldo, gols marcados.',
      'Mata-mata de 32 em jogo único, com prorrogação e pênaltis, no chaveamento oficial de 2026, e disputa de 3º lugar.',
      'Sorteio: 4 potes pelo ranking do ciclo, sedes no pote 1 como cabeças dos primeiros grupos, vencedores da repescagem mundial no pote 4. No máximo 1 seleção por confederação em cada grupo (UEFA: até 2).'],
    notes: ['O encaixe dos 3ºs colocados respeita as mesmas restrições da tabela oficial da FIFA (quais 3ºs podem enfrentar cada campeão de grupo), mas o confronto exato pode diferir do da tabela em algumas combinações.'] });

  /* ================= Ciclo ================= */
  const compsOf = (d, cy) => d.comps.filter(c => c.cycle === cy.id);
  const part = (d, cy, k) => d.comps.find(c => c.cycle === cy.id && c.part === k);
  const played = c => !!c && Engine.allMatches(c).some(m => m.played);
  const sortByRank = (ids, pts) => ids.slice().sort((a, b) => (pts[b] || 0) - (pts[a] || 0) || ((base(a) || {}).fifaRank || 999) - ((base(b) || {}).fifaRank || 999));
  const baseRank = () => Object.fromEntries(allNations().map(id => [id, base(id).fifaPts || 0]));

  function mkComp(cy, key, built, entries, name) {
    const t = TPL['wc-' + key.toLowerCase()];
    const comp = Reg.create({ ...t, build: () => ({ phases: built.phases, champion: built.champion || { phase: built.phases.length - 1 }, rules: built.rules }) }, entries, name);
    comp.cycle = cy.id; comp.part = key; comp.crest = t.crest; comp.short = t.short;
    if (!built.champion) { comp.noChamp = true; comp.champion = null; }
    comp.wc = { direct: built.direct || [], playoff: built.playoff || [] };
    comp.outcomesSpec = [...comp.wc.direct.map(o => ({ label: `Na Copa · ${o.label.toLowerCase()}`, src: o.src, color: Z.lib })), ...comp.wc.playoff.map(o => ({ label: o.label, src: o.src, color: Z.prelib }))];
    return comp;
  }

  function createCycle(d, { name, year, hosts, quotas, rank0, series, prev }) {
    const cy = { id: Engine.uid(), name, year, hosts: hosts.slice(), quotas: JSON.parse(JSON.stringify(quotas)), rank0: rank0 || baseRank(), series: series || Engine.uid(), prev: prev || null, created: Date.now() };
    CONFS.forEach(c => {
      const { d: D, p: P } = quotas[c.k];
      if (D + P === 0) return;
      const teams = sortByRank(members(c.k).filter(id => !hosts.includes(id)), cy.rank0);
      const built = BUILD[c.k](teams.length, D, P);
      d.comps.push(mkComp(cy, c.k, built, { teams, ...(built.extra || {}) }, `Eliminatórias ${c.name} · ${name}`));
    });
    d.cycles = d.cycles || [];
    d.cycles.push(cy);
    return cy;
  }

  // ids de uma lista de fontes que já estão definidos (fase encerrada)
  function ready(comp, list) {
    const out = [];
    let all = true;
    list.forEach(o => {
      const deps = new Set();
      const walk = s => { if (!s) return; if (s.phase != null) deps.add(s.phase); (s.list || []).forEach(walk); };
      walk(o.src);
      if ([...deps].every(k => Reg.stageDone(comp, k))) out.push(...Reg.resolve(comp, o.src)); else all = false;
    });
    return { ids: out, all };
  }
  function status(d, cy) {
    const S = { confs: {}, hosts: cy.hosts.slice(), qualified: cy.hosts.slice(), poTeams: [], poReady: true };
    CONFS.forEach(c => {
      const comp = part(d, cy, c.k), q = cy.quotas[c.k];
      const r = comp ? ready(comp, comp.wc.direct) : { ids: [], all: true }, p = comp ? ready(comp, comp.wc.playoff) : { ids: [], all: true };
      S.confs[c.k] = { comp, d: q.d, p: q.p, direct: r.ids, playoff: p.ids, done: !comp || Reg.finished(comp), awaiting: comp ? Reg.awaiting(comp) >= 0 : false };
      S.qualified.push(...r.ids); S.poTeams.push(...p.ids);
      if (comp && !Reg.finished(comp)) S.poReady = false;
    });
    S.playoff = part(d, cy, 'playoff'); S.finals = part(d, cy, 'finals');
    S.poWinners = S.playoff && Reg.finished(S.playoff) ? Reg.resolve(S.playoff, { phase: 0, winners: true }) : [];
    S.qualified.push(...S.poWinners);
    S.stage = S.finals ? (Reg.finished(S.finals) ? 'done' : 'cup') : !S.poReady ? 'qual' : (S.playoff && Reg.finished(S.playoff)) ? 'draw' : 'playoff';
    return S;
  }

  // mantém as etapas ligadas: cria/atualiza a repescagem mundial quando as eliminatórias terminam
  function sync(d, cy) {
    const S = status(d, cy);
    if (S.finals) return;
    const po = S.playoff;
    if (!S.poReady) { if (po && !played(po)) d.comps = d.comps.filter(c => c !== po); return; }
    const teams = sortByRank(S.poTeams, ranking(d, cy, { until: 'qual' }).pts);
    if (po && (played(po) || JSON.stringify(po.entries.teams) === JSON.stringify(teams))) return;
    if (po) d.comps = d.comps.filter(c => c !== po);
    if (teams.length !== 6) return;
    d.comps.push(mkComp(cy, 'playoff', {
      phases: [{ type: 'ko', name: 'Repescagem mundial', teams: { entry: 'teams' }, pairing: 'pairs', pairs: [[0, null], [3, 4], [1, null], [2, 5]], legs: 1, neutral: true, et: true, pens: true, maxRounds: 2, roundNames: ['Semifinal', 'Final'] }],
      direct: [{ label: 'Vencedores', src: { phase: 0, winners: true } }]
    }, { teams }, `Repescagem mundial · ${cy.name}`));
  }
  function syncAll(d) { (d.cycles || []).forEach(cy => { try { sync(d, cy); } catch (e) { console.error(e); } }); }

  // etapa travada: a seguinte já começou (para mudar, use o Desfazer do painel do ciclo)
  function isLocked(d, comp) {
    const cy = (d.cycles || []).find(x => x.id === comp.cycle);
    if (!cy || comp.part === 'finals') return false;
    const fin = part(d, cy, 'finals'), po = part(d, cy, 'playoff');
    return !!fin || (comp.part !== 'playoff' && played(po));
  }

  /* ---------- sorteio da Copa ---------- */
  function drawFinals(d, cy) {
    const S = status(d, cy);
    if (S.stage !== 'draw' || S.qualified.length !== 48) return null;
    const pts = ranking(d, cy).pts;
    const H = cy.hosts, PO = S.poWinners;
    const rest = sortByRank(S.qualified.filter(id => !H.includes(id) && !PO.includes(id)), pts);
    const all = [...H, ...rest, ...PO];
    const pots = [0, 1, 2, 3].map(p => all.slice(p * 12, p * 12 + 12));
    const cap = c => (c === 'UEFA' ? 2 : 1);
    for (let attempt = 0; attempt < 400; attempt++) {
      const groups = Array.from({ length: 12 }, () => []);
      const ok = (g, id) => groups[g].filter(x => confOf(x) === confOf(id)).length < cap(confOf(id));
      let fail = false;
      for (let p = 0; p < 4 && !fail; p++) {
        const free = new Set(groups.map((_, g) => g));
        let pot = pots[p].slice();
        if (p === 0) { H.forEach((id, g) => { groups[g].push(id); free.delete(g); }); pot = Engine.shuffle(pot.filter(id => !H.includes(id))); }
        else pot = Engine.shuffle(pot);
        // encaixe com retrocesso: cada seleção do pote num grupo livre que respeite o limite por confederação
        const assign = {};
        const solve = i => {
          if (i === pot.length) return true;
          for (const g of Engine.shuffle([...free])) {
            if (!ok(g, pot[i])) continue;
            free.delete(g); assign[i] = g;
            if (solve(i + 1)) return true;
            free.add(g); delete assign[i];
          }
          return false;
        };
        // mais difíceis primeiro (confederações com mais seleções já espalhadas)
        if (!solve(0)) { fail = true; break; }
        pot.forEach((id, i) => groups[assign[i]].push(id));
      }
      if (fail) continue;
      const L = 'ABCDEFGHIJKL', entries = { hosts: H.slice() };
      groups.forEach((g, i) => { entries['g' + L[i]] = g; });
      const comp = mkComp(cy, 'finals', {
        phases: [
          { type: 'rr', name: 'Fase de grupos', teams: { list: [...L].map(l => ({ entry: 'g' + l })) }, groups: { method: 'roles', roles: [...L].map(l => 'g' + l), names: [...L].map(l => `Grupo ${l}`) }, legs: 1, neutral: true, tiebreak: ['pts', 'h2h', 'gd', 'gf'],
            zonesEach: [zone(1, 2, Z.lib, '16 avos de final'), zone(3, 3, Z.prelib, 'Os 8 melhores 3ºs avançam')] },
          { type: 'ko', name: 'Mata-mata', after: [0], teams: { phase: 0 }, pairing: 'thirds48', legs: 1, neutral: true, et: true, pens: true, roundNames: ['16 avos de final', 'Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'] },
          { type: 'ko', name: 'Disputa de 3º lugar', after: [{ phase: 1, round: 3 }], teams: { phase: 1, roundLosers: 3 }, pairing: 'pairs', pairs: [[0, 1]], legs: 1, neutral: true, et: true, pens: true, maxRounds: 1, roundNames: ['Disputa de 3º lugar'] }
        ], champion: { phase: 1 },
        rules: [`Sede${H.length > 1 ? 's' : ''}: ${H.map(nm).join(', ')}.`]
      }, entries, cy.name);
      comp.pots = pots;
      d.comps.push(comp);
      return comp;
    }
    return null;
  }
  function undrawFinals(d, cy) {
    const fin = part(d, cy, 'finals');
    if (!fin || played(fin)) return false;
    d.comps = d.comps.filter(c => c !== fin);
    return true;
  }

  /* ---------- avançar ---------- */
  // uma "data FIFA": a próxima rodada de cada etapa em andamento
  function stepAll(d, cy) {
    sync(d, cy);
    const S = status(d, cy), out = [];
    const run = c => { if (!c || Reg.finished(c) || Reg.awaiting(c) >= 0) return; const l = Reg.step(c); if (l) out.push(c.part); };
    if (S.stage === 'qual') CONFS.forEach(c => run(S.confs[c.k].comp));
    else if (S.stage === 'playoff') run(S.playoff);
    else if (S.stage === 'cup') run(S.finals);
    sync(d, cy);
    return out;
  }
  function pending(d, cy) {
    const S = status(d, cy);
    return CONFS.filter(c => S.confs[c.k].awaiting).map(c => S.confs[c.k].comp);
  }
  // simula até a etapa mudar (ou até parar numa confirmação)
  function runStage(d, cy) {
    const start = status(d, cy).stage;
    let n = 0;
    for (let g = 0; g < 400; g++) {
      if (status(d, cy).stage !== start) break;
      const r = stepAll(d, cy);
      if (!r.length) break;
      n += r.length;
    }
    return n;
  }

  /* ---------- Liga das Nações na repescagem europeia ---------- */
  function nlState(comp) {
    const i = Reg.awaiting(comp);
    if (i < 0 || !(comp.spec[i].confirm || {}).kind) return null;
    const st = comp.stages[0], top2 = new Set();
    st.groups.forEach((g, gi) => Reg.rank(comp, 0, gi).slice(0, 2).forEach(r => top2.add(r.id)));
    const taken = new Set(Reg.resolve(comp, comp.spec[i].teams.list[0]));
    const blocked = new Set([...top2, ...taken]);
    return { i, count: comp.spec[i].confirm.count, blocked, eligible: comp.entries.teams.filter(id => !blocked.has(id)) };
  }
  // preenche (ou corrige) a sugestão: as mais bem ranqueadas que ficaram fora dos 2 primeiros
  function prepare(d, comp) {
    if (!comp.cycle || comp.part !== 'UEFA') return;
    const N = nlState(comp); if (!N) return;
    const cy = d.cycles.find(x => x.id === comp.cycle);
    const cur = (comp.entries.nl || []).filter((id, k, a) => N.eligible.includes(id) && a.indexOf(id) === k);
    if (cur.length === N.count) return;
    const sug = sortByRank(N.eligible, cy.rank0).filter(id => !cur.includes(id));
    comp.entries.nl = [...cur, ...sug].slice(0, N.count);
  }
  // importa de uma Liga das Nações salva: campeões de grupo pelo ranking geral da Liga, depois os demais
  function importNL(comp, L) {
    const N = nlState(comp); if (!N) return false;
    const t = TEMPLATES.find(x => x.id === L.template), log = t && t.nextSeason && t.nextSeason.leagueOfGroup;
    if (!log || !L.stages[0]) return false;
    const st = L.stages[0], winners = st.groups.map((g, gi) => Reg.rank(L, 0, gi)[0].id);
    const order = Reg.overallOrder(L, st.groups.flatMap(g => g.teams), log);
    const list = [...order.filter(id => winners.includes(id)), ...order.filter(id => !winners.includes(id))].filter(id => N.eligible.includes(id));
    if (list.length < N.count) return false;
    comp.entries.nl = list.slice(0, N.count);
    return true;
  }

  /* ================= Ranking do ciclo ================= */
  // fórmula da FIFA: P = P + I × (W − We), We = 1 / (10^(−dr/600) + 1).
  // Equiparação: nas eliminatórias, cada seleção conta no máximo o equivalente a 10 jogos — quem joga mais
  // tem cada jogo pesando menos, para ninguém subir ou cair só por ter um calendário maior.
  const REF_GAMES = 10;
  function timeline(comp) {
    const dates = [];
    comp.stages.forEach((st, si) => {
      if (!st || st.type === 'agg' || st.auto) return;
      if (st.type === 'rr') st.rounds.forEach(r => dates.push(r.map(m => ({ m, si }))));
      else st.rounds.forEach((rd, ri) => { const legs = Math.max(...rd.ties.map(t => t.m.length)); for (let l = 0; l < legs; l++) dates.push(rd.ties.filter(t => t.m[l]).map(t => ({ m: t.m[l], si, ko: true, ri, last: l === t.m.length - 1, tie: t }))); });
    });
    return dates;
  }
  function ranking(d, cy, opts = {}) {
    const pts = { ...cy.rank0 }, games = {};
    const evs = [];
    compsOf(d, cy).forEach(c => {
      if (opts.until === 'qual' && (c.part === 'playoff' || c.part === 'finals')) return;
      const off = c.part === 'finals' ? 2 : c.part === 'playoff' ? 1 : 0, dates = timeline(c);
      dates.forEach((list, k) => list.forEach(x => { if (x.m.played && x.m.a) evs.push({ ...x, part: c.part, t: off + k / (dates.length + 1) }); }));
    });
    evs.sort((a, b) => a.t - b.t);
    evs.forEach(e => { if (e.part !== 'finals') { games[e.m.h] = (games[e.m.h] || 0) + 1; games[e.m.a] = (games[e.m.a] || 0) + 1; } });
    const f = id => Math.min(1, REF_GAMES / (games[id] || 1));
    evs.forEach(e => {
      const { m } = e, fin = e.part === 'finals';
      if (pts[m.h] == null || pts[m.a] == null) return;
      const I = fin ? (e.ko && e.ri >= 2 && e.si === 1 ? 60 : 50) : 25;
      let wh = m.hg > m.ag ? 1 : m.hg < m.ag ? 0 : 0.5, wa = 1 - wh;
      if (m.pen) { if (m.pen.h > m.pen.a) { wh = 0.75; wa = 0.5; } else { wh = 0.5; wa = 0.75; } }
      const we = 1 / (Math.pow(10, -(pts[m.h] - pts[m.a]) / 600) + 1);
      let dh = I * (wh - we), da = I * (wa - (1 - we));
      if (fin && e.ko) { dh = Math.max(0, dh); da = Math.max(0, da); }   // mata-mata da Copa não tira pontos
      if (!fin) { dh *= f(m.h); da *= f(m.a); }
      pts[m.h] += dh; pts[m.a] += da;
    });
    const order = sortByRank(Object.keys(pts), pts), start = sortByRank(Object.keys(cy.rank0), cy.rank0);
    const pos0 = Object.fromEntries(start.map((id, i) => [id, i + 1]));
    return { pts, rows: order.map((id, i) => ({ id, pos: i + 1, pts: pts[id], d: pts[id] - cy.rank0[id], dpos: pos0[id] - (i + 1) })) };
  }

  /* ================= Série (ciclos seguidos) ================= */
  function podium(d, cy) {
    const fin = part(d, cy, 'finals');
    if (!fin || !Reg.finished(fin)) return null;
    const ko = fin.stages[1], last = ko.rounds[ko.rounds.length - 1].ties[0], t3 = fin.stages[2] && fin.stages[2].rounds[0].ties[0];
    return { champion: last.w, runnerUp: last.w === last.a ? last.b : last.a, third: t3 ? t3.w : null, fourth: t3 ? (t3.w === t3.a ? t3.b : t3.a) : null,
      teams: fin.stages[0].groups.flatMap(g => g.teams) };
  }
  // pódios reais desde 1930: [ano, sede, campeã, vice, 3º] (Alemanha Ocidental conta como Alemanha; Tchecoslováquia como Tchéquia)
  const HISTORY = [
    [1930, 'Uruguai', 'uruguay', 'argentina', 'usa'], [1934, 'Itália', 'italy', 'czechia', 'germany'], [1938, 'França', 'italy', 'hungary', 'brazil'],
    [1950, 'Brasil', 'uruguay', 'brazil', 'sweden'], [1954, 'Suíça', 'germany', 'hungary', 'austria'], [1958, 'Suécia', 'brazil', 'sweden', 'france'],
    [1962, 'Chile', 'brazil', 'czechia', 'chile'], [1966, 'Inglaterra', 'england', 'germany', 'portugal'], [1970, 'México', 'brazil', 'italy', 'germany'],
    [1974, 'Alemanha Ocidental', 'germany', 'netherlands', 'poland'], [1978, 'Argentina', 'argentina', 'netherlands', 'brazil'], [1982, 'Espanha', 'italy', 'germany', 'poland'],
    [1986, 'México', 'argentina', 'germany', 'france'], [1990, 'Itália', 'germany', 'argentina', 'italy'], [1994, 'Estados Unidos', 'brazil', 'italy', 'sweden'],
    [1998, 'França', 'france', 'brazil', 'croatia'], [2002, 'Coreia do Sul e Japão', 'brazil', 'germany', 'turkey'], [2006, 'Alemanha', 'italy', 'france', 'germany'],
    [2010, 'África do Sul', 'spain', 'netherlands', 'germany'], [2014, 'Brasil', 'germany', 'argentina', 'netherlands'], [2018, 'Rússia', 'france', 'croatia', 'belgium'],
    [2022, 'Catar', 'argentina', 'france', 'croatia'], [2026, 'EUA, México e Canadá', 'spain', 'argentina', 'england']
  ].map(([year, hosts, c, r, t]) => ({ year, hosts, real: true, p: { champion: 'sel-' + c, runnerUp: 'sel-' + r, third: 'sel-' + t } }));
  // histórico real até a primeira Copa simulada da série + as Copas simuladas; o ranking só traz quem já ficou no top 3
  function hall(d, series) {
    const sims = (d.cycles || []).filter(c => c.series === series).sort((a, b) => a.year - b.year).map(cy => ({ cy, year: cy.year, p: podium(d, cy) }));
    const first = sims.length ? sims[0].year : Infinity;
    const eds = [...HISTORY.filter(e => e.year < first), ...sims];
    const tally = {};
    const row = id => (tally[id] = tally[id] || { id, titles: [], second: 0, third: 0 });
    eds.forEach(({ year, p }) => {
      if (!p) return;
      row(p.champion).titles.push(year); row(p.runnerUp).second++; if (p.third) row(p.third).third++;
    });
    const rows = Object.values(tally).sort((a, b) => b.titles.length - a.titles.length || b.second - a.second || b.third - a.third || nm(a.id).localeCompare(nm(b.id)));
    return { eds, rows };
  }
  // deixa mais leve um ciclo já encerrado (tira a narração dos jogos; os placares ficam)
  function compact(d, cy) {
    compsOf(d, cy).forEach(c => Engine.allMatches(c).forEach(m => { delete m.ev; delete m.st; }));
  }
  function removeCycle(d, cy) {
    d.comps = d.comps.filter(c => c.cycle !== cy.id);
    d.cycles = d.cycles.filter(c => c !== cy);
  }

  return { CONFS, CUP_LOGO, TROPHY, MAX_HOSTS, LIMITS, confOf, members, allNations, suggestQuotas, validateQuotas, createCycle, status, sync, syncAll, isLocked, drawFinals, undrawFinals,
    stepAll, runStage, pending, prepare, nlState, importNL, ranking, baseRank, podium, hall, compact, removeCycle, compsOf, part, played };
})();
