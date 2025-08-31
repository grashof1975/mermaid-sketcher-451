# 🔧 Trick #11 - Todo List Persistente Context-Aware

## 📋 Quick Setup
```bash
# Copia questo README nel tuo progetto e il trick si auto-configura!
# Claude Code rileverà automaticamente il contesto del TUO progetto
```

## 🎯 Cosa Fa Questo Trick

Crea e mantiene una **todo list persistente** che si adatta automaticamente al progetto in cui viene utilizzato. Quando copi questo trick in un nuovo progetto, analizzerà:
- 📁 Struttura directory esistente
- 📝 File README/TODO/ROADMAP presenti
- 🔧 Tipo di progetto (React, Python, Node, etc.)
- 📊 Task e milestone già definiti

## 🚀 Implementazione Rapida

### Step 1: Primo Utilizzo nel Nuovo Progetto
```javascript
// Claude Code esegue automaticamente quando rileva questo README:
const projectContext = {
  name: getCurrentProjectName(),        // Dal nome directory
  type: detectProjectType(),            // Da package.json, requirements.txt, etc
  existingTodos: findExistingTodos(),   // Da README, TODO files, comments
  structure: analyzeProjectStructure()  // Directory e file principali
};

// Crea todo list iniziale basata sul contesto
TodoWrite({
  todos: generateContextualTodos(projectContext)
});
```

### Step 2: File di Persistenza Auto-Generato
Il trick creerà automaticamente nella root del TUO progetto:
```
[TUO-PROGETTO]-TODO-PERSISTENT.md
```

### Step 3: Todo List Contestuale
Esempi di todo auto-generate per diversi contesti:

**Se rileva un progetto React:**
- [ ] Setup componenti principali
- [ ] Configurare routing
- [ ] Implementare state management
- [ ] Testing componenti

**Se rileva un progetto Python:**
- [ ] Setup virtual environment
- [ ] Installare dipendenze
- [ ] Creare struttura moduli
- [ ] Scrivere test unitari

**Se rileva un progetto generico:**
- [ ] Analizzare struttura esistente
- [ ] Documentare architettura
- [ ] Identificare aree di miglioramento
- [ ] Creare piano implementazione

## 💡 Esempi Pratici di Adattamento

### Il Trick si Adatta al Tuo Workflow

```javascript
// ESEMPIO 1: In un progetto con Git
if (hasGitRepo()) {
  // Aggiunge todo per commit e branch
  addTodo("Creare branch per feature X");
  addTodo("Commit changes prima di Y");
}

// ESEMPIO 2: In un progetto con test
if (hasTestFramework()) {
  // Aggiunge todo per testing
  addTodo("Scrivere test per nuova funzionalità");
  addTodo("Verificare coverage > 80%");
}

// ESEMPIO 3: In un progetto con CI/CD
if (hasCIPipeline()) {
  // Aggiunge todo per deployment
  addTodo("Verificare pipeline prima di merge");
  addTodo("Update version per release");
}
```

## ⚙️ Configurazione Avanzata (Opzionale)

### Personalizza il Comportamento
Crea `.claude/trick11-config.json` nel tuo progetto:
```json
{
  "todoFile": "MY-CUSTOM-TODO.md",
  "autoDetect": true,
  "categories": ["frontend", "backend", "testing", "docs"],
  "priority": ["critical", "high", "medium", "low"],
  "integration": {
    "git": true,
    "jira": false,
    "github": true
  }
}
```

## 🔗 Integrazioni Automatiche

Il trick rileva e si integra con:
- **Git**: Suggerisce todo per commit/branch
- **Package managers**: npm, pip, cargo, etc.
- **Test frameworks**: Jest, Pytest, etc.
- **Build tools**: Webpack, Make, etc.
- **IDE**: VS Code, Cursor, etc.

## ⚠️ Troubleshooting

**Il trick non rileva il mio progetto?**
- Assicurati di avere un file identificativo (package.json, requirements.txt, Cargo.toml, etc.)
- Puoi forzare il tipo con: `--project-type=react`

**Todo list vuota all'inizio?**
- Normale per progetti minimi - aggiungi manualmente i primi task
- Il trick imparerà dal tuo pattern di lavoro

**File di persistenza non creato?**
- Verifica permessi di scrittura nella directory
- Prova a crearlo manualmente: `touch PROJECT-TODO.md`

## 📊 Come Verificare che Funziona

### Test Rapido:
1. **Check Auto-Detection**: 
   ```bash
   # Il trick dovrebbe identificare il tuo progetto
   Verificare nome progetto nel todo file
   ```

2. **Check Persistenza**:
   ```bash
   # Chiudi e riapri Claude Code
   # La todo list dovrebbe essere mantenuta
   ```

3. **Check Context-Awareness**:
   ```bash
   # Aggiungi un package.json o requirements.txt
   # Il trick dovrebbe adattare le todo suggestions
   ```

## 🏷️ Metadata
- **Compatibilità**: Claude Code tutte le versioni
- **Dipendenze**: Nessuna (usa solo TodoWrite nativo)
- **Categoria**: Core Functionality / Session Management
- **Complessità**: ⭐⭐☆☆☆ (Facile da usare, potente nei risultati)
- **Portabilità**: ✅ 100% portabile - copia e funziona ovunque

---

## 🚀 One-Line Setup

```bash
# Copia questo README nel tuo progetto e sei pronto!
# Il Trick #11 si adatterà automaticamente al TUO contesto
```

*README portabile e context-aware - Funziona in QUALSIASI progetto!*