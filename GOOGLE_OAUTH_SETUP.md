# Google OAuth 2.0 Setup & Testing Guide

## ✅ IMPLEMENTATION COMPLETE

All code changes have been implemented in your codebase. Follow this guide to get it working locally and deploy to Vercel.

---

## 📋 Quick Checklist

- [ ] Get Google Client ID from Google Cloud Console
- [ ] Update `.env` file with Google Client ID
- [ ] Run database migration
- [ ] Whitelist authorized admin emails
- [ ] Install npm dependencies
- [ ] Test locally
- [ ] Deploy to Vercel

---

## 🔧 STEP 1: Google Cloud Console Setup

### 1.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a Project"** → **"New Project"**
3. Name: `Nilgiri House Admin`
4. Click **Create** and wait

### 1.2 Enable Google Identity Services

1. Go to **APIs & Services** → **Library**
2. Search for **"Google Identity Services"**
3. Click it → **Enable**

### 1.3 Create OAuth 2.0 Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Choose **"Web application"**
4. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:5173
   http://localhost:3000
   ```
5. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   ```
6. Click **Create**
7. **Copy your Client ID** - you'll need it immediately

---

## 🔐 STEP 2: Update Environment Variables

In your `.env` file, replace `YOUR_GOOGLE_CLIENT_ID_FROM_GCP_CONSOLE` with the actual Client ID from Step 1.3:

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
GOOGLE_CLIENT_ID=YOUR_ACTUAL_CLIENT_ID_HERE
```

**Example:**
```env
VITE_GOOGLE_CLIENT_ID=123456789-abc1def2ghi3jkl4mno5pqr6stu7vwx.apps.googleusercontent.com
GOOGLE_CLIENT_ID=123456789-abc1def2ghi3jkl4mno5pqr6stu7vwx.apps.googleusercontent.com
```

---

## 💾 STEP 3: Database Migration

Run the migration to add OAuth support to your database:

### Option A: Via Supabase Dashboard (Recommended for Testing)

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Click **"New Query"**
5. Copy and paste the SQL from: `supabase/migrations/006_add_google_oauth_support.sql`
6. Click **Run**

### Option B: Via Migrations (Production)

```bash
# Supabase CLI (if installed)
supabase migration up
```

---

## 👥 STEP 4: Whitelist Admin Emails

After running the migration, add your authorized admin emails to the `allowed_oauth_emails` table.

### Via Supabase Dashboard

1. Go to **SQL Editor** → **New Query**
2. Run this SQL (replace emails with your actual admin emails):

```sql
INSERT INTO allowed_oauth_emails (email, role) VALUES
  ('admin1@gmail.com', 'secretary'),
  ('admin2@gmail.com', 'webadmin'),
  ('admin3@gmail.com', 'secretary'),
  ('admin4@gmail.com', 'club')
ON CONFLICT (email) DO NOTHING;
```

3. Click **Run**

---

## 📦 STEP 5: Install Dependencies

### Frontend + API Dependencies

```bash
# From project root
npm install

# API dependencies
cd api
npm install

# Backend dependencies
cd ../backend
npm install

# Back to root
cd ..
```

---

## 🚀 STEP 6: Test Locally

### Option A: Vercel API (Recommended)

```bash
# From project root
npm run dev
```

This starts:
- Frontend: `http://localhost:5173`
- Vercel dev mode: Simulates serverless functions

### Option B: Express Backend

```bash
# From project root
npm run dev  # Terminal 1 - Frontend

# In another terminal
cd backend
npm run dev  # Terminal 2 - Express backend
```

---

## ✔️ STEP 7: Test Google OAuth Login

1. Open `http://localhost:5173/login` in your browser
2. Click **"Sign in with"** Google button
3. Choose your Google account (must be whitelisted)
4. You should see:
   - ✅ "Welcome back!" success message
   - 🎉 Confetti animation
   - Redirect to `/admin` dashboard
5. Verify localStorage contains `token`:
   ```javascript
   // In browser console
   localStorage.getItem('token')  // Should return JWT token
   ```

### ❌ Troubleshooting Login Issues

**"Email not authorized" error:**
- Email not in `allowed_oauth_emails` table
- Run the INSERT query from Step 4

**"Invalid Google token" error:**
- Check `VITE_GOOGLE_CLIENT_ID` matches Google Cloud Console
- Verify `http://localhost:5173` is in Authorized Origins

**Blank page after clicking Google:**
- Check browser console for errors (F12)
- Verify GOOGLE_CLIENT_ID environment variable is set
- Check `api/index.ts` has the Google route registered

---

## 🌐 STEP 8: Deploy to Vercel

### 8.1 Add Environment Variables to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `nilgiri-redesign-main` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | Your Client ID from Step 1.3 |
| `SUPABASE_URL` | Your Supabase URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Service Role Key |
| `JWT_SECRET` | Your JWT secret |

4. Click **Save**

### 8.2 Update Google Cloud Console

Add your Vercel production URL to authorized origins:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Go to **APIs & Services** → **Credentials**
3. Select your OAuth client
4. Add under **Authorized JavaScript origins**:
   ```
   https://your-vercel-project.vercel.app
   ```
5. Add under **Authorized redirect URIs**:
   ```
   https://your-vercel-project.vercel.app/auth/callback
   ```
6. Click **Save**

### 8.3 Deploy to Vercel

```bash
# From project root
git add .
git commit -m "Add Google OAuth 2.0 authentication"
git push origin main
```

Vercel auto-deploys on push to `main` branch.

---

## 📁 Files Changed/Created

### Created Files
- `api/_handlers/auth/google.ts` - Vercel OAuth handler
- `backend/routes/auth-google.js` - Express OAuth handler  
- `supabase/migrations/006_add_google_oauth_support.sql` - Database migration

### Modified Files
- `api/index.ts` - Added Google OAuth route
- `src/pages/Login.jsx` - Added Google login button & handlers
- `src/main.jsx` - Added GoogleOAuthProvider wrapper
- `backend/server.js` - Added Google OAuth route
- `package.json` - Added @react-oauth/google
- `api/package.json` - Added google-auth-library
- `backend/package.json` - Added google-auth-library
- `.env` - Added Google OAuth variables

---

## 🔐 Security Considerations

### ✅ What's Secure
- Google token verification on backend
- Email whitelist prevents unauthorized access
- JWT tokens expire in 7 days
- Passwords optional (OAuth only)
- No tokens stored in cookies (localStorage with HTTPS in prod)

### ⚠️ What to Fix Before Production

1. **Enable HTTPS only**
   - Deploy to Vercel (automatic)
   - Use `secure` flag for cookies

2. **Implement logout token blacklist**
   - Current: Logout only clears localStorage
   - Token remains valid for 7 days

3. **Add rate limiting**
   - Prevent brute force on `/auth/google`

4. **Audit admin_users table**
   - Who has access to what data?
   - Implement proper RLS policies

5. **Remove hardcoded JWT_SECRET fallback**
   - `api/_handlers/utils/auth.ts` line 6
   - Always require env variable

---

## 🧪 Testing Scenarios

### Test Case 1: Authorized User
- Email in `allowed_oauth_emails` table
- Expected: ✅ Login successful

### Test Case 2: Unauthorized User  
- Email NOT in whitelist
- Expected: ❌ "Email not authorized" error

### Test Case 3: Token Expiry
- Login → Wait 7+ days (or mock in dev)
- Try accessing `/admin`
- Expected: Redirect to `/login`

### Test Case 4: Multiple Accounts
- Login with account A
- Logout
- Login with account B
- Expected: Each gets their own JWT, proper role

---

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "VITE_GOOGLE_CLIENT_ID is not defined" | Missing in .env | Add to `.env` file and restart `npm run dev` |
| Blank page on login button click | Frontend/backend mismatch | Check console errors, verify API route exists |
| "Email not authorized" | Email not whitelisted | Run INSERT into `allowed_oauth_emails` |
| 500 error on /auth/google | Server-side error | Check backend logs, verify Supabase connection |
| Token doesn't persist | localStorage issue | Check browser privacy settings |

---

## 📞 Support

If you encounter issues:

1. **Check browser console** (F12 → Console)
2. **Check server logs** (Terminal where you ran `npm run dev`)
3. **Verify Supabase connection** - SQL Editor should work
4. **Verify Google Client ID** - Compare with Google Cloud Console
5. **Check .env file** - All variables present and correct

---

## ✅ Local Testing Checklist

- [ ] Frontend starts: `http://localhost:5173`
- [ ] Can click "Sign in with Google" button
- [ ] Google popup appears
- [ ] After selecting account, redirected to `/admin`
- [ ] `/admin` page loads (admin dashboard)
- [ ] localStorage contains valid JWT token
- [ ] Admin user created in database on first login
- [ ] Logging out clears token
- [ ] Can login again with same account

---

## 🎉 Next Steps

1. Test locally thoroughly
2. Deploy to Vercel
3. Update Google Cloud Console with production URL
4. Test in production
5. Implement security improvements (token blacklist, rate limiting)

Good luck! 🚀
