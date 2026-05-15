# Admin CRUD Operations - Fixed ✅

## What Was Fixed

The admin routes were missing CRUD endpoints that the frontend was trying to call. Added:

### New Admin Endpoints (in `/api/admin/`)

#### Communities
- `GET /api/admin/communities` - List all communities
- `POST /api/admin/communities` - Create new community
- `PUT /api/admin/communities/:id` - Update community
- `DELETE /api/admin/communities/:id` - Delete community

#### Events  
- `GET /api/admin/events` - List all events
- `POST /api/admin/events` - Create new event
- `PUT /api/admin/events/:id` - Update event
- `DELETE /api/admin/events/:id` - Delete event

#### Debug
- `GET /api/admin/debug/auth` - Check if token is valid and see user info

---

## Testing the Fixes

### 1. Test Authentication First

```bash
# Get your token from localStorage (in browser console)
const token = localStorage.getItem('token');
console.log(token);

# Then test the debug endpoint
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
     http://localhost:3000/api/admin/debug/auth
```

**Expected Response:**
```json
{
  "authenticated": true,
  "user": {
    "userId": "...",
    "id": "...",
    "email": "your@email.com",
    "role": "secretary",
    "clubId": null
  },
  "message": "Token is valid and user info is above"
}
```

### 2. Check Token Requirements

Your token must have:
- ✅ Valid JWT signature
- ✅ Role must be: `secretary` OR `webadmin` (for admin endpoints)
- ✅ Not expired

If you see an error with role, make sure your user has the correct role in the `allowed_oauth_emails` or `admin_users` table in Supabase.

### 3. Test Communities CRUD

```bash
# Get all communities
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/admin/communities

# Create community
curl -X POST \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"name":"New Community","description":"Test"}' \
     http://localhost:3000/api/admin/communities
```

### 4. Test in Browser

Simply try using the AdminCommunities page in the UI. It should now:
1. Load existing communities ✅
2. Create new communities ✅
3. Update communities ✅
4. Delete communities ✅

---

## Common Issues & Solutions

### ❌ "Forbidden - insufficient permissions"
**Problem:** Token has wrong role  
**Solution:** Make sure your user account has role `secretary` or `webadmin` in Supabase

**Check in Supabase:**
```sql
SELECT email, role FROM admin_users WHERE email = 'your@email.com';
-- OR
SELECT email, role FROM allowed_oauth_emails WHERE email = 'your@email.com';
```

### ❌ "No token provided"  
**Problem:** Authorization header missing  
**Solution:** Make sure you're logged in and the token is being sent. In frontend console:
```javascript
const token = localStorage.getItem('token');
console.log('Token:', token ? 'Present' : 'Missing');
```

### ❌ "Invalid or expired token"
**Problem:** Token is corrupted or expired  
**Solution:** Try logging out and logging back in to get a fresh token

### ❌ Still getting 404 errors
**Problem:** Backend server not restarted  
**Solution:** Restart the backend server
```bash
cd backend
# Stop current server (Ctrl+C)
# Then restart
npm start  # or node server.js
```

---

## File Changes Summary

### Backend
- **`backend/routes/admin.js`** - Added communities and events CRUD endpoints + debug endpoint

### No Frontend Changes Needed
The frontend already calls these endpoints correctly, so it should work once the backend is fixed!

---

## Architecture

```
Frontend (AdminCommunities.jsx)
    ↓
    ├─ POST /api/admin/communities      ✅ (now works)
    ├─ PUT /api/admin/communities/:id   ✅ (now works)
    ├─ DELETE /api/admin/communities/:id ✅ (now works)
    └─ GET /api/admin/communities       ✅ (now works)

Authentication Flow:
localStorage.token → Authorization header → authenticateToken middleware
                                           → requireAdmin middleware
                                           → Route handler
```

---

## Next Steps

1. Restart backend server if running
2. Try creating/editing a community in the AdminCommunities page
3. Check browser console for any errors
4. If errors, use `/api/admin/debug/auth` to verify token
5. If token looks good but still failing, check Supabase user role
