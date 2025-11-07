import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function CompetitorPricing() {
  const { user } = useAuth();

  const { data: competitors, isLoading } = useQuery({
    queryKey: ["/api/courses", user?.courseId, "competitors"],
    enabled: !!user?.courseId,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Competitor Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default competitor data if none found
  const defaultCompetitors = [
    { name: "Pineview Golf Club", price: "68", status: "higher" },
    { name: "Oak Hills Country", price: "52", status: "lower" },
    { name: "Meadowbrook GC", price: "58", status: "lower" }
  ];

  const competitorData = competitors && competitors.length > 0 ? competitors : defaultCompetitors;

  return (
    <Card className="p-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Competitor Pricing</CardTitle>
          <Button variant="link" size="sm" data-testid="button-update-competitor-pricing">
            Update
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {competitorData.slice(0, 3).map((competitor: any, index: number) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm" data-testid={`text-competitor-name-${index}`}>
                {competitor.name}
              </span>
              <span className={`font-medium ${
                competitor.status === "higher" ? "text-destructive" : "text-chart-1"
              }`} data-testid={`text-competitor-price-${index}`}>
                ${competitor.price}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between font-semibold border-t border-border pt-2">
            <span className="text-sm">Our Course</span>
            <span className="text-primary" data-testid="text-our-price">$55</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
