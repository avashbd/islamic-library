export default function CategorySidebar({ categories, books, active, onSelect }) {
  const countFor = (cat) =>
    cat === "সব" ? books.length : books.filter((b) => b.category === cat).length;

  const all = ["সব", ...categories];

  return (
    <aside className="sidebar">
      <h4>ক্যাটাগরি</h4>
      {all.map((cat) => (
        <div
          key={cat}
          className={`sidebar-item ${active === cat ? "active" : ""}`}
          onClick={() => onSelect(cat)}
        >
          <span>{cat}</span>
          <span className="sidebar-count">{countFor(cat)}</span>
        </div>
      ))}
    </aside>
  );
}
