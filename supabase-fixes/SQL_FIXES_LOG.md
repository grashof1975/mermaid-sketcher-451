# Database Fixes & SQL Commands Log

**Ultimo aggiornamento**: 29/08/2025  
**Progetto**: Mermaid Sketcher - Sistema condivisione completo

Questo documento contiene un log cronologico completo di tutti i fix SQL applicati al database.

---

## 📊 **RIEPILOGO STATUS CORRENTE**

### **✅ FIXES APPLICATI CON SUCCESSO (12 totali)**
| File | Descrizione | Data | Status |
|------|-------------|------|---------|
| APPLY_001 | Zoom Limit aumentato a 20x | 22/08/2025 | ✅ APPLICATO |
| APPLY_002 | Comments FK + profiles setup | 22/08/2025 | ✅ APPLICATO |
| APPLY_003 | RLS policies per commenti | 22/08/2025 | ✅ APPLICATO |
| APPLY_004 | Sharing System base | 23/08/2025 | ✅ APPLICATO |
| APPLY_005B | Base64URL encoding fix | 23/08/2025 | ✅ APPLICATO |
| APPLY_006 | Public access RLS policies | 23/08/2025 | ✅ APPLICATO |
| APPLY_028B | User search function fixed | 28/08/2025 | ✅ APPLICATO |
| APPLY_030 | Sharing RLS policies complete | 28/08/2025 | ✅ APPLICATO |
| APPLY_031 | Sharing flow complete test | 28/08/2025 | ✅ APPLICATO |
| APPLY_034 | Pending invitations RPC | 29/08/2025 | ✅ APPLICATO |
| APPLY_035 | Fix RPC data types | 29/08/2025 | ✅ APPLICATO |
| APPLY_036 | Final RPC types fix | 29/08/2025 | ✅ APPLICATO |

### **🔄 IN SVILUPPO**
| File | Descrizione | Status |
|------|-------------|---------|
| APPLY_037 | Shared views schema | 🔄 PENDING |

---

## 🎯 **FASE 1: SETUP BASE (22-23/08/2025)**

### **APPLY_001 - Zoom Limit Enhancement** ✅
**Data**: 22/08/2025  
**Problema**: Zoom limitato a valori bassi, utenti non possono fare zoom dettagliato
**Soluzione**: Aumentato limite zoom da default a 20.0x (2000%)

```sql
ALTER TABLE saved_views DROP CONSTRAINT IF EXISTS saved_views_zoom_level_check;
ALTER TABLE provisional_views DROP CONSTRAINT IF EXISTS provisional_views_zoom_level_check;
ALTER TABLE saved_views ADD CONSTRAINT saved_views_zoom_level_check CHECK (zoom_level >= 0.1 AND zoom_level <= 20.0);
ALTER TABLE provisional_views ADD CONSTRAINT provisional_views_zoom_level_check CHECK (zoom_level >= 0.1 AND zoom_level <= 20.0);
```

### **APPLY_002 - Comments System Fix** ✅
**Data**: 22/08/2025  
**Problema**: Foreign key errors per sistema commenti
**Soluzione**: Setup completo profiles table + foreign keys corretti

### **APPLY_003 - RLS Policies Base** ✅
**Data**: 22/08/2025  
**Problema**: Row Level Security mancante per commenti
**Soluzione**: Politiche RLS complete per sicurezza accessi

---

## 🎯 **FASE 2: SISTEMA CONDIVISIONE BASE (23/08/2025)**

### **APPLY_004 - Sharing System Foundation** ✅
**Data**: 23/08/2025  
**Problema**: Sistema condivisione diagrammi non funzionante
**Soluzione**: Schema completo diagram_shares + public_share_links

### **APPLY_005B - URL-Safe Tokens** ✅
**Data**: 23/08/2025  
**Problema**: Token sharing con caratteri non URL-safe
**Soluzione**: Base64URL encoding per token pubblici

### **APPLY_006 - Public Access Security** ✅
**Data**: 23/08/2025  
**Problema**: Accesso pubblico bloccato da RLS
**Soluzione**: Politiche RLS per accesso anonimo ai link pubblici

---

## 🎯 **FASE 3: SISTEMA INVITI E NOTIFICHE (28-29/08/2025)**

### **APPLY_028B - User Search Function** ✅
**Data**: 28/08/2025  
**Problema**: Ricerca utenti per email falliva in InviteUserModal
**Soluzione**: RPC function `find_user_by_email_for_sharing()` corretta

```sql
CREATE OR REPLACE FUNCTION find_user_by_email_for_sharing(p_email TEXT)
RETURNS TABLE (user_id UUID, email TEXT, username TEXT)
-- Implementazione sicura con auth.users
```

### **APPLY_030 - Complete RLS Policies** ✅
**Data**: 28/08/2025  
**Problema**: Politiche RLS incomplete per diagram_shares
**Soluzione**: Policies complete per tutti gli scenari condivisione

### **APPLY_031 - End-to-End Testing** ✅
**Data**: 28/08/2025  
**Problema**: Workflow condivisione non testato end-to-end
**Soluzione**: Test completo con utente grashof@gmail.com

---

## 🎯 **FASE 4: NOTIFICATION SYSTEM DEBUG (29/08/2025)**

### **APPLY_034 - Pending Invitations RPC** ✅
**Data**: 29/08/2025  
**Problema**: Modal inviti crashava con "auth.users not accessible"
**Soluzione**: RPC function sicura `get_pending_invitations_with_details()`

### **APPLY_035 - Data Types Mismatch** ✅
**Data**: 29/08/2025  
**Problema**: Type error "character varying vs text" nella RPC
**Soluzione**: Fix tipi VARCHAR(255) per diagram titles

### **APPLY_036 - Final Types Resolution** ✅
**Data**: 29/08/2025  
**Problema**: Errori tipo persistenti in auth.users.email
**Soluzione**: Tutti i tipi corretti usando schema reference

```sql
CREATE OR REPLACE FUNCTION get_pending_invitations_with_details(p_user_id UUID)
RETURNS TABLE (
  -- Tipi corretti basati su schema reference reale
  diagram_title VARCHAR,    -- Non TEXT
  owner_email VARCHAR,      -- Non TEXT  
  -- ... altri campi
)
```

---

## 🔧 **DEBUGGING METHODOLOGY EVOLUTION**

### **PROBLEMA STORICO (Pre-28/08/2025)**
❌ **SQL generati "al buio"** senza schema reference
❌ **Assunzioni errate** su strutture tabelle  
❌ **Fix falliti** per mismatch tipi dati
❌ **Frustrazione** e perdita tempo

### **SVOLTA: Schema Reference System (28/08/2025)**
✅ **Database snapshot** completo estratto  
✅ **Schema reference** consultabile in `schema-reference/20250829_sql.txt`
✅ **Types verification** tramite screenshots Supabase Dashboard
✅ **Successful fixes** basati su dati reali

### **REGOLA AUREA ATTUALE**
> **MAI PIÙ SQL SENZA SCHEMA REFERENCE**  
> Ogni fix deve consultare `schema-reference/` prima della generazione

---

## 🚀 **RISULTATI CONSEGUITI**

### **✅ SISTEMA CONDIVISIONE 100% FUNZIONALE**
1. **Invio Inviti** - InviteUserModal con ricerca RPC reale
2. **Notifiche Badge** - Header con conteggio inviti pendenti auto-refresh
3. **Gestione Inviti** - PendingInvitationsModal accetta/rifiuta funzionante
4. **Lista Diagrammi** - Owned + shared con indicatori visivi
5. **Database Security** - RLS policies complete e testate
6. **Error Handling** - Robusto per tutti gli edge cases

### **📊 TESTING CONFERMATO**
- ✅ **User grashof@gmail.com** - 2 inviti inviati, accettati, visibili
- ✅ **Badge funzionante** - Conteggio corretto e click modal
- ✅ **Database integrity** - Tutti i dati persistenti e corretti
- ✅ **RPC performance** - Query ottimizzate e veloci

---

## 🎯 **PROSSIMI SVILUPPI**

### **APPLY_037 - Shared Views System (In Preparazione)**
**Obiettivo**: Estendere condivisione a viste salvate e cartelle
**Componenti**:
- Database schema per `view_shares`, `folder_shares`
- SharedFolderSidebar component
- Sistema separato per contenuti condivisi

### **ARCHITETTURA FUTURA**
- **Separation of Concerns**: Owned vs Shared content
- **Hierarchical Permissions**: Viewer/Editor/Admin per cartelle
- **Advanced UI**: Colonne proprietario, badge utenti condivisi
- **Scalability**: Preparato per migliaia di contenuti condivisi

---

## 📝 **NOTE PER SVILUPPATORI FUTURI**

### **Come Aggiungere Nuovi Fix**
1. **Consulta sempre** `schema-reference/20250829_sql.txt`
2. **Verifica tipi** con screenshot Supabase se necessario
3. **Testa in SQL Editor** prima di applicare
4. **Documenta risultati** in questo log
5. **Aggiorna README** con status corrente

### **Best Practices Consolidate**
- ✅ **Schema-driven development** - Mai assumere strutture
- ✅ **Incremental testing** - Un fix per volta
- ✅ **Defensive SQL** - Sempre IF EXISTS, error handling
- ✅ **Security first** - RLS policies prima di funzionalità
- ✅ **Documentation** - Ogni change documentato
- ✅ **Output references** - SEMPRE includere numero SQL negli output (es: "037 Success")

---

**🎯 STATUS**: Sistema condivisione production-ready, pronto per estensioni avanzate