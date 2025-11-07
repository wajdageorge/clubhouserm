import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import BookingForm from "@/components/booking/booking-form";

export default function PricingEngine() {
  const { user } = useAuth();

  const { data: pricingRules, isLoading } = useQuery({
    queryKey: ["/api/courses", user?.courseId, "pricing-rules"],
    enabled: !!user?.courseId,
  });

  if (isLoading) {
    return (
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="p-6">
            <CardContent>
              <div className="h-48 bg-muted rounded-lg animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Default pricing rules if none found
  const defaultRules = [
    {
      id: "1",
      name: "Weekend Premium",
      description: "Sat-Sun +25%",
      isActive: true
    },
    {
      id: "2", 
      name: "Peak Hours",
      description: "8AM-11AM +15%",
      isActive: true
    },
    {
      id: "3",
      name: "Weather Discount", 
      description: "Rain forecast -20%",
      isActive: false
    }
  ];

  const rules = pricingRules && pricingRules.length > 0 ? pricingRules : defaultRules;

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle>Dynamic Pricing Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rules.map((rule: any) => (
              <div key={rule.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div>
                  <p className="font-medium" data-testid={`text-rule-name-${rule.id}`}>
                    {rule.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {rule.description}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-sm font-medium ${
                    rule.isActive ? 'text-chart-1' : 'text-muted-foreground'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <Switch 
                    checked={rule.isActive} 
                    data-testid={`switch-rule-${rule.id}`}
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6">
            <Button 
              className="w-full" 
              data-testid="button-configure-pricing"
              onClick={() => window.location.href = '/pricing'}
            >
              Configure Pricing Rules
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Customer Booking Interface</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingForm />
        </CardContent>
      </Card>
    </div>
  );
}
