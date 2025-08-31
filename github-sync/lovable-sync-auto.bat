@echo off
echo 🔄 Lovable Auto-Sync Hook - Integrating automatic fixes
echo.

REM Change to project directory
cd /d "c:\CLAUDEcode2025\mermaid-sketcher-451"

echo 📡 Fetching latest changes from GitHub...
git fetch origin

REM Check if there are remote changes
git rev-list HEAD..origin/%1 --count > temp_count.txt
set /p COMMIT_COUNT=<temp_count.txt
del temp_count.txt

if %COMMIT_COUNT% GTR 0 (
    echo ✨ Found %COMMIT_COUNT% new commits from Lovable fixes
    echo.
    echo 📋 Lovable fixes found:
    git log HEAD..origin/%1 --oneline
    echo.
    echo 📊 Files changed:
    git diff HEAD..origin/%1 --stat
    echo.
    
    set /p MERGE_CHOICE=🔀 Merge Lovable fixes? (y/n): 
    if /i "%MERGE_CHOICE%"=="y" (
        echo.
        echo 🔄 Merging Lovable fixes...
        git merge origin/%1 --no-edit
        if !ERRORLEVEL! == 0 (
            echo ✅ Lovable fixes integrated successfully!
            echo.
            echo 📋 Integration Summary:
            git log -1 --oneline
        ) else (
            echo ❌ Merge conflicts detected. Please resolve manually.
            echo Use: git status to see conflicts
        )
    ) else (
        echo ⏸️ Lovable fixes available but not merged.
        echo Use: git merge origin/%1 when ready
    )
) else (
    echo ✅ Already up to date with Lovable fixes
)

echo.
echo 🎯 Current branch status:
git status --short
echo.
pause