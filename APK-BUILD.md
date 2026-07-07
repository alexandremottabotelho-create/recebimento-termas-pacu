# Como gerar o APK

O app já está empacotado com **Capacitor** (WebView Android). A pasta `android/` é o
projeto nativo pronto. Só falta **compilar** o APK. Há dois caminhos — escolha um.

---

## ⭐ Caminho A — Compilar na nuvem (recomendado, não instala nada)

Usa o GitHub Actions (já configurado em `.github/workflows/build-apk.yml`). Você só
precisa de uma conta gratuita no GitHub.

1. Crie um repositório novo em https://github.com/new
   (ex.: nome `recebimento-termas-pacu`, pode ser **privado**). **Não** marque
   "Add a README".
2. No **PowerShell**, dentro da pasta `21 - APP`, rode os comandos que o GitHub mostra
   na tela do repositório novo (algo como):
   ```powershell
   git remote add origin https://github.com/SEU-USUARIO/recebimento-termas-pacu.git
   git push -u origin main
   ```
   (O projeto já está commitado — é só apontar o remote e dar push.)
3. No GitHub, abra a aba **Actions**. O build inicia sozinho após o push
   (ou clique em **Build APK → Run workflow**). Leva ~3–5 min.
4. Quando terminar (✓ verde), abra a execução e baixe o artefato
   **`recebimento-termas-pacu-apk`** (um `.zip`).
5. Extraia o `.zip` → dentro está o **`app-debug.apk`**.

Pronto. Esse é o arquivo para instalar nos celulares.

---

## Caminho B — Compilar no seu PC (precisa instalar o Android Studio)

1. Instale o **Android Studio** (https://developer.android.com/studio) — ele já traz
   o JDK e o Android SDK.
2. Abra o Android Studio → **Open** → selecione a pasta `21 - APP/android`.
3. Aguarde o "Gradle Sync" terminar.
4. Menu **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
5. Ao final, clique em **locate** — o APK estará em
   `android/app/build/outputs/apk/debug/app-debug.apk`.

Ou, via terminal (com JDK 21 + SDK configurados):
```powershell
cd android
./gradlew assembleDebug
```

---

## Instalar o APK no celular Android

1. Envie o `app-debug.apk` para o celular (WhatsApp, cabo, Drive…).
2. Abra o arquivo no celular. Ele vai pedir para permitir
   **"instalar apps de fontes desconhecidas"** — permita para o app que abriu o arquivo.
3. Instale e abra o app **"Recebimento Termas Pacu"**.
4. Na primeira vez que tirar uma foto, o Android pedirá permissão de **câmera** — permita.

> É um APK **debug** (assinado com chave de debug) — instala normalmente para uso
> interno. Não serve para publicar na Play Store, o que não é necessário aqui.

---

## Quando eu mudar o código do app

Toda vez que o `App.jsx` (ou qualquer parte do app) mudar, o APK precisa ser recompilado:

- **Caminho A:** basta dar `git push` de novo — o Actions recompila e gera um APK novo.
- **Caminho B:** rode `npm run build ; npx cap sync android` e recompile no Android Studio.

## Alterar nome, ícone ou ID do app
- Nome exibido: `android/app/src/main/res/values/strings.xml` (`app_name`).
- ID do pacote (`br.com.termaspacu.recebimento`): definido em `capacitor.config.json`.
- Ícone: substitua os arquivos em `android/app/src/main/res/mipmap-*`.
