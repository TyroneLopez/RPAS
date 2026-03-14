# RPAS — System Roadmap & Feature Log

### Aldersgate College Inc. — Research Planning and Analytic Services

_Last updated: March 2026_

---

## ✅ COMPLETED FEATURES

### Phase 1.1 — Notification Bell ✅

- Facebook-style dropdown on all 3 dashboards
- Unread badge, mark all read, realtime, × delete (removes from Supabase)
- Do NOT remove: `renderNotifPanel`, `handleNotifClick`, `deleteNotif`, `markAllRead`, `refreshNotifCount`

### Phase 1.2 — User Profile Editing ✅

- Name, contact, photo on all 3 dashboards
- SQL: `phase1-updates.sql` (adds `contact_number`)
- Do NOT remove: `openProfileModal`, `saveProfile`, `previewAvatar`

### Phase 1.2b — Researcher Extended Profile ✅

- Sex, Level, Department, Program — cascading dropdowns (ACI data only)
- Blocks submission if Level/Department/Program missing
- SQL: `researcher-profile-fields.sql`
- Do NOT remove: `DEPT_MAP`, `PROG_MAP`, `updateProfileDeptOptions`, `updateProfileProgOptions`
- ⚠️ Adviser is intentionally NOT here — it is Phase 2.1 (separate role)

### Phase 1.3 — Email Notifications ✅

- Resend.com + Supabase Edge Function `send-email`
- Do NOT remove: `sendEmail()` in `auth.js`, `sendEmailNotification()` in `admin.html`

### Phase 1.4 — Email Verification ⏭️ Skipped

- Google OAuth handles this automatically

### Phase 1.5 — Security / RLS Hardening ✅

- SQL: `phase1-updates.sql`
- Helper functions: `get_my_role()`, `is_approved_admin()`

### Bug Fixes Applied ✅

- Fixed `..assets/js/supabase.js` → `assets/js/supabase.js` on all files
- Added missing `auth.js` script tag to `admin.html`, `researcher.html`, `index.html`
- Fixed redirect loop on login (`authHandled` guard in `index.html`)
- Fixed broken realtime channel subscription in `admin.html`
- Fixed apostrophe syntax error that crashed all dashboards

### Full Database Schema ✅

- SQL: `rpas-migration.sql` — all 15 tables for all phases
- All RLS policies, helper functions, realtime, triggers included

---

## 🔄 IN PROGRESS

### Phase 6.2a — Message Icon + Mini Popup 🔄

- Message icon in navbar (next to bell) — unread count badge
- Click → mini popup with latest 3 conversations + preview
- Click conversation → floating chat bubble per request
- "View all" → `messages.html`

### Phase 6.2b — messages.html (Full Inbox) 🔄

- New page with its own URL
- 3 tabs: My Requests | RPAS Office | Ask Alder
- Full conversation view per request
- Shared between all roles (each sees only their conversations)

### Phase 6.3 — Alder the Lion AI Chatbot 🔄

- Floating bubble bottom-right, ALL pages, always visible
- CSS animated lion face — idle bounce + talking state
- Personality: casual but knowledgeable (ACI campus guide)
- Backend: n8n on Hostinger VPS KVM2
- AI: Gemini primary → OpenAI fallback
- Knowledge: SYSTEM_MANUAL.md + Alder persona system prompt
- Intent routing: FAQ / status check / escalate to admin
- Waiting on: VPS setup, corporate email `rpas@aldersgate.edu.ph`

---

## 🗺️ Phases Overview

| Phase       | Name                | Status         |
| ----------- | ------------------- | -------------- |
| **Phase 1** | Core Enhancements   | ✅ Complete    |
| **Phase 2** | Researcher Upgrades | 🔜 Planned     |
| **Phase 3** | Analyst Upgrades    | 🔜 Planned     |
| **Phase 4** | Admin Power Tools   | 🔜 Planned     |
| **Phase 5** | Payment System      | 🔜 Planned     |
| **Phase 6** | Communication Hub   | 🔄 In Progress |

---

## 📦 Phase 2 — Researcher Upgrades

### 2.1 Adviser Role & Dashboard 🔜

- Separate role with own dashboard — NOT a text field in researcher profile
- Researcher picks adviser from list on submission
- Adviser accepts or rejects the link
- Adviser tracks linked submissions, leaves comments
- Same pattern as analyst assignment but researcher-initiated
- DB: `adviser` role in `profiles`, `adviser_id` + `adviser_status` on `service_requests` ✅ (columns exist)

### 2.2 Group Research & Collaboration 🔜

- Group leader invites co-researchers by email
- Members: read-only track, view messages, upload files
- DB: `research_groups`, `group_members` ✅ (tables exist)

### 2.3 Research Consultation Appointment Booking 🔜

- Extra form when Research Consultation selected
- Date/time, mode (Online/Face-to-Face), agenda
- Admin confirms or proposes alternative
- Feedback gate after completion
- DB: `appointments`, `feedback_forms` ✅ (tables exist)

### 2.4 Preferred Data Analyst Selection 🔜

- Researcher views analyst profile (specialization, workload, bio)
- Researcher picks → analyst accepts/declines → admin approves
- Requires Phase 3.1 first
- DB: `preferred_analyst_id`, `preferred_status` on `service_requests` ✅ (columns exist)

### 2.5 Payment Submission (OR Upload) 🔜

- Two checkpoints: before processing + before completion
- Researcher uploads OR photo, amount, OR number
- DB: `payments` ✅ (table exists)

---

## 📦 Phase 3 — Analyst Upgrades

### 3.1 Analyst Specialization Types 🔜

- Types: Qualitative / Quantitative / Mixed (set by admin)
- Shown on public profile, filters assignment dropdown
- DB: `specialization` on `profiles` ✅ (column exists)
- ⚠️ Must be done BEFORE Phase 2.4

### 3.2 Request Declination by Analyst 🔜

- Analyst declines assigned request with written reason
- DB: `declination_reason` on `service_requests` ✅ (column exists)

### 3.3 Workload Transfer Between Analysts 🔜

- Analyst flags for transfer → others volunteer → admin approves
- DB: `transfer_requests` ✅ (table exists)

### 3.4 Open Request Pool 🔜

- Unassigned requests visible to compatible analysts
- Analyst expresses interest → admin assigns
- DB: `is_open_pool` on `service_requests` ✅ (column exists)

---

## 📦 Phase 4 — Admin Power Tools

### 4.1 Super Admin Protection 🔜

- One `is_super_admin` flag — set once manually
- DB: `is_super_admin` on `profiles` ✅ (column exists)

```sql
update public.profiles set is_super_admin = true
where email = 'tyrone03.lopez@aldersgate.edu.ph';
```

### 4.2 Flexible Service Fees Management 🔜

- Super Admin sets fees per service from dashboard
- DB: `service_fees`, `fee_history` ✅ (tables exist, seeded with 0)

### 4.3 Export Reports 🔜

- Excel + PDF: Status, Payment/Honoraria, User Activity, Workload, Feedback

---

## 📦 Phase 5 — Payment System (Full)

### 5.1 Payment Dashboard (Admin) 🔜

- Dedicated Payments tab, OR lightbox, verify/reject, honoraria totals
- DB: `payments` ✅

### 5.2 Payment Status Tracking (Researcher) 🔜

- Inline badge per request, resubmit on rejection
- DB: `payments` ✅

---

## 📦 Phase 6 — Communication Hub

### 6.1 Full Notification Upgrade 🔜

- Grouping, browser push, preferences

### 6.2 Message Icon + messaging.html 🔄 In Progress

- Message icon navbar (unread badge)
- Mini popup (latest 3 convos)
- `messages.html` — full inbox, 3 tabs
- Floating chat bubble per request

### 6.3 Alder the Lion AI Chatbot 🔄 In Progress

- Floating bubble, all pages, animated CSS lion face
- n8n on Hostinger VPS KVM2
- Gemini primary → OpenAI fallback → future: Claude API (Anthropic)
- Intent: FAQ / status check / notify admin
- Embeddings: Supabase pgvector (planned for semantic search)
- Waiting on: VPS live, `rpas@aldersgate.edu.ph` corporate email

---

## 🗓️ Build Order

```
Phase 1 ✅
  → Phase 6.2 (messaging) 🔄
    → Phase 6.3 (Alder chatbot) 🔄
      → Phase 3.1 (analyst specialization)
        → Phase 3.2 (declination)
          → Phase 2.1 (adviser role)
            → Phase 2.2 (group research)
              → Phase 2.3 (consultation booking)
                → Phase 4 (admin tools)
                  → Phase 2.4 + 2.5 (analyst selection + payment)
                    → Phase 3.3 + 3.4 (transfer + open pool)
                      → Phase 5 (full payment)
                        → Phase 6.1 (push notifs)
```

---

## 🗃️ Database — Current State

### All Tables ✅ (from rpas-migration.sql)

| Table               | Status                      | Phase                  |
| ------------------- | --------------------------- | ---------------------- |
| `profiles`          | ✅ Live — all columns added | 1, 1.2b, 2.1, 3.1, 4.1 |
| `service_requests`  | ✅ Live — all columns added | 1, 2.1, 2.4, 3.2, 3.4  |
| `request_updates`   | ✅ Live                     | 1                      |
| `notifications`     | ✅ Live                     | 1                      |
| `messages`          | ✅ Live                     | 6.2                    |
| `attachments`       | ✅ Live                     | 1                      |
| `analyst_profiles`  | ✅ Live                     | 2.3, 3.1               |
| `research_groups`   | ✅ Live                     | 2.2                    |
| `group_members`     | ✅ Live                     | 2.2                    |
| `appointments`      | ✅ Live                     | 2.3                    |
| `feedback_forms`    | ✅ Live                     | 2.3                    |
| `payments`          | ✅ Live                     | 2.5, 5                 |
| `service_fees`      | ✅ Live (seeded)            | 4.2                    |
| `fee_history`       | ✅ Live                     | 4.2                    |
| `transfer_requests` | ✅ Live                     | 3.3                    |

### Planned (not yet in DB)

| Item                       | Phase | Notes                                   |
| -------------------------- | ----- | --------------------------------------- |
| pgvector embeddings        | 6.3   | Supabase → Extensions → enable `vector` |
| `chatbot_sessions` table   | 6.3   | Chat history for Alder                  |
| `chatbot_embeddings` table | 6.3   | SYSTEM_MANUAL chunks + vectors          |

---

## 💡 Development Rules

- **Always syntax-check** before deploying — `node --check` on extracted JS
- **Never `../` in asset paths** — all HTML at root, `assets/js/supabase.js`
- **All 3 script tags** in every HTML file (CDN supabase, supabase.js, auth.js)
- **Adviser = role, not a text field** — do not add back to researcher profile
- **Hard refresh** after every deploy (Ctrl+Shift+R)
- **Upload latest files** at the start of every build session

---

_Maintained by: Tyrone Marcial Lopez, LPT, MST — RPAS, Aldersgate College Inc._
