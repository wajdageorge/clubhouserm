import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Wind, Droplets, Cloud } from "lucide-react";

export default function WeatherCard() {
  const { user } = useAuth();

  const { data: weather, isLoading } = useQuery({
    queryKey: ["/api/courses", user?.courseId, "weather"],
    enabled: !!user?.courseId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Weather</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="w-14 h-14 bg-muted rounded-full mx-auto mb-3"></div>
            <div className="h-8 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentWeather = weather || {
    temperature: 72,
    condition: "Sunny",
    windSpeed: 5,
    humidity: 45,
  };

  const getWeatherIcon = (condition: string) => {
    if (condition.toLowerCase().includes("cloud")) return Cloud;
    return Sun;
  };

  const WeatherIcon = getWeatherIcon(currentWeather.condition);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Weather</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-amber-300 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-300/20 dark:shadow-amber-600/10">
            <WeatherIcon className="w-7 h-7 text-white" />
          </div>
          <p className="text-3xl font-bold tracking-tight" data-testid="text-temperature">
            {currentWeather.temperature}°F
          </p>
          <p className="text-sm text-muted-foreground mt-0.5" data-testid="text-condition">
            {currentWeather.condition}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 justify-center bg-muted/50 rounded-lg py-2 px-3">
              <Wind className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Wind</p>
                <p className="text-sm font-semibold" data-testid="text-wind">{currentWeather.windSpeed} mph</p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-center bg-muted/50 rounded-lg py-2 px-3">
              <Droplets className="w-3.5 h-3.5 text-muted-foreground" />
              <div className="text-left">
                <p className="text-xs text-muted-foreground">Humidity</p>
                <p className="text-sm font-semibold" data-testid="text-humidity">{currentWeather.humidity}%</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
