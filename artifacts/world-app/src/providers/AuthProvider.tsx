import { createContext, useContext, useEffect, useState } from "react";

interface AuthState {
  userId: string | null;
  isReady: boolean;
}

const AuthContext = createContext<AuthState>({ userId: null, isReady: false });

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ userId: null, isReady: false });

  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");

    const bootstrap = async () => {
      try {
        const meRes = await fetch(`${base}/api/auth/me`, {
          credentials: "include",
        });
        if (meRes.ok) {
          const data = (await meRes.json()) as { userId: string | null };
          if (data.userId) {
            setState({ userId: data.userId, isReady: true });
            return;
          }
        }

        const loginRes = await fetch(`${base}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ username: "alex.world" }),
        });
        if (loginRes.ok) {
          const data = (await loginRes.json()) as { userId: string };
          setState({ userId: data.userId, isReady: true });
        } else {
          setState({ userId: null, isReady: true });
        }
      } catch {
        setState({ userId: null, isReady: true });
      }
    };

    bootstrap();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}
