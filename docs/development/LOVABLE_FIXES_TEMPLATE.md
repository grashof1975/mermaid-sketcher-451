# 🔧 Lovable Fixes Template - Pattern di Errori Ricorrenti

**📊 Analisi dei Fix Automatici di Lovable (Branch 20250831a_ → 20250831b_)**

## 🎯 **Pattern di Errori Identificati**

### **1. Dependencies Versions (package.json)**
```json
// ❌ Versioni che causano errori in Lovable:
"lucide-react": "^0.462.0",  // Troppo vecchia
"mermaid": "^11.4.1",        // Versione con bug
"vite": "^5.4.1"             // Incompatibilità

// ✅ Versioni corrette per Lovable:
"lucide-react": "^0.542.0",  // Versione stabile
"mermaid": "^11.10.1",       // Versione corretta
"vite": "^7.1.3"             // Versione compatibile
```

### **2. Database Types Missing (src/types/database.ts)**
```typescript
// ❌ Tipi mancanti che causano errori:
// - Json type definition
// - Tags fields in saved_views
// - Parent folder fields  
// - Mother view fields
// - Public sharing tables

// ✅ Tipi sempre necessari:
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Campi obbligatori per saved_views:
tags: string[]
parent_folder_id: string | null  
is_mother_view: boolean

// Tabelle sharing sempre necessarie:
public_share_links: { /* full definition */ }
sharing_activities: { /* full definition */ }
```

### **3. Sharing Components Field Mismatches**
```typescript
// ❌ Campo sbagliato:
created_by: user.id

// ✅ Campo corretto:
shared_by: user.id  // Sempre usare shared_by per condivisioni

// ❌ Campo mancante in invites:
const shareData = await db.diagramShares.invite({
  diagram_id: diagramId,
  // shared_by: MANCANTE!
});

// ✅ Campo obbligatorio:
const shareData = await db.diagramShares.invite({
  diagram_id: diagramId,
  shared_by: user.id,  // SEMPRE richiesto
});
```

### **4. Auth Provider Error Handling**
```typescript
// ❌ Gestione session senza try-catch:
supabase.auth.getSession().then(({ data: { session } }) => {
  setSession(session);
});

// ✅ Gestione errori completa:
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.warn('Auth session error:', error);
    setSession(null);
    setUser(null);
  } else {
    setSession(session);
    setUser(session?.user ?? null);
  }
}).catch((error) => {
  console.error('Failed to get session:', error);
  setSession(null);
  setUser(null);
});
```

### **5. Mermaid Configuration Issues**
```typescript
// ❌ Import non utilizzato:
import { something } from 'mermaid'  // Se non usato

// ✅ Solo import necessari, configurazione sicura:
// Rimuovere import inutili
// Configurazione con maxEdges, htmlLabels: false
```

## 🚀 **Template Pre-Commit Checklist**

### **A. Dependencies Check:**
```bash
# Controlla sempre queste versioni prima del commit:
- lucide-react: >= 0.542.0
- mermaid: >= 11.10.0  
- vite: >= 7.1.0
```

### **B. Database Types Check:**
```typescript
// Verifica presenza di:
✅ Json type definition
✅ saved_views.tags: string[]
✅ saved_views.parent_folder_id: string | null
✅ saved_views.is_mother_view: boolean
✅ public_share_links table definition
✅ sharing_activities table definition
```

### **C. Sharing Components Check:**
```typescript
// In tutti i componenti di condivisione:
✅ Usa shared_by invece di created_by
✅ Aggiungi shared_by: user.id in tutte le operazioni di invite
✅ Controlla che tutti i campi required siano presenti
```

### **D. Auth Provider Check:**
```typescript
// Verifica error handling:
✅ Try-catch su getSession()
✅ Error handling su onAuthStateChange
✅ Cleanup su session invalide
```

## ⚡ **Script di Pre-Validazione**

```bash
# Crea script: docs/development/tools/pre-commit-lovable-check.bat
# Che controlli automaticamente questi pattern prima del commit
```

## 📋 **Workflow Futuro**

### **Prima di ogni nuovo branch:**
1. **Esegui**: `.\docs\development\tools\pre-commit-lovable-check.bat`
2. **Applica correzioni preventive** basate su questo template
3. **Verifica dependencies** con versioni corrette
4. **Testa localmente** before commit

### **Pattern da ricordare:**
- ✅ **shared_by** non created_by
- ✅ **Gestione errori** in Auth
- ✅ **Campi database** completi
- ✅ **Versioni dependencies** aggiornate
- ✅ **Import cleanup** 

---

**📅 Creato**: 2025-08-31  
**🔄 Ultimo aggiornamento**: Analisi differenze 20250831a_ vs 20250831b_  
**🎯 Scopo**: Prevenire errori Lovable ricorrenti nei futuri branch