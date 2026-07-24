// Calls the Vercel backend which fetches price/cover/category/author info
// from wafilife.com or rokomari.com. The user is never navigated to those
// sites; this is a plain background fetch.

const API_BASE = import.meta.env.VITE_API_BASE_URL; // e.g. https://your-app.vercel.app

export async function fetchBookInfo(bookNameBangla, site = "wafilife") {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL সেট করা নেই। .env ফাইল দেখুন।");
  }
  const url = `${API_BASE}/api/scrape?q=${encodeURIComponent(bookNameBangla)}&site=${site}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "তথ্য আনা যায়নি");
  return json;
}

// Fetches book info directly from a pasted WafiLife / Rokomari product link.
// The backend also downloads the cover image and returns it as a base64
// data URL (json.coverDataUrl) so it can be stored directly, no separate
// download step needed on the frontend.
export async function fetchBookInfoByUrl(productUrl) {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL সেট করা নেই। .env ফাইল দেখুন।");
  }
  const url = `${API_BASE}/api/scrape?url=${encodeURIComponent(productUrl)}`;
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "লিংক থেকে তথ্য আনা যায়নি");
  return json;
}
