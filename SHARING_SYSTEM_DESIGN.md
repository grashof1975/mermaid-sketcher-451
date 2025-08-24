# 📤 Sistema Condivisione Diagrammi - Design Completo

## 🎯 **Obiettivi del Sistema**

### **Requisiti Principali**
- ✅ **Utenti Registrati**: Solo utenti iscritti possono essere invitati e commentare
- ✅ **Visualizzazione Pubblica**: Utenti non registrati possono vedere diagrammi (sola lettura)
- ✅ **Gestione Privilegi**: Sistema granulare di permessi
- ✅ **Sistema Inviti**: Workflow completo per inviti e notifiche
- ✅ **Audit Trail**: Log completo delle attività di condivisione

## 🔐 **Sistema Privilegi**

### **Matrice Permessi**

| Azione | Owner | Editor | Commenter | Viewer | Public |
|--------|-------|--------|-----------|--------|--------|
| **Visualizza diagramma** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Modifica diagramma** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Commenti + Viste** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Solo viste** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Invita utenti** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Gestisci permessi** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Elimina diagramma** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Crea link pubblico** | ✅ | ❌ | ❌ | ❌ | ❌ |

### **Escalation Permessi**
```
Public → Viewer → Commenter → Editor → Owner
```

## 🛠️ **API Endpoints**

### **1. 👥 Gestione Inviti**

#### **POST /api/diagrams/{id}/invite**
Invita un utente registrato
```typescript
interface InviteUserRequest {
  email: string;              // Email utente da invitare
  permission: 'viewer' | 'commenter' | 'editor';
  message?: string;           // Messaggio personalizzato
  expires_in_days?: number;   // Default: 7 giorni
}

interface InviteUserResponse {
  success: boolean;
  invite_id: string;
  user_found: boolean;        // Se l'email esiste nel sistema
  expires_at: string;
}
```

#### **GET /api/diagrams/{id}/invites**
Lista inviti pendenti per un diagramma
```typescript
interface PendingInvite {
  id: string;
  user_email: string;
  permission_level: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
  expires_at: string;
  invited_by: UserProfile;
}
```

#### **POST /api/invites/{invite_id}/respond**
Risposta a un invito
```typescript
interface RespondInviteRequest {
  action: 'accept' | 'decline';
  message?: string;           // Messaggio di risposta opzionale
}
```

### **2. 🔗 Link Pubblici**

#### **POST /api/diagrams/{id}/public-link**
Crea link pubblico
```typescript
interface CreatePublicLinkRequest {
  allow_comments?: boolean;   // Default: false
  password_protected?: boolean;
  access_password?: string;
  expires_in_days?: number;   // NULL = mai scade
}

interface PublicLinkResponse {
  success: boolean;
  public_url: string;         // URL completo accessibile
  share_token: string;
  expires_at?: string;
}
```

#### **GET /api/public/{token}**
Accesso pubblico al diagramma
```typescript
interface PublicDiagramView {
  diagram: {
    id: string;
    title: string;
    mermaid_code: string;
    description?: string;
    created_at: string;
    updated_at: string;
  };
  owner: UserProfile;
  stats: {
    view_count: number;
    unique_visitors: number;
  };
  access_info: {
    can_comment: boolean;
    password_required: boolean;
  };
}
```

### **3. ⚙️ Gestione Permessi**

#### **PUT /api/diagrams/{id}/permissions/{user_id}**
Modifica permessi utente
```typescript
interface UpdatePermissionRequest {
  permission_level: 'viewer' | 'commenter' | 'editor';
  reason?: string;            // Motivo del cambio permessi
}
```

#### **DELETE /api/diagrams/{id}/sharing/{user_id}**
Rimuovi utente da diagramma condiviso

#### **GET /api/diagrams/{id}/collaborators**
Lista collaboratori del diagramma
```typescript
interface Collaborator {
  user: UserProfile;
  permission_level: string;
  joined_at: string;
  last_activity?: string;
  contribution_stats: {
    comments_count: number;
    edits_count: number;
    views_count: number;
  };
}
```

## 🎨 **UI/UX Design Proposto**

### **1. 📱 Floating Navigation Bar - Tab Condivisione**
Aggiungiamo un 4° tab "Condivisione" nella floating bar:

```typescript
// Nuove props per QuickNavigationBar
interface QuickNavigationBarProps {
  // ... props esistenti
  currentUserRole?: 'owner' | 'editor' | 'commenter' | 'viewer';
  collaborators?: Collaborator[];
  sharingEnabled?: boolean;
  onInviteUser?: () => void;
  onManageSharing?: () => void;
}
```

### **2. 🎯 Modal Invito Utenti**
Modal dedicato per invitare utenti:

**Elementi UI:**
- ✅ **Campo Email** con autocomplete utenti registrati
- ✅ **Selezione Permessi** (radio buttons con descrizioni)
- ✅ **Messaggio Personalizzato** (textarea opzionale)
- ✅ **Scadenza Invito** (dropdown: 1, 3, 7, 14, 30 giorni, Mai)
- ✅ **Preview Invito** (anteprima email che verrà inviata)

### **3. 👥 Gestione Collaboratori**
Pannello per gestire utenti condivisi:

**Funzionalità:**
- ✅ **Lista Collaboratori** con avatar, nome, ruolo
- ✅ **Cambio Permessi** (dropdown inline per owner)
- ✅ **Rimozione Collaboratori** (con conferma)
- ✅ **Statistiche Contributi** (commenti, modifiche, visualizzazioni)
- ✅ **Filtri** (per ruolo, attività, data ultimo accesso)

### **4. 🔗 Gestione Link Pubblici**
Sezione dedicata per link pubblici:

**Elementi:**
- ✅ **Genera Link** con opzioni avanzate
- ✅ **Lista Link Attivi** con statistiche
- ✅ **Configurazioni** (password, scadenza, permessi commenti)
- ✅ **Analytics** (visualizzazioni, visitatori unici, geographic)

## 🔔 **Sistema Notifiche**

### **Tipi di Notifiche**

1. **📬 Inviti Ricevuti**
   ```
   "Mario Rossi ti ha invitato a collaborare sul diagramma 'Sistema Auth'"
   [Visualizza] [Accetta] [Rifiuta]
   ```

2. **✅ Inviti Accettati**
   ```
   "Sara Bianchi ha accettato il tuo invito per 'Database Schema'"
   ```

3. **❌ Inviti Rifiutati**
   ```
   "Luca Verdi ha rifiutato l'invito per 'API Design'"
   ```

4. **👥 Nuova Attività**
   ```
   "Marco ha commentato il diagramma 'User Journey'"
   "Anna ha modificato il diagramma 'Process Flow'"
   ```

### **Canali di Notifica**
- ✅ **In-App** (badge su floating bar + pannello notifiche)
- ✅ **Email** (immediata per inviti, digest giornaliero per attività)
- 🔄 **Push** (futuro, se implementiamo PWA)

## 🚀 **Piano Implementazione**

### **Phase 1: Core Sharing (2-3 giorni)**
1. ✅ Schema database + migrazioni
2. ✅ API endpoints base (invite, accept, manage)
3. ✅ UI tab Condivisione in floating bar
4. ✅ Modal inviti base

### **Phase 2: Advanced Features (3-4 giorni)**
1. ✅ Link pubblici + accesso anonimo
2. ✅ Sistema notifiche in-app
3. ✅ Gestione permessi avanzata
4. ✅ Analytics condivisioni

### **Phase 3: Polish & UX (2-3 giorni)**
1. ✅ Email notifications
2. ✅ Audit trail completo  
3. ✅ Statistics & reporting
4. ✅ Mobile-responsive design

## 🔍 **Considerazioni Sicurezza**

### **Validazioni**
- ✅ **Ownership Check**: Solo owner può invitare/rimuovere
- ✅ **Permission Validation**: Controllo permessi per ogni azione
- ✅ **Rate Limiting**: Limite inviti per utente/giorno
- ✅ **Token Security**: Share token sicuri e non predictable
- ✅ **Input Sanitization**: Validazione email e messaggi

### **Privacy**
- ✅ **GDPR Compliant**: Possibilità rimozione dati utente
- ✅ **Data Minimization**: Solo dati necessari per funzionalità
- ✅ **Audit Trail**: Log completo per transparency
- ✅ **Consent Management**: Opt-in per notifiche email

## 📊 **Metriche & Analytics**

### **Metriche Proprietario**
- 👥 **Collaboratori Attivi** (per periodo)
- 📈 **Engagement Score** (commenti + modifiche + visualizzazioni)
- 🔗 **Performance Link Pubblici** (click, visualizzazioni uniche)
- 🌍 **Geographic Distribution** (dove vengono visualizzati)

### **Metriche Sistema**
- 📤 **Adoption Rate** (% utenti che condividono)
- ⚡ **Response Rate** (% inviti accettati)
- 🔄 **Retention** (collaboratori che continuano a contribuire)
- 🛡️ **Security Events** (tentativi accesso non autorizzato)

---

**Status**: 📋 Design Completo  
**Next Step**: Implementazione Phase 1  
**Estimated Effort**: 7-10 giorni sviluppo completo