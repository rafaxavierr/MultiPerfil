/* MULTIPERFIL - protótipo. Camadas: DB (LocalStorage) · Sensores (simulados) · IA (regras/histórico) · UI */
const K = 'multipERFIL_DB'
let DB,
  U,
  V = 'dash',
  stream
const ST = [
  'PEDIDO RECEBIDO',
  'OP GERADA',
  'AGUARDANDO PRODUÇÃO',
  'EM MISTURA',
  'AGUARDANDO LABORATÓRIO',
  'AGUARDANDO ENVASE',
  'EM ENVASE',
  'PRODUÇÃO CONCLUÍDA',
  'EM ESTOQUE',
  'EM EXPEDIÇÃO',
  'ENTREGUE',
  'CONCLUÍDA',
]
const PROD = [
  'Massa Drywall Premium',
  'Massa Drywall Standard',
  'Tinta Acrílica Premium',
  'Tinta Acrílica Standard',
]
const CLI = [
  'Construtora ABC',
  'Obras Norte',
  'Decor Casa',
  'Grupo Vértice',
  'Reforma Fácil',
]
const MOT = [
  'Limpeza da linha',
  'Parada da bomba',
  'Falha do equipamento',
  'Ajuste de pressão',
  'Produto fora de especificação',
  'Erro operacional',
  'Troca de produto',
  'Outro',
]
const R = (a, b) => a + Math.random() * (b - a),
  avg = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1),
  pick = (a) => a[Math.floor(Math.random() * a.length)]
const f = (n, d = 0) =>
  Number(n).toLocaleString('pt-BR', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  })
const now = () => new Date().toLocaleString('pt-BR')
const $ = (s) => document.querySelector(s)
const MENU = {
  dash: 'Dashboard',
  ped: 'Pedidos',
  ops: 'Ordens de Produção',
  mix: 'Misturadores',
  lab: 'Laboratório',
  env: 'Envase',
  bom: 'Bombas',
  est: 'Estoque / Expedição',
  rast: 'Rastreabilidade',
  ia: 'IA Industrial',
  mega: 'Integração Mega ERP',
  log: 'Auditoria',
  cfg: 'Configurações',
}
const ROLE = {
  admin: Object.keys(MENU),
  supervisor: [
    'dash',
    'ped',
    'ops',
    'mix',
    'lab',
    'env',
    'bom',
    'est',
    'rast',
    'ia',
    'mega',
    'log',
  ],
  pcp: ['dash', 'ped', 'ops', 'rast', 'mega'],
  tecnico: ['dash', 'ops', 'mix', 'rast', 'ia'],
  laboratorio: ['dash', 'lab', 'rast', 'ia'],
  producao: ['dash', 'env', 'bom', 'rast', 'ia'],
  estoque: ['dash', 'est', 'rast'],
}
const save = () => (localStorage[K] = JSON.stringify(DB))
const log = (m) => {
  DB.historico.unshift({ t: now(), u: U ? U.nome : 'Sistema', m })
  DB.historico = DB.historico.slice(0, 200)
  save()
}
const alerta = (n, m) => {
  DB.alertasIA.unshift({ t: now(), n, m })
  DB.alertasIA = DB.alertasIA.slice(0, 40)
  save()
}
const op = (id) => DB.ordensProducao.find((o) => o.id == id)
const nLote = () => {
  const d = new Date(),
    p = (n) => String(n).padStart(2, '0')
  return `MP-${p(d.getDate())}${p(d.getMonth() + 1)}${String(d.getFullYear()).slice(2)}-${p(DB.lseq++)}`
}
function mkOp(p, status) {
  const o = {
    id: DB.seq++,
    pedido: p.id,
    cliente: p.cliente,
    produto: p.produto,
    plan: p.qtd,
    prod: 0,
    lote: nLote(),
    mix: null,
    bomba: null,
    status,
    prio: 'Normal',
    prazo: p.entrega,
    lab: null,
    perdas: [],
    rpm: null,
    operador: null,
  }
  DB.ordensProducao.push(o)
  return o
}
function initializeDatabase(force) {
  if (!force && localStorage[K]) {
    DB = JSON.parse(localStorage[K])
    return
  }
  const P = [
    ['Carlos Oliveira', 'Técnico de Produção', 'Produção', 'tecnico'],
    ['Mariana Santos', 'Laboratório / Qualidade', 'Qualidade', 'laboratorio'],
    ['João Pereira', 'Operador de Produção', 'Produção', 'producao'],
    ['Ana Costa', 'PCP', 'PCP', 'pcp'],
    ['Rafael Almeida', 'Supervisor de Produção', 'Produção', 'supervisor'],
    ['Juliana Martins', 'Estoque / Expedição', 'Logística', 'estoque'],
    ['Administrador do Sistema', 'Administrador', 'TI', 'admin'],
  ]
  DB = {
    seq: 181,
    lseq: 1,
    usuarios: P.map((p, i) => ({
      id: i + 1,
      nome: p[0],
      cargo: p[1],
      setor: p[2],
      permissao: p[3],
      rosto: 'perfil-demo-0' + (i + 1),
    })),
    pedidos: [],
    ordensProducao: [],
    misturadores: [1, 2].map((i) => ({
      id: 'MIX 0' + i,
      status: 'DISPONÍVEL',
      op: null,
      temp: 26.4,
      rpm: 0,
      carga: 0,
      t0: 0,
    })),
    bombas: [1, 2, 3, 4].map((i) => ({
      id: 'Bomba 0' + i,
      status: 'DISPONÍVEL',
      rpm: 0,
      vaz: 0,
      pres: 0,
      temp: 24,
      min: 0,
      litros: 0,
      ef: 95,
      op: null,
      anom: 0,
      nAnom: 0,
      hist: [94, 95, 93, 96, 95],
    })),
    estoque: [],
    entregas: [],
    historico: [],
    alertasIA: [],
    hist: [],
    configuracoes: { rpmMin: 800, rpmMax: 1500 },
    mega: { sync: now(), pedidos: 24, ops: 18, pend: 0 },
  }
  PROD.forEach((pr) => {
    for (let i = 0; i < 10; i++) {
      const v = R(3600, 5400)
      DB.hist.push({
        produto: pr,
        visc: v,
        temp: R(23, 30),
        rpm: 1050 + (v - 4000) * 0.25 + R(-40, 40),
        perda: R(1.2, 3),
        vaz: R(37, 42),
      })
    }
  })
  ;[
    [45818, 'Obras Norte', PROD[2], 1800],
    [45819, 'Decor Casa', PROD[0], 2400],
    [45820, 'Reforma Fácil', PROD[3], 1500],
  ].forEach((d, i) => {
    DB.pedidos.push({
      id: d[0],
      cliente: d[1],
      produto: d[2],
      qtd: d[3],
      entrega: '03/10/2026',
      status: 'OP GERADA',
    })
    const o = mkOp(
      DB.pedidos[i],
      ['AGUARDANDO LABORATÓRIO', 'AGUARDANDO ENVASE', 'AGUARDANDO PRODUÇÃO'][i]
    )
    if (i < 2) {
      o.prod = Math.round(d[3] * 0.99)
      o.mix = 'MIX 0' + (i + 1)
      o.operador = 'Carlos Oliveira'
    }
    if (i == 1)
      o.lab = {
        status: 'aprovado',
        visc: R(4300, 5000),
        dens1: 1.42,
        dens2: 1.41,
        ph: 8.1,
        temp: 25.8,
        placas: 'APROVADO',
        obs: '',
        por: 'Mariana Santos',
      }
  })
  ;[
    [45821, 'Construtora ABC', PROD[0], 2000],
    [45822, pick(CLI), PROD[2], 1600],
    [45823, pick(CLI), PROD[1], 2200],
  ].forEach((d) =>
    DB.pedidos.push({
      id: d[0],
      cliente: d[1],
      produto: d[2],
      qtd: d[3],
      entrega: '05/10/2026',
      status: 'PEDIDO RECEBIDO',
    })
  )
  alerta('y', 'Lote aguardando laboratório')
  save()
}
/* ---------- SENSORES ---------- */
function tick() {
  DB.bombas.forEach((b) => {
    if (b.status !== 'OPERANDO') {
      b.rpm = b.vaz = b.pres = 0
      return
    }
    const o = op(b.op),
      tgt = o.rpm || 1200
    if (!b.anom && Math.random() < 0.04) {
      b.anom = 6
      b.nAnom++
      alerta('y', b.id + ' apresenta queda de vazão e aumento de pressão')
    }
    const vt = tgt * 0.0304 * (b.anom ? 0.68 : 1),
      pt = 3.6 + ((tgt - 900) / 600) * 0.5 + (b.anom ? 1 : 0)
    b.rpm += (tgt - b.rpm) * 0.4 + R(-15, 15)
    b.vaz += (vt - b.vaz) * 0.35 + R(-0.5, 0.5)
    b.pres += (pt - b.pres) * 0.35 + R(-0.05, 0.05)
    b.temp += (28 - b.temp) * 0.05 + R(-0.2, 0.3)
    if (b.anom) b.anom--
    b.min += 2.5 / 60
    b.litros += (b.vaz * 2.5) / 60
    b.ef = Math.round(
      Math.max(60, Math.min(99, 97 - b.nAnom * 1.5 - Math.max(0, 38 - b.vaz)))
    )
    if (Math.random() < 0.15) {
      b.hist.push(b.ef)
      b.hist = b.hist.slice(-12)
    }
  })
  DB.misturadores.forEach((m) => {
    if (m.status === 'PRODUZINDO') {
      m.temp += (29 - m.temp) * 0.05 + R(-0.1, 0.2)
      m.rpm = Math.round(48 + R(-2, 2))
    } else {
      m.rpm = 0
    }
  })
  save()
  if (U && ['bom', 'mix', 'dash'].includes(V)) draw()
}
setInterval(tick, 2500)
/* ---------- IA ---------- */
function rec(o) {
  const v = o.lab?.visc || 4850,
    h = DB.hist.filter((x) => x.produto === o.produto)
  let s = h.filter((x) => Math.abs(x.visc - v) < v * 0.12)
  if (s.length < 5) s = h
  const rp = s.map((x) => x.rpm),
    m = Math.round(avg(rp)),
    c = DB.configuracoes
  return {
    rpm: m,
    min: Math.round(Math.min(...rp)),
    max: Math.round(Math.max(...rp)),
    vaz: avg(s.map((x) => x.vaz)),
    perda: avg(s.map((x) => x.perda)),
    n: s.length,
    v,
    bloq: m < c.rpmMin || m > c.rpmMax,
    lim: m > c.rpmMax ? c.rpmMax : c.rpmMin,
  }
}
function resp(q) {
  q = q.toLowerCase()
  const os = DB.ordensProducao,
    B = DB.bombas
  if (/velocidade|rpm/.test(q)) {
    const o = os.find((x) => x.status === 'AGUARDANDO ENVASE' && x.lab)
    if (!o) return 'Nenhum lote liberado aguardando envase.'
    const r = rec(o)
    return `Para ${o.lote} (${o.produto}), sugiro ${f(r.rpm)} RPM (faixa ${f(r.min)}–${f(r.max)}), com base em ${r.n} lotes semelhantes.${r.bloq ? ' A sugestão está fora dos limites e foi bloqueada.' : ''}`
  }
  if (/anomal|ineficien|bomba/.test(q)) {
    const a = B.filter((b) => b.anom || b.nAnom)
    const w = [...B]
      .filter((b) => b.status === 'OPERANDO')
      .sort((x, y) => x.ef - y.ef)[0]
    return a.length
      ? `Bombas com anomalias registradas: ${a.map((b) => `${b.id} (${b.nAnom} ocorrência(s), eficiência ${b.ef}%, vazão atual ${f(b.vaz, 1)} L/min)`).join('; ')}. Possíveis causas: obstrução, variação de viscosidade ou entrada de ar — recomenda-se verificar o equipamento.`
      : w
        ? `Nenhuma anomalia ativa. Menor eficiência: ${w.id} com ${w.ef}%.`
        : 'Nenhuma bomba operando no momento.'
  }
  if (/perda/.test(q)) {
    const o = [...os].reverse().find((x) => x.perdas.length)
    return o
      ? `${o.lote}: ${f(o.perdas.reduce((a, p) => a + p.kg, 0))} kg de perda. Motivos: ${o.perdas.map((p) => p.motivo).join(', ')}.`
      : 'Ainda não há perdas registradas.'
  }
  if (/compar/.test(q)) {
    const o = [...os].reverse().find((x) => x.lab)
    if (!o) return 'Sem lote analisado.'
    const r = rec(o)
    return `${o.lote} tem viscosidade ${f(o.lab.visc)} cP. Lotes semelhantes: ${r.n}, perda média ${f(r.perda, 1)}%, RPM médio ${f(r.rpm)}.`
  }
  if (/misturador/.test(q)) {
    const l = DB.misturadores.filter((m) => m.status === 'DISPONÍVEL')
    return l.length
      ? 'Disponível(is): ' + l.map((m) => m.id).join(', ') + '.'
      : 'Nenhum misturador disponível.'
  }
  if (/parada|op /.test(q)) {
    const p = os.filter(
      (x) =>
        ['AGUARDANDO PRODUÇÃO', 'AGUARDANDO LABORATÓRIO'].includes(x.status) ||
        x.lab?.status === 'reprovado'
    )
    return p.length
      ? p
          .map(
            (x) =>
              `OP #${String(x.id).padStart(6, '0')}: ${x.lab?.status === 'reprovado' ? 'lote reprovado no laboratório' : x.status}`
          )
          .join('; ')
      : 'Nenhuma OP parada.'
  }
  if (/aprovado/.test(q)) {
    const o = [...os].reverse().find((x) => x.lab?.status === 'aprovado')
    return o
      ? `Último lote aprovado: ${o.lote} por ${o.lab.por}.`
      : 'Nenhum lote aprovado ainda.'
  }
  return 'Posso responder sobre velocidade recomendada, bombas/anomalias, perdas, comparação de lotes, misturadores, OPs paradas e último lote aprovado.'
}
function pergunta(q) {
  q = q || $('#q').value
  if (!q) return
  window.chatLog = window.chatLog || []
  chatLog.push(['u', q], ['a', resp(q)])
  draw()
}
/* ---------- AÇÕES ---------- */
const pad = (n) => '#' + String(n).padStart(6, '0')
function gerarOP(pid) {
  const p = DB.pedidos.find((x) => x.id == pid),
    o = mkOp(p, 'AGUARDANDO PRODUÇÃO')
  p.status = 'OP GERADA'
  o.prio = $('#pr' + pid)?.value || 'Normal'
  DB.mega.ops++
  log(`Gerou OP ${pad(o.id)} (pedido #${pid})`)
  alerta('g', 'OP ' + pad(o.id) + ' gerada')
  draw()
}
function novoPedido() {
  const id = 45821 + DB.pedidos.length,
    p = {
      id,
      cliente: pick(CLI),
      produto: pick(PROD),
      qtd: Math.round(R(10, 30)) * 100,
      entrega: '10/10/2026',
      status: 'PEDIDO RECEBIDO',
    }
  DB.pedidos.push(p)
  DB.mega.pedidos++
  log('Mega ERP: novo pedido #' + id)
  draw()
}
function iniciarMix(id) {
  const m = DB.misturadores.find((x) => x.id === $('#mx' + id).value)
  if (m.status !== 'DISPONÍVEL') return alert('Misturador ocupado')
  const o = op(id)
  m.status = 'PRODUZINDO'
  m.op = id
  m.t0 = Date.now()
  m.carga = Math.round(o.plan * 0.99)
  o.mix = m.id
  o.operador = U.nome
  o.status = 'EM MISTURA'
  log(`Iniciou mistura no ${m.id} (OP ${pad(id)})`)
  draw()
}
function finMix(mid) {
  const m = DB.misturadores.find((x) => x.id === mid),
    o = op(m.op)
  o.prod = m.carga
  o.status = 'AGUARDANDO LABORATÓRIO'
  m.status = 'DISPONÍVEL'
  m.op = null
  m.carga = 0
  log(`Finalizou mistura ${o.lote}, enviado ao laboratório`)
  alerta('y', 'Lote ' + o.lote + ' aguardando laboratório')
  draw()
}
function pausarMix(mid) {
  const m = DB.misturadores.find((x) => x.id === mid)
  m.status = m.status === 'PRODUZINDO' ? 'PAUSADO' : 'PRODUZINDO'
  draw()
}
function analisar(id, ok) {
  const g = (k) => parseFloat(($('#' + k + id).value || '0').replace(',', '.')),
    o = op(id)
  o.lab = {
    status: ok ? 'aprovado' : 'reprovado',
    dens1: g('d1'),
    dens2: g('d2'),
    ph: g('ph'),
    visc: g('vi'),
    temp: g('tp'),
    placas: $('#pl' + id).value,
    obs: $('#ob' + id).value,
    por: U.nome,
  }
  if (ok) {
    o.status = 'AGUARDANDO ENVASE'
    alerta('g', 'Lote ' + o.lote + ' aprovado')
    log(`Aprovou lote ${o.lote}`)
  } else {
    alerta('r', 'Envase bloqueado: lote ' + o.lote + ' não aprovado')
    log(`Reprovou lote ${o.lote}`)
  }
  draw()
}
function iniciarEnvase(id) {
  const o = op(id),
    r = rec(o)
  if (r.bloq) return alert('Recomendação bloqueada: fora dos limites')
  const b = DB.bombas.find((x) => x.id === $('#bb' + id).value)
  if (b.status !== 'DISPONÍVEL') return alert('Bomba ocupada')
  b.status = 'OPERANDO'
  b.op = id
  b.min = 0
  b.litros = 0
  b.nAnom = 0
  b.rpm = r.rpm * 0.8
  o.bomba = b.id
  o.rpm = r.rpm
  o.status = 'EM ENVASE'
  log(`Iniciou envase na ${b.id} a ${r.rpm} RPM (OP ${pad(id)})`)
  draw()
}
function perda(id) {
  const kg = parseFloat($('#pk' + id).value)
  if (!kg) return
  op(id).perdas.push({ kg, motivo: $('#pm' + id).value })
  log(`Registrou perda de ${kg} kg (OP ${pad(id)})`)
  draw()
}
function fimEnvase(id) {
  const o = op(id),
    b = DB.bombas.find((x) => x.id === o.bomba),
    pk = o.perdas.reduce((a, p) => a + p.kg, 0)
  o.envasado = Math.max(0, o.prod - pk)
  DB.hist.push({
    produto: o.produto,
    visc: o.lab.visc,
    temp: o.lab.temp,
    rpm: o.rpm,
    perda: (pk / o.prod) * 100,
    vaz: b.vaz || 38,
  })
  b.status = 'DISPONÍVEL'
  b.op = null
  DB.estoque.push({
    op: id,
    lote: o.lote,
    produto: o.produto,
    un: Math.floor(o.envasado / 5),
    status: 'DISPONÍVEL',
  })
  o.status = 'EM ESTOQUE'
  log(`Finalizou envase ${o.lote}; estoque atualizado`)
  alerta('g', 'Produção concluída: ' + pad(id))
  draw()
}
function expedir(id) {
  op(id).status = 'EM EXPEDIÇÃO'
  log('Separou pedido para entrega (OP ' + pad(id) + ')')
  draw()
}
function entregar(id) {
  const o = op(id)
  o.status = 'CONCLUÍDA'
  o.entrega = now()
  DB.entregas.push({ op: id, t: now() })
  DB.pedidos.find((p) => p.id == o.pedido).status = 'ENTREGUE'
  DB.mega.pend++
  log(`Confirmou entrega da OP ${pad(id)}`)
  draw()
}
function megaAct(a) {
  const m = DB.mega
  if (a === 'sync') {
    m.sync = now()
    m.pend = 0
  }
  if (a === 'ped') return novoPedido()
  log('Mega ERP: ' + a)
  m.sync = now()
  draw()
}
function reset() {
  if (confirm('Apagar e recriar dados demonstrativos?')) {
    initializeDatabase(true)
    draw()
  }
}
function setLim() {
  DB.configuracoes.rpmMin = +$('#lmin').value
  DB.configuracoes.rpmMax = +$('#lmax').value
  log('Alterou limites de RPM')
  draw()
}
/* ---------- VIEWS ---------- */
const bd = (s) => {
  const c = /APROV|CONCL|ENTREG|DISPON|ESTOQUE|OPERANDO|PRODUZINDO/.test(s)
    ? 'g'
    : /AGUARD|PAUS/.test(s)
      ? 'y'
      : /REPROV|BLOQ/.test(s)
        ? 'r'
        : ''
  return `<span class="bd ${c}">${s}</span>`
}
function tl(o) {
  const S = [
      ['Pedido recebido', 0],
      ['OP criada', 1],
      ['Mistura iniciada', 3],
      ['Mistura concluída', 4],
      ['Laboratório aprovado', 5],
      ['Envase concluído', 7],
      ['Estoque', 8],
      ['Expedição', 9],
      ['Entrega', 10],
    ],
    i = ST.indexOf(o.status)
  let cur = false
  return (
    `<div class="tl">` +
    S.map((s) => {
      if (i >= s[1] && !(s[1] >= 5 && !o.lab)) {
        return `<div class="d">✓ ${s[0]}</div>`
      }
      if (!cur) {
        cur = true
        return `<div class="c">● ${s[0]}</div>`
      }
      return `<div>○ ${s[0]}</div>`
    }).join('') +
    '</div>'
  )
}
const bars = (a, c) =>
  a
    .map(
      (x) =>
        `<div>${x[0]} <b>${x[1]}</b><div class="bar"><i style="width:${Math.min(100, (x[1] / (c || Math.max(1, ...a.map((y) => y[1])))) * 100)}%"></i></div></div>`
    )
    .join('')
const V_ = {
  dash() {
    const os = DB.ordensProducao,
      n = (s) => os.filter((o) => o.status === s).length,
      fin = os.filter((o) => o.envasado),
      tp = fin.reduce((a, o) => a + o.perdas.reduce((x, p) => x + p.kg, 0), 0),
      tprod = fin.reduce((a, o) => a + o.envasado, 0)
    return `<div class="grid"><div class="card"><h3>OPs em produção</h3><div class="big">${n('EM MISTURA') + n('EM ENVASE')}</div></div><div class="card"><h3>Aguardando laboratório</h3><div class="big">${n('AGUARDANDO LABORATÓRIO')}</div></div><div class="card"><h3>Aguardando envase</h3><div class="big">${n('AGUARDANDO ENVASE')}</div></div><div class="card"><h3>Concluídas</h3><div class="big">${n('CONCLUÍDA')}</div></div>
 <div class="card"><h3>Produzido (kg)</h3><div class="big">${f(tprod)}</div></div><div class="card"><h3>Perdas</h3><div class="big">${tprod ? f((tp / (tprod + tp)) * 100, 1) : '0,0'}%</div></div><div class="card"><h3>Bombas ativas</h3><div class="big">${DB.bombas.filter((b) => b.status === 'OPERANDO').length}/${DB.bombas.length}</div></div><div class="card"><h3>Misturadores ativos</h3><div class="big">${DB.misturadores.filter((m) => m.status === 'PRODUZINDO').length}/${DB.misturadores.length}</div></div></div>
 <div class="grid"><div class="card"><h3>OPs por status</h3>${bars(ST.map((s) => [s, n(s)]).filter((x) => x[1]))}</div><div class="card"><h3>Eficiência das bombas</h3>${bars(
   DB.bombas.map((b) => [b.id, b.ef]),
   100
 )}</div><div class="card"><h3>Alertas</h3>${
   DB.alertasIA
     .slice(0, 6)
     .map((a) => `<div class="al ${a.n}">${a.m}<br><small>${a.t}</small></div>`)
     .join('') || '—'
 }</div></div>`
  },
  ped() {
    return `<button class="btn" onclick="novoPedido()">Simular recebimento de pedido (Mega)</button><div class="card"><table><tr><th>Pedido</th><th>Cliente</th><th>Produto</th><th>Qtd</th><th>Entrega</th><th>Status</th><th></th></tr>${DB.pedidos.map((p) => `<tr><td>#${p.id}</td><td>${p.cliente}</td><td>${p.produto}</td><td>${f(p.qtd)} kg</td><td>${p.entrega}</td><td>${bd(p.status)}</td><td>${p.status === 'PEDIDO RECEBIDO' ? `<select id="pr${p.id}" style="width:90px"><option>Normal</option><option>Alta</option></select><button class="btn" onclick="gerarOP(${p.id})">GERAR OP</button>` : ''}</td></tr>`).join('')}</table></div>`
  },
  ops() {
    return [...DB.ordensProducao]
      .reverse()
      .map(
        (o) =>
          `<div class="card"><div class="top"><h3>OP ${pad(o.id)} · Pedido #${o.pedido}</h3>${bd(o.status)}</div><div class="grid"><div>Cliente<br><b>${o.cliente}</b></div><div>Produto<br><b>${o.produto}</b></div><div>Planejado / produzido<br><b>${f(o.plan)} / ${f(o.envasado || o.prod)} kg</b></div><div>Lote<br><b>${o.lote}</b></div><div>Misturador / Bomba<br><b>${o.mix || '—'} / ${o.bomba || '—'}</b></div><div>Prioridade / prazo<br><b>${o.prio} · ${o.prazo}</b></div></div>${tl(o)}</div>`
      )
      .join('')
  },
  mix() {
    const fila = DB.ordensProducao.filter(
      (o) => o.status === 'AGUARDANDO PRODUÇÃO'
    )
    return `<div class="grid">${DB.misturadores.map((m) => `<div class="card"><h3>${m.id}</h3>${bd(m.status)}<p>Temperatura: <b>${f(m.temp, 1)} °C</b><br>Velocidade: <b>${m.rpm} RPM</b><br>Carga: <b>${f(m.carga)} kg</b><br>OP: <b>${m.op ? pad(m.op) : '—'}</b> ${m.op ? '· ' + op(m.op).lote : ''}<br>Tempo: <b>${m.t0 && m.status === 'PRODUZINDO' ? new Date(Date.now() - m.t0).toISOString().substr(11, 8) : '—'}</b></p>${m.op ? `<button class="btn gr" onclick="pausarMix('${m.id}')">PAUSAR/RETOMAR</button><button class="btn ok" onclick="finMix('${m.id}')">FINALIZAR E ENVIAR AO LABORATÓRIO</button>` : ''}</div>`).join('')}</div>
 <h3>OPs aguardando produção</h3>${fila.map((o) => `<div class="card">OP ${pad(o.id)} · ${o.produto} · ${f(o.plan)} kg · ${o.lote}<select id="mx${o.id}">${DB.misturadores.map((m) => `<option>${m.id}</option>`).join('')}</select><button class="btn" onclick="iniciarMix(${o.id})">INICIAR MISTURA</button></div>`).join('') || '<div class="card">Nenhuma OP na fila.</div>'}`
  },
  lab() {
    const l = DB.ordensProducao.filter(
      (o) => o.status === 'AGUARDANDO LABORATÓRIO'
    )
    return (
      l
        .map((o) => {
          const x = o.lab || {}
          return `<div class="card"><h3>OP ${pad(o.id)} · Lote ${o.lote}</h3>${o.produto} ${o.lab ? bd('REPROVADO') : ''}<div class="row"><label>Densidade inicial<input id="d1${o.id}" value="1,42"></label><label>Densidade final<input id="d2${o.id}" value="1,41"></label><label>pH<input id="ph${o.id}" value="8,1"></label><label>Viscosidade (cP)<input id="vi${o.id}" value="${Math.round(R(4300, 5000))}"></label><label>Temperatura (°C)<input id="tp${o.id}" value="25,8"></label><label>Placas<select id="pl${o.id}"><option>APROVADO</option><option>REPROVADO</option></select></label></div><textarea id="ob${o.id}" placeholder="Observações"></textarea><button class="btn ok" onclick="analisar(${o.id},true)">APROVAR LOTE</button><button class="btn no" onclick="analisar(${o.id},false)">REPROVAR LOTE</button></div>`
        })
        .join('') || '<div class="card">Nenhum lote aguardando análise.</div>'
    )
  },
  env() {
    const l = DB.ordensProducao.filter((o) =>
      ['AGUARDANDO LABORATÓRIO', 'AGUARDANDO ENVASE', 'EM ENVASE'].includes(
        o.status
      )
    )
    return (
      l
        .map((o) => {
          const h = `<div class="card"><h3>OP ${pad(o.id)} · ${o.lote}</h3>${o.produto} · ${f(o.prod)} kg disponíveis ${bd(o.status)}`
          if (o.lab?.status !== 'aprovado')
            return (
              h +
              `<div class="warn">❌ <b>ENVASE BLOQUEADO</b><br>Este lote ainda não foi liberado pelo laboratório.</div></div>`
            )
          if (o.status === 'EM ENVASE') {
            const b = DB.bombas.find((x) => x.id === o.bomba)
            return (
              h +
              `<p>${b.id} · ${Math.round(b.rpm)} RPM · ${f(b.vaz, 1)} L/min · Eficiência ${b.ef}%</p><div class="row"><input id="pk${o.id}" type="number" placeholder="Perda (kg)"><select id="pm${o.id}">${MOT.map((m) => `<option>${m}</option>`).join('')}</select><button class="btn gr" onclick="perda(${o.id})">REGISTRAR PERDA</button></div>${o.perdas.map((p) => `<div class="al y">${p.kg} kg · ${p.motivo}</div>`).join('')}<button class="btn ok" onclick="fimEnvase(${o.id})">FINALIZAR ENVASE</button></div>`
            )
          }
          const r = rec(o),
            liv = DB.bombas.filter((b) => b.status === 'DISPONÍVEL')
          return (
            h +
            `<div class="card" style="background:#eef5ff"><b>🤖 RECOMENDAÇÃO</b><br>Velocidade sugerida: <b>${f(r.rpm)} RPM</b> · Faixa histórica: ${f(r.min)}–${f(r.max)} RPM<br>Vazão estimada: ${f(r.vaz, 1)} L/min · Perda histórica média: ${f(r.perda, 1)}%<br>Base: ${r.n} lotes semelhantes<details><summary>Por que essa recomendação?</summary>Média de RPM dos lotes de "${o.produto}" com viscosidade próxima de ${f(r.v)} cP (±12%) no histórico do banco.</details></div>${r.bloq ? `<div class="warn">⚠️ <b>RECOMENDAÇÃO BLOQUEADA</b><br>Valor sugerido: ${f(r.rpm)} RPM · Limite: ${f(r.lim)} RPM</div>` : `<select id="bb${o.id}">${liv.map((b) => `<option>${b.id}</option>`).join('')}</select><button class="btn ok" onclick="iniciarEnvase(${o.id})">APROVAR RECOMENDAÇÃO E INICIAR ENVASE</button>`}</div>`
          )
        })
        .join('') || '<div class="card">Nenhuma OP para envase.</div>'
    )
  },
  bom() {
    return `<div class="grid">${DB.bombas.map((b) => `<div class="card"><h3>${b.id}</h3>${bd(b.anom ? 'ANOMALIA' : b.status)}<p>RPM: <b>${Math.round(b.rpm)}</b> · Vazão: <b>${f(b.vaz, 1)} L/min</b><br>Pressão: <b>${f(b.pres, 1)} bar</b> · Temp: <b>${f(b.temp, 1)} °C</b><br>Tempo ligada: <b>${f(b.min, 0)} min</b> · Bombeado: <b>${f(b.litros)} L</b><br>OP: <b>${b.op ? pad(b.op) : '—'}</b> · Eficiência: <b>${b.ef}%</b></p>${b.anom ? `<div class="warn">⚠️ <b>ANOMALIA DETECTADA</b><br>Vazão abaixo do histórico (38–42 L/min). Possíveis causas: obstrução na linha, alteração da viscosidade, pressão anormal, problema na bomba, entrada de ar. Recomenda-se verificar o equipamento.</div>` : ''}${b.hist.map((h) => `<div class="bar" style="height:8px"><i style="width:${h}%"></i></div>`).join('')}</div>`).join('')}</div>`
  },
  est() {
    const e = DB.ordensProducao.filter((o) =>
      ['EM ESTOQUE', 'EM EXPEDIÇÃO', 'CONCLUÍDA'].includes(o.status)
    )
    return `<div class="card"><table><tr><th>OP</th><th>Pedido/Cliente</th><th>Produto</th><th>Lote</th><th>Unidades</th><th>Status</th><th></th></tr>${e.map((o) => `<tr><td>${pad(o.id)}</td><td>#${o.pedido} ${o.cliente}</td><td>${o.produto}</td><td>${o.lote}</td><td>${Math.floor(o.envasado / 5)}</td><td>${bd(o.status === 'CONCLUÍDA' ? 'ENTREGA CONCLUÍDA' : o.status)}</td><td>${o.status === 'EM ESTOQUE' ? `<button class="btn" onclick="expedir(${o.id})">SEPARAR</button>` : o.status === 'EM EXPEDIÇÃO' ? `<button class="btn ok" onclick="entregar(${o.id})">CONFIRMAR ENTREGA</button>` : ''}</td></tr>`).join('')}</table></div>`
  },
  rast() {
    const q = (window.rq || '').toLowerCase(),
      r = q
        ? DB.ordensProducao.filter((o) =>
            [o.lote, String(o.id), String(o.pedido), o.produto]
              .join(' ')
              .toLowerCase()
              .includes(q)
          )
        : []
    return (
      `<div class="card"><input id="rq" placeholder="Pesquisar OP, lote, pedido ou produto" value="${window.rq || ''}"><button class="btn" onclick="rq=$('#rq').value;draw()">PESQUISAR</button></div>` +
      r
        .map(
          (o) =>
            `<div class="card"><h3>Lote ${o.lote}</h3>${['PEDIDO #' + o.pedido, 'OP ' + pad(o.id), 'MISTURADOR: ' + (o.mix || '—'), 'PRODUÇÃO: ' + f(o.prod) + ' kg', 'LABORATÓRIO: ' + (o.lab ? o.lab.status.toUpperCase() : '—'), 'BOMBA: ' + (o.bomba || '—'), 'ENVASE: ' + (o.envasado ? f(o.envasado) + ' kg' : '—'), 'PERDA: ' + f(o.perdas.reduce((a, p) => a + p.kg, 0)) + ' kg', 'ESTOQUE: ' + (o.envasado ? Math.floor(o.envasado / 5) + ' unidades' : '—'), 'EXPEDIÇÃO: ' + (o.status === 'CONCLUÍDA' ? 'ENTREGUE em ' + o.entrega : o.status)].map((s) => `<div style="text-align:center">${s}<br>↓</div>`).join('')}${tl(o)}</div>`
        )
        .join('')
    )
  },
  ia() {
    const c = window.chatLog || []
    return `<div class="card"><h3>🤖 Assistente da Produção</h3><div class="chat">${c.map((m) => `<p class="${m[0]}">${m[0] === 'u' ? 'Usuário' : 'IA'}: ${m[1]}</p>`).join('')}</div><div>${['Qual a velocidade recomendada?', 'Por que a bomba está ineficiente?', 'Quais foram as perdas deste lote?', 'Compare este lote com os anteriores.', 'Qual misturador está disponível?', 'Por que esta OP está parada?', 'Qual foi o último lote aprovado?', 'Quais bombas apresentam anomalias?'].map((q) => `<button class="btn gr" style="font-size:13px" onclick="pergunta('${q}')">${q}</button>`).join('')}</div><input id="q" placeholder="Digite uma pergunta..." onkeydown="if(event.key==='Enter')pergunta()"></div>`
  },
  mega() {
    const m = DB.mega
    return `<div class="card"><h3>Integração Mega ERP</h3>${bd('● CONECTADO')}<p>Última sincronização: <b>${m.sync}</b><br>Pedidos sincronizados: <b>${m.pedidos}</b> · OPs enviadas: <b>${m.ops}</b> · Atualizações pendentes: <b>${m.pend}</b></p><button class="btn" onclick="megaAct('ped')">SIMULAR RECEBIMENTO DE PEDIDO</button><button class="btn" onclick="megaAct('sync')">SINCRONIZAR MEGA</button><button class="btn" onclick="megaAct('OP enviada ao Mega')">ENVIAR OP AO MEGA</button><button class="btn" onclick="megaAct('status atualizado')">ATUALIZAR STATUS</button></div>`
  },
  log() {
    return `<div class="card">${DB.historico.map((h) => `<div class="al"><b>${h.t}</b> · ${h.u}: ${h.m}</div>`).join('') || 'Sem registros.'}</div>`
  },
  cfg() {
    const c = DB.configuracoes
    return `<div class="card"><h3>Limites operacionais da bomba (RPM)</h3><div class="row"><input id="lmin" type="number" value="${c.rpmMin}"><input id="lmax" type="number" value="${c.rpmMax}"><button class="btn" onclick="setLim()">SALVAR</button></div></div><button class="btn no" onclick="reset()">RESETAR DADOS DEMONSTRATIVOS</button>`
  },
  perfil() {
    return `<div class="card"><h3>${U.nome}</h3>Cargo: ${U.cargo}<br>Setor: ${U.setor}<br>Permissões: ${ROLE[U.permissao].map((k) => MENU[k]).join(' / ')}</div>`
  },
}
/* ---------- TELAS / LOGIN ---------- */
function draw() {
  if (!U) return
  const fo = document.activeElement
  if (
    fo &&
    /INPUT|TEXTAREA|SELECT/.test(fo.tagName) &&
    fo.id !== 'rq' &&
    fo.id !== 'q' &&
    V !== 'rast'
  )
    return
  $('#root').innerHTML =
    `<div id="app"><nav><h2>MULTIPERFIL</h2>${ROLE[U.permissao].map((k) => `<a class="${V === k ? 'on' : ''}" onclick="V='${k}';draw()">${MENU[k]}</a>`).join('')}<hr><a onclick="V='perfil';draw()">Meu Perfil</a><a onclick="sair()">Sair</a></nav><main><div class="top"><h2>${MENU[V] || 'Meu Perfil'}</h2><div><b>${U.nome}</b> · ${U.cargo} <span class="bd g">● Online</span></div></div>${V_[V]()}</main></div>`
}
function sair() {
  U = null
  sessionStorage.clear()
  stopCam()
  home()
}
function stopCam() {
  stream && stream.getTracks().forEach((t) => t.stop())
  stream = null
}
function home() {
  $('#root').innerHTML =
    `<div class="center"><h1>MULTIPERFIL</h1><p>Gestão Inteligente da Produção</p><button class="btn" onclick="face()">ENTRAR NO SISTEMA</button><p><small>Sistema Integrado de Produção</small></p></div>`
}
async function face() {
  $('#root').innerHTML =
    `<div class="center"><h2>Identificação do Funcionário</h2><div class="cam" id="cam">Aguardando câmera…</div><p>Reconhecendo funcionário… ● ● ●</p><div class="demo"><b>Reconhecimento facial demonstrativo</b><br>Selecione o funcionário para simular o reconhecimento:<br>${DB.usuarios.map((u) => `<button class="btn" onclick="entrar(${u.id})">${u.nome}</button>`).join('')}</div></div>`
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true })
    $('#cam').innerHTML = '<video autoplay playsinline muted></video>'
    $('video').srcObject = stream
  } catch (e) {
    $('#cam').textContent = 'Câmera indisponível — use o modo demonstração'
  }
}
function entrar(id) {
  U = DB.usuarios.find((u) => u.id == id)
  sessionStorage.u = id
  stopCam()
  $('#root').innerHTML =
    `<div class="center"><h2 style="color:var(--vd)">✓ Rosto reconhecido</h2><h3>${U.nome}</h3><p>${U.cargo}</p><p>Entrando no sistema…</p></div>`
  log('Login (demonstração facial)')
  V = 'dash'
  setTimeout(draw, 1400)
}
initializeDatabase()
if (sessionStorage.u) {
  U = DB.usuarios.find((u) => u.id == sessionStorage.u)
  draw()
} else home()
