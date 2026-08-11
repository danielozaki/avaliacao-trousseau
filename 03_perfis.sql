-- =====================================================================
-- 03 · PERFIS DOS USUÁRIOS
-- Rode DEPOIS de criar as pessoas em Authentication → Users → Add user.
-- Troque os e-mails pelos que você cadastrou de verdade.
-- =====================================================================
insert into perfil (user_id, nome, papel, setores, ver_salario, pode_editar)
select id, 'Gerente de Logística', 'gerente', null, true, true
from auth.users where email = 'gerente@trousseau.com.br'
on conflict (user_id) do update set nome = excluded.nome, papel = excluded.papel,
  setores = excluded.setores, ver_salario = excluded.ver_salario, pode_editar = excluded.pode_editar;

insert into perfil (user_id, nome, papel, setores, ver_salario, pode_editar)
select id, 'Liderança Ecommerce', 'setor', array['Ecomm'], false, true
from auth.users where email = 'ecommerce@trousseau.com.br'
on conflict (user_id) do update set nome = excluded.nome, papel = excluded.papel,
  setores = excluded.setores, ver_salario = excluded.ver_salario, pode_editar = excluded.pode_editar;

insert into perfil (user_id, nome, papel, setores, ver_salario, pode_editar)
select id, 'Liderança Estoque Central', 'setor', array['EC'], false, true
from auth.users where email = 'estoquecentral@trousseau.com.br'
on conflict (user_id) do update set nome = excluded.nome, papel = excluded.papel,
  setores = excluded.setores, ver_salario = excluded.ver_salario, pode_editar = excluded.pode_editar;

insert into perfil (user_id, nome, papel, setores, ver_salario, pode_editar)
select id, 'Liderança Matéria-Prima', 'setor', array['MP'], false, true
from auth.users where email = 'materiaprima@trousseau.com.br'
on conflict (user_id) do update set nome = excluded.nome, papel = excluded.papel,
  setores = excluded.setores, ver_salario = excluded.ver_salario, pode_editar = excluded.pode_editar;

insert into perfil (user_id, nome, papel, setores, ver_salario, pode_editar)
select id, 'Liderança Hotelaria', 'setor', array['Hotelaria'], false, true
from auth.users where email = 'hotelaria@trousseau.com.br'
on conflict (user_id) do update set nome = excluded.nome, papel = excluded.papel,
  setores = excluded.setores, ver_salario = excluded.ver_salario, pode_editar = excluded.pode_editar;

-- Confira: cada linha mostra o alcance real de cada pessoa
select p.nome, p.papel,
       coalesce(array_to_string(p.setores, ', '), 'todo o operacional') as alcance,
       p.ver_salario as "vê salário", p.pode_editar as "pode editar", u.email
from perfil p join auth.users u on u.id = p.user_id
order by p.papel, p.nome;
