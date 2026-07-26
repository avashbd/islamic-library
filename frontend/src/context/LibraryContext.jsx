import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import * as drive from "../lib/drive";
import { fetchPublicLibrary } from "../lib/publicApi";

const LibraryContext = createContext(null);

// SHA-256 of the default password "Avash" — used until the admin sets a
// custom one from Settings.
const DEFAULT_PASSWORD_HASH =
  "1bac95fe85c1759819ea45b2cee6fa04e0848e2e3f529ed9aa72982db0f2d379";

const THEME_KEY = "islamic_library_theme";

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeTitle(t) {
  return (t || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function LibraryProvider({ children }) {
  // isAdmin = signed in to Google with write access to the actual Drive file.
  // Ordinary visitors never touch Google at all; they just get read-only
  // data from the public /api/library endpoint.
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [driveError, setDriveError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Shown once right after the admin's first Google consent, so they can
  // copy it into Vercel's environment variables (GOOGLE_REFRESH_TOKEN).
  const [freshRefreshToken, setFreshRefreshToken] = useState(null);

  const [passwordHash, setPasswordHash] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);

  const [darkMode, setDarkMode] = useState(false);

  const saveTimer = useRef(null);

  // ---------- theme ----------
  useEffect(() => {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch {
      // ignore
    }
    const isDark = saved === "dark";
    setDarkMode(isDark);
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
      try {
        localStorage.setItem(THEME_KEY, next ? "dark" : "light");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // ---------- loading data ----------
  const loadPublic = useCallback(async () => {
    try {
      const data = await fetchPublicLibrary();
      setPasswordHash(data.passwordHash);
      setBooks(data.books || []);
      setCategories(data.categories || []);
      setDriveError(null);
    } catch (e) {
      setDriveError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFromDrive = useCallback(async () => {
    const data = await drive.readData();
    setPasswordHash(data.passwordHash);
    setBooks(data.books || []);
    setCategories(data.categories || []);
  }, []);

  // On first load: try a silent admin re-login using a refresh_token stored
  // on this device (no popup). If that fails, just load the public
  // read-only data instead — this is the path ordinary visitors take.
  useEffect(() => {
    (async () => {
      setLoading(true);
      const stored = drive.getStoredRefreshToken();
      if (stored) {
        try {
          await drive.signIn({ interactive: false });
          await loadFromDrive();
          setIsAdmin(true);
          setLoading(false);
          return;
        } catch {
          // stored token expired/revoked — fall through to public view
        }
      }
      await loadPublic();
    })();
  }, [loadFromDrive, loadPublic]);

  // Explicit admin login (Google popup). Called from an "অ্যাডমিন লগইন" button.
  const adminLogin = useCallback(async () => {
    setAdminLoading(true);
    setDriveError(null);
    try {
      const result = await drive.signIn({ interactive: true });
      await loadFromDrive();
      setIsAdmin(true);
      if (result.refreshTokenIssued) {
        setFreshRefreshToken(drive.getStoredRefreshToken());
      }
    } catch (e) {
      setDriveError(e.message);
    } finally {
      setAdminLoading(false);
    }
  }, [loadFromDrive]);

  const adminLogout = useCallback(() => {
    drive.signOut();
    setIsAdmin(false);
    loadPublic();
  }, [loadPublic]);

  const persist = useCallback(
    (next) => {
      if (!isAdmin) return; // visitors never write
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        drive
          .writeData({
            passwordHash: next.passwordHash ?? passwordHash,
            books: next.books ?? books,
            categories: next.categories ?? categories,
          })
          .catch((e) => setDriveError(e.message));
      }, 600);
    },
    [isAdmin, passwordHash, books, categories]
  );

  const setNewPassword = useCallback(
    async (newPass) => {
      const hash = await sha256Hex(newPass);
      setPasswordHash(hash);
      setUnlocked(true);
      persist({ passwordHash: hash });
    },
    [persist]
  );

  const changePassword = useCallback(
    async (oldPass, newPass) => {
      const oldHash = await sha256Hex(oldPass);
      const effectiveHash = passwordHash || DEFAULT_PASSWORD_HASH;
      if (oldHash !== effectiveHash) throw new Error("পুরনো পাসওয়ার্ড সঠিক নয়");
      const newHash = await sha256Hex(newPass);
      setPasswordHash(newHash);
      persist({ passwordHash: newHash });
    },
    [passwordHash, persist]
  );

  const tryUnlock = useCallback(
    async (pass) => {
      const hash = await sha256Hex(pass);
      const effectiveHash = passwordHash || DEFAULT_PASSWORD_HASH;
      if (hash === effectiveHash) {
        setUnlocked(true);
        return true;
      }
      return false;
    },
    [passwordHash]
  );

  // ---------- duplicate detection ----------
  // Matches on the exact source link (if both have one) or a normalized
  // title match. Returns the existing matching book, or null.
  const findDuplicate = useCallback(
    (candidate) => {
      const normTitle = normalizeTitle(candidate.title);
      return (
        books.find(
          (b) =>
            (candidate.sourceUrl && b.sourceUrl && b.sourceUrl === candidate.sourceUrl) ||
            (normTitle && normalizeTitle(b.title) === normTitle)
        ) || null
      );
    },
    [books]
  );

  const addBook = useCallback(
    (book) => {
      setBooks((prev) => {
        const next = [{ ...book, id: crypto.randomUUID(), addedAt: Date.now() }, ...prev];
        persist({ books: next });
        return next;
      });
    },
    [persist]
  );

  const updateBook = useCallback(
    (id, patch) => {
      setBooks((prev) => {
        const next = prev.map((b) => (b.id === id ? { ...b, ...patch } : b));
        persist({ books: next });
        return next;
      });
    },
    [persist]
  );

  const deleteBook = useCallback(
    (id) => {
      setBooks((prev) => {
        const next = prev.filter((b) => b.id !== id);
        persist({ books: next });
        return next;
      });
    },
    [persist]
  );

  const addCategory = useCallback(
    (name) => {
      setCategories((prev) => {
        if (prev.includes(name)) return prev;
        const next = [...prev, name];
        persist({ categories: next });
        return next;
      });
    },
    [persist]
  );

  const value = {
    // auth
    isAdmin,
    adminLoading,
    adminLogin,
    adminLogout,
    driveError,
    freshRefreshToken,
    loading,
    // password gate (applies to everyone, admin included)
    passwordHash,
    unlocked,
    setNewPassword,
    changePassword,
    tryUnlock,
    // theme
    darkMode,
    toggleDarkMode,
    // data
    books,
    categories,
    addBook,
    updateBook,
    deleteBook,
    addCategory,
    findDuplicate,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}
