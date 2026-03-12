# RPAS — Future Updates Roadmap
### Aldersgate College Inc. — Research Planning and Analytic Services
*Last updated: March 2026*

---

## 🗺️ Overview

| Phase | Name | Focus | Est. Complexity |
|---|---|---|---|
| **Phase 1** | Core Enhancements | Notifications, profiles, email, security | Low–Medium |
| **Phase 2** | Researcher Upgrades | Group research, appointments, analyst profiles, payment | Medium |
| **Phase 3** | Analyst Upgrades | Specialization, workload grabbing, declination | Medium |
| **Phase 4** | Admin Power Tools | Super admin, fees management, export reports | Medium |
| **Phase 5** | Payment System | Full payment dashboard, honoraria tracking | Medium–High |
| **Phase 6** | Communication Hub | Notification popups, direct chat, AI chatbot | High |

---

## 📦 Phase 1 — Core Enhancements
*Priority: High — Do these first. Low risk, high impact on current users.*

### 1.1 Notification Bell Popup
- Clicking the 🔔 bell opens a **Facebook-style dropdown panel** (not a new page)
- Shows latest notifications with timestamp and brief message preview
- Clicking any notification **deep-links** the user to the relevant request, message, or page
- Unread count badge on the bell icon
- "Mark all as read" button inside the panel
- **Affects:** All roles

### 1.2 User Profile Editing
- Users can edit their **display name**, **profile photo**, and **contact number**
- Profile photo upload stored in Supabase Storage (avatars bucket)
- Changes reflected in the sidebar avatar and name immediately without page reload
- **Affects:** All roles

### 1.3 Email Notifications
- Automated emails sent via **Supabase built-in email** (free tier, upgradeable to Resend later)
- Triggers:
  - Account registered — "Your account is pending approval from the RPAS admin."
  - Account approved — "Your account has been approved. You may now log in."
  - Account rejected — "Your registration was not approved. Please contact RPAS."
  - Request status changed — notify researcher with new status and notes
  - New request assigned — notify analyst
  - New message received — notify recipient
  - Payment verified or rejected — notify researcher
- **Affects:** All roles

### 1.4 Email Verification on Registration
- Before the account is submitted for admin approval, the user must verify their email address
- Prevents fake, test, or mistyped email registrations
- Supabase handles verification link delivery automatically
- Account shows as unverified until confirmed — admin cannot approve unverified accounts
- **Affects:** All roles (registration flow)

### 1.5 Security Review & Hardening
- Audit and tighten all RLS (Row Level Security) policies across all 6 tables
- Ensure zero data leakage between roles
- Validate all form inputs to prevent injection via Supabase
- Review Supabase Auth settings: session length, token expiry, refresh token rotation
- Enable Supabase Auth Logs monitoring for suspicious login attempts
- **Affects:** Backend / Supabase

---

## 📦 Phase 2 — Researcher Upgrades

### 2.1 Group Research & Collaboration
- When submitting a request, the researcher (group leader) can invite co-researchers by email
- Invited members receive a notification/email and can accept or decline the invitation
- Accepted members can:
  - Track the progress of the shared submission
  - View the full status timeline and analyst notes
  - View messages between leader and analyst
  - Upload supporting documents
- **Group leader only** can edit the submission, send messages to analyst, and resubmit — members are read-only
- **Research Adviser sub-role:**
  - Linked to a group submission by the group leader
  - Can track all linked group submissions
  - Can leave comments visible to the group, analyst, and admin
  - Admin-configurable toggle: Adviser approval can be required before request reaches RPAS
- **New DB tables:** research_groups, group_members
- **Affects:** Researcher, new Adviser sub-role, Admin

### 2.2 Research Consultation Appointment Booking
- When Research Consultation is selected, an extra appointment form appears:
  - Preferred date and time slot
  - Mode: Online (researcher provides meeting link) or Face-to-Face (RPAS provides location)
  - Brief agenda or topic to discuss
- Admin confirms or proposes an alternative schedule — researcher is notified either way
- **Feedback gate:** After a consultation is Completed, researcher must submit a satisfaction feedback form before booking another
  - If feedback is not submitted, the Research Consultation option is locked with a prompt
- **New DB tables:** appointments, feedback_forms
- **Affects:** Researcher, Admin

### 2.3 Preferred Data Analyst Selection with Profile Viewing
- On the submission form, researchers can optionally choose a preferred data analyst
- Before choosing, researcher views the analyst's public profile card showing:
  - Specialization type (Qualitative / Quantitative / Mixed)
  - Current active workload count
  - Total completed requests
  - Brief bio and areas of expertise
  - Sample works / portfolio (if uploaded by analyst)
- Analyst selection flow:
  1. Researcher selects preferred analyst — analyst is notified
  2. Analyst accepts or declines (with reason if declining)
  3. If accepted, admin gives final approval
  4. If declined by analyst or rejected by admin, researcher chooses from 3 options:
     - Pick another analyst from the directory
     - Leave it to admin to assign manually
     - Return to open pool for any compatible analyst to grab
  5. If researcher takes no action within a set time, request automatically goes to open pool
- **Affects:** Researcher, Analyst, Admin

### 2.4 Payment Submission (OR Upload)
- Payment collected at two checkpoints:
  - **Checkpoint 1 — Before Processing:** Researcher submits proof of payment before request moves to Under Review
  - **Checkpoint 2 — Before Completion:** Admin verifies final payment clearance before releasing results
- Researcher fills out a payment form:
  - Service availed (auto-filled)
  - Amount paid
  - Official Receipt (OR) number
  - Photo or scan of the OR (uploaded to Supabase Storage)
- Payment status flow: Unpaid → Submitted → Verified → Rejected
- If rejected, researcher is notified with reason and can resubmit
- Payment records feed into Admin honoraria reports
- **New DB table:** payments
- **Affects:** Researcher, Admin

---

## 📦 Phase 3 — Analyst Upgrades

### 3.1 Analyst Specialization Types
- Analysts are classified into 3 types (set by admin or during onboarding):
  - **Qualitative Data Analyst** — Qualitative Data Analysis, Manuscript Review, Research Consultation
  - **Quantitative Data Analyst** — Quantitative Data Analysis, Questionnaire Validation, Reliability Test
  - **Data Analyst (Mixed)** — Can handle all 6 service types
- Specialization type shown on analyst's public profile card and in admin assignment dropdowns
- When browsing analysts:
  - Compatible analysts highlighted with a green "✓ Compatible" badge
  - Outside-specialization analysts shown with a dimmed "⚠ Outside Specialization" tag — still selectable
  - Keeps the system open and flexible while guiding good decisions
- **New DB field:** specialization on profiles table
- **Affects:** Analyst profile, Researcher (analyst selection), Admin (assignment)

### 3.2 Request Declination by Analyst
- An analyst can decline a newly assigned request before work begins
- Declination requires a written reason or justification (required field)
- On declination:
  - Admin is notified immediately with the reason
  - Request returns to Submitted / unassigned status
  - Admin reassigns or moves to open pool
  - Researcher is notified that their request is being reassigned (reason not shown to researcher)
- Declination logged permanently in the request timeline for audit
- **Affects:** Analyst, Admin, Researcher (notification only)

### 3.3 Workload Transfer Between Analysts
- After work begins (In Progress), an analyst who can no longer continue can request a transfer
- Workflow:
  1. Analyst flags the request for transfer with a reason
  2. Compatible analysts see it in an "Available to Take" section
  3. An analyst volunteers — Admin reviews and approves or declines
  4. Upon approval, full context and files are transferred to the new analyst
  5. Researcher is notified of the analyst change
- Transfer history logged in the request timeline
- **New DB table:** transfer_requests
- **Affects:** Analyst, Admin, Researcher (notification)

### 3.4 Open Request Pool
- Unassigned requests appear in an "Open Requests" board visible to analysts
- Only analysts with matching specialization see relevant requests — Mixed analysts see all
- Analyst clicks "Express Interest" on a request
- Workflow:
  1. Analyst expresses interest
  2. Admin is notified and reviews
  3. Admin approves — analyst is assigned, researcher is notified
  4. Admin declines — request stays open for others
- **Affects:** Analyst, Admin, Researcher (notification)

---

## 📦 Phase 4 — Admin Power Tools

### 4.1 Super Admin / Main Admin Protection
*Benchmarked against: Shopify (Store Owner model), Google Workspace (Super Admin flag), and industry least-privilege security standards.*

**How other platforms do it:**
- **Shopify** — one Store Owner per store, cannot be changed by other staff, only the owner can transfer ownership
- **Google Workspace** — Super Admin is a flag set separately from regular admin; Google recommends a dedicated account not tied to a personal user
- **Industry standard** — "root user" or "owner" flag stored at the database level, protected by server-side rules (not just UI)

**RPAS Implementation:**
- One account holds the is_super_admin = true flag in the profiles table — set once manually in Supabase
- There is only ever ONE Super Admin at a time (like Shopify's Owner model)
- Super Admin protections enforced at the RLS (database) level — not just hidden buttons:
  - Cannot be deleted by other admins
  - Cannot have their role downgraded
  - Cannot be deactivated, rejected, or suspended
  - Edit/Delete buttons are hidden on their row in the Users table for all other admins
- Only the Super Admin can:
  - Promote another user to Super Admin (and simultaneously demote themselves)
  - Change service fees and core system settings
  - View all audit/security logs

**SQL to activate (run once in Supabase SQL Editor):**

```sql
-- Step 1: Add the Super Admin flag column
alter table public.profiles
add column if not exists is_super_admin boolean default false;

-- Step 2: Set the founding Super Admin
update public.profiles
set is_super_admin = true
where email = 'tyrone03.lopez@aldersgate.edu.ph';

-- Step 3: RLS policy to protect the Super Admin row
create policy "Protect super admin from edits"
on public.profiles for update
using (
  auth.uid() = id  -- user editing own profile
  OR
  (select is_super_admin from public.profiles where id = auth.uid())  -- super admin edits anyone
  OR
  (
    public.get_my_role() = 'admin'
    AND
    (select is_super_admin from public.profiles where id = profiles.id) = false
  )  -- regular admin edits only non-super-admin rows
);
```

- **Affects:** Admin role management, all roles (security)

### 4.2 Flexible Service Fees Management
- Super Admin can set and update service fees per service type directly from the dashboard (no code changes)
- Fees panel shows current rate per service with an inline Edit button
- Changes take effect immediately for all new payment submissions
- Previous rates preserved in fee_history table for audit and honoraria accuracy
- **New DB tables:** service_fees, fee_history
- **Affects:** Super Admin, Payment form (Researcher)

### 4.3 Export Reports
- Admin can export in **Excel (.xlsx) and PDF** formats
- Available report types:
  - **Research Status Report** — all requests with status, researcher, analyst, service type, dates
  - **Payment & Honoraria Report** — verified payments, OR numbers, amounts per analyst per period
  - **User Activity Report** — all users, roles, join dates, total request counts
  - **Analyst Workload Report** — active vs. completed per analyst for a selected date range
  - **Consultation Feedback Report** — satisfaction scores and comments per consultation
- All reports filterable by date range, service type, status, or specific analyst
- **Affects:** Admin (Super Admin for honoraria exports)

---

## 📦 Phase 5 — Payment System (Full)

### 5.1 Payment Dashboard (Admin)
- Dedicated Payments tab in Admin Panel
- View all submissions grouped by status: Unpaid / Submitted / Verified / Rejected
- Admin clicks any payment to view the uploaded OR photo in a lightbox
- Mark as Verified or Rejected (rejection requires a reason sent to researcher)
- Running totals per analyst for honoraria computation
- Exportable to Excel/PDF
- **Affects:** Admin

### 5.2 Payment Status Tracking (Researcher)
- Researcher sees payment status inline on their request detail card
- Visual payment status badge: Unpaid → Submitted → Verified / Rejected
- Notifications for every payment status change
- If rejected, researcher can resubmit with corrected OR details and new photo
- **Affects:** Researcher

---

## 📦 Phase 6 — Communication Hub

### 6.1 Full Notification System Upgrade
- Full-featured notification popup (builds on Phase 1.1)
- Notification grouping by request
- Browser push notifications — alerts appear even when tab is minimized
- Notification preferences — users can choose which types to receive
- **Affects:** All roles

### 6.2 Floating Chat Bubble
- Persistent floating chat bubble (bottom-right corner) visible on all pages
- Opens a multi-tab chat panel:
  - Analyst Chat — direct messaging with assigned analyst per request
  - RPAS / Admin — general inquiries to the office
  - AI Assistant — automated help (Phase 6.3)
- Unread message count badge on the bubble
- Chat history stored in Supabase messages table
- **Affects:** All roles

### 6.3 AI Chatbot Integration
- AI assistant embedded in the chat bubble to help researchers:
  - Answer FAQs about RPAS services, pricing, and timelines
  - Guide researchers in choosing the right service type
  - Let users check request status via natural language ("Where is my manuscript review?")
  - Explain what to prepare next at each status step
- **Planned integration: Claude API (Anthropic)** for intelligent, context-aware responses
- If chatbot cannot answer, automatically escalates to a human admin with full chat context
- **Affects:** All roles (especially Researchers and first-time users)

---

## 🗓️ Recommended Implementation Order

```
Phase 1 (all)
  → Phase 2.1 + 2.2
    → Phase 3.1 + 3.2
      → Phase 4 (all)
        → Phase 2.3 + 2.4
          → Phase 3.3 + 3.4
            → Phase 5 (all)
              → Phase 6 (all)
```

> Start with **Phase 1** — it improves the live system immediately with minimal risk and no new database tables required.

---

## 🗃️ New Database Tables & Fields

| Table / Field | Phase | Purpose |
|---|---|---|
| `profiles.is_super_admin` | 4.1 | Boolean flag for Super Admin protection |
| `profiles.specialization` | 3.1 | Analyst type: qualitative / quantitative / mixed |
| `research_groups` | 2.1 | Group research submissions and metadata |
| `group_members` | 2.1 | Members and roles (leader / member / adviser) per group |
| `appointments` | 2.2 | Consultation schedules and confirmation status |
| `feedback_forms` | 2.2 | Post-consultation satisfaction responses |
| `payments` | 2.4 / 5 | OR uploads, amounts, verification status |
| `service_fees` | 4.2 | Current fee per service type |
| `fee_history` | 4.2 | Audit log of all fee changes with timestamps |
| `analyst_profiles` | 2.3 / 3.1 | Bio, portfolio, and sample works per analyst |
| `transfer_requests` | 3.3 | Workload transfer requests between analysts |

---

## 💡 Design Principles for All Future Features

- **Mobile-friendly first** — all new features must work well on phones
- **Minimal friction** — smart defaults and auto-fill wherever possible
- **Audit everything** — status changes, payments, assignments, and admin actions always logged
- **Role clarity** — every page makes it obvious what the user can and cannot do
- **Progressive disclosure** — don't overwhelm new users; show advanced options only when relevant

---

*This roadmap is a living document and will be updated as features are built and feedback is gathered.*
*Maintained by: Tyrone Marcial Lopez — RPAS, Aldersgate College Inc.*
