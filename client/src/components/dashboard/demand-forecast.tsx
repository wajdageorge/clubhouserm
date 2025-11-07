import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { TeeTimeSlot } from "@shared/schema";
import { format, addDays } from "date-fns";

interface DemandForecast {
  date: string;
  timeSlot: string;
  baselineDemand: number;
  adjustedDemand: number;
  baselinePrice: number;
  adjustedPrice: number;
  utilization: number;
}

export default function DemandForecast() {
  const { user } = useAuth();
  const [forecastDays, setForecastDays] = useState(7);
  const [minPriceCap, setMinPriceCap] = useState(50);
  const [maxPriceCap, setMaxPriceCap] = useState(200);
  const [minDemandCap, setMinDemandCap] = useState(10);
  const [maxDemandCap, setMaxDemandCap] = useState(100);
  const [forecasts, setForecasts] = useState<DemandForecast[]>([]);

  const { data: teeTimeSlots, isLoading } = useQuery<TeeTimeSlot[]>({
    queryKey: ["/api/courses", user?.courseId, "tee-times"],
    enabled: !!user?.courseId,
  });

  const { data: bookings } = useQuery<any[]>({
    queryKey: ["/api/courses", user?.courseId, "bookings"],
    enabled: !!user?.courseId,
  });

  // Baseline demand forecasting algorithm
  useEffect(() => {
    if (!teeTimeSlots || !bookings) return;

    const calculateBaselineForecast = () => {
      const forecastData: DemandForecast[] = [];
      const today = new Date();

      // Historical demand analysis
      const historicalBookings = bookings || [];
      const dayOfWeekDemand: Record<number, number> = {};
      const timeOfDayDemand: Record<number, number> = {};
      const totalBookingsCount = historicalBookings.length;

      // Analyze historical patterns from real booking data
      historicalBookings.forEach((booking: any) => {
        if (!booking.createdAt) return;
        
        const bookingDate = new Date(booking.createdAt);
        const dayOfWeek = bookingDate.getDay();

        // Increment day demand counter
        dayOfWeekDemand[dayOfWeek] = (dayOfWeekDemand[dayOfWeek] || 0) + 1;
      });

      // Analyze tee time slots for time patterns
      teeTimeSlots?.forEach((slot) => {
        if (!slot.time) return;
        const hour = parseInt(slot.time.split(':')[0]);
        // Count available slots to understand capacity
        if (!slot.isAvailable) {
          timeOfDayDemand[hour] = (timeOfDayDemand[hour] || 0) + 1;
        }
      });

      // Generate forecasts for next N days
      for (let i = 0; i < forecastDays; i++) {
        const forecastDate = addDays(today, i);
        const dayOfWeek = forecastDate.getDay();
        const dateStr = format(forecastDate, 'yyyy-MM-dd');

        // Sample time slots (morning, midday, afternoon, evening)
        const timeSlots = ['08:00', '10:00', '13:00', '16:00'];

        timeSlots.forEach((timeSlot) => {
          const hour = parseInt(timeSlot.split(':')[0]);

          // Baseline demand calculation from historical data
          const dayDemandCount = dayOfWeekDemand[dayOfWeek] || 0;
          const timeDemandCount = timeOfDayDemand[hour] || 0;
          
          // Calculate as percentage of total bookings
          const dayDemandPercentage = totalBookingsCount > 0 
            ? (dayDemandCount / totalBookingsCount) * 100 
            : 40;
          const timeDemandPercentage = timeDemandCount > 0 ? timeDemandCount * 10 : 30;
          
          // Weekend boost
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const weekendBoost = isWeekend ? 1.3 : 1.0;
          
          // Prime time boost (8-11 AM)
          const isPrimeTime = hour >= 8 && hour <= 11;
          const primeTimeBoost = isPrimeTime ? 1.2 : 1.0;

          // Calculate baseline from real patterns
          let baselineDemand = (dayDemandPercentage + timeDemandPercentage) / 2;
          baselineDemand = Math.max(20, Math.min(90, baselineDemand * weekendBoost * primeTimeBoost));

          // Apply user constraints
          const adjustedDemand = Math.max(minDemandCap, Math.min(maxDemandCap, baselineDemand));

          // Base price from tee times or default
          const basePrice = 100;
          
          // Dynamic pricing based on demand
          const demandPriceMultiplier = 1 + (adjustedDemand - 50) / 100;
          let adjustedPrice = basePrice * demandPriceMultiplier * weekendBoost;
          
          // Apply price caps
          adjustedPrice = Math.max(minPriceCap, Math.min(maxPriceCap, adjustedPrice));

          const utilization = (adjustedDemand / maxDemandCap) * 100;

          forecastData.push({
            date: dateStr,
            timeSlot,
            baselineDemand: Math.round(baselineDemand),
            adjustedDemand: Math.round(adjustedDemand),
            baselinePrice: Math.round(basePrice),
            adjustedPrice: Math.round(adjustedPrice),
            utilization: Math.round(utilization),
          });
        });
      }

      setForecasts(forecastData);
    };

    calculateBaselineForecast();
  }, [teeTimeSlots, bookings, forecastDays, minPriceCap, maxPriceCap, minDemandCap, maxDemandCap]);

  const resetToDefaults = () => {
    setForecastDays(7);
    setMinPriceCap(50);
    setMaxPriceCap(200);
    setMinDemandCap(10);
    setMaxDemandCap(100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-96 bg-muted rounded-lg animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle data-testid="text-forecast-title">Demand Forecasting & Price Optimization</CardTitle>
          <Badge variant="outline" data-testid="badge-algorithm-status">Algorithm: Active</Badge>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Baseline forecast calculated from historical patterns with user-defined constraints
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Control Panel */}
        <div className="bg-muted/30 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="forecast-days" data-testid="label-forecast-days">Forecast Days</Label>
              <Input
                id="forecast-days"
                type="number"
                value={forecastDays}
                onChange={(e) => setForecastDays(parseInt(e.target.value) || 7)}
                min={1}
                max={30}
                data-testid="input-forecast-days"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-price" data-testid="label-min-price">Min Price Cap ($)</Label>
              <Input
                id="min-price"
                type="number"
                value={minPriceCap}
                onChange={(e) => setMinPriceCap(parseInt(e.target.value) || 50)}
                data-testid="input-min-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-price" data-testid="label-max-price">Max Price Cap ($)</Label>
              <Input
                id="max-price"
                type="number"
                value={maxPriceCap}
                onChange={(e) => setMaxPriceCap(parseInt(e.target.value) || 200)}
                data-testid="input-max-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-demand" data-testid="label-min-demand">Min Demand Cap (%)</Label>
              <Input
                id="min-demand"
                type="number"
                value={minDemandCap}
                onChange={(e) => setMinDemandCap(parseInt(e.target.value) || 10)}
                data-testid="input-min-demand"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-demand" data-testid="label-max-demand">Max Demand Cap (%)</Label>
              <Input
                id="max-demand"
                type="number"
                value={maxDemandCap}
                onChange={(e) => setMaxDemandCap(parseInt(e.target.value) || 100)}
                data-testid="input-max-demand"
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={resetToDefaults}
                className="w-full"
                data-testid="button-reset-defaults"
              >
                Reset to Defaults
              </Button>
            </div>
          </div>
        </div>

        {/* Forecast Table */}
        <div className="overflow-x-auto">
          <table className="w-full" data-testid="table-forecast">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Time</th>
                <th className="text-right py-3 px-2">Baseline Demand</th>
                <th className="text-right py-3 px-2">Adjusted Demand</th>
                <th className="text-right py-3 px-2">Baseline Price</th>
                <th className="text-right py-3 px-2">Adjusted Price</th>
                <th className="text-right py-3 px-2">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No forecast data available. Add bookings to generate predictions.
                  </td>
                </tr>
              ) : (
                forecasts.map((forecast, idx) => (
                  <tr key={idx} className="border-b hover:bg-muted/50" data-testid={`row-forecast-${idx}`}>
                    <td className="py-3 px-2">{format(new Date(forecast.date), 'MMM d, yyyy')}</td>
                    <td className="py-3 px-2">{forecast.timeSlot}</td>
                    <td className="text-right py-3 px-2 text-muted-foreground">{forecast.baselineDemand}%</td>
                    <td className="text-right py-3 px-2 font-medium">{forecast.adjustedDemand}%</td>
                    <td className="text-right py-3 px-2 text-muted-foreground">${forecast.baselinePrice}</td>
                    <td className="text-right py-3 px-2 font-medium text-chart-1">${forecast.adjustedPrice}</td>
                    <td className="text-right py-3 px-2">
                      <Badge 
                        variant={forecast.utilization > 70 ? "default" : forecast.utilization > 40 ? "secondary" : "outline"}
                        data-testid={`badge-utilization-${idx}`}
                      >
                        {forecast.utilization}%
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        {forecasts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Demand</p>
              <p className="text-2xl font-bold text-chart-2" data-testid="text-avg-demand">
                {Math.round(forecasts.reduce((sum, f) => sum + f.adjustedDemand, 0) / forecasts.length)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Avg Price</p>
              <p className="text-2xl font-bold text-chart-1" data-testid="text-avg-price">
                ${Math.round(forecasts.reduce((sum, f) => sum + f.adjustedPrice, 0) / forecasts.length)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Peak Demand</p>
              <p className="text-2xl font-bold text-chart-3" data-testid="text-peak-demand">
                {Math.max(...forecasts.map(f => f.adjustedDemand))}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Revenue Potential</p>
              <p className="text-2xl font-bold text-chart-4" data-testid="text-revenue-potential">
                ${Math.round(forecasts.reduce((sum, f) => sum + (f.adjustedPrice * f.adjustedDemand / 100), 0))}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
