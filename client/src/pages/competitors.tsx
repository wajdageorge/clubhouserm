import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import TopBar from "@/components/layout/top-bar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCompetitorSchema, type Competitor } from "@shared/schema";

const createCompetitorSchema = insertCompetitorSchema.omit({ courseId: true });
const updateCompetitorSchema = insertCompetitorSchema.omit({ courseId: true, isActive: true });

export default function Competitors() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);

  const createForm = useForm({
    resolver: zodResolver(createCompetitorSchema),
    defaultValues: {
      name: "",
      website: "",
      address: "",
      phone: "",
      distance: "",
      isActive: true,
    },
  });

  const editForm = useForm({
    resolver: zodResolver(updateCompetitorSchema),
    defaultValues: {
      name: "",
      website: "",
      address: "",
      phone: "",
      distance: "",
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
    if (editingCompetitor) {
      editForm.reset({
        name: editingCompetitor.name,
        website: editingCompetitor.website || "",
        address: editingCompetitor.address || "",
        phone: editingCompetitor.phone || "",
        distance: editingCompetitor.distance || "",
      });
    }
  }, [editingCompetitor, editForm]);

  useEffect(() => {
    if (isCreateDialogOpen) {
      createForm.reset({
        name: "",
        website: "",
        address: "",
        phone: "",
        distance: "",
        isActive: true,
      });
    }
  }, [isCreateDialogOpen, createForm]);

  const { data: competitors, isLoading: competitorsLoading } = useQuery<Competitor[]>({
    queryKey: ["/api/courses", user?.courseId, "competitors"],
    enabled: !!user?.courseId,
  });

  const createCompetitorMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createCompetitorSchema>) => {
      return await apiRequest(`/api/courses/${user?.courseId}/competitors`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId, "competitors"] });
      toast({
        title: "Success",
        description: "Competitor added successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add competitor",
        variant: "destructive",
      });
    },
  });

  const updateCompetitorMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: z.infer<typeof updateCompetitorSchema> }) => {
      return await apiRequest(`/api/competitors/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId, "competitors"] });
      toast({
        title: "Success",
        description: "Competitor updated successfully",
      });
      setEditingCompetitor(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update competitor",
        variant: "destructive",
      });
    },
  });

  const deleteCompetitorMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/competitors/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId, "competitors"] });
      toast({
        title: "Success",
        description: "Competitor deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete competitor",
        variant: "destructive",
      });
    },
  });

  const onCreateSubmit = (values: z.infer<typeof createCompetitorSchema>) => {
    createCompetitorMutation.mutate(values);
  };

  const onUpdateSubmit = (values: z.infer<typeof updateCompetitorSchema>) => {
    if (!editingCompetitor) return;
    updateCompetitorMutation.mutate({
      id: editingCompetitor.id,
      data: values,
    });
  };

  const toggleCompetitorActive = (competitor: Competitor) => {
    const updateData: any = {
      name: competitor.name,
      website: competitor.website,
      address: competitor.address,
      phone: competitor.phone,
      distance: competitor.distance,
      isActive: !competitor.isActive,
    };
    
    updateCompetitorMutation.mutate({
      id: competitor.id,
      data: updateData,
    });
  };

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
        <TopBar title="Competitors" description="Monitor competitor pricing and market intelligence" />
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-building text-chart-1 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Competitors</p>
                  <p className="text-2xl font-bold">
                    {competitors?.length || 0}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-bar text-chart-2 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Monitoring</p>
                  <p className="text-2xl font-bold">
                    {competitors?.filter(c => c.isActive).length || 0}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-map-marker-alt text-chart-3 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Distance</p>
                  <p className="text-2xl font-bold">
                    {competitors && competitors.length > 0
                      ? (competitors.reduce((sum, c) => sum + parseFloat(c.distance || '0'), 0) / competitors.length).toFixed(1)
                      : '0'} mi
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Competitor Courses</CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-add-competitor">
                      <i className="fas fa-plus mr-2"></i>
                      Add Competitor
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Competitor</DialogTitle>
                    </DialogHeader>
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                        <FormField
                          control={createForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Course Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., Oak Hills Country Club"
                                  data-testid="input-create-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  type="url"
                                  placeholder="https://example.com"
                                  data-testid="input-create-website"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Street address, city, state, ZIP"
                                  data-testid="input-create-address"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  type="tel"
                                  placeholder="(555) 555-5555"
                                  data-testid="input-create-phone"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="distance"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Distance (miles)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || ""}
                                  type="number"
                                  step="0.1"
                                  placeholder="e.g., 5.2"
                                  data-testid="input-create-distance"
                                />
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
                            disabled={createCompetitorMutation.isPending}
                            data-testid="button-submit-create"
                          >
                            {createCompetitorMutation.isPending ? "Adding..." : "Add Competitor"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {competitorsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : !competitors || competitors.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-search text-4xl text-muted-foreground mb-3"></i>
                  <p className="text-muted-foreground" data-testid="text-no-competitors">
                    No competitor courses tracked yet
                  </p>
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-first-competitor">
                    Add First Competitor
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Distance</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {competitors.map((competitor) => (
                      <TableRow key={competitor.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium" data-testid={`text-name-${competitor.id}`}>
                              {competitor.name}
                            </p>
                            {competitor.address && (
                              <p className="text-sm text-muted-foreground" data-testid={`text-address-${competitor.id}`}>
                                {competitor.address}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-distance-${competitor.id}`}>
                          {competitor.distance ? `${competitor.distance} mi` : '-'}
                        </TableCell>
                        <TableCell data-testid={`text-phone-${competitor.id}`}>
                          {competitor.phone || '-'}
                        </TableCell>
                        <TableCell>
                          {competitor.website ? (
                            <a
                              href={competitor.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                              data-testid={`link-website-${competitor.id}`}
                            >
                              Visit Site
                            </a>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={competitor.isActive ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleCompetitorActive(competitor)}
                            data-testid={`badge-status-${competitor.id}`}
                          >
                            {competitor.isActive ? "Monitoring" : "Paused"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingCompetitor(competitor)}
                              data-testid={`button-edit-${competitor.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete ${competitor.name}?`)) {
                                  deleteCompetitorMutation.mutate(competitor.id);
                                }
                              }}
                              data-testid={`button-delete-${competitor.id}`}
                            >
                              <i className="fas fa-trash text-destructive"></i>
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
        <Dialog open={!!editingCompetitor} onOpenChange={(open) => !open && setEditingCompetitor(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Competitor</DialogTitle>
            </DialogHeader>
            {editingCompetitor && (
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-edit-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="url"
                            data-testid="input-edit-website"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value || ""}
                            data-testid="input-edit-address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="tel"
                            data-testid="input-edit-phone"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="distance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Distance (miles)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value || ""}
                            type="number"
                            step="0.1"
                            data-testid="input-edit-distance"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingCompetitor(null)}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={updateCompetitorMutation.isPending}
                      data-testid="button-submit-edit"
                    >
                      {updateCompetitorMutation.isPending ? "Updating..." : "Update Competitor"}
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
