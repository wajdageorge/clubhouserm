import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-golf-ball text-primary-foreground text-xl"></i>
            </div>
            <h1 className="text-4xl font-bold text-foreground">ClubHouseRM</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            The complete golf course revenue management system
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-calendar-alt text-chart-1 text-xl"></i>
              </div>
              <CardTitle>Tee Time Management</CardTitle>
              <CardDescription>
                Advanced booking system with dynamic pricing and availability tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-chart-line text-chart-2 text-xl"></i>
              </div>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>
                Comprehensive analytics and reporting to maximize your course revenue
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-search text-chart-3 text-xl"></i>
              </div>
              <CardTitle>Competitor Intelligence</CardTitle>
              <CardDescription>
                Track competitor pricing and stay ahead in the market
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Sign in to access your golf course management dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              size="lg"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              Sign In to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
