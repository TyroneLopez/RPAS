# RPAS Service Tracker

### Aldersgate College Inc. — Research Planning and Analytic Services

A web-based service tracking system for students and researchers to submit and monitor the progress of their research service requests.

---

## 🗂️ File Structure

```
rpas/
├── index.html                      ← Login page
├── admin.html                      ← Admin dashboard
├── analyst.html                    ← Data Analyst dashboard
├── researcher.html                 ← Researcher/Student dashboard
├── messages.html                   ← Full messaging inbox (all roles)
├── auth.js                         ← Shared auth helpers (ROOT only)
├── assets/
│   ├── css/style.css               ← Global styles (ACI brand colors)
│   └── js/
│       └── supabase.js             ← Supabase client config ⚠️ EDIT THIS
├── supabase-setup.sql              ← Run FIRST
├── phase1-updates.sql              ← Run SECOND
├── researcher-profile-fields.sql   ← Run THIRD
├── rpas-migration.sql              ← Run FOURTH (full schema, all phases)
├── SYSTEM_MANUAL.md                ← AI chatbot knowledge base
├── ROADMAP.md                      ← Feature log and future plans
└── README.md
```

> ⚠️ **CRITICAL — Script tags:** Every HTML file must have these three in order:
>
> ```html
> <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
> <script src="assets/js/supabase.js"></script>
> <script src="auth.js"></script>
> ```
>
> Never use `../assets/` — all HTML is at root.

---

## 🚀 Setup Instructions

### STEP 1 — Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Edit `assets/js/supabase.js` with your Project URL and Anon Key
3. Run SQL files in order (SQL Editor):
   - `supabase-setup.sql`
   - `phase1-updates.sql`
   - `researcher-profile-fields.sql`
   - `rpas-migration.sql`
4. Storage → New Bucket → name: `attachments` → Public ✅

### STEP 2 — Google OAuth

1. Supabase → Authentication → Providers → Google → Enable
2. [console.cloud.google.com](https://console.cloud.google.com) → OAuth 2.0 Client ID
   - Redirect URI: `https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback`
3. Supabase → Auth → URL Configuration:
   - Site URL: `https://tyronelopez.github.io/rpas/`
   - Redirect URLs: `https://tyronelopez.github.io/rpas/`

### STEP 3 — Realtime

Supabase → Database → Replication → enable: `service_requests`, `notifications`, `messages`

### STEP 4 — Deploy to GitHub Pages

Push all files to `https://github.com/TyroneLopez/rpas` → Settings → Pages → root

### STEP 5 — First Admin

```sql
update public.profiles
set role = 'admin', status = 'approved', is_super_admin = true
where email = 'tyrone03.lopez@aldersgate.edu.ph';
```

### STEP 6 — n8n Chatbot (Alder) — after VPS is ready

See n8n setup section below.

---

## 👥 User Roles

| Role                      | Access                                                                          |
| ------------------------- | ------------------------------------------------------------------------------- |
| **Researcher**            | Submit requests, track progress, edit profile, message analyst, chat with Alder |
| **Data Analyst**          | View assigned requests, update status, upload results, message researcher       |
| **Admin**                 | Full access — manage requests, assign analysts, manage users                    |
| **Adviser** _(Phase 2.1)_ | Track linked submissions, leave comments, accept/reject researcher link         |

---

## 📋 Services

- Quantitative Data Analysis
- Qualitative Data Analysis
- Questionnaire Validation
- Reliability Test
- Manuscript Review
- Research Consultation

---

## 📊 Status Flow

`Submitted` → `Under Review` → `In Progress` → `For Revision` → `Completed`

Can be `Cancelled` at any point by admin.

---

## ✅ Implemented Features

### 🔔 Notification Bell (All Dashboards)

- Facebook-style dropdown panel — unread badge, mark all read, realtime
- × button deletes notification from Supabase immediately
- **Functions:** `renderNotifPanel`, `handleNotifClick`, `deleteNotif`, `markAllRead`, `refreshNotifCount`

### 💬 Message Icon + Messaging System (All Dashboards)

- Message icon in navbar next to bell — shows unread count badge
- Click opens mini popup with latest conversations and preview
- Click any conversation → floating chat bubble for that request
- "View all" → `messages.html` (full inbox)
- **messages.html tabs:** My Requests | RPAS Office | Ask Alder
- **Functions:** `loadMessagePreview`, `openMiniChat`, `sendMessage`

### 🦁 Alder the Lion — AI Chatbot

- Floating animated bubble fixed bottom-right on ALL pages
- CSS animated lion face (idle bounce, talking state)
- Personality: casual but knowledgeable — ACI campus guide
- Answers FAQs, checks request status, escalates to admin
- **Backend:** n8n on Hostinger VPS KVM2
- **AI:** Gemini (primary) → OpenAI (fallback)
- **Knowledge base:** `SYSTEM_MANUAL.md` + Alder persona system prompt
- **Embeddings:** Supabase pgvector (planned — for semantic search)

### 👤 User Profile Editing (All Dashboards)

- Edit name, contact number, profile photo (Supabase Storage)
- **Functions:** `openProfileModal`, `saveProfile`, `previewAvatar`

### 🧑‍🎓 Researcher Extended Profile

- Sex, Level, Department, Program — cascading dropdowns locked to ACI data
- Blocks submission if incomplete — yellow sidebar warning
- **SQL:** `researcher-profile-fields.sql`
- **Functions:** `updateProfileDeptOptions`, `updateProfileProgOptions`
- **NOTE:** Adviser is a separate role — NOT a profile field

### 📧 Email Notifications

- Resend.com + Supabase Edge Function (`send-email`)
- **Setup:** `EMAIL-SETUP.md`

### 🔒 Security / RLS

- All tables RLS-enabled
- Helper functions: `get_my_role()`, `is_approved_admin()`, `is_super_admin()`

---

## 🤖 n8n Chatbot Setup (Hostinger VPS KVM2)

### Install n8n on VPS

```bash
# SSH into your VPS, then:
npm install -g n8n
# Or with Docker:
docker run -d --name n8n -p 5678:5678 n8nio/n8n
```

### n8n Workflow Structure

1. **Webhook trigger** — receives POST from RPAS chat bubble
2. **Intent router** — classifies: FAQ / status_check / notify_admin
3. **FAQ route** → Gemini API (with SYSTEM_MANUAL as context)
4. **Status check route** → Query Supabase → Gemini API (with data)
5. **Notify admin route** → Insert Supabase notification + Resend email
6. **Fallback** — if Gemini fails → OpenAI API

### Environment variables needed in n8n

```
GEMINI_API_KEY=
OPENAI_API_KEY=
SUPABASE_URL=https://wkgacywvsndwiezqdcxj.supabase.co
SUPABASE_SERVICE_KEY=
RESEND_API_KEY=
RPAS_ADMIN_EMAIL=rpas@aldersgate.edu.ph
N8N_WEBHOOK_URL=https://your-vps-ip:5678/webhook/rpas-chat
```

---

## 🎨 Brand Colors

- **Golden Yellow:** `#F5C200`
- **Dark Green:** `#1A6B30`
- **White:** `#FFFFFF`

---

## 🐛 Troubleshooting

| Problem                 | Cause                            | Fix                                        |
| ----------------------- | -------------------------------- | ------------------------------------------ |
| Dashboard stuck loading | `sb is not defined` — wrong path | `src="assets/js/supabase.js"` (no `../`)   |
| Auth not working        | `auth.js` missing                | Add `<script src="auth.js"></script>`      |
| Alder not responding    | n8n webhook down                 | Check VPS, restart n8n service             |
| Messages not loading    | Realtime not enabled             | Supabase → Replication → enable `messages` |
| Notification × missing  | `deleteNotif` function absent    | Check dashboard JS for the function        |
