/* =====================================================================
   CONFIGURAÇÃO DA NUVEM
   Preencha com os dados do seu projeto Supabase e salve.
   Onde encontrar: painel do Supabase → Project Settings → API
     url      = Project URL
     anonKey  = Project API keys → anon public

   Deixando como está, o sistema funciona no modo local: grava só no
   navegador de quem abrir, sem login e sem compartilhamento.

   A chave anon é pública por natureza — ela identifica o projeto, não
   dá permissão. Quem protege os dados é o RLS dos arquivos em /sql.
   NUNCA coloque aqui a chave service_role.
   ===================================================================== */
window.SUPA = {
  url:     'COLE_AQUI_A_PROJECT_URL',
  anonKey: 'COLE_AQUI_A_ANON_PUBLIC_KEY'
};
