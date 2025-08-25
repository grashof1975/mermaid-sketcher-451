# 🐛 Bug Reports Directory

## 📁 Scopo Directory
Questa cartella contiene la documentazione sistematica dei bug identificati durante lo sviluppo di Mermaid Sketcher, con priorità, stato resolution e workaround.

## 📋 Bug Report Template
```markdown
# 🐛 BUG_XXX: [Titolo Bug]

## 📋 Sommario Bug
## 🎯 Problema Specifico  
## 🔧 Tentativi Effettuati
## 🤔 Cause Probabili
## 📊 Impatto (Severità + Priorità)
## 🔍 File Coinvolti
## 💡 Possibili Soluzioni Alternative
## ⏰ Status Resolution
## 📝 Note Aggiuntive
```

## 🗂️ Convenzioni Nomi File
- `BUG_001_DROPDOWN_POSITIONING_CANNOT_MOVE_LEFT.md`
- `BUG_002_[BRIEF_DESCRIPTION].md`
- `BUG_XXX_[CATEGORY]_[SPECIFIC_ISSUE].md`

## 📊 Priority Levels
- 🔴 **ALTA**: Blocca funzionalità core
- 🟡 **MEDIA**: Impatta UX ma non blocca
- 🔵 **BASSA**: Problema estetico/minor

## 📈 Status Types
- 🔄 **DEFERRED**: Non prioritario, per future sessioni
- ⏳ **IN PROGRESS**: Attivamente in risoluzione  
- ✅ **RESOLVED**: Risolto e testato
- ❌ **WONTFIX**: Non sarà risolto per motivi tecnici/business

## 📋 Current Bug List

| ID | Status | Priority | Summary | File |
|----|--------|----------|---------|------|
| 001 | 🔄 DEFERRED | 🔵 BASSA | Dropdown positioning cannot move left | [BUG_001](BUG_001_DROPDOWN_POSITIONING_CANNOT_MOVE_LEFT.md) |

## 🔄 Workflow Bug Tracking
1. **Bug Discovery** → Crea nuovo BUG_XXX.md
2. **Investigation** → Documenta tentativi e cause probabili
3. **Priority Assignment** → Assegna priorità based su impact
4. **Resolution Planning** → Identifica soluzioni e timeline
5. **Implementation** → Fix + test + close
6. **Archive** → Move a RESOLVED status

## 📞 Integration
Questi bug report sono integrati con:
- `PROJECT_OVERVIEW.md` per roadmap planning
- `supabase-fixes/SQL_FIXES_LOG.md` per database-related bugs
- Development sessions per priority-based fixing

---

*Directory creata: 2025-08-25*  
*Scopo: Systematic bug tracking e resolution planning*