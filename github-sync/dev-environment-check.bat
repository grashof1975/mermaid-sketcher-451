@echo off
echo 🔍 [DEV-ENVIRONMENT-CHECK] Verifica ambiente di sviluppo...

REM ===== VERIFICA STRUMENTI CORE =====
echo 📋 Verifica strumenti core...

set "tools_ok=1"

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js: Non trovato
    set "tools_ok=0"
) else (
    for /f "tokens=*" %%i in ('node --version') do set "node_version=%%i"
    echo ✅ Node.js: !node_version!
)

REM Check npm  
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm: Non trovato
    set "tools_ok=0"
) else (
    for /f "tokens=*" %%i in ('npm --version') do set "npm_version=%%i"
    echo ✅ npm: !npm_version!
)

REM Check Git
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git: Non trovato
    set "tools_ok=0"
) else (
    echo ✅ Git: Disponibile
)

REM ===== VERIFICA DIPENDENZE PROGETTO =====
echo 📦 Verifica dipendenze progetto...

if exist "package.json" (
    echo ✅ package.json: Trovato
) else (
    echo ❌ package.json: Non trovato
    set "tools_ok=0"
)

if exist "node_modules" (
    echo ✅ node_modules: Installato
) else (
    echo ⚠️  node_modules: Non trovato (eseguire npm install)
)

if exist "vite.config.ts" (
    echo ✅ vite.config.ts: Configurazione Vite presente
) else (
    echo ❌ vite.config.ts: Configurazione mancante
)

REM ===== VERIFICA CONFIGURAZIONE SUPABASE =====
echo 🗄️  Verifica configurazione database...

if exist "supabase" (
    echo ✅ supabase/: Directory configurazione presente
) else (
    echo ⚠️  supabase/: Directory non trovata
)

if exist ".env.local" (
    echo ✅ .env.local: File ambiente presente
) else (
    echo ⚠️  .env.local: File ambiente non trovato (variabili Supabase?)
)

REM ===== VERIFICA PORTE =====
echo 🌐 Verifica porte di sviluppo...

netstat -an | find ":8080" >nul
if %errorlevel% eq 0 (
    echo ⚠️  Porta 8080: In uso (possibile server già attivo)
) else (
    echo ✅ Porta 8080: Libera
)

netstat -an | find ":5173" >nul  
if %errorlevel% eq 0 (
    echo ⚠️  Porta 5173: In uso (Vite default, dovrebbe usare 8080)
) else (
    echo ✅ Porta 5173: Libera
)

REM ===== VERIFICA DOCUMENTAZIONE =====
echo 📚 Verifica documentazione essenziale...

if exist "docs\README.md" (
    echo ✅ docs/README.md: Master index presente
) else (
    echo ❌ docs/README.md: Master documentation mancante
    set "tools_ok=0"
)

if exist "docs\development\README.md" (
    echo ✅ docs/development/README.md: Guida sviluppo presente
) else (
    echo ❌ docs/development/README.md: Guida sviluppo mancante
)

if exist "CLAUDE.md" (
    echo ✅ CLAUDE.md: Sistema operativo documentale presente
) else (
    echo ❌ CLAUDE.md: Sistema operativo documentale mancante
    set "tools_ok=0"
)

REM ===== VERIFICA SCRIPTS SVILUPPO =====
echo 🔧 Verifica script di sviluppo...

if exist "docs\development\tools\test-local.bat" (
    echo ✅ test-local.bat: Script test locale presente
) else (
    echo ❌ test-local.bat: Script test locale mancante
)

REM ===== REPORT FINALE =====
echo.
echo 📊 [DEV-ENVIRONMENT-CHECK] Report finale:
echo ===============================================

if "%tools_ok%"=="1" (
    echo ✅ AMBIENTE OK: Tutti i prerequisiti soddisfatti
    echo 🚀 Pronto per lo sviluppo!
    echo.
    echo 💡 Comandi suggeriti:
    echo    npm run dev    # Avvia server sviluppo
    echo    npm run build  # Build produzione
    echo    npm run lint   # Controllo qualità codice
) else (
    echo ❌ AMBIENTE INCOMPLETO: Alcuni prerequisiti mancanti
    echo 🔧 Azioni richieste prima di continuare:
    echo.
    if not exist "node_modules" echo    - Eseguire: npm install
    echo    - Verificare configurazione ambiente (.env.local)
    echo    - Installare strumenti mancanti (Node.js, Git, etc.)
)

echo.
echo 📝 Per dettagli completi consulta: docs/development/README.md
echo.
pause