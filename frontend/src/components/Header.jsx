import { NavLink } from "react-router-dom";
import { useLibrary } from "../context/LibraryContext";

export default function Header() {
  const { isAdmin, adminLoading, adminLogin, adminLogout, darkMode, toggleDarkMode, freshRefreshToken } =
    useLibrary();

  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <div className="brand">
          <img src="/logo.png" alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
          আল্লাহর বান্দা আভাসের লাইব্রেরি
        </div>
        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            বইসমূহ
          </NavLink>
          {isAdmin && (
            <>
              <NavLink to="/add" className={({ isActive }) => (isActive ? "active" : "")}>
                বই যোগ করুন
              </NavLink>
              <NavLink to="/bulk-add" className={({ isActive }) => (isActive ? "active" : "")}>
                একসাথে অনেক বই যোগ করুন
              </NavLink>
            </>
          )}
          <NavLink to="/stats" className={({ isActive }) => (isActive ? "active" : "")}>
            পরিসংখ্যান
          </NavLink>
          {isAdmin && (
            <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
              সেটিংস
            </NavLink>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={toggleDarkMode}
            title={darkMode ? "লাইট মোড" : "নাইট মোড"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {isAdmin ? (
            <button type="button" className="btn-outline-danger" onClick={adminLogout}>
              অ্যাডমিন লগআউট
            </button>
          ) : (
            <button type="button" className="btn-primary" disabled={adminLoading} onClick={adminLogin}>
              {adminLoading ? "লগইন হচ্ছে…" : "অ্যাডমিন লগইন"}
            </button>
          )}
        </nav>
      </div>

      {freshRefreshToken && (
        <div className="container" style={{ padding: "10px 16px", background: "#fff3cd", color: "#5c4a12" }}>
          <b>একবারের জন্য সেটআপ দরকার:</b> নিচের refresh token টি কপি করে Vercel প্রজেক্টের
          Environment Variables এ <code>GOOGLE_REFRESH_TOKEN</code> নামে সেট করুন — তাহলে
          দর্শনার্থীরা লগইন ছাড়াই বই দেখতে পারবে।
          <div
            style={{
              wordBreak: "break-all",
              fontFamily: "monospace",
              background: "#fff",
              padding: 8,
              borderRadius: 6,
              marginTop: 6,
            }}
          >
            {freshRefreshToken}
          </div>
        </div>
      )}
    </header>
  );
}
