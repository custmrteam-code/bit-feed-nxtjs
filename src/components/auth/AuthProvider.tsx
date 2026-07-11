"use client";

// Central auth state, ported from the `onAuthStateChanged` logic spread across
// layout/auth.js and main/index.js. Exposes the Firebase user, their resolved
// role (read from `users/{email}`), and a loading flag. Login/logout actions
// live in the auth components/hooks that consume this context.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import type { UserRole } from "@/lib/firebase/types";

interface AuthContextValue {
  /** The Firebase Auth user, or null when signed out. */
  user: User | null;
  /** Resolved role from Firestore; null until known / when signed out. */
  role: UserRole | null;
  /** True until the initial auth state + role lookup settle. */
  loading: boolean;
  /** Force a re-read of the user's role (e.g. after a profile change). */
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchRole(email: string | null): Promise<UserRole | null> {
  if (!email) return null;
  try {
    const snap = await getDoc(doc(db, "users", email.toLowerCase().trim()));
    if (!snap.exists()) return null;
    const role = (snap.data().role as string | undefined)?.toLowerCase();
    return (role as UserRole) ?? null;
  } catch (e) {
    console.debug("Role lookup failed:", e);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setRole(await fetchRole(nextUser?.email ?? null));
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role,
      loading,
      // Reconcile from the live Firebase user — used right after a sign-up
      // creates the role doc, when the onAuthStateChanged snapshot is stale.
      refreshRole: async () => {
        const current = auth.currentUser;
        setUser(current);
        setRole(await fetchRole(current?.email ?? null));
      },
    }),
    [user, role, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
