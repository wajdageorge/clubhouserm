import { Link, useLocation } from "wouter";

export default function Sidebar() {
  const [location] = useLocation();

  const navigationItems = [
    { href: "/", icon: "fas fa-tachometer-alt", label: "Dashboard" },
    { href: "/tee-times", icon: "fas fa-calendar-alt", label: "Tee Times" },
    { href: "/customers", icon: "fas fa-users", label: "Customers" },
    { href: "/pricing", icon: "fas fa-dollar-sign", label: "Pricing" },
    { href: "/analytics", icon: "fas fa-chart-line", label: "Analytics" },
    { href: "/competitors", icon: "fas fa-search", label: "Competitors" },
    { href: "/settings", icon: "fas fa-cog", label: "Settings" }
  ];

  const courseManagementItems = [
    { href: "/course-details", icon: "fas fa-map-marker-alt", label: "Course Details" },
    { href: "/holes", icon: "fas fa-flag", label: "Hole Information" },
    { href: "/staff", icon: "fas fa-user-shield", label: "Staff Management" }
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex-shrink-0">
      <div className="p-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <i className="fas fa-golf-ball text-primary-foreground text-sm"></i>
          </div>
          <span className="font-semibold text-lg">ClubHouseRM</span>
        </div>
      </div>
      
      <nav className="px-4 pb-6">
        <div className="space-y-2">
          {navigationItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a 
                className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                  location === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <i className={`${item.icon} w-5`}></i>
                <span className={location === item.href ? "font-medium" : ""}>{item.label}</span>
              </a>
            </Link>
          ))}
        </div>
        
        <div className="mt-8">
          <h3 className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Course Management
          </h3>
          <div className="space-y-1">
            {courseManagementItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a 
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors ${
                    location === item.href
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`link-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <i className={`${item.icon} w-4`}></i>
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
