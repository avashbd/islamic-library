// POST /api/google-auth
// Body: { code } (first-time login) OR { refresh_token } (silent re-login on reload)
// Exchanges with Google's token endpoint using the OAuth client secret, which
// must stay server-side. This is what lets the admin's browser "remember"
// login across reloads: the refresh_token is stored in the browser
// (localStorage) and exchanged here for a fresh access_token every time,
// instead of relying on Google's fragile silent-iframe sign-in.

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") {
    res.status(405).json({ error: "POST only" });
    return;
  }

  const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  if (!CLIENT_ID || !CLIENT_SECRET) {
    res.status(500).json({
      error:
        "সার্ভারে GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET সেট করা নেই (Vercel এর Environment Variables দেখুন)।",
    });
    return;
  }

  const { code, refresh_token, redirect_uri } = req.body || {};

  try {
    let params;
    if (refresh_token) {
      params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token,
        grant_type: "refresh_token",
      });
    } else if (code) {
      params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
        // Google's JS "popup" code-flow uses the special "postmessage"
        // redirect_uri (no real redirect happens).
        redirect_uri: redirect_uri || "postmessage",
      });
    } else {
      res.status(400).json({ error: "'code' অথবা 'refresh_token' দিতে হবে" });
      return;
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await tokenRes.json();
    if (!tokenRes.ok) {
      res
        .status(400)
        .json({ error: data.error_description || data.error || "Google token exchange failed" });
      return;
    }
    // data: { access_token, expires_in, refresh_token? (only on first code exchange), scope, token_type }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || "token exchange failed" });
  }
};
