import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function QuickActions() {
  const actions = [
    {
      icon: "fas fa-plus",
      label: "New Booking",
      bgColor: "bg-primary/10",
      iconColor: "text-primary",
      testId: "button-new-booking"
    },
    {
      icon: "fas fa-tags",
      label: "Update Pricing",
      bgColor: "bg-chart-2/10",
      iconColor: "text-chart-2",
      testId: "button-update-pricing"
    },
    {
      icon: "fas fa-chart-bar",
      label: "View Reports",
      bgColor: "bg-chart-3/10",
      iconColor: "text-chart-3",
      testId: "button-view-reports"
    },
    {
      icon: "fas fa-users",
      label: "Manage Staff",
      bgColor: "bg-chart-4/10",
      iconColor: "text-chart-4",
      testId: "button-manage-staff"
    }
  ];

  return (
    <Card className="p-6">
      <CardHeader className="pb-4">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="w-full flex items-center space-x-3 p-3 h-auto justify-start"
              data-testid={action.testId}
            >
              <div className={`w-8 h-8 ${action.bgColor} rounded-lg flex items-center justify-center`}>
                <i className={`${action.icon} ${action.iconColor} text-sm`}></i>
              </div>
              <span className="font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
