@echo off
REM ▶️ Riprendi Hook Screenshot
REM Rimuove file flag per riabilitare hook automatici

echo ▶️ Riprendi Screenshot Hook...

cd /d "C:\CLAUDEcode2025\mermaid-sketcher-451\github-sync\SCREENSHOT"

if exist HOOK_PAUSED.flag (
    del HOOK_PAUSED.flag
    echo ✅ Hook screenshot riattivato
    echo 📁 Rimosso file: HOOK_PAUSED.flag
) else (
    echo ⚠️ Hook non era in pausa
    echo 📁 File HOOK_PAUSED.flag non trovato
)

echo.
echo 💡 Hook ora attivo per nuovi screenshot
echo 💡 Per mettere in pausa: pause-screenshot-hook.bat

pause