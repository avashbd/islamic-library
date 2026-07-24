import { useState } from "react";
import { useLibrary } from "../context/LibraryContext";

export default function PasswordGate({ children }) {
  const {
    driveConnected,
    driveError,
    loading,
    connectDrive,
    passwordHash,
    unlocked,
    setNewPassword,
    tryUnlock,
  } = useLibrary();

  const [input, setInput] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className="gate-wrap">
        <div className="gate-card">লোড হচ্ছে…</div>
      </div>
    );
  }

  if (!driveConnected) {
    return (
      <div className="gate-wrap">
        <div className="gate-card">
          <h2>আমার লাইব্রেরি</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            আপনার বইয়ের ডেটা Google Drive এ সংরক্ষিত থাকে। শুরু করতে আপনার Google
            অ্যাকাউন্টের সাথে সংযুক্ত করুন।
          </p>
          {driveError && <div className="error-text">{driveError}</div>}
          <button className="btn-primary" style={{ width: "100%" }} onClick={connectDrive}>
            Google Drive এর সাথে সংযুক্ত করুন
          </button>
        </div>
      </div>
    );
  }

  if (unlocked) return children;

  // First-time setup: no password stored yet
  if (!passwordHash) {
    return (
      <div className="gate-wrap">
        <div className="gate-card">
          <h2>একটি পাসওয়ার্ড সেট করুন</h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>
            এই পাসওয়ার্ড দিয়েই পরবর্তীতে লাইব্রেরিতে ঢুকতে হবে।
          </p>
          <input
            type="password"
            placeholder="নতুন পাসওয়ার্ড"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <input
            type="password"
            placeholder="আবার লিখুন"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          {error && <div className="error-text">{error}</div>}
          <button
            className="btn-primary"
            style={{ width: "100%" }}
            onClick={() => {
              if (input.length < 4) return setError("অন্তত ৪ অক্ষরের পাসওয়ার্ড দিন");
              if (input !== confirm) return setError("পাসওয়ার্ড মিলছে না");
              setError("");
              setNewPassword(input);
            }}
          >
            সেট করুন ও প্রবেশ করুন
          </button>
        </div>
      </div>
    );
  }

  // Returning user: ask for password
  return (
    <div className="gate-wrap">
      <div className="gate-card">
        <h2>পাসওয়ার্ড দিন</h2>
        <input
          type="password"
          placeholder="পাসওয়ার্ড"
          value={input}
          autoFocus
          onKeyDown={async (e) => {
            if (e.key === "Enter") {
              const ok = await tryUnlock(input);
              if (!ok) setError("পাসওয়ার্ড সঠিক নয়");
            }
          }}
          onChange={(e) => setInput(e.target.value)}
        />
        {error && <div className="error-text">{error}</div>}
        <button
          className="btn-primary"
          style={{ width: "100%" }}
          onClick={async () => {
            const ok = await tryUnlock(input);
            if (!ok) setError("পাসওয়ার্ড সঠিক নয়");
          }}
        >
          প্রবেশ করুন
        </button>
      </div>
    </div>
  );
}
