import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";
import BookCard from "../components/BookCard";

const TYPE_LABELS = {
  author: "লেখক",
  publisher: "প্রকাশনী",
  category: "ক্যাটাগরি",
};

export default function BrowseFilter() {
  const { type, value } = useParams();
  const { books } = useLibrary();

  const decodedValue = decodeURIComponent(value);
  const typeLabel = TYPE_LABELS[type] || "ফিল্টার";

  const filtered = useMemo(
    () => books.filter((b) => b[type] === decodedValue),
    [books, type, decodedValue]
  );

  const totalValue = filtered.reduce((sum, b) => sum + (b.price || 0), 0);

  if (!TYPE_LABELS[type]) {
    return (
      <div className="container">
        <div className="empty-state">অজানা ফিল্টার ধরন।</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: 14 }}>
        <Link to="/" className="btn-secondary" style={{ textDecoration: "none" }}>
          ← সব বইতে ফিরে যান
        </Link>
      </div>

      <h2 style={{ marginBottom: 4 }}>
        {typeLabel}: {decodedValue}
      </h2>

      <div className="stat-cards" style={{ marginBottom: 20 }}>
        <div className="stat-card">
          <div className="num">{filtered.length}</div>
          <div className="label">মোট বই</div>
        </div>
        <div className="stat-card">
          <div className="num">{totalValue}৳</div>
          <div className="label">মোট দাম</div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">এই {typeLabel} অনুযায়ী কোনো বই পাওয়া যায়নি।</div>
      ) : (
        <div className="book-grid">
          {filtered.map((b) => (
            <BookCard key={b.id} book={b} />
          ))}
        </div>
      )}
    </div>
  );
}
