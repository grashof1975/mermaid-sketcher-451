# 🔄 Scripts di Sincronizzazione GitHub

Questa cartella contiene script automatizzati per gestire la sincronizzazione del repository **mermaid-sketcher-451** con GitHub.

## 📁 Scopo della Sincronizzazione

**✅ SINCRONIZZATO**: Repository GitHub `mermaid-sketcher-451`
- Codice sorgente del progetto Mermaid Sketcher
- File di configurazione (package.json, etc.)
- Database fixes e migrazioni
- Documentazione del progetto

**❌ NON SINCRONIZZATO**: Cartella `20250821_ADR` 
- Directory di lavoro temporanea di Claude Code
- File di sessione e cache locali
- Non fa parte del repository del progetto

## 📋 Scripts Disponibili

### 1. `sync-to-github.bat` - Sincronizzazione verso GitHub
**Uso**: Carica le modifiche locali su GitHub
**Processo**:
- ✅ Verifica status repository
- ✅ Aggiunge file modificati (src/, database-fixes/, *.json, *.md)
- ✅ Crea commit con messaggio personalizzato
- ✅ Push verso GitHub (branch master)
- ✅ Verifica finale

```bash
# Doppio click sul file o da cmd:
sync-to-github.bat
```

### 2. `sync-from-github.bat` - Sincronizzazione da GitHub  
**Uso**: Scarica gli aggiornamenti da GitHub
**Processo**:
- ✅ Backup automatico modifiche locali (git stash)
- ✅ Fetch/pull da GitHub
- ✅ Opzione per ripristinare modifiche locali
- ✅ Gestione conflitti automatica

```bash
# Doppio click sul file o da cmd:
sync-from-github.bat
```

### 3. `quick-commit.bat` - Commit Rapido
**Uso**: Crea commit veloce senza push
**Processo**:
- ✅ Mostra modifiche attuali
- ✅ Richiede messaggio commit
- ✅ Aggiunge e commita file modificati

```bash
# Doppio click sul file o da cmd:
quick-commit.bat
```

## 🚀 Flusso di Lavoro Consigliato

### Prima di iniziare a lavorare:
```
1. Esegui sync-from-github.bat
2. Verifica che tutto sia aggiornato
```

### Dopo aver lavorato:
```
1. Esegui quick-commit.bat (per salvare modifiche localmente)
2. Esegui sync-to-github.bat (per caricare su GitHub)
```

### Per aggiornamenti urgenti:
```
1. sync-from-github.bat
2. Risolvi conflitti se necessario  
3. sync-to-github.bat
```

## ⚠️ Note Importanti

- **Backup Automatico**: sync-from-github.bat fa backup automatico delle modifiche locali
- **File Ignorati**: I script ignorano automaticamente node_modules e .env
- **Branch**: Tutti gli script operano sul branch `master`
- **Conflitti**: In caso di conflitti, gli script si fermano per risoluzione manuale

## 🛠️ Personalizzazione

Per modificare i percorsi o il comportamento:
1. Modifica la variabile `cd /d "c:\CLAUDEcode2025\mermaid-sketcher-451"`  
2. Cambia i pattern di file in `git add` se necessario
3. Modifica il branch da `master` ad altro se richiesto

## 📊 Status Repository

Per verificare manualmente lo status:
```bash
cd "c:\CLAUDEcode2025\mermaid-sketcher-451"
git status
git log --oneline -5
```

---

# 📚 Git & GitHub: Buone Prassi e Glossario

## 📋 Nomenclature e Convenzioni

### Branch Naming Conventions

#### Prefissi Standard
- **`feature/`** - Nuove funzionalità
  - Esempio: `feature/user-authentication`
  - Esempio: `feature/shopping-cart`

- **`fix/` o `bugfix/`** - Correzione di bug
  - Esempio: `fix/login-validation-error`
  - Esempio: `bugfix/header-responsive-issue`

- **`hotfix/`** - Correzioni urgenti per production
  - Esempio: `hotfix/critical-security-patch`
  - Esempio: `hotfix/payment-gateway-fix`

- **`refactor/`** - Ristrutturazione del codice
  - Esempio: `refactor/api-endpoints`
  - Esempio: `refactor/database-queries`

- **`docs/`** - Documentazione
  - Esempio: `docs/api-documentation`
  - Esempio: `docs/setup-instructions`

- **`test/`** - Aggiunta o modifica dei test
  - Esempio: `test/unit-tests-authentication`
  - Esempio: `test/integration-tests-api`

- **`chore/`** - Manutenzione e task generali
  - Esempio: `chore/update-dependencies`
  - Esempio: `chore/cleanup-unused-files`

#### Regole di Naming
1. **Usa kebab-case** (parole separate da trattini)
2. **Sii descrittivo ma conciso**
3. **Evita abbreviazioni poco chiare**
4. **Usa l'inglese** per progetti internazionali
5. **Non superare i 50 caratteri**

### Commit Message Conventions

#### Formato Consigliato
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

#### Tipi di Commit
- **feat**: Nuova funzionalità
- **fix**: Correzione di bug
- **docs**: Documentazione
- **style**: Formattazione, missing semi colons, etc
- **refactor**: Refactoring del codice
- **test**: Aggiunta o modifica di test
- **chore**: Manutenzione

#### Esempi di Commit Messages
```bash
feat(auth): add user registration functionality
fix(api): resolve timeout issue in payment endpoint
docs(readme): update installation instructions
style(header): improve responsive layout
refactor(utils): extract common validation functions
test(auth): add unit tests for login component
chore(deps): update React to version 18.2.0
```

### Pull Request Guidelines

#### Titolo PR
- Usa lo stesso formato dei commit messages
- Sii specifico e descrittivo
- Esempio: `feat(dashboard): implement user analytics charts`

#### Template PR Description
```markdown
## Descrizione
Breve descrizione delle modifiche apportate.

## Tipo di Modifica
- [ ] Bug fix (non breaking change)
- [ ] Nuova feature (non breaking change)
- [ ] Breaking change (fix o feature che causa problemi alla compatibilità)
- [ ] Documentazione

## Testing
- [ ] Test unitari passano
- [ ] Test di integrazione passano
- [ ] Testato manualmente

## Checklist
- [ ] Il codice segue le convenzioni del progetto
- [ ] Self-review del codice completata
- [ ] Documentazione aggiornata
- [ ] Nessun warning di linting
```

## 📚 Glossario Git & GitHub

### Termini Fondamentali

**Repository (Repo)**
> Contenitore del progetto che include tutti i file, la storia delle modifiche e i metadati Git.

**Commit**
> Snapshot dello stato del progetto in un momento specifico. Ogni commit ha un ID univoco (hash SHA).

**Branch**
> Linea di sviluppo indipendente che diverge dal branch principale. Permette di lavorare su feature separate.

**Main/Master Branch**
> Il branch principale del repository, solitamente contiene il codice di produzione stabile.

**HEAD**
> Puntatore al commit più recente nel branch corrente.

**Working Directory**
> La directory locale dove stai lavorando, contiene i file del progetto nella loro versione corrente.

**Staging Area (Index)**
> Area intermedia dove vengono preparati i file prima del commit.

**Remote**
> Versione del repository ospitata su un server (come GitHub, GitLab, etc.).

**Origin**
> Nome di default per il remote principale del repository.

**Clone**
> Creare una copia locale di un repository remoto.

**Fork**
> Creare una copia personale di un repository di qualcun altro nel proprio account GitHub.

**Pull Request (PR) / Merge Request (MR)**
> Richiesta di incorporare le modifiche di un branch in un altro branch.

**Merge**
> Processo di combinazione delle modifiche di due branch diversi.

**Fast-forward Merge**
> Tipo di merge che sposta semplicemente il puntatore del branch senza creare un merge commit.

**Merge Conflict**
> Situazione che si verifica quando Git non riesce a combinare automaticamente le modifiche di due branch.

**Rebase**
> Processo di spostamento o combinazione di una sequenza di commit in un nuovo commit base.

**Cherry-pick**
> Applicare le modifiche di un commit specifico a un altro branch.

**Stash**
> Memorizzazione temporanea delle modifiche non committed per poter cambiare branch.

**Tag**
> Etichetta che marca un punto specifico nella storia del repository (spesso usato per le versioni).

**Release**
> Versione specifica del software, spesso associata a un tag.

**Issue**
> Sistema di tracking per bug, feature request, o task generali.

**Milestone**
> Gruppo di issue che rappresentano un obiettivo o una versione specifica.

**Wiki**
> Sistema di documentazione collaborativa integrato in GitHub.

**GitHub Pages**
> Servizio di hosting statico per siti web direttamente dai repository GitHub.

**GitHub Actions**
> Sistema di CI/CD (Continuous Integration/Continuous Deployment) integrato in GitHub.

**Workflow**
> Processo automatizzato configurato con GitHub Actions.

### Comandi Git Essenziali

**Inizializzazione e Configurazione**
```bash
git init                    # Inizializza un nuovo repository
git config --global user.name "Nome"
git config --global user.email "email@example.com"
```

**Stato e Informazioni**
```bash
git status                  # Mostra lo stato del working directory
git log                     # Mostra la storia dei commit
git diff                    # Mostra le differenze non staged
```

**Staging e Commit**
```bash
git add <file>              # Aggiunge file alla staging area
git add .                   # Aggiunge tutti i file modificati
git commit -m "messaggio"   # Crea un commit con messaggio
git commit -am "messaggio"  # Add e commit in un comando
```

**Branch Management**
```bash
git branch                  # Lista i branch locali
git branch <nome>           # Crea un nuovo branch
git checkout <branch>       # Cambia branch
git checkout -b <branch>    # Crea e cambia branch
git merge <branch>          # Merge di un branch
git branch -d <branch>      # Elimina un branch
```

**Remote Operations**
```bash
git clone <url>             # Clona un repository
git remote -v               # Lista i remote
git fetch                   # Scarica modifiche senza merge
git pull                    # Fetch + merge
git push                    # Invia commit al remote
git push -u origin <branch> # Push e imposta upstream
```

## 💡 Best Practices Riassuntive

### Per i Branch
1. **Usa branch feature** per ogni nuova funzionalità
2. **Mantieni i branch piccoli** e focalizzati
3. **Testa sempre** prima del merge
4. **Elimina i branch** dopo il merge
5. **Usa nomi descrittivi** e convenzioni consistenti

### Per i Commit
1. **Commit frequenti** con modifiche logiche
2. **Messaggi chiari** e descrittivi
3. **Un commit = una modifica logica**
4. **Testa prima** di committare
5. **Usa il presente imperativo** nei messaggi

### Per la Collaborazione
1. **Pull Request dettagliate** con descrizioni chiare
2. **Code review** prima del merge
3. **Comunicazione chiara** nelle issue e PR
4. **Documentazione aggiornata**
5. **Rispetta le convenzioni** del team/progetto

### Sicurezza
1. **Non committare mai** credenziali o informazioni sensibili
2. **Usa .gitignore** per file che non devono essere tracciati
3. **Verifica sempre** cosa stai committando con `git diff --cached`
4. **Usa branch protection rules** per branch importanti

---

*Creato da Claude Code Assistant - 2025-08-22*  
*Aggiornato: 2025-08-24 - Unificazione documentazione Git & GitHub*

*Questo documento è un punto di partenza. Adatta queste convenzioni alle necessità specifiche del tuo team e progetto.*