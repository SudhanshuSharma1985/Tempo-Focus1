const APP_LOGIN_EMAIL = String(process.env.APP_LOGIN_EMAIL || "").trim().toLowerCase();

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed." });
    return;
  }

  let body = {};
  try {
    if (req.body && typeof req.body === "object") {
      body = req.body;
    } else {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const text = Buffer.concat(chunks).toString();
      body = text ? JSON.parse(text) : {};
    }
  } catch {
    res.status(400).json({ ok: false, error: "Invalid request body." });
    return;
  }

  const normalizedEmail = String(body.email || "").trim().toLowerCase();

  if (!isValidEmail(normalizedEmail)) {
    res.status(400).json({ ok: false, error: "Enter a valid email ID." });
    return;
  }

  if (APP_LOGIN_EMAIL && normalizedEmail !== APP_LOGIN_EMAIL) {
    res.status(401).json({ ok: false, error: "This email ID is not allowed." });
    return;
  }

  res.status(200).json({ ok: true, email: normalizedEmail });
};

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
