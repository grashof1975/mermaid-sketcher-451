# Supabase Configuration & Migrations

## 🎯 **Coordinazione con supabase-fixes/**

**Questo folder coordina con `supabase-fixes/` per gestione database:**

- **`supabase/`** - Standard Supabase CLI migrations per production
- **`supabase-fixes/`** - Custom workflow per development e testing rapido

## 📁 **Struttura Files**

```
supabase/
├── config.toml           # Progetto ID: cfbaomnccefkpqnfjjiv
└── migrations/
    ├── 20250821165318_*.sql  # Initial schema + RLS policies
    ├── 20250822_fix_comments_foreign_key.sql  # = APPLY_002
    └── 20250822_increase_zoom_limit.sql       # = APPLY_001
```

## 🔄 **Workflow Coordinato**

### **Phase 1: Development (database-fixes/)**
1. **Problema** → Identifica in console/logs
2. **Fix rapido** → Crea `APPLY_XXX_PENDING.sql`  
3. **Test immediato** → Supabase SQL Editor
4. **Status update** → Rinomina APPLICATO/FALLITO

### **Phase 2: Production (supabase/)**
1. **Fix validato** → Copia da database-fixes/
2. **Migration file** → Formato timestamp standard
3. **Deploy** → `supabase db push` (quando necessario)

## 📋 **Mapping Fixes**

| supabase-fixes/ | supabase/migrations/ | Status | Descrizione |
|-----------------|---------------------|---------|-------------|
| APPLY_001_APPLICATO | 20250822_increase_zoom_limit.sql | ✅ | Zoom limit 20.0x |
| APPLY_002_APPLICATO | 20250822_fix_comments_foreign_key.sql | ✅ | FK + profiles |  
| APPLY_003_APPLICATO | *(merged in 20250821)* | ✅ | RLS policies fix |
| APPLY_004_APPLICATO | *(pending Phase 2)* | 🔄 | Sharing system |

## 🎯 **Best Practices**

### **Per Fix Veloci (Development)**
```bash
# Usa supabase-fixes/ workflow
1. Crea APPLY_XXX_PENDING.sql
2. Test in Supabase SQL Editor  
3. Rinomina se success/fail
```

### **Per Deploy Production (Quando Necessario)**
```bash
# Usa supabase CLI
supabase migration new "descriptive_name"
# Copia contenuto da database-fixes/APPLY_XXX_APPLICATO.sql
supabase db push
```

### **Mantenimento Sync**
- ✅ **Ogni APPLY_XXX_APPLICATO** dovrebbe avere corrispondenza in migrations/
- ✅ **Documentare mapping** in questo README  
- ✅ **Testing sempre via supabase-fixes/** prima di migrations

## ⚠️ **Note Importanti**

- **supabase-fixes/** = Workflow principale per development
- **supabase/migrations/** = Archive e production deploys
- **Non duplicare effort** - usa supabase-fixes/ per test, poi copia qui se necessario
- **Mantieni mapping** aggiornato in questo file

## 🔗 **References**

- [Supabase Fixes Workflow](../supabase-fixes/README.md)
- [SQL Fixes Log](../supabase-fixes/SQL_FIXES_LOG.md)
- Project ID: `cfbaomnccefkpqnfjjiv`