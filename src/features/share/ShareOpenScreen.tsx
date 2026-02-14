import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { shareApi } from "@/shared/api/client";
import { useAuth } from "@/auth/useAuth";

export function ShareOpenScreen() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setShareSession, clearShareSession } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await shareApi.resolve(token);
        if (cancelled) return;
        setShareSession({
          tripId: result.tripId,
          role: result.role,
          token: result.shareAccessToken,
        });
        navigate("/today", { replace: true });
      } catch (err) {
        if (cancelled) return;
        clearShareSession();
        setErrorMessage(err instanceof Error ? err.message : "Invalid share link.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, setShareSession, clearShareSession, navigate]);

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
