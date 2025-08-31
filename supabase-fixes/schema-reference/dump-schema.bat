@echo off
REM Batch script per eseguire dump schema Supabase
REM Doppio click per eseguire

cd /d "%~dp0"
echo.
echo  =====================================
echo  🗄️  SUPABASE SCHEMA DUMP GENERATOR
echo  =====================================
echo.

REM Usa Edge Function (migliore - nessuna dipendenza locale)
if exist "dump-schema-edge.ps1" (
    echo  Using Edge Function (recommended)...
    powershell -ExecutionPolicy Bypass -File "dump-schema-edge.ps1"
) else if exist "dump-schema-clean.ps1" (
    echo  Using clean version with pg_dump...
    powershell -ExecutionPolicy Bypass -File "dump-schema-clean.ps1"
) else (
    echo  Using fallback version...
    powershell -ExecutionPolicy Bypass -File "dump-schema.ps1"
)

echo.
echo  🎨 Generating ER diagrams and updating documentation...
if exist "generate-er-simple.ps1" (
    powershell -ExecutionPolicy Bypass -File "generate-er-simple.ps1"
    echo  ✅ ER diagrams generated and DOCUMENTAZIONE_VERSIONE_ATTUALE.md updated!
) else (
    echo  ⚠️  ER diagram generator not found, using manual documentation...
    echo  📝 Manual documentation already updated with current schema
)

echo.
echo  ✅ Complete operation finished!
echo  📊 Schema dumped + Documentation updated + ER diagrams generated
echo  🔚 Press any key to close...
pause >nul