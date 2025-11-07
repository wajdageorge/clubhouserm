import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function RevenueAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <Card className="p-6">
          <CardContent>
            <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card className="p-6">
        <CardHeader className="pb-6">
          <div className="flex items-center justify-between">
            <CardTitle>Revenue Analytics</CardTitle>
            <Select defaultValue="7days">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Last 7 days</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
                <SelectItem value="3months">Last 3 months</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {/* Chart Placeholder */}
          <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center mb-6">
            <div className="text-center">
              <i className="fas fa-chart-line text-4xl text-muted-foreground mb-2"></i>
              <p className="text-muted-foreground">Revenue chart visualization would be implemented here</p>
              <p className="text-sm text-muted-foreground mt-1">Using Recharts or similar library</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-chart-1" data-testid="text-weekly-revenue">
                ${stats?.weeklyRevenue || "0.00"}
              </p>
              <p className="text-muted-foreground text-sm">This Week</p>
              <div className="flex items-center justify-center mt-1 space-x-1">
                <i className="fas fa-arrow-up text-chart-1 text-xs"></i>
                <span className="text-chart-1 text-sm font-medium">15%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-chart-2" data-testid="text-average-booking">
                ${stats?.averageBooking || "0.00"}
              </p>
              <p className="text-muted-foreground text-sm">Avg. Booking</p>
              <div className="flex items-center justify-center mt-1 space-x-1">
                <i className="fas fa-arrow-up text-chart-2 text-xs"></i>
                <span className="text-chart-2 text-sm font-medium">7%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-chart-3" data-testid="text-total-bookings">
                {stats?.totalBookings || 0}
              </p>
              <p className="text-muted-foreground text-sm">Total Bookings</p>
              <div className="flex items-center justify-center mt-1 space-x-1">
                <i className="fas fa-arrow-up text-chart-3 text-xs"></i>
                <span className="text-chart-3 text-sm font-medium">12%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
