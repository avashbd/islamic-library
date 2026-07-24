import { HashRouter, Routes, Route } from "react-router-dom";
import { LibraryProvider } from "./context/LibraryContext";
import PasswordGate from "./components/PasswordGate";
import Header from "./components/Header";
import Home from "./pages/Home";
import AddBook from "./pages/AddBook";
import BookDetail from "./pages/BookDetail";
import Stats from "./pages/Stats";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <LibraryProvider>
      <PasswordGate>
        <HashRouter>
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<AddBook />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </HashRouter>
      </PasswordGate>
    </LibraryProvider>
  );
}
