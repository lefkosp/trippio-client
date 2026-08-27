import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { authApi } from "@/shared/api/client";

/**
 * One-shot entry point for the portfolio's "try it" link. Signs the visitor in as the
 * seeded demo account and hands off to the normal app — /demo is not a prefix, nothing
 * below it is namespaced, and `replace` keeps it out of history so Back doesn't
 * re-trigger the sign-in. Same shape as ShareOpenScreen.
 */
export function DemoOpenScreen() {
  const navigate = useNavigate();
  const { setSession, clearShareSession } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // A share session and a user session are mutually exclusive; arriving here from
        // a shared link would otherwise leave the read-only one in place.
        clearShareSession();
        const res = await authApi.demoLogin();
        if (cancelled) return;
        setSession(res.user, res.accessToken);
        navigate("/today", { replace: true });
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "";
        setErrorMessage(
          message.includes("404") || message.toLowerCase().includes("not found")
            ? "The demo isn't available right now."
            : "Could not start the demo."
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setSession, clearShareSession, navigate]);

  if (errorMessage) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-xs">
          <span className="trippio-wordmark text-xl">Trippio</span>
          <p className="text-sm text-destructive">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate("/login", { replace: true })}
            className="text-sm text-primary underline"
          >
            Sign in instead
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-3">
        <span className="trippio-wordmark text-xl">Trippio</span>
        <p className="text-sm text-muted-foreground">Loading the demo trip…</p>
      </div>
    </div>
  );
}
