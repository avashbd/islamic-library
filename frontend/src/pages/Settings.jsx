import { useState } from "react";
import { useLibrary } from "../context/LibraryContext";

export default function Settings() {
  const { isAdmin, adminLogin, changePassword } = useLibrary();
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [message, setMessage] = useState("");

  if (!isAdmin) {
    return (
      <div className="container">
        <div className="empty-state">
          এই পেজ শুধু অ্যাডমিনের জন্য।
          <div style={{ marginTop: 12 }}>
            <button className="btn-primary" onClick={adminLogin}>অ্যাডমিন লগইন করুন</button>
          </div>
        </div>
      </div>
    );
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      await changePassword(oldPass, newPass);
      setMessage("পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে!");
      setOldPass("");
      setNewPass("");
    } catch (err) {
      setMessage(err.message || "পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।");
    }
  };

  return (
    <div className="container">
      <div className="form-card">
        <h2>সেটিংস</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="form-row">
            <label>বর্তমান পাসওয়ার্ড (ডিফল্ট: Avash)</label>
            <input type="password" value={oldPass} onChange={(e) => setOldPass(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>নতুন পাসওয়ার্ড</label>
            <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} required />
          </div>
          {message && <p style={{ color: message.includes("সফল") ? "green" : "red" }}>{message}</p>}
          <button type="submit" className="btn-primary">পাসওয়ার্ড আপডেট করুন</button>
        </form>
      </div>
    </div>
  );
}
