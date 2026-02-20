import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

const revenueData = [
  { date: "Mon", revenue: 2400, bookings: 12 },
  { date: "Tue", revenue: 2210, bookings: 10 },
  { date: "Wed", revenue: 2900, bookings: 15 },
  { date: "Thu", revenue: 2780, bookings: 14 },
  { date: "Fri", revenue: 3200, bookings: 16 },
  { date: "Sat", revenue: 4100, bookings: 20 },
  { date: "Sun", revenue: 3800, bookings: 19 },
];

export default function RevenueAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="mt-8">
        <Card>
          <CardContent className="p-6">
            <div className="h-64 bg-muted rounded-lg animate-pulse"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Revenue Analytics</CardTitle>
            </div>
            <Select defaultValue="7days">
              <SelectTrigger className="w-32 h-8 text-xs">
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
          <div className="h-64 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "10px",
                    fontSize: "12px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value: number) => [`$${value}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(142, 71%, 45%)"
                  strokeWidth={2.5}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <p className="text-xl font-bold text-emerald-500" data-testid="text-weekly-revenue">
                ${stats?.weeklyRevenue || "0.00"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">This Week</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-lime-500" data-testid="text-average-booking">
                ${stats?.averageBooking || "0.00"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Avg. Booking</p>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-blue-500" data-testid="text-total-bookings">
                {stats?.totalBookings || 0}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Total Bookings</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
