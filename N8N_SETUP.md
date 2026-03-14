# n8n Setup Guide — Hostinger VPS KVM2

### RPAS Alder AI Chatbot Backend

_Aldersgate College Inc._

---

## Prerequisites

- Hostinger VPS KVM2 running Ubuntu 22.04
- SSH access to your VPS
- Gemini API key (Google AI Studio — free)
- OpenAI API key (platform.openai.com — free tier)
- Supabase service role key (Supabase → Settings → API → service_role)

---

## PART 1 — Install n8n on VPS

### SSH into your VPS

```bash
ssh root@YOUR_VPS_IP
```

### Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should say v20.x.x
```

### Install n8n globally

```bash
npm install -g n8n
```

### Install PM2 (keeps n8n running after reboot)

```bash
npm install -g pm2
```

### Start n8n with PM2

```bash
pm2 start n8n --name "n8n-rpas"
pm2 save
pm2 startup   # run the command it gives you to auto-start on boot
```

### Open the firewall port

```bash
sudo ufw allow 5678
sudo ufw allow 22
sudo ufw enable
```

### Access n8n

Open in your browser: `http://YOUR_VPS_IP:5678`

Create your owner account when prompted. Save the email and password.

---

## PART 2 — Configure n8n Environment Variables

### Create environment file

```bash
nano ~/.n8n/.env
```

Paste this (fill in your actual keys):

```
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
WEBHOOK_URL=http://YOUR_VPS_IP:5678/

GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

SUPABASE_URL=https://wkgacywvsndwiezqdcxj.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_service_role_key_here

RPAS_ADMIN_EMAIL=rpas@aldersgate.edu.ph
RESEND_API_KEY=your_resend_api_key_here
```

Save with Ctrl+X → Y → Enter.

### Restart n8n to load env vars

```bash
pm2 restart n8n-rpas
```

---

## PART 3 — Build the Alder Workflow in n8n

Go to `http://YOUR_VPS_IP:5678` → Workflows → New Workflow.

### Step 1 — Add Webhook Trigger node

- Node type: **Webhook**
- HTTP Method: `POST`
- Path: `rpas-chat`
- Response Mode: `Last Node`
- Click **Save** — copy the webhook URL shown (you will paste this into RPAS later)

### Step 2 — Add Code node (Intent Router)

- Node type: **Code**
- Connect from: Webhook
- Paste this code:

```javascript
const body = $input.first().json.body || $input.first().json;
const message = (body.message || "").toLowerCase().trim();
const userId = body.userId || "";
const userRole = body.userRole || "researcher";
const userName = body.userName || "User";
const history = body.history || [];

// Detect intent
let intent = "faq";

const statusKeywords = [
  "status",
  "where is my",
  "track",
  "request",
  "update",
  "progress",
  "what happened",
  "submitted",
];
const adminKeywords = [
  "talk to admin",
  "connect me",
  "escalate",
  "complain",
  "problem",
  "issue",
  "help me please",
  "urgent",
];

if (statusKeywords.some((k) => message.includes(k))) intent = "status_check";
if (adminKeywords.some((k) => message.includes(k))) intent = "notify_admin";

return [
  {
    json: {
      intent,
      message: body.message,
      userId,
      userRole,
      userName,
      history,
      originalBody: body,
    },
  },
];
```

### Step 3 — Add Switch node (route by intent)

- Node type: **Switch**
- Connect from: Code (Intent Router)
- Add 3 routes:
  - Route 1: `{{ $json.intent }}` equals `faq` → output 0
  - Route 2: `{{ $json.intent }}` equals `status_check` → output 1
  - Route 3: `{{ $json.intent }}` equals `notify_admin` → output 2

### Step 4 — FAQ route: HTTP Request to Gemini

- Node type: **HTTP Request**
- Connect from: Switch output 0
- Method: `POST`
- URL: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={{ $env.GEMINI_API_KEY }}`
- Body Type: JSON
- Body:

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "{{ $('Code').first().json.message }}" }]
    }
  ],
  "systemInstruction": {
    "parts": [
      {
        "text": "You are Alder, the friendly AI assistant of RPAS (Research Planning and Analytic Services) at Aldersgate College Inc. You are based on the ACI lion mascot. Your personality is casual but knowledgeable — like a smart campus buddy. Keep answers short, clear, and helpful. Never make up information. If you don't know, say so and suggest the user contact the RPAS office.\n\nRPAS offers: Quantitative Data Analysis, Qualitative Data Analysis, Questionnaire Validation, Reliability Test, Manuscript Review, Research Consultation.\n\nRequest statuses: Submitted → Under Review → In Progress → For Revision → Completed → Cancelled.\n\nUsers sign in with Google. New accounts are Pending until admin approves. Researchers must complete their profile (Level, Department, Program) before submitting."
      }
    ]
  }
}
```

### Step 5 — FAQ route: Code node (extract Gemini reply)

- Node type: **Code**
- Connect from: Gemini HTTP Request
- Code:

```javascript
const geminiResp = $input.first().json;
let reply = "Sorry, I couldn't get a response right now. Please try again!";
try {
  reply = geminiResp.candidates[0].content.parts[0].text;
} catch (e) {}
return [{ json: { reply } }];
```

### Step 6 — Status Check route: Supabase query

- Node type: **HTTP Request**
- Connect from: Switch output 1
- Method: `GET`
- URL: `{{ $env.SUPABASE_URL }}/rest/v1/service_requests?researcher_id=eq.{{ $('Code').first().json.userId }}&select=id,service_type,title,status,created_at,analyst:analyst_id(full_name)&order=created_at.desc&limit=5`
- Headers:
  - `apikey`: `{{ $env.SUPABASE_SERVICE_KEY }}`
  - `Authorization`: `Bearer {{ $env.SUPABASE_SERVICE_KEY }}`

Then add another HTTP Request node for Gemini with the status data included in the prompt:

```javascript
// In a Code node before calling Gemini for status:
const requests = $input.first().json;
const userName = $("Code").first().json.userName;
const userMessage = $("Code").first().json.message;

let statusText = "No requests found.";
if (requests && requests.length) {
  statusText = requests
    .map(
      (r, i) =>
        `${i + 1}. ${r.service_type} — "${r.title || "Untitled"}" — Status: ${r.status}` +
        (r.analyst
          ? ` — Analyst: ${r.analyst.full_name}`
          : " — Not yet assigned"),
    )
    .join("\n");
}

return [
  {
    json: {
      prompt: `The user ${userName} asked: "${userMessage}"\n\nHere are their current RPAS requests:\n${statusText}\n\nRespond as Alder the lion assistant. Be friendly and helpful. Explain the status in plain language.`,
    },
  },
];
```

### Step 7 — Notify Admin route: Supabase + Resend

Add two parallel nodes after Switch output 2:

**Node A — Insert Supabase notification:**

- HTTP Request → POST to `{{ $env.SUPABASE_URL }}/rest/v1/notifications`
- Headers: `apikey` + `Authorization` + `Content-Type: application/json` + `Prefer: return=minimal`
- Body:

```json
{
  "user_id": "ADMIN_UUID_HERE",
  "message": "{{ $('Code').first().json.userName }} needs admin help: {{ $('Code').first().json.message }}",
  "type": "message"
}
```

**Node B — Send Resend email:**

- HTTP Request → POST to `https://api.resend.com/emails`
- Headers: `Authorization: Bearer {{ $env.RESEND_API_KEY }}` + `Content-Type: application/json`
- Body:

```json
{
  "from": "Alder <noreply@aldersgate.edu.ph>",
  "to": ["rpas@aldersgate.edu.ph"],
  "subject": "RPAS: User needs admin assistance",
  "html": "<p><strong>{{ $('Code').first().json.userName }}</strong> ({{ $('Code').first().json.userRole }}) sent this message through Alder:</p><blockquote>{{ $('Code').first().json.message }}</blockquote><p>Please follow up with this user in the RPAS system.</p>"
}
```

Add a final Code node after both:

```javascript
return [
  {
    json: {
      reply:
        "I've notified the RPAS admin about your concern. Someone will follow up with you soon! 🦁",
    },
  },
];
```

### Step 8 — OpenAI Fallback

For each Gemini node, add an **Error Trigger** → **HTTP Request** to OpenAI:

- URL: `https://api.openai.com/v1/chat/completions`
- Method: POST
- Headers: `Authorization: Bearer {{ $env.OPENAI_API_KEY }}`
- Body:

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "system",
      "content": "You are Alder, the friendly AI assistant of RPAS at Aldersgate College Inc. Be helpful, casual but knowledgeable."
    },
    { "role": "user", "content": "{{ $('Code').first().json.message }}" }
  ],
  "max_tokens": 300
}
```

Then extract: `$json.choices[0].message.content`

### Step 9 — Activate the workflow

Click the toggle at the top right of the workflow → **Active**.

---

## PART 4 — Connect RPAS to n8n

In `admin.html`, `analyst.html`, `researcher.html`, and `messages.html`, find this line:

```javascript
var ALDER_WEBHOOK = "https://YOUR_VPS_IP:5678/webhook/rpas-chat";
```

Replace `YOUR_VPS_IP` with your actual Hostinger VPS IP address.

---

## PART 5 — Supabase pgvector (Embeddings — Future)

When ready to add semantic search to Alder:

### Enable pgvector in Supabase

Supabase Dashboard → Database → Extensions → search `vector` → Enable

### Create embeddings table

```sql
create table if not exists public.chatbot_embeddings (
  id uuid default gen_random_uuid() primary key,
  content text not null,
  embedding vector(1536),
  source text,
  created_at timestamptz default now()
);

create index on public.chatbot_embeddings
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
```

### Create sessions table

```sql
create table if not exists public.chatbot_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  messages jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### Embed SYSTEM_MANUAL

Use an n8n workflow that:

1. Reads `SYSTEM_MANUAL.md` content (paste as text in a Code node)
2. Splits into chunks (every 500 words)
3. Calls OpenAI Embeddings API (`text-embedding-3-small`) per chunk
4. Inserts each chunk + vector into `chatbot_embeddings`

This allows Alder to do semantic search — finding the most relevant section of the manual for any user question.

---

## PART 6 — SSL (HTTPS) — Recommended for Production

```bash
sudo apt install nginx certbot python3-certbot-nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/rpas-n8n
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/rpas-n8n /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d your-domain.com
```

Update `ALDER_WEBHOOK` in all HTML files to use `https://your-domain.com/webhook/rpas-chat`.

---

## Quick Reference

| What          | Where                                       |
| ------------- | ------------------------------------------- |
| n8n dashboard | `http://YOUR_VPS_IP:5678`                   |
| Webhook URL   | `http://YOUR_VPS_IP:5678/webhook/rpas-chat` |
| Restart n8n   | `pm2 restart n8n-rpas`                      |
| View logs     | `pm2 logs n8n-rpas`                         |
| Stop n8n      | `pm2 stop n8n-rpas`                         |
| Env file      | `~/.n8n/.env`                               |

---

_Maintained by: Tyrone Marcial Lopez, LPT, MST — RPAS, Aldersgate College Inc._
