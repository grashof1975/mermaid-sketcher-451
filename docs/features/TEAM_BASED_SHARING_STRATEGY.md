# 🏢 TEAM-BASED SHARING STRATEGY

## 📋 Overview

Migrazione da sistema di condivisione basato su "doppioni di diagrammi" a sistema team-based per vera collaborazione real-time.

## 🎯 Obiettivi

### ✅ Vantaggi Strategia Team-Based
- **Real-time Collaboration:** Modifiche sincronizzate in tempo reale
- **Single Source of Truth:** Un diagramma, una versione per tutti
- **Scalabilità:** Supporto per team aziendali e organizzazioni  
- **Team Management:** Gestione centralizzata di gruppi di utenti
- **Permission Granularity:** Controlli di accesso a livello team e diagramma

### ❌ Problemi Strategia Attuale (Doppione)
- Modifiche non sincronizzate tra utenti
- Confusione su quale sia la "versione vera"
- Non scalabile per team grandi
- Duplicazione dei dati

## 🏗️ Architettura Database

### 📊 **Schema Proposto**

```sql
-- Teams: Gruppi di collaborazione
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Team Members: Appartenenza e ruoli
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'editor', 'viewer')) DEFAULT 'viewer',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) DEFAULT 'pending',
  UNIQUE(team_id, user_id)
);

-- Diagrams: Collegati a team invece che a singoli utenti
ALTER TABLE diagrams ADD COLUMN team_id UUID REFERENCES teams(id);
ALTER TABLE diagrams ADD COLUMN visibility TEXT CHECK (visibility IN ('private', 'team', 'public')) DEFAULT 'private';

-- Saved Views: Anche le viste possono essere condivise a livello team
ALTER TABLE saved_views ADD COLUMN team_id UUID REFERENCES teams(id);
ALTER TABLE saved_views ADD COLUMN visibility TEXT CHECK (visibility IN ('private', 'team', 'public')) DEFAULT 'private';
```

### 🔄 **Migrazione Dati Esistenti**

```sql
-- Step 1: Creare team "personali" per tutti gli utenti esistenti
INSERT INTO teams (name, description, created_by)
SELECT 
  CONCAT(email, ' Personal Team') as name,
  'Personal workspace' as description,
  id as created_by
FROM auth.users;

-- Step 2: Associare utenti ai loro team personali
INSERT INTO team_members (team_id, user_id, role, status)
SELECT 
  t.id as team_id,
  u.id as user_id, 
  'owner' as role,
  'active' as status
FROM auth.users u
JOIN teams t ON t.created_by = u.id;

-- Step 3: Migrare diagrammi esistenti ai team personali
UPDATE diagrams SET 
  team_id = t.id,
  visibility = 'private'
FROM teams t 
WHERE diagrams.user_id = t.created_by;

-- Step 4: Convertire condivisioni esistenti in team condivisi
-- (Logica più complessa - da definire caso per caso)
```

## 🚀 Funzionalità Principali

### 1. **Team Creation & Management**
- Creazione team da interfaccia utente
- Invito membri tramite email
- Gestione ruoli (Owner, Admin, Editor, Viewer)
- Impostazioni team (nome, descrizione, privacy)

### 2. **Diagram Team Ownership**
- Diagrammi appartengono a team, non a singoli utenti
- Visibilità: Private (solo creatore), Team (tutti i membri), Public
- Editing collaborativo con conflict resolution

### 3. **Permission System**
```
TEAM ROLES:
- Owner: Gestione completa team + diagrammi
- Admin: Invita/rimuove membri, gestisce diagrammi
- Editor: Crea/modifica diagrammi del team
- Viewer: Solo visualizzazione

DIAGRAM PERMISSIONS:
- Private: Solo creatore
- Team: Tutti i membri del team (in base al ruolo)
- Public: Chiunque (read-only)
```

### 4. **Real-time Collaboration**
- Sincronizzazione automatica delle modifiche
- Cursori multipli e indicatori presenza
- Conflict resolution automatico
- History/versioning per rollback

## 📱 Interfaccia Utente

### 🎨 **Team Sidebar**
```
📁 My Teams
├── 🏠 Personal Team
├── 💼 Company Team
│   ├── 📊 Project Alpha
│   ├── 📈 Marketing Flows  
│   └── 🔧 System Architecture
└── 🎓 University Group
    ├── 📚 Thesis Diagrams
    └── 🧪 Lab Results
```

### 🔄 **Workflow Utente**
1. **Utente crea/entra in team**
2. **Seleziona team attivo** dalla sidebar
3. **Crea diagrammi nel contesto team**
4. **Collabora real-time** con altri membri
5. **Gestisce permessi** diagrammi specifici

## 🔧 Implementazione Graduale

### **FASE 1: Foundation** 
- [ ] Creare tabelle `teams` e `team_members`
- [ ] Aggiungere `team_id` a `diagrams` e `saved_views` 
- [ ] Migrare dati esistenti
- [ ] API base per team management

### **FASE 2: UI Integration**
- [ ] Team sidebar component
- [ ] Team creation/join modals
- [ ] Permission management UI
- [ ] Team settings panel

### **FASE 3: Real-time Collaboration** 
- [ ] WebSocket integration per sync
- [ ] Conflict resolution logic
- [ ] Multi-cursor support
- [ ] Live presence indicators

### **FASE 4: Advanced Features**
- [ ] Team templates e workflow
- [ ] Advanced analytics e reporting
- [ ] Integration con sistemi esterni
- [ ] Enterprise features (SSO, audit logs)

## 🧪 Testing Strategy

### **Unit Tests**
- Team creation/management logic
- Permission validation
- Data migration scripts
- API endpoints

### **Integration Tests**  
- Team workflow end-to-end
- Real-time synchronization
- Permission enforcement
- Migration data integrity

### **User Testing**
- Team creation workflow
- Collaboration experience
- Performance con team grandi
- Mobile experience

## 📈 Benefits

### **Per gli Utenti**
- Esperienza collaborazione naturale
- Gestione centralizzata progetti
- Real-time editing senza conflitti
- Controllo granulare accessi

### **Per l'Organizzazione**
- Scalabilità enterprise-ready
- Compliance e security
- Analytics utilizzo team
- Integration ecosystem

---

**Status:** 📋 Planning Phase  
**Priority:** 🔥 High  
**Estimated Timeline:** 8-12 weeks  
**Dependencies:** Database migration, WebSocket infrastructure