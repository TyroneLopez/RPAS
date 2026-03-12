# RPAS Service Tracker

### Aldersgate College Inc. — Research Planning and Analytic Services

A web-based service tracking system for students and researchers to monitor the progress of their research service requests.

---

## 🗂️ File Structure

```
rpas/
├── index.html                  ← Login page
├── admin/admin.html            ← Admin dashboard
├── analyst/analyst.html          ← Data Analyst dashboard
├── researcher/index.html       ← Researcher/Student dashboard
├── assets/
│   ├── css/style.css           ← Global styles (ACI brand colors)
│   └── js/
│       ├── supabase.js         ← Supabase client config ⚠️ EDIT THIS
│       └── auth.js             ← Shared auth helpers
├── supabase-setup.sql          ← Run this in Supabase SQL Editor
└── README.md
```

---

## 🚀 Setup Instructions

### STEP 1 — Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Note your **Project URL** and **Anon Key** (Settings > API)

### STEP 2 — Configure Supabase credentials

Edit `assets/js/supabase.js`:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_ANON_KEY";
```

### STEP 3 — Run Database Setup

1. Go to Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase-setup.sql`
3. Paste and click **Run**

### STEP 4 — Set up Storage Bucket

1. Supabase Dashboard → Storage → New Bucket
2. Name: `attachments`
3. Toggle: **Public bucket** ✅
4. Click Create

### STEP 5 — Enable Google OAuth

1. Supabase Dashboard → Authentication → Providers → Google
2. Enable Google provider
3. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com):
   - Create a new project
   - APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized redirect URIs: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
4. Copy Client ID and Client Secret back to Supabase
5. In Supabase Auth → URL Configuration:
   - Site URL: `https://YOUR_GITHUB_USERNAME.github.io/rpas/`
   - Redirect URLs: `https://YOUR_GITHUB_USERNAME.github.io/rpas/`

### STEP 6 — Enable Realtime

1. Supabase Dashboard → Database → Replication
2. Enable realtime for: `service_requests`, `notifications`, `messages`

### STEP 7 — Deploy to GitHub Pages

1. Create a new GitHub repository (e.g., `rpas`)
2. Push all files to the repo
3. GitHub → Settings → Pages → Source: **main branch, root folder**
4. Your site will be live at: `https://YOUR_USERNAME.github.io/rpas/`

### STEP 8 — Create First Admin Account

1. Open your deployed site and sign in with your admin Google account
2. Go to Supabase Dashboard → SQL Editor and run:

```sql
update public.profiles
set role = 'admin', status = 'approved'
where email = 'your-admin-email@gmail.com';
```

3. Sign out and sign back in — you'll now have admin access

---

## 👥 User Roles

| Role             | Access                                                                         |
| ---------------- | ------------------------------------------------------------------------------ |
| **Researcher**   | Submit requests, track progress, download results, message analyst             |
| **Data Analyst** | View assigned requests, update status, upload results, message researcher      |
| **Admin**        | Full access — manage all requests, assign analysts, manage users, view reports |

## 📋 Services Tracked

- Quantitative Data Analysis
- Qualitative Data Analysis
- Questionnaire Validation
- Reliability Test
- Manuscript Review
- Research Consultation

## 📊 Status Flow

`Submitted` → `Under Review` → `In Progress` → `For Revision` → `Completed`
(Admin/Analyst can also mark as `Cancelled`)

---

## 🎨 Brand Colors

- **Golden Yellow:** `#F5C200`
- **Dark Green:** `#1A6B30`
- **White:** `#FFFFFF`

---

## ⚠️ Important Notes

- This is a **static site** — all logic runs client-side via Supabase JS SDK
- No server required — Supabase handles auth, database, storage, and realtime
- File uploads go to Supabase Storage (max 20MB per file)
- Realtime updates are enabled — status changes appear instantly

---

## 🐛 Troubleshooting

**Google sign-in not working?**

- Check that your GitHub Pages URL is in Supabase Auth → URL Configuration

**Users stuck on "pending"?**

- Admin must approve each new user via Admin Panel → Pending Users

**Realtime not updating?**

- Check Supabase Dashboard → Database → Replication → tables are enabled

**Files not uploading?**

- Ensure `attachments` bucket exists and is set to **public**
