@echo off
setlocal EnableExtensions EnableDelayedExpansion

REM ===============================================
REM AI Diagram Creator - Local Test
REM ===============================================
echo.
echo ===============================================
echo Checking environment and starting local server
echo ===============================================

REM [1/4] Checking Node.js version...
echo.
echo [1/4] Checking Node.js version...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js non trovato. Per favore, installa Node.js 18+ e riprova.
    pause
    exit /b 1
)
for /f "usebackq delims=" %%v in (`node --version`) do set "NODE_VER=%%v"
echo Node.js %NODE_VER% OK.

REM [2/4] Installing dependencies...
echo.
echo [2/4] Installing dependencies...
echo Installazione delle dipendenze di Node.js...
call npm install --no-audit --no-fund --loglevel=error
if not %errorlevel% equ 0 (
    if exist node_modules (
        echo Avviso: npm install ha restituito un errore ma la cartella node_modules esiste. Procedo.
    ) else (
        echo ERROR: Installazione delle dipendenze fallita.
        pause
        exit /b 1
    )
)
echo Dipendenze installate con successo.

REM [3/4] Building the project...
echo.
echo [3/4] Building the project...
echo Avvio del processo di build...
call npm run build --loglevel=error
if not %errorlevel% equ 0 (
    echo ERROR: Build del progetto fallito. Controlla gli errori sopra.
    pause
    exit /b 1
)
echo Build completata con successo.

REM [4/4] Starting development server...
echo.
echo [4/4] Starting development server...
echo.
echo ===============================================
echo ✅ SUCCESS! Server in esecuzione.
echo L'app e' disponibile su: http://localhost:5173
echo (Premi Ctrl+C per fermare il server)
echo ===============================================
echo.

REM Avvia il server e apre il browser automaticamente dopo un breve ritardo.
start "" cmd /c "call npm run dev"
timeout /t 3 >nul
start "" http://localhost:5173

endlocal