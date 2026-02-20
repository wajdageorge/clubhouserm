import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  User,
  Settings,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import MobileSidebar from "./mobile-sidebar";

interface TopBarProps {
  title: string;
  description: string;
}

export default function TopBar({ title, description }: TopBarProps) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return "U";
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
  };

  const getDisplayName = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) return `${firstName} ${lastName}`;
    if (firstName) return firstName;
    if (lastName) return lastName;
    return "User";
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin": return "Administrator";
      case "manager": return "Course Manager";
      case "staff": return "Staff Member";
      default: return "User";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-lg border-b border-border px-4 md:px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" data-testid="button-mobile-menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <MobileSidebar />
            </SheetContent>
          </Sheet>
          <div>
            <h1 className="text-xl font-bold tracking-tight" data-testid="text-page-title">{title}</h1>
            <p className="text-sm text-muted-foreground hidden sm:block" data-testid="text-page-description">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="h-[18px] w-[18px] transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-[18px] w-[18px] transition-transform hover:-rotate-12" />
            )}
          </Button>

          <Button variant="ghost" size="icon" className="relative rounded-full" aria-label="View notifications" data-testid="button-notifications">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-card"></span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 pl-2 pr-3 rounded-full h-9" data-testid="button-user-menu">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="text-xs font-semibold gradient-primary text-white">
                    {getInitials(user?.firstName, user?.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline" data-testid="text-user-name">
                  {getDisplayName(user?.firstName, user?.lastName)}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{getDisplayName(user?.firstName, user?.lastName)}</p>
                  <p className="text-xs text-muted-foreground" data-testid="text-user-role">{getRoleLabel(user?.role)}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = '/settings'} data-testid="menu-item-settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = '/settings'} data-testid="menu-item-profile">
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => window.location.href = '/api/logout'}
                className="text-destructive focus:text-destructive"
                data-testid="menu-item-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
