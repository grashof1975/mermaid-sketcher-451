@echo off
echo 🔧 Apply Lovable Standard Fixes - Auto-Fix Common Issues
echo.

REM Change to project directory
cd /d "c:\CLAUDEcode2025\mermaid-sketcher-451"

echo ========================================
echo 📦 APPLYING DEPENDENCY FIXES
echo ========================================

echo Applying standard dependency versions...

REM Check if package.json needs updates
findstr "mermaid.*11\." package.json >nul 2>&1
if !ERRORLEVEL! == 0 (
    echo 🔧 Fixing mermaid version: 11.x → 10.9.1
    powershell -Command "(Get-Content package.json) -replace '\"mermaid\": \".*\"', '\"mermaid\": \"^10.9.1\"' | Set-Content package.json"
    set CHANGES_MADE=1
)

findstr "lucide-react.*0\.4" package.json >nul 2>&1
if !ERRORLEVEL! == 0 (
    echo 🔧 Fixing lucide-react version: 0.4x → 0.542.0+
    powershell -Command "(Get-Content package.json) -replace '\"lucide-react\": \".*\"', '\"lucide-react\": \"^0.542.0\"' | Set-Content package.json"
    set CHANGES_MADE=1
)

echo ========================================
echo ⚡ APPLYING VITE CONFIG FIXES
echo ========================================

REM Check if vite.config.ts needs mermaid fixes
if exist "vite.config.ts" (
    findstr "manualChunks.*mermaid" vite.config.ts >nul 2>&1
    if !ERRORLEVEL! != 0 (
        echo 🔧 Vite config needs Mermaid CommonJS fixes
        echo ⚠️  Manual intervention required for vite.config.ts
        echo    → Apply Pattern 20250831d_ from CLAUDE.md
        set MANUAL_FIXES_NEEDED=1
    ) else (
        echo ✅ Vite config already has mermaid fixes
    )
) else (
    echo ❌ vite.config.ts not found
)

echo ========================================
echo 🔐 APPLYING AUTH PROVIDER FIXES
echo ========================================

REM Check AuthProvider for timeout
if exist "src\contexts\AuthProvider.tsx" (
    findstr "setTimeout.*10000" src\contexts\AuthProvider.tsx >nul 2>&1
    if !ERRORLEVEL! != 0 (
        echo 🔧 AuthProvider needs safety timeout
        echo ⚠️  Manual intervention required for AuthProvider.tsx
        echo    → Apply Pattern 20250831c_ from CLAUDE.md  
        set MANUAL_FIXES_NEEDED=1
    ) else (
        echo ✅ AuthProvider already has safety timeout
    )
) else (
    echo ❌ AuthProvider.tsx not found
)

echo ========================================
echo 🎨 CHECKING MERMAID IMPORT PATTERNS
echo ========================================

REM Check for static mermaid imports
echo Checking for problematic static imports...
findstr /R "import.*mermaid.*from" src\components\*.tsx >nul 2>&1
if !ERRORLEVEL! == 0 (
    echo 🔧 Found static mermaid imports - need dynamic import conversion
    echo ⚠️  Manual intervention required for mermaid imports
    echo    → Apply Pattern 20250831d_ dynamic import from CLAUDE.md
    echo.
    echo 📋 Files with static mermaid imports:
    findstr /R "import.*mermaid.*from" src\components\*.tsx
    set MANUAL_FIXES_NEEDED=1
) else (
    echo ✅ No problematic static mermaid imports found
)

echo ========================================
echo 📊 SUMMARY
echo ========================================

if defined CHANGES_MADE (
    echo ✅ AUTOMATIC FIXES APPLIED:
    echo    - Updated package.json dependencies
    echo.
    echo 🔄 Next steps:
    echo    1. Run: npm install
    echo    2. Test the application
    echo.
)

if defined MANUAL_FIXES_NEEDED (
    echo ⚠️  MANUAL FIXES REQUIRED:
    echo    → Consult CLAUDE.md "SISTEMA STANDARDIZZATO FIX LOVABLE"
    echo    → Apply appropriate success patterns (20250831b_, 20250831c_, 20250831d_)
    echo.
)

if not defined CHANGES_MADE if not defined MANUAL_FIXES_NEEDED (
    echo ✅ ALL STANDARD FIXES ALREADY APPLIED!
    echo    Project appears to be Lovable-compatible
)

echo.
echo 🎯 Standard fixes application completed
echo 📖 For detailed patterns, see: CLAUDE.md
pause