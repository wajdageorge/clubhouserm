import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tags, BarChart3, Users } from "lucide-react";

export default function QuickActions() {
  const [, setLocation] = useLocation();

  const actions = [
    {
      icon: Plus,
      label: "New Booking",
      description: "Create a tee time booking",
      bgColor: "bg-emerald-500/10 dark:bg-emerald-500/20",
      iconColor: "text-emerald-500",
      testId: "button-new-booking",
      route: "/tee-times",
    },
    {
      icon: Tags,
      label: "Update Pricing",
      description: "Adjust pricing rules",
      bgColor: "bg-lime-500/10 dark:bg-lime-500/20",
      iconColor: "text-lime-500",
      testId: "button-update-pricing",
      route: "/pricing",
    },
    {
      icon: BarChart3,
      label: "View Reports",
      description: "Analytics & insights",
      bgColor: "bg-blue-500/10 dark:bg-blue-500/20",
      iconColor: "text-blue-500",
      testId: "button-view-reports",
      route: "/analytics",
    },
    {
      icon: Users,
      label: "Manage Staff",
      description: "Team management",
      bgColor: "bg-purple-500/10 dark:bg-purple-500/20",
      iconColor: "text-purple-500",
      testId: "button-manage-staff",
      route: "/staff",
    },
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                className="w-full flex items-center gap-3 p-3 h-auto justify-start hover:bg-muted/80 transition-all duration-200"
                onClick={() => setLocation(action.route)}
                data-testid={action.testId}
              >
                <div className={`w-9 h-9 ${action.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${action.iconColor}`} />
                </div>
                <div className="text-left">
                  <span className="font-medium text-sm block">{action.label}</span>
                  <span className="text-xs text-muted-foreground">{action.description}</span>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
