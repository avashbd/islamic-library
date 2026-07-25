import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useLibrary } from "../context/LibraryContext";

const COLORS = ["#d9312a", "#e88a3b", "#c76a3b", "#8a4b2b", "#f2b26b", "#a3311f", "#e0a35c"];

export default function Stats() {
  const { books, categories } = useLibrary();

  const totalBooks = books.length;
  const totalValue = books.reduce((sum, b) => sum + (b.price || 0), 0);
  const totalOriginalValue = books.reduce((sum, b) => sum + (b.originalPrice || b.price || 0), 0);
  const totalSaved = totalOriginalValue - totalValue;

  const byCategory = useMemo(() => {
    return categories
      .map((cat) => ({
        name: cat,
        count: books.filter((b) => b.category === cat).length,
        value: books.filter((b) => b.category === cat).reduce((s, b) => s + (b.price || 0), 0),
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [books, categories]);

  function groupBy(field) {
    const map = new Map();
    for (const b of books) {
      const key = b[field];
      if (!key) continue;
      const entry = map.get(key) || { name: key, count: 0, value: 0 };
      entry.count += 1;
      entry.value += b.price || 0;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.count - a.count);
  }

  const byAuthor = useMemo(() => groupBy("author"), [books]);
  const byPublisher = useMemo(() => groupBy("publisher"), [books]);

  return (
    <div className="container">
      <h2 style={{ marginBottom: 4 }}>পরিসংখ্যান</h2>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="num">{totalBooks}</div>
          <div className="label">মোট বই</div>
        </div>
        <div className="stat-card">
          <div className="num">{categories.length}</div>
          <div className="label">ক্যাটাগরি</div>
        </div>
        <div className="stat-card">
          <div className="num">{totalValue}৳</div>
          <div className="label">মোট দাম</div>
        </div>
        <div className="stat-card">
          <div className="num">{totalSaved}৳</div>
          <div className="label">মোট ছাড়ে বাঁচানো</div>
        </div>
      </div>

      {totalBooks === 0 ? (
        <div className="empty-state">এখনো কোনো বই যোগ করা হয়নি।</div>
      ) : (
        <>
          <div className="chart-card">
            <h3>ক্যাটাগরি অনুযায়ী বইয়ের সংখ্যা</h3>
            <ResponsiveContainer width="100%" height={Math.max(220, byCategory.length * 40)}>
              <BarChart data={byCategory} layout="vertical" margin={{ left: 30 }}>
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#d9312a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>ক্যাটাগরি অনুযায়ী মোট দাম (৳)</h3>
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={byCategory}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={110}
                  label={(entry) => entry.name}
                >
                  {byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card">
            <h3>লেখক অনুযায়ী বই</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {byAuthor.map((a) => (
                <Link
                  key={a.name}
                  to={`/browse/author/${encodeURIComponent(a.name)}`}
                  className="sidebar-item"
                  style={{ textDecoration: "none" }}
                >
                  <span>{a.name}</span>
                  <span className="sidebar-count">{a.count}টি ({a.value}৳)</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="chart-card">
            <h3>প্রকাশনী অনুযায়ী বই</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {byPublisher.map((p) => (
                <Link
                  key={p.name}
                  to={`/browse/publisher/${encodeURIComponent(p.name)}`}
                  className="sidebar-item"
                  style={{ textDecoration: "none" }}
                >
                  <span>{p.name}</span>
                  <span className="sidebar-count">{p.count}টি ({p.value}৳)</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
