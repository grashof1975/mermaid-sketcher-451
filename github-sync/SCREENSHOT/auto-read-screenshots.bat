@echo off
REM 📷 Auto-read nuovi screenshot per Claude Code
REM Rileva e legge automaticamente screenshot nella cartella

echo 📷 Controllo nuovi screenshot...

cd /d "C:\CLAUDEcode2025\mermaid-sketcher-451\github-sync\SCREENSHOT"

REM Trova l'ultimo screenshot aggiunto
for /f "delims=" %%i in ('dir *.jpg *.png *.gif /b /o-d 2^>nul ^| findstr /n "^" ^| findstr "^1:"') do (
    set "latest=%%i"
    set "latest=!latest:~2!"
)

if defined latest (
    echo 🆕 Ultimo screenshot: %latest%
    echo 📖 Comando per Claude: Read github-sync\SCREENSHOT\%latest%
    echo.
    echo 💡 Copia e incolla questo in Claude Code:
    echo Read github-sync\SCREENSHOT\%latest%
    echo.
) else (
    echo ❌ Nessun screenshot trovato nella cartella
)

pause