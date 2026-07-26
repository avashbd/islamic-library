import { useParams, useNavigate } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { books, isAdmin, deleteBook } = useLibrary();

  const book = books.find(b => b.id === id);

  if (!book) return <div className="container">বইটি পাওয়া যায়নি!</div>;

  const handleDelete = () => {
    if (window.confirm("আপনি কি নিশ্চিত যে এই বইটি মুছে ফেলতে চান?")) {
      deleteBook(id);
      navigate("/");
    }
  };

  return (
    <div className="container">
      <div className="form-card" style={{ display: "flex", gap: "20px" }}>
        {book.cover && <img src={book.cover} alt={book.title} style={{ width: "150px", objectFit: "cover" }} />}
        <div>
          <h2>{book.title}</h2>
          <p><strong>লেখক:</strong> {book.author}</p>
          <p><strong>প্রকাশনী:</strong> {book.publisher}</p>
          <p><strong>ক্যাটাগরি:</strong> {book.category}</p>
          {book.price && <p><strong>দাম:</strong> ৳{book.price}</p>}
          
          {/* Admin Controls */}
          {isAdmin && (
            <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
              <button className="btn-secondary" onClick={() => alert("এডিট ফিচারটি পরে যোগ করা হবে!")}>সম্পাদনা করুন</button>
              <button className="btn-outline-danger" onClick={handleDelete}>মুছে ফেলুন</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
