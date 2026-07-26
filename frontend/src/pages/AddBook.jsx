import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";
import { banglishToBangla, looksLikeBanglish } from "../lib/banglish";
import { fetchBookInfo, fetchBookInfoByUrl } from "../lib/scrapeApi";

const emptyForm = {
  title: "",
  author: "",
  publisher: "",
  category: "",
  price: "",
  originalPrice: "",
  pages: "",
  cover: "",
  sourceSite: null,
  sourceUrl: "",
  shelfNumber: "",
  volumeCount: "",
};

export default function AddBook() {
  const { addBook, categories, addCategory, isAdmin, adminLogin, findDuplicate } = useLibrary();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [bookLink, setBookLink] = useState("");

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const titleBangla = looksLikeBanglish(form.title)
    ? banglishToBangla(form.title)
    : form.title;

  async function handleAutoFetch(site) {
    if (!titleBangla.trim()) {
      setFetchMsg("আগে বইয়ের নাম লিখুন");
      return;
    }
    setFetching(true);
    setFetchMsg("তথ্য খোঁজা হচ্ছে…");
    try {
      const data = await fetchBookInfo(titleBangla.trim(), site);
      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        author: data.author || f.author,
        publisher: data.publisher || f.publisher,
        category: data.category || f.category,
        price: data.price ?? f.price,
        originalPrice: data.originalPrice ?? f.originalPrice,
        pages: data.pages ?? f.pages,
        cover: data.cover || f.cover,
        sourceSite: site,
      }));
      if (data.category && !categories.includes(data.category)) {
        addCategory(data.category);
      }
      setFetchMsg(`তথ্য পাওয়া গেছে (${site === "wafilife" ? "WafiLife" : "Rokomari"} থেকে)। প্রয়োজনে সম্পাদনা করুন।`);
    } catch (e) {
      setFetchMsg(e.message || "তথ্য পাওয়া যায়নি, ম্যানুয়ালি পূরণ করুন");
    } finally {
      setFetching(false);
    }
  }

  async function handleFetchByLink() {
    if (!bookLink.trim()) {
      setFetchMsg("আগে বইয়ের লিংক পেস্ট করুন");
      return;
    }
    setFetching(true);
    setFetchMsg("লিংক থেকে তথ্য আনা হচ্ছে…");
    try {
      const data = await fetchBookInfoByUrl(bookLink.trim());
      setForm((f) => ({
        ...f,
        title: data.title || f.title,
        author: data.author || f.author,
        publisher: data.publisher || f.publisher,
        category: data.category || f.category,
        price: data.price ?? f.price,
        originalPrice: data.originalPrice ?? f.originalPrice,
        pages: data.pages ?? f.pages,
        cover: data.coverDataUrl || data.cover || f.cover,
        sourceSite: data.source || f.sourceSite,
        sourceUrl: data.sourceUrl || bookLink.trim(),
      }));
      if (data.category && !categories.includes(data.category)) {
        addCategory(data.category);
      }
      setFetchMsg(
        data.coverDataUrl
          ? "তথ্য ও ছবি লিংক থেকে আনা হয়েছে (ছবি ডাউনলোড হয়ে যোগ হয়েছে)। প্রয়োজনে সম্পাদনা করুন।"
          : "তথ্য আনা হয়েছে, তবে ছবি ডাউনলোড করা যায়নি। প্রয়োজনে ছবি ম্যানুয়ালি দিন।"
      );
    } catch (e) {
      setFetchMsg(e.message || "লিংক থেকে তথ্য আনা যায়নি");
    } finally {
      setFetching(false);
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("cover", reader.result);
    reader.readAsDataURL(file);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!titleBangla.trim()) return;

    const dup = findDuplicate({ title: titleBangla.trim(), sourceUrl: form.sourceUrl || null });
    if (dup) {
      const proceed = confirm(
        `এই বইটি ("${dup.title}") আগে থেকেই লাইব্রেরিতে আছে${
          dup.shelfNumber ? ` (শেলফ: ${dup.shelfNumber})` : ""
        }।\n\nতবুও যোগ করতে চান? "বাতিল" চাপলে যোগ হবে না।`
      );
      if (!proceed) return;
    }

    addBook({
      title: titleBangla.trim(),
      author: form.author.trim(),
      publisher: form.publisher.trim(),
      category: form.category || "অন্যান্য",
      price: form.price === "" ? null : Number(form.price),
      originalPrice: form.originalPrice === "" ? null : Number(form.originalPrice),
      pages: form.pages === "" ? null : Number(form.pages),
      cover: form.cover || null,
      sourceUrl: form.sourceUrl || null,
      shelfNumber: form.shelfNumber.trim() || null,
      volumeCount: form.volumeCount.toString().trim() || null,
    });
    navigate("/");
  }

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="empty-state">
          এই পেজ শুধু অ্যাডমিনের জন্য।
          <div style={{ marginTop: 12 }}>
            <button className="btn-primary" onClick={adminLogin}>
              অ্যাডমিন লগইন করুন
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <form className="form-card" onSubmit={handleSubmit}>
        <h2>নতুন বই যোগ করুন</h2>

        <div className="form-row">
          <label>বইয়ের নাম (বাংলা বা Banglish)</label>
          <input
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="যেমন: ma ma ma ebong baba"
          />
          {looksLikeBanglish(form.title) && form.title && (
            <div className="banglish-preview">রূপান্তরিত: {titleBangla}</div>
          )}
        </div>

        <div className="form-row">
          <label>বইয়ের লিংক দিয়ে সব তথ্য + ছবি আনুন (WafiLife / Rokomari)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              placeholder="যেমন: https://www.wafilife.com/.../pd/5178"
              value={bookLink}
              onChange={(e) => setBookLink(e.target.value)}
              style={{ flex: 1, minWidth: 220 }}
            />
            <button
              type="button"
              className="btn-secondary"
              disabled={fetching}
              onClick={handleFetchByLink}
            >
              লিংক থেকে আনুন
            </button>
          </div>
        </div>

        <div className="form-row">
          <label>অথবা শুধু নাম দিয়ে খুঁজে আনুন (দাম, কভার, লেখক, ক্যাটাগরি)</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn-secondary"
              disabled={fetching}
              onClick={() => handleAutoFetch("wafilife")}
            >
              WafiLife থেকে আনুন
            </button>
            <button
              type="button"
              className="btn-secondary"
              disabled={fetching}
              onClick={() => handleAutoFetch("rokomari")}
            >
              Rokomari থেকে আনুন
            </button>
          </div>
          {fetchMsg && <div className="banglish-preview">{fetchMsg}</div>}
        </div>

        <div className="two-col">
          <div className="form-row">
            <label>লেখক</label>
            <input value={form.author} onChange={(e) => update("author", e.target.value)} />
          </div>
          <div className="form-row">
            <label>প্রকাশনী</label>
            <input value={form.publisher} onChange={(e) => update("publisher", e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <label>ক্যাটাগরি</label>
          <select value={form.category} onChange={(e) => update("category", e.target.value)}>
            <option value="">নির্বাচন করুন</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
            <input
              placeholder="নতুন ক্যাটাগরি"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                const bn = looksLikeBanglish(newCategory)
                  ? banglishToBangla(newCategory)
                  : newCategory;
                if (bn.trim()) {
                  addCategory(bn.trim());
                  update("category", bn.trim());
                  setNewCategory("");
                }
              }}
            >
              যোগ করুন
            </button>
          </div>
        </div>

        <div className="two-col">
          <div className="form-row">
            <label>দাম (৳)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>মূল দাম (৳) — ছাড়ের আগে</label>
            <input
              type="number"
              value={form.originalPrice}
              onChange={(e) => update("originalPrice", e.target.value)}
            />
          </div>
        </div>

        <div className="two-col">
          <div className="form-row">
            <label>পৃষ্ঠা সংখ্যা</label>
            <input
              type="number"
              value={form.pages}
              onChange={(e) => update("pages", e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>বুকশেলফ নম্বর</label>
            <input
              placeholder="যেমন: শেলফ ৩, সারি ২"
              value={form.shelfNumber}
              onChange={(e) => update("shelfNumber", e.target.value)}
            />
          </div>
          <div className="form-row">
            <label>কয় খণ্ড/পিস</label>
            <input
              placeholder="যেমন: ৩ (৩ খণ্ড/পিস একসাথে)"
              value={form.volumeCount}
              onChange={(e) => update("volumeCount", e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <label>বইয়ের কভার</label>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            {form.cover && <img className="cover-preview" src={form.cover} alt="cover" />}
            <div style={{ flex: 1 }}>
              <input
                placeholder="ছবির URL পেস্ট করুন"
                value={form.cover?.startsWith("data:") ? "" : form.cover}
                onChange={(e) => update("cover", e.target.value)}
              />
              <div style={{ marginTop: 8 }}>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>
            </div>
          </div>
        </div>

        <button className="btn-primary" style={{ width: "100%" }} type="submit">
          বই যোগ করুন
        </button>
      </form>
    </div>
  );
}
