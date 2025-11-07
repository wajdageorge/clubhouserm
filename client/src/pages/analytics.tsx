import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Analytics() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [timeRange, setTimeRange] = useState("7days");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!user?.courseId,
  });

  // Sample data for charts
  const revenueData = [
    { date: 'Mon', revenue: 2400, bookings: 12 },
    { date: 'Tue', revenue: 2210, bookings: 10 },
    { date: 'Wed', revenue: 2900, bookings: 15 },
    { date: 'Thu', revenue: 2780, bookings: 14 },
    { date: 'Fri', revenue: 3200, bookings: 16 },
    { date: 'Sat', revenue: 4100, bookings: 20 },
    { date: 'Sun', revenue: 3800, bookings: 19 },
  ];

  const revenueBreakdown = [
    { name: 'Tee Times', value: 65, color: '#36AA59' },
    { name: 'Pro Shop', value: 20, color: '#A3E635' },
    { name: 'F&B', value: 10, color: '#5B9EF5' },
    { name: 'Events', value: 5, color: '#C084FC' },
  ];

  const hourlyBookings = [
    { hour: '7 AM', count: 3 },
    { hour: '8 AM', count: 8 },
    { hour: '9 AM', count: 12 },
    { hour: '10 AM', count: 10 },
    { hour: '11 AM', count: 9 },
    { hour: '12 PM', count: 7 },
    { hour: '1 PM', count: 6 },
    { hour: '2 PM', count: 8 },
    { hour: '3 PM', count: 10 },
    { hour: '4 PM', count: 11 },
    { hour: '5 PM', count: 9 },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <TopBar title="Analytics" description="Revenue analytics and performance insights" />
        
        <div className="p-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-chart-1 text-xl"></i>
                </div>
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-24 h-8 text-xs" data-testid="select-time-range-revenue">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">7d</SelectItem>
                    <SelectItem value="30days">30d</SelectItem>
                    <SelectItem value="90days">90d</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold text-chart-1" data-testid="text-total-revenue">
                ${stats?.weeklyRevenue || "0.00"}
              </p>
              <div className="flex items-center mt-2 space-x-1">
                <i className="fas fa-arrow-up text-chart-1 text-xs"></i>
                <span className="text-chart-1 text-sm font-medium">15.3%</span>
                <span className="text-muted-foreground text-sm">vs prev period</span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-check text-chart-2 text-xl"></i>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Total Bookings</p>
              <p className="text-2xl font-bold text-chart-2" data-testid="text-total-bookings-analytics">
                {stats?.totalBookings || 0}
              </p>
              <div className="flex items-center mt-2 space-x-1">
                <i className="fas fa-arrow-up text-chart-2 text-xs"></i>
                <span className="text-chart-2 text-sm font-medium">12.5%</span>
                <span className="text-muted-foreground text-sm">vs prev period</span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-chart-3 text-xl"></i>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Avg Transaction</p>
              <p className="text-2xl font-bold text-chart-3" data-testid="text-avg-transaction">
                ${stats?.averageBooking || "0.00"}
              </p>
              <div className="flex items-center mt-2 space-x-1">
                <i className="fas fa-arrow-up text-chart-3 text-xs"></i>
                <span className="text-chart-3 text-sm font-medium">7.8%</span>
                <span className="text-muted-foreground text-sm">vs prev period</span>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-chart-4/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-percentage text-chart-4 text-xl"></i>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Utilization Rate</p>
              <p className="text-2xl font-bold text-chart-4" data-testid="text-utilization-rate">
                {stats?.utilization || 0}%
              </p>
              <div className="flex items-center mt-2 space-x-1">
                <i className="fas fa-arrow-up text-chart-4 text-xs"></i>
                <span className="text-chart-4 text-sm font-medium">3.2%</span>
                <span className="text-muted-foreground text-sm">vs prev period</span>
              </div>
            </Card>
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#36AA59" 
                      strokeWidth={2}
                      name="Revenue ($)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={revenueBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {revenueBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="bookings" fill="#A3E635" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Hours Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hourlyBookings}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="hour" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="count" fill="#5B9EF5" name="Bookings" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
