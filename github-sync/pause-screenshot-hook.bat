@echo off
REM 🛑 Pausa Hook Screenshot
REM Crea file flag per disabilitare hook automatici

echo 🛑 Pausa Screenshot Hook...

cd /d "C:\CLAUDEcode2025\mermaid-sketcher-451\github-sync\SCREENSHOT"

echo # SCREENSHOT HOOK PAUSED > HOOK_PAUSED.flag
echo # Data: %date% %time% >> HOOK_PAUSED.flag
echo # Per riattivare: elimina questo file >> HOOK_PAUSED.flag
echo. >> HOOK_PAUSED.flag
echo HOOK_STATUS=PAUSED >> HOOK_PAUSED.flag
echo PAUSED_AT=%date%_%time% >> HOOK_PAUSED.flag

echo ✅ Hook screenshot messo in pausa
echo 📁 Creato file: HOOK_PAUSED.flag
echo.
echo 💡 Per riattivare: del HOOK_PAUSED.flag
echo 💡 O usa: resume-screenshot-hook.bat

pause