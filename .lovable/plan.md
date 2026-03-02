
# Importar Templates via IA -- Analise automatica de site/Instagram

## Status: ✅ CONCLUÍDO

## O que foi feito
Botao "Gerar com IA" na pagina de Templates que analisa a URL de um site ou Instagram e gera automaticamente os templates de resposta e as palavras-chave de cada categoria, usando Lovable AI (sem precisar de chave de API externa).

## Itens implementados

- [x] **Edge function `generate-templates`** — Recebe URL, chama Lovable AI Gateway (Gemini 3 Flash) com tool calling, retorna JSON estruturado com 7 categorias
- [x] **UI em Templates.tsx** — Campo de URL com icone Instagram/Globe, botao "Gerar com IA" com loading spinner, exibicao de keywords geradas
- [x] **Categoria "Trocas"** — Adicionada ao classification-engine com keywords e template padrao
- [x] **Salvar keywords no banco** — Keywords geradas pela IA sao persistidas na tabela `keyword_dictionaries`
- [x] **Tratamento de erros 429/402** — Toasts especificos para rate limit e creditos esgotados, tanto via status HTTP quanto via mensagem no body
- [x] **Mapeamento de categorias AI → Meraki** — price→Preco, colors→Cores, sizes→Tamanhos, payment→Pagamento, shipping→Frete, exchanges→Trocas, fallback→Outro

## Arquivos criados/modificados

| Arquivo | Acao |
|---------|------|
| `supabase/functions/generate-templates/index.ts` | Criado |
| `src/pages/Templates.tsx` | Modificado |
| `src/lib/classification-engine.ts` | Modificado |

## Fluxo tecnico

```text
Usuario digita URL
       |
       v
Frontend chama edge function /generate-templates
       |
       v
Edge function envia prompt para Lovable AI Gateway
(modelo: google/gemini-3-flash-preview, com tool calling)
       |
       v
IA retorna JSON estruturado com templates + keywords
       |
       v
Frontend recebe e preenche os campos
       |
       v
Usuario revisa e clica "Salvar Todos"
       |
       v
Templates salvos no banco + keywords atualizadas
```
