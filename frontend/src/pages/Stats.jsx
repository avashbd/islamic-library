import { useMemo } from "react";
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
        </>
      )}
    </div>
  );
}
