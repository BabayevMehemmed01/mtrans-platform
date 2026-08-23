const fs = require("fs");
const path = require("path");

const ruPath = path.join(__dirname, "..", "src", "locales", "ru.json");
const az = JSON.parse(fs.readFileSync(ruPath, "utf8"));

// Rus mətnində Kiril hərfləri olmalıdır. Əgər dəyər tamamilə Latın hərfləri ilə
// yazılıbsa VƏ məlum ingilis sözlərindən birini ehtiva edirsə, şübhəli hesab edilir.
const enWords = new Set([
  "the", "and", "of", "is", "are", "to", "for", "not", "done", "overdue", "review",
  "loading", "please", "select", "search", "create", "update", "delete", "edit",
  "save", "cancel", "submit", "confirm", "add", "remove", "close", "back", "next",
  "previous", "filter", "export", "import", "download", "upload", "view", "details",
  "settings", "actions", "status", "name", "description", "date", "amount", "total",
  "price", "quantity", "no", "results", "data", "with", "from", "this", "that",
  "week", "today", "tomorrow", "yesterday", "new", "all", "none", "yes", "required",
  "list", "board", "planner", "backlog", "todo", "campaign", "campaigns",
  "ads", "segment", "segments", "template", "templates", "analytics", "transfer",
  "transfers", "sales", "order", "orders", "inventory", "write-off", "write-offs",
  "warehouse", "warehouses", "product", "products", "supplier", "suppliers",
  "stock", "dashboard", "default", "email", "start", "end", "deadline",
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
