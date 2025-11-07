import { useAuth } from "@/hooks/useAuth";

interface TopBarProps {
  title: string;
  description: string;
}

export default function TopBar({ title, description }: TopBarProps) {
  const { user } = useAuth();

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

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-page-title">{title}</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">{description}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="relative p-2 text-muted-foreground hover:text-foreground" data-testid="button-notifications">
              <i className="fas fa-bell text-lg"></i>
              <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <span className="text-primary-foreground text-sm font-medium" data-testid="text-user-initials">
                {getInitials(user?.firstName, user?.lastName)}
              </span>
            </div>
            <div>
              <p className="font-medium text-sm" data-testid="text-user-name">
                {getDisplayName(user?.firstName, user?.lastName)}
              </p>
              <p className="text-xs text-muted-foreground" data-testid="text-user-role">
                {user?.role === "admin" ? "Administrator" :
                 user?.role === "manager" ? "Course Manager" :
                 user?.role === "staff" ? "Staff Member" : "User"}
              </p>
            </div>
            <button 
              className="text-muted-foreground hover:text-foreground"
              onClick={() => window.location.href = '/api/logout'}
              data-testid="button-logout"
            >
              <i className="fas fa-chevron-down text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
