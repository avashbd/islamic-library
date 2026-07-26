// GET /api/library
// Publicly returns { books, categories, passwordHash } so ordinary visitors
// can view the library WITHOUT ever signing in to Google themselves.
//
// One-time admin setup required: after the admin logs in once from the
// website (Admin Login button), the app shows a refresh_token. Paste that
// into this Vercel project's Environment Variables as GOOGLE_REFRESH_TOKEN,
// alongside GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET. This backend then uses
// that one stored token to read the admin's Drive file on every visitor's
// behalf (read-only).

const DATA_FILENAME = "islamic-library-data.json";

const DEFAULT_DATA = {
  passwordHash: null, // frontend falls back to the default "Avash" password if null
  books: [],
  categories: [
    "আকিদা",
    "তাফসীর",
    "হাদিস",
    "ফিকহ",
    "সীরাত",
    "আদব, আখলাক",
    "ইতিহাস",
    "দাওয়াহ",
    "উপন্যাস",
    "অন্যান্য",
  ],
};

async function getAccessToken() {
  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error(
      "GOOGLE_REFRESH_TOKEN এখনো সেট করা হয়নি। অ্যাডমিন একবার লগইন করে Vercel এ সেট করে দিলে এই ফিচার কাজ করবে।"
    );
  }
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    refresh_token: REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error_description || data.error || "token refresh failed");
  return data.access_token;
}

async function findDataFileId(accessToken) {
  const q = encodeURIComponent(`name='${DATA_FILENAME}'`);
  const r = await fetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!r.ok) throw new Error(`Drive list failed (${r.status})`);
  const json = await r.json();
  return json.files && json.files.length ? json.files[0].id : null;
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const accessToken = await getAccessToken();
    const fileId = await findDataFileId(accessToken);
    if (!fileId) {
      res.status(200).json(DEFAULT_DATA);
      return;
    }
    const fileRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!fileRes.ok) throw new Error(`Drive read failed (${fileRes.status})`);
    const data = await fileRes.json();
    res.status(200).json({ ...DEFAULT_DATA, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message || "লাইব্রেরি ডেটা আনা যায়নি" });
  }
};
