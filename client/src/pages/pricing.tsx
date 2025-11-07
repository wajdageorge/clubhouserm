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
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertPricingRuleSchema, type PricingRule } from "@shared/schema";

const createPricingRuleSchema = insertPricingRuleSchema.omit({ courseId: true });

export default function Pricing() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);

  const createForm = useForm({
    resolver: zodResolver(createPricingRuleSchema),
    defaultValues: {
      name: "",
      description: "",
      ruleType: "time_based" as const,
      modifier: "1.00",
      conditions: {},
      isActive: true,
      priority: 1,
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

  const { data: pricingRules, isLoading: rulesLoading } = useQuery<PricingRule[]>({
    queryKey: ["/api/courses", user?.courseId, "pricing-rules"],
    enabled: !!user?.courseId,
  });

  const createRuleMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createPricingRuleSchema>) => {
      return await apiRequest(`/api/courses/${user?.courseId}/pricing-rules`, "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId, "pricing-rules"] });
      toast({
        title: "Success",
        description: "Pricing rule created successfully",
      });
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create pricing rule",
        variant: "destructive",
      });
    },
  });

  const updateRuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest(`/api/pricing-rules/${id}`, "PUT", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses", user?.courseId, "pricing-rules"] });
      toast({
        title: "Success",
        description: "Pricing rule updated successfully",
      });
      setEditingRule(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update pricing rule",
        variant: "destructive",
      });
    },
  });

  const toggleRuleActive = (rule: PricingRule) => {
    updateRuleMutation.mutate({
      id: rule.id,
      data: {
        isActive: !rule.isActive,
      },
    });
  };

  const onCreateSubmit = (values: z.infer<typeof createPricingRuleSchema>) => {
    createRuleMutation.mutate(values);
  };

  useEffect(() => {
    if (isCreateDialogOpen) {
      createForm.reset({
        name: "",
        description: "",
        ruleType: "time_based",
        modifier: "1.00",
        conditions: {},
        isActive: true,
        priority: 1,
      });
    }
  }, [isCreateDialogOpen, createForm]);

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
        <TopBar title="Pricing" description="Configure dynamic pricing rules and strategies" />
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-chart-1/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-dollar-sign text-chart-1 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Base Price</p>
                  <p className="text-2xl font-bold">$55</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-chart-2/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-chart-2 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Rules</p>
                  <p className="text-2xl font-bold">
                    {pricingRules?.filter(r => r.isActive).length || 0}
                  </p>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-chart-3/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-percentage text-chart-3 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Adjustment</p>
                  <p className="text-2xl font-bold">+12%</p>
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pricing Rules</CardTitle>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button data-testid="button-create-rule">
                      <i className="fas fa-plus mr-2"></i>
                      Create Rule
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Create New Pricing Rule</DialogTitle>
                    </DialogHeader>
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                        <FormField
                          control={createForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rule Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g., Weekend Premium"
                                  data-testid="input-create-name"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  value={field.value || ""}
                                  placeholder="Describe when this rule applies"
                                  data-testid="input-create-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="ruleType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Rule Type</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-create-rule-type">
                                    <SelectValue placeholder="Select rule type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="time_based">Time-Based</SelectItem>
                                  <SelectItem value="day_based">Day-Based</SelectItem>
                                  <SelectItem value="weather_based">Weather-Based</SelectItem>
                                  <SelectItem value="utilization_based">Utilization-Based</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={createForm.control}
                            name="modifier"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Price Modifier</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    placeholder="1.25 for +25%, 0.8 for -20%"
                                    data-testid="input-create-modifier"
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground mt-1">
                                  1.0 = no change, 1.25 = +25%, 0.8 = -20%
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="priority"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    data-testid="input-create-priority"
                                  />
                                </FormControl>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Lower number = higher priority
                                </p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="border-t pt-4">
                          <p className="text-sm font-medium mb-3">Rule Conditions (Optional)</p>
                          <p className="text-xs text-muted-foreground mb-3">
                            Note: Conditions should be managed through the backend API. This form creates rules with empty conditions by default.
                          </p>
                        </div>
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
                            disabled={createRuleMutation.isPending}
                            data-testid="button-submit-create"
                          >
                            {createRuleMutation.isPending ? "Creating..." : "Create Rule"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>

            <CardContent>
              {rulesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : !pricingRules || pricingRules.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-tags text-4xl text-muted-foreground mb-3"></i>
                  <p className="text-muted-foreground" data-testid="text-no-rules">
                    No pricing rules configured yet
                  </p>
                  <Button className="mt-4" onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-rule">
                    Create First Rule
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pricingRules.map((rule) => {
                    const modifierPercent = ((parseFloat(rule.modifier) - 1) * 100).toFixed(0);
                    const isIncrease = parseFloat(rule.modifier) > 1;
                    
                    return (
                      <Card key={rule.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold" data-testid={`text-rule-name-${rule.id}`}>
                                {rule.name}
                              </h3>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                rule.isActive 
                                  ? 'bg-chart-1/10 text-chart-1' 
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {rule.isActive ? 'Active' : 'Inactive'}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                isIncrease 
                                  ? 'bg-destructive/10 text-destructive' 
                                  : 'bg-chart-1/10 text-chart-1'
                              }`}>
                                {isIncrease ? '+' : ''}{modifierPercent}%
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground" data-testid={`text-rule-description-${rule.id}`}>
                              {rule.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-sm">
                              <span className="text-muted-foreground">
                                Type: <strong>{rule.ruleType.replace('_', ' ')}</strong>
                              </span>
                              <span className="text-muted-foreground">
                                Priority: <strong>{rule.priority}</strong>
                              </span>
                              <span className="text-muted-foreground">
                                Modifier: <strong>{rule.modifier}x</strong>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={() => toggleRuleActive(rule)}
                              data-testid={`switch-active-${rule.id}`}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingRule(rule)}
                              data-testid={`button-edit-${rule.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
