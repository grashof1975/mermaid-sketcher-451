# PowerShell script per generare diagrammi Mermaid ER da schema Supabase
# Genera sia diagramma completo che versione semplificata

param(
    [string]$SchemaFile = "schema-dump.sql",
    [string]$OutputFile = "..\..\docs\project\DOCUMENTAZIONE_VERSIONE_ATTUALE.md"
)

Write-Host "🎯 SUPABASE ER DIAGRAM GENERATOR" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Verificare se il file schema esiste
if (!(Test-Path $SchemaFile)) {
    Write-Host "❌ ERROR: Schema file '$SchemaFile' not found!" -ForegroundColor Red
    Write-Host "💡 Run dump-schema.bat first to generate schema dump" -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "📋 Reading schema from: $SchemaFile" -ForegroundColor Green

# Leggere il contenuto del file schema
$schemaContent = Get-Content $SchemaFile -Raw

# Funzione per estrarre le tabelle e i loro campi
function Extract-Tables {
    param([string]$content)
    
    $tables = @{}
    
    # Pattern per trovare CREATE TABLE statements
    $tablePattern = 'CREATE TABLE\s+(?:public\.)?(\w+)\s*\((.*?)\);'
    $matches = [regex]::Matches($content, $tablePattern, [System.Text.RegularExpressions.RegexOptions]::Singleline)
    
    foreach ($match in $matches) {
        $tableName = $match.Groups[1].Value
        $tableDefinition = $match.Groups[2].Value
        
        # Estrarre i campi
        $fields = @()
        $fieldLines = $tableDefinition -split "`n" | Where-Object { $_.Trim() -ne "" -and !$_.Trim().StartsWith("CONSTRAINT") -and !$_.Trim().StartsWith("CHECK") }
        
        foreach ($line in $fieldLines) {
            $line = $line.Trim().TrimEnd(',')
            if ($line -match '^\s*(\w+)\s+([^,\s]+)(?:\s+(.+))?') {
                $fieldName = $matches[1]
                $fieldType = $matches[2]
                $constraints = if ($matches[3]) { $matches[3] } else { "" }
                
                $isPK = $constraints -match "PRIMARY KEY"
                $isFK = $constraints -match "REFERENCES"
                $isNotNull = $constraints -match "NOT NULL"
                
                $fields += @{
                    Name = $fieldName
                    Type = $fieldType
                    IsPK = $isPK
                    IsFK = $isFK
                    IsNotNull = $isNotNull
                    Constraints = $constraints
                }
            }
        }
        
        if ($fields.Count -gt 0) {
            $tables[$tableName] = $fields
        }
    }
    
    return $tables
}

# Estrarre le tabelle
Write-Host "🔍 Extracting table definitions..." -ForegroundColor Yellow
$tables = Extract-Tables -content $schemaContent

Write-Host "📊 Found $($tables.Count) tables" -ForegroundColor Green

# Generare diagramma ER completo
function Generate-CompleteER {
    param([hashtable]$tables)
    
    $diagram = @"
```mermaid
erDiagram
    %% SUPABASE SCHEMA - COMPLETE ER DIAGRAM
    %% Generated automatically from database dump
    %% $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    
"@

    # Aggiungere ogni tabella con tutti i campi
    foreach ($tableName in $tables.Keys | Sort-Object) {
        $fields = $tables[$tableName]
        $diagram += "`n    $tableName {" + "`n"
        
        foreach ($field in $fields) {
            $typeDisplay = $field.Type
            $symbol = ""
            
            if ($field.IsPK) { $symbol = "PK" }
            elseif ($field.IsFK) { $symbol = "FK" }
            elseif ($field.IsNotNull) { $symbol = "NOT_NULL" }
            
            $diagram += "        $($typeDisplay) $($field.Name) $symbol" + "`n"
        }
        
        $diagram += "    }" + "`n"
    }
    
    # Aggiungere relazioni (semplificato - dalle FK)
    $diagram += "`n    %% RELATIONSHIPS" + "`n"
    
    foreach ($tableName in $tables.Keys) {
        $fields = $tables[$tableName]
        foreach ($field in $fields) {
            if ($field.IsFK -and $field.Constraints -match 'REFERENCES\s+(\w+)\s*\((\w+)\)') {
                $referencedTable = $matches[1]
                $referencedField = $matches[2]
                
                # Determinare tipo relazione (semplificato)
                $relationshipType = if ($field.Name -eq "id" -or $field.Name.EndsWith("_id")) { "||--o{" } else { "||--||" }
                
                $diagram += "    $referencedTable $relationshipType $tableName : has" + "`n"
            }
        }
    }
    
    $diagram += "```"
    return $diagram
}

# Generare diagramma ER semplificato (solo tabelle principali e campi chiave)
function Generate-SimplifiedER {
    param([hashtable]$tables)
    
    $diagram = @"
```mermaid
erDiagram
    %% SUPABASE SCHEMA - SIMPLIFIED ER DIAGRAM  
    %% Key tables and relationships only
    %% $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    
"@

    # Tabelle core del sistema (filtrare quelle più importanti)
    $coreTables = @("diagrams", "saved_views", "comments", "profiles", "diagram_shares", "saved_views_shares", "public_view_links", "folders")
    
    foreach ($tableName in $coreTables) {
        if ($tables.ContainsKey($tableName)) {
            $fields = $tables[$tableName]
            $diagram += "`n    $tableName {" + "`n"
            
            # Solo campi chiave (PK, FK, e alcuni importanti)
            $keyFields = $fields | Where-Object { 
                $_.IsPK -or $_.IsFK -or 
                $_.Name -eq "title" -or $_.Name -eq "name" -or 
                $_.Name -eq "email" -or $_.Name -eq "permission_level" -or
                $_.Name -eq "created_at" -or $_.Name -eq "updated_at"
            }
            
            foreach ($field in $keyFields) {
                $typeDisplay = $field.Type -replace 'character varying.*', 'varchar' -replace 'timestamp.*', 'timestamp'
                $symbol = ""
                
                if ($field.IsPK) { $symbol = "PK" }
                elseif ($field.IsFK) { $symbol = "FK" }
                
                $diagram += "        $typeDisplay $($field.Name) $symbol" + "`n"
            }
            
            $diagram += "    }" + "`n"
        }
    }
    
    # Relazioni core
    $diagram += @"

    %% CORE RELATIONSHIPS
    profiles ||--o{ diagrams : owns
    diagrams ||--o{ saved_views : contains
    diagrams ||--o{ comments : has
    saved_views ||--o{ comments : linked_to
    diagrams ||--o{ diagram_shares : shared_via
    profiles ||--o{ diagram_shares : receives
    saved_views ||--o{ saved_views_shares : shared_via
    diagrams ||--o{ public_view_links : public_access
    profiles ||--o{ folders : organizes
    folders ||--o{ saved_views : contains
```
"@

    return $diagram
}

# Generare i diagrammi
Write-Host "🎨 Generating complete ER diagram..." -ForegroundColor Yellow
$completeER = Generate-CompleteER -tables $tables

Write-Host "🎨 Generating simplified ER diagram..." -ForegroundColor Yellow
$simplifiedER = Generate-SimplifiedER -tables $tables

# Generare il contenuto markdown completo
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$documentContent = @"
# Documentazione Sistema Database - Versione Aggiornata

**🔄 Auto-generato da dump Supabase il:** $timestamp  
**📊 Tabelle totali nel database:** $($tables.Count)  
**🎯 Status:** LIVE DOCUMENTATION (aggiornata automaticamente)

---

## 📋 Panoramica Generale

Il sistema database Mermaid Sketcher è costruito su Supabase (PostgreSQL) e supporta tutte le funzionalità dell'applicazione: gestione diagrammi, sistema viste, commenti, condivisione e autenticazione utenti.

## 🗺️ Schema Database - Diagramma ER Completo

Diagramma completo con tutte le tabelle e campi presenti nel database:

$completeER

## 🎯 Schema Semplificato - Processi Core

Diagramma semplificato che evidenzia i processi principali e le relazioni chiave:

$simplifiedER

---

## 📊 Dettaglio Tabelle Core

"@

# Aggiungere dettagli tabelle principali
$coreTableDetails = @{
    "diagrams" = "Tabella principale per i diagrammi Mermaid. Contiene il codice, metadati e informazioni di proprietà."
    "saved_views" = "Viste salvate dei diagrammi con zoom, pan e coordinate specifiche per navigazione rapida."
    "comments" = "Sistema commenti collegato a viste specifiche per collaboration."
    "profiles" = "Profili utenti estesi per auth.users di Supabase."
    "diagram_shares" = "Sistema condivisione diagrammi con controllo permessi."
    "saved_views_shares" = "Condivisione specifica per viste individuali."
    "public_view_links" = "Link pubblici per accesso anonimo ai contenuti."
    "folders" = "Sistema organizzazione gerarchica per viste."
}

foreach ($tableName in $coreTableDetails.Keys) {
    if ($tables.ContainsKey($tableName)) {
        $description = $coreTableDetails[$tableName]
        $fieldCount = $tables[$tableName].Count
        
        $documentContent += @"

### ✅ $tableName
**Campi totali:** $fieldCount  
**Descrizione:** $description

"@
    }
}

$documentContent += @"

---

## 🔄 Aggiornamento Automatico

Questo documento viene aggiornato automaticamente ogni volta che viene eseguito il dump dello schema database tramite:

```bash
# Eseguire per aggiornare documentazione:
.\supabase-fixes\schema-reference\dump-schema.bat
```

Il processo:
1. 🗄️ Esegue dump schema Supabase  
2. 🎨 Genera diagrammi ER Mermaid aggiornati
3. 📝 Aggiorna questo documento automaticamente
4. ✅ Mantiene sincronizzazione con database live

### 📅 Cronologia Aggiornamenti

- **$timestamp**: Schema aggiornato automaticamente
- **Previous updates**: Vedere git history per cronologia completa

---

## 🛠️ Note Tecniche

### RLS (Row Level Security)
Il database utilizza extensively RLS policies per garantire che:
- Users possono accedere solo ai propri dati
- La condivisione rispetta i permessi impostati  
- I link pubblici funzionano senza autenticazione

### Performance Considerations
- Indexes ottimizzati per query frequenti
- Foreign keys per integrità referenziale
- Triggers per gestione automatica timestamps

### Backup e Recovery
- Backup automatici Supabase
- Schema versioning tramite migration files
- Recovery point-in-time disponibile

---

**⚡ IMPORTANTE**: Questa documentazione è **LIVE** e si aggiorna automaticamente. Non modificare manualmente - le modifiche verranno sovrascritte al prossimo dump schema.
"@

# Scrivere il file
Write-Host "📝 Writing documentation to: $OutputFile" -ForegroundColor Green

# Creare directory se non esiste
$outputDir = Split-Path $OutputFile
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
}

# Scrivere il contenuto
$documentContent | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "✅ Documentation generated successfully!" -ForegroundColor Green
Write-Host "📍 File location: $OutputFile" -ForegroundColor Cyan
Write-Host "📊 Complete ER diagram: $($tables.Count) tables included" -ForegroundColor Green
Write-Host "🎯 Simplified ER diagram: Core relationships highlighted" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 The documentation is now live and will auto-update on each schema dump!" -ForegroundColor Yellow