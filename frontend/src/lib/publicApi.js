const API_BASE = import.meta.env.VITE_API_BASE_URL;

// Used by ordinary visitors: no Google login involved at all. The backend
// uses the admin's stored refresh token to read the Drive file on their
// behalf and returns it here as plain JSON.
export async function fetchPublicLibrary() {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL সেট করা নেই। .env ফাইল দেখুন।");
  }
  const res = await fetch(`${API_BASE}/api/library`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "লাইব্রেরি ডেটা আনা যায়নি");
  return json;
}
