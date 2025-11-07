import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { User, Booking } from "@shared/schema";
import { format } from "date-fns";
import { Eye } from "lucide-react";

export default function Customers() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showBookingHistory, setShowBookingHistory] = useState(false);

  const { data: customers, isLoading: customersLoading } = useQuery<User[]>({
    queryKey: ["/api/courses", user?.courseId, "customers"],
    enabled: !!user?.courseId && isAuthenticated,
  });

  const { data: customerBookings, isLoading: bookingsLoading } = useQuery<Booking[]>({
    queryKey: ["/api/customers", selectedCustomer?.id, "bookings"],
    enabled: !!selectedCustomer?.id,
  });

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

  if (isLoading || customersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const handleViewBookingHistory = (customer: User) => {
    setSelectedCustomer(customer);
    setShowBookingHistory(true);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      cancelled: "destructive",
      completed: "outline",
    };
    return <Badge variant={variants[status] || "default"} data-testid={`badge-status-${status}`}>{status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "secondary",
      paid: "default",
      refunded: "destructive",
    };
    return <Badge variant={variants[status] || "default"} data-testid={`badge-payment-${status}`}>{status}</Badge>;
  };

  const totalBookings = selectedCustomer ? customerBookings?.length || 0 : 0;
  const totalSpent = customerBookings?.reduce((sum, booking) => sum + parseFloat(booking.totalPrice), 0) || 0;
  const completedBookings = customerBookings?.filter(b => b.status === "completed").length || 0;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <TopBar title="Customers" description="Manage customer information and booking history" />
        
        <div className="p-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-customer-list-title">Customer Database</CardTitle>
            </CardHeader>
            <CardContent>
              {!customers || customers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-customers">
                  No customers found. Customers will appear here when they make bookings.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="header-name">Name</TableHead>
                      <TableHead data-testid="header-email">Email</TableHead>
                      <TableHead data-testid="header-role">Role</TableHead>
                      <TableHead data-testid="header-joined">Joined</TableHead>
                      <TableHead data-testid="header-actions">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                        <TableCell data-testid={`text-customer-name-${customer.id}`}>
                          {customer.firstName && customer.lastName 
                            ? `${customer.firstName} ${customer.lastName}` 
                            : customer.email}
                        </TableCell>
                        <TableCell data-testid={`text-customer-email-${customer.id}`}>
                          {customer.email}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" data-testid={`badge-role-${customer.id}`}>
                            {customer.role}
                          </Badge>
                        </TableCell>
                        <TableCell data-testid={`text-customer-joined-${customer.id}`}>
                          {customer.createdAt 
                            ? format(new Date(customer.createdAt), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewBookingHistory(customer)}
                            data-testid={`button-view-bookings-${customer.id}`}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Bookings
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Booking History Dialog */}
      <Dialog open={showBookingHistory} onOpenChange={setShowBookingHistory}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle data-testid="text-booking-history-title">
              Booking History - {selectedCustomer?.firstName && selectedCustomer?.lastName 
                ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` 
                : selectedCustomer?.email}
            </DialogTitle>
          </DialogHeader>

          {bookingsLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Customer Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold" data-testid="text-total-bookings">
                      {totalBookings}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Bookings</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold" data-testid="text-total-spent">
                      ${totalSpent.toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-2xl font-bold" data-testid="text-completed-bookings">
                      {completedBookings}
                    </div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </CardContent>
                </Card>
              </div>

              {/* Bookings Table */}
              {!customerBookings || customerBookings.length === 0 ? (
                <p className="text-muted-foreground text-center py-8" data-testid="text-no-bookings">
                  No bookings found for this customer.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="header-booking-date">Date</TableHead>
                      <TableHead data-testid="header-booking-players">Players</TableHead>
                      <TableHead data-testid="header-booking-price">Price</TableHead>
                      <TableHead data-testid="header-booking-status">Status</TableHead>
                      <TableHead data-testid="header-booking-payment">Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerBookings.map((booking) => (
                      <TableRow key={booking.id} data-testid={`row-booking-${booking.id}`}>
                        <TableCell data-testid={`text-booking-date-${booking.id}`}>
                          {booking.createdAt 
                            ? format(new Date(booking.createdAt), "MMM d, yyyy")
                            : "N/A"}
                        </TableCell>
                        <TableCell data-testid={`text-booking-players-${booking.id}`}>
                          {booking.playerCount}
                        </TableCell>
                        <TableCell data-testid={`text-booking-price-${booking.id}`}>
                          ${parseFloat(booking.totalPrice).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(booking.status)}
                        </TableCell>
                        <TableCell>
                          {getPaymentBadge(booking.paymentStatus)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
