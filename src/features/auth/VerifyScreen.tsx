import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/useAuth";
import { authApi } from "@/shared/api/client";

export function VerifyScreen() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const token = searchParams.get("token");
  const nextFromQuery = searchParams.get("next");

  // A missing token is knowable at render — no need to mount, then set an error
  // state a frame later.
  const [status, setStatus] = useState<"verifying" | "ok" | "error">(
    token ? "verifying" : "error"
  );
  const [errorMessage, setErrorMessage] = useState(token ? "" : "Missing token");

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await authApi.verify(token);
        setSession(res.user, res.accessToken);
        setStatus("ok");
        const storedNext = sessionStorage.getItem("postLoginNext");
        if (storedNext) {
          sessionStorage.removeItem("postLoginNext");
        }
        const next = nextFromQuery || storedNext || "/today";
        navigate(next, { replace: true });
      } catch (err) {
        setStatus("error");
        setErrorMessage(err instanceof Error ? err.message : "Invalid or expired link");
      }
    })();
  }, [token, nextFromQuery, setSession, navigate]);

  if (status === "verifying") {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
        <div className="text-center space-y-3">
          <span className="trippio-wordmark text-xl">Trippio</span>
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
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
            Back to login
          </button>
        </div>
      </div>
    );
  }

  return null;
}
