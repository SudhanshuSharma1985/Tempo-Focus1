const fsSync = require("fs");
const fs = require("fs/promises");
const http = require("http");
const path = require("path");

loadDotEnv();

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const APP_LOGIN_EMAIL = String(process.env.APP_LOGIN_EMAIL || "").trim().toLowerCase();

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".zip": "application/zip"
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === "POST" && url.pathname === "/api/login") {
      await handleLogin(req, res);
      return;
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      sendJson(res, 405, { ok: false, error: "Method not allowed." });
      return;
    }

    await serveStatic(url.pathname, req, res);
  } catch (error) {
    sendJson(res, 500, { ok: false, error: error.message || "Server error." });
  }
});

server.listen(PORT, () => {
  console.log(`TempoFocus running at http://localhost:${PORT}/`);
});

async function handleLogin(req, res) {
  const { email } = await readJson(req);
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    sendJson(res, 400, { ok: false, error: "Enter a valid email ID." });
    return;
  }

  if (APP_LOGIN_EMAIL && normalizedEmail !== APP_LOGIN_EMAIL) {
    sendJson(res, 401, { ok: false, error: "This email ID is not allowed." });
    return;
  }

  sendJson(res, 200, { ok: true, email: normalizedEmail });
}

async function readJson(req) {
  let body = "";
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 1024 * 1024) throw new Error("Request body too large.");
  }
  return body ? JSON.parse(body) : {};
}

async function serveStatic(urlPath, req, res) {
  const requested = urlPath === "/" ? "/index.html" : urlPath;
  const decodedPath = decodeURIComponent(requested);
  const filePath = path.resolve(ROOT, `.${decodedPath}`);

  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { ok: false, error: "Forbidden." });
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const headers = {
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-cache"
    };

    if (filePath.includes(`${path.sep}downloads${path.sep}`)) {
      headers["Content-Disposition"] = `attachment; filename="${path.basename(filePath)}"`;
    }

    res.writeHead(200, {
      ...headers,
      "Content-Length": file.length
    });
    if (req.method === "HEAD") {
      res.end();
    } else {
      res.end(file);
    }
  } catch {
    sendJson(res, 404, { ok: false, error: "Not found." });
  }
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function loadDotEnv() {
  const envPath = path.join(__dirname, ".env");
  if (!fsSync.existsSync(envPath)) return;

  const lines = fsSync.readFileSync(envPath, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const separator = trimmed.indexOf("=");
    if (separator === -1) return;
    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  });
}
