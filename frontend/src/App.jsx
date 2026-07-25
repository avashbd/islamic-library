import { HashRouter, Routes, Route } from "react-router-dom";
import { LibraryProvider } from "./context/LibraryContext";
import PasswordGate from "./components/PasswordGate";
import Header from "./components/Header";
import Home from "./pages/Home";
import AddBook from "./pages/AddBook";
import BulkAdd from "./pages/BulkAdd";
import BookDetail from "./pages/BookDetail";
import BrowseFilter from "./pages/BrowseFilter";
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
            <Route path="/bulk-add" element={<BulkAdd />} />
            <Route path="/book/:id" element={<BookDetail />} />
            <Route path="/browse/:type/:value" element={<BrowseFilter />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </HashRouter>
      </PasswordGate>
    </LibraryProvider>
  );
}
