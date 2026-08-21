import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTrip } from "@/shared/hooks/mutations";
import type { Trip } from "@/shared/types";
import type { CreateTripPayload } from "@/shared/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DEFAULT_TIMEZONE =
  typeof Intl !== "undefined" && Intl.DateTimeFormat?.().resolvedOptions?.().timeZone
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "Asia/Tokyo";

const TOTAL_STEPS = 4;

const PACE_OPTIONS = [
  { value: "relaxed" as const, label: "Relaxed" },
  { value: "balanced" as const, label: "Balanced" },
  { value: "packed" as const, label: "Packed" },
];

const DAILY_STRUCTURE_OPTIONS = [
  { value: "morning-heavy" as const, label: "Morning-heavy" },
  { value: "evening-heavy" as const, label: "Evening-heavy" },
  { value: "mixed" as const, label: "Mixed" },
];

const INTEREST_OPTIONS = [
  "Food",
  "Culture & history",
  "Nature",
  "Tech",
  "Nightlife",
  "Shopping",
  "Anime & games",
  "Museums",
  "Day trips",
  "Onsen / spa",
  "Photography",
  "Theme parks",
];

const BUDGET_OPTIONS = [
  { value: "low" as const, label: "Low" },
  { value: "mid" as const, label: "Mid" },
  { value: "high" as const, label: "High" },
];

const TRANSPORT_OPTIONS = [
  { value: "publicTransport" as const, label: "Public transport" },
  { value: "mixed" as const, label: "Mixed" },
  { value: "taxis" as const, label: "Taxis" },
];

export interface CreateTripWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (trip: Trip) => void;
}

export function CreateTripWizard({
  open,
  onOpenChange,
  onSuccess,
}: CreateTripWizardProps) {
  const navigate = useNavigate();
  const createTrip = useCreateTrip();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [destinationCity, setDestinationCity] = useState("");
  const [destinationCountry, setDestinationCountry] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE);
  const [groupSize, setGroupSize] = useState(2);
  const [isOrganizer, setIsOrganizer] = useState(true);
  const [pace, setPace] = useState<"relaxed" | "balanced" | "packed">("balanced");
  const [dailyStructure, setDailyStructure] = useState<
    "morning-heavy" | "evening-heavy" | "mixed" | undefined
  >(undefined);
  const [interests, setInterests] = useState<string[]>([]);
  const [budgetLevel, setBudgetLevel] = useState<"low" | "mid" | "high">("mid");
  const [transportPreference, setTransportPreference] = useState<
    "publicTransport" | "mixed" | "taxis" | undefined
  >(undefined);
  const [notes, setNotes] = useState("");

  const resetForm = useCallback(() => {
    setStep(1);
    setName("");
    setDestinationCity("");
    setDestinationCountry("");
    setStartDate("");
    setEndDate("");
    setTimezone(DEFAULT_TIMEZONE);
    setGroupSize(2);
    setIsOrganizer(true);
    setPace("balanced");
    setDailyStructure(undefined);
    setInterests([]);
    setBudgetLevel("mid");
    setTransportPreference(undefined);
    setNotes("");
  }, []);

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open) resetForm();
      onOpenChange(open);
    },
    [onOpenChange, resetForm]
  );

  // Step validation
  const canProceedStep1 =
    name.trim() !== "" &&
    destinationCity.trim() !== "" &&
    startDate !== "" &&
    endDate !== "";

  const canProceedStep2 = true;

  const canProceedStep3 = interests.length >= 1 && interests.length <= 6;

  const canProceedStep4 = true;

  const canSubmit =
    canProceedStep1 &&
    canProceedStep2 &&
    canProceedStep3 &&
    canProceedStep4 &&
    interests.length >= 1 &&
    groupSize >= 1;

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : prev.length < 6
          ? [...prev, interest]
          : prev
    );
  };

  async function handleSubmit() {
    if (!canSubmit) return;
    const payload: CreateTripPayload = {
      name: name.trim(),
      startDate: startDate || new Date().toISOString().slice(0, 10),
      endDate: endDate || startDate || new Date().toISOString().slice(0, 10),
      timezone: timezone || DEFAULT_TIMEZONE,
      preferences: {
        destinationCity: destinationCity.trim(),
        destinationCountry: destinationCountry.trim() || undefined,
        pace,
        dailyStructure: dailyStructure || undefined,
        interests,
        budgetLevel,
        transportPreference: transportPreference || undefined,
        notes: notes.trim() || undefined,
        groupSize,
      },
    };
    try {
      const newTrip = await createTrip.mutateAsync(payload);
      toast.success("Trip created");
      handleClose(false);
      resetForm();
      onSuccess?.(newTrip);
      navigate("/today");
    } catch {
      toast.error("Could not create trip");
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="max-h-[90dvh] rounded-t-2xl bg-elev-1 border-t border-border flex flex-col p-0 gap-0"
        showCloseButton={true}
      >
        <SheetHeader className="px-4 pt-4 pb-2 pr-10 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <SheetTitle className="text-lg tracking-tight">
              New trip
            </SheetTitle>
            <span className="text-sm text-muted-foreground">
              {step} of {TOTAL_STEPS}
            </span>
          </div>
          <div
            className="h-1 rounded-full bg-elev-2 overflow-hidden mt-2"
            role="progressbar"
            aria-valuenow={step}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
          >
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Step 1 — Basics */}
          {step === 1 && (
            <div className="space-y-4">
              <Input
                placeholder="Trip name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-base"
              />
              <Input
                placeholder="Destination / city *"
                value={destinationCity}
                onChange={(e) => setDestinationCity(e.target.value)}
                className="text-base"
              />
              <Input
                placeholder="Country (optional)"
                value={destinationCountry}
                onChange={(e) => setDestinationCountry(e.target.value)}
                className="text-base"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="date"
                  placeholder="Start date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  type="date"
                  placeholder="End date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <Input
                placeholder="Timezone (optional)"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="text-base"
              />
            </div>
          )}

          {/* Step 2 — Group */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Who&apos;s going? *
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={groupSize}
                    onChange={(e) =>
                      setGroupSize(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                    }
                    className="border border-input rounded-md px-3 py-2 w-20 text-base bg-transparent"
                  />
                  <span className="text-sm text-muted-foreground">travelers</span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOrganizer}
                  onChange={(e) => setIsOrganizer(e.target.checked)}
                  className="rounded border-input"
                />
                <span className="text-sm">I&apos;m the organizer</span>
              </label>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Travel pace *
                </label>
                <div className="flex flex-wrap gap-2">
                  {PACE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPace(opt.value)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-all border",
                        pace === opt.value
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-elev-2 text-muted-foreground border-transparent"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Daily structure (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAILY_STRUCTURE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setDailyStructure(
                          dailyStructure === opt.value ? undefined : opt.value
                        )
                      }
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-all border",
                        dailyStructure === opt.value
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-elev-2 text-muted-foreground border-transparent"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Interests */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Pick 3–6 interests
              </p>
              <div className="flex flex-wrap gap-2">
                {INTEREST_OPTIONS.map((interest) => {
                  const selected = interests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-all border",
                        selected
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-elev-2 text-muted-foreground border-transparent"
                      )}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
              {interests.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {interests.length} selected
                  {interests.length < 3 && " — add at least 3 for better suggestions"}
                </p>
              )}
            </div>
          )}

          {/* Step 4 — Logistics */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Budget *
                </label>
                <div className="flex flex-wrap gap-2">
                  {BUDGET_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBudgetLevel(opt.value)}
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-all border",
                        budgetLevel === opt.value
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-elev-2 text-muted-foreground border-transparent"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Transport preference (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TRANSPORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        setTransportPreference(
                          transportPreference === opt.value ? undefined : opt.value
                        )
                      }
                      className={cn(
                        "rounded-full px-3 py-1.5 text-sm font-medium transition-all border",
                        transportPreference === opt.value
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-elev-2 text-muted-foreground border-transparent"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Notes (optional)
                </label>
                <Textarea
                  placeholder="Any must-dos or constraints?"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="min-h-20 resize-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Sticky bottom actions */}
        <div className="shrink-0 flex gap-2 p-4 pt-2 border-t border-border bg-elev-1">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          ) : (
            <div className="flex-1" />
          )}
          {step < TOTAL_STEPS ? (
            <Button
              type="button"
              className="flex-1"
              disabled={
                (step === 1 && !canProceedStep1) ||
                (step === 3 && !canProceedStep3)
              }
              onClick={() => setStep((s) => s + 1)}
            >
              Next
            </Button>
          ) : (
            <Button
              type="button"
              className="flex-1"
              disabled={!canSubmit || createTrip.isPending}
              onClick={handleSubmit}
            >
              {createTrip.isPending ? "Creating…" : "Create Trip"}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
