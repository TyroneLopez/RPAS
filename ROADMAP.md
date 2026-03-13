# RPAS — Future Updates Roadmap

### Aldersgate College Inc. — Research Planning and Analytic Services

_Last updated: March 2026_

---

## 🗺️ Overview

| Phase       | Name                | Focus                                                   | Status         |
| ----------- | ------------------- | ------------------------------------------------------- | -------------- |
| **Phase 1** | Core Enhancements   | Notifications, profiles, email, security                | 🟡 In Progress |
| **Phase 2** | Researcher Upgrades | Group research, appointments, analyst profiles, payment | ⬜ Pending     |
| **Phase 3** | Analyst Upgrades    | Specialization, workload grabbing, declination          | ⬜ Pending     |
| **Phase 4** | Admin Power Tools   | Super admin, fees management, export reports            | ⬜ Pending     |
| **Phase 5** | Payment System      | Full payment dashboard, honoraria tracking              | ⬜ Pending     |
| **Phase 6** | Communication Hub   | Notification popups, direct chat, AI chatbot            | ⬜ Pending     |

---

## 📦 Phase 1 — Core Enhancements

_Status: 🟡 Mostly done — 1 item skipped for now_

### 1.1 Notification Bell Popup ✅ DONE

- Facebook-style dropdown panel on bell click
- Unread count badge, mark all read, dismiss (×) per notification
- Deep-links to relevant section on click
- Affects all 3 roles

### 1.2 User Profile Editing ✅ DONE

- Edit display name, contact number, profile photo
- Photo uploaded to Supabase Storage (avatars/)
- Sidebar updates immediately on save
- Affects all 3 roles

### 1.3 Email Notifications ✅ DONE (pending SMTP testing)

- Resend.com + Supabase Edge Function set up
- Triggers: account approved/rejected, status change, new assignment, new message, new user registration
- `auth.js` contains all notification helper functions
- Edge Function: `supabase/functions/send-email/index.ts`
- ⚠️ Needs real-world testing once Edge Function is deployed

### 1.4 Email Verification on Registration ⏭️ SKIPPED (for now)

- Skipped due to email delivery issues during testing
- Supabase "Confirm email" is currently OFF
- Can be re-enabled later when SMTP is fully verified
- **To re-enable:** Supabase Dashboard → Auth → Providers → Email → toggle ON "Confirm email"

### 1.5 Security Review & Hardening ✅ DONE

- RLS policies hardened with `is_approved_admin()` helper
- `get_my_role()` security definer function in place
- `phase1-updates.sql` ready to run in Supabase SQL Editor

---

## 🐛 Known Bugs Fixed (Session Log)

_All fixes applied — push the final files from chat_

| Bug                                                        | Fix                                                                                    |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `SyntaxError: Unexpected string` — dashboard stuck loading | `don't` apostrophe inside single-quoted JS string → `don&#39;t`                        |
| `toggleNotifPanel is not defined`                          | Caused by syntax error crashing script before functions loaded                         |
| `switchTab is not defined`                                 | Same root cause as above                                                               |
| `sb is not defined` on GitHub Pages                        | `../assets/js/supabase.js` → `assets/js/supabase.js`                                   |
| Dashboard stuck on "Loading..." after logout+login         | Malformed `.channel()` subscription crashing `loadAll()`                               |
| Redirect loop / blinking on login                          | `onAuthStateChange` + `getSession()` both redirecting — fixed with `authHandled` guard |
| `auth.js` not loading on GitHub Pages                      | Missing script tag + duplicate inline functions conflicting                            |
| Notification `×` dismiss button missing                    | Re-added `dismissNotif()` function and button to all 3 dashboards                      |

---

## 📦 Phase 2 — Researcher Upgrades ⬜ PENDING

### 2.1 Group Research & Collaboration

- Group leader invites co-researchers by email
- Members track only, leader controls submission
- Research Adviser sub-role (optional approval gate)
- **New DB:** `research_groups`, `group_members`

### 2.2 Research Consultation Appointment Booking

- Extra form when Research Consultation is selected
- Preferred date/time, mode (online/face-to-face), agenda
- Feedback gate before next booking allowed
- **New DB:** `appointments`, `feedback_forms`

### 2.3 Preferred Analyst Selection with Profile Viewing

- Researcher picks preferred analyst from directory
- Analyst accepts/declines → admin final approval
- Compatibility badges (✓ Compatible / ⚠ Outside Specialization)

### 2.4 Payment Submission (OR Upload)

- Two checkpoints: before processing + before completion
- Upload OR photo, amount, OR number
- Payment status: Unpaid → Submitted → Verified / Rejected
- **New DB:** `payments`

---

## 📦 Phase 3 — Analyst Upgrades ⬜ PENDING

### 3.1 Analyst Specialization Types

- Qualitative / Quantitative / Mixed
- Shown on profile cards and assignment dropdowns
- **New DB field:** `profiles.specialization`

### 3.2 Request Declination by Analyst

- Decline with written reason → admin notified → request reassigned

### 3.3 Workload Transfer Between Analysts

- Flag for transfer → volunteer → admin approves
- **New DB:** `transfer_requests`

### 3.4 Open Request Pool

- Unassigned requests visible to matching analysts
- Express Interest → admin approves assignment

---

## 📦 Phase 4 — Admin Power Tools ⬜ PENDING

### 4.1 Super Admin Protection

- `is_super_admin` boolean flag — set once in Supabase
- RLS-enforced: cannot be deleted, downgraded, or deactivated by other admins
- **SQL to run:**

```sql
alter table public.profiles add column if not exists is_super_admin boolean default false;
update public.profiles set is_super_admin = true where email = 'tyrone03.lopez@aldersgate.edu.ph';
```

### 4.2 Flexible Service Fees Management

- Super Admin sets fees per service type from dashboard
- Fee history audit log
- **New DB:** `service_fees`, `fee_history`

### 4.3 Export Reports

- Excel (.xlsx) and PDF exports
- Report types: Status, Payment/Honoraria, User Activity, Analyst Workload, Consultation Feedback
- Filterable by date range, service type, status, analyst

---

## 📦 Phase 5 — Payment System (Full) ⬜ PENDING

### 5.1 Payment Dashboard (Admin)

- Dedicated Payments tab, OR photo lightbox, verify/reject with reason

### 5.2 Payment Status Tracking (Researcher)

- Inline payment badge on request card, resubmit if rejected

---

## 📦 Phase 6 — Communication Hub ⬜ PENDING

### 6.1 Full Notification System Upgrade

- Notification grouping, browser push notifications, notification preferences

### 6.2 Floating Chat Bubble

- Multi-tab: Analyst Chat / RPAS Admin / AI Assistant
- Unread badge, full history in Supabase messages table

### 6.3 AI Chatbot Integration

- Claude API (Anthropic) — FAQ, service guidance, status checks via natural language
- Escalates to human admin if unanswered

---

## 🗓️ Recommended Next Steps

```
Phase 1 remaining:
  → Run phase1-updates.sql in Supabase ⚠️ (contact_number column + RLS)
  → Test email notifications end-to-end
  → Re-enable email verification when ready

Then:
  → Phase 3.1 (analyst specialization) — needed before Phase 2.3
  → Phase 3.2 (request declination)
  → Phase 2.1 (group research)
  → Phase 2.2 (consultation booking)
  → Phase 4 (admin power tools)
  → Phase 2.3 + 2.4 (analyst selection + payment)
  → Phase 3.3 + 3.4 (transfer + open pool)
  → Phase 5 (full payment system)
  → Phase 6 (communication hub)
```

---

## 🗃️ New Database Tables & Fields Needed

| Table / Field             | Phase     | Purpose                                          |
| ------------------------- | --------- | ------------------------------------------------ |
| `profiles.is_super_admin` | 4.1       | Super Admin protection flag                      |
| `profiles.specialization` | 3.1       | Analyst type: qualitative / quantitative / mixed |
| `research_groups`         | 2.1       | Group research submissions                       |
| `group_members`           | 2.1       | Members and roles per group                      |
| `appointments`            | 2.2       | Consultation schedules                           |
| `feedback_forms`          | 2.2       | Post-consultation feedback                       |
| `payments`                | 2.4 / 5   | OR uploads, verification status                  |
| `service_fees`            | 4.2       | Current fee per service type                     |
| `fee_history`             | 4.2       | Fee change audit log                             |
| `analyst_profiles`        | 2.3 / 3.1 | Bio, portfolio per analyst                       |
| `transfer_requests`       | 3.3       | Workload transfer requests                       |

---

_This roadmap is a living document updated as features are built._
_Maintained by: Tyrone Marcial Lopez — RPAS, Aldersgate College Inc._
