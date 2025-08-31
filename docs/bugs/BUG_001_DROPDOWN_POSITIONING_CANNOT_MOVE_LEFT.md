# 🐛 BUG_001: Impossibile Spostare Dropdown Menu a Sinistra

## 📋 **Sommario Bug**
I dropdown menu (balloon) per "Vista" e "Sposta viste in cartella" non possono essere posizionati a sinistra dello schermo nonostante diversi tentativi di modifica del codice.

## 🎯 **Problema Specifico**
- **Menu Target**: Dropdown "Sposta in cartella" (tre puntini MoreVertical)
- **Posizione Attuale**: Sempre all'estrema destra dello schermo
- **Posizione Desiderata**: Circa 1/4 dello schermo da sinistra
- **Status**: ❌ IMPOSSIBILE DA RISOLVERE con modifiche CSS/props

## 🔧 **Tentativi Effettuati**

### **Tentativo 1: Modifica DropdownMenuContent props**
```typescript
// PROVATO - Non funziona
<DropdownMenuContent align="start" side="right" className="w-56" sideOffset={-200}>

// PROVATO - Non funziona  
<DropdownMenuContent align="center" side="left" className="w-56" sideOffset={100}>
```
**Risultato**: Menu rimane sempre a destra

### **Tentativo 2: Spostamento Fisico del Pulsante**
```typescript
// PROVATO - Pulsante spostato ma menu sempre a destra
{/* Context menu for moving to folders - positioned at left */}
{!isVirtualFolder && !item.is_folder && availableFolders.length > 0 && onMoveToFolder && (
  <div className="mr-auto opacity-0 group-hover:opacity-100">
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="h-6 w-6 p-0 hover:bg-accent">
          <MoreVertical className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-56">
```
**Risultato**: Pulsante è a sinistra ma dropdown appare ancora a destra

### **Tentativo 3: Variazioni di Alignment**
- `align="start" side="right"`
- `align="center" side="left"`  
- `align="end" side="left"`
- Con e senza `sideOffset`

**Risultato**: Tutti i tentativi falliscono, menu sempre a destra

## 🤔 **Cause Probabili**

### **Ipotesi A: Viewport Constraints**
Il componente DropdownMenu di shadcn-ui potrebbe avere logica interna che impedisce al menu di uscire dai bounds del viewport, forzando sempre posizionamento a destra.

### **Ipotesi B: Parent Container Overflow**
Il container padre potrebbe avere `overflow: hidden` o altri CSS che impediscono il posizionamento corretto.

### **Ipotesi C: Z-index e Positioning Context**
Problemi di stacking context o positioning che interferiscono con il calcolo della posizione.

### **Ipotesi D: Library Limitation**
Limitazione intrinseca della libreria shadcn-ui/Radix UI per dropdown positioning.

## 📊 **Impatto**

### **Severità**: 🟡 BASSA
- **UX Impact**: Minimo - funzionalità funziona, solo posizionamento non ideale
- **Usabilità**: Menu accessibile ma non nella posizione preferita
- **Frequency**: Ogni volta che si usa "Sposta in cartella"

### **Priorità**: 🔵 BASSA
- Non blocca funzionalità core
- Problema estetico/UX
- Workaround disponibili

## 🔍 **File Coinvolti**
- `src/components/ViewFolderSidebar.tsx` (linee 365-433)
- shadcn-ui DropdownMenu components
- Potentially @radix-ui/react-dropdown-menu

## 💡 **Possibili Soluzioni Alternative**

### **Soluzione A: Custom Dropdown**
Implementare un dropdown custom senza shadcn-ui per controllo completo del posizionamento.

### **Soluzione B: Modal invece di Dropdown** 
Usare un modal centrato per "Sposta in cartella" invece di dropdown.

### **Soluzione C: Sidebar Context Menu**
Implementare context menu nativo del browser (right-click).

### **Soluzione D: CSS Override Forzato**
```css
/* Potential CSS override */
[data-radix-popper-content-wrapper] {
  transform: translateX(-200px) !important;
}
```

## ⏰ **Status Resolution**
- **Status**: 🔄 DEFERRED (non prioritario)
- **Assigned**: N/A  
- **Resolution Timeline**: Dopo completamento funzionalità core
- **Next Action**: Documentato per revisione futura

## 📝 **Note Aggiuntive**
- Problema potrebbe essere risolto in futuro con upgrade di shadcn-ui
- Considerare sostituzione libreria dropdown se diventa critico
- Testare con diverse versioni di @radix-ui/react-dropdown-menu

---

**Data Creazione**: 2025-08-25  
**Ultima Modifica**: 2025-08-25  
**Reporter**: Claude Code AI Assistant  
**Priority**: Low / Deferred