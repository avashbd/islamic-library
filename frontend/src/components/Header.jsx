import { NavLink } from "react-router-dom";

export default function Header() {
  return (
    <header className="app-header">
      <div className="container app-header-inner">
        <div className="brand">
          <span className="brand-dot" />
          আমার লাইব্রেরি
        </div>
        <nav className="header-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            বইসমূহ
          </NavLink>
          <NavLink to="/add" className={({ isActive }) => (isActive ? "active" : "")}>
            বই যোগ করুন
          </NavLink>
          <NavLink to="/stats" className={({ isActive }) => (isActive ? "active" : "")}>
            পরিসংখ্যান
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
            সেটিংস
          </NavLink>
        </nav>
      </div>
    </header>
  );
}
