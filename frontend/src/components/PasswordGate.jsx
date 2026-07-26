import { useState } from "react";
import { useLibrary } from "../context/LibraryContext";

// Simple shared "view password" gate — this is for ALL visitors (dorshonarthi
// as well as the admin). It is NOT Google login; that's a separate, later
// step (see the "অ্যাডমিন লগইন" button in the Header) that unlocks add/
// edit/delete controls. Default password is "Avash", changeable from
// Settings by the admin.
export default function PasswordGate({ children }) {
  const { loading, unlocked, tryUnlock } = useLibrary();

  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);

  if (loading) {
    return (
      <div className="gate-wrap">
        <div className="gate-card">লোড হচ্ছে…</div>
      </div>
    );
  }

  if (unlocked) return children;

  async function handleSubmit() {
    setChecking(true);
    const ok = await tryUnlock(input);
    setChecking(false);
    if (!ok) setError("পাসওয়ার্ড সঠিক নয়");
  }

  return (
    <div className="gate-wrap">
      <div className="gate-card">
        <img src={`${import.meta.env.BASE_URL}logo.png`} alt="আভাস লাইব্রেরি" style={{ width: 96, margin: "0 auto 12px", display: "block" }} />
        <h2>পাসওয়ার্ড দিন</h2>
        <input
          type="password"
          placeholder="পাসওয়ার্ড"
          value={input}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          onChange={(e) => setInput(e.target.value)}
        />
        {error && <div className="error-text">{error}</div>}
        <button className="btn-primary" style={{ width: "100%" }} disabled={checking} onClick={handleSubmit}>
          {checking ? "যাচাই করা হচ্ছে…" : "প্রবেশ করুন"}
        </button>
      </div>
    </div>
  );
}
