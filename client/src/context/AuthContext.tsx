"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api, clearToken, storeToken } from "@/lib/api";
import type { User } from "@/types";

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const response = await api.me();
    setUser(response.data);
  };

  useEffect(() => {
    api
      .me()
      .then((response) => setUser(response.data))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login: async (email, password) => {
        const response = await api.login({ email, password });
        storeToken(response.data.token);
        setUser(response.data.user);
        return response.data.user;
      },
      register: async (name, email, password) => {
        const response = await api.register({ name, email, password });
        storeToken(response.data.token);
        setUser(response.data.user);
        return response.data.user;
      },
      logout: () => {
        clearToken();
        setUser(null);
        router.replace("/login");
      },
      refreshUser,
    }),
    [isLoading, router, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
