import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/auth/useAuth";

export function LoginScreen() {
  const { requestLink } = useAuth();
  const [searchParams] = useSearchParams();
  const next = searchParams.get("next");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setStatus("sending");
    setErrorMessage("");
    setMagicLink(null);
    if (next) {
      sessionStorage.setItem("postLoginNext", next);
    }
    try {
      const result = await requestLink(trimmed);
      setStatus("sent");
      if (result.magicLink) {
        const devLink = next
          ? `${result.magicLink}${result.magicLink.includes("?") ? "&" : "?"}next=${encodeURIComponent(next)}`
          : result.magicLink;
        setMagicLink(devLink);
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <span className="trippio-wordmark text-2xl">Trippio</span>
          <p className="text-sm text-muted-foreground mt-2">
            Sign in with a magic link sent to your email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "sending"}
            autoComplete="email"
            className="h-11"
          />
          <Button
            type="submit"
            className="w-full h-11"
            disabled={status === "sending"}
          >
            {status === "sending" ? "Sending…" : "Send login link"}
          </Button>
        </form>

        {status === "sent" && (
          <div className="rounded-lg border border-border bg-elev-2/50 p-4 space-y-2">
            <p className="text-sm font-medium text-foreground">
              Check your email for the login link.
            </p>
            {magicLink && (
              <p className="text-xs text-muted-foreground">
                Dev:{" "}
                <a
                  href={magicLink}
                  className="text-primary underline break-all"
                  rel="noopener noreferrer"
                >
                  Click here to sign in
                </a>
              </p>
            )}
          </div>
        )}

        {status === "error" && errorMessage && (
          <p className="text-sm text-destructive">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
