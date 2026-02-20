import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";

export default function CompetitorPricing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: competitors, isLoading } = useQuery({
    queryKey: ["/api/courses", user?.courseId, "competitors"],
    enabled: !!user?.courseId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Competitor Pricing</CardTitle>
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

  const defaultCompetitors = [
    { name: "Pineview Golf Club", price: "68", status: "higher" },
    { name: "Oak Hills Country", price: "52", status: "lower" },
    { name: "Meadowbrook GC", price: "58", status: "lower" },
  ];

  const competitorData = competitors && competitors.length > 0 ? competitors : defaultCompetitors;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Competitors</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7 px-2"
            onClick={() => setLocation("/competitors")}
            data-testid="button-update-competitor-pricing"
          >
            View all
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2.5">
          {competitorData.slice(0, 3).map((competitor: any, index: number) => (
            <div key={index} className="flex items-center justify-between py-1">
              <span className="text-sm truncate max-w-[140px]" data-testid={`text-competitor-name-${index}`}>
                {competitor.name}
              </span>
              <div className="flex items-center gap-1.5">
                {competitor.status === "higher" ? (
                  <TrendingUp className="w-3.5 h-3.5 text-destructive" />
                ) : competitor.status === "lower" ? (
                  <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                )}
                <span
                  className={`font-semibold text-sm ${
                    competitor.status === "higher" ? "text-destructive" : "text-emerald-500"
                  }`}
                  data-testid={`text-competitor-price-${index}`}
                >
                  ${competitor.price}
                </span>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-sm font-semibold">Our Course</span>
            <span className="font-bold text-primary" data-testid="text-our-price">$55</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
