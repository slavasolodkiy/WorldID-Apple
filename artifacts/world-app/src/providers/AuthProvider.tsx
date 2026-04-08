import { createContext, useCallback, useContext, useEffect, useState } from "react";

interface AuthState {
  userId: string | null;
  isReady: boolean;
  login: (userId: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  userId: null,
  isReady: false,
  login: () => {},
  logout: async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(`${base}/api/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? (r.json() as Promise<{ userId: string | null }>) : null))
      .then((data) => {
        setUserId(data?.userId ?? null);
      })
      .catch(() => {
        setUserId(null);
      })
      .finally(() => {
        setIsReady(true);
      });
  }, []);

  const login = useCallback((id: string) => {
    setUserId(id);
  }, []);

  const logout = useCallback(async () => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    try {
      await fetch(`${base}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUserId(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ userId, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
