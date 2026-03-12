// =============================================
// SHARED AUTH LOGIC
// =============================================

const ROLES = { ADMIN: "admin", ANALYST: "analyst", RESEARCHER: "researcher" };
const STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under Review",
  in_progress: "In Progress",
  for_revision: "For Revision",
  resubmitted: "Resubmitted",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_COLORS = {
  submitted: "#6B7280",
  under_review: "#F59E0B",
  in_progress: "#3B82F6",
  for_revision: "#EF4444",
  completed: "#1A6B30",
  cancelled: "#9CA3AF",
};
const SERVICES = [
  "Quantitative Data Analysis",
  "Qualitative Data Analysis",
  "Questionnaire Validation",
  "Reliability Test",
  "Manuscript Review",
  "Research Consultation",
];
const STATUS_STEPS = [
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
  // Phase 1.4 — Email verification check
  if (!session.user.email_confirmed_at) {
    await sb.auth.signOut();
    window.location.href = getRootPath() + "index.html?msg=verify";
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
  if (role === ROLES.ADMIN) window.location.href = root + "admin/admin.html";
  else if (role === ROLES.ANALYST)
    window.location.href = root + "analyst/analyst.html";
  else window.location.href = root + "researcher/index.html";
}

function getRootPath() {
  // All dashboards are one level deep (admin/, analyst/, researcher/)
  // index.html is at root, so going "../" always gets back to root
  const path = window.location.pathname;
  if (
    path.includes("/admin/") ||
    path.includes("/analyst/") ||
    path.includes("/researcher/")
  )
    return "../";
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

// =============================================
// PHASE 1.3 — EMAIL NOTIFICATION TRIGGERS
// Call these after key events to send DB notifications
// Supabase Edge Functions or triggers handle actual email delivery
// =============================================

async function createNotification(userId, message, type = "system") {
  if (!userId) return;
  await sb.from("notifications").insert({
    user_id: userId,
    message: message,
    type: type,
    is_read: false,
  });
}

async function notifyStatusChange(request, newStatus, analystId, researcherId) {
  const label = STATUS_LABELS[newStatus] || newStatus;
  if (researcherId) {
    await createNotification(
      researcherId,
      "Your request status has been updated to: " + label,
      "status",
    );
  }
}

async function notifyNewAssignment(analystId, researcherName, serviceType) {
  if (!analystId) return;
  await createNotification(
    analystId,
    "New request assigned to you: " +
      serviceType +
      " from " +
      (researcherName || "a researcher"),
    "assignment",
  );
}

async function notifyNewMessage(recipientId, senderName) {
  if (!recipientId) return;
  await createNotification(
    recipientId,
    "New message from " + (senderName || "someone"),
    "message",
  );
}
// =============================================
// SHARED AUTH LOGIC
// =============================================

const ROLES = { ADMIN: "admin", ANALYST: "analyst", RESEARCHER: "researcher" };
const STATUS_LABELS = {
  submitted: "Submitted",
  under_review: "Under Review",
  in_progress: "In Progress",
  for_revision: "For Revision",
  resubmitted: "Resubmitted",
  completed: "Completed",
  cancelled: "Cancelled",
};
const STATUS_COLORS = {
  submitted: "#6B7280",
  under_review: "#F59E0B",
  in_progress: "#3B82F6",
  for_revision: "#EF4444",
  completed: "#1A6B30",
  cancelled: "#9CA3AF",
};
const SERVICES = [
  "Quantitative Data Analysis",
  "Qualitative Data Analysis",
  "Questionnaire Validation",
  "Reliability Test",
  "Manuscript Review",
  "Research Consultation",
];
const STATUS_STEPS = [
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
  // Phase 1.4 — Email verification check
  if (!session.user.email_confirmed_at) {
    await sb.auth.signOut();
    window.location.href = getRootPath() + "index.html?msg=verify";
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
  // All files are flat at root level
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

// =============================================
// PHASE 1.3 — EMAIL NOTIFICATION TRIGGERS
// Call these after key events to send DB notifications
// Supabase Edge Functions or triggers handle actual email delivery
// =============================================

async function createNotification(userId, message, type = "system") {
  if (!userId) return;
  await sb.from("notifications").insert({
    user_id: userId,
    message: message,
    type: type,
    is_read: false,
  });
}

async function notifyStatusChange(request, newStatus, analystId, researcherId) {
  const label = STATUS_LABELS[newStatus] || newStatus;
  if (researcherId) {
    await createNotification(
      researcherId,
      "Your request status has been updated to: " + label,
      "status",
    );
  }
}

async function notifyNewAssignment(analystId, researcherName, serviceType) {
  if (!analystId) return;
  await createNotification(
    analystId,
    "New request assigned to you: " +
      serviceType +
      " from " +
      (researcherName || "a researcher"),
    "assignment",
  );
}

async function notifyNewMessage(recipientId, senderName) {
  if (!recipientId) return;
  await createNotification(
    recipientId,
    "New message from " + (senderName || "someone"),
    "message",
  );
}
