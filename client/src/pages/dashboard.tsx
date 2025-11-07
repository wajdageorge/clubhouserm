import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import QuickStats from "@/components/dashboard/quick-stats";
import TeeTimeSchedule from "@/components/dashboard/tee-time-schedule";
import QuickActions from "@/components/dashboard/quick-actions";
import WeatherCard from "@/components/dashboard/weather-card";
import CompetitorPricing from "@/components/dashboard/competitor-pricing";
import RevenueAnalytics from "@/components/dashboard/revenue-analytics";
import PricingEngine from "@/components/dashboard/pricing-engine";
import DemandForecast from "@/components/dashboard/demand-forecast";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <TopBar title="Dashboard" description="Welcome back, manage your golf course operations" />
        
        <div className="p-6">
          <QuickStats />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
            <div className="lg:col-span-2">
              <TeeTimeSchedule />
            </div>
            <div className="space-y-6">
              <QuickActions />
              <WeatherCard />
              <CompetitorPricing />
            </div>
          </div>

          <RevenueAnalytics />
          
          <div className="mt-8">
            <DemandForecast />
          </div>
          
          <PricingEngine />
        </div>
      </main>
    </div>
  );
}
