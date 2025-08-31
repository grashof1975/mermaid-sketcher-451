# 🎯 Phase 3 Implementation Plan - Advanced Tags & Folders System

## 📋 Panoramica Phase 3

**Obiettivo**: Implementare sistema filtri tag cumulativi + organizzazione viste in cartelle per migliorare UX e preparare condivisione batch.

**Priorità**: Alta (funzionalità richieste dall'utente)  
**Tempo stimato**: 3-4 giorni di sviluppo  
**Database**: APPLY_007 SQL ready

---

## 🎯 Phase 3A: Sistema Tags Avanzato

### **🏷️ Funzionalità Target**

1. **Filtro Tag Cumulativo**
   - Clic su tag applica/rimuove filtro (comportamento toggle)
   - Selezione multipla con indicatori visivi tag attivi
   - Modalità AND/OR configurabile
   - Reset rapido tutti i filtri attivi

2. **UI Miglioramenti Tags**
   - Badge tag con stati: normale, attivo, hover
   - Contatore risultati filtro in tempo reale
   - Pulsante "Clear All Filters" quando filtri attivi
   - Persistence filtri per sessione utente

### **🔧 Implementazione Tecnica**

#### **Frontend Components da Modificare:**
1. **`TagsEditor.tsx`** - Aggiungere comportamento filtro
2. **`DiagramsList.tsx`** - Integrare logica filtri
3. **Nuovo: `TagFilterBar.tsx`** - UI dedicata filtri attivi

#### **State Management:**
```typescript
interface TagFilterState {
  activeTags: string[];
  filterMode: 'AND' | 'OR';
  isActive: boolean;
}

// Context per gestire filtri globalmente
const TagFilterContext = createContext<TagFilterState>();
```

#### **Database Integration:**
- Usa tabella `user_tag_filters` da APPLY_007
- Funzione `update_tag_stats()` per analytics
- Persistence configurazione filtri per utente

---

## 🗂️ Phase 3B: Sistema Cartelle Viste

### **📁 Funzionalità Target**

1. **Organizzazione Gerarchica**
   - Creazione cartelle con nome/icona/colore personalizzabile
   - Eliminazione cartelle (con conferma se contengono viste)
   - 1 livello di nesting (cartelle → viste)
   - Conteggio viste per cartella

2. **Drag & Drop System**
   - Trascina viste tra cartelle
   - Trascina viste fuori da cartelle (root level)
   - Riordinamento all'interno delle cartelle
   - Visual feedback durante drag operation

3. **UI Enhancements**
   - Icone distintive: 📁 cartelle vs 👁️ viste
   - Expand/collapse cartelle
   - Menu contestuale cartelle (rinomina, elimina, cambia colore)
   - Breadcrumb navigazione quando dentro cartella

### **🔧 Implementazione Tecnica**

#### **Frontend Components da Creare/Modificare:**
1. **`ViewSidebar.tsx`** - Refactor per supportare cartelle
2. **Nuovo: `ViewFolder.tsx`** - Componente cartella
3. **Nuovo: `CreateFolderModal.tsx`** - Modal creazione cartella
4. **Nuovo: `ViewDragContainer.tsx`** - Wrapper DnD

#### **DnD Implementation:**
```typescript
// Usa @dnd-kit già presente nel progetto
interface ViewDragItem {
  id: string;
  type: 'view' | 'folder';
  parentId?: string;
}

interface FolderDropTarget {
  folderId: string;
  accepts: ['view']; // Solo viste nelle cartelle
}
```

#### **Database Schema:**
- Estensioni `saved_views` da APPLY_007 implementate
- Funzioni `get_folder_views()` e `move_view_to_folder()` pronte
- RLS policies configurate per sicurezza

---

## 🚀 Piano di Implementazione

### **Step 1: Database Setup (30 min)**
```bash
# Applicare schema database
psql -d supabase_db -f supabase-fixes/APPLY_007_PENDING.sql
# Rinominare in APPLY_007_APPLICATO.sql se successo
# Aggiornare SQL_FIXES_LOG.md
```

### **Step 2: Tag Filter System (2-3 ore)**

#### **2.1 State Management & Context**
```typescript
// hooks/useTagFilter.ts
export const useTagFilter = (diagramId?: string) => {
  const [filterState, setFilterState] = useState<TagFilterState>({
    activeTags: [],
    filterMode: 'AND',
    isActive: false
  });
  
  // Load/save to database
  // Filter logic implementation
};
```

#### **2.2 UI Components**
- Modifica `TagsEditor.tsx` per toggle behavior
- Crea `TagFilterBar.tsx` per filtri attivi
- Integra in `DiagramsList.tsx` con logica filtri

#### **2.3 Database Integration**
- API calls per save/load filtri utente
- Aggiornamento statistiche tag usage
- Persistence attraverso sessioni

### **Step 3: Folder System UI (3-4 ore)**

#### **3.1 Core Components**
```typescript
// components/ViewFolder.tsx
interface ViewFolderProps {
  folder: FolderData;
  children: ViewData[];
  onDrop: (viewId: string, folderId: string) => void;
  onRename: (folderId: string, newName: string) => void;
  onDelete: (folderId: string) => void;
}
```

#### **3.2 Drag & Drop Setup**
- Configurare DndContext per ViewSidebar
- Implementare drop zones per cartelle
- Visual feedback e animations

#### **3.3 CRUD Operations**
- Create: Modal per nuove cartelle
- Read: Lista gerarchica cartelle/viste  
- Update: Rinomina, cambia colore, sposta
- Delete: Conferma + gestione viste contenute

### **Step 4: Database Integration (1-2 ore)**

#### **4.1 API Functions**
```typescript
// utils/supabase.ts - estensioni
export const db = {
  // ... existing functions
  
  folders: {
    create: (folderData: FolderCreateData) => Promise<Folder>,
    update: (folderId: string, updates: Partial<Folder>) => Promise<Folder>,
    delete: (folderId: string) => Promise<void>,
    getWithViews: (userId: string) => Promise<FolderWithViews[]>
  },
  
  views: {
    // ... existing functions
    moveToFolder: (viewId: string, folderId: string, sortOrder?: number) => Promise<void>
  }
};
```

#### **4.2 RLS Policies Test**
- Verificare accesso utente alle proprie cartelle
- Test move operations con security
- Validazione constraints database

### **Step 5: Testing & Polish (2-3 ore)**

#### **5.1 Functionality Tests**
- [ ] Creazione/eliminazione cartelle funzionante
- [ ] Drag & drop viste tra cartelle smooth
- [ ] Filtri tag cumulativi corretti
- [ ] Persistence attraverso refresh/logout
- [ ] Performance con molte viste/cartelle

#### **5.2 UX Improvements**
- Animations drag & drop fluide
- Loading states per operations database
- Error handling con toast notifications
- Keyboard shortcuts (Ctrl+N nuova cartella)

#### **5.3 Edge Cases**
- Eliminazione cartelle con viste
- Conflitti nomi cartelle/viste
- Limits: max cartelle, max viste per cartella
- Behavior con filtri attivi durante folder ops

---

## 📋 Checklist Completamento

### **Phase 3A - Tag Filters ✅**
- [ ] Toggle behavior tag selection implementato
- [ ] Filtri AND/OR funzionanti  
- [ ] UI filtri attivi con clear button
- [ ] Persistence database filtri utente
- [ ] Statistics tag usage trackate

### **Phase 3B - Folder System ✅**  
- [ ] Creazione cartelle con personalizzazione
- [ ] Drag & drop viste ↔ cartelle smooth
- [ ] Organizzazione gerarchica 1-livello
- [ ] Delete/rename cartelle sicuro
- [ ] Conteggi e navigazione UI

### **Integration & Polish ✅**
- [ ] Database APPLY_007 applicato successo
- [ ] Performance testing con dataset reali
- [ ] Error handling robusto
- [ ] Documentazione aggiornata
- [ ] Ready per Phase 3C (folder sharing)

---

## 🔮 Preparazione Phase 3C

Le modifiche Phase 3A/3B preparano il terreno per:

1. **Folder Sharing** - Condividere intere cartelle di viste
2. **Batch Operations** - Azioni multiple su cartelle  
3. **Advanced Organization** - Tags + Folders combined filtering
4. **Team Collaboration** - Cartelle condivise team

Schema database già include campi per estensioni future sharing system.

---

**🎯 Risultato atteso**: Sistema completamente funzionale tags filters + folders organization, pronto per utilizzo produzione e future estensioni collaborative.