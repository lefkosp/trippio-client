import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useCreateProposal,
  useApproveProposal,
  usePromoteProposal,
} from "@/shared/hooks/mutations";
import { useTripContext } from "@/shared/context/useTripContext";
import { CATEGORY_CONFIG, CATEGORIES } from "@/shared/utils/proposal-helpers";
import type { ProposalCategory, TripEvent } from "@/shared/types";

interface ReplaceEventProposalSheetProps {
  event: TripEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReplaceEventProposalSheet({ event, open, onOpenChange }: ReplaceEventProposalSheetProps) {
  const { tripId } = useTripContext();
  const createProposal = useCreateProposal(tripId);
  const approveProposal = useApproveProposal(tripId);
  const promoteProposal = usePromoteProposal(tripId);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ProposalCategory>("activity");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [address, setAddress] = useState("");
  const [applyMode, setApplyMode] = useState<"immediate" | "vote">("immediate");

  // Reset to a blank idea every time the sheet opens — a replacement is a
  // fresh idea, not a copy of what's being replaced.
  useEffect(() => {
    if (!open) return;
    setTitle("");
    setCategory("activity");
    setDescription("");
    setLink("");
    setAddress("");
    setApplyMode("immediate");
  }, [open]);

  const isSaving = createProposal.isPending || approveProposal.isPending || promoteProposal.isPending;

  function handleSave() {
    if (!event) return;
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (applyMode === "immediate" && !address.trim()) {
      toast.error("Address is required to apply immediately");
      return;
    }

    createProposal.mutate(
      {
        title: title.trim(),
        category,
        description: description.trim() || undefined,
        links: link.trim() ? [link.trim()] : undefined,
        type: "replace",
        targetEventId: event._id,
      },
      {
        onSuccess: (proposal) => {
          if (applyMode === "vote") {
            toast.success("Sent to the group for a vote");
            onOpenChange(false);
            return;
          }
          approveProposal.mutate(proposal._id, {
            onSuccess: () => {
              promoteProposal.mutate(
                { proposalId: proposal._id, payload: { address: address.trim() } },
                {
                  onSuccess: () => {
                    toast.success(`Replaced with ${title.trim()}`);
                    onOpenChange(false);
                  },
                  onError: (e) => toast.error(e.message),
                }
              );
            },
            onError: (e) => toast.error(e.message),
          });
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  if (!event) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2 shrink-0">
          <SheetTitle className="text-lg tracking-tight">Replace</SheetTitle>
          <p className="text-sm text-muted-foreground leading-snug">
            Swapping out: {event.title}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pt-1 px-4 pb-6">
          <div>
            <label className="text-section-label mb-1.5 block">New idea</label>
            <Input
              placeholder="e.g. Din Tai Fung"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              maxLength={120}
            />
          </div>

          <div>
            <label className="text-section-label mb-1.5 block">Category</label>
            <div className="flex gap-1.5 flex-wrap">
              {CATEGORIES.map((cat) => {
                const cfg = CATEGORY_CONFIG[cat];
                const Icon = cfg.icon;
                const active = category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-all press-scale border",
                      active
                        ? `${cfg.bgClass} ${cfg.fgClass} border-current`
                        : "bg-elev-2 text-muted-foreground border-transparent"
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-section-label mb-1.5 block">
              Description <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Textarea
              placeholder="Why this instead?"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={800}
            />
          </div>

          <div>
            <label className="text-section-label mb-1.5 block">
              Link <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Input
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          <div>
            <label className="text-section-label mb-1.5 block">When should this apply?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setApplyMode("immediate")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-all press-scale",
                  applyMode === "immediate"
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "bg-elev-2 text-muted-foreground border-transparent"
                )}
              >
                Apply immediately
              </button>
              <button
                type="button"
                onClick={() => setApplyMode("vote")}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-xs font-medium border transition-all press-scale",
                  applyMode === "vote"
                    ? "bg-primary/10 text-primary border-primary/40"
                    : "bg-elev-2 text-muted-foreground border-transparent"
                )}
              >
                Send for group vote
              </button>
            </div>
          </div>

          {/* Applying now needs a real place, same as promoting any idea does;
              vote-first replacements collect the address later when someone
              promotes the approved proposal from the Proposals tab. */}
          {applyMode === "immediate" && (
            <div>
              <label className="text-section-label mb-1.5 block">Address</label>
              <Input
                placeholder="Street address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
            >
              {isSaving ? "Saving…" : applyMode === "immediate" ? "Replace now" : "Send for vote"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
