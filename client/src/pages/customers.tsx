import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Customers() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

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
        <TopBar title="Customers" description="Manage customer information and booking history" />
        
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Customer Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Customer management features will be implemented here, including:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground">
                <li>Customer database and profiles</li>
                <li>Booking history tracking</li>
                <li>Customer preferences and notes</li>
                <li>Communication tools</li>
                <li>Loyalty program integration</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
