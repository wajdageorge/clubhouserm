import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { CalendarCheck, DollarSign, Clock, PieChart, TrendingUp, TrendingDown } from "lucide-react";

export default function QuickStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-5 animate-pulse">
            <div className="h-20 bg-muted rounded-lg"></div>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Today's Bookings",
      value: stats?.todayBookings || 0,
      change: 12,
      trend: "up" as const,
      icon: CalendarCheck,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      testId: "text-today-bookings",
    },
    {
      label: "Revenue",
      value: `$${stats?.todayRevenue || "0.00"}`,
      change: 8,
      trend: "up" as const,
      icon: DollarSign,
      color: "text-lime-500",
      bgColor: "bg-lime-500/10 dark:bg-lime-500/20",
      testId: "text-today-revenue",
    },
    {
      label: "Available Slots",
      value: stats?.availableSlots || 0,
      change: 5,
      trend: "down" as const,
      icon: Clock,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      testId: "text-available-slots",
    },
    {
      label: "Utilization",
      value: `${stats?.utilization || 0}%`,
      change: 3,
      trend: "up" as const,
      icon: PieChart,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
      testId: "text-utilization",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {statCards.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <Card
            key={i}
            className="p-5 hover:shadow-lg transition-all duration-300 group"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">{stat.label}</p>
                <p className={`text-2xl font-bold mt-1 ${stat.color}`} data-testid={stat.testId}>
                  {stat.value}
                </p>
              </div>
              <div className={`w-11 h-11 ${stat.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <div className="flex items-center mt-3 gap-1.5">
              {stat.trend === "up" ? (
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={`text-xs font-semibold ${stat.trend === "up" ? "text-emerald-500" : "text-destructive"}`}>
                {stat.change}%
              </span>
              <span className="text-muted-foreground text-xs">vs yesterday</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
