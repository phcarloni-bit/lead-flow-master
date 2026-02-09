

# Correção de Autenticação — Meraki

## Problema Identificado
1. A conta do usuario ja existe e esta confirmada — tentar criar novamente mostra "Conta criada" mas nao envia email (comportamento de seguranca padrao)
2. O login funcionou nos logs (status 200), mas a interface pode nao estar redirecionando corretamente apos o login
3. A confirmacao de email esta ativa, o que dificulta testes com novas contas

## Solucoes

### 1. Habilitar auto-confirm de email
Usar a ferramenta de configuracao de autenticacao para desativar a exigencia de confirmacao por email. Isso permite que novos cadastros entrem direto no sistema sem precisar verificar email — ideal para fase de testes/validacao.

### 2. Corrigir fluxo pos-login na pagina Auth
Adicionar redirecionamento explicito na pagina Auth.tsx:
- Verificar se ja existe sessao ativa ao carregar a pagina
- Se sim, redirecionar automaticamente para o Dashboard
- Garantir que apos login bem-sucedido, o usuario seja levado ao Dashboard

### 3. Melhorar feedback de erro no signup
Quando o signup retorna "user_repeated_signup", o sistema atualmente mostra "Conta criada" de forma enganosa. Ajustar para:
- Verificar se a resposta indica conta ja existente
- Mostrar mensagem mais clara: "Este email ja esta cadastrado. Tente fazer login."

## Arquivos que serao modificados
- `src/pages/Auth.tsx` — adicionar verificacao de sessao e melhorar feedback
- Configuracao de auth (auto-confirm) via ferramenta do sistema

## Resultado esperado
- Usuario consegue fazer login normalmente com a conta existente
- Novos cadastros entram sem precisar confirmar email
- Mensagens de feedback mais claras sobre contas duplicadas
