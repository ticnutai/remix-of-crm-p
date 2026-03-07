/**
 * DedupContext — Global deduplication toggle
 *
 * Default: deduplication ON (showDuplicates = false)
 * When toggled to showDuplicates = true  → all items shown including duplicates
 *
 * Persisted to localStorage so setting survives page refresh.
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface DedupContextValue {
  /** When false (default), duplicate items are hidden/merged. When true, all items shown. */
  showDuplicates: boolean;
  toggleShowDuplicates: () => void;
  /** How many total duplicate groups are currently detected across all views (updated by views). */
  duplicateCount: number;
  setDuplicateCount: (count: number) => void;
}

const DedupContext = createContext<DedupContextValue>({
  showDuplicates: false,
  toggleShowDuplicates: () => {},
  duplicateCount: 0,
  setDuplicateCount: () => {},
});

const LS_KEY = "crm-show-duplicates";

export function DedupProvider({ children }: { children: React.ReactNode }) {
  const [showDuplicates, setShowDuplicates] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) === "true";
    } catch {
      return false;
    }
  });

  const [duplicateCount, setDuplicateCount] = useState(0);

  const toggleShowDuplicates = useCallback(() => {
    setShowDuplicates((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LS_KEY, String(next));
      } catch {
        // localStorage may be unavailable
      }
      return next;
    });
  }, []);

  return (
    <DedupContext.Provider
      value={{
        showDuplicates,
        toggleShowDuplicates,
        duplicateCount,
        setDuplicateCount,
      }}
    >
      {children}
    </DedupContext.Provider>
  );
}

export function useDedup() {
  return useContext(DedupContext);
}
