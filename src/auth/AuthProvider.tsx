import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  authApi,
  setApiAccessToken,
  setApiShareAccessToken,
  type AuthUser,
} from "@/shared/api/client";

export interface ShareSession {
  tripId: string;
  role: "viewer";
}

export interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  share: ShareSession | null;
  shareAccessToken: string | null;
  isReadOnly: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  requestLink: (email: string) => Promise<{ magicLink?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  setSession: (user: AuthUser, accessToken: string) => void;
  setShareSession: (session: { tripId: string; role: "viewer"; token: string }) => void;
  clearShareSession: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [share, setShare] = useState<ShareSession | null>(null);
  const [shareAccessToken, setShareAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const setSession = useCallback((u: AuthUser, token: string) => {
    setUser(u);
    setAccessTokenState(token);
    setApiAccessToken(token);
    setShare(null);
    setShareAccessTokenState(null);
    setApiShareAccessToken(null);
  }, []);

  const setShareSession = useCallback(
    ({ tripId, role, token }: { tripId: string; role: "viewer"; token: string }) => {
      setShare({ tripId, role });
      setShareAccessTokenState(token);
      setApiShareAccessToken(token);
    },
    []
  );

  const clearShareSession = useCallback(() => {
    setShare(null);
    setShareAccessTokenState(null);
    setApiShareAccessToken(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await authApi.refresh();
      if (res.accessToken) {
        setAccessTokenState(res.accessToken);
        setApiAccessToken(res.accessToken);
        if (res.user) {
          setUser(res.user);
        }
        return;
      }
    } catch {
      // no session or expired
    }
    setUser(null);
    setAccessTokenState(null);
    setApiAccessToken(null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const requestLink = useCallback(async (email: string) => {
    const data = await authApi.requestLink(email);
    return { magicLink: data.magicLink };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setAccessTokenState(null);
      setApiAccessToken(null);
      clearShareSession();
    }
  }, [clearShareSession]);

  const isReadOnly = !!shareAccessToken && !user;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      share,
      shareAccessToken,
      isReadOnly,
      isLoading,
      requestLink,
      logout,
      refresh,
      setSession,
      setShareSession,
      clearShareSession,
    }),
    [
      user,
      accessToken,
      share,
      shareAccessToken,
      isReadOnly,
      isLoading,
      requestLink,
      logout,
      refresh,
      setSession,
      setShareSession,
      clearShareSession,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
