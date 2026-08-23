const fs = require("fs");
const path = require("path");

const azPath = path.join(__dirname, "..", "src", "locales", "az.json");
const az = JSON.parse(fs.readFileSync(azPath, "utf8"));

const enWords = new Set([
  "the", "and", "of", "is", "are", "to", "for", "not", "done", "overdue", "review",
  "loading", "please", "select", "search", "create", "update", "delete", "edit",
  "save", "cancel", "submit", "confirm", "add", "remove", "close", "back", "next",
  "previous", "filter", "export", "import", "download", "upload", "view", "details",
  "settings", "actions", "status", "name", "description", "date", "amount", "total",
  "price", "quantity", "no", "results", "data", "with", "from", "this", "that",
  "week", "today", "tomorrow", "yesterday", "new", "all", "none", "yes", "required",
  "optional", "invalid", "error", "success", "failed", "warning", "info", "click",
  "here", "more", "less", "show", "hide", "open", "closed", "active", "inactive",
  "pending", "approved", "rejected", "draft", "published", "archived", "you", "your",
  "it", "on", "in", "at", "by", "as", "be", "will", "can", "must", "should", "a",
  "an", "or", "due", "deadline", "task", "tasks", "project", "projects", "user",
  "users", "role", "roles", "company", "team", "member", "members", "file", "files",
  "message", "messages", "notification", "notifications", "calendar", "activity",
  "report", "reports", "welcome", "sign", "log", "sent", "send", "start", "end",
  "type", "value", "current", "assign", "assigned", "unassigned", "complete",
  "completed", "progress", "priority", "low", "medium", "high", "urgent", "empty",
  "any", "other", "own", "yours", "mine", "was", "were", "has", "have", "had",
  "list", "board", "planner", "backlog", "todo", "campaign", "campaigns", "ad",
  "ads", "segment", "segments", "template", "templates", "analytics", "transfer",
  "transfers", "sales", "order", "orders", "inventory", "write", "off", "offs",
  "write-off", "write-offs", "warehouse", "warehouses", "product", "products",
  "supplier", "suppliers", "stock", "receiving", "receive", "received", "outbound",
  "inbound", "adjustment", "adjustments", "movement", "movements", "customer",
  "customers", "contact", "contacts", "company", "companies", "deal", "deals",
  "stage", "stages", "lead", "leads", "won", "lost", "open", "invoice", "invoices",
  "quote", "quotes", "channel", "channels", "chat", "call", "calls", "meeting",
  "meetings", "reminder", "reminders", "reminder", "dashboard", "dashboards",
  "overview", "summary", "chart", "charts", "graph", "trend", "trends", "metric",
  "metrics", "kpi", "kpis", "table", "column", "columns", "row", "rows", "field",
  "fields", "form", "forms", "input", "inputs", "output", "button", "buttons",
  "link", "links", "tab", "tabs", "page", "pages", "panel", "panels", "modal",
  "modals", "dialog", "dialogs", "menu", "menus", "sidebar", "header", "footer",
  "logo", "icon", "icons", "image", "images", "photo", "photos", "video", "videos",
  "attachment", "attachments", "comment", "comments", "reply", "replies", "note",
  "notes", "tag", "tags", "label", "labels", "category", "categories", "group",
  "groups", "permission", "permissions", "access", "denied", "allowed", "forbidden",
  "unauthorized", "authentication", "authorization", "login", "logout", "signup",
  "register", "registration", "password", "email", "phone", "address", "profile",
  "account", "accounts", "language", "theme", "themes", "appearance", "system",
  "notifications", "preferences", "preference", "general", "advanced", "basic",
  "custom", "default", "manual", "automatic", "auto", "enable", "enabled",
  "disable", "disabled", "on", "off", "true", "false", "null", "undefined",
  "loading", "processing", "please", "wait", "try", "again", "later", "now",
  "soon", "recently", "history", "log", "logs", "audit", "record", "records",
  "entry", "entries", "item", "items", "product", "service", "services",
  "feature", "features", "plan", "plans", "pricing", "subscription", "billing",
  "payment", "payments", "invoice", "receipt", "tax", "discount", "coupon",
  "shipping", "delivery", "tracking", "reference", "code", "number", "id",
  "key", "keys", "value", "values", "size", "weight", "color", "colors",
  "colour", "colours", "unit", "units", "measure", "measurement", "currency",
  "rate", "rates", "percent", "percentage", "ratio", "average", "min", "max",
  "minimum", "maximum", "limit", "limits", "threshold", "range", "period",
  "duration", "frequency", "schedule", "scheduled", "recurring", "repeat",
  "once", "daily", "weekly", "monthly", "yearly", "annual", "quarter",
  "quarterly", "year", "years", "month", "months", "day", "days", "hour",
  "hours", "minute", "minutes", "second", "seconds", "time", "times",
]);

function isEnglishish(str) {
  if (typeof str !== "string") return false;
  if (!/^[A-Za-z0-9 ,.'!?%()/&:_-]+$/.test(str)) return false;
  const words = str.toLowerCase().split(/[^a-z']+/).filter((w) => w.length >= 2);
  if (words.length === 0) return false;
  const hits = words.filter((w) => enWords.has(w));
  return hits.length > 0;
}

const results = [];
function walk(obj, p) {
  if (typeof obj === "string") {
    if (isEnglishish(obj)) results.push(`${p} = ${JSON.stringify(obj)}`);
    return;
  }
  if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) walk(obj[k], p ? `${p}.${k}` : k);
  }
}
walk(az, "");
console.log(`${results.length} suspicious entries found`);
console.log(results.join("\n"));
