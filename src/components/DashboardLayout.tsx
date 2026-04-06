import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useTransactions } from "@/lib/transaction-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LogOut, BarChart3, LayoutDashboard, Lightbulb, Repeat, ShieldAlert, History, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Insights", path: "/insights", icon: Lightbulb },
  { label: "Recurring", path: "/recurring", icon: Repeat },
  { label: "Anomaly Detection", path: "/anomaly", icon: ShieldAlert },
  { label: "History", path: "/history", icon: History },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { selectedFileName, setSelectedId, uploads } = useTransactions();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">SmartSpend</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Welcome Back!
            </span>
            <Button variant="ghost" size="sm" onClick={logout} className="gap-2">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Nav tabs */}
      <nav className="border-b border-border bg-card/50">
        <div className="container mx-auto px-4 flex gap-1 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Selected file indicator */}
      {selectedFileName && (
        <div className="border-b border-border bg-primary/5">
          <div className="container mx-auto px-4 py-2 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Active file:</span>
            <Badge variant="secondary" className="gap-1">
              {selectedFileName}
              <button onClick={() => setSelectedId(null)} className="ml-1 hover:text-foreground transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Badge>
            {uploads.length > 1 && (
              <span className="text-xs text-muted-foreground">
                ({uploads.length} files uploaded)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <main className="container mx-auto p-4 space-y-6 pb-12">
        <Outlet />
      </main>
    </div>
  );
}