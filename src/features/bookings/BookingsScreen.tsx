import { useState, useMemo } from "react";
import {
  Ticket,
  Plus,
  Plane,
  Hotel,
  Train,
  Calendar,
  ExternalLink,
  StickyNote,
  Sparkles,
  Hash,
  Utensils,
  Clock,
  MapPin,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { FilterChips, type FilterOption } from "@/components/ui/filter-chips";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useBookings } from "@/shared/hooks/queries";
import { useCreateBooking, useDeleteBooking } from "@/shared/hooks/mutations";
import { useTripContext } from "@/shared/context/useTripContext";
import { cn } from "@/lib/utils";
import type { Booking, BookingType } from "@/shared/types";
import type { LucideIcon } from "lucide-react";

const bookingTypeConfig: Record<
  BookingType,
  { icon: LucideIcon; label: string; bgClass: string; fgClass: string }
> = {
  flight: {
    icon: Plane,
    label: "Flight",
    bgClass: "bg-booking-flight",
    fgClass: "text-booking-flight-foreground",
  },
  hotel: {
    icon: Hotel,
    label: "Hotel",
    bgClass: "bg-booking-hotel",
    fgClass: "text-booking-hotel-foreground",
  },
  rail: {
    icon: Train,
    label: "Rail",
    bgClass: "bg-booking-train",
    fgClass: "text-booking-train-foreground",
  },
  reservation: {
    icon: Utensils,
    label: "Reservation",
    bgClass: "bg-booking-activity",
    fgClass: "text-booking-activity-foreground",
  },
  activity: {
    icon: Sparkles,
    label: "Activity",
    bgClass: "bg-booking-activity",
    fgClass: "text-booking-activity-foreground",
  },
  other: {
    icon: Ticket,
    label: "Other",
    bgClass: "bg-booking-other",
    fgClass: "text-booking-other-foreground",
  },
};

const bookingTypes: BookingType[] = ["flight", "hotel", "rail", "reservation", "activity", "other"];

const bookingFilterOptions: FilterOption[] = bookingTypes.map((t) => ({
  value: t,
  label: bookingTypeConfig[t].label,
  icon: bookingTypeConfig[t].icon,
  bgClass: bookingTypeConfig[t].bgClass,
  fgClass: bookingTypeConfig[t].fgClass,
}));

// ─── BookingCard ────────────────────────────────────────────────────────────

function BookingCard({
  booking,
  onClick,
}: {
  booking: Booking;
  onClick: () => void;
}) {
  const config = bookingTypeConfig[booking.type] ?? bookingTypeConfig.other;
  const Icon = config.icon;

  const dateStr = booking.date
    ? new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Card className="press-scale cursor-pointer" onClick={onClick}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div
            className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${config.bgClass}`}
          >
            <Icon className={`h-4 w-4 ${config.fgClass}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{booking.title}</h3>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              {dateStr && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {dateStr}
                </span>
              )}
              {booking.startTime && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {booking.startTime}
                </span>
              )}
              {booking.location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {booking.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Confirmation code */}
        {booking.confirmationNumber && (
          <div className="mono-pill flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{booking.confirmationNumber}</span>
          </div>
        )}

        {/* Notes */}
        {booking.notes && (
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <StickyNote className="h-3 w-3 mt-0.5 shrink-0" />
            <span>{booking.notes}</span>
          </div>
        )}

        {/* Links */}
        {booking.links && booking.links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {booking.links.map((link, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                className="h-7 text-xs border-primary/20 text-primary hover:bg-primary/10"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
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
      </CardContent>
    </Card>
  );
}

// ─── BookingDetailSheet ─────────────────────────────────────────────────────

function BookingDetailSheet({
  booking,
  open,
  onOpenChange,
}: {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { tripId } = useTripContext();
  const deleteMutation = useDeleteBooking(tripId);

  if (!booking) return null;
  const config = bookingTypeConfig[booking.type] ?? bookingTypeConfig.other;
  const Icon = config.icon;

  const dateStr = booking.date
    ? new Date(booking.date + "T00:00:00").toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2">
          <div className="flex items-center gap-2">
            <span className={`badge-subtle ${config.bgClass} ${config.fgClass}`}>
              <Icon className="h-3 w-3" />
              {config.label}
            </span>
          </div>
          <SheetTitle className="text-xl tracking-tight">
            {booking.title}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-2 px-4 pb-6">
          {dateStr && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {dateStr}
                {booking.startTime && ` at ${booking.startTime}`}
              </span>
            </div>
          )}

          {booking.location && (
            <div className="flex items-center gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{booking.location}</span>
            </div>
          )}

          {booking.confirmationNumber && (
            <>
              <Separator className="bg-border" />
              <div>
                <p className="text-section-label mb-1.5">Confirmation</p>
                <div className="mono-pill">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>{booking.confirmationNumber}</span>
                </div>
              </div>
            </>
          )}

          {booking.notes && (
            <>
              <Separator className="bg-border" />
              <div className="flex items-start gap-3">
                <StickyNote className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">{booking.notes}</p>
              </div>
            </>
          )}

          {booking.links && booking.links.length > 0 && (
            <>
              <Separator className="bg-border" />
              <div className="space-y-1.5">
                <p className="text-section-label">Links</p>
                {booking.links.map((link, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-primary"
                    asChild
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-1" />
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
            </>
          )}

          <Separator className="bg-border" />
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-danger-foreground hover:bg-danger/20"
            onClick={() => {
              deleteMutation.mutate(booking._id, {
                onSuccess: () => onOpenChange(false),
              });
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            {deleteMutation.isPending ? "Deleting..." : "Delete Booking"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── AddBookingSheet ────────────────────────────────────────────────────────

function AddBookingSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { tripId } = useTripContext();
  const createBooking = useCreateBooking(tripId);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<BookingType>("flight");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [location, setLocation] = useState("");
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");

  function reset() {
    setTitle("");
    setType("flight");
    setDate("");
    setStartTime("");
    setConfirmationNumber("");
    setLocation("");
    setLink("");
    setNotes("");
  }

  function handleSave() {
    if (!title.trim()) return;
    createBooking.mutate(
      {
        title: title.trim(),
        type,
        date: date || undefined,
        startTime: startTime || undefined,
        confirmationNumber: confirmationNumber || undefined,
        location: location || undefined,
        links: link ? [link] : undefined,
        notes: notes || undefined,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl bg-elev-1 border-t border-border"
      >
        <SheetHeader className="text-left pb-2">
          <SheetTitle className="text-lg tracking-tight">
            Add Booking
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 pt-1 px-4 pb-6">
          {/* Title */}
          <div>
            <label className="text-section-label mb-1.5 block">Title</label>
            <Input
              placeholder="e.g. British Airways to Tokyo"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          {/* Type chips */}
          <div>
            <label className="text-section-label mb-1.5 block">Type</label>
            <div className="flex gap-1.5 flex-wrap">
              {bookingTypes.map((t) => {
                const cfg = bookingTypeConfig[t];
                const Icon = cfg.icon;
                const active = type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
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

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-section-label mb-1.5 block">Date</label>
              <DatePicker
                value={date}
                onChange={setDate}
                placeholder="Pick date"
              />
            </div>
            <div>
              <label className="text-section-label mb-1.5 block">Time</label>
              <TimePicker
                value={startTime}
                onChange={setStartTime}
                placeholder="Pick time"
              />
            </div>
          </div>

          {/* Confirmation */}
          <div>
            <label className="text-section-label mb-1.5 block">
              Confirmation Code
            </label>
            <Input
              placeholder="ABC-12345"
              className="font-mono"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
            />
          </div>

          {/* Location */}
          <div>
            <label className="text-section-label mb-1.5 block">Location</label>
            <Input
              placeholder="e.g. Shinjuku, Tokyo"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {/* Link */}
          <div>
            <label className="text-section-label mb-1.5 block">Link</label>
            <Input
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="text-section-label mb-1.5 block">Notes</label>
            <Textarea
              placeholder="Any details..."
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
              onClick={handleSave}
              disabled={!title.trim() || createBooking.isPending}
            >
              {createBooking.isPending ? "Saving..." : "Save Booking"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── BookingsScreen ─────────────────────────────────────────────────────────

export function BookingsScreen() {
  const { tripId } = useTripContext();
  const { data: bookings, isLoading } = useBookings(tripId);
  const [activeType, setActiveType] = useState<string | null>(null);

  const filteredBookings = useMemo(() => {
    if (!bookings) return undefined;
    if (!activeType) return bookings;
    return bookings.filter((b) => b.type === activeType);
  }, [bookings, activeType]);

  const [addOpen, setAddOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-page-title">Bookings</h1>
        <Button
          size="sm"
          className="h-8 bg-primary text-primary-foreground hover:bg-primary/90 press-scale"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      {/* Type filter */}
      <FilterChips
        options={bookingFilterOptions}
        selected={activeType}
        onChange={setActiveType}
      />

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredBookings && filteredBookings.length > 0 ? (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <BookingCard
              key={booking._id}
              booking={booking}
              onClick={() => {
                setSelectedBooking(booking);
                setDetailOpen(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="h-12 w-12 rounded-2xl bg-elev-2 flex items-center justify-center mx-auto mb-3">
            <Ticket className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {activeType ? "No bookings match this filter" : "No bookings yet"}
          </p>
          {!activeType && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add your first booking
            </Button>
          )}
        </div>
      )}

      <AddBookingSheet open={addOpen} onOpenChange={setAddOpen} />
      <BookingDetailSheet
        booking={selectedBooking}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
