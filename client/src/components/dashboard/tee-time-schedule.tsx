import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, ChevronLeft, ChevronRight, Users, ArrowRight, Plus } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

export type SlotWithBooking = {
  id: string;
  time: string;
  date: string;
  basePrice: string;
  currentPrice: string;
  isAvailable: boolean;
  maxPlayers: number;
  holes: number;
  booking: {
    id: string;
    customerName: string;
    playerCount: number;
    totalPrice: string;
    status: string;
  } | null;
};

interface TeeTimeScheduleProps {
  onBookSlot?: (slot: SlotWithBooking) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(timeStr: string): string {
  // Handles "HH:MM" and "HH:MM:SS"
  const parts = timeStr.split(":");
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const period = h < 12 ? "AM" : "PM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:${m} ${period}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

// ── Slot row ──────────────────────────────────────────────────────────────────

function SlotRow({
  slot,
  onBook,
}: {
  slot: SlotWithBooking;
  onBook?: (slot: SlotWithBooking) => void;
}) {
  const isBooked = !slot.isAvailable && slot.booking;
  const isBlocked = !slot.isAvailable && !slot.booking;

  if (isBooked) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 group">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-primary w-16 shrink-0">
            {formatTime(slot.time)}
          </span>
          <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <span className="text-sm font-medium truncate max-w-[140px]">
            {slot.booking!.customerName}
          </span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {slot.booking!.playerCount}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
            {slot.booking!.status === "confirmed" ? "Booked" : "Done"}
          </Badge>
          <span className="text-xs font-semibold text-primary">
            ${slot.booking!.totalPrice}
          </span>
        </div>
      </div>
    );
  }

  if (isBlocked) {
    return (
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40 border border-border/40 opacity-60">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
            {formatTime(slot.time)}
          </span>
          <div className="w-2 h-2 rounded-full bg-muted-foreground shrink-0" />
          <span className="text-sm text-muted-foreground">Blocked</span>
        </div>
        <span className="text-xs text-muted-foreground">—</span>
      </div>
    );
  }

  // Available
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all duration-150 group cursor-pointer"
      onClick={() => onBook?.(slot)}
      data-testid={`slot-${slot.time.replace(":", "-")}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-muted-foreground w-16 shrink-0">
          {formatTime(slot.time)}
        </span>
        <div className="w-2 h-2 rounded-full bg-border group-hover:bg-primary/50 transition-colors shrink-0" />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          Available
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-muted-foreground">${slot.currentPrice}</span>
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onBook?.(slot);
          }}
        >
          <Plus className="w-3 h-3 mr-1" />
          Book
        </Button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TeeTimeSchedule({ onBookSlot }: TeeTimeScheduleProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState(todayStr());

  const { data: schedule = [], isLoading } = useQuery<SlotWithBooking[]>({
    queryKey: ["tee-times-schedule", user?.courseId, selectedDate],
    queryFn: async () => {
      const res = await fetch(
        `/api/courses/${user?.courseId}/tee-times-schedule?date=${selectedDate}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to load schedule");
      return res.json();
    },
    enabled: !!user?.courseId,
  });

  const booked = schedule.filter((s) => !s.isAvailable && s.booking).length;
  const available = schedule.filter((s) => s.isAvailable).length;
  const total = schedule.length;
  const utilPct = total > 0 ? Math.round((booked / total) * 100) : 0;

  const isToday = selectedDate === todayStr();

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Tee Time Schedule</CardTitle>
            {!isLoading && total > 0 && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {booked} booked · {available} open · {utilPct}% utilization
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {/* Date navigation */}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSelectedDate((d) => offsetDate(d, -1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant={isToday ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs px-2"
              onClick={() => setSelectedDate(todayStr())}
            >
              <CalendarDays className="w-3.5 h-3.5 mr-1" />
              {isToday ? "Today" : formatDate(selectedDate)}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSelectedDate((d) => offsetDate(d, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs ml-1"
              onClick={() => setLocation("/tee-times")}
            >
              All
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            Booked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-border inline-block" />
            Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground inline-block opacity-50" />
            Blocked
          </span>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-9 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : schedule.length === 0 ? (
          <div className="text-center py-10">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              No tee times for {formatDate(selectedDate)}
            </p>
            <Button size="sm" onClick={() => setLocation("/tee-times")}>
              <Plus className="w-4 h-4 mr-1.5" />
              Generate Slots
            </Button>
          </div>
        ) : (
          <div
            className="space-y-1 overflow-y-auto pr-1"
            style={{ maxHeight: "420px" }}
          >
            {schedule.map((slot) => (
              <SlotRow key={slot.id} slot={slot} onBook={onBookSlot} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
