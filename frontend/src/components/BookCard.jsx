import { Link, useNavigate } from "react-router-dom";

export default function BookCard({ book }) {
  const navigate = useNavigate();

  function stop(e) {
    e.stopPropagation();
  }

  return (
    <div
      className="book-card"
      role="link"
      tabIndex={0}
      onClick={() => navigate(`/book/${book.id}`)}
      style={{ cursor: "pointer" }}
    >
      <img
        src={book.cover || "https://placehold.co/300x440/f0ece7/746a63?text=No+Cover"}
        alt={book.title}
        loading="lazy"
      />
      <div className="book-card-body">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {book.category && (
            <Link
              to={`/browse/category/${encodeURIComponent(book.category)}`}
              className="badge"
              onClick={stop}
            >
              {book.category}
            </Link>
          )}
          {book.shelfNumber && <span className="badge">শেলফ: {book.shelfNumber}</span>}
          {book.volumeCount && <span className="badge">{book.volumeCount} খণ্ড/পিস</span>}
        </div>
        <div className="book-card-title">{book.title}</div>
        {book.author && (
          <div className="book-card-author">
            <Link to={`/browse/author/${encodeURIComponent(book.author)}`} onClick={stop}>
              {book.author}
            </Link>
          </div>
        )}
        {book.price != null && (
          <div className="book-card-price">
            {book.price}৳
            {book.originalPrice && book.originalPrice !== book.price && (
              <span className="original">{book.originalPrice}৳</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
