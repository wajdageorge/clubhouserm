import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WeatherCard() {
  const { user } = useAuth();

  const { data: weather, isLoading } = useQuery({
    queryKey: ["/api/courses", user?.courseId, "weather"],
    enabled: !!user?.courseId,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Weather Conditions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-3"></div>
            <div className="h-8 bg-muted rounded mb-2"></div>
            <div className="h-4 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default weather data if no weather found
  const currentWeather = weather || {
    temperature: 72,
    condition: "Sunny",
    windSpeed: 5,
    humidity: 45
  };

  return (
    <Card className="p-6">
      <CardHeader className="pb-4">
        <CardTitle>Weather Conditions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-full flex items-center justify-center">
            <i className="fas fa-sun text-white text-2xl"></i>
          </div>
          <p className="text-2xl font-bold" data-testid="text-temperature">
            {currentWeather.temperature}°F
          </p>
          <p className="text-muted-foreground" data-testid="text-condition">
            {currentWeather.condition}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Wind</p>
              <p className="font-medium" data-testid="text-wind">
                {currentWeather.windSpeed} mph
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Humidity</p>
              <p className="font-medium" data-testid="text-humidity">
                {currentWeather.humidity}%
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
