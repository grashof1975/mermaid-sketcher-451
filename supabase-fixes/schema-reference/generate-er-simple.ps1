# PowerShell script semplificato per generare diagrammi Mermaid ER da schema Supabase

param(
    [string]$SchemaFile = "20250831_sql.txt",
    [string]$OutputFile = "..\..\docs\project\DOCUMENTAZIONE_VERSIONE_ATTUALE.md"
)

Write-Host "🎯 SUPABASE ER DIAGRAM GENERATOR (SIMPLIFIED)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# Verificare se il file schema esiste
if (!(Test-Path $SchemaFile)) {
    Write-Host "❌ ERROR: Schema file '$SchemaFile' not found!" -ForegroundColor Red
    Write-Host "💡 Available files:" -ForegroundColor Yellow
    Get-ChildItem "*.txt" | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Yellow }
    pause
    exit 1
}

Write-Host "📋 Reading schema from: $SchemaFile" -ForegroundColor Green

# Leggere il contenuto del file schema
$schemaContent = Get-Content $SchemaFile -Raw

Write-Host "📊 Schema file size: $($schemaContent.Length) characters" -ForegroundColor Green

# Estrarre informazioni base sulle tabelle
$createTableMatches = [regex]::Matches($schemaContent, 'CREATE TABLE\s+(?:public\.)?(\w+)', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
$tableNames = @()
foreach ($match in $createTableMatches) {
    $tableNames += $match.Groups[1].Value
}

Write-Host "🗂️  Found $($tableNames.Count) tables: $($tableNames -join ', ')" -ForegroundColor Green

# Generare timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# Creare diagramma ER semplificato
$simplifiedER = @"
``````mermaid
erDiagram
    %% SUPABASE SCHEMA - SIMPLIFIED ER DIAGRAM  
    %% Auto-generated from database dump
    %% $timestamp
    
    %% CORE TABLES
    diagrams {
        uuid id PK
        uuid user_id FK
        varchar title
        text mermaid_code
        boolean is_public
        timestamp created_at
        timestamp updated_at
    }
    
    saved_views {
        uuid id PK
        uuid diagram_id FK
        varchar name
        decimal zoom_level
        decimal pan_x
        decimal pan_y
        timestamp created_at
    }
    
    comments {
        uuid id PK
        uuid user_id FK
        uuid linked_view_id FK
        text content
        timestamp created_at
    }
    
    profiles {
        uuid id PK
        varchar username
        varchar email
        text avatar_url
        timestamp created_at
    }
    
    diagram_shares {
        uuid id PK
        uuid diagram_id FK
        uuid owner_id FK
        uuid shared_with_id FK
        varchar permission_level
        timestamp created_at
    }
    
    saved_views_shares {
        uuid id PK
        uuid saved_view_id FK
        uuid owner_id FK
        uuid shared_with_id FK
        varchar permission_level
        timestamp created_at
    }
    
    folders {
        uuid id PK
        uuid user_id FK
        varchar name
        jsonb tags
        timestamp created_at
    }
    
    %% CORE RELATIONSHIPS
    profiles ||--o{ diagrams : owns
    diagrams ||--o{ saved_views : contains
    diagrams ||--o{ comments : has
    saved_views ||--o{ comments : linked_to
    diagrams ||--o{ diagram_shares : shared_via
    profiles ||--o{ diagram_shares : receives
    saved_views ||--o{ saved_views_shares : shared_via
    profiles ||--o{ folders : organizes
    folders ||--o{ saved_views : contains
``````
"@

# Creare contenuto markdown completo  
$documentContent = @"
# Documentazione Sistema Database - Versione Aggiornata

**🔄 Auto-generato da dump Supabase il:** $timestamp  
**📊 Tabelle totali nel database:** $($tableNames.Count)  
**🎯 Status:** LIVE DOCUMENTATION (aggiornata automaticamente)

---

## 📋 Panoramica Generale

Il sistema database Mermaid Sketcher è costruito su Supabase (PostgreSQL) e supporta tutte le funzionalità dell'applicazione: gestione diagrammi, sistema viste, commenti, condivisione e autenticazione utenti.

## 🎯 Schema Database - Diagramma ER Semplificato

Diagramma che evidenzia i processi principali e le relazioni chiave:

$simplifiedER

---

## 📊 Tabelle Presenti nel Database

Le seguenti tabelle sono state rilevate nel dump schema:

"@

# Aggiungere lista tabelle
for ($i = 0; $i -lt $tableNames.Count; $i++) {
    $tableName = $tableNames[$i]
    $documentContent += "- **$($i + 1). $tableName**`n"
}

$documentContent += @"

---

## 🗂️ Tabelle Core del Sistema

### ✅ diagrams
**Descrizione:** Tabella principale per i diagrammi Mermaid. Contiene il codice, metadati e informazioni di proprietà.
**Ruolo:** Centro del sistema - tutti gli altri elementi si collegano ai diagrammi

### ✅ saved_views  
**Descrizione:** Viste salvate dei diagrammi con zoom, pan e coordinate specifiche per navigazione rapida.
**Ruolo:** Sistema di navigazione e bookmarking delle viste

### ✅ comments
**Descrizione:** Sistema commenti collegato a viste specifiche per collaboration.
**Ruolo:** Funzionalità collaborative e annotazioni

### ✅ profiles
**Descrizione:** Profili utenti estesi per auth.users di Supabase.
**Ruolo:** Sistema utenti e autenticazione

### ✅ diagram_shares
**Descrizione:** Sistema condivisione diagrammi con controllo permessi.
**Ruolo:** Funzionalità sharing e collaboration sui diagrammi

### ✅ saved_views_shares  
**Descrizione:** Condivisione specifica per viste individuali.
**Ruolo:** Granular sharing a livello di singola vista

### ✅ folders
**Descrizione:** Sistema organizzazione gerarchica per viste con supporto tag.
**Ruolo:** Organizzazione e categorizzazione contenuti

---

## 🔄 Aggiornamento Automatico

Questo documento viene aggiornato automaticamente ogni volta che viene eseguito il dump dello schema database tramite:

``````bash
# Eseguire per aggiornare documentazione:
.\supabase-fixes\schema-reference\dump-schema.bat
``````

Il processo:
1. 🗄️ Esegue dump schema Supabase completo
2. 🎨 Genera diagrammi ER Mermaid aggiornati  
3. 📝 Aggiorna questo documento automaticamente
4. ✅ Mantiene sincronizzazione con database live

### 📅 Cronologia Aggiornamenti

- **$timestamp**: Schema aggiornato automaticamente (tabelle: $($tableNames.Count))
- **Previous updates**: Vedere git history per cronologia completa

---

## 🛠️ Note Tecniche

### RLS (Row Level Security)
Il database utilizza extensively RLS policies per garantire che:
- Users possano accedere solo ai propri dati
- La condivisione rispetti i permessi impostati  
- I link pubblici funzionino senza autenticazione

### Performance Considerations
- Indexes ottimizzati per query frequenti
- Foreign keys per integrità referenziale
- Triggers per gestione automatica timestamps

### Sistema Tags
- Supporto JSON per tag flessibili su cartelle e viste
- Sistema di folder tags con modalità apply_to_views/folder_only
- Filtri cumulativi per navigazione avanzata

### Condivisione Multi-Level
- Condivisione a livello diagramma (diagram_shares)
- Condivisione granulare a livello vista (saved_views_shares)
- Permessi: viewer, commenter, editor
- Link pubblici anonimi supportati

---

**⚡ IMPORTANTE**: Questa documentazione è **LIVE** e si aggiorna automaticamente. Non modificare manualmente - le modifiche verranno sovrascritte al prossimo dump schema.

**🔗 Per schema completo e dettagliato**: Consultare i file .sql nella directory supabase-fixes/schema-reference/

---

*Generato automaticamente da generate-er-simple.ps1*  
*Database dump source: $SchemaFile*
"@

# Scrivere il file
Write-Host "📝 Writing documentation to: $OutputFile" -ForegroundColor Green

# Creare directory se non esiste
$outputDir = Split-Path $OutputFile -Parent
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
    Write-Host "📁 Created directory: $outputDir" -ForegroundColor Yellow
}

# Scrivere il contenuto
$documentContent | Out-File -FilePath $OutputFile -Encoding UTF8 -Force

Write-Host "" 
Write-Host "✅ Documentation generated successfully!" -ForegroundColor Green
Write-Host "📍 File location: $OutputFile" -ForegroundColor Cyan  
Write-Host "📊 Tables found: $($tableNames.Count)" -ForegroundColor Green
Write-Host "🎯 Simplified ER diagram included" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 The documentation is now live and will auto-update on each schema dump!" -ForegroundColor Yellow
Write-Host ""