@echo off
echo 🚀 [SESSION-START-HOOK] Inizializzazione ambiente sviluppo...

REM ===== VERIFICA PREREQUISITI =====
echo 📋 Verifica prerequisiti ambiente...

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: Node.js non trovato! Installa Node.js per continuare.
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ ERROR: npm non trovato! Verifica installazione Node.js.
    pause
    exit /b 1
)

echo ✅ Node.js e npm verificati

REM ===== AUTO-SETUP AMBIENTE SVILUPPO =====
echo 🔧 Setup ambiente di sviluppo...

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installazione dipendenze...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ ERROR: npm install fallito!
        pause
        exit /b 1
    )
)

echo ✅ Dipendenze verificate

REM ===== AVVIO SERVER SVILUPPO =====
echo 🌐 Avvio server sviluppo su localhost:8080...

REM Start dev server in background (questo script continuerà)
start "Mermaid Sketcher Dev Server" cmd /c "npm run dev"

REM Wait a moment for server to start
timeout /t 3 /nobreak >nul

echo ✅ Server sviluppo avviato
echo 🌐 Applicazione disponibile su: http://localhost:8080

REM ===== VERIFICA STATUS SUPABASE =====
echo 🗄️  Verifica connessione database...
echo ⚠️  Assicurati che Supabase sia configurato correttamente

REM ===== BACKUP STATO SESSIONE PRECEDENTE =====
if exist "docs\development\session-status\CURRENT_SESSION_STATUS.md" (
    set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
    set timestamp=%timestamp: =0%
    copy "docs\development\session-status\CURRENT_SESSION_STATUS.md" "docs\development\session-status\backup\SESSION_BACKUP_%timestamp%.md" >nul 2>&1
    echo 📋 Backup sessione precedente creato
)

echo ✅ [SESSION-START-HOOK] Ambiente pronto per lo sviluppo!
echo.
echo 📖 Prossimi passi:
echo    1. Leggi docs/README.md per il contesto
echo    2. Leggi docs/development/session-status/CURRENT_SESSION_STATUS.md  
echo    3. Controlla http://localhost:8080 per verificare il funzionamento
echo.
pause