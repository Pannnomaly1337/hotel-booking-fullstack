"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { PublicUser } from "@repo/types";
import { api } from "@/lib/api";

interface AuthContextValue {
  user: PublicUser | null;
  authLoading: boolean;
  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<PublicUser | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const refresh = async () => {
    try {
      const { data } = await api.get("/users/auth/cookie/me");
      setUser(data.user);
    } catch {
      setUser(null);
    }
  };

  useEffect(() => {
    (async () => {
      setAuthLoading(true);
      await refresh();
      setAuthLoading(false);
    })();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      const { data } = await api.post("/users/auth/cookie/login", credentials);
      setUser(data.user);
      return data.user as PublicUser;
    } catch {
      setUser(null);
      return null;
    }
  };

  const logout = async () => {
    try {
      await api.post("/users/auth/cookie/logout", {});
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
