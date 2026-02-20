import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  BarChart3,
  Search,
  DollarSign,
  TrendingUp,
  Shield,
  Leaf,
  ArrowRight,
  Zap,
  Globe,
} from "lucide-react";

const features = [
  {
    icon: CalendarDays,
    title: "Tee Time Management",
    description: "Advanced booking system with real-time availability tracking and Stripe payment processing",
    color: "from-emerald-500 to-teal-500",
    shadowColor: "shadow-emerald-500/20",
  },
  {
    icon: BarChart3,
    title: "Revenue Analytics",
    description: "Comprehensive analytics and reporting with interactive charts to maximize your course revenue",
    color: "from-blue-500 to-indigo-500",
    shadowColor: "shadow-blue-500/20",
  },
  {
    icon: Search,
    title: "Competitor Intelligence",
    description: "Track competitor pricing and market positioning to stay ahead in your local market",
    color: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/20",
  },
  {
    icon: DollarSign,
    title: "Dynamic Pricing",
    description: "Configurable pricing rules that automatically adjust based on demand, weather, and time",
    color: "from-amber-500 to-orange-500",
    shadowColor: "shadow-amber-500/20",
  },
  {
    icon: TrendingUp,
    title: "Demand Forecasting",
    description: "Baseline algorithms with user-adjustable caps to predict demand and optimize pricing",
    color: "from-lime-500 to-green-500",
    shadowColor: "shadow-lime-500/20",
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    description: "Secure authentication with admin, manager, and staff roles for your entire team",
    color: "from-cyan-500 to-blue-500",
    shadowColor: "shadow-cyan-500/20",
  },
];

const stats = [
  { label: "Revenue Increase", value: "23%", icon: TrendingUp },
  { label: "Dynamic Rules", value: "15+", icon: Zap },
  { label: "Booking Channels", value: "3", icon: Globe },
];

export default function Landing() {
  useDocumentTitle("Golf Course Revenue Management", "Maximize your golf course revenue with dynamic pricing, demand forecasting, competitor analysis, and booking management.");
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ClubHouseRM</span>
          </div>
          <Button
            size="sm"
            onClick={() => (window.location.href = "/api/login")}
            data-testid="button-login-nav"
          >
            Sign In
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-primary/5 dark:bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-accent/5 dark:bg-accent/10 blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary text-sm font-medium mb-6 animate-fade-in">
            <Zap className="w-3.5 h-3.5" />
            Revenue Management Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 animate-slide-up">
            Maximize your{" "}
            <span className="bg-gradient-to-r from-primary via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              golf course
            </span>{" "}
            revenue
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-slide-up" style={{ animationDelay: "100ms" }}>
            Dynamic pricing, demand forecasting, competitor analysis, and booking management — all in one powerful platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <Button
              size="lg"
              className="px-8 h-12 text-base shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300"
              onClick={() => (window.location.href = "/api/login")}
              data-testid="button-login"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-8 h-12 text-base"
            >
              View Demo
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 mt-14 animate-slide-up" style={{ animationDelay: "300ms" }}>
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-2xl font-bold">{stat.value}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Everything you need to optimize revenue
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From dynamic pricing to demand forecasting, manage every aspect of your golf course operations.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="group relative p-6 rounded-2xl border border-border bg-card hover:shadow-xl transition-all duration-500 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg ${feature.shadowColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-8 rounded-3xl border border-border bg-card shadow-xl">
            <h2 className="text-2xl font-bold mb-3">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">
              Join golf course operators who are already maximizing their revenue with ClubHouseRM.
            </p>
            <Button
              size="lg"
              className="px-10 h-12 text-base shadow-lg shadow-primary/25"
              onClick={() => (window.location.href = "/api/login")}
              data-testid="button-login-bottom"
            >
              Sign In to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">ClubHouseRM</span>
          </div>
          <p className="text-xs text-muted-foreground">Golf Course Revenue Management</p>
        </div>
      </footer>
    </div>
  );
}
