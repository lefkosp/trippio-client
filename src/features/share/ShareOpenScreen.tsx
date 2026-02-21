import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { shareApi } from "@/shared/api/client";
import { useAuth } from "@/auth/useAuth";

export function ShareOpenScreen() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, isLoading, setShareSession, clearShareSession } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token || isLoading) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await shareApi.resolve(token);
        if (cancelled) return;
        if (result.role === "viewer") {
          setShareSession({
            tripId: result.tripId,
            role: result.role,
            token: result.shareAccessToken,
          });
          navigate("/today", { replace: true });
          return;
        }

        clearShareSession();
        if ("requiresAuth" in result && result.requiresAuth) {
          navigate(`/login?next=${encodeURIComponent(`/share/${token}`)}`, { replace: true });
          return;
        }
        if ("claimed" in result && result.claimed) {
          navigate("/today", { replace: true });
          return;
        }
        setErrorMessage("Could not claim editor access.");
      } catch (err) {
        if (cancelled) return;
        clearShareSession();
        // Specific error for 404
        if (err instanceof Error && (err.message.includes("404") || err.message.includes("not found"))) {
          setErrorMessage("Link expired or revoked.");
        } else {
          setErrorMessage(err instanceof Error ? err.message : "Invalid share link.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, isLoading, user, setShareSession, clearShareSession, navigate]);

  if (!token || errorMessage) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-3 max-w-xs">
          <span className="trippio-wordmark text-xl">Trippio</span>
          <p className="text-sm text-destructive">{errorMessage || "Missing share token."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="text-center space-y-3">
        <span className="trippio-wordmark text-xl">Trippio</span>
        <p className="text-sm text-muted-foreground">Opening shared trip...</p>
      </div>
    </div>
  );
}
