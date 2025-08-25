# 🎯 Mermaid Sketcher - Project Overview

## 📋 Sommario Progetto
**Mermaid Sketcher** è un'applicazione web React per la creazione e gestione di diagrammi Mermaid con funzionalità avanzate di collaborazione, commenti e organizzazione.

## 🗂️ Struttura Progetto e Documentazione

### **📁 Directory Principali**

| Directory | Descrizione | README |
|-----------|-------------|---------|
| `src/` | Codice sorgente React/TypeScript | - |
| `supabase-fixes/` | Fix e migrazioni database (ex database-fixes/) | ✅ [README](supabase-fixes/README.md) |
| `supabase/` | Configurazioni e migrazioni Supabase standard | ✅ [README](supabase/README.md) |
| `github-sync/` | Scripts sincronizzazione GitHub | ✅ [README](github-sync/README.md) |
| `public/` | Assets statici | - |

### **📚 Documentazione Specifica**

| File | Scopo | Status |
|------|--------|--------|
| `DOCUMENTAZIONE_VERSIONE_ATTUALE.md` | Stato attuale versione | ✅ |
| `PRE_COMMIT_CHECKLIST.md` | Checklist pre-commit | ✅ |
| `LOVABLE_ERROR_FIX_PROMPT.md` | Fix errori Lovable | ✅ |
| `LOVABLE_ROUTER_FIX_PROMPT.md` | Fix routing Lovable | ✅ |
| `supabase-fixes/SQL_FIXES_LOG.md` | Log modifiche database | ✅ |
| `PHASE2_TESTING_GUIDE.md` | Guida testing Phase 2 condivisione | ✅ |

## 🚀 Funzionalità Implementate

### **✅ COMPLETATE (2025-08-23)**

#### **🎯 Sistema Navigazione e UI (2025-08-22)**
- **Component Selection** - Selezione componenti nei diagrammi Mermaid
- **Fit 100% Button** - Pulsante per adattare diagramma alla viewport
- **Drag & Drop Sidebar** - Sistema drag & drop per organizzare viste
- **QuickNavigationBar Resizable** - Barra navigazione ridimensionabile dai corner
- **Smart Zoom Centering** - Zoom centrato su componenti selezionati
- **Zoom Center Selection** - Modalità interattiva per impostare centro zoom con coordinate

#### **🎮 Controlli Avanzati e Shortcuts (2025-08-23)**
- **Node Selection Shortcuts** - Sistema configurabile combinazione tasti per selezione nodi
  - Opzioni: Left Click, Ctrl+Click, Alt+Click, Shift+Click (default: Ctrl+Click)
  - Risolve conflitto tra pan (left click) e selezione nodi
  - Configurazione persistente in localStorage
- **Customizable View Name Templates** - Template personalizzabili per nomi viste (default: "v.01")
- **Auto-Increment View Names** - Sistema automatico incremento progressivo (v.01 → v.02 → v.03)
- **Intelligent Number Detection** - Rileva automaticamente il numero più alto esistente per continuare la numerazione

#### **📱 Floating Navigation Bar - Sistema Completo (2025-08-23)**
- **Multi-Tab Interface** - 4 tab: Viste, Diagrammi, Condivisione, Shortcuts  
- **Dynamic Tab Auto-Switch** - Switch automatico al tab "Viste" dopo salvataggio vista
- **Drag & Resize** - Completamente trascinabile e ridimensionabile
- **Position Memory** - Salva posizione e dimensioni in localStorage
- **Defensive Error Handling** - Gestione robusta array undefined per diagrammi
- **Real-time Updates** - Aggiornamento in tempo reale contenuti tab

#### **📤 Sistema Condivisione Diagrammi - Phase 1 Completata (2025-08-23)**
- **4° Tab Condivisione** - Tab dedicato nella QuickNavigationBar
- **Modal Invita Collaboratore** - Form completo (email, permessi, scadenza, preview)
- **Modal Crea Link Pubblico** - Configurazioni avanzate (password, commenti, scadenza)
- **Sistema Permessi** - Matrice completa (Owner/Editor/Commenter/Viewer/Public)
- **Mock Implementation** - Workflow completo UI/UX funzionante (API mock)
- **Database Schema Ready** - Schema completo pronto per applicazione Phase 2

#### **💾 Sistema Viste e Commenti Migliorato (2025-08-23)**
- **Fixed View Naming** - Rimosso prefisso "Vista componente:", mantenuto testo nodo
- **Combined View Names** - Formato: "v.01 - Nome Componente" (template + contenuto)
- **No Auto-Zoom on Selection** - Rimozione zoom automatico 800% durante selezione
- **Coordinate Alignment Fix** - Risolto gap 16k unità tra zoom center e coordinate vista
- **Modal-Based Workflow** - Selezione nodi apre modal commento invece di salvare automaticamente

#### **⚙️ Sistema Hook e Automation (2025-08-22)**
- **Screenshot Hook System** - Sistema automatico screenshot per Claude Code
- **GitHub Sync Automation** - Scripts automatizzati sincronizzazione GitHub
- **Database Migrations** - Aumento limiti zoom e fix foreign key commenti

#### **🔄 Context Preservation System - Implementato (2025-08-23)**
- **Session Status Files** - `CURRENT_SESSION_STATUS.md` per stato real-time sessione
- **Implementation Summary** - `PHASE1_IMPLEMENTATION_SUMMARY.md` per dettagli tecnici completi
- **Design Documentation** - `SHARING_SYSTEM_DESIGN.md` per specifiche sistema
- **Interruption Recovery** - Ripristino perfetto contesto dopo chiusura accidentale VS Code
- **Hook Configuration** - `.claude/settings.local.json` con permessi e hook configurati
- **Progress Tracking** - TodoWrite system per tracking tasks attraverso sessioni

### **🔄 IN SVILUPPO (Aggiornato: 2025-08-25)**

#### **🏷️ Sistema Folder Tags - Phase 3B (In Completamento)** ✅ 95% COMPLETATO
- **✅ Database Schema**: Campo `tags` aggiunto a `saved_views` (APPLY_010)
- **✅ Folder Tag Mode**: Sistema toggle frecce ↓/↑ per modalità applicazione (APPLY_012)
  - `apply_to_views` (↓): Tag si applica a cartella + tutte le viste
  - `folder_only` (↑): Tag si applica solo alla cartella
  - Toggle mutuamente esclusivo implementato e testato
- **✅ Database Functions**: `toggle_folder_tag_mode()` e `apply_folder_tags_with_mode()` funzionanti
- **🔄 Frontend Implementation**: Toggle UI frecce + integrazione con database functions
- **⚠️ Performance Issue**: Sistema apertura/aggiornamento tab Cartelle molto lento - da ottimizzare post-funzionalità

#### **🏷️ Sistema Tags Avanzato - Phase 3A (Seconda Priorità)**
- **Filtro Tag Cumulativo** - Selezione multipla tag con filtri dinamici
  - Clic su tag applica/rimuove filtro (toggle behavior)
  - Visualizzazione tag attivi con indicator
  - Combinazione AND/OR configurabile
  - Reset rapido tutti i filtri

#### **📁 Sistema Cartelle Viste - Funzionalità Base (Completate)**
- **✅ Organizzazione Gerarchica Viste** - Sistema cartelle a 1 livello per viste
- **✅ Creazione/eliminazione cartelle** - Drag & drop funzionante
- **✅ Spostamento viste tra cartelle** - Drag & drop implementato
- **✅ Icone distintive cartelle vs viste** - UI completa
- **✅ Conteggio viste per cartella** - Display funzionante

#### **📤 Sharing System Phase 3C (Seconda Priorità)**
- **Email Notifications** - Sistema notifiche via email per inviti e attività
- **User Lookup** - Ricerca utenti per email negli inviti
- **Advanced Comments** - Sistema commenti per utenti anonimi su link pubblici
- **Folder Sharing** - Condivisione intere cartelle di viste

#### **⚙️ Sistema Automazione (Background)**
- **Hook Tracking** - Sistema automatico aggiornamento PROJECT_OVERVIEW.md  
- **Session Management** - Sistema logging sessioni sviluppo
- **Advanced Screenshot Analysis** - Miglioramenti hook screenshot per debugging più efficace

### **🧪 IN TESTING (Ready for Phase 3)**
- **Sharing System Phase 2** - Database reale + API + route pubbliche (implementazione completa)

### **🎯 FUNZIONALITÀ DESIDERATE (Roadmap Future)**

#### **📤 Condivisione Diagrammi - Phase 2 (In Sviluppo)**
- **Route Pubbliche** - Implementare `/public/:token` per accesso anonimo ai diagrammi
- **API Integration** - Sostituire mock calls con vere chiamate database Supabase
- **Email Notifications** - Sistema notifiche via email per inviti e attività
- **Icone Distintive nell'Elenco Diagrammi:**
  - 🏠 **Diagrammi Personali** - I tuoi diagrammi privati
  - 📤 **Condivisi da Te** - Diagrammi che hai condiviso con altri (icona share blu)
  - 📥 **Condivisi con Te** - Diagrammi di altri condivisi con te (icona share verde)
  - 👑 **Proprietario** - Balloon tooltip mostrando il nome del proprietario originale
- **Link di Condivisione** - URL pubblici per accesso diretto ai diagrammi
- **Cronologia Condivisioni** - Log delle condivisioni effettuate e ricevute

#### **🤝 Collaborazione Avanzata**
- **Editing Collaborativo** - Modifica simultanea da più utenti
- **Sistema Notifiche** - Alert per modifiche e commenti sui diagrammi condivisi
- **Versioning Avanzato** - Storico modifiche con possibilità di ripristino
- **Chat Integrata** - Comunicazione real-time sui diagrammi condivisi

#### **🔧 Note Implementative Future**

**Database Schema per Condivisione:**
```sql
-- Tabella condivisioni
CREATE TABLE diagram_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID REFERENCES diagrams(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level TEXT CHECK (permission_level IN ('read', 'comment', 'edit')),
  share_token UUID DEFAULT gen_random_uuid(), -- Per link pubblici
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- Opzionale
);

-- Link pubblici
CREATE TABLE public_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagram_id UUID REFERENCES diagrams(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Icone e UI Components:**
```typescript
// Componente per icone stato condivisione
interface DiagramShareStatus {
  type: 'personal' | 'shared_by_me' | 'shared_with_me';
  owner_name?: string;
  permission_level?: 'read' | 'comment' | 'edit';
  is_public?: boolean;
}

// Badge condivisione
<Badge variant={shareStatus.type === 'personal' ? 'default' : 'secondary'}>
  {shareStatus.type === 'personal' && '🏠 Personale'}
  {shareStatus.type === 'shared_by_me' && '📤 Condiviso'}
  {shareStatus.type === 'shared_with_me' && '📥 Ricevuto'}
</Badge>

// Tooltip proprietario
<TooltipContent>
  <div className="text-xs">
    <div className="font-medium">👑 Proprietario</div>
    <div>{shareStatus.owner_name}</div>
    {shareStatus.permission_level && (
      <div className="mt-1 opacity-75">
        Permessi: {shareStatus.permission_level}
      </div>
    )}
  </div>
</TooltipContent>
```

## 🛠️ Stack Tecnologico

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **UI Components**: shadcn-ui
- **Backend**: Supabase (Database + Auth)
- **Build**: Vite
- **Dev Server**: Vite (localhost:8080)
- **Local Testing**: `test-local.bat`
- **Deployment**: Lovable.dev

## 🎣 Sistema Hook Attivi (Claude Code Integration)

### **📸 Screenshot Hook - Auto-Monitor SCREENSHOT**

**Status**: ✅ Attivo (funzionamento parziale)  
**Trigger**: Rilevamento nuovi file nella cartella `github-sync/SCREENSHOT/`  
**Behavior**: 
```
?? Nuovo screenshot rilevato: Clipboard Image.jpg
?? Nuovo screenshot rilevato: Clipboard Image (1).jpg
```

#### **⚙️ Configurazione Attuale**
- **Cartella Monitorata**: `C:\CLAUDEcode2025\mermaid-sketcher-451\github-sync\SCREENSHOT\`
- **Pattern Detection**: Files `.jpg`, `.png` con pattern "Clipboard Image"
- **Auto-Exclude**: Cartella esclusa da Git (`.gitignore`)
- **Activation**: Automatico all'inizio di ogni sessione Claude Code

#### **🔍 Funzionalità**
- ✅ **Detection Automatico** - Rileva automaticamente nuovi screenshot
- ✅ **Session Initialization** - Si attiva con messaggio "Auto-monitor SCREENSHOT attivo per questa sessione"
- 🔄 **Analysis Trigger** - Dovrebbe permettere analisi automatica degli screenshot (non sempre funziona)
- ❌ **Consistent Processing** - Funzionamento intermittente per l'analisi del contenuto

#### **💡 Utilizzo Ottimale**
```bash
# 1. Salva screenshot nella cartella
# 2. Il sistema rileva automaticamente
# 3. Menziona esplicitamente lo screenshot per forzare l'analisi
"Analizza l'ultimo screenshot rilevato"
"Leggi lo screenshot appena aggiunto"
```

#### **🐛 Issues Noti**
- **Inconsistent Analysis**: Non sempre analizza automaticamente il contenuto
- **Multiple Detection**: A volte rileva lo stesso screenshot più volte
- **Timing Issues**: Può rilevare screenshot vecchi all'inizio di nuove sessioni

### **📝 Future Hook Desiderati**

#### **🎯 Project Overview Hook**
**Scopo**: Auto-aggiornamento `PROJECT_OVERVIEW.md` quando vengono implementate nuove funzionalità  
**Trigger**: Commit con pattern specifici o modifiche significative  
**Status**: 🔄 In pianificazione

#### **📋 Session Tracker Hook** 
**Scopo**: Logging automatico delle sessioni di sviluppo  
**Trigger**: Inizio/fine sessione Claude Code  
**Output**: `SESSION_[DATA].md` files con sommario attività  
**Status**: 🔄 In pianificazione

#### **⚡ Error Pattern Hook**
**Scopo**: Rilevamento automatico errori ricorrenti e suggeste soluzioni  
**Trigger**: Pattern di errore nei logs o console  
**Status**: 💡 Idea futura

### **🔧 Hook Development Guidelines**

**Per creare nuovi hook:**
1. **Identificare trigger event** specifico e misurabile
2. **Definire output format** strutturato e utile
3. **Testare reliability** in diverse condizioni
4. **Documentare behavior** e troubleshooting
5. **Integrare con workflow** esistente

**Pattern struttura hook:**
```markdown
### **Hook Name**
**Status**: [✅ Attivo | 🔄 In sviluppo | ❌ Disattivato | 💡 Pianificato]
**Trigger**: [Condizione di attivazione]
**Output**: [Formato output o azione]
**Issues**: [Problemi noti]
**Usage**: [Come utilizzarlo]
```

## 📋 Best Practices per Mantenere il Contesto

### **🎯 1. DOCUMENTAZIONE SESSIONI**

**Prima di Iniziare una Sessione:**
```markdown
## Sessione [DATA]
**Obiettivo**: [Descrizione obiettivo]
**Stato Iniziale**: [Cosa funziona/non funziona]
**Modifiche Previste**: [Lista modifiche]
```

**Fine Sessione:**
```markdown
**Completato**: [Lista completata]
**Issues Risolti**: [Problemi risolti]
**Prossimi Steps**: [Cosa fare dopo]
**Note**: [Osservazioni importanti]
```

### **🎯 2. COMMIT MESSAGES STRUTTURATI**

```bash
# Template commit message
[TIPO]: [Breve descrizione]

- Dettaglio 1
- Dettaglio 2  
- Fix: problema specifico risolto

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Tipi Standard:**
- `feat:` Nuova funzionalità
- `fix:` Bug fix
- `docs:` Solo documentazione
- `refactor:` Refactoring codice
- `test:` Aggiunta/modifica test

### **🎯 3. SISTEMA SCREENSHOT**

**Configurazione Attiva:**
- Cartella: `github-sync/SCREENSHOT/`
- Hook automatico Claude Code
- Escluso da Git (.gitignore)

**Uso:**
```
1. Salva screenshot in cartella
2. Hook rileva automaticamente  
3. Scrivi "leggi ultimo screenshot"
4. Analisi automatica del problema
```

### **🎯 4. WORKFLOW SINCRONIZZAZIONE**

**Branch Structure:**
- `master` - Sviluppo attivo (commit locali)
- `main` - Branch principale GitHub

**Workflow Completo Locale → Supabase → GitHub → Lovable:**

```bash
# 1. SVILUPPO LOCALE
# Avvio: Doppio click test-local.bat
# Server: http://localhost:8080
# Pre-commit: Segui PRE_COMMIT_CHECKLIST.md

# 2. DATABASE FIXES (se necessario)
# Processo: PROBLEMA → APPLY_XXX_PENDING.sql → Test Supabase SQL Editor
# Success: Rinomina APPLY_XXX_APPLICATO.sql + aggiorna SQL_FIXES_LOG.md
# Fallito: Rinomina APPLY_XXX_FALLITO.sql + debug
# Location: database-fixes/ directory

# 3. COMMIT LOCALE
git add .
git commit -m "feat: [descrizione]

- Modifica specifica 1
- Fix: SQL APPLY_XXX applicato (se applicabile)
- Test: funzionalità verificata"

# 4. PUSH GITHUB
git push origin master
# Auth issues: usa token da grashof1975

# 5. SINCRONIZZAZIONE LOVABLE  
# Auto: Lovable rileva push su branch master
# Manual: Lovable Settings → Branch: master
# Verifica: Nuove funzionalità visibili in Lovable

# 6. DOCUMENTAZIONE
# Update: SESSION_XXX.md, PROJECT_OVERVIEW.md
# Hook: .claude/hooks/update-project-overview.bat (automatico)
```

### **🎯 5. DATABASE WORKFLOW SUPABASE**

**Processo SQL Fixes Sistematico:**

| Step | Azione | File/Location | Status |
|------|--------|---------------|---------|
| 1 | **Identifica Problema** | Console logs, Network tab | 🐛 |
| 2 | **Crea SQL Fix** | `database-fixes/APPLY_XXX_PENDING.sql` | 📝 |
| 3 | **Test Supabase** | SQL Editor Dashboard | 🧪 |
| 4a | **Se Success** | Rinomina `APPLY_XXX_APPLICATO.sql` | ✅ |
| 4b | **Se Error** | Rinomina `APPLY_XXX_FALLITO.sql` | ❌ |
| 5 | **Aggiorna Log** | `database-fixes/SQL_FIXES_LOG.md` | 📋 |
| 6 | **Test Frontend** | localhost:5173, Lovable | 🔍 |

**Schema Database Supabase:**
```sql
-- Tabelle Principali
diagrams (id, user_id, title, mermaid_code, tags, ...)
saved_views (id, name, zoom, pan, timestamp, ...)  
comments (id, user_id, linked_view_id, content, ...)
profiles (id → auth.users.id, username, avatar_url, ...)

-- Foreign Keys  
comments.user_id → auth.users.id (ON DELETE CASCADE)
comments.linked_view_id → saved_views.id (ON DELETE CASCADE)
profiles.id → auth.users.id (ON DELETE CASCADE)
```

**RLS Policies Pattern:**
```sql
CREATE POLICY "Users manage own [resource]" 
ON public.[table] FOR ALL 
USING (auth.uid() = user_id);
```

**Database Fixes Applicati:**
```bash
# Fix completati e in produzione
✅ APPLY_001 - Zoom limit aumentato a 20.0x (2025-08-22)
✅ APPLY_002 - Comments FK + profiles setup (2025-08-22) 
✅ APPLY_003 - RLS policies per commenti (2025-08-22)
```

**Documentazione Database:**
- `database-fixes/SQL_FIXES_LOG.md` - Log completo con storico fix
- `database-fixes/README.md` - Workflow sistematico per nuovi fix
- Per nuove modifiche DB: seguire sempre workflow in `database-fixes/README.md`

### **🎯 6. DEBUGGING WORKFLOW**

**Issues Comuni e Soluzioni:**

| Problema | Soluzione Rapida | Documentazione |
|----------|------------------|----------------|
| Autenticazione GitHub 403 | Nuovo token da account grashof1975 | [GitHub Sync README](github-sync/README.md) |
| Lovable non aggiornato | Switch branch in Lovable settings | [GitHub Sync README](github-sync/README.md) |
| Database API errors | Check `database-fixes/` per SQL fix | [Database README](database-fixes/README.md) |
| Frontend crashes | Segui `PRE_COMMIT_CHECKLIST.md` | [Pre-commit Checklist](PRE_COMMIT_CHECKLIST.md) |
| SQL fix fallisce | Debug con Supabase SQL Editor logs | [SQL Fixes Log](database-fixes/SQL_FIXES_LOG.md) |

### **🎯 6. CHECKLIST PRE-COMMIT**

Usa sempre: `PRE_COMMIT_CHECKLIST.md`

- [ ] Test locali passano
- [ ] No console.error attivi
- [ ] Screenshot hook funziona
- [ ] Database migrations applicate
- [ ] Documentazione aggiornata

## 🔄 Workflow Maintenance

### **🗓️ DAILY**
- Sync con GitHub: `git push origin master`
- Verifica Lovable branch alignment
- Update README se nuove funzionalità

### **🗓️ WEEKLY**  
- Review `PROJECT_OVERVIEW.md` 
- Clean screenshot folder
- Update versioning documentation

### **🗓️ MONTHLY**
- Backup completo progetto
- Review e cleanup documentazione
- Security audit token GitHub

## 🤖 Claude Code Subagents Sperimentali

### **📁 Struttura Subagents**
```
_test_subagent/           # Sperimentazione subagent Claude Code
└── sub_agent.md         # Definizione subagent "api-planner"
```

### **🎯 Subagent Attivo: `api-planner`**

**Nome**: `api-planner`  
**Modello**: Sonnet  
**Colore**: Verde  
**Specializzazione**: API Documentation Specialist and Implementation Strategist

#### **🚀 Attivazione Automatica**
Il subagent si attiva quando l'utente menziona:
- Lavori con API
- Integrazione API  
- Documentazione API
- Servizi API specifici

#### **⚙️ Processo Operativo**
1. **Analisi Obiettivi** - Identifica API specifiche e requisiti di integrazione
2. **Fetch Documentazione** - Usa Contact7 MCP tool per ottenere docs aggiornate
3. **Review Comprehensive** - Analizza endpoint, autenticazione, formati dati
4. **Piano Implementazione** - Crea strategie dettagliate step-by-step
5. **Delivery Actionable** - Fornisce risultati immediatamente implementabili

#### **📋 Capabilities**
- ✅ **Analisi API Requirements** - Identifica scope e complessità
- ✅ **Documentation Fetching** - Recupera docs più aggiornate
- ✅ **Authentication Strategy** - Setup sicurezza e best practices  
- ✅ **Error Handling** - Strategie retry e gestione errori
- ✅ **Code Structure** - Raccomandazioni allineate con standards progetto
- ✅ **Performance Optimization** - Considerazioni di ottimizzazione

### **💡 Esempi di Utilizzo**
```
User: "I need to integrate the Stripe payment API"
→ Subagent attivato automaticamente
→ Fetch Stripe API documentation
→ Create implementation plan for checkout flow
```

### **🔬 Scopo Sperimentale**
La cartella `_test_subagent/` serve per **sperimentare definizioni di subagent** specializzati che si attivano automaticamente in base al contesto dell'utente, migliorando l'esperienza di sviluppo con expertise domain-specific.

## 📞 Contact Info

**Repository**: https://github.com/grashof1975/mermaid-sketcher-451
**Lovable Project**: https://lovable.dev/projects/e751f4c0-8ecf-4b68-92d9-99805a66e66e

---

*Documento creato: 2025-08-22*  
*Ultimo aggiornamento: 2025-08-23 (Sistema Hook + Funzionalità Complete)*  
*Next review: 2025-09-22*