import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, Users, Plus, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TeeTimeSchedule() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["/api/courses", user?.courseId, "bookings"],
    enabled: !!user?.courseId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tee Time Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tee Time Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              data-testid="button-today"
            >
              <CalendarDays className="w-3.5 h-3.5 mr-1.5" />
              Today
            </Button>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={() => setLocation("/tee-times")}
              data-testid="button-tomorrow"
            >
              View All
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-2.5">
          {bookings && bookings.length > 0 ? (
            bookings.slice(0, 4).map((booking: any) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3.5 border border-border rounded-xl hover:bg-muted/50 hover:border-primary/20 transition-all duration-200 group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-xl flex flex-col items-center justify-center">
                    <Clock className="w-4 h-4 text-primary mb-0.5" />
                    <span className="text-[10px] font-semibold text-primary">AM</span>
                  </div>
                  <div>
                    <p className="font-medium text-sm" data-testid={`text-customer-name-${booking.id}`}>
                      {booking.customerName}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Users className="w-3 h-3" />
                      <span>{booking.playerCount} Players</span>
                      <span className="text-border">|</span>
                      <span>18 Holes</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={booking.status === "confirmed" ? "default" : "secondary"}
                    className="text-[10px] px-2 py-0.5"
                  >
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </Badge>
                  <span className="font-bold text-sm" data-testid={`text-price-${booking.id}`}>
                    ${booking.totalPrice}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
                <CalendarDays className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm mb-4">No bookings found for today</p>
              <Button size="sm" onClick={() => setLocation("/tee-times")} data-testid="button-create-booking">
                <Plus className="w-4 h-4 mr-1.5" />
                Create First Booking
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between p-3.5 border-2 border-dashed border-border rounded-xl hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 bg-muted rounded-xl flex flex-col items-center justify-center">
                <Clock className="w-4 h-4 text-muted-foreground mb-0.5" />
                <span className="text-[10px] font-medium text-muted-foreground">9 AM</span>
              </div>
              <div>
                <p className="text-muted-foreground text-sm">Available Slot</p>
                <p className="text-xs text-muted-foreground">Open for booking</p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="h-8" onClick={() => setLocation("/tee-times")} data-testid="button-book-slot">
              <Plus className="w-3.5 h-3.5 mr-1" />
              Book
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
