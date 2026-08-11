# Avaliação de Pessoas · Trousseau Logística

Sistema de avaliação comportamental, Nine Box, meritocracia e PLR para a
operação de logística. Roda no navegador, com banco de dados no Supabase.

**➡️ Para instalar: [docs/PASSO-A-PASSO.md](docs/PASSO-A-PASSO.md)**

---

## O que é

Avaliação **comportamental** de propósito. Os KPIs de produtividade ainda não são
confiáveis o bastante para sustentar consequência, e avaliar por número frágil é
pior do que não avaliar. Primeiro comportamento e cultura; performance depois.

Quatro critérios de desempenho com peso por cargo — Execução, Perfil Técnico,
Colaboração e Responsabilidade. Três de potencial — Assumir desafios, Aprende
rápido e aplica, Aderência à trilha.

Duas regras que não se negociam: **Responsabilidade em Baixo impede faixa alta**,
qualquer que seja a média, e liderança com **Colaboração em Baixo** sofre o mesmo
veto. Sem isso o produtivo de conduta ruim sobe no quadro e o time aprende que
comportamento não conta.

## As nove abas

| | |
|---|---|
| **Visão geral** | Grandes números, pontos que exigem decisão, pirâmide de maturidade, resultado por área, quadro completo com assinatura em lote |
| **Nine Box** | Matriz 3×3 em dois modos: Entrega × Comportamento e Desempenho × Potencial |
| **Avaliar** | Notas, espelho de ponto, evidências, retorno do colaborador, Modo feedback |
| **Liderança e Analistas** | Método próprio de 5 competências, com indicadores factuais do time |
| **Meritocracia** | Aumento, bônus e promoção linha a linha, com verba e histórico do ciclo anterior |
| **PLR** | Apuração com memória de cálculo |
| **Fechamento e histórico** | Assinatura por área, conclusão do ciclo, auditoria, comparação entre semestres |
| **Cultura e critérios** | O diagnóstico e o que cada competência representa na operação |
| **Método e pesos** | Pesos, vetos, espelho de ponto, acessos |

## Modo feedback

Tela cheia para a conversa, com alternância entre **visão do colaborador** —
narrativa, réguas de competência, escada de maturidade, evidências e plano
30-60-90 — e **visão do gestor**, que acrescenta matriz, índices, veto, medalha
e salário. Abre sempre na do colaborador. A visão do colaborador não contém
nenhum valor financeiro nem dado de colega, e isso é verificado por teste.

## Ciclos

Semestral: S1 de janeiro a junho, fecha em julho, paga em agosto. S2 de julho a
dezembro, fecha em janeiro.

Uma área só é assinada quando **todos** os colaboradores dela têm avaliação
completa e feedback registrado. O ciclo só fecha com todas as áreas assinadas.
O gerente pode anular qualquer assinatura e reabrir o ciclo.

---

## Estrutura

```
index.html            aplicação — sem nenhum dado real
app/config.js         endereço e chave do seu Supabase (você preenche)
app/supabase.js       camada de dados: login, leitura, gravação, auditoria
sql/01_schema.sql     tabelas
sql/02_rls.sql        políticas de acesso
sql/03_perfis.sql     quem enxerga o quê
docs/PASSO-A-PASSO.md instalação, do zero
```

## Modo local

Sem preencher o `config.js`, o sistema funciona offline, gravando no próprio
navegador, com os usuários embutidos. Serve para testar antes de montar o banco.

---

## Segurança

**Os dados reais nunca entram neste repositório.** O `index.html` publicado traz
apenas registros fictícios de demonstração. O quadro verdadeiro vive no Supabase,
atrás de login.

**A chave `anon` no `config.js` é pública por natureza** — ela identifica o
projeto, não concede permissão. Quem protege os dados são as políticas de RLS do
`sql/02_rls.sql`. A chave `service_role` nunca deve entrar aqui.

**Salário fica separado.** O estado é gravado em dois documentos: `avaliacao` e
`remuneracao`. Só quem tem `ver_salario` recebe o segundo — o líder não obtém
esses valores nem pela API.

O limite conhecido: um líder autenticado consegue, em tese, ler o documento de
avaliação inteiro pela API, inclusive de outros setores. A separação por setor é
feita na interface, não no banco.

## Qualidade

629 verificações automatizadas cobrindo cálculo, permissões por perfil, ciclos,
assinaturas, isolamento de dados no Modo feedback, persistência local e a camada
de nuvem com o RLS simulado.
