
# Importar Templates via IA -- Analise automatica de site/Instagram

## O que sera feito
Adicionar um botao "Gerar com IA" na pagina de Templates que analisa a URL de um site ou Instagram e gera automaticamente os templates de resposta e as palavras-chave de cada categoria, usando Lovable AI (sem precisar de chave de API externa).

## Como funciona

1. O usuario digita a URL do Instagram ou site da loja
2. Clica em "Gerar com IA"
3. Uma funcao backend chama a Lovable AI (Gemini) com um prompt detalhado pedindo informacoes da loja
4. A IA retorna templates estruturados com textos de resposta e palavras-chave por categoria
5. Os templates e palavras-chave sao preenchidos automaticamente na interface
6. O usuario revisa e clica em "Salvar Todos" para persistir no banco

## Arquivos que serao criados/modificados

### 1. Nova edge function: `supabase/functions/generate-templates/index.ts`
- Recebe a URL do site/Instagram
- Chama a Lovable AI Gateway com o modelo `google/gemini-3-flash-preview`
- Usa tool calling para extrair JSON estruturado com 7 categorias: Preco, Cores, Tamanhos, Pagamento, Frete, Trocas e Outro (fallback)
- Cada categoria inclui: nome, texto de resposta e lista de palavras-chave
- Retorna o JSON estruturado para o frontend

### 2. Modificar: `src/pages/Templates.tsx`
- Adicionar campo de URL com icone de Instagram/Globe
- Botao "Gerar com IA" com estado de loading (spinner)
- Ao receber os templates da IA, atualizar o estado local
- Tambem salvar as palavras-chave geradas na tabela `keyword_dictionaries`
- Manter o botao "Salvar Todos" existente para persistir templates

### 3. Atualizar: `supabase/config.toml`
- Registrar a nova edge function `generate-templates`

## Mapeamento de categorias (AI Studio para Meraki)

| AI Studio (id) | Meraki (category) |
|----------------|-------------------|
| price          | Preco             |
| colors         | Cores             |
| sizes          | Tamanhos          |
| payment        | Pagamento         |
| shipping       | Frete             |
| exchanges      | Trocas            |
| fallback       | Outro             |

A categoria "Trocas" sera adicionada como nova categoria no sistema.

## Prompt da IA (adaptado do codigo do AI Studio)

O prompt instruira a IA a:
- Buscar informacoes publicas sobre a loja na URL fornecida
- Extrair politica de precos, cores disponiveis, tamanhos, pagamento, frete e trocas
- Gerar textos de resposta naturais, educados e vendedores em Portugues do Brasil
- Incluir 5-10 palavras-chave por categoria para ativar a classificacao automatica

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

## Observacoes
- Nao requer chave de API externa -- usa a LOVABLE_API_KEY ja configurada automaticamente
- O prompt nao e exposto no frontend, fica todo no backend
- Erros de rate limit (429) e creditos (402) serao tratados e exibidos como toast
