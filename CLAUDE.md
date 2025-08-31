# CLAUDE.md - Sistema Operativo Documentale

**🧠 Context Persistence Engine for Claude Code**

Questo file è il **sistema operativo documentale** per Claude quando opera in questo repository. DEVE essere consultato all'inizio di ogni sessione per ricaricare il contesto e le procedure.

## 🚀 PROCEDURA OBBLIGATORIA DI STARTUP

**Claude DEVE eseguire questi passi ad ogni inizio sessione:**

### 1️⃣ Context Loading Sequence
```bash
# OBBLIGATORIO - Esegui in questo ordine:
1. Read ./docs/README.md (Master Documentation Index)
2. Read ./docs/development/README.md (Development Context)  
3. Read ./docs/development/session-status/CURRENT_SESSION_STATUS.md (Session State)
4. Check ./docs/bugs/README.md (Known Issues Context)

# README COMPLETI NEL PROGETTO:
./docs/README.md                              # 🗂️ Master Index
./docs/development/README.md                  # 🔧 Development Procedures  
./docs/bugs/README.md                        # 🐛 Bug Tracking
./github-sync/README.md                      # 🔄 Git Sync Operations
./supabase/README.md                         # 🗄️ Database Standard Operations
./supabase-fixes/README.md                   # 🔧 Database Fixes & Migrations
./supabase-fixes/schema-reference/README.md  # 📊 Schema Documentation
./SCREENSHOT/README.md                       # 📷 Screenshot System (DEPRECATO)
```

### 2️⃣ Validation Rules
- ✅ **MAI iniziare lavoro senza README appropriato**
- ✅ **SEMPRE verificare esistenza README in directory corrente**
- ✅ **CHIEDERE all'utente se unsure quale README consultare**
- ✅ **AGGIORNARE session status per task importanti**

## 🗺️ README Hierarchy Map

### 📋 Master Documentation Structure
```
./README.md                           # 🎯 Project Overview & Quick Start
./docs/README.md                      # 🗂️ MASTER INDEX (READ FIRST!)
├── ./docs/development/README.md      # 🔧 Development Procedures
├── ./docs/bugs/README.md            # 🐛 Bug Tracking System
├── ./docs/project/PROJECT_OVERVIEW.md # 📊 Current Project Status
├── ./docs/features/                 # 🚀 Feature Documentation
├── ./supabase/README.md             # 🗄️ Database Operations
├── ./SCREENSHOT/README.md           # 📷 Screenshot System (DEPRECATO - in dismissione)
└── ./github-sync/README.md          # 🔄 Git Sync Procedures
```

## 🤖 Auto-Context Loading Rules

### 📂 Directory-Based Loading
- **Entering `/docs/*`**: Auto-read `docs/README.md`
- **Entering `/supabase/*`**: Auto-read `supabase/README.md`
- **Entering `/src/*`**: Load development context from `docs/development/README.md`

### 🎯 Task-Based Loading
- **Bug fixing**: Read `docs/bugs/README.md` first
- **Feature development**: Read `docs/features/[relevant].md`
- **Database work**: Read `supabase/README.md`
- **Testing**: Read `docs/development/workflow/PRE_COMMIT_CHECKLIST.md`

### ⚡ Critical Commands & Automation
```bash
# Development
npm run dev        # Port 8080
npm run build      # Production build  
npm run lint       # Code quality

# AUTO-START DEVELOPMENT SETUP:
.\docs\development\tools\test-local.bat     # 🚀 AUTO-START per nuove sessioni

# AUTOMAZIONI .BAT DISPONIBILI:
./docs/development/tools/test-local.bat           # 🔧 Setup sviluppo locale
./github-sync/sync-to-github.bat                 # 🔄 Push completo GitHub
./github-sync/sync-from-github.bat               # 🔽 Pull completo GitHub
./github-sync/quick-commit.bat                   # ⚡ Commit rapido
./github-sync/pause-screenshot-hook.bat          # ⏸️ Pausa hook screenshot  
./github-sync/resume-screenshot-hook.bat         # ▶️ Riprendi hook screenshot
./supabase-fixes/schema-reference/dump-schema.bat # 📊 Esporta schema DB
./SCREENSHOT/auto-read-screenshots.bat           # 📷 Auto-analisi screenshot (DEPRECATO)

# Context Recovery
# Se Claude perde contesto → Re-read ./docs/README.md
# Se procedure unclear → Re-read directory-specific README
```

## 🔄 Session Persistence System

### 📝 End of Session Protocol
- **UPDATE**: `docs/development/session-status/CURRENT_SESSION_STATUS.md`
- **DOCUMENT**: Cosa è stato completato
- **NOTE**: Cosa deve continuare next session

### 🎯 Start of Session Protocol
- **READ**: CURRENT_SESSION_STATUS.md
- **LOAD**: Context from previous session
- **AUTO-START**: Eseguire automaticamente `.\docs\development\tools\test-local.bat` per setup ambiente
- **CONFIRM**: Continuation plan with user

### 🚀 New Session Auto-Setup
```bash
# AUTOMATICO per nuove sessioni Claude Code:
1. Read context loading sequence
2. Execute: .\docs\development\tools\test-local.bat
3. Verify: Server running su http://localhost:8080
4. Ready: Development environment attivo
```

## 🏗️ Project Architecture (Quick Reference)

### 🎯 Core Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn-ui + Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **State**: TanStack Query + React Context

### 🚨 Critical Rules
- **NO BLANK SCREENS** - Use ErrorBoundary + SafeComponent
- **Import Alias**: Always use `@/*` for src imports
- **Error Handling**: All components wrapped in SafeComponent
- **Port**: Dev server runs on 8080 (not 5173)

## 🎯 Context Recovery Commands

### When Claude Loses Context:
1. **Full Reset**: Re-read this CLAUDE.md file
2. **Partial Reset**: Re-read relevant directory README
3. **Task Reset**: Re-read task-specific documentation

### When Procedures Are Unclear:
1. Check appropriate README in hierarchy map
2. Consult PROMPT POOL for template solutions
3. Ask user for clarification with context

## 🔗 Quick Links to Essential Docs

- **📋 [Master Index](./docs/README.md)** - Start here for any work
- **🔧 [Development Guide](./docs/development/README.md)** - For coding tasks
- **📊 [Project Overview](./docs/project/PROJECT_OVERVIEW.md)** - Current status
- **🚀 [Feature Strategy](./docs/features/TEAM_BASED_SHARING_STRATEGY.md)** - Future roadmap
- **✅ [Pre-Commit Checklist](./docs/development/workflow/PRE_COMMIT_CHECKLIST.md)** - Before commits

---

## 🎣 Sistema Hook Avanzato (2025-08-31)

### **📸 Sistema Screenshot (DEPRECATO - in via di abbandono)**
```bash
# ❌ DEPRECATO - Non utilizzare più:
./SCREENSHOT/auto-read-screenshots.bat           # In dismissione
./github-sync/pause-screenshot-hook.bat          # Sostituito da session hook
./github-sync/resume-screenshot-hook.bat         # Sostituito da session hook
```

**Status**: 🛑 **DEPRECATO** - Sistema screenshot sostituito da session hook più robusti

### **🔄 New Session Hook System** 
```bash
# 🚀 NUOVI SESSION HOOK ATTIVI:

# Session Management:
./github-sync/session-start-hook.bat            # Auto-setup ambiente sessione
./github-sync/session-end-hook.bat              # Cleanup e backup sessione

# Development Automation:
./github-sync/dev-environment-check.bat         # Verifica requisiti ambiente
./github-sync/docs-auto-update-hook.bat         # 📊 Auto-update documentazione DB + ER diagrams  
./github-sync/auto-backup-session.bat           # Backup automatico progresso

# Advanced Hooks (Optional):
./github-sync/test-auto-run-hook.bat           # Auto-run test su cambi significativi  
./github-sync/performance-monitor-hook.bat     # Monitor performance app
```

### **💡 Hook Consigliati per il Progetto**

#### **🔥 High Priority**
1. **session-start-hook.bat**: Auto-setup completo ambiente sviluppo
2. **session-end-hook.bat**: Backup stato e cleanup automatico
3. **dev-environment-check.bat**: Verifica dipendenze e configurazione

#### **🔧 Medium Priority**  
4. **docs-auto-update-hook.bat**: 📊 Auto-update DOCUMENTAZIONE_VERSIONE_ATTUALE.md + diagrammi ER
5. **test-auto-run-hook.bat**: Esegue test automatici su modifiche critiche
6. **auto-backup-session.bat**: Backup periodico stato sessione

#### **⚡ Advanced/Future**
7. **performance-monitor-hook.bat**: Monitor metriche performance app
8. **db-health-check-hook.bat**: Verifica stato Supabase connection
9. **security-audit-hook.bat**: Audit automatico sicurezza codice

### **🛠️ Hook Implementation Pattern**
```batch
@echo off
echo 🎯 [HOOK_NAME] Starting...

REM Hook logic here
REM - Verify prerequisites
REM - Execute main operation
REM - Handle errors gracefully
REM - Log results

echo ✅ [HOOK_NAME] Completed
pause
```

## 📊 Documentazione Progetto - Review

### **docs/project/ Content Analysis**

#### **✅ UTILE - PROJECT_OVERVIEW.md** 
- **Status**: ⭐ **MANTIENI** - Documentazione master aggiornata
- **Ultimo update**: 2025-08-31 (Folder Tags System Completed)
- **Utilizzo**: Context loading primario per stato progetto

#### **✅ STRATEGICO - DOCUMENTAZIONE_VERSIONE_ATTUALE.md**
- **Status**: ⭐ **AUTO-UPDATING** - Documentazione database LIVE aggiornata automaticamente
- **Contenuto**: Schema database completo + diagrammi ER Mermaid auto-generati
- **Auto-Update**: Si aggiorna automaticamente ad ogni esecuzione di `dump-schema.bat`
- **Diagrammi**: Genera automaticamente ER completo + versione semplificata per processi core

### **🔄 Sistema Auto-Update Documentazione Database**

#### **📊 Workflow Automatico:**
1. **Trigger**: Esecuzione `dump-schema.bat` o rilevamento modifiche database
2. **Schema Dump**: Estrazione completa schema Supabase in formato SQL
3. **ER Generation**: Auto-generazione diagrammi Mermaid (completo + semplificato)
4. **Doc Update**: Aggiornamento DOCUMENTAZIONE_VERSIONE_ATTUALE.md con timestamp
5. **Auto-Commit**: Commit automatico modifiche documentazione

#### **🎨 Diagrammi ER Auto-Generati:**
- **Completo**: Tutte le tabelle con tutti i campi, relazioni e constraints
- **Semplificato**: Solo tabelle core (diagrams, saved_views, etc.) con campi chiave
- **Live**: Sempre sincronizzato con database attuale (no manual maintenance)

#### **⚡ Comandi Disponibili:**
```bash
# Update manuale documentazione database:
.\supabase-fixes\schema-reference\dump-schema.bat

# Auto-update intelligente (solo se necessario):
.\github-sync\docs-auto-update-hook.bat  

# Verifica status documentazione:
.\github-sync\dev-environment-check.bat
```

### **🎯 Raccomandazioni Documentazione**
1. **LIVE Documentation**: DOCUMENTAZIONE_VERSIONE_ATTUALE.md ora self-maintaining
2. **Focus**: Mantenere PROJECT_OVERVIEW.md per status funzionalità  
3. **Sync**: I due file ora hanno ruoli complementari (non duplicati)

---

**⚠️ IMPORTANTE**: Questo file è il **sistema nervoso centrale** della documentazione. Se Claude dimentica procedure o perde contesto, SEMPRE tornare qui per ricaricare le regole operative.