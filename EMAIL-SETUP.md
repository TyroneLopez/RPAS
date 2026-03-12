# RPAS Email Setup Guide
## Resend.com + Supabase Edge Function

---

## Step 1 — Create a Resend Account

1. Go to **https://resend.com** and sign up (free)
2. Go to **API Keys** → click **Create API Key**
3. Name it `rpas-production`, keep full access
4. Copy the key — it starts with `re_...` — **save it, you only see it once**

---

## Step 2 — Verify a Sending Domain (or use Resend sandbox)

**Option A — Use sandbox for testing (fastest)**
- Resend's free tier lets you send to your own email only
- Skip domain setup for now, just test with your personal email

**Option B — Verify your domain (for production)**
1. In Resend → **Domains** → Add Domain → enter `yourdomain.com`
2. Add the DNS records Resend gives you (TXT + MX records)
3. Wait for verification (usually under 10 minutes)
4. Update `RPAS_FROM_EMAIL` below to use your domain

---

## Step 3 — Deploy the Edge Function to Supabase

### Option A — Supabase CLI (recommended)

```bash
# Install CLI if needed
npm install -g supabase

# Login
supabase login

# Link to your project (get Project ID from Supabase Dashboard → Settings)
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the function
supabase functions deploy send-email
```

### Option B — Supabase Dashboard (no CLI needed)

1. Go to your **Supabase Dashboard** → **Edge Functions**
2. Click **New Function** → name it exactly: `send-email`
3. Delete the starter code and paste the full contents of:
   `supabase/functions/send-email/index.ts`
4. Click **Deploy**

---

## Step 4 — Add Secrets to Supabase

In **Supabase Dashboard** → **Edge Functions** → **Manage Secrets**, add:

| Secret Name        | Value                                          |
|--------------------|------------------------------------------------|
| `RESEND_API_KEY`   | `re_xxxxxxxxxxxxxxxxxxxx` (your Resend API key) |
| `RPAS_FROM_EMAIL`  | `RPAS Office <rpas@yourdomain.com>`            |
| `RPAS_SITE_URL`    | `https://tyronelopez.github.io/rpas`           |

> **Note:** If using Resend sandbox, `RPAS_FROM_EMAIL` must be:
> `RPAS Office <onboarding@resend.dev>`

---

## Step 5 — Wire Approval/Rejection Emails in admin.html

Find where admin approves a user (look for `status: "approved"` update), and add:

```javascript
// After updating status to approved:
await notifyAccountApproved(userProfile);  // ← sends in-app + email

// After updating status to rejected:
await notifyAccountRejected(userProfile, "Optional reason here");
```

Find where admin assigns a request to an analyst, and add:
```javascript
// After assigning analyst to a request:
await notifyNewAssignment(analystProfile, researcherName, serviceType);
```

Find where status is changed on a request, and add:
```javascript
// After updating request status:
await notifyStatusChange(request, newStatus, researcherProfile);
```

---

## Email Types Available

| Type               | Trigger                              | Recipient    |
|--------------------|--------------------------------------|--------------|
| `welcome`          | New user registers                   | New user     |
| `account_approved` | Admin approves account               | User         |
| `account_rejected` | Admin rejects account                | User         |
| `status_update`    | Request status changes               | Researcher   |
| `new_assignment`   | Request assigned to analyst          | Analyst      |
| `new_message`      | New message sent on platform         | Recipient    |
| `admin_new_user`   | New user registers                   | All admins   |

---

## Testing

After deploying, test via Supabase Edge Function logs:

1. **Supabase Dashboard** → **Edge Functions** → `send-email` → **Logs**
2. Register a new user on RPAS — you should see a log entry and receive a welcome email
3. If you see `401` errors → check `RESEND_API_KEY` is set correctly
4. If you see `422` errors → check `RPAS_FROM_EMAIL` domain is verified in Resend
