@echo off
echo ================================
echo AI Diagram Creator - Local Test
echo ================================

echo.
echo [1/5] Checking Node.js version...
node --version
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Please install Node.js 18+ 
    pause
    exit /b 1
)

echo.
echo [2/5] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [3/5] Type checking...
call npm run type-check
if %errorlevel% neq 0 (
    echo ERROR: TypeScript type checking failed
    pause
    exit /b 1
)

echo.
echo [4/5] Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [5/5] Starting development server...
echo.
echo ===============================
echo SUCCESS! All checks passed.
echo ===============================
echo.
echo The app will open at: http://localhost:5173
echo.
echo Check for these indicators:
echo [✓] No white screen
echo [✓] Error boundary UI shows if errors occur  
echo [✓] Loading states work properly
echo [✓] Console shows no critical errors
echo.
echo Press Ctrl+C to stop the server
echo.

start http://localhost:5173
call npm run dev

pause