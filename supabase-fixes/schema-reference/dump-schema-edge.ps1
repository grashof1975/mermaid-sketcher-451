# PowerShell script che usa Edge Function per dump schema COMPLETO
# Usage: Executed by dump-schema.bat
# Output: Chiama Edge Function Supabase e salva risultato con foreign keys

param([string]$OutputFile = "", [switch]$IncludeForeignKeys)

# Setup directory e filename
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $scriptPath

if (-not $OutputFile) {
    $currentDate = Get-Date -Format "yyyyMMdd"
    $suffix = if ($IncludeForeignKeys) { "_complete_with_fk.sql" } else { "_sql.txt" }
    $OutputFile = $currentDate + $suffix
}

$fullPath = Join-Path $scriptPath $OutputFile

Write-Host "Working in: $scriptPath" -ForegroundColor Cyan
Write-Host "Output file: $fullPath" -ForegroundColor Cyan
Write-Host "Using Edge Function for COMPLETE schema dump with Foreign Keys..." -ForegroundColor Yellow

# URL Edge Function (aggiorna con il tuo PROJECT_ID)
$edgeFunctionUrl = "https://cfbaomnccefkpqnfjjiv.supabase.co/functions/v1/super-handler"
$apiKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmYmFvbW5jY2Vma3BxbmZqaml2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1OTg4NzQsImV4cCI6MjA3MTE3NDg3NH0.QqN16sDaaTrru8XeyNGdX4sZtXVgsMh6rUEijf8VO5c"

try {
    Write-Host "Calling Edge Function..." -ForegroundColor Yellow
    
    # Headers per autenticazione
    $headers = @{
        "apikey" = $apiKey
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }
    
    # Body per richiedere schema completo con foreign keys
    $body = @{
        action = "dump_complete_schema"
        include_foreign_keys = $true
        include_constraints = $true
        include_indexes = $true
    } | ConvertTo-Json
    
    # Chiamata Edge Function
    Write-Host "POST $edgeFunctionUrl (with complete schema request)" -ForegroundColor Gray
    
    $response = Invoke-RestMethod -Uri $edgeFunctionUrl -Method Post -Headers $headers -Body $body -TimeoutSec 60
    
    if ($response -and $response.Length -gt 100) {
        # Save to file
        $response | Out-File -FilePath $fullPath -Encoding UTF8
        
        # Copy to clipboard
        $response | Set-Clipboard
        
        Write-Host "Schema dump completed successfully!" -ForegroundColor Green
        Write-Host "Saved to: $fullPath" -ForegroundColor Cyan
        Write-Host "Copied to clipboard" -ForegroundColor Cyan
        Write-Host "Schema size: $($response.Length) characters" -ForegroundColor Green
        
    } elseif ($response) {
        Write-Host "Edge Function returned short response (possible error):" -ForegroundColor Yellow
        Write-Host $response -ForegroundColor Red
        
        # Salva comunque per debug
        $response | Out-File -FilePath $fullPath -Encoding UTF8
        
    } else {
        Write-Host "No data returned from Edge Function" -ForegroundColor Red
    }
    
} catch {
    Write-Host "Error calling Edge Function: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Possible solutions:" -ForegroundColor Yellow
    Write-Host "1. Check internet connection" -ForegroundColor Gray
    Write-Host "2. Verify Edge Function is deployed" -ForegroundColor Gray
    Write-Host "3. Check API key is valid" -ForegroundColor Gray
    Write-Host "4. Use manual method with _utility_dump_001_complete_schema.sql" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Script completed. Press any key to close..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")