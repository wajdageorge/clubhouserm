import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";

export default function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Today's Bookings</p>
            <p className="text-2xl font-bold text-chart-1" data-testid="text-today-bookings">
              {stats?.todayBookings || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-calendar-check text-chart-1"></i>
          </div>
        </div>
        <div className="flex items-center mt-4 space-x-1">
          <i className="fas fa-arrow-up text-chart-1 text-xs"></i>
          <span className="text-chart-1 text-sm font-medium">12%</span>
          <span className="text-muted-foreground text-sm">vs yesterday</span>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Revenue</p>
            <p className="text-2xl font-bold text-chart-2" data-testid="text-today-revenue">
              ${stats?.todayRevenue || "0.00"}
            </p>
          </div>
          <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-dollar-sign text-chart-2"></i>
          </div>
        </div>
        <div className="flex items-center mt-4 space-x-1">
          <i className="fas fa-arrow-up text-chart-2 text-xs"></i>
          <span className="text-chart-2 text-sm font-medium">8%</span>
          <span className="text-muted-foreground text-sm">vs yesterday</span>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Available Slots</p>
            <p className="text-2xl font-bold text-chart-3" data-testid="text-available-slots">
              {stats?.availableSlots || 0}
            </p>
          </div>
          <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-clock text-chart-3"></i>
          </div>
        </div>
        <div className="flex items-center mt-4 space-x-1">
          <i className="fas fa-arrow-down text-destructive text-xs"></i>
          <span className="text-destructive text-sm font-medium">5%</span>
          <span className="text-muted-foreground text-sm">vs yesterday</span>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Utilization</p>
            <p className="text-2xl font-bold text-chart-4" data-testid="text-utilization">
              {stats?.utilization || 0}%
            </p>
          </div>
          <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
            <i className="fas fa-chart-pie text-chart-4"></i>
          </div>
        </div>
        <div className="flex items-center mt-4 space-x-1">
          <i className="fas fa-arrow-up text-chart-4 text-xs"></i>
          <span className="text-chart-4 text-sm font-medium">3%</span>
          <span className="text-muted-foreground text-sm">vs yesterday</span>
        </div>
      </Card>
    </div>
  );
}
