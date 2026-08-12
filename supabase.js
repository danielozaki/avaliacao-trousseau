/* =====================================================================
   CAMADA DE NUVEM · Supabase
   Só entra em ação se app/config.js estiver preenchido. Sem configuração,
   o sistema roda no modo local, gravando no próprio navegador.

   O estado é gravado em DOIS documentos, separados por sensibilidade:
     avaliacao   → notas, feedbacks, ciclos, assinaturas, espelho de ponto
     remuneracao → salário, PLR, mérito, verba
   Quem não tem permissão de salário simplesmente não recebe o segundo.
   Isso é imposto por política do banco, não pela interface.
   ===================================================================== */
const NUVEM = !!(window.SUPA && window.SUPA.url && window.SUPA.anonKey
                 && !/COLE_/i.test(window.SUPA.url + window.SUPA.anonKey));
let sb = null;
let VERSAO = { avaliacao: null, plr: null, remuneracao: null };
let TEM_REMUNERACAO = true;

if (NUVEM) {
  try { sb = window.supabase.createClient(window.SUPA.url, window.SUPA.anonKey); }
  catch (e) { console.error('Supabase indisponível:', e); }
}

/* ---------------------------------------------------------- separação --- */
const CAMPOS_PLR     = ['medDes', 'medVal', 'des', 'rede', 'total'];
const CAMPOS_SALARIO = ['sal'];

function separarDocumentos() {
  guardarCiclo(CICLO_ATIVO);
  const semDinheiro = [], comDinheiro = [], comPlr = [], meritos = {};

  DADOS.forEach(p => {
    const base = {}, money = { id: p.id }, valorPlr = { id: p.id };
    Object.keys(p).forEach(k => {
      if (k === 'foto') return;                       // foto mora no HTML
      if (CAMPOS_PLR.includes(k)) valorPlr[k] = p[k];
      else if (CAMPOS_SALARIO.includes(k)) money[k] = p[k];
      else base[k] = p[k];
    });
    /* o mérito vive dentro do histórico do ciclo: sai de lá e vai para o
       documento de remuneração, senão o líder leria valor de aumento */
    if (base.hist) {
      const hist = {};
      Object.entries(base.hist).forEach(([ciclo, h]) => {
        const copia = Object.assign({}, h);
        if (copia.merito) {
          meritos[p.id] = meritos[p.id] || {};
          meritos[p.id][ciclo] = copia.merito;
        }
        delete copia.merito;          /* a chave sai sempre, mesmo vazia */
        hist[ciclo] = copia;
      });
      base.hist = hist;
    }
    delete base.merito;
    semDinheiro.push(base);
    comDinheiro.push(money);
    comPlr.push(valorPlr);
  });

  return {
    avaliacao: {
      v: 5, pessoas: semDinheiro, ciclo: CICLO_ATIVO, assinaturas: ASSINA,
      respPonto: RESP_PONTO, pontoFaixas: PONTO_FAIXAS, verMaturidade: VER_MATURIDADE
    },
    plr: { v: 5, pessoas: comPlr },
    remuneracao: {
      v: 5, pessoas: comDinheiro, meritos,
      merito: { verba: MERITO.verba, modo: MERITO.modo, corte: MERITO.corte,
                eixo: MERITO.eixo, curva: MERITO.curva, mapa: MERITO.mapa }
    }
  };
}

function juntarDocumentos(aval, remun, docPlr) {
  if (!aval || !Array.isArray(aval.pessoas)) return false;
  const money = {}, valores = {};
  if (remun && Array.isArray(remun.pessoas)) remun.pessoas.forEach(m => money[m.id] = m);
  if (docPlr && Array.isArray(docPlr.pessoas)) docPlr.pessoas.forEach(m => valores[m.id] = m);
  const meritos = (remun && remun.meritos) || {};

  DADOS.length = 0;
  aval.pessoas.forEach(base => {
    const p = Object.assign({}, base);
    const m = money[p.id], v = valores[p.id];
    /* o que a pessoa não pode ver não chega ao navegador: vem zerado do banco */
    p.sal    = m ? m.sal    : 0;
    p.medDes = v ? v.medDes : 'Bronze';
    p.medVal = v ? v.medVal : { Bronze: 0, Prata: 0, Ouro: 0 };
    p.des    = v ? v.des    : [0,0,0,0,0,0];
    p.rede   = v ? v.rede   : [0,0,0,0,0,0];
    p.total  = v ? v.total  : 0;
    if (p.hist && meritos[p.id]) {
      Object.entries(meritos[p.id]).forEach(([ciclo, mer]) => {
        if (p.hist[ciclo]) p.hist[ciclo].merito = mer;
      });
    }
    DADOS.push(p);
  });

  if (aval.assinaturas) ASSINA = aval.assinaturas;
  if (typeof aval.respPonto === 'boolean') RESP_PONTO = aval.respPonto;
  if (aval.pontoFaixas) PONTO_FAIXAS = aval.pontoFaixas;
  if (typeof aval.verMaturidade === 'boolean') VER_MATURIDADE = aval.verMaturidade;
  if (remun && remun.merito) {
    Object.assign(MERITO, remun.merito);
    MERITO.mapa = Object.assign(mapaPadrao(), remun.merito.mapa || {});
  }
  migrarHistorico();
  CICLO_ATIVO = (aval.ciclo && CICLOS.some(c => c.id === aval.ciclo)) ? aval.ciclo : CICLOS[0].id;
  carregarCiclo(CICLO_ATIVO);
  aplicarFotos();
  return true;
}

/* ------------------------------------------------------------- acesso --- */
async function nuvemEntrar(email, senha) {
  const { error } = await sb.auth.signInWithPassword({ email: email.trim(), password: senha });
  if (error) throw new Error('E-mail ou senha incorretos.');
  return nuvemPerfil();
}

async function nuvemPerfil() {
  const { data: u } = await sb.auth.getUser();
  if (!u || !u.user) throw new Error('Sessão não encontrada.');
  const { data, error } = await sb.from('perfil')
    .select('nome, papel, setores, ver_salario, ver_plr, pode_editar')
    .eq('user_id', u.user.id).maybeSingle();
  if (error || !data) {
    await sb.auth.signOut();
    throw new Error('Seu acesso existe, mas ainda não tem perfil. Peça ao gerente para liberar.');
  }
  const primeiro = data.nome.replace(/^Liderança\s+/i, '').slice(0, 22);
  PERFIL_NUVEM = {
    nome: data.nome, label: primeiro,
    cargo: data.papel === 'gerente' ? 'Quadro completo'
         : (data.setores && data.setores.length ? 'Setor ' + data.setores.join(', ') : 'Time operacional'),
    ini: data.nome.trim().charAt(0).toUpperCase(),
    papel: data.papel,
    setores: (data.setores && data.setores.length) ? data.setores : null,
    verSalario: !!data.ver_salario,
    verPlr: !!(data.ver_plr || data.ver_salario),
    editar: !!data.pode_editar,
    email: u.user.email
  };
  PAPEL = data.papel;
  USER_ATUAL = u.user.email;
  return PERFIL_NUVEM;
}

async function nuvemSair() {
  try { await sb.auth.signOut(); } catch (e) {}
  PERFIL_NUVEM = null;
}

/* -------------------------------------------------------------- dados --- */
async function nuvemCarregar() {
  const { data, error } = await sb.from('documento').select('chave, dados, versao');
  if (error) throw new Error('Não foi possível ler os dados: ' + error.message);
  const por = {};
  (data || []).forEach(d => { por[d.chave] = d; VERSAO[d.chave] = d.versao; });
  TEM_REMUNERACAO = !!por.remuneracao;
  if (!por.avaliacao) return false;                 // base ainda vazia
  return juntarDocumentos(por.avaliacao.dados,
                          por.remuneracao && por.remuneracao.dados,
                          por.plr && por.plr.dados);
}

let salvandoNuvem = false, pendente = false;
async function nuvemSalvar() {
  if (!PERFIL_NUVEM || !PERFIL_NUVEM.editar) return false;
  if (salvandoNuvem) { pendente = true; return true; }
  salvandoNuvem = true;
  try {
    const docs = separarDocumentos();
    /* PLR e salário só são gravados por quem administra remuneração */
    const alvos = PERFIL_NUVEM.verSalario
      ? ['avaliacao', 'plr', 'remuneracao'] : ['avaliacao'];
    for (const chave of alvos) {
      const { data, error } = await sb.rpc('salvar_documento',
        { p_chave: chave, p_dados: docs[chave], p_versao: VERSAO[chave] });
      if (error) throw new Error(error.message);
      const r = Array.isArray(data) ? data[0] : data;
      if (r && r.conflito) {
        VERSAO[chave] = r.versao;
        marcar('Outro usuário salvou antes · recarregue a página');
        return false;
      }
      if (r) VERSAO[chave] = r.versao;
    }
    marcar('Salvo na nuvem ' + new Date().toLocaleTimeString('pt-BR'));
    return true;
  } catch (e) {
    marcar('Falha ao salvar: ' + e.message);
    return false;
  } finally {
    salvandoNuvem = false;
    if (pendente) { pendente = false; setTimeout(nuvemSalvar, 400); }
  }
}

async function nuvemAuditar(ev) {
  if (!sb || !PERFIL_NUVEM) return;
  try {
    await sb.from('auditoria').insert({
      usuario: PERFIL_NUVEM.email, papel: PERFIL_NUVEM.papel, ciclo: ev.ciclo,
      acao: ev.acao, alvo: ev.alvo, detalhe: ev.det
    });
  } catch (e) {}
}

async function nuvemLerAuditoria(limite) {
  if (!sb) return [];
  const { data, error } = await sb.from('auditoria')
    .select('em, usuario, papel, ciclo, acao, alvo, detalhe')
    .order('em', { ascending: false }).limit(limite || 500);
  if (error) return [];
  return (data || []).map(x => ({
    em: x.em, user: x.usuario, papel: x.papel, ciclo: x.ciclo,
    acao: x.acao, alvo: x.alvo, det: x.detalhe
  }));
}

/* Primeira carga: envia o quadro embutido no arquivo para a base vazia. */
async function nuvemSemear() {
  if (!PERFIL_NUVEM || PERFIL_NUVEM.papel !== 'gerente') {
    marcar('Só o gerente pode fazer a carga inicial'); return false;
  }
  VERSAO = { avaliacao: null, plr: null, remuneracao: null };
  const ok = await nuvemSalvar();
  if (ok) marcar('Carga inicial concluída · ' + DADOS.length + ' colaboradores');
  return ok;
}
