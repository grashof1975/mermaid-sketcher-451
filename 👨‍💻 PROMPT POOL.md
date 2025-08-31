# 👨‍💻 PROMPT POOL

**Template di prompt riutilizzabili per Claude Code**

Raccolta di prompt standardizzati per operazioni comuni nel progetto Mermaid Sketcher.

## 🚀 Session Startup Templates

### 🔄 Context Recovery Prompt
```
Claude, sto iniziando una nuova sessione. Esegui questa startup sequence:

1. Read ./CLAUDE.md per ricaricare il sistema operativo documentale
2. Read ./docs/README.md per il master index
3. Read ./docs/development/README.md per il context di sviluppo
4. Read ./docs/development/session-status/CURRENT_SESSION_STATUS.md per lo stato corrente

Poi conferma che hai caricato il contesto e dimmi qual è lo stato del progetto.
```

### 🎯 Task-Specific Context Loading
```
Claude, devo lavorare su [TASK_TYPE]. Prima di iniziare:

1. Read ./CLAUDE.md per le regole operative
2. Read [DIRECTORY_README] appropriato per il tipo di task
3. Conferma che conosci le procedure per [TASK_TYPE]
4. Mostrami il piano di lavoro basato sulla documentazione

[TASK_TYPE]: bug fix | feature development | database work | testing | documentation
```

## 🔧 Development Templates

### 🏗️ New Feature Development
```
Voglio sviluppare una nuova feature: [FEATURE_NAME]

Procedura:
1. Read ./docs/development/README.md per development procedures
2. Check ./docs/features/ per feature documentation esistente
3. Review architecture in ./CLAUDE.md
4. Crea piano implementazione seguendo pattern esistenti
5. Follow ./docs/development/workflow/PRE_COMMIT_CHECKLIST.md

Feature: [DESCRIZIONE]
Scope: [SCOPE]
```

### 🐛 Bug Fix Template
```
Ho trovato un bug: [BUG_DESCRIPTION]

Procedura debug:
1. Read ./docs/bugs/README.md per bug tracking procedures
2. Check se esiste già report per questo bug
3. Analizza il codice seguendo error handling patterns da ./CLAUDE.md
4. Proponi fix seguendo le regole ErrorBoundary + SafeComponent
5. Test con .\test-local.bat

Bug location: [FILE:LINE]
Symptoms: [SYMPTOMS]
Expected behavior: [EXPECTED]
```

### 🗄️ Database Operations Template
```
Devo lavorare sul database: [OPERATION_TYPE]

Procedura:
1. Read ./supabase/README.md per database procedures
2. Read ./CLAUDE.md per environment variables requirements
3. Check existing schema in src/types/database.ts
4. Follow Supabase integration patterns
5. Test real-time subscriptions se necessario

Operation: [CREATE TABLE | ALTER | QUERY | MIGRATION]
Target: [TABLE/FEATURE]
```

## 🎨 UI/UX Templates

### 🎯 Component Development
```
Voglio creare/modificare il componente: [COMPONENT_NAME]

Procedura:
1. Read ./CLAUDE.md per component standards
2. Check existing patterns in src/components/
3. Use shadcn-ui + Radix UI patterns
4. Follow @/* import alias convention
5. Wrap in SafeComponent per error handling
6. Test con ErrorBoundary

Component location: src/components/[PATH]
Purpose: [PURPOSE]
Requirements: [REQUIREMENTS]
```

### 📱 Responsive Design Check
```
Voglio verificare/migliorare responsive design per: [COMPONENT/PAGE]

Checklist:
1. Test mobile breakpoints
2. Check Tailwind responsive classes
3. Verify touch interactions
4. Test in browser dev tools
5. Check accessibility

Target: [COMPONENT/PAGE]
Breakpoints to test: mobile, tablet, desktop
```

## 🧪 Testing Templates

### ✅ Pre-Commit Testing
```
Voglio fare commit delle modifiche. Esegui pre-commit testing:

1. Read ./docs/development/workflow/PRE_COMMIT_CHECKLIST.md
2. Run .\test-local.bat 
3. Verify NO blank screens
4. Check console for errors
5. Test ErrorBoundary functionality
6. Confirm build success

Files modified: [LIST]
Changes summary: [SUMMARY]
```

### 🔍 Code Quality Check
```
Verifica code quality per: [FILES/DIRECTORIES]

Checklist:
1. TypeScript compliance (relaxed settings)
2. Import aliases consistency (@/*)
3. ErrorBoundary + SafeComponent usage
4. shadcn-ui pattern compliance
5. No hardcoded values (use env vars)

Focus areas: [AREAS]
```

## 📊 Documentation Templates

### 📝 Documentation Update
```
Devo aggiornare documentazione per: [TOPIC]

Procedura:
1. Read ./docs/README.md per documentation structure
2. Identify appropriate README location
3. Follow existing documentation patterns
4. Update CURRENT_SESSION_STATUS.md se relevant
5. Link from master index se necessario

Topic: [TOPIC]
Scope: [NEW | UPDATE | ARCHIVE]
Target file: [PATH]
```

### 📋 Session Status Update
```
Aggiorna session status per fine sessione:

1. Read ./docs/development/session-status/CURRENT_SESSION_STATUS.md
2. Document completed tasks
3. Note pending work for next session
4. Update project status se major changes
5. Link relevant files/commits

Completed: [TASKS]
Next session: [CONTINUATION_PLAN]
```

## 🔄 Context Recovery Templates

### 🧠 Lost Context Recovery
```
Claude, sembra che tu abbia perso il contesto del progetto.

Recovery procedure:
1. Read ./CLAUDE.md COMPLETAMENTE
2. Read ./docs/README.md per master index
3. Read documentation relevante per current task
4. Ask clarification su current work status
5. Confirm understanding before proceeding

Current task context: [CONTEXT_DESCRIPTION]
```

### 📂 Directory Context Switch
```
Sto cambiando directory di lavoro da [OLD_DIR] a [NEW_DIR].

Context switch procedure:
1. Check se esiste README.md in [NEW_DIR]
2. Read nuovo README se presente
3. Load context appropriato da ./CLAUDE.md
4. Confirm understanding of new directory purpose
5. Ask su specific task in new location

New directory: [NEW_DIR]
Purpose: [PURPOSE]
```

## ⚡ Emergency Templates

### 🚨 Blank Screen Debug
```
EMERGENCY: App showing blank screen!

Debug procedure:
1. Check browser console for errors
2. Verify ErrorBoundary.tsx implementation
3. Check SafeComponent.tsx wrapping
4. Verify main.tsx safe initialization
5. Test error boundaries manually
6. Run .\test-local.bat per full check

Last changes: [RECENT_CHANGES]
Console errors: [ERRORS]
```

### 🔥 Build Failure Recovery
```
Build è failing! Need immediate fix.

Recovery steps:
1. Check build errors in detail
2. Verify TypeScript configuration
3. Check missing dependencies
4. Verify import paths (@/* aliases)
5. Test with npm run dev first
6. Check environment variables

Build command: [COMMAND]
Error messages: [ERRORS]
```

---

## 📝 How to Use This Pool

1. **Copy-paste** template appropriato
2. **Fill placeholders** [IN_BRACKETS] 
3. **Customize** per specific needs
4. **Save variations** per future use

## 🔄 Template Maintenance

- **Add new templates** per operazioni ricorrenti
- **Update existing** quando procedure cambiano  
- **Archive obsolete** templates periodically
- **Test templates** per accuracy

---

**💡 Tip**: Salva le tue variazioni custom di questi template per operazioni ricorrenti specifiche del progetto!