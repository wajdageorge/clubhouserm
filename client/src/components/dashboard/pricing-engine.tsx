import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings2, Zap, ArrowRight } from "lucide-react";
import BookingForm from "@/components/booking/booking-form";

export default function PricingEngine() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: pricingRules, isLoading } = useQuery({
    queryKey: ["/api/courses", user?.courseId, "pricing-rules"],
    enabled: !!user?.courseId,
  });

  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const defaultRules = [
    { id: "1", name: "Weekend Premium", description: "Sat-Sun +25%", isActive: true },
    { id: "2", name: "Peak Hours", description: "8AM-11AM +15%", isActive: true },
    { id: "3", name: "Weather Discount", description: "Rain forecast -20%", isActive: false },
  ];

  const rules = pricingRules && pricingRules.length > 0 ? pricingRules : defaultRules;

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <CardTitle className="text-base">Dynamic Pricing</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map((rule: any) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 border border-border rounded-xl hover:bg-muted/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    rule.isActive ? "bg-primary/10 dark:bg-primary/20" : "bg-muted"
                  }`}>
                    <Settings2 className={`w-4 h-4 ${rule.isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-sm" data-testid={`text-rule-name-${rule.id}`}>
                      {rule.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{rule.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    rule.isActive
                      ? "bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {rule.isActive ? "Active" : "Off"}
                  </span>
                  <Switch checked={rule.isActive} data-testid={`switch-rule-${rule.id}`} />
                </div>
              </div>
            ))}
          </div>

          <Button
            className="w-full mt-5"
            onClick={() => setLocation("/pricing")}
            data-testid="button-configure-pricing"
          >
            Configure Rules
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Customer Booking</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingForm />
        </CardContent>
      </Card>
    </div>
  );
}
