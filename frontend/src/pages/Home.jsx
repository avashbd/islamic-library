import { useMemo, useState } from "react";
import { useLibrary } from "../context/LibraryContext";
import { banglishToBangla, looksLikeBanglish } from "../lib/banglish";
import CategorySidebar from "../components/CategorySidebar";
import BookCard from "../components/BookCard";

export default function Home() {
  const { books, categories } = useLibrary();
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState("সব");

  const banglaQuery = useMemo(() => {
    if (!query) return "";
    return looksLikeBanglish(query) ? banglishToBangla(query) : query;
  }, [query]);

  const filtered = useMemo(() => {
    let list = books;
    if (activeCat !== "সব") list = list.filter((b) => b.category === activeCat);
    if (banglaQuery.trim()) {
      const q = banglaQuery.trim();
      list = list.filter(
        (b) =>
          b.title?.includes(q) ||
          b.author?.includes(q) ||
          b.publisher?.includes(q)
      );
    }
    return list;
  }, [books, activeCat, banglaQuery]);

  return (
    <div className="container">
      <div className="search-bar">
        <span>🔍</span>
        <input
          placeholder="বইয়ের নাম লিখুন (বাংলা বা Banglish, যেমন: ma ma ma ebong baba)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {query && looksLikeBanglish(query) && (
        <div className="banglish-preview">রূপান্তরিত: {banglaQuery}</div>
      )}

      <div className="layout">
        <CategorySidebar
          categories={categories}
          books={books}
          active={activeCat}
          onSelect={setActiveCat}
        />
        <div style={{ flex: 1 }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              এখানে কোনো বই নেই। "বই যোগ করুন" থেকে আপনার প্রথম বইটি যোগ করুন।
            </div>
          ) : (
            <div className="book-grid">
              {filtered.map((b) => (
                <BookCard key={b.id} book={b} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
