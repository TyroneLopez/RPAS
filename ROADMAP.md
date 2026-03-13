# RPAS — System Roadmap & Feature Log

### Aldersgate College Inc. — Research Planning and Analytic Services

_Last updated: March 2026_

---

## ✅ COMPLETED FEATURES (Current Build)

### Phase 1.1 — Notification Bell ✅

- Facebook-style dropdown panel on all 3 dashboards
- Unread count badge, mark all as read, realtime updates
- **× delete button** on each notification — deletes from Supabase immediately
- `deleteNotif(id)` function present in `admin.html`, `analyst.html`, `researcher.html`
- Do NOT remove: `renderNotifPanel`, `handleNotifClick`, `deleteNotif`, `markAllRead`, `refreshNotifCount`

### Phase 1.2 — User Profile Editing ✅

- Edit name, contact number, profile photo on all 3 dashboards
- Photo stored in Supabase Storage (`attachments` bucket, `avatars/` folder)
- SQL required: `phase1-updates.sql` (adds `contact_number` column)
- Do NOT remove: `openProfileModal`, `saveProfile`, `previewAvatar`

### Phase 1.2b — Researcher Extended Profile ✅

- Sex, Level, Department, Program/Course fields on researcher profile
- Cascading dropdowns locked to ACI data (College / Basic Education → dept → program)
- Blocks request submission if Level, Department, or Program are empty
- Yellow sidebar warning if profile incomplete
- Admin sees these fields in the Manage Request modal
- SQL required: `researcher-profile-fields.sql` (adds `sex`, `level`, `department`, `program`)
- Do NOT remove: `DEPT_MAP`, `PROG_MAP`, `updateProfileDeptOptions`, `updateProfileProgOptions`
- **NOTE:** Adviser is intentionally NOT here — it will be a proper role in Phase 2.1

### Phase 1.3 — Email Notifications ✅

- Resend.com + Supabase Edge Function (`send-email`)
- Triggers on account events, status changes, assignments, messages
- Setup guide: `EMAIL-SETUP.md`
- Do NOT remove: `sendEmail()` in `auth.js`, `sendEmailNotification()` in `admin.html`

### Phase 1.4 — Email Verification ⏭️ SKIPPED

- Google OAuth handles verification automatically
- Re-enable if non-Google login is added in the future

### Phase 1.5 — Security / RLS Hardening ✅

- RLS policies on all tables, `get_my_role()` and `is_approved_admin()` helper functions
- SQL required: `phase1-updates.sql`

### Bug Fixes Applied ✅

- Fixed `../assets/js/supabase.js` path → `assets/js/supabase.js` in all HTML files
- Added missing `<script src="auth.js"></script>` to `admin.html`, `researcher.html`, `index.html`
- Fixed redirect loop on login with `authHandled` guard flag in `index.html`
- Fixed broken channel subscription in `admin.html` (split `.on()` calls)
- Fixed apostrophe `don't` syntax error that crashed all dashboards

---

## 🗺️ Phases Overview

| Phase       | Name                           | Status      |
| ----------- | ------------------------------ | ----------- |
| **Phase 1** | Core Enhancements              | ✅ Complete |
| **Phase 2** | Researcher Upgrades            | 🔜 Planned  |
| **Phase 3** | Analyst Upgrades               | 🔜 Planned  |
| **Phase 4** | Admin Power Tools              | 🔜 Planned  |
| **Phase 5** | Payment System                 | 🔜 Planned  |
| **Phase 6** | Communication Hub + AI Chatbot | 🔜 Planned  |

---

## 📦 Phase 2 — Researcher Upgrades

### 2.1 Adviser Role & Dashboard 🔜

- Adviser is a **separate role** with their own dashboard — NOT a text field in researcher profile
- Researcher selects an adviser from a list when submitting a request
- Adviser receives a notification and **accepts or rejects** the link
- Adviser can track all linked submissions, view status timelines, leave comments
- Same pattern as analyst assignment but researcher-initiated
- **New DB:** adviser role in `profiles`, adviser relationship on `service_requests`
- **Affects:** Researcher (submission form), new Adviser dashboard, Admin

### 2.2 Group Research & Collaboration 🔜

- Group leader invites co-researchers by email on submission
- Members can track progress, view messages, upload files (read-only)
- Only group leader can edit submission and message analyst
- **New DB tables:** `research_groups`, `group_members`

### 2.3 Research Consultation Appointment Booking 🔜

- Extra appointment form when Research Consultation is selected
- Preferred date/time, mode (Online/Face-to-Face), agenda
- Admin confirms or proposes alternative schedule
- Feedback gate after completion before next booking
- **New DB tables:** `appointments`, `feedback_forms`

### 2.4 Preferred Data Analyst Selection 🔜

- Researcher views analyst public profile (specialization, workload, bio)
- Researcher selects preferred analyst → analyst accepts/declines → admin approves
- Falls back to open pool if declined or no action taken
- Requires Phase 3.1 (specialization) to be done first

### 2.5 Payment Submission (OR Upload) 🔜

- Two payment checkpoints: before processing and before completion
- Researcher uploads OR photo, amount, OR number
- Payment status: Unpaid → Submitted → Verified → Rejected
- **New DB table:** `payments`

---

## 📦 Phase 3 — Analyst Upgrades

### 3.1 Analyst Specialization Types 🔜

- Three types: Qualitative, Quantitative, Mixed
- Set by admin during onboarding
- Shown on public profile and in admin assignment dropdown
- Compatible analysts highlighted when researcher browses
- **New DB field:** `specialization` on `profiles`
- **Must be done before Phase 2.4**

### 3.2 Request Declination by Analyst 🔜

- Analyst can decline a newly assigned request with a written reason
- Admin notified, request returns to unassigned
- Researcher notified of reassignment (reason not shown)
- Declination logged in request timeline

### 3.3 Workload Transfer Between Analysts 🔜

- Analyst flags request for transfer with reason
- Compatible analysts see it in "Available to Take" section
- Volunteer analyst → Admin approves → context and files transferred
- **New DB table:** `transfer_requests`

### 3.4 Open Request Pool 🔜

- Unassigned requests visible to compatible analysts
- Analyst clicks "Express Interest" → Admin reviews and assigns

---

## 📦 Phase 4 — Admin Power Tools

### 4.1 Super Admin Protection 🔜

- One `is_super_admin` flag in `profiles` — set manually in Supabase
- Cannot be deleted, demoted, or deactivated by other admins — enforced at RLS level
- Only Super Admin can promote/demote others, change fees, view audit logs

```sql
alter table public.profiles add column if not exists is_super_admin boolean default false;
update public.profiles set is_super_admin = true where email = 'tyrone03.lopez@aldersgate.edu.ph';
```

### 4.2 Flexible Service Fees Management 🔜

- Super Admin sets fees per service type from the dashboard
- Previous rates preserved in `fee_history` for audit
- **New DB tables:** `service_fees`, `fee_history`

### 4.3 Export Reports 🔜

- Excel (.xlsx) and PDF exports
- Types: Research Status, Payment & Honoraria, User Activity, Analyst Workload, Consultation Feedback
- Filterable by date range, service type, status, analyst

---

## 📦 Phase 5 — Payment System (Full)

### 5.1 Payment Dashboard (Admin) 🔜

- Dedicated Payments tab — view by status, verify/reject with OR lightbox
- Running totals per analyst for honoraria computation

### 5.2 Payment Status Tracking (Researcher) 🔜

- Inline payment badge on request detail card
- Notifications on every payment status change

---

## 📦 Phase 6 — Communication Hub

### 6.1 Full Notification System Upgrade 🔜

- Notification grouping by request, browser push notifications, user preferences

### 6.2 Floating Chat Bubble 🔜

- Persistent bottom-right bubble on all pages
- Tabs: Analyst Chat, RPAS/Admin, AI Assistant
- Unread badge on bubble

### 6.3 AI Chatbot Integration 🔜

- Embedded in chat bubble
- Answers FAQs, guides service selection, checks request status via natural language
- **Planned: Claude API (Anthropic)**
- Escalates to human admin if it cannot answer
- `SYSTEM_MANUAL.md` will be fed to the chatbot as its knowledge base

---

## 🗓️ Recommended Implementation Order

```
Phase 1 ✅ Complete
  → Phase 3.1 (Analyst Specialization) — needed before Phase 2.4
    → Phase 3.2 (Analyst Declination)
      → Phase 2.1 (Adviser Role + Dashboard)
        → Phase 2.2 (Group Research)
          → Phase 2.3 (Consultation Booking)
            → Phase 4 (Admin Power Tools)
              → Phase 2.4 + 2.5 (Analyst Selection + Payment)
                → Phase 3.3 + 3.4 (Transfer + Open Pool)
                  → Phase 5 (Full Payment System)
                    → Phase 6 (Communication Hub + AI Chatbot)
```

---

## 🗃️ Database — All Tables & Fields

### Existing Tables

| Table              | Key Fields                                                                                                            |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `profiles`         | `id`, `email`, `full_name`, `role`, `status`, `avatar_url`, `contact_number`, `sex`, `level`, `department`, `program` |
| `service_requests` | `id`, `researcher_id`, `analyst_id`, `service_type`, `title`, `abstract`, `status`, `attachment_url`                  |
| `request_updates`  | `id`, `request_id`, `status`, `notes`, `created_at`                                                                   |
| `notifications`    | `id`, `user_id`, `message`, `type`, `is_read`, `created_at`                                                           |
| `messages`         | `id`, `request_id`, `sender_id`, `content`, `created_at`                                                              |
| `attachments`      | `id`, `request_id`, `filename`, `url`, `uploaded_by`                                                                  |

### Planned Tables (future phases)

| Table / Field             | Phase | Purpose                                      |
| ------------------------- | ----- | -------------------------------------------- |
| `profiles.is_super_admin` | 4.1   | Super Admin protection flag                  |
| `profiles.specialization` | 3.1   | Analyst type: qualitative/quantitative/mixed |
| `research_groups`         | 2.2   | Group research submissions                   |
| `group_members`           | 2.2   | Members and roles per group                  |
| `appointments`            | 2.3   | Consultation schedules                       |
| `feedback_forms`          | 2.3   | Post-consultation satisfaction               |
| `payments`                | 2.5/5 | OR uploads, amounts, verification            |
| `service_fees`            | 4.2   | Current fee per service type                 |
| `fee_history`             | 4.2   | Audit log of fee changes                     |
| `transfer_requests`       | 3.3   | Workload transfer requests                   |

---

## 💡 Development Rules (Follow Every Session)

- **Always syntax-check JS** before deploying — `node --check` on extracted scripts
- **Never use `../` in asset paths** — all HTML at root, always `assets/js/supabase.js`
- **Always include all 3 script tags** in every HTML file (supabase CDN, supabase.js, auth.js)
- **Adviser is a role, not a text field** — do not add it back to researcher profile
- **Hard refresh (Ctrl+Shift+R)** after every deploy to clear browser cache
- **Test on GitHub Pages** after every push — not just locally

---

_Maintained by: Tyrone Marcial Lopez, LPT, MST — RPAS, Aldersgate College Inc._
