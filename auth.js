// =============================================
// SHARED AUTH LOGIC — RPAS
// =============================================
// Using var to prevent redeclaration errors across
// inline dashboard scripts that share this file

var ROLES = { ADMIN: "admin", ANALYST: "analyst", RESEARCHER: "researcher" };
var STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under Review",
  in_progress: "In Progress",
  for_revision: "For Revision",
  resubmitted: "Resubmitted",
  completed: "Completed",
  cancelled: "Cancelled",
};
var STATUS_COLORS = {
  submitted: "#6B7280",
  under_review: "#F59E0B",
  in_progress: "#3B82F6",
  for_revision: "#EF4444",
  completed: "#1A6B30",
  cancelled: "#9CA3AF",
};
var SERVICES = [
  "Quantitative Data Analysis",
  "Qualitative Data Analysis",
  "Questionnaire Validation",
  "Reliability Test",
  "Manuscript Review",
  "Research Consultation",
];
var STATUS_STEPS = [
  "submitted",
  "under_review",
  "in_progress",
  "for_revision",
  "completed",
];

async function getSession() {
  const {
    data: { session },
  } = await sb.auth.getSession();
  return session;
}

async function getProfile(userId) {
  const { data } = await sb
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  return data;
}

async function requireAuth(expectedRole) {
  const session = await getSession();
  if (!session) {
    window.location.href = getRootPath() + "index.html";
    return null;
  }
  const profile = await getProfile(session.user.id);
  if (!profile || profile.status !== "approved") {
    await sb.auth.signOut();
    window.location.href = getRootPath() + "index.html?msg=pending";
    return null;
  }
  if (expectedRole && profile.role !== expectedRole) {
    redirectToRole(profile.role);
    return null;
  }
  return { session, profile };
}

function redirectToRole(role) {
  const root = getRootPath();
  if (role === ROLES.ADMIN) window.location.href = root + "admin.html";
  else if (role === ROLES.ANALYST) window.location.href = root + "analyst.html";
  else window.location.href = root + "researcher.html";
}

function getRootPath() {
  return "";
}

async function signOut() {
  await sb.auth.signOut();
  window.location.href = getRootPath() + "index.html";
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 300);
  }, 3000);
}

// ── EMAIL (Supabase Edge Function → Resend.com) ───────────────

async function sendEmail(type, payload) {
  try {
    await sb.functions.invoke("send-email", { body: { type, ...payload } });
  } catch (e) {
    console.warn("sendEmail non-blocking fail:", e);
  }
}

// ── IN-APP NOTIFICATIONS ──────────────────────────────────────

async function createNotification(userId, message, type = "system") {
  if (!userId) return;
  await sb
    .from("notifications")
    .insert({ user_id: userId, message, type, is_read: false });
}

// ── TRIGGERS (in-app + email together) ───────────────────────

async function notifyAccountApproved(userProfile) {
  await createNotification(
    userProfile.id,
    "Your RPAS account has been approved! You can now sign in.",
    "system",
  );
  await sendEmail("account_approved", {
    to: userProfile.email,
    name: userProfile.full_name || userProfile.email,
  });
}

async function notifyAccountRejected(userProfile, reason = "") {
  await createNotification(
    userProfile.id,
    "Your RPAS account registration was not approved. Contact the RPAS Office for details.",
    "system",
  );
  await sendEmail("account_rejected", {
    to: userProfile.email,
    name: userProfile.full_name || userProfile.email,
    reason,
  });
}

async function notifyAdminsNewUser(userEmail, userName) {
  const { data: admins } = await sb
    .from("profiles")
    .select("id, email, full_name")
    .eq("role", "admin")
    .eq("status", "approved");
  if (!admins?.length) return;
  for (const admin of admins) {
    await createNotification(
      admin.id,
      `New user registered and awaiting approval: ${userName || userEmail}`,
      "system",
    );
    await sendEmail("admin_new_user", {
      to: admin.email,
      name: admin.full_name || "Admin",
      user_name: userName || userEmail,
      user_email: userEmail,
    });
  }
}

async function notifyStatusChange(request, newStatus, researcherProfile) {
  const label = STATUS_LABELS[newStatus] || newStatus;
  if (!researcherProfile) return;
  await createNotification(
    researcherProfile.id,
    `Your request status has been updated to: ${label}`,
    "status",
  );
  await sendEmail("status_update", {
    to: researcherProfile.email,
    name: researcherProfile.full_name || researcherProfile.email,
    service_type: request?.service_type || "—",
    status_label: label,
    note: request?.admin_note || "",
  });
}

async function notifyNewAssignment(
  analystProfile,
  researcherName,
  serviceType,
) {
  if (!analystProfile) return;
  await createNotification(
    analystProfile.id,
    `New request assigned to you: ${serviceType} from ${researcherName || "a researcher"}`,
    "assignment",
  );
  await sendEmail("new_assignment", {
    to: analystProfile.email,
    name: analystProfile.full_name || analystProfile.email,
    service_type: serviceType,
    researcher_name: researcherName,
  });
}

async function notifyNewMessage(recipientProfile, senderName, preview = "") {
  if (!recipientProfile) return;
  await createNotification(
    recipientProfile.id,
    `New message from ${senderName || "someone"}`,
    "message",
  );
  await sendEmail("new_message", {
    to: recipientProfile.email,
    name: recipientProfile.full_name || recipientProfile.email,
    sender_name: senderName,
    preview,
  });
}
