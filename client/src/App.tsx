import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import TeeTimes from "@/pages/tee-times";
import Customers from "@/pages/customers";
import Pricing from "@/pages/pricing";
import Analytics from "@/pages/analytics";
import Competitors from "@/pages/competitors";
import Settings from "@/pages/settings";
import CourseDetails from "@/pages/course-details";
import HoleInformation from "@/pages/holes";
import StaffManagement from "@/pages/staff";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Dashboard} />
          <Route path="/tee-times" component={TeeTimes} />
          <Route path="/customers" component={Customers} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/analytics" component={Analytics} />
          <Route path="/competitors" component={Competitors} />
          <Route path="/settings" component={Settings} />
          <Route path="/course-details" component={CourseDetails} />
          <Route path="/holes" component={HoleInformation} />
          <Route path="/staff" component={StaffManagement} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
