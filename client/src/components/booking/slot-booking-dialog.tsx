import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, Users, DollarSign } from "lucide-react";
import type { SlotWithBooking } from "@/components/dashboard/tee-time-schedule";

// ── Form schema ───────────────────────────────────────────────────────────────

const bookingSchema = z.object({
  playerCount: z.number().min(1).max(4),
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(timeStr: string): string {
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
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SlotBookingDialogProps {
  slot: SlotWithBooking | null;
  open: boolean;
  onClose: () => void;
}

export default function SlotBookingDialog({
  slot,
  open,
  onClose,
}: SlotBookingDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      playerCount: 2,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    },
  });

  const playerCount = form.watch("playerCount");
  const pricePerPlayer = slot ? parseFloat(slot.currentPrice) : 0;
  const totalPrice = (pricePerPlayer * playerCount).toFixed(2);

  const createBooking = useMutation({
    mutationFn: async (values: BookingFormValues) => {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          teeTimeSlotId: slot!.id,
          playerCount: values.playerCount,
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerPhone: values.customerPhone || null,
          notes: null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || "Failed to create booking");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate schedule + stats so the dashboard refreshes
      queryClient.invalidateQueries({
        queryKey: ["tee-times-schedule", user?.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/courses", user?.courseId, "bookings"],
      });

      toast({
        title: "Booking confirmed!",
        description: `${formatTime(slot!.time)} on ${formatDate(slot!.date)} for ${playerCount} player${playerCount > 1 ? "s" : ""}.`,
      });
      form.reset();
      onClose();
    },
    onError: (err: Error) => {
      toast({
        title: "Booking failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  function handleClose() {
    if (!createBooking.isPending) {
      form.reset();
      onClose();
    }
  }

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Book Tee Time</DialogTitle>
          <DialogDescription>
            Fill in the golfer's details to confirm this slot.
          </DialogDescription>
        </DialogHeader>

        {/* Slot summary */}
        <div className="rounded-xl border bg-muted/30 p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="w-4 h-4" />
            <span>{formatDate(slot.date)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{formatTime(slot.time)}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <DollarSign className="w-4 h-4" />
            <span>
              ${slot.currentPrice} per player · {slot.holes} holes
            </span>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => createBooking.mutate(v))}
            className="space-y-4"
          >
            {/* Player count */}
            <FormField
              control={form.control}
              name="playerCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of Players</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(parseInt(v))}
                    defaultValue={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[1, 2, 3, 4].map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          <span className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5" />
                            {n} {n === 1 ? "Player" : "Players"}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Customer name */}
            <FormField
              control={form.control}
              name="customerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="customerPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Total */}
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">
                {playerCount} × ${slot.currentPrice}
              </span>
              <span className="text-xl font-bold text-primary">
                ${totalPrice}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={createBooking.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createBooking.isPending}
              >
                {createBooking.isPending ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
