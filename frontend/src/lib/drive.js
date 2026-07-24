// Minimal Google Drive client using Google Identity Services (GIS) for auth
// and the Drive REST API for storage. Data is kept as a single JSON file in
// the app's hidden "appDataFolder" (invisible in the user's normal Drive UI,
// accessible only to this app).
//
// Requires a Google Cloud OAuth Client ID (see README) set as
// VITE_GOOGLE_CLIENT_ID in your .env file.

const DATA_FILENAME = "islamic-library-data.json";
const SCOPE = "https://www.googleapis.com/auth/drive.appdata";

let tokenClient = null;
let accessToken = null;
let tokenExpiry = 0;

function gisReady() {
  return !!(window.google && window.google.accounts && window.google.accounts.oauth2);
}

// Waits for the Google Identity Services script (loaded async/defer in
// index.html) to finish loading, polling briefly instead of assuming it's
// already there.
function waitForGis(timeoutMs = 5000) {
  return new Promise((resolve, reject) => {
    if (gisReady()) return resolve();
    const start = Date.now();
    const interval = setInterval(() => {
      if (gisReady()) {
        clearInterval(interval);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(interval);
        reject(
          new Error(
            "Google Identity Services স্ক্রিপ্ট লোড হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।"
          )
        );
      }
    }, 100);
  });
}

export function isSignedIn() {
  return !!accessToken && Date.now() < tokenExpiry;
}

export function getAccessToken() {
  return accessToken;
}

// Attempts a silent (no popup) sign-in first; falls back to interactive.
export async function signIn({ interactive = true } = {}) {
  await waitForGis();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID সেট করা নেই। .env ফাইল দেখুন।");
  }

  return new Promise((resolve, reject) => {
    let settled = false;
    // Some browsers silently drop the "prompt: none" callback entirely
    // (e.g. third-party storage/cookie restrictions), so without a timeout
    // the app would hang on "লোড হচ্ছে..." forever. Give it a few seconds,
    // then fail so the UI can show the manual connect button instead.
    const timer = !interactive
      ? setTimeout(() => {
          if (!settled) {
            settled = true;
            reject(new Error("silent_sign_in_timeout"));
          }
        }, 4000)
      : null;

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      prompt: interactive ? "" : "none",
      callback: (resp) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        if (resp.error) {
          reject(new Error(resp.error));
          return;
        }
        accessToken = resp.access_token;
        tokenExpiry = Date.now() + (resp.expires_in - 60) * 1000;
        resolve(accessToken);
      },
    });
    tokenClient.requestAccessToken({ prompt: interactive ? "" : "none" });
  });
}

export function signOut() {
  if (accessToken && window.google?.accounts?.oauth2?.revoke) {
    window.google.accounts.oauth2.revoke(accessToken, () => {});
  }
  accessToken = null;
  tokenExpiry = 0;
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
