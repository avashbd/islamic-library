// Minimal Google Drive client using Google Identity Services (GIS) for auth
// and the Drive REST API for storage. Data is kept as a single JSON file in
// the app's hidden "appDataFolder" (invisible in the user's normal Drive UI,
// accessible only to this app).
//
// Auth uses the OAuth "authorization code" flow (not the old implicit token
// flow) so that on first login we get a refresh_token, which is stored in
// this browser's localStorage. On every later reload we silently trade that
// refresh_token for a fresh access_token via the backend — no Google popup,
// no re-login needed on this device.
//
// Requires VITE_GOOGLE_CLIENT_ID and VITE_API_BASE_URL in your .env file.

const DATA_FILENAME = "islamic-library-data.json";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const REFRESH_TOKEN_KEY = "islamic_library_gdrive_refresh_token";

let accessToken = null;
let tokenExpiry = 0;

function apiBase() {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) throw new Error("VITE_API_BASE_URL সেট করা নেই। .env ফাইল দেখুন।");
  return base;
}

function ensureGis() {
  if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
    throw new Error(
      "Google Identity Services স্ক্রিপ্ট লোড হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।"
    );
  }
}

export function isSignedIn() {
  return !!accessToken && Date.now() < tokenExpiry;
}

export function getAccessToken() {
  return accessToken;
}

export function getStoredRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

function storeRefreshToken(token) {
  try {
    if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } catch {
    // ignore storage errors (private browsing etc.)
  }
}

async function exchangeWithBackend(payload) {
  const res = await fetch(`${apiBase()}/api/google-auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Google লগইন যাচাই ব্যর্থ হয়েছে");
  return json;
}

function applyTokenResponse(data) {
  accessToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  if (data.refresh_token) storeRefreshToken(data.refresh_token);
}

// interactive=true  -> shows the Google account picker/consent popup (first
//                      login, or if the stored refresh_token has expired).
// interactive=false -> silent: uses the refresh_token stored on this device.
//                      Throws if none is stored (caller should then show the
//                      "Admin Login" button instead of the whole app).
export function signIn({ interactive = true } = {}) {
  if (!interactive) {
    const stored = getStoredRefreshToken();
    if (!stored) return Promise.reject(new Error("no stored refresh token"));
    return exchangeWithBackend({ refresh_token: stored }).then((data) => {
      applyTokenResponse(data);
      return accessToken;
    });
  }

  ensureGis();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return Promise.reject(new Error("VITE_GOOGLE_CLIENT_ID সেট করা নেই। .env ফাইল দেখুন।"));
  }

  return new Promise((resolve, reject) => {
    const codeClient = window.google.accounts.oauth2.initCodeClient({
      client_id: clientId,
      scope: SCOPE,
      ux_mode: "popup",
      // access_type/prompt=consent force Google to issue a refresh_token
      // (it's only returned the first time otherwise).
      access_type: "offline",
      prompt: "consent",
      callback: async (resp) => {
        if (resp.error) {
          reject(new Error(resp.error));
          return;
        }
        try {
          const data = await exchangeWithBackend({ code: resp.code });
          applyTokenResponse(data);
          resolve({ accessToken, refreshTokenIssued: !!data.refresh_token });
        } catch (e) {
          reject(e);
        }
      },
    });
    codeClient.requestCode();
  });
}

export function signOut() {
  accessToken = null;
  tokenExpiry = 0;
  try {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

async function driveFetch(url, options = {}) {
  if (!isSignedIn()) throw new Error("Google Drive এর সাথে সংযুক্ত নয়");
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Drive API error ${res.status}: ${body}`);
  }
  return res;
}

async function findDataFileId() {
  const q = encodeURIComponent(`name='${DATA_FILENAME}'`);
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=files(id,name)`
  );
  const json = await res.json();
  return json.files && json.files.length ? json.files[0].id : null;
}

const DEFAULT_DATA = {
  passwordHash: null,
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

export async function readData() {
  const fileId = await findDataFileId();
  if (!fileId) return { ...DEFAULT_DATA };
  const res = await driveFetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
  );
  try {
    const json = await res.json();
    return { ...DEFAULT_DATA, ...json };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export async function writeData(data) {
  const fileId = await findDataFileId();
  const body =
    `--boundary\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(
      fileId ? {} : { name: DATA_FILENAME, parents: ["appDataFolder"] }
    )}\r\n` +
    `--boundary\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${JSON.stringify(data)}\r\n` +
    `--boundary--`;

  const url = fileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

  await driveFetch(url, {
    method: fileId ? "PATCH" : "POST",
    headers: { "Content-Type": "multipart/related; boundary=boundary" },
    body,
  });
}
