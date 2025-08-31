@echo off
echo 🛑 [SESSION-END-HOOK] Cleanup e backup sessione...

REM ===== BACKUP STATO SESSIONE =====
echo 📋 Backup dello stato della sessione...

REM Create backup directory if it doesn't exist
if not exist "docs\development\session-status\backup" (
    mkdir "docs\development\session-status\backup"
)

REM Create timestamped backup
set timestamp=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%
set timestamp=%timestamp: =0%

if exist "docs\development\session-status\CURRENT_SESSION_STATUS.md" (
    copy "docs\development\session-status\CURRENT_SESSION_STATUS.md" "docs\development\session-status\backup\SESSION_END_%timestamp%.md" >nul
    echo ✅ Backup sessione salvato: SESSION_END_%timestamp%.md
)

REM ===== CLEANUP TEMPORANEO =====
echo 🧹 Cleanup file temporanei...

REM Clean temp files
if exist "*.tmp" del "*.tmp" >nul 2>&1
if exist "*.log" del "*.log" >nul 2>&1

REM Clean node_modules cache if needed (optional)
REM npm cache clean --force >nul 2>&1

echo ✅ File temporanei puliti

REM ===== VERIFICA MODIFICHE NON COMMITTATE =====
echo 🔍 Verifica modifiche non salvate...

git status --porcelain > temp_status.txt
set /p git_status=<temp_status.txt
del temp_status.txt >nul 2>&1

if not "%git_status%"=="" (
    echo ⚠️  WARNING: Ci sono modifiche non committate!
    echo 📝 Considera di fare un commit prima di chiudere la sessione:
    echo    git add .
    echo    git commit -m "feat: session work - [descrizione]"
    echo.
)

REM ===== CHIUSURA SERVER SVILUPPO =====
echo 🛑 Chiusura server sviluppo...

REM Try to close any running dev server
taskkill /f /im "node.exe" >nul 2>&1
taskkill /f /im "npm.exe" >nul 2>&1

echo ✅ Server sviluppo fermato

REM ===== REPORT FINALE =====
echo.
echo 📊 [SESSION-END-HOOK] Report finale:
echo ✅ Backup sessione completato
echo ✅ Cleanup file temporanei completato  
echo ✅ Server sviluppo fermato
if not "%git_status%"=="" (
    echo ⚠️  Modifiche non committate presenti
) else (
    echo ✅ Repository pulito
)

echo.
echo 🎯 Sessione terminata correttamente!
echo 📝 Il backup è salvato in: docs\development\session-status\backup\
echo.
pause