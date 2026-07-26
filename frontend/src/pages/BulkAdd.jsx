import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";
import { fetchBookInfoByUrl } from "../lib/scrapeApi";

// One row per pasted link: fetched data + edit state + status.
function makeRow(link) {
  return {
    id: crypto.randomUUID(),
    link,
    status: "pending", // pending | loading | done | error
    error: null,
    title: "",
    author: "",
    publisher: "",
    category: "",
    customCategory: "",
    price: "",
    originalPrice: "",
    pages: "",
    cover: "",
    shelfNumber: "",
    volumeCount: "",
    duplicateOf: null, // matching existing book, if any
    includeAnyway: false, // admin's decision when a duplicate is found
  };
}

export default function BulkAdd() {
  const { addBook, addCategory, categories, isAdmin, adminLogin, findDuplicate } = useLibrary();
  const navigate = useNavigate();
  const [linksText, setLinksText] = useState("");
  const [rows, setRows] = useState([]);
  const [fetchingAll, setFetchingAll] = useState(false);
  const [saving, setSaving] = useState(false);

  function updateRow(id, patch) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleFetchAll() {
    const links = linksText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (links.length === 0) return;

    const newRows = links.map(makeRow);
    setRows(newRows);
    setFetchingAll(true);

    // Fetch one by one (gentler on the backend / source site than parallel).
    for (const row of newRows) {
      updateRow(row.id, { status: "loading" });
      try {
        const data = await fetchBookInfoByUrl(row.link);
        const dup = findDuplicate({ title: data.title || "", sourceUrl: row.link });
        updateRow(row.id, {
          status: "done",
          title: data.title || "",
          author: data.author || "",
          publisher: data.publisher || "",
          category: data.category || "",
          price: data.price ?? "",
          originalPrice: data.originalPrice ?? "",
          pages: data.pages ?? "",
          cover: data.coverDataUrl || data.cover || "",
          duplicateOf: dup,
        });
      } catch (e) {
        updateRow(row.id, { status: "error", error: e.message || "তথ্য আনা যায়নি" });
      }
    }
    setFetchingAll(false);
  }

  async function handleSaveAll() {
    setSaving(true);
    const usableRows = rows.filter(
      (r) => r.status === "done" && r.title.trim() && (!r.duplicateOf || r.includeAnyway)
    );
    for (const r of usableRows) {
      const finalCategory = r.category === "__custom__" ? r.customCategory.trim() : r.category;
      if (finalCategory && !categories.includes(finalCategory)) {
        addCategory(finalCategory);
      }
      addBook({
        title: r.title.trim(),
        author: r.author.trim(),
        publisher: r.publisher.trim(),
        category: finalCategory || "অন্যান্য",
        price: r.price === "" ? null : Number(r.price),
        originalPrice: r.originalPrice === "" ? null : Number(r.originalPrice),
        pages: r.pages === "" ? null : Number(r.pages),
        cover: r.cover || null,
        sourceUrl: r.link,
        shelfNumber: r.shelfNumber.trim() || null,
        volumeCount: r.volumeCount.toString().trim() || null,
      });
    }
    setSaving(false);
    navigate("/");
  }

  const doneCount = rows.filter((r) => r.status === "done").length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const willSaveCount = rows.filter(
    (r) => r.status === "done" && r.title.trim() && (!r.duplicateOf || r.includeAnyway)
  ).length;

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
      <h2 style={{ marginBottom: 4 }}>একসাথে অনেক বই যোগ করুন</h2>
      <p style={{ marginBottom: 16, color: "#746a63" }}>
        যত ইচ্ছা বইয়ের লিংক এক লাইনে একটা করে পেস্ট করুন (WafiLife / Rokomari)। প্রতিটার
        তথ্য ও ছবি স্বয়ংক্রিয়ভাবে আনা হবে, নিচে প্রতিটার পাশে তথ্য দেখাবে — ভুল থাকলে
        সরাসরি এখানেই ঠিক করে নিতে পারবেন, তারপর সব একসাথে সংরক্ষণ করুন।
      </p>

      <div className="form-card" style={{ marginBottom: 20 }}>
        <div className="form-row">
          <label>বইয়ের লিংকসমূহ (এক লাইনে একটা)</label>
          <textarea
            rows={6}
            placeholder={
              "https://www.wafilife.com/.../pd/12345\nhttps://www.wafilife.com/.../pd/67890\nhttps://www.rokomari.com/book/...."
            }
            value={linksText}
            onChange={(e) => setLinksText(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={handleFetchAll} disabled={fetchingAll}>
          {fetchingAll ? "তথ্য আনা হচ্ছে…" : "সব লিংক থেকে তথ্য আনুন"}
        </button>
      </div>

      {rows.length > 0 && (
        <>
          <div style={{ marginBottom: 12, color: "#746a63" }}>
            মোট {rows.length}টি লিংক — {doneCount}টি সফল
            {errorCount > 0 && `, ${errorCount}টি ব্যর্থ`}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {rows.map((r) => (
              <div key={r.id} className="form-card" style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                <img
                  src={r.cover || "https://placehold.co/300x440/f0ece7/746a63?text=No+Cover"}
                  alt=""
                  className="cover-preview"
                  style={{ width: 90, height: 130, flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 13, color: "#a3311f", marginBottom: 6, wordBreak: "break-all" }}>
                    {r.link}
                    {r.status === "loading" && " — আনা হচ্ছে…"}
                    {r.status === "error" && ` — সমস্যা: ${r.error}`}
                  </div>

                  {r.duplicateOf && (
                    <div
                      style={{
                        background: "#fff3cd",
                        color: "#5c4a12",
                        padding: 8,
                        borderRadius: 8,
                        marginBottom: 8,
                        fontSize: 14,
                      }}
                    >
                      ⚠️ এই বইটি ("{r.duplicateOf.title}") আগে থেকেই লাইব্রেরিতে আছে।
                      <label style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
                        <input
                          type="checkbox"
                          checked={r.includeAnyway}
                          onChange={(e) => updateRow(r.id, { includeAnyway: e.target.checked })}
                        />
                        তবুও যোগ করুন
                      </label>
                    </div>
                  )}

                  {r.status !== "pending" && r.status !== "loading" && (
                    <>
                      <div className="two-col">
                        <div className="form-row">
                          <label>নাম</label>
                          <input
                            value={r.title}
                            onChange={(e) => updateRow(r.id, { title: e.target.value })}
                          />
                        </div>
                        <div className="form-row">
                          <label>লেখক</label>
                          <input
                            value={r.author}
                            onChange={(e) => updateRow(r.id, { author: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="two-col">
                        <div className="form-row">
                          <label>প্রকাশনী</label>
                          <input
                            value={r.publisher}
                            onChange={(e) => updateRow(r.id, { publisher: e.target.value })}
                          />
                        </div>
                        <div className="form-row">
                          <label>ক্যাটাগরি</label>
                          <select
                            value={r.category}
                            onChange={(e) => updateRow(r.id, { category: e.target.value })}
                          >
                            <option value="">নির্বাচন করুন</option>
                            {categories.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                            {r.category && !categories.includes(r.category) && r.category !== "__custom__" && (
                              <option value={r.category}>{r.category} (WafiLife থেকে)</option>
                            )}
                            <option value="__custom__">+ নতুন ক্যাটাগরি লিখুন</option>
                          </select>
                          {r.category === "__custom__" && (
                            <input
                              style={{ marginTop: 6 }}
                              placeholder="নতুন ক্যাটাগরির নাম"
                              value={r.customCategory}
                              onChange={(e) => updateRow(r.id, { customCategory: e.target.value })}
                            />
                          )}
                        </div>
                      </div>
                      <div className="two-col">
                        <div className="form-row">
                          <label>দাম (৳)</label>
                          <input
                            type="number"
                            value={r.price}
                            onChange={(e) => updateRow(r.id, { price: e.target.value })}
                          />
                        </div>
                        <div className="form-row">
                          <label>মূল দাম (৳)</label>
                          <input
                            type="number"
                            value={r.originalPrice}
                            onChange={(e) => updateRow(r.id, { originalPrice: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="two-col">
                        <div className="form-row">
                          <label>পৃষ্ঠা</label>
                          <input
                            type="number"
                            value={r.pages}
                            onChange={(e) => updateRow(r.id, { pages: e.target.value })}
                          />
                        </div>
                        <div className="form-row">
                          <label>বুকশেলফ নম্বর</label>
                          <input
                            placeholder="যেমন: শেলফ ৩"
                            value={r.shelfNumber}
                            onChange={(e) => updateRow(r.id, { shelfNumber: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="form-row">
                        <label>কয় খণ্ড/পিস</label>
                        <input
                          placeholder="যেমন: ৩"
                          value={r.volumeCount}
                          onChange={(e) => updateRow(r.id, { volumeCount: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  <button
                    className="btn-outline-danger"
                    style={{ marginTop: 8 }}
                    onClick={() => removeRow(r.id)}
                  >
                    এই লিংক বাদ দিন
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            className="btn-primary"
            style={{ marginTop: 20 }}
            onClick={handleSaveAll}
            disabled={saving || fetchingAll || willSaveCount === 0}
          >
            {saving ? "সংরক্ষণ হচ্ছে…" : `সব বই সংরক্ষণ করুন (${willSaveCount}টি)`}
          </button>
        </>
      )}
    </div>
  );
}
