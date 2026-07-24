import { Link } from "react-router-dom";

export default function BookCard({ book }) {
  return (
    <Link to={`/book/${book.id}`} className="book-card">
      <img
        src={book.cover || "https://placehold.co/300x440/f0ece7/746a63?text=No+Cover"}
        alt={book.title}
        loading="lazy"
      />
      <div className="book-card-body">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {book.category && <span className="badge">{book.category}</span>}
          {book.shelfNumber && <span className="badge">শেলফ: {book.shelfNumber}</span>}
        </div>
        <div className="book-card-title">{book.title}</div>
        {book.author && <div className="book-card-author">{book.author}</div>}
        {book.price != null && (
          <div className="book-card-price">
            {book.price}৳
            {book.originalPrice && book.originalPrice !== book.price && (
              <span className="original">{book.originalPrice}৳</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
