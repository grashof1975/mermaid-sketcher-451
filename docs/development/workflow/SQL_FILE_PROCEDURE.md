# 📋 Procedura Standard per File SQL

Procedura obbligatoria per gestione file SQL e nomenclatura.

## 🏗️ **Workflow Standard**

### **STEP 1: Creazione File**
```
Nome: APPLY_XXX_DESCRIPTION_PENDING.sql
Status: PENDING (nel header)
```

### **STEP 2: Testing & Debug** 
```
- Esegui il file in Supabase Query Editor
- Verifica output con numeri di riferimento (APPLY_XXX:)
- Debugga eventuali errori
- Ripeti fino a successo completo
```

### **STEP 3: Conversione APPLICATO** ⚠️ **OBBLIGATORIO**
```
1. Copia il file PENDING
2. Rinomina: APPLY_XXX_DESCRIPTION_APPLICATO.sql  
3. Aggiorna Status: APPLICATO (nel header)
4. Rimuovi il file PENDING originale
```

### **STEP 4: Documentazione**
```
- Aggiorna SQL_FIXES_LOG.md
- Segna come completato nei todo
- Aggiorna documentazione pertinente
```

## 📊 **Standard Output SQL**

### **❌ SBAGLIATO:**
```sql
SELECT 'VERIFICATION: Teams created' as status, COUNT(*) FROM teams;
```

### **✅ CORRETTO:**  
```sql
SELECT 'APPLY_041: Teams created' as status, COUNT(*) FROM teams;
```

**Regola:** Sempre prefisso `APPLY_XXX:` negli output per identificazione.

## 🚫 **Errori da Evitare**

### **❌ NON FARE MAI:**
1. Lasciare file PENDING dopo test riuscito
2. Output senza numero di riferimento  
3. Applicare SQL senza backup preliminare
4. Saltare verification queries

### **✅ SEMPRE FARE:**
1. Backup database prima di APPLY importanti
2. Verificare tutte le query prima di esecuzione
3. Convertire PENDING → APPLICATO immediatamente
4. Testare su small dataset prima di migrazione completa

## 🔄 **Conversione File Esistenti**

Per file già esistenti PENDING che sono stati testati:

```bash
# Template per conversione batch
cd supabase-fixes/
cp APPLY_XXX_NAME_PENDING.sql APPLY_XXX_NAME_APPLICATO.sql
# Edit header: Status: PENDING → APPLICATO  
rm APPLY_XXX_NAME_PENDING.sql
```

## 📈 **Tracking Status**

### **File Status Headers:**
```sql
-- APPLY XXX: Description
-- Status: PENDING | APPLICATO | DEPRECATED
-- Purpose: What this file does
-- Dependencies: Other APPLY files needed first
```

### **SQL_FIXES_LOG.md Entry:**
```markdown  
## APPLY_XXX - APPLICATO ✅
- **Purpose:** Description
- **Date Applied:** YYYY-MM-DD  
- **Status:** Success
- **Notes:** Any important notes
```

---

**⚠️ REGOLA AUREA:** Nessun file può rimanere PENDING dopo test riuscito!  
**🎯 OBIETTIVO:** Tracciabilità completa di tutte le modifiche database