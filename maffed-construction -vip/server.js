/* Maffed Construction: zero-dependency server (Node.js 14+). Run: npm start
   - serves the website from /public and uploaded files from /uploads
   - stores posts in data/db.json
   - customers submit -> "pending"; the company approves or rejects in /admin.html */
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const PORT = process.env.PORT || 3000;
const ADMIN_KEY = process.env.ADMIN_KEY || "change-me-123";   // CHANGE THIS (see README)
const PUB = path.join(__dirname, "public"), UP = path.join(__dirname, "uploads"), DATA = path.join(__dirname, "data"), DBF = path.join(DATA, "db.json");
[UP, DATA].forEach((d) => fs.mkdirSync(d, { recursive: true }));
let db = { posts: [], messages: [] };
try { db = JSON.parse(fs.readFileSync(DBF, "utf8")); } catch (e) {}
const save = () => fs.writeFileSync(DBF, JSON.stringify(db, null, 1));
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".json": "application/json", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".mp4": "video/mp4", ".webm": "video/webm", ".pdf": "application/pdf", ".svg": "image/svg+xml", ".ico": "image/x-icon" };
const EXT = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "video/mp4": ".mp4", "video/webm": ".webm", "application/pdf": ".pdf" };
const CUSTOMER_KINDS = ["market", "rent", "hub"], ALL_KINDS = ["market", "rent", "hub", "portfolio", "bid", "law"];
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
const clean = (v, n) => String(v == null ? "" : v).slice(0, n || 400);
const body = (req) => new Promise((ok, no) => {
  let n = 0; const c = [];
  req.on("data", (d) => { n += d.length; if (n > 120e6) { no(new Error("too large")); req.destroy(); } else c.push(d); });
  req.on("end", () => { try { ok(JSON.parse(Buffer.concat(c).toString() || "{}")); } catch (e) { no(e); } });
  req.on("error", no);
});
function saveMedia(list) {
  const out = [];
  (Array.isArray(list) ? list : []).slice(0, 10).forEach((m) => {
    const s = String((m && m.dataUrl) || ""), i = s.indexOf(";base64,");
    if (!s.startsWith("data:") || i < 0) return;
    const mime = s.slice(5, i), ext = EXT[mime]; if (!ext) return;
    const buf = Buffer.from(s.slice(i + 8), "base64"); if (!buf.length || buf.length > 40e6) return;
    const name = crypto.randomBytes(8).toString("hex") + ext;
    fs.writeFileSync(path.join(UP, name), buf);
    out.push({ type: mime === "application/pdf" ? "pdf" : mime.split("/")[0], url: "/uploads/" + name, name: clean(m.name, 80) || name });
  });
  return out;
}
const fields = (b) => ({ type: clean(b.type, 40), title: clean(b.title, 150), location: clean(b.location, 150), area: clean(b.area, 30), purpose: clean(b.purpose, 30), price: clean(b.price, 80), details: clean(b.details, 4000), criteria: clean(b.criteria, 4000), deadline: clean(b.deadline, 40), year: clean(b.year, 10), stage: clean(b.stage, 30) });
const pub = (p) => ({ id: p.id, kind: p.kind, type: p.type, title: p.title, location: p.location, area: p.area, purpose: p.purpose, price: p.price, details: p.details, criteria: p.criteria, deadline: p.deadline, year: p.year, stage: p.stage, media: p.media, createdAt: p.createdAt, approvedAt: p.approvedAt, source: p.source });
const isAdmin = (req) => { const a = crypto.createHash("sha256").update(String(req.headers["x-admin-key"] || "")).digest(), b = crypto.createHash("sha256").update(ADMIN_KEY).digest(); return crypto.timingSafeEqual(a, b); };

async function api(req, res, p) {
  if (req.method === "GET" && p === "/api/ping") return send(res, 200, { ok: true });
  if (req.method === "GET" && p === "/api/posts") return send(res, 200, db.posts.filter((x) => x.status === "approved").sort((a, b) => b.approvedAt - a.approvedAt).map(pub));
  if (req.method === "GET" && p.startsWith("/api/status/")) {
    const x = db.posts.find((q) => q.code && q.code === p.slice(12).toUpperCase());
    return x ? send(res, 200, { title: x.title, status: x.status, note: x.note || "" }) : send(res, 404, { error: "not found" });
  }
  if (req.method === "POST" && p === "/api/submit") {
    const b = await body(req);
    if (!CUSTOMER_KINDS.includes(b.kind)) return send(res, 400, { error: "bad kind" });
    const f = fields(b), name = clean(b.name, 100), phone = clean(b.phone, 40);
    if (!f.title || !name || !phone) return send(res, 400, { error: "missing fields" });
    const x = { id: crypto.randomBytes(6).toString("hex"), code: crypto.randomBytes(4).toString("hex").toUpperCase(), kind: b.kind, status: "pending", source: "customer", createdAt: Date.now(), ...f, media: saveMedia(b.media), contact: { name, phone, email: clean(b.email, 120) } };
    db.posts.push(x); save(); return send(res, 200, { id: x.id, code: x.code });
  }
  if (req.method === "POST" && p === "/api/contact") {
    const b = await body(req);
    db.messages.unshift({ id: crypto.randomBytes(6).toString("hex"), at: Date.now(), name: clean(b.name, 100), phone: clean(b.phone, 40), email: clean(b.email, 120), service: clean(b.service, 120), message: clean(b.message, 3000) });
    db.messages = db.messages.slice(0, 500); save(); return send(res, 200, { ok: true });
  }
  if (!p.startsWith("/api/admin/")) return send(res, 404, { error: "not found" });
  if (!isAdmin(req)) return send(res, 401, { error: "wrong key" });
  if (req.method === "GET" && p === "/api/admin/data") return send(res, 200, { posts: db.posts.slice().sort((a, b) => b.createdAt - a.createdAt), messages: db.messages });
  const b = await body(req);
  if (p === "/api/admin/decide") {
    const x = db.posts.find((q) => q.id === b.id); if (!x || !["approved", "rejected"].includes(b.status)) return send(res, 400, { error: "bad request" });
    x.status = b.status; x.note = clean(b.note, 500); if (b.status === "approved") x.approvedAt = Date.now(); save(); return send(res, 200, { ok: true });
  }
  if (p === "/api/admin/post") {
    if (!ALL_KINDS.includes(b.kind)) return send(res, 400, { error: "bad kind" });
    const f = fields(b); if (!f.title) return send(res, 400, { error: "title required" });
    const now = Date.now(); db.posts.push({ id: crypto.randomBytes(6).toString("hex"), code: "", kind: b.kind, status: "approved", source: "company", createdAt: now, approvedAt: now, ...f, media: saveMedia(b.media) });
    save(); return send(res, 200, { ok: true });
  }
  if (p === "/api/admin/delete") {
    const x = db.posts.find((q) => q.id === b.id);
    if (x) { (x.media || []).forEach((m) => fs.unlink(path.join(UP, path.basename(m.url)), () => {})); db.posts = db.posts.filter((q) => q !== x); save(); }
    return send(res, 200, { ok: true });
  }
  if (p === "/api/admin/msgdelete") { db.messages = db.messages.filter((m) => m.id !== b.id); save(); return send(res, 200, { ok: true }); }
  return send(res, 404, { error: "not found" });
}

http.createServer(async (req, res) => {
  try {
    const p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.startsWith("/api/")) return await api(req, res, p);
    const base = p.startsWith("/uploads/") ? UP : PUB;
    const rel = p.startsWith("/uploads/") ? p.slice(9) : (p === "/" ? "index.html" : p === "/admin" ? "admin.html" : p.slice(1));
    const f = path.resolve(base, rel);
    if (!f.startsWith(base + path.sep)) { res.writeHead(403); return res.end(); }
    fs.readFile(f, (e, d) => {
      if (e) { res.writeHead(404); return res.end("Not found"); }
      res.writeHead(200, { "Content-Type": TYPES[path.extname(f).toLowerCase()] || "application/octet-stream" }); res.end(d);
    });
  } catch (e) { send(res, 500, { error: "server error" }); }
}).listen(PORT, () => {
  console.log("Website:  http://localhost:" + PORT + "\nCompany:  http://localhost:" + PORT + "/admin.html");
  if (ADMIN_KEY === "change-me-123") console.log("WARNING: default admin password in use. Set ADMIN_KEY before going online (see README).");
});
