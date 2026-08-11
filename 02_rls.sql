-- =====================================================================
-- 02 · ROW LEVEL SECURITY
-- A chave anon do arquivo publicado é pública: qualquer pessoa que abrir o
-- site vê ela no código-fonte. O RLS é a única proteção real dos dados.
-- Nada aqui é opcional.
-- =====================================================================
alter table perfil     enable row level security;
alter table documento  enable row level security;
alter table auditoria  enable row level security;

revoke all on all tables in schema public from anon;

create or replace function meu_papel() returns text
language sql stable security definer set search_path = public as $$
  select papel from perfil where user_id = auth.uid() $$;

create or replace function eh_gerente() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(meu_papel() = 'gerente', false) $$;

create or replace function tem_perfil() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfil where user_id = auth.uid()) $$;

create or replace function ve_salario() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select ver_salario from perfil where user_id = auth.uid()), false) $$;

create or replace function edita() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select pode_editar from perfil where user_id = auth.uid()), false) $$;

-- perfil: cada um lê o seu; o gerente administra todos
drop policy if exists perfil_proprio on perfil;
drop policy if exists perfil_gerente on perfil;
create policy perfil_proprio on perfil for select using (user_id = auth.uid());
create policy perfil_gerente on perfil for all    using (eh_gerente()) with check (eh_gerente());

-- documento de avaliação: quem tem perfil lê; só quem pode editar grava
drop policy if exists doc_aval_ler on documento;
drop policy if exists doc_aval_gravar on documento;
drop policy if exists doc_remun on documento;
create policy doc_aval_ler on documento for select
  using (chave = 'avaliacao' and tem_perfil());
create policy doc_aval_gravar on documento for all
  using (chave = 'avaliacao' and edita()) with check (chave = 'avaliacao' and edita());

-- documento de remuneração: exclusivo de quem tem permissão de salário
create policy doc_remun on documento for all
  using (chave = 'remuneracao' and ve_salario())
  with check (chave = 'remuneracao' and ve_salario());

-- auditoria: qualquer perfil registra; só o gerente lê
drop policy if exists audit_inserir on auditoria;
drop policy if exists audit_ler on auditoria;
create policy audit_inserir on auditoria for insert with check (tem_perfil());
create policy audit_ler     on auditoria for select using (eh_gerente());

-- Conferência rápida: toda tabela precisa aparecer com rowsecurity = true
select tablename, rowsecurity from pg_tables
where schemaname = 'public' and tablename in ('perfil','documento','auditoria');
