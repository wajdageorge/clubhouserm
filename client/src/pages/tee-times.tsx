import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Plus, CalendarDays, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertTeeTimeSlotSchema, type TeeTimeSlot } from "@shared/schema";

const createTeeTimeSchema = insertTeeTimeSlotSchema.omit({ courseId: true });
const updateTeeTimeSchema = z.object({
  basePrice: z.string().min(1, "Base price is required"),
  currentPrice: z.string().min(1, "Current price is required"),
  isAvailable: z.boolean(),
});

export default function TeeTimes() {
  useDocumentTitle("Tee Times", "Manage tee time slots and availability");
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TeeTimeSlot | null>(null);

  const createForm = useForm({
    resolver: zodResolver(createTeeTimeSchema),
    defaultValues: {
      date: selectedDate,
      time: "",
      maxPlayers: 4,
      basePrice: "55.00",
      currentPrice: "55.00",
      holes: 18,
      isAvailable: true,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(updateTeeTimeSchema),
    defaultValues: {
      basePrice: "",
      currentPrice: "",
      isAvailable: true,
    },
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

  useEffect(() => {
    if (editingSlot) {
      editForm.reset({
        basePrice: editingSlot.basePrice,
        currentPrice: editingSlot.currentPrice,
        isAvailable: editingSlot.isAvailable,
      });
    }
  }, [editingSlot, editForm]);

  const { data: teeTimeSlots, isLoading: slotsLoading } = useQuery<TeeTimeSlot[]>({
    queryKey: ["/api/courses", user?.courseId, "tee-times", selectedDate],
    enabled: !!user?.courseId,
  });

  const createSlotMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createTeeTimeSchema>) => {
      return await apiRequest(`/api/courses/${user?.courseId}/tee-times`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId, "tee-times"] });
      toast({
        title: "Success",
        description: "Tee time slot created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create tee time slot",
        variant: "destructive",
      });
    },
  });

  const updateSlotMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof updateTeeTimeSchema> }) => {
      return await apiRequest(`/api/tee-times/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId, "tee-times"] });
      toast({
        title: "Success",
        description: "Tee time slot updated successfully",
      });
      setEditingSlot(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update tee time slot",
        variant: "destructive",
      });
    },
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/tee-times/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId, "tee-times"] });
      toast({
        title: "Success",
        description: "Tee time slot deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tee time slot",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (values: z.infer<typeof createTeeTimeSchema>) => {
    createSlotMutation.mutate(values);
  };

  const onUpdateSubmit = (values: z.infer<typeof updateTeeTimeSchema>) => {
    if (!editingSlot) return;
    updateSlotMutation.mutate({
      id: editingSlot.id,
      data: values,
    });
  };

  const toggleAvailability = (slot: TeeTimeSlot) => {
    updateSlotMutation.mutate({
      id: slot.id,
      data: {
        basePrice: slot.basePrice,
        currentPrice: slot.currentPrice,
        isAvailable: !slot.isAvailable,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-h-screen">
        <TopBar title="Tee Times" description="Manage tee time slots and availability" />
        
        <div className="p-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle data-testid="title-tee-times">Tee Time Slots</CardTitle>
                <div className="flex items-center space-x-3">
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-48"
                    data-testid="input-select-date"
                  />
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button data-testid="button-create-tee-time">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Tee Time
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle data-testid="title-create-dialog">Create New Tee Time Slot</DialogTitle>
                      </DialogHeader>
                      <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                          <FormField
                            control={createForm.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} data-testid="input-create-date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="time"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time</FormLabel>
                                <FormControl>
                                  <Input type="time" {...field} data-testid="input-create-time" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="maxPlayers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Max Players</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number" 
                                    min={1} 
                                    max={4} 
                                    {...field}
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-create-max-players" 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="holes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Holes</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value?.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger data-testid="select-create-holes">
                                      <SelectValue placeholder="Select holes" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="9">9 Holes</SelectItem>
                                    <SelectItem value="18">18 Holes</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="basePrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Base Price ($)</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} data-testid="input-create-base-price" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="currentPrice"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Price ($)</FormLabel>
                                <FormControl>
                                  <Input type="text" {...field} data-testid="input-create-current-price" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsCreateDialogOpen(false)}
                              data-testid="button-cancel-create"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createSlotMutation.isPending}
                              data-testid="button-submit-create"
                            >
                              {createSlotMutation.isPending ? "Creating..." : "Create Slot"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {slotsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" data-testid="loading-slots" />
                </div>
              ) : !teeTimeSlots || teeTimeSlots.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarDays className="w-10 h-10 text-muted-foreground mb-3 mx-auto" />
                  <p className="text-muted-foreground" data-testid="text-no-slots">
                    No tee time slots found for {selectedDate}
                  </p>
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-slot">
                    Create First Tee Time
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead data-testid="header-time">Time</TableHead>
                      <TableHead data-testid="header-holes">Holes</TableHead>
                      <TableHead data-testid="header-max-players">Max Players</TableHead>
                      <TableHead data-testid="header-base-price">Base Price</TableHead>
                      <TableHead data-testid="header-current-price">Current Price</TableHead>
                      <TableHead data-testid="header-status">Status</TableHead>
                      <TableHead className="text-right" data-testid="header-actions">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teeTimeSlots.map((slot) => (
                      <TableRow key={slot.id} data-testid={`row-slot-${slot.id}`}>
                        <TableCell className="font-medium" data-testid={`text-time-${slot.id}`}>
                          {slot.time}
                        </TableCell>
                        <TableCell data-testid={`text-holes-${slot.id}`}>
                          {slot.holes}
                        </TableCell>
                        <TableCell data-testid={`text-max-players-${slot.id}`}>
                          {slot.maxPlayers}
                        </TableCell>
                        <TableCell data-testid={`text-base-price-${slot.id}`}>
                          ${slot.basePrice}
                        </TableCell>
                        <TableCell data-testid={`text-current-price-${slot.id}`}>
                          ${slot.currentPrice}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={slot.isAvailable ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleAvailability(slot)}
                            data-testid={`badge-status-${slot.id}`}
                          >
                            {slot.isAvailable ? "Available" : "Unavailable"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingSlot(slot)}
                              data-testid={`button-edit-${slot.id}`}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm("Are you sure you want to delete this tee time slot?")) {
                                  deleteSlotMutation.mutate(slot.id);
                                }
                              }}
                              data-testid={`button-delete-${slot.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Edit Dialog */}
        <Dialog open={!!editingSlot} onOpenChange={(open) => !open && setEditingSlot(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle data-testid="title-edit-dialog">Edit Tee Time Slot</DialogTitle>
            </DialogHeader>
            {editingSlot && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Date & Time</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-edit-datetime">
                      {editingSlot.date} at {editingSlot.time}
                    </p>
                  </div>
                  <FormField
                    control={editForm.control}
                    name="basePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Base Price ($)</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} data-testid="input-edit-base-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="currentPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Price ($)</FormLabel>
                        <FormControl>
                          <Input type="text" {...field} data-testid="input-edit-current-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="isAvailable"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Availability</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(value === 'true')}
                          defaultValue={field.value ? 'true' : 'false'}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-edit-availability">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="true">Available</SelectItem>
                            <SelectItem value="false">Unavailable</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingSlot(null)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateSlotMutation.isPending}
                      data-testid="button-submit-edit"
                    >
                      {updateSlotMutation.isPending ? "Updating..." : "Update Slot"}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
