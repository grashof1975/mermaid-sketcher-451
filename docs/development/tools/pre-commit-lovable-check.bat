@echo off
echo 🔍 Pre-Commit Lovable Compatibility Check
echo.

REM Change to project directory
cd /d "c:\CLAUDEcode2025\mermaid-sketcher-451"

echo ========================================
echo 📦 DEPENDENCIES CHECK
echo ========================================

REM Check package.json for known problematic versions
echo Checking package.json dependencies...

findstr "lucide-react.*0\.4" package.json >nul 2>&1
if !ERRORLEVEL! == 0 (
    echo ⚠️  WARNING: lucide-react version too old - update to ^0.542.0
    set HAS_WARNINGS=1
)

findstr "mermaid.*11\.4" package.json >nul 2>&1
if !ERRORLEVEL! == 0 (
    echo ⚠️  WARNING: mermaid version has known issues - update to ^11.10.1
    set HAS_WARNINGS=1
)

findstr "vite.*5\." package.json >nul 2>&1
if !ERRORLEVEL! == 0 (
    echo ⚠️  WARNING: vite version too old - update to ^7.1.3
    set HAS_WARNINGS=1
)

echo ========================================
echo 🗄️  DATABASE TYPES CHECK
echo ========================================

REM Check if database.ts has required types
if exist "src\types\database.ts" (
    echo Checking database types...
    
    findstr "export type Json" src\types\database.ts >nul 2>&1
    if !ERRORLEVEL! != 0 (
        echo ❌ MISSING: Json type definition in database.ts
        set HAS_ERRORS=1
    )
    
    findstr "tags: string\[\]" src\types\database.ts >nul 2>&1
    if !ERRORLEVEL! != 0 (
        echo ❌ MISSING: tags field in saved_views table
        set HAS_ERRORS=1
    )
    
    findstr "parent_folder_id: string" src\types\database.ts >nul 2>&1
    if !ERRORLEVEL! != 0 (
        echo ❌ MISSING: parent_folder_id field in saved_views table  
        set HAS_ERRORS=1
    )
    
    findstr "is_mother_view: boolean" src\types\database.ts >nul 2>&1
    if !ERRORLEVEL! != 0 (
        echo ❌ MISSING: is_mother_view field in saved_views table
        set HAS_ERRORS=1
    )
    
    findstr "public_share_links" src\types\database.ts >nul 2>&1
    if !ERRORLEVEL! != 0 (
        echo ❌ MISSING: public_share_links table definition
        set HAS_ERRORS=1
    )
) else (
    echo ❌ CRITICAL: src\types\database.ts not found
    set HAS_ERRORS=1
)

echo ========================================
echo 🔗 SHARING COMPONENTS CHECK
echo ========================================

REM Check for common sharing field mistakes
echo Checking sharing components...

findstr "created_by:" src\components\CreatePublicLinkModal.tsx >nul 2>&1
if !ERRORLEVEL! == 0 (
    echo ⚠️  WARNING: CreatePublicLinkModal uses created_by instead of shared_by
    set HAS_WARNINGS=1
)

findstr "shared_by.*user\.id" src\components\InviteUserModal.tsx >nul 2>&1
if !ERRORLEVEL! != 0 (
    echo ❌ MISSING: shared_by field in InviteUserModal
    set HAS_ERRORS=1
)

echo ========================================
echo 🔐 AUTH PROVIDER CHECK  
echo ========================================

REM Check auth error handling
echo Checking authentication error handling...

findstr "catch.*error" src\contexts\AuthProvider.tsx >nul 2>&1
if !ERRORLEVEL! != 0 (
    echo ❌ MISSING: Error handling in AuthProvider getSession
    set HAS_ERRORS=1
)

echo ========================================
echo 📊 SUMMARY
echo ========================================

if defined HAS_ERRORS (
    echo ❌ CRITICAL ERRORS FOUND - These MUST be fixed before Lovable import
    echo.
    echo 🔧 Run the following to apply standard fixes:
    echo    .\docs\development\tools\apply-lovable-fixes.bat
    echo.
    set /p CONTINUE=Continue anyway? (y/n): 
    if /i "!CONTINUE!"=="n" (
        exit /b 1
    )
) else if defined HAS_WARNINGS (
    echo ⚠️  WARNINGS FOUND - These may cause issues in Lovable
    echo.
    set /p CONTINUE=Continue with warnings? (y/n): 
    if /i "!CONTINUE!"=="n" (
        exit /b 1  
    )
) else (
    echo ✅ ALL CHECKS PASSED - Ready for Lovable import!
)

echo.
echo 🎯 Pre-commit check completed
pause