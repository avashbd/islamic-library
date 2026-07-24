import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useLibrary } from "../context/LibraryContext";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, categories, updateBook, deleteBook } = useLibrary();
  const book = books.find((b) => b.id === id);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(book || {});

  if (!book) {
    return (
      <div className="container">
        <div className="empty-state">বইটি পাওয়া যায়নি।</div>
      </div>
    );
  }

  const update = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  return (
    <div className="container">
      <div className="form-card">
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
          <img
            className="cover-preview"
            style={{ width: 140, height: 200 }}
            src={book.cover || "https://placehold.co/300x440/f0ece7/746a63?text=No+Cover"}
            alt={book.title}
          />
          <div style={{ flex: 1, minWidth: 220 }}>
            {!editing ? (
              <>
                {book.category && <span className="badge">{book.category}</span>}
                <h2 style={{ margin: "8px 0 4px" }}>{book.title}</h2>
                {book.author && <div className="book-card-author">লেখক: {book.author}</div>}
                {book.publisher && <div className="book-card-author">প্রকাশনী: {book.publisher}</div>}
                {book.pages && <div className="book-card-author">পৃষ্ঠা: {book.pages}</div>}
                {book.shelfNumber && (
                  <div className="book-card-author">শেলফ: {book.shelfNumber}</div>
                )}
                <div className="book-card-price" style={{ fontSize: 20, marginTop: 10 }}>
                  {book.price != null ? `${book.price}৳` : "দাম যোগ করা হয়নি"}
                  {book.originalPrice && book.originalPrice !== book.price && (
                    <span className="original">{book.originalPrice}৳</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button className="btn-secondary" onClick={() => setEditing(true)}>
                    সম্পাদনা করুন
                  </button>
                  <button
                    className="btn-outline-danger"
                    onClick={() => {
                      if (confirm("এই বইটি মুছে ফেলতে চান?")) {
                        deleteBook(book.id);
                        navigate("/");
                      }
                    }}
                  >
                    মুছে ফেলুন
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="form-row">
                  <label>নাম</label>
                  <input value={form.title} onChange={(e) => update("title", e.target.value)} />
                </div>
                <div className="two-col">
                  <div className="form-row">
                    <label>লেখক</label>
                    <input value={form.author || ""} onChange={(e) => update("author", e.target.value)} />
                  </div>
                  <div className="form-row">
                    <label>প্রকাশনী</label>
                    <input value={form.publisher || ""} onChange={(e) => update("publisher", e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <label>ক্যাটাগরি</label>
                  <select value={form.category || ""} onChange={(e) => update("category", e.target.value)}>
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="two-col">
                  <div className="form-row">
                    <label>দাম</label>
                    <input
                      type="number"
                      value={form.price ?? ""}
                      onChange={(e) => update("price", Number(e.target.value))}
                    />
                  </div>
                  <div className="form-row">
                    <label>পৃষ্ঠা</label>
                    <input
                      type="number"
                      value={form.pages ?? ""}
                      onChange={(e) => update("pages", Number(e.target.value))}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <label>বুকশেলফ নম্বর</label>
                  <input
                    placeholder="যেমন: শেলফ ৩, সারি ২"
                    value={form.shelfNumber || ""}
                    onChange={(e) => update("shelfNumber", e.target.value)}
                  />
                </div>
                <div className="form-row">
                  <label>কভার URL</label>
                  <input value={form.cover || ""} onChange={(e) => update("cover", e.target.value)} />
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      updateBook(book.id, form);
                      setEditing(false);
                    }}
                  >
                    সংরক্ষণ করুন
                  </button>
                  <button className="btn-secondary" onClick={() => setEditing(false)}>
                    বাতিল
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
