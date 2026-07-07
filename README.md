# Validação de Recebimento — Termas Pacu

App web mobile-first para a portaria validar recebimento de mercadorias por Nota Fiscal.
Dados vão para Google Sheets (aba `CONFERENCIA`) via Apps Script; fotos vão para o
Google Drive (pasta `Recebimentos - Termas Pacu`).

## Rodar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173` (ou o IP de rede mostrado no terminal, para testar no celular).

## Build de produção (para o APK)

```bash
npm run build
```

Gera a pasta `dist/` — é ela que vai dentro do WebView Android.

## ✅ Backend funcionando (corrigido em 2026-07-07)

O envio ao Apps Script está **validado de ponta a ponta** — o app grava na planilha e
retorna `{"ok":true,"planilha":"..."}`.

**Planilha de destino (dados para o Power BI):**
`Recebimentos - Termas Pacu (Dados)` — aba `CONFERENCIA`
https://docs.google.com/spreadsheets/d/1ATKdHfCeUwjdGzNvIaLMZOlW8R1uo-qItIgVSkAbbLI/edit

### O que estava quebrado (histórico)
1. **"Failed to fetch"** — a implantação estava com acesso "Somente eu"; qualquer
   acesso anônimo era redirecionado ao login do Google. Corrigido para
   **"Qualquer pessoa"**. (Não era o sandbox do artefato.)
2. **Versão implantada desatualizada** — lia `e.postData.contents`; o app envia
   FormData (`e.parameter.payload`). Resolvido republicando a **Versão 3**.
3. **`getActiveSpreadsheet()` retornava `null`** — este é um script *standalone*
   (sem planilha vinculada). O código foi trocado para `getPlanilha()`, que
   resolve/cria a planilha `Recebimentos - Termas Pacu (Dados)` por nome
   (ver `apps-script/Codigo.gs`).

A URL do Web App (`AKfycbzcE9-n98...`) **não mudou** — nenhuma alteração no app foi
necessária. O código atualizado do Apps Script está em `apps-script/Codigo.gs`.

## Configuração

- URL do Web App e PIN admin (`1234`): constantes no topo de `src/App.jsx`
- Usuários: cadastrados na tela Admin, persistidos em `localStorage` (chave `usuarios`)

## Funcionalidades

- Login por toque no nome; cadastro de usuários via Admin (PIN)
- Conferência por NF (fornecedor, nº, prazo) com N itens
- Item: categoria A&B/Obra, lote, validade, quantidades, unidade, valor, status
- **Alerta de validade vencida** (item destacado em vermelho) e **aviso de divergência
  de quantidade** (entregue ≠ pedida) — melhorias já incluídas
- Granel (só Obra): volume m³ para Lenha/Areia/Pedra/Toco — modo padrão (C×L×A) ou
  **4 pontos** para lenha (largura = média de 2 lados; altura = média de 4 cantos)
- Fotos por tipo (A&B: 2; Obra: 4), comprimidas em canvas (máx 1280px, JPEG 0.7)
- Envio via `FormData` campo `payload`; cada item vira uma linha na planilha,
  links das fotos só na 1ª linha da NF

## APK (WebView Android) — checklist

- `AndroidManifest.xml`: permissão `INTERNET`
- WebView: `javaScriptEnabled`, `domStorageEnabled` (necessário p/ localStorage)
- Para a câmera funcionar no `<input type="file" capture>`: implementar
  `WebChromeClient.onShowFileChooser` + permissão `CAMERA`
- O fetch ao Apps Script segue redirect 302 → funciona normalmente no WebView
  depois que o acesso for corrigido para "Qualquer pessoa"
