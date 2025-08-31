# 🎨 TEAM-BASED PHASE 2: UI Integration Plan

**Obiettivo:** Trasformare il backend team-based in esperienza utente completa.

## 🎯 **Overview Fase 2**

### **Cosa Abbiamo (Phase 1):**
- ✅ Database schema team-based completo
- ✅ 6 RPC functions per team management
- ✅ Security policies implementate
- ✅ Migrazione dati completata

### **Cosa Creiamo (Phase 2):**
- 🎨 Team Management UI
- 🔄 Team-aware navigation
- 💬 Enhanced invitation system
- 🚀 Real-time team collaboration

## 📋 **Implementation Steps**

### **STEP 1: Core Team UI Components** 
**Priority:** 🔥 High | **Effort:** Medium | **Duration:** 2-3 days

#### **1.1 CreateTeamModal Component**
```typescript
// New component: src/components/CreateTeamModal.tsx
interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  onTeamCreated: (team: Team) => void;
}
```
**Features:**
- Team name input with validation
- Description textarea
- Create button with loading state
- Integration with `create_team()` RPC

#### **1.2 TeamManagementModal Component**  
```typescript
// New component: src/components/TeamManagementModal.tsx
interface TeamManagementModalProps {
  team: Team;
  open: boolean;
  onClose: () => void;
}
```
**Features:**
- Team info editing
- Members list with roles
- Invite new members
- Remove/change member roles
- Team settings and permissions

#### **1.3 TeamMembersList Component**
```typescript
// New component: src/components/TeamMembersList.tsx  
interface TeamMembersListProps {
  teamId: string;
  currentUserRole: TeamRole;
  onMemberUpdate: (memberId: string, newRole: TeamRole) => void;
  onMemberRemove: (memberId: string) => void;
}
```

### **STEP 2: Team-Aware Navigation**
**Priority:** 🔥 High | **Effort:** High | **Duration:** 3-4 days

#### **2.1 Enhanced QuickNavigationBar**
- Add team selector dropdown
- Team context indicator  
- Switch between personal/team views
- Team-specific diagram filtering

#### **2.2 TeamSidebar Component**
```typescript
// New component: src/components/TeamSidebar.tsx
interface TeamSidebarProps {
  selectedTeam: Team | null;
  onTeamChange: (team: Team) => void;
  onCreateTeam: () => void;
}
```
**Features:**
- Team list with icons/colors
- Personal team vs collaborative teams
- Team member count indicators
- Quick team creation button

#### **2.3 Enhanced DiagramsList**
- Team context awareness
- Team visibility indicators  
- Team-specific filtering
- Collaborative editing indicators

### **STEP 3: Enhanced Invitation System**  
**Priority:** 🟡 Medium | **Effort:** Medium | **Duration:** 2 days

#### **3.1 Update InviteUserModal**
- Team context integration
- Role selection (admin/editor/viewer)
- Bulk invitations
- Custom invitation messages

#### **3.2 Enhanced PendingInvitationsModal**  
- Team invitation context
- Show team details in invitations
- Accept/decline with team preview
- Invitation history

### **STEP 4: Real-time Collaboration Features**
**Priority:** 🟡 Medium | **Effort:** High | **Duration:** 4-5 days

#### **4.1 Team Presence Indicators**
- Show who's currently editing
- Active team members indicator
- Last activity timestamps
- Conflict resolution UI

#### **4.2 Collaborative Editing**
- Real-time diagram sync
- Multi-cursor support
- Change notifications
- Version conflict resolution

## 🎨 **UI/UX Design Patterns**

### **Team Visual Identity:**
```scss
// Team color coding system
.team-personal { --team-color: #3b82f6; }    // Blue
.team-work { --team-color: #10b981; }        // Green  
.team-project { --team-color: #f59e0b; }     // Amber
.team-shared { --team-color: #8b5cf6; }      // Purple
```

### **Team Icons:**
- 🏠 Personal Team
- 💼 Work Team  
- 🚀 Project Team
- 👥 Collaborative Team

### **Role Indicators:**
- 👑 Owner - Crown icon
- ⚙️ Admin - Gear icon  
- ✏️ Editor - Pen icon
- 👁️ Viewer - Eye icon

## 🔄 **Integration Points**

### **Existing Components to Update:**

#### **Header.tsx:**
- Add team selector
- Show current team context
- Team notifications badge

#### **QuickNavigationBar.tsx:**  
- Enhance "Condivise" tab with team context
- Add team filtering options
- Team-specific views

#### **DiagramsList.tsx:**
- Team ownership indicators
- Collaborative status badges
- Team filtering capabilities

## 🧪 **Testing Strategy**

### **Component Tests:**
- [ ] CreateTeamModal form validation
- [ ] TeamManagementModal role management
- [ ] TeamMembersList permission handling
- [ ] Team navigation flows

### **Integration Tests:**
- [ ] Team creation → membership flow
- [ ] Invitation → acceptance → team access
- [ ] Role changes → permission updates  
- [ ] Team context switching

### **User Experience Tests:**
- [ ] Team onboarding flow
- [ ] Multi-team navigation
- [ ] Collaborative editing experience
- [ ] Mobile responsiveness

## 📱 **Mobile Considerations**

### **Responsive Design:**
- Collapsible team sidebar
- Touch-friendly team selection
- Mobile-optimized modals
- Swipe gestures for team switching

### **Performance:**
- Lazy loading team data
- Optimized team member lists
- Efficient real-time updates
- Cached team information

## 🔧 **Technical Implementation**

### **State Management:**
```typescript
// Team context management
interface TeamContextState {
  currentTeam: Team | null;
  userTeams: Team[];  
  teamMembers: Record<string, TeamMember[]>;
  loading: boolean;
  error: string | null;
}
```

### **API Integration:**
- Integrate with existing RPC functions
- Real-time subscriptions for team updates
- Optimistic UI updates
- Error handling and retries

### **Performance Optimization:**
- React.memo for team components
- useMemo for team calculations  
- Debounced search and filters
- Virtual scrolling for large team lists

---

## 🎯 **Success Criteria**

### **Functional Requirements:**
- [ ] Users can create and manage teams
- [ ] Seamless team switching experience
- [ ] Intuitive invitation and member management
- [ ] Clear team context awareness throughout app

### **Non-Functional Requirements:**
- [ ] < 200ms team switching time
- [ ] Responsive design on all screen sizes  
- [ ] Accessible team navigation
- [ ] Consistent visual team identity

### **User Experience Requirements:**
- [ ] Onboarding flow for new team features
- [ ] Clear team vs personal context indicators
- [ ] Intuitive role-based permissions UI
- [ ] Smooth collaborative editing experience

---

**Timeline:** 2-3 weeks  
**Priority Order:** Steps 1 → 2 → 3 → 4  
**Dependencies:** Phase 1 backend complete ✅  
**Risk Level:** Low (building on solid foundation)