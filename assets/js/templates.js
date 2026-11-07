/* Placar — modelos oficiais com regulamento (temporadas 2026 e 2026/27)
   Cada modelo: entries (clubes por papel), phases (ver reg.js), champion, outcomes, rules, notes, sources. */

const { TEMPLATES, TEMPLATE_GROUPS } = (() => {
const SLUG = {};
BASE_TEAMS.forEach(t => { if (t.logo) SLUG[t.logo.split('/').pop().replace('.png', '')] = t.id; });
const IDS = new Set(BASE_TEAMS.map(t => t.id));
const I = (...keys) => keys.flat().map(k => (IDS.has(k) ? k : SLUG[k] || k));
const LG = lg => BASE_TEAMS.filter(t => t.league === lg).map(t => t.id);

const Z = ZONE_COLORS;
const zone = (from, to, color, label) => ({ from, to, color, label });

// critérios de desempate (após pontos)
const TB = {
  BR: ['pts', 'w', 'gd', 'gf', 'h2h'],
  ENG: ['pts', 'gd', 'gf', 'h2h'],
  H2H: ['pts', 'h2h', 'gd', 'gf'],
  GER: ['pts', 'gd', 'gf', 'h2h'],
  FRA: ['pts', 'gd', 'gf', 'h2h'],
  POR: ['pts', 'h2h', 'gd', 'w', 'gf'],
  UEFA: ['pts', 'gd', 'gf', 'ag', 'w', 'aw'],
  CONMEBOL: ['pts', 'gd', 'gf', 'ag', 'h2h'],
  GD: ['pts', 'gd', 'gf'],
  RUS: ['pts', 'h2h', 'w', 'gd', 'gf'],
  GRE: ['pts', 'h2h', 'gd', 'gf', 'w', 'ag'],
  MLS: ['pts', 'w', 'gd', 'gf'],
  CHI: ['pts', 'gd', 'w', 'gf', 'ag'],
  VEN: ['pts', 'gd', 'gf', 'h2h', 'w', 'aw']
};
const TBL = {
  pts: 'pontos', w: 'vitórias', gd: 'saldo de gols', gf: 'gols marcados', ag: 'gols como visitante', aw: 'vitórias fora', h2h: 'confronto direto'
};

const league = (o = {}) => ({ type: 'rr', name: 'Pontos corridos', teams: { entry: 'main' }, legs: 2, tiebreak: TB.BR, ...o });
const SWISS_ZONES = [zone(1, 8, Z.lib, 'Oitavas de final'), zone(9, 24, Z.prelib, 'Playoff'), zone(25, 36, Z.rel, 'Eliminado')];
const SRC = {
  cbf: { t: 'CBF — Regulamentos das competições 2026', u: 'https://www.cbf.com.br/futebol-brasileiro/competicoes' }
};

const T_ = [];
const add = t => { T_.push({ icon: 'league', champion: { phase: 0 }, entries: { main: [] }, roles: { main: 'Clubes' }, ...t }); };

/* ============================ BRASIL ============================ */
add({
  id: 'brasileirao-2026', name: 'Brasileirão Série A 2026', group: 'Brasil', crest: 'assets/logos/brasileirao-serie-a.png',
  short: 'Pontos corridos · 20 clubes · 38 rodadas',
  entries: { main: LG('BRA-A') },
  phases: [league({ zones: [zone(1, 4, Z.lib, 'Libertadores (fase de grupos)'), zone(5, 5, Z.prelib, 'Libertadores (fase preliminar)'), zone(6, 11, Z.sula, 'Sul-Americana'), zone(17, 20, Z.rel, 'Rebaixamento')] })],
  outcomes: [{ label: 'Libertadores', src: { phase: 0, pos: [1, 5] } }, { label: 'Rebaixados para a Série B', src: { phase: 0, pos: [17, 20] }, color: Z.rel }],
  rules: ['20 clubes em turno e returno (38 rodadas); campeão é quem somar mais pontos.', 'Desempate: vitórias, saldo de gols, gols marcados, confronto direto, menos cartões vermelhos, menos amarelos, sorteio.',
    'Libertadores: 1º a 4º direto na fase de grupos, 5º na fase preliminar (mais o campeão e o vice da Copa do Brasil).', 'Sul-Americana: os seis seguintes que não forem à Libertadores (6º a 11º, em geral).', 'Os quatro últimos caem para a Série B.'],
  notes: ['Vagas extras da Copa do Brasil e cartões não são simulados.'],
  sources: [{ t: 'Wikipedia — 2026 Campeonato Brasileiro Série A', u: 'https://en.wikipedia.org/wiki/2026_Campeonato_Brasileiro_S%C3%A9rie_A' }, SRC.cbf]
});
add({
  id: 'serieb-2026', name: 'Brasileirão Série B 2026', group: 'Brasil', crest: 'assets/logos/brasileirao-serie-b.png', short: 'Pontos corridos + playoff de acesso · 20 clubes',
  entries: { main: LG('BRA-B') },
  phases: [
    league({ zones: [zone(1, 2, Z.up, 'Acesso direto'), zone(3, 6, Z.prelib, 'Playoff de acesso'), zone(17, 20, Z.rel, 'Rebaixamento')] }),
    { type: 'ko', name: 'Playoff de acesso', after: [0], teams: { phase: 0, pos: [3, 6] }, pairing: 'pairs', pairs: [[0, 3], [1, 2]], legs: 2, et: false, pens: false, better: true, maxRounds: 1, roundNames: ['Playoff'] }
  ],
  outcomes: [{ label: 'Acesso à Série A', src: { list: [{ phase: 0, pos: [1, 2] }, { phase: 1, winners: true }] } }, { label: 'Rebaixados para a Série C', src: { phase: 0, pos: [17, 20] }, color: Z.rel }],
  rules: ['Turno e returno (38 rodadas). O 1º e o 2º sobem direto.', 'Playoff de acesso: 3º × 6º e 4º × 5º, em ida e volta; o melhor colocado decide em casa.',
    'Empate no agregado: sobe o clube de melhor campanha (sem prorrogação nem pênaltis). Não há final entre os vencedores.', 'Desempate na tabela: vitórias, saldo, gols marcados, confronto direto.', 'Os quatro últimos caem para a Série C.'],
  sources: [{ t: 'CNN Brasil — Como funciona o playoff de acesso da Série B', u: 'https://www.cnnbrasil.com.br/esportes/brasileirao/serie-b-na-reta-final-entenda-como-funciona-o-playoff-de-acesso/' }, { t: 'Wikipedia — 2026 Campeonato Brasileiro Série B', u: 'https://en.wikipedia.org/wiki/2026_Campeonato_Brasileiro_S%C3%A9rie_B' }]
});
add({
  id: 'seriec-2026', name: 'Brasileirão Série C 2026', group: 'Brasil', crest: 'assets/logos/brasileirao-serie-c.png', icon: 'groups', short: 'Turno único + quadrangulares + final · 20 clubes',
  entries: { main: LG('BRA-C') }, champion: { phase: 2 },
  phases: [
    league({ name: '1ª fase', legs: 1, zones: [zone(1, 8, Z.up, '2ª fase'), zone(19, 20, Z.rel, 'Rebaixamento')] }),
    { type: 'rr', name: '2ª fase', after: [0], teams: { phase: 0, pos: [1, 8] }, groups: { method: 'pattern', pattern: [[0, 3, 4, 7], [1, 2, 5, 6]], names: ['Grupo B', 'Grupo C'] }, legs: 2, tiebreak: TB.BR, zonesEach: [zone(1, 2, Z.up, 'Acesso à Série B')] },
    { type: 'ko', name: 'Final', after: [1], teams: { phase: 1, perGroup: [1, 1] }, seedBy: { campaign: [0, 1] }, legs: 2, et: false, pens: true }
  ],
  outcomes: [{ label: 'Acesso à Série B', src: { phase: 1, perGroup: [1, 2] } }, { label: 'Rebaixados para a Série D', src: { phase: 0, pos: [19, 20] }, color: Z.rel }],
  rules: ['1ª fase: 20 clubes em turno único (19 rodadas). Os 8 primeiros avançam; os 2 últimos caem para a Série D.',
    '2ª fase: dois grupos de quatro (1º, 4º, 5º e 8º em um; 2º, 3º, 6º e 7º no outro), em ida e volta.', 'Os dois primeiros de cada grupo sobem para a Série B; os líderes fazem a final.',
    'Desempate: vitórias, saldo, gols marcados (na 2ª fase, confronto direto entre dois clubes).'],
  notes: ['Final em ida e volta com pênaltis no empate; a melhor campanha decide em casa (formato da final não detalhado nas fontes).'],
  sources: [{ t: 'Wikipedia — 2026 Campeonato Brasileiro Série C', u: 'https://en.wikipedia.org/wiki/2026_Campeonato_Brasileiro_S%C3%A9rie_C' }, { t: 'Arena Correio — Regulamento da Série C 2026', u: 'https://arenacorreio.com.br/cbf-define-regulamento-da-serie-c-2026-ultima-edicao-com-20-equipes/' }]
});
add({
  id: 'seried-2026', name: 'Brasileirão Série D 2026', group: 'Brasil', crest: 'assets/logos/brasileirao-serie-d.png', icon: 'groups', short: '96 clubes · 16 grupos + mata-mata · 6 acessos',
  entries: { main: LG('BRA-D') }, champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase de grupos', teams: { entry: 'main' }, groups: { count: 16, byRating: true }, legs: 2, tiebreak: TB.BR, zonesEach: [zone(1, 4, Z.up, 'Mata-mata')] },
    { type: 'ko', name: 'Mata-mata', after: [0], pairing: 'crossGroups', teams: { phase: 0, groupTop: 4 }, legs: 2, et: false, pens: true, seedBy: { campaign: [0, 1] }, reseedAt: 3 },
    { type: 'ko', name: 'Playoffs de acesso', after: [{ phase: 1, round: 3 }], teams: { phase: 1, roundLosers: 3, sortBy: { campaign: [0, 1] } }, pairing: 'pairs', pairs: [[0, 3], [1, 2]], legs: 2, et: false, pens: false, better: true, maxRounds: 1, roundNames: ['Playoff'] }
  ],
  outcomes: [{ label: 'Acesso à Série C', src: { list: [{ phase: 1, roundParticipants: 4 }, { phase: 2, winners: true }] } }],
  rules: ['96 clubes em 16 grupos de seis, em turno e returno (10 jogos). Os 4 primeiros de cada grupo avançam (64 clubes).',
    'Mata-mata em ida e volta desde a 2ª fase; empate no agregado vai direto aos pênaltis (sem prorrogação).', 'A partir das quartas, os confrontos seguem a campanha geral; quem tem melhor campanha decide em casa.',
    'Acesso: os quatro semifinalistas sobem; os quatro eliminados nas quartas jogam playoffs (ida e volta, melhor campanha avança no empate) pelas duas últimas vagas.'],
  notes: ['Os grupos reais são regionais; aqui são sorteados por potes de força. Os cruzamentos da 2ª fase usam grupos vizinhos (1º × 4º, 2º × 3º).'],
  sources: [{ t: 'Wikipedia — 2026 Campeonato Brasileiro Série D', u: 'https://en.wikipedia.org/wiki/2026_Campeonato_Brasileiro_S%C3%A9rie_D' }, { t: 'O Curioso do Futebol — Regulamento da Série D 2026', u: 'https://www.ocuriosodofutebol.com.br/2026/02/regulamento-serie-d-2026-96-clubes-formato-cbf.html' }]
});

add({
  id: 'nordeste-2026', name: 'Copa do Nordeste 2026', group: 'Brasil', crest: 'assets/logos/lg-copa-do-nordeste.png', icon: 'groups', short: '20 clubes · 4 grupos (A×B, C×D) + mata-mata',
  entries: {
    gA: I('vitoria', 'asa-al', 'sousa', 'itabaiana', 'fluminense-pi'), gB: I('juazeirense', 'crb', 'botafogo-pb', 'confianca', 'piaui'),
    gC: I('ceara', 'sport', 'america-rn', 'imperatriz', 'ferroviario-ce'), gD: I('fortaleza', 'retro', 'abc-fc', 'maranhao', 'jacuipense')
  },
  roles: { gA: 'Grupo A', gB: 'Grupo B', gC: 'Grupo C', gD: 'Grupo D' }, champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase de grupos', groups: { method: 'roles', roles: ['gA', 'gB', 'gC', 'gD'], names: ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D'] }, cross: true, tiebreak: ['pts', 'w', 'gd', 'gf'], zonesEach: [zone(1, 2, Z.lib, 'Quartas de final')] },
    { type: 'ko', name: 'Mata-mata', after: [0], teams: { list: [0, 1, 2, 3].map(g => ({ phase: 0, group: g, pos: [1, 2] })) }, pairing: 'pairs', pairs: [[0, 5], [6, 3], [2, 7], [4, 1]],
      seedBy: { campaign: [0, 1] }, legs: 2, et: false, pens: true, roundsCfg: [{ legs: 1 }], roundNames: ['Quartas de final', 'Semifinal', 'Final'] }
  ],
  rules: ['20 clubes em quatro grupos de cinco. Os grupos se enfrentam cruzados, em turno único: cada clube do A joga contra os cinco do B, e cada clube do C contra os cinco do D (5 jogos). Clubes dos grupos A e C fazem três jogos em casa.',
    'A classificação é por grupo; os dois primeiros de cada um avançam.', 'Desempate: vitórias, saldo de gols, gols marcados, menos cartões vermelhos, menos amarelos, sorteio.',
    'Quartas em jogo único na casa do melhor colocado: 1º A × 2º C, 1º B × 2º D, 1º C × 2º A, 1º D × 2º B. Empate vai direto aos pênaltis.',
    'Semifinais (vencedores de 1ºA×2ºC contra 1ºD×2ºB, e de 1ºB×2ºD contra 1ºC×2ºA) e final em ida e volta, sem gol fora nem prorrogação; empate no agregado vai aos pênaltis. A melhor campanha decide em casa.',
    'O campeão ganha vaga na 3ª fase da Copa do Brasil.'],
  notes: ['Grupos reais do sorteio de 3 de março de 2026 (dá para trocar qualquer clube antes de criar). Cartões não são simulados.'],
  sources: [{ t: 'Wikipedia — 2026 Copa do Nordeste', u: 'https://en.wikipedia.org/wiki/2026_Copa_do_Nordeste' }, { t: 'TNH1 — Copa do Nordeste 2026: grupos, formato e datas', u: 'https://www.tnh1.com.br/noticia/nid/copa-do-nordeste-2026-veja-os-grupos-o-formato-e-as-datas/' }]
});
add({
  id: 'sulsudeste-2026', name: 'Copa Sul-Sudeste 2026', group: 'Brasil', crest: 'assets/logos/lg-copa-sul-sudeste.png', icon: 'groups', short: '12 clubes · 2 grupos (A×B) + semifinal e final',
  entries: {
    gA: I('caxias', 'chapecoense', 'cianorte', 'novorizontino', 'sampaio-correa-rj', 'tombense'),
    gB: I('america-mg', 'avai', 'juventude', 'operario', 'sao-bernardo', 'volta-redonda')
  },
  roles: { gA: 'Grupo A', gB: 'Grupo B' }, champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase de grupos', groups: { method: 'roles', roles: ['gA', 'gB'], names: ['Grupo A', 'Grupo B'] }, cross: true, tiebreak: ['pts', 'w', 'gd', 'gf'], zonesEach: [zone(1, 2, Z.lib, 'Semifinal')] },
    { type: 'ko', name: 'Mata-mata', after: [0], teams: { list: [{ phase: 0, group: 0, pos: [1, 2] }, { phase: 0, group: 1, pos: [1, 2] }] }, pairing: 'pairs', pairs: [[0, 1], [2, 3]],
      seedBy: { campaign: [0, 1] }, legs: 2, et: false, pens: true, roundNames: ['Semifinal', 'Final'] }
  ],
  rules: ['12 clubes de SP, RJ, MG, PR, SC e RS (dois por estado), em dois grupos de seis. Cada clube enfrenta os seis do outro grupo em turno único (3 jogos em casa e 3 fora); não há jogos dentro do grupo.',
    'A classificação é por grupo; os dois primeiros avançam.', 'Desempate: vitórias, saldo de gols, gols marcados, menos cartões vermelhos, menos amarelos, sorteio.',
    'Semifinais entre os classificados do mesmo grupo (1º A × 2º A e 1º B × 2º B), em ida e volta, com a volta na casa do 1º colocado. Empate no agregado vai aos pênaltis.',
    'Final em ida e volta; a melhor campanha decide em casa; empate vai aos pênaltis.', 'O campeão ganha vaga na 3ª fase da Copa do Brasil de 2027.'],
  notes: ['Primeira edição da competição. Grupos reais do sorteio (o Caxias entrou no lugar do Internacional, que desistiu). Cartões não são simulados.'],
  sources: [{ t: 'CBF — Regulamento Específico da Copa Sul-Sudeste 2026', u: 'https://files.clicrdc.com.br/wp-content/uploads/2026/03/REC_COPA_SUL_SUDESTE_2026_96e5c88253-1.pdf' }, { t: 'Wikipedia — 2026 Copa Sul-Sudeste', u: 'https://en.wikipedia.org/wiki/2026_Copa_Sul-Sudeste' }, { t: 'Jornal Grande Bahia — Grupos, formato e datas da Copa Sul-Sudeste', u: 'https://jornalgrandebahia.com.br/?p=1329805' }]
});

/* ======================== AMÉRICA DO SUL ======================== */
const LIB = I('flamengo', 'estudiantes-de-la-plata', 'cusco', 'independiente-medellin', 'nacional', 'universitario-peru', 'coquimbo-unido', 'deportes-tolima', 'fluminense', 'bolivar',
  'deportivo-la-guaira', 'independiente-rivadavia', 'boca-juniors', 'cruzeiro', 'universidad-catolica', 'barcelona-sc-guayaquil', 'penarol', 'corinthians', 'independiente-santa-fe',
  'atletico-platense', 'palmeiras', 'cerro-porteno', 'atletico-junior', 'sporting-cristal', 'ldu-quito', 'lanus', 'always-ready', 'mirassol-fc', 'independiente-del-valle', 'club-libertad',
  'rosario-central', 'universidad-central');
add({
  id: 'libertadores-2026', name: 'Copa Libertadores 2026', group: 'América do Sul', crest: 'assets/logos/copa-libertadores.png', icon: 'groups', short: '32 clubes · 8 grupos + mata-mata · final única',
  entries: { main: LIB }, champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase de grupos', teams: { entry: 'main' }, groups: { count: 8, byRating: true }, legs: 2, tiebreak: TB.CONMEBOL, zonesEach: [zone(1, 2, Z.lib, 'Oitavas de final'), zone(3, 3, Z.sula, 'Playoffs da Sul-Americana')] },
    { type: 'ko', name: 'Mata-mata', after: [0], teams: { phase: 0, perGroup: [1, 2] }, pairing: 'wr', legs: 2, et: false, pens: true, final: { legs: 1, neutral: true, et: true, pens: true } }
  ],
  outcomes: [{ label: '3ºs colocados (vão à Sul-Americana)', src: { phase: 0, perGroup: [3, 3] }, color: Z.sula }],
  rules: ['Fase de grupos: 8 grupos de 4, em ida e volta. Os dois primeiros avançam; o 3º vai aos playoffs da Sul-Americana.',
    'Oitavas: os 1ºs (cabeças 1 a 8, pela campanha) enfrentam os 2ºs (9 a 16) por sorteio; o 1º decide em casa.', 'Mata-mata em ida e volta; empate no agregado vai direto aos pênaltis, sem prorrogação. Não existe gol fora.',
    'Final em jogo único em campo neutro (Montevidéu, 2026), com prorrogação e pênaltis.', 'Desempate nos grupos: pontos, saldo, gols marcados, gols fora.'],
  notes: ['As três fases preliminares não são simuladas; o modelo começa na fase de grupos. Os potes do sorteio usam o ranking do site.'],
  sources: [{ t: 'Wikipedia — 2026 Copa Libertadores', u: 'https://en.wikipedia.org/wiki/2026_Copa_Libertadores' }]
});
const SULA = I('america-de-cali', 'tigre', 'cd-macara', 'alianza-atletico', 'atletico-mineiro', 'cienciano-del-cusco', 'academia-puerto-cabello', 'juventud', 'sao-paulo', 'millonarios',
  'boston-river', 'ohiggins', 'santos-fc', 'san-lorenzo', 'deportivo-cuenca', 'deportivo-recoleta', 'racing-club', 'caracas', 'independiente-petrolero', 'botafogo', 'gremio', 'palestino',
  'montevideo-city-torque', 'deportivo-riestra', 'olimpia', 'vasco-da-gama', 'audax-italiano', 'barracas-central', 'river-plate', 'rb-bragantino', 'blooming', 'carabobo');
add({
  id: 'sudamericana-2026', name: 'Copa Sul-Americana 2026', group: 'América do Sul', crest: 'assets/logos/copa-sudamericana.png', icon: 'groups', short: '32 clubes + 8 da Libertadores · grupos + mata-mata',
  entries: { main: SULA, guests: I('universidad-central', 'deportivo-la-guaira', 'cusco', 'always-ready', 'coquimbo-unido', 'independiente-medellin', 'bolivar', 'barcelona-sc-guayaquil') },
  roles: { main: 'Fase de grupos', guests: '3ºs colocados da Libertadores (entram nos playoffs)' }, champion: { phase: 2 },
  phases: [
    { type: 'rr', name: 'Fase de grupos', teams: { entry: 'main' }, groups: { count: 8, byRating: true }, legs: 2, tiebreak: TB.CONMEBOL, zonesEach: [zone(1, 1, Z.lib, 'Oitavas de final'), zone(2, 2, Z.prelib, 'Playoffs')] },
    { type: 'ko', name: 'Playoffs', after: [0], confirm: { role: 'guests', label: '3ºs colocados da Libertadores', count: 8 }, teams: { list: [{ phase: 0, perGroup: [2, 2] }, { entry: 'guests' }] }, pairing: 'halves', legs: 2, et: false, pens: true, maxRounds: 1, roundNames: ['Playoffs'] },
    { type: 'ko', name: 'Mata-mata', after: [1], teams: { list: [{ phase: 0, perGroup: [1, 1] }, { phase: 1, winners: true }] }, pairing: 'wr', legs: 2, et: false, pens: true, final: { legs: 1, neutral: true, et: true, pens: true } }
  ],
  rules: ['Fase de grupos: 8 grupos de 4 em ida e volta. O 1º vai às oitavas; o 2º joga os playoffs.', 'Playoffs: 2ºs colocados (9 a 16) × 3ºs da Libertadores (17 a 24), ida e volta; o 2º colocado decide em casa.',
    'Oitavas: líderes dos grupos × vencedores dos playoffs; o líder decide em casa.', 'Mata-mata em ida e volta, sem prorrogação: empate vai aos pênaltis.', 'Final única em campo neutro (Barranquilla, 2026), com prorrogação e pênaltis.'],
  notes: ['A 1ª fase (16 jogos únicos entre clubes do mesmo país) não é simulada. Os 3ºs da Libertadores são escolhidos por você: na criação e de novo antes dos playoffs (dá para importar os 3ºs de uma Libertadores salva).'],
  sources: [{ t: 'Wikipedia — 2026 Copa Sudamericana', u: 'https://en.wikipedia.org/wiki/2026_Copa_Sudamericana' }]
});
add({
  id: 'argentina-clausura-2026', name: 'Torneo Clausura 2026 (Argentina)', group: 'América do Sul', icon: 'groups', short: '30 clubes · 2 zonas + interzonais + mata-mata',
  entries: {
    zoneA: I('boca-juniors', 'independiente', 'san-lorenzo', 'deportivo-riestra', 'talleres', 'instituto-cordoba', 'atletico-platense', 'velez-sarsfield', 'estudiantes-de-la-plata', 'gimnasia-y-esgrima', 'lanus', 'newells-old-boys', 'defensa-y-justicia', 'central-cordoba-se', 'union'),
    zoneB: I('river-plate', 'racing-club', 'huracan', 'barracas-central', 'belgrano', 'estudiantes-de-rio-cuarto', 'argentinos-juniors', 'tigre', 'gimnasia-y-esgrima-lp', 'independiente-rivadavia', 'banfield', 'rosario-central', 'aldosivi', 'atletico-tucuman', 'sarmiento')
  },
  roles: { zoneA: 'Zona A', zoneB: 'Zona B' }, champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase regular', groups: { method: 'roles', roles: ['zoneA', 'zoneB'], names: ['Zona A', 'Zona B'] }, legs: 1, inter: 2, tiebreak: ['pts', 'gd', 'gf', 'h2h'], zonesEach: [zone(1, 8, Z.lib, 'Octavos de final')] },
    { type: 'ko', name: 'Fase final', after: [0], pairing: 'crossGroups', teams: { phase: 0, groupTop: 8 }, legs: 1, et: false, pens: true, final: { legs: 1, neutral: true, et: true, pens: true } }
  ],
  rules: ['30 clubes em duas zonas de 15: todos contra todos na zona (14 jogos) mais 2 rodadas interzonais (clássico + sorteio).', 'Os 8 primeiros de cada zona vão às oitavas, cruzadas (1º A × 8º B, 2º A × 7º B...).',
    'Mata-mata em jogo único na casa do melhor colocado; empate vai aos pênaltis.', 'Final em estádio neutro.'],
  notes: ['Os jogos interzonais são sorteados. Descensos (tabela anual e promedios) dependem do ano inteiro e não são simulados.'],
  sources: [{ t: 'ESPN — Como será o formato dos torneios do futebol argentino 2026', u: 'https://espndeportes.espn.com/futbol/argentina/nota/_/id/15982654/como-sera-formato-torneos-futbol-argentino-2026-afa' }, { t: 'La Nación — Zonas A e B de 2026', u: 'https://www.lanacion.com.ar/deportes/futbol/las-zonas-a-y-b-del-apertura-y-clausura-2026-asi-quedaron-los-grupos-de-la-proxima-liga-profesional-nid10122025/' }]
});
add({
  id: 'colombia-2026-2', name: 'Liga BetPlay 2026-II (Colômbia)', group: 'América do Sul', crest: 'assets/logos/liga-betplay.png', icon: 'groups', short: '20 clubes · turno único + quadrangulares + final',
  entries: { main: LG('COL') }, champion: { phase: 2 },
  phases: [
    league({ name: 'Todos contra todos', legs: 1, tiebreak: ['pts', 'gd', 'gf', 'ag'], zones: [zone(1, 8, Z.lib, 'Quadrangulares')] }),
    { type: 'rr', name: 'Quadrangulares', after: [0], teams: { phase: 0, pos: [1, 8] }, groups: { count: 2, fixedFirst: true }, legs: 2, tiebreak: ['pts', 'gd', 'gf', 'ag'], zonesEach: [zone(1, 1, Z.lib, 'Final')] },
    { type: 'ko', name: 'Final', after: [1], teams: { phase: 1, perGroup: [1, 1] }, seedBy: { campaign: [0, 1] }, legs: 2, et: false, pens: true }
  ],
  rules: ['Fase regular em turno único (19 rodadas). Os 8 primeiros vão aos quadrangulares.', 'Quadrangulares: dois grupos de 4 em ida e volta; o 1º e o 2º da fase regular são cabeças de chave e os demais são sorteados por potes (3º/4º, 5º/6º, 7º/8º).',
    'Os líderes dos grupos fazem a final em ida e volta, com pênaltis no empate.'],
  notes: ['O rebaixamento na Colômbia usa a tabela de promedios de vários anos e não é simulado.'],
  sources: [{ t: 'Noticias Caracol — Liga BetPlay II-2026 e a volta dos quadrangulares', u: 'https://www.noticiascaracol.com/golcaracol/futbol-colombiano/todo-lo-que-debe-saber-de-la-liga-betplay-ii-2026-nuevas-reglas-y-regreso-de-cuadrangulares-so35' }]
});
add({
  id: 'peru-2026', name: 'Liga 1 2026 (Peru)', group: 'América do Sul', crest: 'assets/logos/liga-1-peru.png', icon: 'groups', short: 'Apertura + Clausura + acumulada + playoffs · 18 clubes',
  entries: { main: LG('PER') }, champion: { phase: 3 },
  phases: [
    league({ name: 'Apertura', legs: 1, tiebreak: TB.GD, zones: [zone(1, 1, Z.lib, 'Campeão do Apertura')] }),
    { type: 'rr', name: 'Clausura', after: [0], mirror: 0, teams: { entry: 'main' }, tiebreak: TB.GD, zones: [zone(1, 1, Z.lib, 'Campeão do Clausura')] },
    { type: 'agg', name: 'Tabela acumulada', after: [1], sources: [0, 1], tiebreak: ['pts', 'gd', 'gf', 'h2h'], zones: [zone(1, 2, Z.lib, 'Libertadores'), zone(17, 18, Z.rel, 'Rebaixamento')] },
    { type: 'ko', name: 'Playoffs', after: [2], autoIfSame: [{ phase: 0, pos: [1, 1] }, { phase: 1, pos: [1, 1] }], teams: { uniqueFill: [{ phase: 0, pos: [1, 1] }, { phase: 1, pos: [1, 1] }], from: { phase: 2, pos: [1, 18] }, count: 4 }, seedBy: { phase: 2 }, pairing: 'pairs', pairs: [[0, 3], [1, 2]], legs: 2, et: false, pens: true }
  ],
  outcomes: [{ label: 'Rebaixados para a Liga 2', src: { phase: 2, pos: [17, 18] }, color: Z.rel }],
  rules: ['Apertura e Clausura em turno único (17 rodadas cada); o Clausura repete os jogos com mando invertido.', 'A tabela acumulada define Libertadores, Sul-Americana e os dois rebaixados.',
    'Playoffs: campeões do Apertura e do Clausura + os dois melhores da acumulada, em semifinais e final de ida e volta (pênaltis no empate).', 'Se o mesmo clube vencer Apertura e Clausura, é campeão direto.'],
  notes: ['As exceções do regulamento (bye do campeão que também estiver entre os 2 melhores da acumulada) foram simplificadas: sempre há semifinais.'],
  sources: [{ t: 'Wikipedia — 2026 Liga 1 (Peru)', u: 'https://en.wikipedia.org/wiki/2026_Liga_1_(Peru)' }]
});
add({
  id: 'bolivia-2026', name: 'División Profesional 2026 (Bolívia)', group: 'América do Sul', crest: 'assets/logos/liga-bolivia.png', short: 'Pontos corridos · 16 clubes · 30 rodadas',
  entries: { main: LG('BOL') },
  phases: [league({ tiebreak: TB.GD, zones: [zone(1, 2, Z.lib, 'Libertadores'), zone(15, 15, Z.prelib, 'Playoff de rebaixamento'), zone(16, 16, Z.rel, 'Rebaixamento')] })],
  rules: ['16 clubes em turno e returno; campeão por pontos corridos.', 'Campeão e vice vão à Libertadores.', 'O último cai; o penúltimo disputa um playoff contra o vice da Copa Simón Bolívar.'],
  notes: ['Formato baseado na edição 2025; o playoff contra a segunda divisão não é simulado.'],
  sources: [{ t: 'Surf Wiki — 2025 FBF División Profesional', u: 'https://www.doc.surf/wiki/2025-fbf-division-profesional' }]
});
const venPhases = (off, label) => [
  { type: 'rr', name: `${label}`, after: off ? [off - 1] : [], mirror: off ? 0 : undefined, teams: { entry: 'main' }, legs: 1, tiebreak: TB.VEN, zones: [zone(1, 8, Z.lib, 'Fase final')] },
  { type: 'rr', name: `${label} · grupos`, after: [off], teams: { phase: off, pos: [1, 8] }, groups: { count: 2, fixedFirst: true }, legs: 2, tiebreak: TB.VEN, zonesEach: [zone(1, 1, Z.lib, 'Final')] },
  { type: 'ko', name: `Final do ${label}`, after: [off + 1], teams: { phase: off + 1, perGroup: [1, 1] }, seedBy: { campaign: [off, off + 1] }, legs: 2, et: false, pens: true }
];
add({
  id: 'venezuela-2026', name: 'Liga FUTVE 2026 (Venezuela)', group: 'América do Sul', crest: 'assets/logos/liga-futve.png', icon: 'groups', short: 'Apertura + Clausura + grande final · 14 clubes',
  entries: { main: LG('VEN') }, champion: { phase: 6 },
  phases: [
    ...venPhases(0, 'Apertura'), ...venPhases(3, 'Clausura'),
    { type: 'ko', name: 'Grande final', after: [2, 5], autoIfSame: [{ phase: 2, winner: true }, { phase: 5, winner: true }], teams: { list: [{ phase: 2, winner: true }, { phase: 5, winner: true }] }, legs: 2, et: false, pens: true },
    { type: 'agg', name: 'Tabela acumulada', after: [3], sources: [0, 3], tiebreak: TB.VEN, zones: [zone(14, 14, Z.rel, 'Rebaixamento')] }
  ],
  rules: ['Apertura e Clausura com fase regular em turno único (13 rodadas). Os 8 primeiros formam dois grupos de 4 (1º e 2º cabeças de chave), em ida e volta.',
    'Os líderes dos grupos decidem o torneio. Campeão do Apertura × campeão do Clausura fazem a grande final da temporada.', 'A tabela acumulada das fases regulares rebaixa o último colocado.'],
  sources: [{ t: 'Wikipedia — 2026 Liga FUTVE', u: 'https://en.wikipedia.org/wiki/2026_Liga_FUTVE' }]
});
add({
  id: 'ecuador-2026', name: 'LigaPro Serie A 2026 (Equador)', group: 'América do Sul', crest: 'assets/logos/ligapro-equador.png', icon: 'groups', short: '16 clubes · 30 rodadas + hexagonais',
  entries: { main: LG('ECU') }, champion: { phase: 1, group: 0 },
  phases: [
    league({ name: '1ª fase', tiebreak: TB.CONMEBOL, zones: [zone(1, 6, Z.lib, 'Hexagonal do título'), zone(7, 10, Z.sula, 'Quadrangular da Sul-Americana'), zone(11, 16, Z.rel, 'Hexagonal do rebaixamento')] }),
    { type: 'rr', name: 'Fase final', after: [0], teams: { phase: 0, pos: [1, 16] }, groups: { method: 'pattern', pattern: [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9], [10, 11, 12, 13, 14, 15]], names: ['Hexagonal do título', 'Quadrangular da Sul-Americana', 'Hexagonal do rebaixamento'] },
      legs: 2, carry: { phase: 0, factors: [1, 1, 1] }, tiebreak: TB.CONMEBOL, groupZones: [[zone(1, 1, Z.lib, 'Campeão')], [zone(1, 1, Z.sula, 'Sul-Americana')], [zone(5, 6, Z.rel, 'Rebaixamento')]] }
  ],
  outcomes: [{ label: 'Rebaixados para a Serie B', src: { phase: 1, group: 2, pos: [5, 6] }, color: Z.rel }],
  rules: ['1ª fase em turno e returno (30 rodadas).', 'Depois, os clubes são divididos mantendo pontos e números: hexagonal do título (1º–6º), quadrangular da Sul-Americana (7º–10º) e hexagonal do rebaixamento (11º–16º), todos em ida e volta.',
    'O líder do hexagonal do título é campeão; os dois últimos do hexagonal de baixo caem.', 'Desempate: pontos, saldo, gols marcados, gols fora, confronto direto.'],
  sources: [{ t: 'Wikipedia — 2026 LigaPro Serie A', u: 'https://en.wikipedia.org/wiki/2026_LigaPro_Serie_A' }]
});
add({
  id: 'uruguay-2026', name: 'Campeonato Uruguaio 2026', group: 'América do Sul', icon: 'groups', short: 'Apertura + Intermedio + Clausura + playoff · 16 clubes',
  entries: { main: LG('URU') }, champion: { phase: 6 },
  phases: [
    league({ name: 'Apertura', legs: 1, tiebreak: TB.GD, zones: [zone(1, 1, Z.lib, 'Campeão do Apertura')] }),
    { type: 'rr', name: 'Intermedio', after: [0], teams: { phase: 0, pos: [1, 16] }, groups: { method: 'pattern', pattern: [[0, 3, 4, 7, 8, 11, 12, 15], [1, 2, 5, 6, 9, 10, 13, 14]], names: ['Série A', 'Série B'] }, legs: 1, tiebreak: TB.GD, zonesEach: [zone(1, 1, Z.lib, 'Final do Intermedio')] },
    { type: 'ko', name: 'Final do Intermedio', after: [1], teams: { phase: 1, perGroup: [1, 1] }, legs: 1, neutral: true, et: false, pens: true },
    { type: 'rr', name: 'Clausura', after: [2], mirror: 0, teams: { entry: 'main' }, tiebreak: TB.GD, zones: [zone(1, 1, Z.lib, 'Campeão do Clausura')] },
    { type: 'agg', name: 'Tabela anual', after: [3], sources: [0, 1, 3], tiebreak: TB.GD, zones: [zone(1, 1, Z.lib, 'Final do campeonato')] },
    { type: 'ko', name: 'Semifinal', after: [4], autoIfSame: [{ phase: 0, pos: [1, 1] }, { phase: 3, pos: [1, 1] }], teams: { list: [{ phase: 0, pos: [1, 1] }, { phase: 3, pos: [1, 1] }] }, legs: 1, neutral: true, et: true, pens: true },
    { type: 'ko', name: 'Final', after: [5], autoIfSame: [{ phase: 4, pos: [1, 1] }, { phase: 5, winner: true }], teams: { list: [{ phase: 4, pos: [1, 1] }, { phase: 5, winner: true }] }, legs: 2, et: false, pens: true }
  ],
  rules: ['Apertura e Clausura em turno único (15 rodadas). No meio, o Intermedio divide os 16 em duas séries de 8 pela posição no Apertura, com final em jogo único.',
    'Semifinal (jogo único): campeão do Apertura × campeão do Clausura.', 'Final (ida e volta): vencedor da semifinal × líder da Tabela Anual (Apertura + Intermedio + Clausura).', 'Se o mesmo clube ocupar as duas vagas de uma decisão, avança/é campeão direto.'],
  notes: ['O rebaixamento no Uruguai usa a média de pontos de duas temporadas e não é simulado.'],
  sources: [{ t: 'RSSSF — Uruguay 2026', u: 'https://rsssf.org/tablesu/uru2026.html' }]
});

/* ======================== LIGAS EUROPEIAS ======================== */
const europe = (n, ucl, rel, extra = []) => [zone(1, ucl, Z.ucl, 'Champions League'), zone(ucl + 1, ucl + 1, Z.uel, 'Europa League'), zone(ucl + 2, ucl + 2, Z.uecl, 'Conference League'), ...extra, zone(n - rel + 1, n, Z.rel, 'Rebaixamento')];
const tbText = tb => tb.slice(1).map(k => TBL[k]).join(', ');
const simpleLeague = (id, name, group, lg, tb, zones, rules, sources, extra = {}) => add({
  id, name, group, short: `Pontos corridos · ${LG(lg).length} clubes · ${(LG(lg).length - 1) * 2} rodadas`, entries: { main: LG(lg) },
  phases: [league({ tiebreak: tb, zones })], rules: [...rules, `Desempate após pontos: ${tbText(tb)}.`], sources, ...extra
});
simpleLeague('premier-2627', 'Premier League 2026/27', 'Ligas europeias', 'ENG', TB.ENG, europe(20, 4, 3), ['20 clubes, turno e returno (38 rodadas).', 'Os 4 primeiros vão à Champions; os 3 últimos caem.'], [{ t: 'Premier League — Handbook', u: 'https://www.premierleague.com/publications' }], { crest: 'assets/logos/premier-league.png' });
simpleLeague('laliga-2627', 'LaLiga 2026/27', 'Ligas europeias', 'ESP', TB.H2H, europe(20, 4, 3), ['20 clubes, 38 rodadas.', 'Em caso de empate, vale primeiro o confronto direto.'], [{ t: 'LaLiga — Reglamento General', u: 'https://www.laliga.com/transparencia/normativa' }]);
simpleLeague('seriea-2627', 'Serie A 2026/27', 'Ligas europeias', 'ITA', TB.H2H, europe(20, 4, 3), ['20 clubes, 38 rodadas; confronto direto como 1º desempate.'], [{ t: 'Lega Serie A', u: 'https://www.legaseriea.it/' }],
  { notes: ['Empates em pontos pelo título ou pelo rebaixamento iriam a um jogo-desempate; aqui valem os critérios de tabela.'] });
simpleLeague('bundesliga-2627', 'Bundesliga 2026/27', 'Ligas europeias', 'GER', TB.GER, europe(18, 4, 2, [zone(16, 16, Z.uel, 'Playoff de rebaixamento')]), ['18 clubes, 34 rodadas.', 'O 16º joga playoff contra o 3º da 2. Bundesliga; 17º e 18º caem.'], [{ t: 'DFL', u: 'https://www.dfl.de/' }]);
simpleLeague('ligue1-2627', 'Ligue 1 2026/27', 'Ligas europeias', 'FRA', TB.FRA, europe(18, 3, 2, [zone(16, 16, Z.uel, 'Barragem')]), ['18 clubes, 34 rodadas.', 'O 16º disputa a barragem contra o vencedor dos playoffs da Ligue 2; 17º e 18º caem.'], [{ t: 'LFP', u: 'https://www.lfp.fr/' }]);
simpleLeague('portugal-2627', 'Liga Portugal 2026/27', 'Ligas europeias', 'POR', TB.POR, europe(18, 2, 2, [zone(16, 16, Z.uel, 'Playoff de rebaixamento')]), ['18 clubes, 34 rodadas.', 'O 16º joga playoff contra o 3º da Liga 2; 17º e 18º caem.'], [{ t: 'Liga Portugal', u: 'https://www.ligaportugal.pt/' }]);
simpleLeague('eredivisie-2627', 'Eredivisie 2026/27', 'Ligas europeias', 'NED', TB.GER, [zone(1, 1, Z.ucl, 'Champions League'), zone(2, 2, Z.ucl, 'Champions (3ª pré-eliminatória)'), zone(3, 3, Z.uel, 'Europa League (pré)'), zone(4, 4, Z.uecl, 'Playoffs europeus'), zone(16, 16, Z.uel, 'Playoff de rebaixamento'), zone(17, 18, Z.rel, 'Rebaixamento')],
  ['18 clubes, 34 rodadas.', 'O 16º vai ao playoff de rebaixamento; 17º e 18º caem.'], [{ t: 'Wikipedia — 2026–27 Eredivisie', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Eredivisie' }], { notes: ['Os playoffs europeus e o de rebaixamento envolvem clubes de fora e não são simulados.'] });
simpleLeague('russia-2627', 'Premier League Russa 2026/27', 'Ligas europeias', 'RUS', TB.RUS, [zone(1, 1, Z.lib, 'Campeão'), zone(13, 14, Z.uel, 'Playoff de rebaixamento'), zone(15, 16, Z.rel, 'Rebaixamento')],
  ['16 clubes, 30 rodadas.', '13º e 14º jogam playoffs (ida e volta) contra o 4º e o 3º da First League; 15º e 16º caem.'], [{ t: 'Wikipedia — 2026–27 Russian Premier League', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Russian_Premier_League' }]);
add({
  id: 'scotland-2627', name: 'Scottish Premiership 2026/27', group: 'Ligas europeias', icon: 'groups', short: '12 clubes · 33 rodadas + split · 38 jogos',
  entries: { main: LG('SCO') }, champion: { phase: 1, group: 0 },
  phases: [
    league({ name: '1ª fase (33 rodadas)', legs: 3, tiebreak: TB.ENG, zones: [zone(1, 6, Z.lib, 'Grupo do título'), zone(7, 12, Z.rel, 'Grupo de baixo')] }),
    { type: 'rr', name: 'Split', after: [0], teams: { phase: 0, pos: [1, 12] }, groups: { method: 'pattern', pattern: [[0, 1, 2, 3, 4, 5], [6, 7, 8, 9, 10, 11]], names: ['Grupo do título (1º–6º)', 'Grupo de baixo (7º–12º)'] }, legs: 1, carry: { phase: 0, factors: [1, 1] }, tiebreak: TB.ENG,
      groupZones: [[zone(1, 1, Z.ucl, 'Campeão · Champions'), zone(2, 2, Z.uecl, 'Conference League')], [zone(5, 5, Z.uel, '11º · playoff'), zone(6, 6, Z.rel, '12º · rebaixado')]] }
  ],
  rules: ['12 clubes jogam 33 rodadas (todos contra todos três vezes).', 'Depois do split, os 6 de cima e os 6 de baixo jogam mais 5 rodadas entre si, mantendo os pontos: ninguém de baixo passa quem está em cima.',
    'O 12º cai direto; o 11º vai ao playoff de rebaixamento.', 'Desempate: saldo de gols, gols marcados, confronto direto.'],
  sources: [{ t: 'Wikipedia — 2026–27 Scottish Premiership', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Scottish_Premiership' }]
});
add({
  id: 'greece-2627', name: 'Super League Grécia 2026/27', group: 'Ligas europeias', icon: 'groups', short: '14 clubes · 26 rodadas + playoffs',
  entries: { main: LG('GRE') }, champion: { phase: 1, group: 0 },
  phases: [
    league({ name: 'Temporada regular', tiebreak: TB.GRE, zones: [zone(1, 4, Z.lib, 'Playoff do título'), zone(5, 8, Z.prelib, 'Playoff europeu'), zone(9, 14, Z.rel, 'Playout')] }),
    { type: 'rr', name: 'Playoffs', after: [0], teams: { phase: 0, pos: [1, 14] }, groups: { method: 'pattern', pattern: [[0, 1, 2, 3], [4, 5, 6, 7], [8, 9, 10, 11, 12, 13]], names: ['Playoff do título (1º–4º)', 'Playoff europeu (5º–8º)', 'Playout (9º–14º)'] },
      legs: 2, carry: { phase: 0, factors: [1, 0.5, 1] }, tiebreak: TB.GRE, groupZones: [[zone(1, 1, Z.ucl, 'Campeão')], [zone(1, 1, Z.uecl, 'Conference League')], [zone(5, 6, Z.rel, 'Rebaixamento')]] }
  ],
  rules: ['Temporada regular em turno e returno (26 rodadas).', 'Playoff do título (1º–4º) e playoff europeu (5º–8º) em ida e volta (6 jogos); no playoff europeu cada clube começa com metade dos pontos.',
    'Playout (9º–14º) em ida e volta (10 jogos); os dois últimos caem.', 'Desempate: confronto direto, saldo, gols marcados.'],
  notes: ['Assumido que o playoff do título e o playout mantêm os pontos integrais (a fonte só confirma a metade dos pontos no 5º–8º).'],
  sources: [{ t: 'Wikipedia — 2026–27 Super League Greece', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Super_League_Greece' }, { t: 'Surf Wiki — 2025–26 Super League Greece', u: 'https://www.doc.surf/wiki/2025-26-super-league-greece' }]
});

/* =================== SEGUNDAS DIVISÕES (EUROPA) =================== */
add({
  id: 'championship-2627', name: 'Championship 2026/27', group: 'Segundas divisões', short: '24 clubes · 46 rodadas + playoffs',
  entries: { main: LG('ENG2') },
  phases: [
    league({ tiebreak: TB.ENG, zones: [zone(1, 2, Z.up, 'Acesso'), zone(3, 6, Z.prelib, 'Playoffs'), zone(22, 24, Z.rel, 'Rebaixamento')] }),
    { type: 'ko', name: 'Playoffs', after: [0], teams: { phase: 0, pos: [3, 6] }, pairing: 'pairs', pairs: [[0, 3], [1, 2]], legs: 2, et: true, pens: true, final: { legs: 1, neutral: true, et: true, pens: true } }
  ],
  outcomes: [{ label: 'Acesso à Premier League', src: { list: [{ phase: 0, pos: [1, 2] }, { phase: 1, winner: true }] } }, { label: 'Rebaixados', src: { phase: 0, pos: [22, 24] }, color: Z.rel }],
  rules: ['24 clubes, turno e returno (46 rodadas). 1º e 2º sobem.', 'Playoffs: 3º × 6º e 4º × 5º em ida e volta (o melhor colocado joga a volta em casa); final em Wembley, jogo único.', '22º, 23º e 24º caem.'],
  sources: [{ t: 'EFL — Play-offs', u: 'https://www.efl.com/' }]
});
add({
  id: 'laliga2-2627', name: 'LaLiga 2 2026/27', group: 'Segundas divisões', short: '22 clubes · 42 rodadas + playoffs',
  entries: { main: LG('ESP2') },
  phases: [
    league({ tiebreak: TB.H2H, zones: [zone(1, 2, Z.up, 'Acesso'), zone(3, 6, Z.prelib, 'Playoffs'), zone(19, 22, Z.rel, 'Rebaixamento')] }),
    { type: 'ko', name: 'Playoffs', after: [0], teams: { phase: 0, pos: [3, 6] }, pairing: 'pairs', pairs: [[0, 3], [1, 2]], legs: 2, et: true, pens: false, better: true }
  ],
  outcomes: [{ label: 'Acesso à LaLiga', src: { list: [{ phase: 0, pos: [1, 2] }, { phase: 1, winner: true }] } }, { label: 'Rebaixados', src: { phase: 0, pos: [19, 22] }, color: Z.rel }],
  rules: ['22 clubes, 42 rodadas. 1º e 2º sobem.', 'Playoffs entre 3º e 6º (semifinal e final em ida e volta). Empate no agregado após a prorrogação: avança o melhor colocado.', 'Os 4 últimos caem. Desempate: confronto direto, saldo, gols.'],
  notes: ['Times B (Real Sociedad B, Celta Fortuna) entram sem escudo.'],
  sources: [{ t: 'Wikipedia — 2026–27 Segunda División', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Segunda_Divisi%C3%B3n' }]
});
add({
  id: 'serieb-ita-2627', name: 'Serie B (Itália) 2026/27', group: 'Segundas divisões', short: '20 clubes · playoffs + playout',
  entries: { main: LG('ITA2') },
  phases: [
    league({ tiebreak: TB.H2H, zones: [zone(1, 2, Z.up, 'Acesso'), zone(3, 8, Z.prelib, 'Playoffs'), zone(16, 17, Z.uel, 'Playout'), zone(18, 20, Z.rel, 'Rebaixamento')] }),
    { type: 'ko', name: 'Playoffs · preliminar', after: [0], teams: { phase: 0, pos: [5, 8] }, pairing: 'pairs', pairs: [[0, 3], [1, 2]], legs: 1, et: true, pens: false, better: true, maxRounds: 1, roundNames: ['Preliminar'] },
    { type: 'ko', name: 'Playoffs · semifinal e final', after: [1], teams: { list: [{ phase: 0, pos: [3, 4] }, { phase: 1, winners: true, sortBy: { phase: 0 } }] }, pairing: 'pairs', pairs: [[0, 2], [1, 3]], legs: 2, et: false, pens: false, better: true },
    { type: 'ko', name: 'Playout', after: [0], teams: { phase: 0, pos: [16, 17] }, legs: 2, et: false, pens: false, better: true }
  ],
  outcomes: [{ label: 'Acesso à Serie A', src: { list: [{ phase: 0, pos: [1, 2] }, { phase: 2, winner: true }] } }, { label: 'Rebaixados', src: { list: [{ phase: 3, runnerUp: true }, { phase: 0, pos: [18, 20] }] }, color: Z.rel }],
  rules: ['20 clubes, 38 rodadas. 1º e 2º sobem.', 'Preliminar (jogo único, casa do melhor): 5º × 8º e 6º × 7º; empate após prorrogação classifica o melhor colocado.',
    'Semifinais e final em ida e volta; empate no agregado classifica o melhor colocado.', 'Playout: 16º × 17º em ida e volta; no empate, cai o pior colocado. 18º, 19º e 20º caem.'],
  notes: ['Se os finalistas tiverem a mesma pontuação na tabela, o regulamento prevê prorrogação e pênaltis — não simulado.'],
  sources: [{ t: 'Wikipedia — 2026–27 Serie B', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Serie_B' }]
});
simpleLeague('bundesliga2-2627', '2. Bundesliga 2026/27', 'Segundas divisões', 'GER2', TB.GER, [zone(1, 2, Z.up, 'Acesso'), zone(3, 3, Z.prelib, 'Playoff contra o 16º da Bundesliga'), zone(16, 16, Z.uel, 'Playoff contra o 3º da 3. Liga'), zone(17, 18, Z.rel, 'Rebaixamento')],
  ['18 clubes, 34 rodadas. 1º e 2º sobem.', 'O 3º joga playoff contra o 16º da Bundesliga; o 16º joga contra o 3º da 3. Liga.'], [{ t: 'Wikipedia — 2026–27 2. Bundesliga', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_2._Bundesliga' }]);
add({
  id: 'ligue2-2627', name: 'Ligue 2 2026/27', group: 'Segundas divisões', short: '18 clubes · 34 rodadas + playoffs',
  entries: { main: LG('FRA2') },
  phases: [
    league({ tiebreak: TB.FRA, zones: [zone(1, 2, Z.up, 'Acesso'), zone(3, 5, Z.prelib, 'Playoffs'), zone(16, 16, Z.uel, 'Barragem de rebaixamento'), zone(17, 18, Z.rel, 'Rebaixamento')] }),
    { type: 'ko', name: 'Playoffs', after: [0], teams: { phase: 0, pos: [3, 5] }, legs: 1, et: false, pens: true, roundNames: ['Quartas', 'Semifinal'] }
  ],
  outcomes: [{ label: 'Acesso à Ligue 1', src: { phase: 0, pos: [1, 2] } }, { label: 'Vai à barragem contra o 16º da Ligue 1', src: { phase: 1, winner: true }, color: Z.prelib }],
  rules: ['18 clubes, 34 rodadas. 1º e 2º sobem.', 'Playoffs em jogo único na casa do melhor colocado: 4º × 5º, e o vencedor enfrenta o 3º.', 'O vencedor disputa a barragem contra o 16º da Ligue 1. O 16º joga barragem de rebaixamento; 17º e 18º caem.'],
  sources: [{ t: 'Wikipedia — 2026–27 Ligue 2', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Ligue_2' }]
});
simpleLeague('liga2-por-2627', 'Liga 2 Portugal 2026/27', 'Segundas divisões', 'POR2', TB.POR, [zone(1, 2, Z.up, 'Acesso'), zone(3, 3, Z.prelib, 'Playoff de acesso'), zone(16, 16, Z.uel, 'Playoff de rebaixamento'), zone(17, 18, Z.rel, 'Rebaixamento')],
  ['18 clubes, 34 rodadas. 1º e 2º sobem; o 3º joga playoff contra o 16º da Liga Portugal.', 'O 16º joga playoff de rebaixamento; 17º e 18º caem.'], [{ t: 'Wikipedia — 2026–27 Liga Portugal 2', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Liga_Portugal_2' }],
  { notes: ['Times B (Sporting, Benfica e Porto) entram sem escudo; na vida real eles não podem subir.'] });
/* ======================== COPAS EUROPEIAS ======================== */
const uefa = (id, name, teams, games, src) => add({
  id, name, group: 'Copas europeias', icon: 'swiss', short: `Liga suíça · 36 clubes · ${games} jogos + mata-mata`, entries: { main: teams }, champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase de liga', teams: { entry: 'main' }, swiss: games, tiebreak: TB.UEFA, zones: SWISS_ZONES },
    { type: 'ko', name: 'Mata-mata', after: [0], teams: { phase: 0, pos: [1, 24] }, pairing: 'uefa', legs: 2, et: true, pens: true, final: { legs: 1, neutral: true, et: true, pens: true } }
  ],
  rules: [`Fase de liga com 36 clubes em tabela única: cada um faz ${games} jogos (${games / 2} em casa e ${games / 2} fora) contra adversários de ${games === 8 ? '4 potes (dois de cada)' : '6 potes (um de cada)'}.`,
    '1º ao 8º vão direto às oitavas; 9º ao 24º jogam o playoff; 25º ao 36º são eliminados.', 'Mata-mata em ida e volta, com prorrogação e pênaltis (sem gol fora). Final em jogo único e campo neutro.',
    'Desempate: saldo, gols marcados, gols fora, vitórias, vitórias fora.'],
  notes: ['Restrições de país no sorteio não são aplicadas. O chaveamento segue a posição (1º × vencedor de 16º/17º etc.).'],
  sources: src
});
uefa('champions-2627', 'Champions League 2026/27', ['aek', 'arsenal', 'aston-villa', 'atletico-madrid', 'bayern', 'dortmund', 'club-brugge', 'como', 'barcelona', 'porto', 'fenerbahce', 'feyenoord', 'bodo-glimt',
  'galatasaray', 'inter', 'lask', 'liverpool', 'lille', 'man-city', 'man-united', 'napoli', 'psg', 'psv', 'leipzig', 'lens', 'betis', 'real-madrid', 'roma', 'sabah', 'shakhtar', 'slovan', 'slavia', 'sporting',
  'stuttgart', 'viking', 'villarreal'], 8, [{ t: 'UEFA — Champions League', u: 'https://www.uefa.com/uefachampionsleague/' }]);
uefa('europa-2627', 'Europa League 2026/27', ['milan', 'omonia', 'bournemouth', 'az', 'leverkusen', 'besiktas', 'celta', 'celtic', 'crystal-palace', 'ararat', 'ferencvaros', 'dinamo-zagreb', 'hapoel-beer-sheva',
  'jagiellonia', 'juventus', 'lech', 'levski', 'lillestrom', 'nec', 'celje', 'ofi', 'olympiacos', 'marseille', 'lyon', 'real-sociedad', 'salzburg', 'anderlecht', 'torreense', 'sturm-graz', 'benfica',
  'sparta-praha', 'rennes', 'sunderland', 'hoffenheim', 'union-sg', 'plzen'], 8, [{ t: 'UEFA — Europa League', u: 'https://www.uefa.com/uefaeuropaleague/' }]);
uefa('conference-2627', 'Conference League 2026/27', ['agf', 'ajax', 'monaco', 'atalanta', 'brighton', 'cska-sofia', 'craiova', 'copenhagen', 'iberia', 'lugano', 'midtjylland', 'nordsjaelland', 'thun', 'twente',
  'borac', 'jablonec', 'kauno-zalgiris', 'getafe', 'hearts', 'hajduk', 'inter-escaldes', 'gent', 'kairat', 'egnatia', 'kups', 'lincoln-red-imps', 'mjallby', 'pafos', 'panathinaikos', 'red-star', 'riga', 'braga',
  'freiburg', 'sint-truiden', 'brann', 'trabzonspor'], 6, [{ t: 'UEFA — Conference League 2026/27: clubes, datas e formato', u: 'https://uefa.com/uefaconferenceleague/news/02a6-20d57d15f093-a90cf54c928f-1000--2026-27-conference-league-teams-dates-draws-format-final/' }]);

/* ========================= OUTRAS LIGAS ========================= */
add({
  id: 'ligamx-apertura-2026', name: 'Liga MX Apertura 2026', group: 'Outras ligas', short: '18 clubes · 17 rodadas + Liguilla',
  entries: { main: LG('MEX') }, champion: { phase: 1 },
  phases: [
    league({ name: 'Fase regular', legs: 1, tiebreak: ['pts', 'gd', 'gf', 'h2h'], zones: [zone(1, 8, Z.lib, 'Liguilla')] }),
    { type: 'ko', name: 'Liguilla', after: [0], teams: { phase: 0, pos: [1, 8] }, legs: 2, et: false, pens: false, better: true, reseed: true, final: { legs: 2, et: true, pens: true, better: false } }
  ],
  rules: ['Fase regular em turno único (17 rodadas). Sem play-in: os 8 primeiros vão direto às quartas.', 'Liguilla em ida e volta; a cada fase o melhor colocado enfrenta o pior entre os que restam e decide em casa.',
    'Nas quartas e semis, empate no agregado classifica o melhor colocado. A final tem prorrogação e pênaltis.'],
  notes: ['O regulamento de quartas/semis segue a tradição da Liga MX; a fonte de 2026 só confirma o fim do play-in.'],
  sources: [{ t: 'Fox Sports MX — Como será a fase final do Apertura 2026', u: 'https://www.foxsports.com.mx/2026/10/15/sigue-el-play-in-o-habra-liguilla-directa-asi-se-jugara-la-fase-final-de-la-liga-mx-este-ap2026/' }]
});
const EAST = I('atlanta-united', 'charlotte-fc', 'chicago-fire', 'fc-cincinnati', 'columbus-crew', 'dc-united', 'inter-miami', 'cf-montreal', 'nashville-sc', 'new-england-revolution', 'new-york-city-fc', 'new-york-red-bulls', 'orlando-city', 'philadelphia-union', 'toronto-fc');
const WEST = I('austin-fc', 'colorado-rapids', 'fc-dallas', 'houston-dynamo', 'la-galaxy', 'los-angeles-fc', 'minnesota-united', 'portland-timbers', 'real-salt-lake', 'san-diego-fc', 'san-jose-earthquakes', 'seattle-sounders', 'sporting-kansas-city', 'st-louis-city-sc', 'vancouver-whitecaps');
const mlsPO = { roundNames: ['1ª rodada (melhor de 3)', 'Semifinal de conferência', 'Final de conferência'], roundsCfg: [{ bo3: true }, { legs: 1, et: true, pens: true }, { legs: 1, et: true, pens: true }], maxRounds: 3 };
add({
  id: 'mls-2026', name: 'MLS 2026', group: 'Outras ligas', icon: 'groups', short: '30 clubes · 2 conferências + playoffs + MLS Cup',
  entries: { east: EAST, west: WEST }, roles: { east: 'Conferência Leste', west: 'Conferência Oeste' }, champion: { phase: 6 },
  phases: [
    { type: 'rr', name: 'Temporada regular', groups: { method: 'roles', roles: ['east', 'west'], names: ['Conferência Leste', 'Conferência Oeste'] }, legs: 2, inter: 6, tiebreak: TB.MLS, zonesEach: [zone(1, 7, Z.lib, 'Playoffs'), zone(8, 9, Z.prelib, 'Wild card')] },
    { type: 'agg', name: "Supporters' Shield", after: [0], sources: [0], tiebreak: TB.MLS, zones: [zone(1, 1, Z.lib, "Supporters' Shield")] },
    { type: 'ko', name: 'Wild card Leste', after: [0], teams: { phase: 0, group: 0, pos: [8, 9] }, legs: 1, et: false, pens: true, maxRounds: 1, roundNames: ['Wild card'] },
    { type: 'ko', name: 'Wild card Oeste', after: [0], teams: { phase: 0, group: 1, pos: [8, 9] }, legs: 1, et: false, pens: true, maxRounds: 1, roundNames: ['Wild card'] },
    { type: 'ko', name: 'Playoffs Leste', after: [2], teams: { list: [{ phase: 0, group: 0, pos: [1, 7] }, { phase: 2, winner: true }] }, ...mlsPO },
    { type: 'ko', name: 'Playoffs Oeste', after: [3], teams: { list: [{ phase: 0, group: 1, pos: [1, 7] }, { phase: 3, winner: true }] }, ...mlsPO },
    { type: 'ko', name: 'MLS Cup', after: [4, 5], teams: { list: [{ phase: 4, winner: true }, { phase: 5, winner: true }], sortBy: { phase: 1 } }, legs: 1, et: true, pens: true, roundNames: ['MLS Cup'] }
  ],
  rules: ['30 clubes em duas conferências de 15: turno e returno dentro da conferência (28 jogos) + 6 jogos contra a outra = 34 jogos.', 'Os 7 primeiros de cada conferência vão aos playoffs; 8º × 9º jogam o wild card (empate: pênaltis direto).',
    '1ª rodada em melhor de 3 (jogos 1 e 3 na casa do melhor; empate em cada jogo vai direto aos pênaltis).', 'Semifinal e final de conferência em jogo único (prorrogação e pênaltis).', 'MLS Cup em jogo único na casa de quem fez mais pontos na temporada.'],
  notes: ['Os 6 jogos contra a outra conferência são sorteados.'],
  sources: [{ t: 'Wikipedia — 2026 MLS Cup playoffs', u: 'https://en.wikipedia.org/wiki/2026_MLS_Cup_playoffs' }]
});
simpleLeague('saudi-2627', 'Saudi Pro League 2026/27', 'Outras ligas', 'KSA', TB.H2H, [zone(1, 3, Z.ucl, 'Champions da Ásia (Elite)'), zone(4, 4, Z.uel, 'Elite (preliminar)'), zone(16, 18, Z.rel, 'Rebaixamento')],
  ['18 clubes, 34 rodadas.', 'Os 3 primeiros vão à fase de liga da AFC Champions League Elite.'], [{ t: 'Wikipedia — 2026–27 Saudi Pro League', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Saudi_Pro_League' }],
  { notes: ['Número de rebaixados não confirmado para 2026/27; mantidos os 3 da temporada anterior.'] });
simpleLeague('china-2026', 'Chinese Super League 2026', 'Outras ligas', 'CHN', TB.H2H, [zone(1, 1, Z.ucl, 'AFC Champions League Elite'), zone(2, 2, Z.uel, 'AFC Champions League Two'), zone(15, 16, Z.rel, 'Rebaixamento')],
  ['16 clubes, 30 rodadas.', 'Confronto direto é o 1º critério de desempate.', '15º e 16º caem.'], [{ t: 'Wikipedia — 2026 Chinese Super League', u: 'https://en.wikipedia.org/wiki/2026_Chinese_Super_League' }]);

/* ======================= LIGAS NOVAS (v5) ======================= */
const split = (o) => {
  const n = LG(o.lg).length, top = o.top || 6;
  const A = [...Array(top).keys()], B = [...Array(n - top).keys()].map(k => k + top);
  return add({
    id: o.id, name: o.name, group: o.group, icon: 'groups', short: o.short, entries: { main: LG(o.lg) }, champion: { phase: 1, group: 0 },
    phases: [
      league({ name: o.p0name || 'Temporada regular', legs: o.legs0 || 2, tiebreak: o.tb, zones: [zone(1, top, Z.lib, o.gA || 'Grupo do título'), zone(top + 1, n, Z.rel, o.gB || 'Grupo de rebaixamento')] }),
      { type: 'rr', name: o.p1name || 'Fase final', after: [0], teams: { phase: 0, pos: [1, n] }, groups: { method: 'pattern', pattern: [A, B], names: [`${o.gA || 'Grupo do título'} (1º–${top}º)`, `${o.gB || 'Grupo de rebaixamento'} (${top + 1}º–${n}º)`] },
        legs: o.legs1 || 2, legsEach: o.legsEach, carry: { phase: 0, factors: o.factors || [1, 1] }, tiebreak: o.tb, groupZones: o.groupZones },
      ...(o.extra || [])
    ],
    outcomes: o.outcomes, rules: o.rules, notes: o.notes, sources: o.sources
  });
};
simpleLeague('superlig-2627', 'Süper Lig 2026/27', 'Ligas europeias', 'TUR', ['pts', 'h2h', 'gd', 'gf'],
  [zone(1, 1, Z.ucl, 'Champions League'), zone(2, 2, Z.ucl, 'Champions (3ª pré-eliminatória)'), zone(3, 3, Z.uel, 'Europa League (pré)'), zone(4, 4, Z.uecl, 'Conference League (pré)'), zone(16, 18, Z.rel, 'Rebaixamento')],
  ['18 clubes, turno e returno (34 rodadas).', 'Os três últimos caem para a 1. Lig.', 'O confronto direto é o 1º critério de desempate (só depois que os clubes se enfrentarem duas vezes).'],
  [{ t: 'Wikipedia — 2026–27 Süper Lig', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_S%C3%BCper_Lig' }]);
simpleLeague('belgica-2627', 'Pro League Bélgica 2026/27', 'Ligas europeias', 'BEL', ['pts', 'w', 'gd', 'gf', 'aw'],
  [zone(1, 1, Z.ucl, 'Champions League'), zone(2, 2, Z.ucl, 'Champions (3ª pré-eliminatória)'), zone(3, 3, Z.uel, 'Europa League (pré)'), zone(4, 4, Z.uecl, 'Conference League (pré)'), zone(17, 18, Z.rel, 'Rebaixamento')],
  ['18 clubes em turno e returno (34 rodadas). A liga voltou aos pontos corridos puros: não há mais playoffs nem pontos divididos.', 'Os dois últimos caem para a Challenger Pro League.', 'Desempate: vitórias, saldo, gols marcados, vitórias fora.'],
  [{ t: 'Wikipedia — 2026–27 Belgian Pro League', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Belgian_Pro_League' }]);
split({ id: 'austria-2627', name: 'Bundesliga Áustria 2026/27', group: 'Ligas europeias', lg: 'AUT', short: '12 clubes · 22 rodadas + grupos do título e do rebaixamento', tb: ['pts', 'h2h', 'gd', 'gf', 'w', 'aw'],
  groupZones: [[zone(1, 1, Z.ucl, 'Campeão · Champions'), zone(2, 2, Z.ucl, 'Champions (pré)')], [zone(6, 6, Z.rel, 'Rebaixamento')]],
  rules: ['12 clubes em turno e returno (22 rodadas).', 'Depois, os 6 de cima e os 6 de baixo jogam turno e returno entre si (mais 10 rodadas).', 'Novidade de 2026/27: os pontos da 1ª fase são mantidos integralmente (antes eram divididos pela metade).', 'O último do grupo de baixo cai.'],
  notes: ['O playoff europeu entre o grupo de baixo e o 5º do grupo do título não é simulado.'],
  sources: [{ t: 'Wikipedia — 2026–27 Austrian Football Bundesliga', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Austrian_Football_Bundesliga' }] });
split({ id: 'dinamarca-2627', name: 'Superliga Dinamarca 2026/27', group: 'Ligas europeias', lg: 'DEN', short: '12 clubes · 22 rodadas + grupos + playoff europeu', tb: ['pts', 'gd', 'gf', 'ag'],
  gA: 'Grupo do campeonato',
  groupZones: [[zone(1, 1, Z.ucl, 'Campeão · Champions'), zone(2, 2, Z.ucl, 'Champions (pré)'), zone(3, 3, Z.uecl, 'Conference (pré)'), zone(4, 4, Z.prelib, 'Playoff europeu')], [zone(1, 1, Z.prelib, 'Playoff europeu'), zone(5, 6, Z.rel, 'Rebaixamento')]],
  extra: [{ type: 'ko', name: 'Playoff europeu', after: [1], teams: { list: [{ phase: 1, group: 0, pos: [4, 4] }, { phase: 1, group: 1, pos: [1, 1] }] }, legs: 1, et: true, pens: true, roundNames: ['Playoff europeu'] }],
  outcomes: [{ label: 'Vaga na Conference League (playoff)', src: { phase: 2, winner: true }, color: Z.uecl }, { label: 'Rebaixados', src: { phase: 1, group: 1, pos: [5, 6] }, color: Z.rel }],
  rules: ['12 clubes em turno e returno (22 rodadas).', 'Grupo do campeonato (1º–6º) e grupo do rebaixamento (7º–12º) em turno e returno, mantendo pontos e gols.', 'Playoff europeu: 4º do grupo do campeonato × 1º do grupo de baixo, jogo único na casa do primeiro.', 'Os dois últimos caem.'],
  sources: [{ t: 'Wikipedia — 2026–27 Danish Superliga', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Danish_Superliga' }] });
split({ id: 'suica-2627', name: 'Super League Suíça 2026/27', group: 'Ligas europeias', lg: 'SUI', short: '12 clubes · 33 rodadas + split · 38 jogos', tb: ['pts', 'gd', 'gf', 'h2h', 'ag'], legs0: 3, legs1: 1,
  p0name: '1ª fase (33 rodadas)', p1name: 'Split', gA: 'Grupo do campeonato', gB: 'Grupo do rebaixamento',
  groupZones: [[zone(1, 1, Z.ucl, 'Campeão · Champions'), zone(2, 2, Z.ucl, 'Champions (pré)')], [zone(5, 5, Z.uel, '11º · barragem'), zone(6, 6, Z.rel, '12º · rebaixado')]],
  rules: ['12 clubes jogam 33 rodadas (todos contra todos três vezes).', 'Depois, os 6 de cima e os 6 de baixo jogam mais 5 rodadas entre si, mantendo os pontos.', 'O 12º cai; o 11º joga a barragem contra o 2º da Challenge League.'],
  sources: [{ t: 'Wikipedia — 2026–27 Swiss Super League', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Swiss_Super_League' }] });
split({ id: 'servia-2627', name: 'SuperLiga Sérvia 2026/27', group: 'Ligas europeias', lg: 'SRB', short: '14 clubes · 26 rodadas + playoff e playout', tb: ['pts', 'h2h', 'gd', 'gf'], legsEach: [2, 1],
  gA: 'Playoff do título', gB: 'Playout', groupZones: [[zone(1, 1, Z.ucl, 'Campeão')], [zone(5, 8, Z.rel, 'Rebaixamento')]],
  outcomes: [{ label: 'Rebaixados', src: { phase: 1, group: 1, pos: [5, 8] }, color: Z.rel }],
  rules: ['14 clubes em turno e returno (26 rodadas).', 'Playoff do título com os 6 primeiros e playout com os 8 últimos.', 'Quatro clubes caem: a liga terá 12 clubes a partir de 2027/28.'],
  notes: ['A fonte não detalha o número de jogos nem se os pontos são divididos: assumidos turno e returno no playoff (10 rodadas), turno único no playout (7 rodadas) e pontos mantidos.'],
  sources: [{ t: 'Wikipedia — 2026–27 Serbian SuperLiga', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Serbian_SuperLiga' }, { t: 'B92 — Superliga 2026/27', u: 'https://www.b92.net/sport/fudbal/srpski-fudbal/250898/superliga-sezona-20262027-najava/vest' }] });
add({
  id: 'croacia-2627', name: 'HNL Croácia 2026/27', group: 'Ligas europeias', short: '10 clubes · 36 rodadas', entries: { main: LG('CRO') },
  phases: [league({ legs: 4, tiebreak: ['pts', 'h2h', 'gd', 'gf'], zones: [zone(1, 1, Z.ucl, 'Champions (pré)'), zone(2, 2, Z.uecl, 'Conference (pré)'), zone(10, 10, Z.rel, 'Rebaixamento')] })],
  rules: ['10 clubes que se enfrentam quatro vezes (36 rodadas).', 'O último cai.', 'Confronto direto vale como 1º desempate nas disputas de título, vaga europeia e rebaixamento.'],
  notes: ['A vaga da Copa da Croácia na Europa League não é simulada.'],
  sources: [{ t: 'Wikipedia — 2026–27 Croatian Football League', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Croatian_Football_League' }]
});
add({
  id: 'chile-2026', name: 'Liga de Primera 2026 (Chile)', group: 'América do Sul', crest: 'assets/logos/liga-de-primera-chile.png', short: '16 clubes · 30 rodadas', entries: { main: LG('CHI') },
  phases: [league({ tiebreak: ['pts', 'gd', 'gf', 'w'], zones: [zone(1, 2, Z.lib, 'Libertadores'), zone(3, 3, Z.prelib, 'Disputa da vaga Chile 4'), zone(15, 16, Z.rel, 'Rebaixamento')] })],
  rules: ['16 clubes em turno e returno (30 rodadas).', 'Campeão e vice vão à Libertadores; o 3º disputa a vaga Chile 4 em jogo único contra o campeão da Copa Chile (o perdedor vai à Sul-Americana).', 'Os dois últimos caem.'],
  notes: ['A vaga da nova Copa de la Liga e o jogo pela vaga Chile 4 não são simulados. Critérios de desempate não detalhados na fonte.'],
  sources: [{ t: '24 Horas — Novo sistema de classificação do futebol chileno', u: 'https://www.24horas.cl/deportes/futbol-nacional/nuevo-sistema-de-clasificacion-aprueban-importantes-cambios-para-la-temporada-2026-futbol-chileno' }]
});
add({
  id: 'paraguai-2026', name: 'Primera División 2026 (Paraguai)', group: 'América do Sul', crest: 'assets/logos/copa-de-primera-paraguai.png', icon: 'groups', short: 'Apertura + Clausura · 12 clubes · 22 rodadas cada', entries: { main: LG('PAR') }, champion: { phase: 1 },
  phases: [
    league({ name: 'Apertura', tiebreak: ['pts', 'gd', 'gf'], zones: [zone(1, 1, Z.lib, 'Campeão do Apertura')] }),
    { type: 'rr', name: 'Clausura', after: [0], teams: { entry: 'main' }, legs: 2, tiebreak: ['pts', 'gd', 'gf'], zones: [zone(1, 1, Z.lib, 'Campeão do Clausura')] },
    { type: 'agg', name: 'Tabela anual', after: [1], sources: [0, 1], tiebreak: ['pts', 'gd', 'gf'] }
  ],
  outcomes: [{ label: 'Campeão do Apertura', src: { phase: 0, pos: [1, 1] } }, { label: 'Campeão do Clausura', src: { phase: 1, pos: [1, 1] } }],
  rules: ['Dois torneios por ano, Apertura e Clausura, cada um em turno e returno (22 rodadas) com os 12 clubes. Cada torneio tem seu campeão, sem final.', 'A tabela anual soma os dois torneios.'],
  notes: ['O rebaixamento no Paraguai é por média de pontos de três temporadas e não é simulado. O banner de campeão mostra o vencedor do Clausura; o do Apertura aparece nos destaques.'],
  sources: [{ t: 'RSSSF — Paraguay 2026', u: 'https://www.rsssf.org/tablesp/para2026.html' }]
});
simpleLeague('j1-2627', 'J1 League 2026/27 (Japão)', 'Outras ligas', 'JPN', ['pts', 'gd', 'gf', 'h2h'], [zone(1, 1, Z.ucl, 'AFC Champions League Elite'), zone(18, 20, Z.rel, 'Rebaixamento')],
  ['20 clubes, turno e returno (38 rodadas).', 'Primeira temporada no calendário europeu (agosto de 2026 a junho de 2027).'], [{ t: 'Wikipedia — 2026–27 J1 League', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_J1_League' }],
  { notes: ['Número de rebaixados não detalhado na fonte: mantidos os três das temporadas anteriores.'] });
split({ id: 'kleague-2026', name: 'K League 1 2026 (Coreia do Sul)', group: 'Outras ligas', lg: 'KOR', short: '12 clubes · 33 rodadas + Final A e B · 38 jogos', tb: ['pts', 'gf', 'gd', 'w', 'h2h'], legs0: 3, legs1: 1,
  p0name: '1ª fase (33 rodadas)', p1name: 'Final A e B', gA: 'Final A', gB: 'Final B',
  groupZones: [[zone(1, 3, Z.ucl, 'AFC Champions League Elite'), zone(4, 4, Z.uel, 'ACL Elite (playoff)')], [zone(6, 6, Z.rel, 'Playoff de rebaixamento')]],
  rules: ['12 clubes jogam 33 rodadas (todos contra todos três vezes).', 'Divisão em Final A (1º–6º) e Final B (7º–12º), com mais 5 rodadas mantendo os pontos.', 'O último joga playoff de rebaixamento contra a K League 2.', 'Desempate: gols marcados vêm antes do saldo.'],
  notes: ['O Gimcheon Sangmu (time militar) é rebaixado administrativamente; essa regra não é simulada.'],
  sources: [{ t: 'Wikipedia — 2026 K League 1', u: 'https://en.wikipedia.org/wiki/2026_K_League_1' }] });
split({ id: 'egito-2627', name: 'Premier League Egito 2026/27', group: 'Outras ligas', lg: 'EGY', short: '20 clubes · turno único + grupos do título e do rebaixamento', tb: ['pts', 'h2h', 'gd', 'gf'], legs0: 1, legsEach: [2, 1],
  groupZones: [[zone(1, 1, Z.lib, 'Campeão · CAF Champions League'), zone(2, 2, Z.lib, 'CAF Champions League')], [zone(11, 14, Z.rel, 'Rebaixamento')]],
  outcomes: [{ label: 'Rebaixados', src: { phase: 1, group: 1, pos: [11, 14] }, color: Z.rel }],
  rules: ['20 clubes em turno único (19 rodadas).', 'Depois, os 6 primeiros disputam o título e os outros 14 lutam contra o rebaixamento.', 'Quatro clubes caem (a liga terá 19 clubes em 2027/28 e 18 a partir de 2028/29).'],
  notes: ['A fonte não detalha a 2ª fase: assumidos pontos mantidos, turno e returno no grupo do título e turno único no grupo de baixo.'],
  sources: [{ t: 'Africa Soccer — Egyptian Premier League 2026/27 new format', u: 'https://africasoccer.com/?p=561557' }] });
simpleLeague('botola-2627', 'Botola Pro 2026/27 (Marrocos)', 'Outras ligas', 'MAR', ['pts', 'h2h', 'gd', 'w', 'gf'], [zone(1, 2, Z.lib, 'CAF Champions League'), zone(3, 3, Z.sula, 'Copa das Confederações'), zone(14, 14, Z.prelib, 'Playoff de rebaixamento'), zone(15, 16, Z.rel, 'Rebaixamento')],
  ['16 clubes, turno e returno (30 rodadas).', 'O confronto direto desempata quando só dois clubes estão empatados.'], [{ t: 'Wikipedia — 2026–27 Botola Pro', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_Botola_Pro' }]);
simpleLeague('psl-2627', 'Premiership 2026/27 (África do Sul)', 'Outras ligas', 'RSA', ['pts', 'gd', 'gf'], [zone(1, 2, Z.lib, 'CAF Champions League'), zone(3, 3, Z.sula, 'Copa das Confederações'), zone(15, 15, Z.prelib, 'Playoff de rebaixamento'), zone(16, 16, Z.rel, 'Rebaixamento')],
  ['16 clubes, turno e returno (30 rodadas).', 'O último cai; o penúltimo vai ao playoff contra a segunda divisão.'], [{ t: 'Wikipedia — 2026–27 South African Premiership', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_South_African_Premiership' }]);

/* ======================== SELEÇÕES ======================== */
const N = (...slugs) => slugs.flat().map(s => 'sel-' + s);
const CONF = c => BASE_TEAMS.filter(t => t.league === 'SEL-' + c).sort((a, b) => (a.fifaRank || 999) - (b.fifaRank || 999)).map(t => t.id);
const TB_UEFA_NT = ['pts', 'h2h', 'gd', 'gf', 'w'];
const KO_NT = { legs: 1, neutral: true, et: true, pens: true };
const thirdPlace = (phase, sfRound) => ({ type: 'ko', name: 'Disputa de 3º lugar', after: [{ phase, round: sfRound }], teams: { phase, roundLosers: sfRound }, pairing: 'pairs', pairs: [[0, 1]], legs: 1, neutral: true, et: false, pens: true, maxRounds: 1, roundNames: ['Disputa de 3º lugar'] });
// fase final de 24 seleções: 6 grupos de 4 (sedes no pote 1), 2 primeiros + 4 melhores 3ºs, oitavas no modelo da Euro
const finals24 = (teamsSrc, nHosts, opts = {}) => ([
  { type: 'rr', name: opts.groupName || 'Fase de grupos', after: opts.after || [], teams: teamsSrc, groups: { count: 6, fixedCount: nHosts }, legs: 1, neutral: true, tiebreak: opts.tiebreak || TB_UEFA_NT,
    zonesEach: [zone(1, 2, Z.lib, 'Oitavas de final'), zone(3, 3, Z.prelib, '4 melhores 3ºs avançam')] },
  null
]);
const SRC_NT = {
  fifa: { t: 'Ranking FIFA masculino — 7 de outubro de 2026', u: 'https://inside.fifa.com/fifa-world-ranking/men' },
  euroq: { t: 'UAF — Formato das eliminatórias da Euro 2028', u: 'https://uaf.ua/en/article/54992' },
  euro: { t: 'Wikipedia — UEFA Euro 2028', u: 'https://en.wikipedia.org/wiki/UEFA_Euro_2028' },
  unl: { t: 'Al Jazeera — Liga das Nações 2026/27: grupos e formato', u: 'https://www.aljazeera.com/sports/2026/9/23/uefa-nations-league-2026-27-format-teams-players-schedule' },
  unlA: { t: 'Wikipedia — 2026–27 UEFA Nations League A', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_UEFA_Nations_League_A' },
  unlNew: { t: 'beIN — Comitê Executivo aprova mudanças na Liga das Nações', u: 'https://www.beinsports.com/en-us/soccer/uefa-nations-league/articles/the-executive-committee-approves-new-changes-to-the-uefa-nations-league-2026-09-15' },
  unl28: { t: 'Wikipedia — 2028–29 UEFA Nations League', u: 'https://en.wikipedia.org/wiki/2028%E2%80%9329_UEFA_Nations_League' },
  unlFmt: { t: 'Malta FA — Novos formatos das competições de seleções da UEFA a partir de 2028', u: 'https://www.maltafootball.com/2026/05/21/new-formats-for-the-uefa-mens-national-team-competitions-as-of-2028/' },
  cnl: { t: 'Wikipedia — 2026–27 CONCACAF Nations League', u: 'https://en.wikipedia.org/wiki/2026%E2%80%9327_CONCACAF_Nations_League' },
  gold: { t: 'Concacaf — Novo formato da Copa Ouro 2027', u: 'https://www.concacaf.com/competitions/gold-cup/news/concacaf-sets-stage-for-2027-gold-cup-with-exciting-new-format-and-dates' },
  afcon: { t: 'beIN — Como funcionam as eliminatórias da CAN 2027', u: 'https://www.beinsports.com/en-us/soccer/africa-cup-of-nations-qualification/articles/how-many-teams-qualify-for-afcon-2027-and-what-do-they-need-to-advance-2026-09-21' },
  asia: { t: 'Wikipedia — 2027 AFC Asian Cup', u: 'https://en.wikipedia.org/wiki/2027_AFC_Asian_Cup' },
  ofc: { t: 'Wikipedia — 2024 OFC Men\'s Nations Cup', u: 'https://en.wikipedia.org/wiki/2024_OFC_Men%27s_Nations_Cup' }
};

/* ---------- Eurocopa 2028 com eliminatórias ---------- */
add({
  id: 'euro-2028', name: 'Eurocopa 2028 (com eliminatórias)', group: 'Seleções · UEFA', icon: 'groups', short: 'Eliminatórias (12 grupos) + repescagem + 24 seleções na fase final',
  entries: { hosts: N('england', 'scotland', 'wales', 'republic-of-ireland'), qual: CONF('UEFA').filter(id => id !== 'sel-russia') },
  roles: { hosts: 'Sedes · jogam as eliminatórias, com vagas reservadas', qual: 'Eliminatórias' },
  hostCfg: { mode: 'flag', pool: ['qual'], max: 6 },
  build(e) {
    const h = e.hosts.length, R = Math.min(2, h);
    const phases = [
      { type: 'rr', name: 'Eliminatórias', teams: { entry: 'qual' }, groups: { count: 12, byRating: true, separate: true }, legs: 2, tiebreak: TB_UEFA_NT,
        zonesEach: [zone(1, 1, Z.lib, 'Classificado'), zone(2, 2, Z.prelib, '8 melhores 2ºs classificam; os outros vão à repescagem')] },
      { type: 'ko', name: 'Repescagem', after: [0], teams: { phase: 0 }, pairing: 'euroPO', euroPO: { runners: 8, reserve: R, places: 4 }, legs: 2, et: true, pens: true, maxRounds: 1, roundNames: ['Repescagem'] },
      { type: 'rr', name: 'Fase de grupos', after: [0, 1], teams: { list: [{ phase: 1, stored: 'direct' }, { phase: 1, winners: true }] },
        groups: { count: 6, byRating: true, hostsFirst: true }, legs: 1, neutral: true, tiebreak: TB_UEFA_NT,
        zonesEach: [zone(1, 2, Z.lib, 'Oitavas de final'), zone(3, 3, Z.prelib, '4 melhores 3ºs avançam')] },
      { type: 'ko', name: 'Mata-mata', after: [2], teams: { phase: 2 }, pairing: 'thirds24', ...KO_NT, roundNames: ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'] }
    ];
    const names = e.hosts.map(id => (BASE_TEAMS.find(t => t.id === id) || {}).name).join(', ');
    return {
      phases, champion: { phase: 3 },
      outcomes: [
        { label: 'Classificados pelas eliminatórias', src: { phase: 1, stored: 'directQ' } },
        { label: 'Sedes pela vaga reservada', src: { phase: 1, stored: 'reserved' } },
        { label: 'Classificados na repescagem', src: { phase: 1, winners: true } }
      ],
      rules: [h ? `Sedes: ${names}. Todas jogam as eliminatórias; ${R === 1 ? '1 vaga fica reservada' : `${R} vagas ficam reservadas`} para a${R > 1 ? 's' : ''} sede${R > 1 ? 's' : ''} mais bem colocada${R > 1 ? 's' : ''} que não se classificar${R > 1 ? 'em' : ''} direto.` : 'Sem sedes: as 24 vagas saem das eliminatórias e da repescagem.',
        `Vagas: 12 primeiros + 8 melhores 2ºs = 20; ${R ? `até ${R} pela vaga das sedes; ` : ''}o resto (${R ? `de ${4 - R} a 4` : '4'}) pela repescagem.`]
    };
  },
  rules: ['54 seleções (as sedes também) em 12 grupos de 4 ou 5, sorteados por potes do ranking, com as sedes em grupos diferentes. Ida e volta.',
    'Classificam direto os 12 primeiros e os 8 melhores 2ºs (20 vagas). Na comparação entre 2ºs, os jogos contra o 5º colocado não contam.',
    'Vagas das sedes: 2 ficam reservadas para as sedes mais bem colocadas que não se classificaram direto (com 1 sede, só 1). Sede que se classifica sozinha não gasta a reserva.',
    'Repescagem com as vagas que sobram: se nenhuma reserva for usada, 4 vagas em 4 confrontos de ida e volta (8 seleções); com 1 reserva usada, 3 vagas em 3 caminhos de 4 seleções; com 2, 2 vagas em 2 caminhos. Nos caminhos, semifinal e final em jogo único na casa do mais bem colocado.',
    'Fase final: 24 seleções em 6 grupos de 4; as sedes classificadas ficam nos primeiros grupos e jogam em casa, os demais jogos são em campo neutro. Avançam os 2 primeiros e os 4 melhores 3ºs.',
    'Desempate nos grupos: pontos, confronto direto, saldo, gols marcados, vitórias. Mata-mata em jogo único com prorrogação e pênaltis, no chaveamento da Euro 2024.'],
  notes: ['Na repescagem real entram também os campeões de grupo da Liga A da Liga das Nações que não se classificaram; aqui, como as competições não são ligadas, as vagas vão para os 2ºs e 3ºs mais bem colocados das eliminatórias.',
    'Sorteio real das eliminatórias: 6 de dezembro de 2026. A Rússia segue suspensa e não entra.'],
  sources: [SRC_NT.euroq, SRC_NT.euro, SRC_NT.fifa]
});

/* ---------- Liga das Nações da UEFA 2026/27 (temporada de transição) ---------- */
const UNL_ROLES = ['A1', 'A2', 'A3', 'A4', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4', 'D1', 'D2'];
const gA = [0, 1, 2, 3], gB = [4, 5, 6, 7], gC = [8, 9, 10, 11], gD = [12, 13];
add({
  id: 'unl-2627', name: 'Liga das Nações da UEFA 2026/27', group: 'Seleções · UEFA', icon: 'groups', short: '54 seleções em 4 ligas · acesso e descenso · nova temporada ao final',
  entries: {
    A1: N('france', 'italy', 'belgium', 'turkey'), A2: N('germany', 'netherlands', 'serbia', 'greece'), A3: N('spain', 'croatia', 'england', 'czechia'), A4: N('portugal', 'denmark', 'norway', 'wales'),
    B1: N('scotland', 'switzerland', 'slovenia', 'north-macedonia'), B2: N('hungary', 'ukraine', 'georgia', 'northern-ireland'), B3: N('israel', 'austria', 'republic-of-ireland', 'kosovo'), B4: N('poland', 'bosnia-and-herzegovina', 'romania', 'sweden'),
    C1: N('albania', 'finland', 'belarus', 'san-marino'), C2: N('montenegro', 'armenia', 'cyprus', 'latvia'), C3: N('kazakhstan', 'slovakia', 'faroe-islands', 'moldova'), C4: N('iceland', 'bulgaria', 'estonia', 'luxembourg'),
    D1: N('gibraltar', 'malta', 'andorra'), D2: N('lithuania', 'azerbaijan', 'liechtenstein')
  },
  roles: Object.fromEntries(UNL_ROLES.map(r => [r, `Liga ${r[0]} · Grupo ${r[1]}`])), champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase de liga', groups: { method: 'roles', roles: UNL_ROLES, names: UNL_ROLES.map(r => `Liga ${r[0]} · Grupo ${r[1]}`) }, legs: 2, tiebreak: TB_UEFA_NT,
      groupZones: [...gA.map(() => [zone(1, 2, Z.lib, 'Quartas de final'), zone(3, 3, Z.prelib, '2 melhores 3ºs ficam; 2 piores vão ao playoff A/B'), zone(4, 4, Z.rel, '2 melhores 4ºs vão ao playoff A/B; 2 piores caem')]),
        ...gB.map(() => [zone(1, 1, Z.up, 'Sobe para a Liga A'), zone(2, 2, Z.prelib, 'Playoff A/B'), zone(4, 4, Z.rel, 'Playoff B/C')]),
        ...gC.map(() => [zone(1, 1, Z.up, 'Sobe para a Liga B'), zone(2, 2, Z.prelib, 'Playoff B/C')]),
        ...gD.map(() => [zone(1, 3, Z.up, 'Liga D acaba: todos sobem para a Liga C')])] },
    { type: 'ko', name: 'Liga A · Mata-mata', after: [0], teams: { list: [{ phase: 0, perGroup: [1, 1], groups: gA }, { phase: 0, perGroup: [2, 2], groups: gA }] },
      pairing: 'drawNoSame', groupPhase: 0, legs: 2, et: true, pens: true, roundsCfg: [{ legs: 2 }, { legs: 1, neutral: true }], final: { legs: 1, neutral: true }, drawAt: [1],
      roundNames: ['Quartas de final', 'Semifinal', 'Final'] },
    thirdPlace(1, 1),
    { type: 'ko', name: 'Playoff A/B', after: [0], teams: { list: [{ phase: 0, perGroup: [3, 3], groups: gA, take: [2, 4] }, { phase: 0, perGroup: [4, 4], groups: gA, take: [0, 2] }, { phase: 0, perGroup: [2, 2], groups: gB }] },
      pairing: 'halves', legs: 2, et: true, pens: true, maxRounds: 1, roundNames: ['Playoff A/B'] },
    { type: 'ko', name: 'Playoff B/C', after: [0], teams: { list: [{ phase: 0, perGroup: [4, 4], groups: gB }, { phase: 0, perGroup: [2, 2], groups: gC }] },
      pairing: 'halves', legs: 2, et: true, pens: true, maxRounds: 1, roundNames: ['Playoff B/C'] }
  ],
  outcomes: [
    { label: 'Sobem para a Liga A', color: Z.up, src: { list: [{ phase: 0, perGroup: [1, 1], groups: gB }] } },
    { label: 'Caem para a Liga B', color: Z.rel, src: { phase: 0, perGroup: [4, 4], groups: gA, take: [2, 4] } },
    { label: 'Sobem para a Liga B', color: Z.up, src: { phase: 0, perGroup: [1, 1], groups: gC } }
  ],
  nextSeason: {
    template: 'unl-next', leagueOfGroup: [0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3],
    entries: {
      A: { list: [{ phase: 1, entrants: true }, { phase: 0, perGroup: [3, 3], groups: gA, take: [0, 2] }, { phase: 0, perGroup: [1, 1], groups: gB }, { phase: 3, roundWinners: 0 }] },
      B: { list: [{ phase: 0, perGroup: [4, 4], groups: gA, take: [2, 4] }, { phase: 3, roundLosers: 0 }, { phase: 0, perGroup: [3, 3], groups: gB }, { phase: 0, perGroup: [1, 1], groups: gC }, { phase: 4, roundWinners: 0 }] },
      C: { list: [{ phase: 4, roundLosers: 0 }, { phase: 0, perGroup: [3, 4], groups: gC }, { phase: 0, perGroup: [1, 3], groups: gD }] }
    }
  },
  rules: ['54 seleções em quatro ligas: A, B e C com 4 grupos de 4; D com 2 grupos de 3. Ida e volta dentro do grupo.',
    'Liga A: os 2 primeiros de cada grupo vão às quartas (ida e volta, 1º contra 2º de outro grupo, o 1º decide em casa). Semifinais por sorteio aberto, disputa de 3º e final em jogo único.',
    'Temporada de transição para o formato de 3 ligas de 18 (a partir de 2028/29):',
    'Liga A: os 2 melhores 3ºs ficam; os 2 piores 3ºs e os 2 melhores 4ºs jogam o playoff A/B contra os 2ºs da Liga B; os 2 piores 4ºs caem.',
    'Liga B: 1ºs sobem; 2ºs jogam o playoff A/B; 3ºs ficam; 4ºs jogam o playoff B/C contra os 2ºs da Liga C.',
    'Liga C: 1ºs sobem; 2ºs jogam o playoff B/C; 3ºs e 4ºs ficam. Liga D é extinta: todas as 6 vão para a Liga C.',
    'Playoffs em ida e volta (o time da liga de cima decide em casa), com prorrogação e pênaltis. Vencedor fica na liga de cima.',
    'Comparação entre grupos (melhores 3ºs, 4ºs etc.): pontos, saldo, gols marcados. Desempate dentro do grupo: pontos, confronto direto, saldo, gols, vitórias.',
    'Ao terminar, o botão "Criar próxima temporada" monta a Liga das Nações 2028/29 com os acessos e descensos.'],
  notes: ['Grupos reais da edição 2026/27. Os jogos já disputados de verdade não estão lançados: a simulação começa do zero.', 'A sede das finais ainda não foi definida; semifinais, 3º lugar e final são em campo neutro.'],
  sources: [SRC_NT.unl, SRC_NT.unlA, SRC_NT.unlNew]
});

/* Liga das Nações 2028/29 em diante (3 ligas de 18; criada pelo botão "próxima temporada") */
const NL_ROLES = [0, 1, 2].map(k => `Liga ${'ABC'[k]}`);
const nA = [0, 1, 2], nB = [3, 4, 5], nC = [6, 7, 8];
T_.push({
  id: 'unl-next', name: 'Liga das Nações da UEFA', group: '_oculto', icon: 'groups', short: '3 ligas de 18 seleções',
  entries: { A: [], B: [], C: [] }, roles: { A: 'Liga A', B: 'Liga B', C: 'Liga C' }, champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase de liga', groups: { method: 'multi', parts: [{ teams: { entry: 'A' }, count: 3, prefix: 'Liga A · Grupo ' }, { teams: { entry: 'B' }, count: 3, prefix: 'Liga B · Grupo ' }, { teams: { entry: 'C' }, count: 3, prefix: 'Liga C · Grupo ' }] },
      sched: 'potPairs', tiebreak: TB_UEFA_NT,
      groupZones: [...nA.map(() => [zone(1, 2, Z.lib, 'Quartas de final'), zone(3, 3, Z.prelib, '2 melhores 3ºs vão às quartas'), zone(4, 5, Z.uel, 'Playoff A/B'), zone(6, 6, Z.rel, 'Cai para a Liga B')]),
        ...nB.map(() => [zone(1, 1, Z.up, 'Sobe para a Liga A'), zone(2, 3, Z.prelib, 'Playoff A/B'), zone(4, 5, Z.uel, 'Playoff B/C'), zone(6, 6, Z.rel, 'Cai para a Liga C')]),
        ...nC.map(() => [zone(1, 1, Z.up, 'Sobe para a Liga B'), zone(2, 3, Z.prelib, 'Playoff B/C')])] },
    { type: 'ko', name: 'Liga A · Mata-mata', after: [0], teams: { list: [{ phase: 0, perGroup: [1, 1], groups: nA }, { phase: 0, perGroup: [2, 2], groups: nA }, { phase: 0, perGroup: [3, 3], groups: nA, take: [0, 2] }] },
      pairing: 'drawNoSame', groupPhase: 0, legs: 2, et: true, pens: true, roundsCfg: [{ legs: 2 }, { legs: 1, neutral: true }], final: { legs: 1, neutral: true }, drawAt: [1],
      roundNames: ['Quartas de final', 'Semifinal', 'Final'] },
    thirdPlace(1, 1),
    { type: 'ko', name: 'Playoff A/B', after: [0], teams: { list: [{ phase: 0, perGroup: [4, 5], groups: nA }, { phase: 0, perGroup: [2, 3], groups: nB }] }, pairing: 'halves', legs: 2, et: true, pens: true, maxRounds: 1, roundNames: ['Playoff A/B'] },
    { type: 'ko', name: 'Playoff B/C', after: [0], teams: { list: [{ phase: 0, perGroup: [4, 5], groups: nB }, { phase: 0, perGroup: [2, 3], groups: nC }] }, pairing: 'halves', legs: 2, et: true, pens: true, maxRounds: 1, roundNames: ['Playoff B/C'] }
  ],
  outcomes: [
    { label: 'Sobem para a Liga A', color: Z.up, src: { phase: 0, perGroup: [1, 1], groups: nB } },
    { label: 'Caem para a Liga B', color: Z.rel, src: { phase: 0, perGroup: [6, 6], groups: nA } },
    { label: 'Sobem para a Liga B', color: Z.up, src: { phase: 0, perGroup: [1, 1], groups: nC } },
    { label: 'Caem para a Liga C', color: Z.rel, src: { phase: 0, perGroup: [6, 6], groups: nB } }
  ],
  nextSeason: {
    template: 'unl-next', leagueOfGroup: [0, 0, 0, 1, 1, 1, 2, 2, 2],
    entries: {
      A: { list: [{ phase: 0, perGroup: [1, 3], groups: nA }, { phase: 3, roundWinners: 0 }, { phase: 0, perGroup: [1, 1], groups: nB }] },
      B: { list: [{ phase: 0, perGroup: [6, 6], groups: nA }, { phase: 3, roundLosers: 0 }, { phase: 4, roundWinners: 0 }, { phase: 0, perGroup: [1, 1], groups: nC }] },
      C: { list: [{ phase: 0, perGroup: [6, 6], groups: nB }, { phase: 4, roundLosers: 0 }, { phase: 0, perGroup: [4, 6], groups: nC }] }
    }
  },
  rules: ['Três ligas de 18 seleções, cada uma com 3 grupos de 6 (dois times de cada pote por grupo, potes pelo ranking geral da edição anterior).',
    'Cada seleção faz 6 jogos: ida e volta contra o parceiro de pote e um jogo contra cada um dos outros 4 (2 em casa, 2 fora).',
    'Liga A: 1ºs, 2ºs e os 2 melhores 3ºs vão às quartas (ida e volta, sorteio sem repetir grupo, o mais bem colocado decide em casa). Semifinais por sorteio aberto, 3º lugar e final em jogo único.',
    'Acesso e descenso: 1ºs das Ligas B e C sobem; 6ºs das Ligas A e B caem.',
    'Playoffs (ida e volta): 4º e 5º da Liga A × 2º e 3º da Liga B; 4º e 5º da Liga B × 2º e 3º da Liga C. Vencedor fica na liga de cima.',
    'Ao terminar, "Criar próxima temporada" monta a edição seguinte.'],
  notes: ['Formato aprovado pela UEFA para 2028/29 em diante; alguns detalhes ainda dependiam de confirmação final.'],
  sources: [SRC_NT.unl28, SRC_NT.unlFmt]
});

/* ---------- Copa América (10 seleções da Conmebol) ---------- */
add({
  id: 'copa-america', name: 'Copa América (Conmebol)', group: 'Seleções · Conmebol', icon: 'groups', short: '10 seleções · 2 grupos de 5 + quartas',
  entries: { hosts: [], teams: CONF('CONMEBOL') }, roles: { hosts: 'Sede (joga em casa)', teams: 'Seleções' },
  hostCfg: { mode: 'flag', pool: ['teams'], max: 2 }, champion: { phase: 1 },
  build(e) {
    const h = e.hosts.length;
    return {
      phases: [
        { type: 'rr', name: 'Fase de grupos', teams: { list: [{ entry: 'hosts' }, { entry: 'teams', sortBy: { rating: true } }] }, groups: { count: 2, fixedCount: h }, dedupe: true, legs: 1, neutral: true, tiebreak: ['pts', 'gd', 'gf', 'h2h'],
          zonesEach: [zone(1, 4, Z.lib, 'Quartas de final')] },
        { type: 'ko', name: 'Mata-mata', after: [0], teams: { phase: 0, groupTop: 4 }, pairing: 'crossGroups', legs: 1, neutral: true, et: false, pens: true, final: { et: true }, roundNames: ['Quartas de final', 'Semifinal', 'Final'] },
        thirdPlace(1, 1)
      ], champion: { phase: 1 }
    };
  },
  rules: ['As 10 seleções da Conmebol em 2 grupos de 5 (sorteio por potes do ranking), turno único em campo neutro; a sede joga em casa.',
    'Avançam os 4 primeiros de cada grupo. Quartas: 1ºA × 4ºB, 2ºA × 3ºB, 1ºB × 4ºA, 2ºB × 3ºA.',
    'Quartas, semifinais e 3º lugar: empate vai direto aos pênaltis. Final com prorrogação e pênaltis.',
    'Desempate: pontos, saldo, gols marcados, confronto direto.'],
  notes: ['Modelo simples, sem convidados, no formato da Copa América de 2021 (a última só com as 10 da Conmebol).'],
  sources: [SRC_NT.fifa]
});

/* ---------- Liga das Nações da Concacaf 2026/27 ---------- */
const CNL_ROLES = ['A1', 'A2', 'B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3'];
const cA = [0, 1], cB = [2, 3, 4, 5], cC = [6, 7, 8];
add({
  id: 'cnl-2627', name: 'Liga das Nações da Concacaf 2026/27', group: 'Seleções · Concacaf', icon: 'groups', short: '41 seleções em 3 ligas · vagas na Copa Ouro',
  entries: {
    seeded: N('mexico', 'usa', 'canada', 'panama'),
    A1: N('curacao', 'haiti', 'dominican-republic', 'costa-rica', 'trinidad-and-tobago', 'nicaragua'), A2: N('guatemala', 'jamaica', 'suriname', 'honduras', 'martinique', 'el-salvador'),
    B1: N('guyana', 'puerto-rico', 'cayman-islands', 'dominica'), B2: N('barbados', 'saint-lucia', 'guadeloupe', 'bermuda'), B3: N('cuba', 'saint-kitts-and-nevis', 'bonaire', 'grenada'), B4: N('saint-vincent-and-the-grenadines', 'french-guiana', 'belize', 'sint-maarten'),
    C1: N('montserrat', 'turks-and-caicos-islands', 'british-virgin-islands'), C2: N('antigua-and-barbuda', 'aruba', 'anguilla'), C3: N('saint-martin', 'us-virgin-islands', 'bahamas')
  },
  roles: { seeded: 'Liga A · direto nas quartas', ...Object.fromEntries(CNL_ROLES.map(r => [r, `Liga ${r[0]} · Grupo ${r[1]}`])) }, champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase de grupos', groups: { method: 'roles', roles: CNL_ROLES, names: CNL_ROLES.map(r => `Liga ${r[0]} · Grupo ${r[1]}`) }, legsEach: [1, 1, 2, 2, 2, 2, 2, 2, 2], schedEach: ['drop', 'drop'], tiebreak: ['pts', 'gd', 'gf', 'h2h'],
      groupZones: [...cA.map(() => [zone(1, 2, Z.lib, 'Quartas de final'), zone(3, 4, Z.prelib, 'Preliminar da Copa Ouro'), zone(5, 6, Z.rel, 'Play-In e queda para a Liga B')]),
        ...cB.map(() => [zone(1, 1, Z.up, 'Sobe para a Liga A e vai à Copa Ouro'), zone(2, 2, Z.prelib, '2 melhores 2ºs: preliminar da Copa Ouro'), zone(4, 4, Z.rel, 'Cai para a Liga C')]),
        ...cC.map(() => [zone(1, 1, Z.up, 'Sobe para a Liga B e vai ao Play-In'), zone(2, 2, Z.prelib, 'Melhor 2º também sobe')])] },
    { type: 'ko', name: 'Liga A · Mata-mata', after: [0], teams: { list: [{ entry: 'seeded', sortBy: { rating: true } }, { phase: 0, perGroup: [1, 2], groups: cA }] },
      pairing: 'drawNoSame', groupPhase: 0, legs: 2, et: true, pens: true, roundsCfg: [{ legs: 2 }, { legs: 1, neutral: true }], final: { legs: 1, neutral: true }, roundNames: ['Quartas de final', 'Semifinal', 'Final'] },
    thirdPlace(1, 1),
    { type: 'ko', name: 'Liga B · Finais', after: [0], teams: { phase: 0, perGroup: [1, 1], groups: cB }, legs: 1, neutral: true, et: true, pens: true, roundNames: ['Semifinal', 'Final'] },
    thirdPlace(3, 0),
    { type: 'ko', name: 'Liga C · Finais', after: [0], teams: { list: [{ phase: 0, perGroup: [1, 1], groups: cC }, { phase: 0, perGroup: [2, 2], groups: cC, take: [0, 1] }] }, legs: 1, neutral: true, et: true, pens: true, roundNames: ['Semifinal', 'Final'] },
    thirdPlace(5, 0),
    { type: 'ko', name: 'Play-In', after: [0], teams: { list: [{ phase: 0, perGroup: [5, 6], groups: cA }, { phase: 5, entrants: true }] }, pairing: 'halves', legs: 2, et: false, pens: true, maxRounds: 1, roundNames: ['Play-In'] }
  ],
  outcomes: [
    { label: 'Copa Ouro 2027 (vaga direta)', color: Z.lib, src: { list: [{ phase: 1, roundWinners: 0 }, { phase: 0, perGroup: [1, 1], groups: cB }] } },
    { label: 'Preliminar da Copa Ouro', color: Z.prelib, src: { list: [{ phase: 1, roundLosers: 0 }, { phase: 0, perGroup: [3, 4], groups: cA }, { phase: 0, perGroup: [2, 2], groups: cB, take: [0, 2] }, { phase: 7, roundWinners: 0 }] } },
    { label: 'Sobem para a Liga A', color: Z.up, src: { phase: 0, perGroup: [1, 1], groups: cB } },
    { label: 'Sobem para a Liga B', color: Z.up, src: { phase: 5, entrants: true } },
    { label: 'Caem para a Liga B', color: Z.rel, src: { phase: 0, perGroup: [5, 6], groups: cA } },
    { label: 'Caem para a Liga C', color: Z.rel, src: { phase: 0, perGroup: [4, 4], groups: cB } }
  ],
  rules: ['41 seleções em três ligas. México, EUA, Canadá e Panamá entram direto nas quartas da Liga A.',
    'Liga A: 2 grupos de 6; cada seleção faz 4 jogos (2 em casa), sem enfrentar um dos rivais do grupo. 1º e 2º vão às quartas; 3º e 4º à preliminar da Copa Ouro; 5º e 6º ao Play-In e caem para a Liga B.',
    'Quartas da Liga A em ida e volta (cabeças contra os classificados dos grupos, por sorteio). Semifinais, 3º lugar e final em jogo único.',
    'Liga B: 4 grupos de 4, ida e volta. 1ºs sobem, vão à Copa Ouro e às finais da Liga B; os 2 melhores 2ºs vão à preliminar; 4ºs caem.',
    'Liga C: 3 grupos de 3, ida e volta. 1ºs e o melhor 2º sobem, vão às finais da Liga C e ao Play-In.',
    'Play-In (ida e volta): 5º e 6º da Liga A contra os 4 da Liga C; os vencedores vão à preliminar da Copa Ouro.',
    'Copa Ouro 2027: vagas diretas para os 4 vencedores das quartas da Liga A e os 4 campeões de grupo da Liga B; mais 14 seleções na preliminar.'],
  notes: ['Grupos reais da edição 2026/27; a simulação começa do zero. Martinica, Guadalupe, Guiana Francesa, Bonaire, Sint Maarten e Saint-Martin não são da FIFA: entram sem escudo e com força estimada.',
    'Desempate e chaveamento das finais foram simplificados (pontos, saldo, gols, confronto direto; semifinal 1º × 4º e 2º × 3º).'],
  sources: [SRC_NT.cnl]
});

/* Liga das Nações da Concacaf: temporadas seguintes (mesmo formato, grupos sorteados por potes do ranking) */
{
  const cnl = T_.find(t => t.id === 'cnl-2627');
  const A_SRC = { list: [{ phase: 0, perGroup: [1, 4], groups: cA }, { entry: 'seeded' }, { phase: 0, perGroup: [1, 1], groups: cB }] };
  const SEEDED = { ...A_SRC, sortBy: { rating: true }, take: [0, 4] };
  const next = {
    template: 'cnl-next', keepOrder: true,
    entries: {
      seeded: SEEDED,
      A: { ...A_SRC, minus: SEEDED, sortBy: { rating: true } },
      B: { list: [{ phase: 0, perGroup: [5, 6], groups: cA }, { phase: 0, perGroup: [2, 3], groups: cB }, { phase: 5, entrants: true }], sortBy: { rating: true } },
      C: { list: [{ phase: 0, perGroup: [4, 4], groups: cB }, { phase: 0, perGroup: [2, 3], groups: cC }], minus: { phase: 5, entrants: true }, sortBy: { rating: true } }
    }
  };
  cnl.nextSeason = next;
  cnl.rules = [...cnl.rules, 'Ao terminar, o botão "Criar próxima temporada" monta a edição seguinte com quem subiu e quem caiu.'];
  T_.push({
    ...cnl, id: 'cnl-next', name: 'Liga das Nações da Concacaf', group: '_oculto',
    entries: { seeded: [], A: [], B: [], C: [] }, roles: { seeded: 'Liga A · direto nas quartas', A: 'Liga A', B: 'Liga B', C: 'Liga C' },
    phases: cnl.phases.map((ph, i) => i === 0 ? { ...ph, groups: { method: 'multi', parts: [{ teams: { entry: 'A' }, count: 2, prefix: 'Liga A · Grupo ' }, { teams: { entry: 'B' }, count: 4, prefix: 'Liga B · Grupo ' }, { teams: { entry: 'C' }, count: 3, prefix: 'Liga C · Grupo ' }] } } : ph),
    nextSeason: next,
    notes: ['Edição criada a partir da anterior. As 4 seleções da Liga A com melhor ranking entram direto nas quartas; as outras 12 são sorteadas em 2 grupos de 6 por potes. Ligas B e C também por potes do ranking.',
      'O formato repete o de 2026/27; a Concacaf ainda não divulgou o da edição seguinte.']
  });
}

/* ---------- Copa Ouro 2027 ---------- */
add({
  id: 'gold-cup-2027', name: 'Copa Ouro da Concacaf 2027', group: 'Seleções · Concacaf', icon: 'groups', short: '16 seleções · 2 grupos de 8 (4 jogos cada) + quartas',
  entries: { hosts: N('usa'), teams: [...CONF('CONCACAF').slice(0, 15), 'sel-saudi-arabia'] }, roles: { hosts: 'Sede (joga em casa)', teams: 'Seleções (15 da Concacaf + Arábia Saudita convidada)' },
  hostCfg: { mode: 'flag', pool: ['teams'], max: 3 },
  build(e) {
    const h = e.hosts.length;
    return {
      phases: [
        { type: 'rr', name: 'Fase de grupos', teams: { list: [{ entry: 'hosts' }, { entry: 'teams', sortBy: { rating: true } }] }, dedupe: true, groups: { count: 2, fixedCount: Math.min(h, 2) }, sched: 'bands', neutral: true, tiebreak: ['pts', 'gd', 'gf', 'h2h'],
          zonesEach: [zone(1, 4, Z.lib, 'Quartas de final')] },
        { type: 'ko', name: 'Mata-mata', after: [0], teams: { phase: 0, groupTop: 4 }, pairing: 'crossGroups', ...KO_NT, roundNames: ['Quartas de final', 'Semifinal', 'Final'] }
      ], champion: { phase: 1 }
    };
  },
  rules: ['16 seleções em 8 potes de 2 pelo ranking; cada grupo de 8 recebe uma de cada pote.',
    'Dentro do grupo, as 8 ficam em 4 faixas; cada seleção faz 4 jogos, um contra cada faixa (inclusive a sua). Tabela única por grupo.',
    'Os 4 primeiros de cada grupo vão às quartas: 1ºA × 4ºB, 2ºA × 3ºB, 1ºB × 4ºA, 2ºB × 3ºA. Mata-mata em jogo único com prorrogação e pênaltis, sem 3º lugar.',
    'Jogos em campo neutro, a não ser os da sede.'],
  notes: ['Novo formato anunciado pela Concacaf para 2027. Classificação real: 8 vagas pela Liga das Nações e 7 pela preliminar de março de 2027; aqui entram as 15 melhores do ranking (dá para trocar). As sedes ainda não foram anunciadas; os EUA vêm marcados por padrão.'],
  sources: [SRC_NT.gold]
});

/* ---------- Copa Africana de Nações 2027 com eliminatórias ---------- */
add({
  id: 'afcon-2027', name: 'Copa Africana de Nações 2027 (com eliminatórias)', group: 'Seleções · CAF', icon: 'groups', short: 'Pré-eliminatória + 12 grupos + 24 seleções na fase final',
  entries: { hosts: N('kenya', 'tanzania', 'uganda'), qual: CONF('CAF') },
  roles: { hosts: 'Sedes · jogam as eliminatórias, mas já estão garantidas', qual: 'Eliminatórias' },
  hostCfg: { mode: 'flag', pool: ['qual'], max: 6 },
  build(e) {
    const h = e.hosts.length, Q = e.qual.length, P = Math.max(0, Q - 48);
    const pre = P > 0;
    const preSrc = { entry: 'qual', noHosts: true, sortBy: { rating: true }, take: [Q - h - 2 * P, Q - h] };
    const phases = [];
    if (pre) phases.push({ type: 'ko', name: 'Pré-eliminatória', teams: preSrc, pairing: 'pairs', pairs: Array.from({ length: P }, (_, k) => [k, 2 * P - 1 - k]), legs: 2, et: false, pens: true, maxRounds: 1, roundNames: ['Pré-eliminatória'] });
    const q = phases.length;
    phases.push({ type: 'rr', name: 'Eliminatórias', after: pre ? [0] : [], teams: { list: [{ entry: 'qual', minus: preSrc, sortBy: { rating: true } }, ...(pre ? [{ phase: 0, winners: true }] : [])] },
      groups: { count: 12, separate: true }, legs: 2, tiebreak: ['pts', 'h2h', 'gd', 'gf'],
      zonesEach: [zone(1, 2, Z.lib, 'Classificados (no grupo de uma sede: a sede + o melhor dos outros)')] });
    const f = phases.length;
    phases.push({ type: 'rr', name: 'Fase de grupos', after: [q], teams: { phase: q, hostsQual: true },
      groups: { count: 6, byRating: true, hostsFirst: true }, legs: 1, neutral: true, tiebreak: ['pts', 'h2h', 'gd', 'gf'], zonesEach: [zone(1, 2, Z.lib, 'Oitavas de final'), zone(3, 3, Z.prelib, '4 melhores 3ºs avançam')] });
    phases.push({ type: 'ko', name: 'Mata-mata', after: [f], teams: { phase: f }, pairing: 'thirds24', ...KO_NT, roundNames: ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'] });
    phases.push(thirdPlace(f + 1, 2));
    return {
      phases, champion: { phase: f + 1 },
      outcomes: [{ label: 'Classificados pelas eliminatórias', src: { phase: q, hostsQual: true, noHosts: true } }],
      rules: [h ? `Sedes: ${e.hosts.map(id => (BASE_TEAMS.find(t => t.id === id) || {}).name).join(', ')}. Jogam as eliminatórias, mas já estão garantidas na fase final.` : 'Sem sedes: os 2 primeiros de cada grupo se classificam.',
        `${Q} seleções${pre ? `; as ${2 * P} piores do ranking (fora as sedes) jogam a pré-eliminatória` : ''}; 12 grupos de 4.`]
    };
  },
  rules: ['Pré-eliminatória (ida e volta) para as piores do ranking, até sobrarem 48 seleções. As sedes nunca caem nela.',
    'Eliminatórias: 12 grupos de 4 (potes pelo ranking, sedes em grupos diferentes), ida e volta.',
    'As sedes jogam normalmente, mas já estão classificadas. No grupo de uma sede, a outra vaga vai para a melhor das outras três; nos demais grupos, classificam os 2 primeiros. Assim sempre saem 24 seleções.',
    'Fase final: 24 seleções em 6 grupos de 4; as sedes ficam nos primeiros grupos e jogam em casa, os demais jogos são em campo neutro. Avançam os 2 primeiros e os 4 melhores 3ºs.',
    'Mata-mata em jogo único com prorrogação e pênaltis, com disputa de 3º lugar.',
    'Desempate nos grupos: pontos, confronto direto, saldo, gols marcados.'],
  notes: ['Regra real da edição de 2027 (Quênia, Tanzânia e Uganda). Os grupos reais das eliminatórias já foram sorteados; aqui o sorteio é refeito por potes do ranking.'],
  sources: [SRC_NT.afcon, SRC_NT.fifa]
});

/* ---------- Copa da Ásia 2027 ---------- */
add({
  id: 'asian-cup-2027', name: 'Copa da Ásia 2027', group: 'Seleções · AFC', icon: 'groups', short: '24 seleções · 6 grupos + oitavas · Arábia Saudita',
  entries: {
    hosts: N('saudi-arabia'),
    gA: N('saudi-arabia', 'kuwait', 'oman', 'palestine'), gB: N('uzbekistan', 'bahrain', 'north-korea', 'jordan'), gC: N('iran', 'syria', 'kyrgyztan', 'china'),
    gD: N('australia', 'tajikistan', 'iraq', 'singapore'), gE: N('south-korea', 'united-arab-emirates', 'vietnam', 'yemen'), gF: N('japan', 'qatar', 'thailand', 'indonesia')
  },
  roles: { hosts: 'Sede (joga em casa)', gA: 'Grupo A', gB: 'Grupo B', gC: 'Grupo C', gD: 'Grupo D', gE: 'Grupo E', gF: 'Grupo F' },
  hostCfg: { mode: 'flag', pool: ['gA', 'gB', 'gC', 'gD', 'gE', 'gF'], max: 3 }, champion: { phase: 1 },
  phases: [
    { type: 'rr', name: 'Fase de grupos', groups: { method: 'roles', roles: ['gA', 'gB', 'gC', 'gD', 'gE', 'gF'], names: ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F'] }, legs: 1, neutral: true, tiebreak: ['pts', 'h2h', 'gd', 'gf'],
      zonesEach: [zone(1, 2, Z.lib, 'Oitavas de final'), zone(3, 3, Z.prelib, '4 melhores 3ºs avançam')] },
    { type: 'ko', name: 'Mata-mata', after: [0], teams: { phase: 0 }, pairing: 'thirds24', ...KO_NT, roundNames: ['Oitavas de final', 'Quartas de final', 'Semifinal', 'Final'] }
  ],
  rules: ['24 seleções em 6 grupos de 4, turno único. A sede joga em casa; os outros jogos são em campo neutro.',
    'Avançam os 2 primeiros e os 4 melhores 3ºs. Os 3ºs são encaixados nas oitavas pelos grupos de origem.',
    'Mata-mata em jogo único com prorrogação e pênaltis, sem disputa de 3º lugar.',
    'Desempate: pontos, confronto direto, saldo, gols marcados.'],
  notes: ['Classificados e grupos reais (sorteio de 9 de maio de 2026). O encaixe dos 3ºs segue o modelo da Euro, parecido com a tabela da AFC.'],
  sources: [SRC_NT.asia]
});

/* ---------- Copa das Nações da OFC ---------- */
add({
  id: 'ofc-nations', name: 'Copa das Nações da OFC', group: 'Seleções · OFC', icon: 'groups', short: 'Eliminatória das 4 piores + 8 seleções em 2 grupos',
  entries: { hosts: [], teams: CONF('OFC') }, roles: { hosts: 'Sedes · classificadas direto', teams: 'Seleções' },
  hostCfg: { mode: 'direct', pool: 'teams', max: 2 },
  build(e) {
    const h = e.hosts.length, Q = e.teams.length, direct = 7 - h;
    return {
      phases: [
        { type: 'rr', name: 'Eliminatória', teams: { entry: 'teams', sortBy: { rating: true }, take: [direct, Q] }, legs: 1, neutral: true, tiebreak: ['pts', 'gd', 'gf', 'h2h'], zones: [zone(1, 1, Z.lib, 'Vai à fase final')] },
        { type: 'rr', name: 'Fase de grupos', after: [0], teams: { list: [{ entry: 'hosts' }, { list: [{ entry: 'teams', sortBy: { rating: true }, take: [0, direct] }, { phase: 0, pos: [1, 1] }], sortBy: { rating: true } }] },
          groups: { count: 2, fixedCount: h }, legs: 1, neutral: true, tiebreak: ['pts', 'gd', 'gf', 'h2h'], zonesEach: [zone(1, 2, Z.lib, 'Semifinal')] },
        { type: 'ko', name: 'Mata-mata', after: [1], teams: { list: [{ phase: 1, group: 0, pos: [1, 2] }, { phase: 1, group: 1, pos: [1, 2] }] }, pairing: 'pairs', pairs: [[0, 3], [2, 1]], ...KO_NT, roundNames: ['Semifinal', 'Final'] },
        thirdPlace(2, 0)
      ], champion: { phase: 2 }
    };
  },
  rules: ['As 4 piores do ranking (sem contar sedes) jogam uma eliminatória em turno único; só o 1º avança.',
    'Fase final com 8 seleções em 2 grupos de 4 (sedes no pote 1 e em casa; demais jogos em campo neutro). Os 2 primeiros vão às semifinais (1ºA × 2ºB, 1ºB × 2ºA).',
    'Semifinais, 3º lugar e final em jogo único com prorrogação e pênaltis.'],
  notes: ['Formato da edição de 2024. A próxima edição ainda não tem sede nem formato confirmados.'],
  sources: [SRC_NT.ofc]
});

// Escudos das competições (FootyLogos)
const CRESTS = {
  'austria-2627': 'lg-austrian-bundesliga',
  'belgica-2627': 'lg-belgian-pro-league',
  'botola-2627': 'lg-botola-pro-1',
  'bundesliga2-2627': 'lg-bundesliga-2-germany',
  'bundesliga-2627': 'lg-bundesliga-germany',
  'china-2026': 'lg-chinese-super-league',
  'championship-2627': 'lg-efl-championship-england',
  'eredivisie-2627': 'lg-eredivisie-netherlands',
  'europa-2627': 'lg-europa-league',
  'j1-2627': 'lg-j1-league-japan',
  'kleague-2026': 'lg-k-league-1-south-korea',
  'laliga2-2627': 'lg-laliga-2-spain',
  'laliga-2627': 'lg-laliga-spain',
  'ligamx-apertura-2026': 'lg-liga-mx',
  'liga2-por-2627': 'lg-liga-portugal-2',
  'argentina-clausura-2026': 'lg-liga-profesional-argentina',
  'ligue1-2627': 'lg-ligue-1-france',
  'ligue2-2627': 'lg-ligue-2-france',
  'mls-2026': 'lg-mls',
  'portugal-2627': 'lg-primeira-liga-portugal',
  'uruguay-2026': 'lg-primera-divisin-uruguay',
  'russia-2627': 'lg-russian-premier-league',
  'saudi-2627': 'lg-saudi-pro-league',
  'scotland-2627': 'lg-scottish-premiership',
  'servia-2627': 'lg-serbian-superliga',
  'seriea-2627': 'lg-serie-a-italy',
  'superlig-2627': 'lg-super-lig-turkey',
  'dinamarca-2627': 'lg-superliga-denmark',
  'suica-2627': 'lg-swiss-football-league',
  'champions-2627': 'lg-uefa-champions-league',
  'conference-2627': 'lg-uefa-conference-league',
  'euro-2028': 'lg-euro',
  'unl-2627': 'lg-uefa-nations-league',
  'unl-next': 'lg-uefa-nations-league',
  'copa-america': 'lg-copa-america',
  'cnl-2627': 'lg-concacaf-nations-league',
  'gold-cup-2027': 'lg-gold-cup',
  'afcon-2027': 'lg-afcon',
  'asian-cup-2027': 'lg-afc-asian-cup',
  'ofc-nations': 'lg-ofc-nations-cup',
  'egito-2627': 'lg-egyptian-premier-league',
  'serieb-ita-2627': 'lg-serie-b-italy',
  'psl-2627': 'lg-psl-south-africa',
  'croacia-2627': 'lg-supersport-hnl',
  'greece-2627': 'lg-super-league-greece'
};
T_.forEach(t => { if (!t.crest && CRESTS[t.id]) t.crest = `assets/logos/${CRESTS[t.id]}.png`; });

return { TEMPLATES: T_, TEMPLATE_GROUPS: ['Brasil', 'América do Sul', 'Ligas europeias', 'Segundas divisões', 'Copas europeias', 'Outras ligas', 'Seleções · UEFA', 'Seleções · Conmebol', 'Seleções · Concacaf', 'Seleções · CAF', 'Seleções · AFC', 'Seleções · OFC'] };
})();
