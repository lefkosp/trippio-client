import { useState } from "react";
import { Share2, ChevronDown, Check, Link, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useTripContext } from "@/shared/context/useTripContext";
import { toast } from "sonner";

export function TopBar() {
  const { trip } = useTripContext();
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // For MVP, the share link is the current URL with a viewer token
  const shareUrl = `${window.location.origin}/share/${trip._id}?role=viewer`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.name,
          text: `Check out my trip plan: ${trip.name}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled — ignore
      }
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 glass border-b border-border">
        <div className="flex items-center justify-between px-4 h-14 max-w-md mx-auto">
          {/* Left: Wordmark + trip selector */}
          <div className="flex items-center gap-3">
            <span className="trippio-wordmark text-sm">Trippio</span>
            <div className="h-4 w-px bg-border" />
            <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors press-scale">
              <span>{trip.name}</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Right: Share */}
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Share Sheet */}
      <Sheet open={shareOpen} onOpenChange={setShareOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[50dvh] rounded-t-2xl bg-elev-1 border-t border-border"
        >
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-lg tracking-tight">
              Share Trip
            </SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pt-2 px-4 pb-6">
            <p className="text-sm text-muted-foreground">
              Share a view-only link to <strong>{trip.name}</strong> so others
              can follow along.
            </p>

            {/* Link display */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-elev-2 border border-border">
              <Link className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground truncate flex-1 font-mono">
                {shareUrl}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleCopy}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1.5" />
                    Copy Link
                  </>
                )}
              </Button>
              {typeof navigator.share === "function" && (
                <Button
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={handleNativeShare}
                >
                  <Share2 className="h-4 w-4 mr-1.5" />
                  Share
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
