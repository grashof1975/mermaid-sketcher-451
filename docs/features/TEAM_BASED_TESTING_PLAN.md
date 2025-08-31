# 🧪 Team-Based Sharing - Testing Plan

Piano di testing per verificare l'implementazione del sistema team-based.

## 🎯 Testing Sequence

### **STEP 1: Foundation Testing**
```sql
-- Execute in Supabase Query Editor
-- File: APPLY_041_TEAM_BASED_FOUNDATION_PENDING.sql
```

**Expected Results:**
- ✅ Tables `teams` and `team_members` created
- ✅ Columns `team_id`, `visibility` added to `diagrams` and `saved_views`  
- ✅ Indexes and RLS policies in place
- ✅ Verification queries show success

### **STEP 2: Data Migration Testing**  
```sql
-- Execute in Supabase Query Editor  
-- File: APPLY_042_MIGRATE_TO_TEAMS_PENDING.sql
```

**Expected Results:**
- ✅ Personal teams created for all users
- ✅ Users added as owners of their personal teams
- ✅ Existing diagrams assigned to personal teams
- ✅ Existing shared diagrams converted to team collaborations
- ✅ Verification queries show migration stats

### **STEP 3: RPC Functions Testing**
```sql
-- Execute in Supabase Query Editor
-- File: APPLY_043_TEAM_MANAGEMENT_RPC_PENDING.sql  
```

**Expected Results:**
- ✅ 6 RPC functions created successfully
- ✅ Permissions granted to authenticated users
- ✅ Functions accessible via API

## 🔍 Manual Testing Scripts

### **Test 1: Get User Teams**
```sql
-- Should return personal team + any shared teams
SELECT * FROM get_user_teams();
```

### **Test 2: Create New Team**
```sql
-- Create a test team
SELECT create_team('Test Team', 'Team for testing purposes');

-- Verify creation
SELECT * FROM get_user_teams();
```

### **Test 3: Invite User to Team**  
```sql
-- Get a team ID from previous step
SELECT invite_user_to_team(
    'TEAM_ID_HERE'::UUID, 
    'grashof@gmail.com', 
    'editor'
);
```

### **Test 4: Check Pending Invitations**
```sql
-- Login as grashof user and run:
SELECT * FROM get_pending_team_invitations();
```

### **Test 5: Accept Team Invitation**
```sql  
-- As grashof user:
SELECT respond_to_team_invitation('TEAM_ID_HERE'::UUID, true);
```

### **Test 6: View Team Members**
```sql
-- Should show both users now
SELECT * FROM get_team_members('TEAM_ID_HERE'::UUID);
```

## 📊 Data Verification Queries

### **Check Migration Results**
```sql
-- Count personal teams
SELECT 'Personal teams' as type, COUNT(*) as count 
FROM teams 
WHERE name LIKE '%Personal Team';

-- Count team memberships by role  
SELECT 'Team memberships' as type, role, COUNT(*) as count
FROM team_members 
GROUP BY role;

-- Count diagrams with teams
SELECT 'Diagrams with teams' as type, visibility, COUNT(*) as count
FROM diagrams 
WHERE team_id IS NOT NULL 
GROUP BY visibility;
```

### **Check Team Structure**
```sql  
-- Sample team overview
SELECT 
    t.name as team_name,
    COUNT(DISTINCT tm.user_id) as members,
    COUNT(DISTINCT d.id) as diagrams,
    COUNT(DISTINCT sv.id) as saved_views
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
LEFT JOIN diagrams d ON t.id = d.team_id  
LEFT JOIN saved_views sv ON t.id = sv.team_id
GROUP BY t.id, t.name
ORDER BY members DESC, diagrams DESC
LIMIT 10;
```

## ⚠️ Troubleshooting  

### **Common Issues**

**Issue: RLS policies blocking access**
```sql
-- Temporarily disable RLS for debugging
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
```

**Issue: Foreign key constraints**  
```sql
-- Check for orphaned references
SELECT COUNT(*) FROM diagrams WHERE user_id NOT IN (SELECT id FROM auth.users);
SELECT COUNT(*) FROM saved_views WHERE user_id NOT IN (SELECT id FROM auth.users);
```

**Issue: Duplicate team names**
```sql
-- Find duplicate team names  
SELECT name, COUNT(*) as count 
FROM teams 
GROUP BY name 
HAVING COUNT(*) > 1;
```

## 🚀 Success Criteria

### **Foundation (APPLY_041)**
- [ ] All tables created without errors
- [ ] All indexes created successfully  
- [ ] RLS policies applied correctly
- [ ] Verification queries pass

### **Migration (APPLY_042)**  
- [ ] Every user has a personal team
- [ ] All diagrams assigned to teams
- [ ] Shared diagrams converted to team collaborations
- [ ] No data loss during migration

### **RPC Functions (APPLY_043)**
- [ ] All 6 functions created successfully
- [ ] Functions return expected data structures
- [ ] Permissions working correctly
- [ ] Error handling working for invalid inputs

## 📈 Performance Testing

### **Large Dataset Testing**
```sql
-- Test with many teams/members
SELECT 
    COUNT(*) as total_teams,
    AVG(member_count) as avg_members_per_team,
    MAX(member_count) as max_members_per_team
FROM (
    SELECT t.id, COUNT(tm.id) as member_count
    FROM teams t
    LEFT JOIN team_members tm ON t.id = tm.team_id AND tm.status = 'active'
    GROUP BY t.id
) team_stats;
```

---

**Testing Timeline:** 2-3 hours  
**Prerequisites:** Backup database before migration  
**Rollback Plan:** Restore from backup if critical issues occur