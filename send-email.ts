// =============================================
// RPAS — Supabase Edge Function: send-email
// Uses Resend.com to deliver transactional emails
//
// SETUP:
//   1. Go to https://resend.com → sign up → create API key
//   2. In Supabase Dashboard → Edge Functions → Secrets:
//      Add:  RESEND_API_KEY = re_xxxxxxxxxxxxxxxx
//      Add:  RPAS_FROM_EMAIL = RPAS Office <rpas@yourdomain.com>
//      Add:  RPAS_SITE_URL = https://tyronelopez.github.io/rpas
// =============================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL =
  Deno.env.get("RPAS_FROM_EMAIL") ?? "RPAS Office <noreply@yourdomain.com>";
const SITE_URL =
  Deno.env.get("RPAS_SITE_URL") ?? "https://tyronelopez.github.io/rpas";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── EMAIL TEMPLATES ───────────────────────────────────────────

function baseLayout(title: string, body: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <style>
    body { margin:0; padding:0; background:#f4f4f5; font-family: Inter, Arial, sans-serif; }
    .wrapper { max-width:580px; margin:40px auto; background:white; border-radius:12px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,.08); }
    .header { background:#1A6B30; padding:28px 32px; }
    .header h1 { margin:0; color:white; font-size:22px; font-weight:700; }
    .header p { margin:4px 0 0; color:rgba(255,255,255,.7); font-size:13px; }
    .body { padding:32px; color:#374151; font-size:15px; line-height:1.7; }
    .body h2 { margin:0 0 16px; font-size:20px; color:#111827; }
    .btn { display:inline-block; padding:12px 28px; background:#1A6B30; color:white!important; border-radius:8px; text-decoration:none; font-weight:600; font-size:15px; margin:20px 0; }
    .footer { padding:20px 32px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#9ca3af; text-align:center; }
    .badge { display:inline-block; padding:4px 12px; border-radius:999px; font-size:13px; font-weight:600; }
    .badge-pending { background:#fef3c7; color:#92400e; }
    .badge-approved { background:#d1fae5; color:#065f46; }
    .badge-rejected { background:#fee2e2; color:#991b1b; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>RPAS</h1>
      <p>Research and Publication Assistance Services</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      © ${new Date().getFullYear()} RPAS Office &nbsp;·&nbsp; Aldersgate College<br/>
      This is an automated message — please do not reply directly.
    </div>
  </div>
</body>
</html>`;
}

const templates: Record<
  string,
  (p: Record<string, string>) => { subject: string; html: string }
> = {
  // Sent to new user after registration
  welcome: (p) => ({
    subject: "Welcome to RPAS — Account Pending Approval",
    html: baseLayout(
      "Welcome",
      `
      <h2>Hi ${p.name || "there"} 👋</h2>
      <p>Thank you for registering with the <strong>Research and Publication Assistance Services (RPAS)</strong> portal.</p>
      <p>Your account has been created and is now <span class="badge badge-pending">Pending Review</span>.</p>
      <p>Our admin team will review your registration. You will receive another email once your account has been <strong>approved</strong> and you can begin using the platform.</p>
      <p>In the meantime, if you have any questions, please contact the RPAS Office.</p>
      <a href="${SITE_URL}" class="btn">Visit RPAS Portal</a>
    `,
    ),
  }),

  // Sent to user when admin approves their account
  account_approved: (p) => ({
    subject: "✅ Your RPAS Account Has Been Approved!",
    html: baseLayout(
      "Account Approved",
      `
      <h2>Great news, ${p.name || "there"}! 🎉</h2>
      <p>Your RPAS account has been <span class="badge badge-approved">Approved</span>!</p>
      <p>You can now sign in and access the full platform to submit research service requests, track their progress, and communicate with your assigned analyst.</p>
      <a href="${SITE_URL}" class="btn">Sign In to RPAS</a>
      <p style="margin-top:24px; font-size:13px; color:#6b7280;">If you did not register for an RPAS account, please contact the RPAS Office immediately.</p>
    `,
    ),
  }),

  // Sent to user when admin rejects their account
  account_rejected: (p) => ({
    subject: "RPAS Account Registration Update",
    html: baseLayout(
      "Registration Update",
      `
      <h2>Hi ${p.name || "there"},</h2>
      <p>Thank you for your interest in the RPAS portal.</p>
      <p>After reviewing your registration, your account was not approved at this time. <span class="badge badge-rejected">Not Approved</span></p>
      ${p.reason ? `<p><strong>Reason:</strong> ${p.reason}</p>` : ""}
      <p>If you believe this is an error or would like more information, please contact the RPAS Office directly.</p>
      <a href="mailto:${FROM_EMAIL.match(/<(.+)>/)?.[1] ?? ""}" class="btn">Contact RPAS Office</a>
    `,
    ),
  }),

  // Sent to researcher when their request status changes
  status_update: (p) => ({
    subject: `RPAS Request Update — ${p.status_label}`,
    html: baseLayout(
      "Request Status Update",
      `
      <h2>Hi ${p.name || "there"},</h2>
      <p>Your research service request has been updated.</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
        <tr><td style="padding:8px 0; color:#6b7280; width:140px;">Service</td><td><strong>${p.service_type || "—"}</strong></td></tr>
        <tr><td style="padding:8px 0; color:#6b7280;">New Status</td><td><strong>${p.status_label || "—"}</strong></td></tr>
        ${p.note ? `<tr><td style="padding:8px 0; color:#6b7280;">Note</td><td>${p.note}</td></tr>` : ""}
      </table>
      <a href="${SITE_URL}/researcher.html" class="btn">View Your Request</a>
    `,
    ),
  }),

  // Sent to analyst when a new request is assigned to them
  new_assignment: (p) => ({
    subject: `New RPAS Request Assigned — ${p.service_type}`,
    html: baseLayout(
      "New Request Assigned",
      `
      <h2>Hi ${p.name || "there"},</h2>
      <p>A new research service request has been assigned to you.</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
        <tr><td style="padding:8px 0; color:#6b7280; width:140px;">Service</td><td><strong>${p.service_type || "—"}</strong></td></tr>
        <tr><td style="padding:8px 0; color:#6b7280;">Researcher</td><td><strong>${p.researcher_name || "—"}</strong></td></tr>
      </table>
      <a href="${SITE_URL}/analyst.html" class="btn">View Assignment</a>
    `,
    ),
  }),

  // Sent to a user when they receive a new message
  new_message: (p) => ({
    subject: `New Message on RPAS from ${p.sender_name}`,
    html: baseLayout(
      "New Message",
      `
      <h2>Hi ${p.name || "there"},</h2>
      <p>You have a new message from <strong>${p.sender_name || "someone"}</strong> on the RPAS platform.</p>
      <div style="background:#f9fafb; border-left:4px solid #1A6B30; padding:14px 18px; border-radius:0 8px 8px 0; margin:16px 0; font-size:14px; color:#374151;">
        ${p.preview || "You have a new message waiting for you."}
      </div>
      <a href="${SITE_URL}" class="btn">View Message</a>
    `,
    ),
  }),

  // Sent to admin when a new user registers
  admin_new_user: (p) => ({
    subject: `New RPAS Registration — ${p.user_name}`,
    html: baseLayout(
      "New User Registration",
      `
      <h2>New Registration</h2>
      <p>A new user has registered on the RPAS portal and is awaiting your approval.</p>
      <table style="width:100%; border-collapse:collapse; margin:16px 0; font-size:14px;">
        <tr><td style="padding:8px 0; color:#6b7280; width:140px;">Name</td><td><strong>${p.user_name || "—"}</strong></td></tr>
        <tr><td style="padding:8px 0; color:#6b7280;">Email</td><td>${p.user_email || "—"}</td></tr>
      </table>
      <a href="${SITE_URL}/admin.html" class="btn">Review in Admin Panel</a>
    `,
    ),
  }),
};

// ── HANDLER ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, to, ...params } = body;

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "Missing type or to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const builder = templates[type];
    if (!builder) {
      return new Response(
        JSON.stringify({ error: `Unknown email type: ${type}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { subject, html } = builder(params);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM_EMAIL, to: [to], subject, html }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
