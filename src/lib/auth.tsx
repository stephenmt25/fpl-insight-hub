import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { fetchEntry, useEntry } from "@/lib/fpl/hooks";
import type { Entry } from "@/lib/fpl/types";

/** A public demo team so visitors can explore without an FPL account. */
export const GUEST_ID = "7788626";
const STORAGE_KEY = "fpl-insight-hub.manager-id";

interface AuthValue {
  /** FPL manager id. Only public data is read; there is no password or session. */
  managerId: string | null;
  manager: Entry | null;
  isGuest: boolean;
  isLoading: boolean;
  /** Resolves true when the id exists on FPL. */
  signIn: (id: string) => Promise<boolean>;
  signOut: () => void;
  dialogOpen: boolean;
  setDialogOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthValue | null>(null);

function readStored() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [managerId, setManagerId] = useState<string | null>(readStored);
  const [dialogOpen, setDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: manager, isLoading } = useEntry(managerId);

  const signIn = useCallback(
    async (rawId: string) => {
      const id = rawId.trim();
      if (!/^\d{1,10}$/.test(id)) {
        toast.error("An FPL ID is a number, e.g. 1234567");
        return false;
      }
      try {
        const entry = await queryClient.fetchQuery({ queryKey: ["entry", id], queryFn: () => fetchEntry(id) });
        setManagerId(id);
        try { localStorage.setItem(STORAGE_KEY, id); } catch { /* private mode */ }
        toast.success(`Welcome, ${entry.player_first_name}`, { description: entry.name });
        return true;
      } catch {
        toast.error("No FPL team found with that ID");
        return false;
      }
    },
    [queryClient],
  );

  const signOut = useCallback(() => {
    setManagerId(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* private mode */ }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      managerId, manager: manager ?? null, isGuest: managerId === GUEST_ID, isLoading: !!managerId && isLoading,
      signIn, signOut, dialogOpen, setDialogOpen,
    }),
    [managerId, manager, isLoading, signIn, signOut, dialogOpen],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
