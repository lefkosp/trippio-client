import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  setApiAccessToken,
  setApiShareAccessToken,
  NetworkError,
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
  isOffline: boolean;
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

/** Persisted so a reload while offline can still show who was signed in. Holds no
 * token — only identity, so cached read-only content can render before the
 * network is reachable again. */
const CACHED_USER_KEY = "trippio.cachedUser.v1";

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.id === "string" && typeof parsed.email === "string") {
      return { id: parsed.id, email: parsed.email };
    }
    return null;
  } catch {
    return null;
  }
}

function writeCachedUser(user: AuthUser | null) {
  try {
    if (user) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  } catch {
    // localStorage unavailable (private mode, quota) — offline identity cache is best-effort
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(() => readCachedUser());
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [share, setShare] = useState<ShareSession | null>(null);
  const [shareAccessToken, setShareAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  // Query keys like ["trips", ...] carry no per-user identifier, and queries
  // never expire (gcTime: Infinity, for offline support) — so without this,
  // signing in as a different person in the same tab (or restoring the
  // IndexedDB-persisted cache on a shared device) renders the previous
  // person's cached trips until something happens to refetch them. Wipe the
  // cache whenever the authenticated identity actually changes; skip it for
  // same-user token refreshes so the offline cache they're there for survives.
  const clearCacheIfIdentityChanged = useCallback(
    (newUser: AuthUser | null) => {
      const previous = readCachedUser();
      if (previous?.id !== (newUser?.id ?? null)) {
        queryClient.clear();
      }
    },
    [queryClient]
  );

  const setSession = useCallback((u: AuthUser, token: string) => {
    clearCacheIfIdentityChanged(u);
    setUser(u);
    writeCachedUser(u);
    setIsOffline(false);
    setAccessTokenState(token);
    setApiAccessToken(token);
    setShare(null);
    setShareAccessTokenState(null);
    setApiShareAccessToken(null);
  }, [clearCacheIfIdentityChanged]);

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
        setIsOffline(false);
        setAccessTokenState(res.accessToken);
        setApiAccessToken(res.accessToken);
        if (res.user) {
          clearCacheIfIdentityChanged(res.user);
          setUser(res.user);
          writeCachedUser(res.user);
        }
        return;
      }
    } catch (err) {
      if (err instanceof NetworkError) {
        // Can't reach the server — keep whatever identity we have cached (if any)
        // and let the app render read-only from cache instead of bouncing to /login.
        setIsOffline(true);
        setAccessTokenState(null);
        setApiAccessToken(null);
        return;
      }
      // Any other failure (401, etc.) means the session is genuinely gone.
    }
    setIsOffline(false);
    setUser(null);
    writeCachedUser(null);
    setAccessTokenState(null);
    setApiAccessToken(null);
  }, [clearCacheIfIdentityChanged]);

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
      clearCacheIfIdentityChanged(null);
      setUser(null);
      writeCachedUser(null);
      setIsOffline(false);
      setAccessTokenState(null);
      setApiAccessToken(null);
      clearShareSession();
    }
  }, [clearShareSession, clearCacheIfIdentityChanged]);

  // Offline counts as read-only for the same reason a share link does: no access
  // token, so mutations would fail — reuse the read-only path instead of adding
  // offline checks to every screen.
  const isReadOnly = (!!shareAccessToken && !user) || isOffline;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      share,
      shareAccessToken,
      isReadOnly,
      isLoading,
      isOffline,
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
      isOffline,
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
