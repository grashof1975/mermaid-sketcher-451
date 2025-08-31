# Schema Reference Directory

## 📋 Purpose
Automated database schema dump generation using Supabase Edge Functions.

## 📁 File Structure
```
schema-reference/
├── dump-schema.bat          ← Main launcher (double-click to use)
├── dump-schema-edge.ps1     ← PowerShell script (calls Edge Function)
├── README.md                ← This documentation
└── YYYYMMDD_sql.txt         ← Generated schema dumps
```

## 🚀 How to Use
1. **Double-click** `dump-schema.bat`
2. Wait for completion message
3. Find generated file: `YYYYMMDD_sql.txt`
4. Schema is automatically copied to clipboard

## 🎯 Generated Content
- Complete database schema in CREATE TABLE format
- Includes `auth.*` and `public.*` tables
- Column definitions with data types, constraints, defaults
- Timestamp header for reference

## ⚙️ Technical Details
- Uses Supabase Edge Function: `super-handler`
- Calls RPC function: `get_database_schema()`
- Requires APPLY_038 and APPLY_039 SQL fixes
- Output format: `YYYYMMDD_sql.txt`

## 🔧 Troubleshooting
- **404 Error**: Edge Function not deployed
- **500 Error**: RPC function missing (re-apply APPLY_038/039)
- **Timeout**: Network issue, retry after few minutes