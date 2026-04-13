import { useState } from "react";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import QuickStats from "@/components/dashboard/quick-stats";
import TeeTimeSchedule from "@/components/dashboard/tee-time-schedule";
import type { SlotWithBooking } from "@/components/dashboard/tee-time-schedule";
import QuickActions from "@/components/dashboard/quick-actions";
import WeatherCard from "@/components/dashboard/weather-card";
import CompetitorPricing from "@/components/dashboard/competitor-pricing";
import RevenueAnalytics from "@/components/dashboard/revenue-analytics";
import PricingEngine from "@/components/dashboard/pricing-engine";
import DemandForecast from "@/components/dashboard/demand-forecast";
import SlotBookingDialog from "@/components/booking/slot-booking-dialog";

export default function Dashboard() {
  useDocumentTitle("Dashboard", "Manage your golf course operations, bookings, and revenue analytics");
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Booking dialog state
  const [selectedSlot, setSelectedSlot] = useState<SlotWithBooking | null>(null);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);

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

  function handleBookSlot(slot: SlotWithBooking) {
    setSelectedSlot(slot);
    setBookingDialogOpen(true);
  }

  function handleCloseDialog() {
    setBookingDialogOpen(false);
    setSelectedSlot(null);
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
              <TeeTimeSchedule onBookSlot={handleBookSlot} />
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

      {/* Slot booking dialog — opens when a tee time slot is clicked */}
      <SlotBookingDialog
        slot={selectedSlot}
        open={bookingDialogOpen}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
