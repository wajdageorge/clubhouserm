import { Link, useLocation } from "wouter";
import { useState } from "react";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DollarSign,
  BarChart3,
  Search,
  Settings,
  MapPin,
  Flag,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const navigationItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/tee-times", icon: CalendarDays, label: "Tee Times" },
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/pricing", icon: DollarSign, label: "Pricing" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/competitors", icon: Search, label: "Competitors" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const courseManagementItems = [
  { href: "/course-details", icon: MapPin, label: "Course Details" },
  { href: "/holes", icon: Flag, label: "Hole Information" },
  { href: "/staff", icon: ShieldCheck, label: "Staff Management" },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-card border-r border-border flex-shrink-0 transition-all duration-300 ease-in-out relative",
        collapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className={cn("p-4 border-b border-border", collapsed ? "px-3" : "px-5")}>
        <Link href="/">
          <a className="flex items-center gap-3 group" data-testid="link-logo">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md flex-shrink-0 group-hover:shadow-lg transition-shadow">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight animate-fade-in">ClubHouseRM</span>
            )}
          </a>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            const linkContent = (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-2"
                  )}
                  data-testid={`link-${item.label.toLowerCase().replace(/ /g, '-')}`}
                >
                  <Icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                  {!collapsed && <span>{item.label}</span>}
                </a>
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          })}
        </div>

        <div className="mt-6">
          {!collapsed && (
            <h3 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              Course Management
            </h3>
          )}
          {collapsed && <div className="border-t border-border my-3" />}
          <div className="space-y-1">
            {courseManagementItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              const linkContent = (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-2"
                    )}
                    data-testid={`link-${item.label.toLowerCase().replace(/ /g, '-')}`}
                  >
                    <Icon className={cn("flex-shrink-0", collapsed ? "w-5 h-5" : "w-4 h-4")} />
                    {!collapsed && <span>{item.label}</span>}
                  </a>
                </Link>
              );

              if (collapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right" sideOffset={8}>
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }
              return linkContent;
            })}
          </div>
        </div>
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shadow-sm z-10"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        data-testid="button-collapse-sidebar"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
}
