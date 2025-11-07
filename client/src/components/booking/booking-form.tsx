import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertBookingSchema, type TeeTimeSlot, type PricingRule } from "@shared/schema";

const bookingFormSchema = z.object({
  date: z.string().min(1, "Date is required"),
  teeTimeSlotId: z.string().min(1, "Please select a tee time"),
  playerCount: z.number().min(1).max(4),
  customerName: z.string().min(2, "Name must be at least 2 characters"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().optional(),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function BookingForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      teeTimeSlotId: "",
      playerCount: 2,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      notes: "",
    },
  });

  const watchedSlotId = form.watch("teeTimeSlotId");
  const watchedPlayers = form.watch("playerCount");

  useEffect(() => {
    setSelectedDate(form.watch("date"));
  }, [form.watch("date")]);

  const { data: teeTimeSlots = [], isLoading: slotsLoading } = useQuery<TeeTimeSlot[]>({
    queryKey: ["/api/courses", user?.courseId, "tee-times", selectedDate],
    enabled: !!user?.courseId && !!selectedDate,
  });

  const { data: pricingRules = [], isLoading: rulesLoading } = useQuery<PricingRule[]>({
    queryKey: ["/api/courses", user?.courseId, "pricing-rules"],
    enabled: !!user?.courseId,
  });

  const selectedSlot = useMemo(() => {
    return teeTimeSlots.find(slot => slot.id === watchedSlotId);
  }, [teeTimeSlots, watchedSlotId]);

  const calculatedPrice = useMemo(() => {
    if (!selectedSlot || !pricingRules) return '0.00';

    let basePrice = parseFloat(selectedSlot.currentPrice);
    let totalMultiplier = 1.0;

    const selectedDateObj = new Date(selectedDate);
    const dayOfWeek = selectedDateObj.getDay();
    const slotTime = selectedSlot.time;
    const [hours] = slotTime.split(':').map(Number);

    pricingRules
      .filter(rule => rule.isActive)
      .forEach(rule => {
        const modifier = parseFloat(rule.modifier);
        const conditions = rule.conditions as any;

        switch (rule.ruleType) {
          case 'time_based':
            if (conditions?.startHour !== undefined && conditions?.endHour !== undefined) {
              if (hours >= conditions.startHour && hours < conditions.endHour) {
                totalMultiplier *= modifier;
              }
            }
            break;

          case 'day_based':
            if (conditions?.days && Array.isArray(conditions.days)) {
              if (conditions.days.includes(dayOfWeek)) {
                totalMultiplier *= modifier;
              }
            }
            break;

          case 'weather_based':
            break;

          case 'utilization_based':
            break;
        }
      });

    return (basePrice * totalMultiplier * watchedPlayers).toFixed(2);
  }, [selectedSlot, pricingRules, selectedDate, watchedPlayers]);

  const createBookingMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertBookingSchema>) => {
      return await apiRequest("/api/bookings", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId, "bookings"] });
      toast({
        title: "Booking Confirmed!",
        description: "Your tee time has been successfully booked.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Booking Failed",
        description: error?.message || "Failed to create booking. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: BookingFormValues) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to book a tee time.",
        variant: "destructive",
      });
      return;
    }

    createBookingMutation.mutate({
      teeTimeSlotId: values.teeTimeSlotId,
      customerId: user.id,
      playerCount: values.playerCount,
      totalPrice: calculatedPrice,
      customerName: values.customerName,
      customerEmail: values.customerEmail,
      customerPhone: values.customerPhone || null,
      notes: values.notes || null,
      status: "confirmed",
      paymentStatus: "pending",
    });
  };

  const availableSlots = teeTimeSlots.filter(slot => slot.isAvailable);

  return (
    <div className="border-2 border-dashed border-muted rounded-lg p-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    data-testid="input-booking-date"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="playerCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Players</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-player-count">
                      <SelectValue placeholder="Select players" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="1">1 Player</SelectItem>
                    <SelectItem value="2">2 Players</SelectItem>
                    <SelectItem value="3">3 Players</SelectItem>
                    <SelectItem value="4">4 Players</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teeTimeSlotId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Available Times</FormLabel>
                <FormControl>
                  {slotsLoading ? (
                    <div className="py-4 text-center text-sm text-muted-foreground">
                      Loading available times...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="py-4 text-center text-sm text-muted-foreground" data-testid="text-no-slots-available">
                      No available tee times for this date
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map((slot) => (
                        <Button
                          key={slot.id}
                          type="button"
                          variant={field.value === slot.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => field.onChange(slot.id)}
                          data-testid={`button-time-${slot.time.replace(/[: ]/g, '-')}`}
                        >
                          {slot.time}
                          <span className="ml-2 text-xs">
                            ${slot.currentPrice}
                          </span>
                        </Button>
                      ))}
                    </div>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    data-testid="input-customer-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
                    data-testid="input-customer-email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="(555) 123-4567"
                    {...field}
                    data-testid="input-customer-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any special requests..."
                    {...field}
                    data-testid="textarea-notes"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between py-4 border-t">
            <span className="font-medium">Total Price</span>
            <span className="text-2xl font-bold text-primary" data-testid="text-total-price">
              ${rulesLoading ? "..." : calculatedPrice}
            </span>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createBookingMutation.isPending || !selectedSlot}
            data-testid="button-book-tee-time"
          >
            {createBookingMutation.isPending ? "Booking..." : "Book Now"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
