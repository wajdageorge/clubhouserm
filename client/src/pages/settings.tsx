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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertCourseSchema, type Course } from "@shared/schema";

const updateCourseSchema = insertCourseSchema.omit({ isActive: true });

export default function Settings() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("course");

  const courseForm = useForm({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: {
      name: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      website: "",
      holes: 18,
      par: 72,
      yardage: 0,
      rating: "",
      slope: 0,
      timezone: "America/New_York",
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

  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ["/api/courses", user?.courseId],
    enabled: !!user?.courseId,
  });

  useEffect(() => {
    if (course) {
      courseForm.reset({
        name: course.name,
        description: course.description || "",
        address: course.address || "",
        phone: course.phone || "",
        email: course.email || "",
        website: course.website || "",
        holes: course.holes,
        par: course.par,
        yardage: course.yardage || 0,
        rating: course.rating || "",
        slope: course.slope || 0,
        timezone: course.timezone,
      });
    }
  }, [course, courseForm]);

  const updateCourseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof updateCourseSchema>) => {
      return await apiRequest(`/api/courses/${user?.courseId}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId] });
      toast({
        title: "Success",
        description: "Course settings updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update course settings",
        variant: "destructive",
      });
    },
  });

  const onCourseSubmit = (values: z.infer<typeof updateCourseSchema>) => {
    updateCourseMutation.mutate(values);
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
        <TopBar title="Settings" description="Configure system settings and preferences" />
        
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="course" data-testid="tab-course">
                Course Profile
              </TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users">
                User Management
              </TabsTrigger>
              <TabsTrigger value="integrations" data-testid="tab-integrations">
                Integrations
              </TabsTrigger>
              <TabsTrigger value="notifications" data-testid="tab-notifications">
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="course">
              <Card>
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {courseLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : course ? (
                    <Form {...courseForm}>
                      <form onSubmit={courseForm.handleSubmit(onCourseSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={courseForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Course Name</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    data-testid="input-course-name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={courseForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    type="email"
                                    data-testid="input-course-email"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={courseForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={field.value || ""}
                                  rows={3}
                                  data-testid="input-course-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={courseForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Address</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={field.value || ""}
                                  rows={2}
                                  data-testid="input-course-address"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={courseForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    type="tel"
                                    data-testid="input-course-phone"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={courseForm.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    value={field.value || ""}
                                    type="url"
                                    data-testid="input-course-website"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="border-t pt-6">
                          <h3 className="font-semibold mb-4">Course Specifications</h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormField
                              control={courseForm.control}
                              name="holes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Number of Holes</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                      data-testid="input-course-holes"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={courseForm.control}
                              name="par"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Par</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                      data-testid="input-course-par"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={courseForm.control}
                              name="yardage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Yardage</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="number"
                                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                      data-testid="input-course-yardage"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            disabled={updateCourseMutation.isPending}
                            data-testid="button-save-course"
                          >
                            {updateCourseMutation.isPending ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No course profile found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>User Management</CardTitle>
                    <Button data-testid="button-add-user">
                      <i className="fas fa-plus mr-2"></i>
                      Add User
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <i className="fas fa-users text-4xl text-muted-foreground mb-3"></i>
                    <p className="text-muted-foreground">
                      User management features will be available here
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Manage staff roles, permissions, and access levels
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations">
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#6772E5] rounded-lg flex items-center justify-center">
                          <i className="fab fa-stripe text-white"></i>
                        </div>
                        <div>
                          <p className="font-medium">Stripe</p>
                          <p className="text-sm text-muted-foreground">Payment processing</p>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-chart-1">
                        Connected
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg opacity-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <i className="fas fa-cloud text-muted-foreground"></i>
                        </div>
                        <div>
                          <p className="font-medium">Weather API</p>
                          <p className="text-sm text-muted-foreground">Weather forecasting</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-border rounded-lg opacity-50">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                          <i className="fas fa-envelope text-muted-foreground"></i>
                        </div>
                        <div>
                          <p className="font-medium">Email Service</p>
                          <p className="text-sm text-muted-foreground">Customer notifications</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Connect
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Booking Confirmations</p>
                        <p className="text-sm text-muted-foreground">
                          Send email notifications for new bookings
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Pricing Alerts</p>
                        <p className="text-sm text-muted-foreground">
                          Notify when competitor prices change significantly
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Revenue Reports</p>
                        <p className="text-sm text-muted-foreground">
                          Weekly revenue and performance summaries
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Configure
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
