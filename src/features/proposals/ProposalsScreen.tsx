import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Lightbulb,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Check,
  X,
  CalendarPlus,
  ExternalLink,
  Utensils,
  Zap,
  BedDouble,
  Bus,
  MoreHorizontal,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useTripContext } from "@/shared/context/useTripContext";
import { useAuth } from "@/auth/useAuth";
import { useProposals, useDays } from "@/shared/hooks/queries";
import {
  useCreateProposal,
  useVoteProposal,
  useApproveProposal,
  useRejectProposal,
  useConvertProposal,
} from "@/shared/hooks/mutations";
import type { Proposal, ProposalCategory, ProposalStatus, Day } from "@/shared/types";
import type { CreateProposalPayload, ConvertProposalPayload } from "@/shared/api/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_CONFIG: Record<
  ProposalCategory,
  { label: string; icon: React.ElementType; bgClass: string; fgClass: string }
> = {
  food: {
    label: "Food",
    icon: Utensils,
    bgClass: "bg-booking-activity",
    fgClass: "text-booking-activity-foreground",
  },
  activity: {
    label: "Activity",
    icon: Zap,
    bgClass: "bg-booking-train",
    fgClass: "text-booking-train-foreground",
  },
  stay: {
    label: "Stay",
    icon: BedDouble,
    bgClass: "bg-booking-hotel",
    fgClass: "text-booking-hotel-foreground",
  },
  transport: {
    label: "Transport",
    icon: Bus,
    bgClass: "bg-booking-flight",
    fgClass: "text-booking-flight-foreground",
  },
  other: {
    label: "Other",
    icon: MoreHorizontal,
    bgClass: "bg-booking-other",
    fgClass: "text-booking-other-foreground",
  },
};

const CATEGORIES: ProposalCategory[] = ["food", "activity", "stay", "transport", "other"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getEmail(user: string | { _id: string; email: string } | undefined): string {
  if (!user) return "Unknown";
  if (typeof user === "string") return user;
  return user.email;
}

function getUserId(user: string | { _id: string; email: string } | undefined): string {
  if (!user) return "";
  if (typeof user === "string") return user;
  return user._id;
}

/** First letter before @ from email, or fallback. */
function initialFromEmail(user: string | { _id: string; email: string } | undefined): string {
  const email = getEmail(user);
  const at = email.indexOf("@");
  if (at > 0) return email[0].toUpperCase();
  return email ? email[0].toUpperCase() : "?";
}

// ─── ProposalCard ─────────────────────────────────────────────────────────────

function ProposalCard({
  proposal,
  currentUserId,
  isReadOnly,
  tripId,
  onConvert,
}: {
  proposal: Proposal;
  currentUserId: string;
  isReadOnly: boolean;
  tripId: string;
  onConvert: (proposal: Proposal) => void;
}) {
  const catConfig = CATEGORY_CONFIG[proposal.category] ?? CATEGORY_CONFIG.other;
  const CatIcon = catConfig.icon;

  const yesVotes = proposal.votes.filter((v) => v.value === "yes").length;
  const noVotes = proposal.votes.filter((v) => v.value === "no").length;

  const myVote = proposal.votes.find(
    (v) => getUserId(v.userId) === currentUserId
  )?.value;

  const proposedByEmail = getEmail(proposal.proposedBy);
  const isOwn = getUserId(proposal.proposedBy) === currentUserId;

  const voteMutation = useVoteProposal(tripId);
  const approveMutation = useApproveProposal(tripId);
  const rejectMutation = useRejectProposal(tripId);

  const isActioning =
    voteMutation.isPending || approveMutation.isPending || rejectMutation.isPending;

  function handleVote(value: "yes" | "no") {
    voteMutation.mutate(
      { proposalId: proposal._id, value },
      {
        onError: (e) => toast.error(e.message),
      }
    );
  }

  function handleApprove() {
    approveMutation.mutate(proposal._id, {
      onError: (e) => toast.error(e.message),
    });
  }

  function handleReject() {
    rejectMutation.mutate(proposal._id, {
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
              catConfig.bgClass
            )}
          >
            <CatIcon className={cn("h-4 w-4", catConfig.fgClass)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm leading-tight">{proposal.title}</h3>
              {proposal.status !== "open" && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    proposal.status === "approved"
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-red-500/15 text-red-400"
                  )}
                >
                  {proposal.status === "approved" ? (
                    <Check className="h-2.5 w-2.5" />
                  ) : (
                    <X className="h-2.5 w-2.5" />
                  )}
                  {proposal.status}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {isOwn ? "You" : proposedByEmail}
            </p>
          </div>
          <span
            className={cn(
              "badge-subtle shrink-0",
              catConfig.bgClass,
              catConfig.fgClass
            )}
          >
            {catConfig.label}
          </span>
        </div>

        {/* Description */}
        {proposal.description && (
          <p className="text-xs text-muted-foreground leading-relaxed">
            {proposal.description}
          </p>
        )}

        {/* Links */}
        {proposal.links && proposal.links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {proposal.links.map((link, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="h-6 text-[11px] border-primary/20 text-primary hover:bg-primary/10 px-2"
                asChild
              >
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-2.5 w-2.5 mr-1" />
                  {(() => {
                    try {
                      return new URL(link).hostname;
                    } catch {
                      return "Link";
                    }
                  })()}
                </a>
              </Button>
            ))}
          </div>
        )}

        <Separator className="bg-border" />

        {/* Vote summary + actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Vote counts + initials */}
          <div className="flex items-center gap-3 flex-1 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
              <ThumbsUp className="h-3.5 w-3.5" />
              {yesVotes}
            </span>
            <span className="flex items-center gap-1 text-xs text-red-400 font-medium">
              <ThumbsDown className="h-3.5 w-3.5" />
              {noVotes}
            </span>
            {proposal.votes.length > 0 && (
              <div className="flex items-center gap-1">
                {proposal.votes.slice(0, 3).map((v, i) => (
                  <span
                    key={i}
                    className="h-5 w-5 rounded-full bg-elev-2 text-muted-foreground text-[10px] font-medium flex items-center justify-center border border-border shrink-0"
                    aria-hidden
                  >
                    {initialFromEmail(v.userId)}
                  </span>
                ))}
                {proposal.votes.length > 3 && (
                  <span className="text-[10px] text-muted-foreground font-medium pl-0.5">
                    +{proposal.votes.length - 3}
                  </span>
                )}
              </div>
            )}
            {myVote && (
              <span className="text-[10px] text-muted-foreground">
                You voted{" "}
                <span
                  className={
                    myVote === "yes" ? "text-emerald-400 font-medium" : "text-red-400 font-medium"
                  }
                >
                  {myVote}
                </span>
              </span>
            )}
          </div>

          {/* Actions */}
          {!isReadOnly && proposal.status === "open" && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleVote("yes")}
                disabled={isActioning}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all press-scale",
                  myVote === "yes"
                    ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40"
                    : "bg-elev-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10"
                )}
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => handleVote("no")}
                disabled={isActioning}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition-all press-scale",
                  myVote === "no"
                    ? "bg-red-500/20 text-red-400 ring-1 ring-red-500/40"
                    : "bg-elev-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                )}
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
              <div className="w-px h-5 bg-border mx-0.5" />
              <button
                onClick={handleApprove}
                disabled={isActioning}
                className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-[11px] font-medium bg-elev-2 text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-all press-scale"
              >
                <Check className="h-3 w-3" />
                Approve
              </button>
              <button
                onClick={handleReject}
                disabled={isActioning}
                className="h-8 px-2.5 rounded-lg flex items-center gap-1 text-[11px] font-medium bg-elev-2 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all press-scale"
              >
                <X className="h-3 w-3" />
                Reject
              </button>
            </div>
          )}

          {!isReadOnly && proposal.status === "approved" && (
            <Button
              size="sm"
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 press-scale"
              onClick={() => onConvert(proposal)}
            >
              <CalendarPlus className="h-3.5 w-3.5 mr-1" />
              Add to itinerary
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── CreateProposalSheet ──────────────────────────────────────────────────────

function CreateProposalSheet({
  open,
  onOpenChange,
  tripId,
  days,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tripId: string;
  days: Day[];
}) {
  const createProposal = useCreateProposal(tripId);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ProposalCategory>("activity");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [suggestedDayId, setSuggestedDayId] = useState("");

  function reset() {
    setTitle("");
    setCategory("activity");
    setDescription("");
    setLink("");
    setSuggestedDayId("");
  }

  function handleSave() {
    if (!title.trim()) return;
    const payload: CreateProposalPayload = {
      title: title.trim(),
      category,
      description: description.trim() || undefined,
      links: link.trim() ? [link.trim()] : undefined,
      suggestedDayId: suggestedDayId || undefined,
    };
    createProposal.mutate(payload, {
      onSuccess: () => {
        toast.success("Proposal created");
        reset();
        onOpenChange(false);
      },
      onError: (e) => toast.error(e.message),
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-lg tracking-tight">New Proposal</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-1 px-4 pb-6">
          {/* Title */}
          <div>
            <label className="text-section-label mb-1.5 block">Title</label>
            <Input
              placeholder="e.g. Ramen at Ichiran"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              maxLength={120}
            />
          </div>

          {/* Category chips */}
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

          {/* Description */}
          <div>
            <label className="text-section-label mb-1.5 block">
              Description <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <Textarea
              placeholder="Why this? Any details..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={800}
            />
          </div>

          {/* Link */}
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

          {/* Suggested day */}
          {days.length > 0 && (
            <div>
              <label className="text-section-label mb-1.5 block">
                Suggested day <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <select
                value={suggestedDayId}
                onChange={(e) => setSuggestedDayId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              >
                <option value="">No preference</option>
                {days.map((day) => (
                  <option key={day._id} value={day._id}>
                    Day {day.dayNumber} — {day.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSave}
              disabled={!title.trim() || createProposal.isPending}
            >
              {createProposal.isPending ? "Submitting…" : "Submit"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── ConvertProposalSheet ─────────────────────────────────────────────────────

function ConvertProposalSheet({
  proposal,
  open,
  onOpenChange,
  tripId,
  days,
}: {
  proposal: Proposal | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tripId: string;
  days: Day[];
}) {
  const navigate = useNavigate();
  const convertMutation = useConvertProposal(tripId);

  const [dayId, setDayId] = useState(proposal?.suggestedDayId ?? "");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (open) {
      setDayId(proposal?.suggestedDayId ?? "");
      setStartTime("");
      setEndTime("");
    }
  }, [open, proposal]);

  function reset() {
    setDayId(proposal?.suggestedDayId ?? "");
    setStartTime("");
    setEndTime("");
  }

  function handleConvert() {
    if (!proposal || !dayId) return;
    const payload: ConvertProposalPayload = {
      dayId,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
    };
    convertMutation.mutate(
      { proposalId: proposal._id, payload },
      {
        onSuccess: (data) => {
          const day = days.find((d) => d._id === dayId);
          toast.success(`Added to Day ${day?.dayNumber ?? ""}`);
          reset();
          onOpenChange(false);
          navigate(`/itinerary/${dayId}`, {
            state: { highlightEventId: data.event._id },
          });
        },
        onError: (e) => toast.error(e.message),
      }
    );
  }

  if (!proposal) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-lg tracking-tight">Add to itinerary</SheetTitle>
          <p className="text-sm text-muted-foreground leading-snug">{proposal.title}</p>
        </SheetHeader>

        <div className="space-y-4 pt-1 px-4 pb-6">
          {/* Day select */}
          <div>
            <label className="text-section-label mb-1.5 block">Day</label>
            <select
              value={dayId}
              onChange={(e) => setDayId(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
            >
              <option value="">Select a day…</option>
              {days.map((day) => (
                <option key={day._id} value={day._id}>
                  Day {day.dayNumber} — {day.city}
                </option>
              ))}
            </select>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-section-label mb-1.5 block">
                Start time <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-section-label mb-1.5 block">
                End time <span className="text-muted-foreground/60">(optional)</span>
              </label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                reset();
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleConvert}
              disabled={!dayId || convertMutation.isPending}
            >
              {convertMutation.isPending ? "Adding…" : "Add to itinerary"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── ProposalsScreen ──────────────────────────────────────────────────────────

type StatusTab = ProposalStatus;

function EmptyState({
  status,
  isReadOnly,
  onAdd,
}: {
  status: StatusTab;
  isReadOnly: boolean;
  onAdd: () => void;
}) {
  const messages: Record<StatusTab, string> = {
    open: "No open proposals yet",
    approved: "No approved proposals",
    rejected: "No rejected proposals",
  };

  return (
    <div className="text-center py-12">
      <div className="h-12 w-12 rounded-2xl bg-elev-2 flex items-center justify-center mx-auto mb-3">
        <Lightbulb className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{messages[status]}</p>
      {status === "open" && !isReadOnly && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 border-primary/30 text-primary hover:bg-primary/10"
          onClick={onAdd}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add first proposal
        </Button>
      )}
    </div>
  );
}

export function ProposalsScreen() {
  const { tripId } = useTripContext();
  const { user, isReadOnly } = useAuth();
  const currentUserId = user?.id ?? "";

  const [activeStatus, setActiveStatus] = useState<StatusTab>("open");
  const [activeCategory, setActiveCategory] = useState<ProposalCategory | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [convertProposal, setConvertProposal] = useState<Proposal | null>(null);
  const [convertOpen, setConvertOpen] = useState(false);

  const { data: proposals, isLoading } = useProposals(tripId, {
    status: activeStatus,
    category: activeCategory ?? undefined,
  });
  const { data: days = [] } = useDays(tripId);

  const filtered = proposals ?? [];

  function handleConvert(proposal: Proposal) {
    setConvertProposal(proposal);
    setConvertOpen(true);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">Proposals</h1>
        {!isReadOnly && (
          <Button
            size="sm"
            className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 press-scale"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      {/* Status tabs */}
      <Tabs
        value={activeStatus}
        onValueChange={(v) => setActiveStatus(v as StatusTab)}
      >
        <TabsList className="w-full">
          <TabsTrigger value="open" className="flex-1">Open</TabsTrigger>
          <TabsTrigger value="approved" className="flex-1">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="flex-1">Rejected</TabsTrigger>
        </TabsList>

        {/* Category filter chips */}
        <div className="flex gap-1.5 flex-wrap pt-1">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-medium transition-all press-scale border",
              !activeCategory
                ? "bg-primary/20 text-primary border-primary/40"
                : "bg-elev-2 text-muted-foreground border-transparent"
            )}
          >
            All
          </button>
          {CATEGORIES.map((cat) => {
            const cfg = CATEGORY_CONFIG[cat];
            const Icon = cfg.icon;
            const active = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(active ? null : cat)}
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

        {(["open", "approved", "rejected"] as StatusTab[]).map((status) => (
          <TabsContent key={status} value={status} className="mt-4">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="space-y-3">
                {filtered.map((proposal) => (
                  <ProposalCard
                    key={proposal._id}
                    proposal={proposal}
                    currentUserId={currentUserId}
                    isReadOnly={isReadOnly}
                    tripId={tripId}
                    onConvert={handleConvert}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                status={status}
                isReadOnly={isReadOnly}
                onAdd={() => setCreateOpen(true)}
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Sheets */}
      {!isReadOnly && (
        <CreateProposalSheet
          open={createOpen}
          onOpenChange={setCreateOpen}
          tripId={tripId}
          days={days}
        />
      )}
      <ConvertProposalSheet
        proposal={convertProposal}
        open={convertOpen}
        onOpenChange={setConvertOpen}
        tripId={tripId}
        days={days}
      />
    </div>
  );
}
