# 📷 Sistema Auto-Upload Screenshot per Claude Code

## 🎯 Scopo
Sistema automatico per **leggere e analizzare screenshot** in Claude Code quando lavori nella cartella `C:\CLAUDEcode2025\mermaid-sketcher-451`.

## ⚙️ Configurazione Attiva

### 🔧 Hook Claude Code Configurati:
- **SessionStart**: Notifica attivazione auto-monitor
- **UserPromptSubmit**: Rileva nuovi screenshot ad ogni messaggio

### 📁 Cartella Monitorata:
```
C:\CLAUDEcode2025\mermaid-sketcher-451\github-sync\SCREENSHOT\
```

## 🚀 Come Funziona

### 1. **Salva Screenshot**
```
Windows + Shift + S → Salva in questa cartella
Nome: descrittivo (es: github-error.png, git-gui-setup.jpg)
```

### 2. **Auto-Rilevamento**
- Hook attiva ad ogni tuo messaggio
- Rileva automaticamente nuovi .jpg/.png/.gif
- Mostra notifica nella chat

### 3. **Lettura Manuale**
```
Read github-sync\SCREENSHOT\nome-file.jpg
```

## 📋 Log Screenshot

| Data/Ora | File | Descrizione | Status |
|----------|------|-------------|--------|
| 2025-08-22 | Clipboard Image.jpg | GitHub Desktop initial screen | ✅ Letto |

## 🛠️ Script Utility

### `auto-read-screenshots.bat`
- Trova l'ultimo screenshot aggiunto
- Genera comando Read per Claude Code
- Doppio click per usarlo

## 💡 Best Practices

### Nomi File Suggeriti:
- `github-error-403.png` - Errori specifici
- `git-gui-commit.jpg` - Interfacce GUI  
- `powershell-output.png` - Output comandi
- `github-desktop-push.jpg` - Operazioni GitHub Desktop

### Workflow Consigliato:
1. **Screenshot** → Salva con nome descrittivo
2. **Messaggio** in Claude Code → Hook rileva automaticamente  
3. **Read** manuale se necessario per analisi dettagliata

---

*Sistema creato per debugging GitHub sync e automazione workflow*