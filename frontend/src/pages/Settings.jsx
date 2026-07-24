import { useState } from "react";
import { useLibrary } from "../context/LibraryContext";

export default function Settings() {
  const { changePassword, driveConnected } = useLibrary();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [msg, setMsg] = useState("");

  async function handleChange(e) {
    e.preventDefault();
    setMsg("");
    if (newPass.length < 4) return setMsg("নতুন পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে");
    if (newPass !== confirmPass) return setMsg("নতুন পাসওয়ার্ড দুইবার একই লিখুন");
    try {
      await changePassword(oldPass, newPass);
      setMsg("পাসওয়ার্ড পরিবর্তন হয়েছে ✅");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err) {
      setMsg(err.message);
    }
  }

  return (
    <div className="container">
      <div className="form-card">
        <h2>সেটিংস</h2>

        <div className="form-row">
          <label>Google Drive স্ট্যাটাস</label>
          <div>{driveConnected ? "✅ সংযুক্ত আছে" : "❌ সংযুক্ত নয়"}</div>
        </div>

        <form onSubmit={handleChange}>
          <h3 style={{ marginBottom: 10 }}>পাসওয়ার্ড পরিবর্তন করুন</h3>
          <div className="form-row">
            <label>পুরনো পাসওয়ার্ড</label>
            <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} />
          </div>
          <div className="form-row">
            <label>নতুন পাসওয়ার্ড</label>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          </div>
          <div className="form-row">
            <label>নতুন পাসওয়ার্ড আবার লিখুন</label>
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
            />
          </div>
          {msg && <div className="banglish-preview">{msg}</div>}
          <button className="btn-primary" type="submit">
            পরিবর্তন করুন
          </button>
        </form>
      </div>
    </div>
  );
}
