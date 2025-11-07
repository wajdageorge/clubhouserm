import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TeeTimeSchedule() {
  const { user } = useAuth();

  const { data: bookings, isLoading } = useQuery({
    queryKey: ["/api/courses", user?.courseId, "bookings"],
    enabled: !!user?.courseId,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Tee Time Schedule</CardTitle>
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
    <Card className="p-6">
      <CardHeader className="pb-6">
        <div className="flex items-center justify-between">
          <CardTitle>Tee Time Schedule</CardTitle>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              data-testid="button-today"
            >
              Today
            </Button>
            <Button 
              size="sm"
              data-testid="button-tomorrow"
            >
              Tomorrow
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {bookings && bookings.length > 0 ? (
            bookings.slice(0, 4).map((booking: any) => (
              <div key={booking.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="font-semibold text-lg">8:00</div>
                    <div className="text-xs text-muted-foreground">AM</div>
                  </div>
                  <div>
                    <p className="font-medium" data-testid={`text-customer-name-${booking.id}`}>
                      {booking.customerName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {booking.playerCount} Players • 18 Holes
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    booking.status === 'confirmed' ? 'bg-chart-1/10 text-chart-1' :
                    booking.status === 'pending' ? 'bg-chart-5/10 text-chart-5' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                  </span>
                  <span className="font-semibold" data-testid={`text-price-${booking.id}`}>
                    ${booking.totalPrice}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No bookings found for today</p>
              <Button className="mt-4" data-testid="button-create-booking">
                Create First Booking
              </Button>
            </div>
          )}

          <div className="flex items-center justify-between p-4 border-2 border-dashed border-muted-foreground/20 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="font-semibold text-lg text-muted-foreground">9:00</div>
                <div className="text-xs text-muted-foreground">AM</div>
              </div>
              <div>
                <p className="text-muted-foreground">Available</p>
                <p className="text-sm text-muted-foreground">Open Slot</p>
              </div>
            </div>
            <Button size="sm" data-testid="button-book-slot">
              Book Now
            </Button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button variant="link" data-testid="button-view-full-schedule">
            View Full Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
