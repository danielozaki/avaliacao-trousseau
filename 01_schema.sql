-- =====================================================================
-- TROUSSEAU · Avaliação de Pessoas · 01 SCHEMA
-- Rode no SQL Editor do Supabase, na ordem 01 → 02 → 03.
-- =====================================================================

-- Quem pode entrar e o que enxerga. Ligado ao usuário do Supabase Auth.
create table if not exists perfil (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  nome         text not null,
  papel        text not null check (papel in ('gerente','lideranca','setor')),
  setores      text[],                       -- null = todo o operacional
  ver_salario  boolean not null default false,
  pode_editar  boolean not null default true,
  criado_em    timestamptz not null default now()
);

-- O estado do sistema em dois documentos, separados por sensibilidade:
--   avaliacao   → notas, feedbacks, ciclos, assinaturas, espelho de ponto
--   remuneracao → salário, PLR, mérito, verba
-- É essa separação que permite ao líder trabalhar sem alcançar valor nenhum.
create table if not exists documento (
  chave          text primary key check (chave in ('avaliacao','remuneracao')),
  dados          jsonb not null default '{}'::jsonb,
  versao         bigint not null default 1,
  atualizado_em  timestamptz not null default now(),
  atualizado_por uuid references auth.users(id)
);

-- Trilha de auditoria no banco: sobrevive à limpeza de navegador.
create table if not exists auditoria (
  id      bigserial primary key,
  em      timestamptz not null default now(),
  user_id uuid references auth.users(id),
  usuario text,
  papel   text,
  ciclo   text,
  acao    text not null,
  alvo    text,
  detalhe text
);
create index if not exists auditoria_em_idx on auditoria (em desc);

-- Gravação com trava otimista: se outro usuário salvou no meio, o sistema
-- avisa em vez de sobrescrever o trabalho dele.
create or replace function salvar_documento(p_chave text, p_dados jsonb, p_versao bigint)
returns table (ok boolean, versao bigint, conflito boolean)
language plpgsql security invoker as $$
declare v_atual bigint;
begin
  select d.versao into v_atual from documento d where d.chave = p_chave for update;
  if v_atual is null then
    insert into documento (chave, dados, versao, atualizado_por)
    values (p_chave, p_dados, 1, auth.uid());
    return query select true, 1::bigint, false;
  elsif p_versao is not null and p_versao <> v_atual then
    return query select false, v_atual, true;
  else
    update documento
       set dados = p_dados, versao = v_atual + 1,
           atualizado_em = now(), atualizado_por = auth.uid()
     where chave = p_chave;
    return query select true, (v_atual + 1)::bigint, false;
  end if;
end $$;
