import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import * as drive from "../lib/drive";

const LibraryContext = createContext(null);

async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function LibraryProvider({ children }) {
  const [driveConnected, setDriveConnected] = useState(false);
  const [driveError, setDriveError] = useState(null);
  const [loading, setLoading] = useState(true);

  const [passwordHash, setPasswordHash] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);

  const saveTimer = useRef(null);

  const loadFromDrive = useCallback(async () => {
    setLoading(true);
    try {
      const data = await drive.readData();
      setPasswordHash(data.passwordHash);
      setBooks(data.books || []);
      setCategories(data.categories || []);
      setDriveConnected(true);
      setDriveError(null);
    } catch (e) {
      setDriveError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Try a silent sign-in on first load so returning users skip the connect button
  useEffect(() => {
    drive
      .signIn({ interactive: false })
      .then(loadFromDrive)
      .catch(() => setLoading(false));
  }, [loadFromDrive]);

  const connectDrive = useCallback(async () => {
    setLoading(true);
    try {
      await drive.signIn({ interactive: true });
      await loadFromDrive();
    } catch (e) {
      setDriveError(e.message);
      setLoading(false);
    }
  }, [loadFromDrive]);

  const persist = useCallback(
    (next) => {
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
    [passwordHash, books, categories]
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
      if (oldHash !== passwordHash) throw new Error("পুরনো পাসওয়ার্ড সঠিক নয়");
      const newHash = await sha256Hex(newPass);
      setPasswordHash(newHash);
      persist({ passwordHash: newHash });
    },
    [passwordHash, persist]
  );

  const tryUnlock = useCallback(
    async (pass) => {
      const hash = await sha256Hex(pass);
      if (hash === passwordHash) {
        setUnlocked(true);
        return true;
      }
      return false;
    },
    [passwordHash]
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
    driveConnected,
    driveError,
    loading,
    connectDrive,
    passwordHash,
    unlocked,
    setNewPassword,
    changePassword,
    tryUnlock,
    books,
    categories,
    addBook,
    updateBook,
    deleteBook,
    addCategory,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}
