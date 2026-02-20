import { Link, useLocation } from "wouter";
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
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SheetClose } from "@/components/ui/sheet";

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

export default function MobileSidebar() {
  const [location] = useLocation();

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="p-5 border-b border-border">
        <Link href="/">
          <a className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-primary rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">ClubHouseRM</span>
          </a>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <SheetClose asChild key={item.href}>
                <Link href={item.href}>
                  <a
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </a>
                </Link>
              </SheetClose>
            );
          })}
        </div>

        <div className="mt-6">
          <h3 className="px-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
            Course Management
          </h3>
          <div className="space-y-1">
            {courseManagementItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              return (
                <SheetClose asChild key={item.href}>
                  <Link href={item.href}>
                    <a
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                </SheetClose>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
