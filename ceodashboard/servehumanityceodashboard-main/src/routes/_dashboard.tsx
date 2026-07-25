import { createFileRoute, Outlet, useRouterState, Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, ChevronRight, Loader2 } from "lucide-react";
import { useEffect } from "react";

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth";
import {
  canAccessModule,
  isCeoDashboardRole,
  moduleFromPath,
  ROLE_HOME,
  type OrgRole,
} from "@/lib/roles";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

const routeLabels: Record<string, string> = {
  "": "Overview",
  chapters: "Chapters",
  roles: "Roles & Permissions",
  verification: "Verification",
  operations: "Operations",
  ops: "Operations & Verification",
  media: "Media & Graphics",
  documentation: "Documentation",
  health: "Health Cases",
  marriage: "Marriage Cases",
  fee: "Fee Cases",
  ration: "Ration Cases",
  "monthly-reports": "Monthly Reports",
  "ration-files": "Ration Case Files",
  drives: "Drive Files",
  stats: "Stat Files",
  references: "Reference Files",
  finance: "Finance",
  board: "Board & Governance",
  reports: "Reports & Analytics",
  settings: "Settings",
};

function Breadcrumbs() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const segments = pathname.split("/").filter(Boolean);
  return (
    <nav className="flex items-center gap-1 text-xs text-muted-foreground">
      <Link to="/" className="hover:text-foreground">Dashboard</Link>
      {segments.map((s, i) => (
        <span key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">{routeLabels[s] ?? s}</span>
        </span>
      ))}
    </nav>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user || !isCeoDashboardRole(user.systemRole)) {
      void navigate({ to: "/login" });
      return;
    }
    const role = user.systemRole as OrgRole;
    const mod = moduleFromPath(pathname);
    if (!canAccessModule(role, mod)) {
      void navigate({ to: ROLE_HOME[role] });
    }
  }, [user, loading, navigate, pathname]);

  if (loading || !user || !isCeoDashboardRole(user.systemRole)) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const role = user.systemRole as OrgRole;
  if (!canAccessModule(role, moduleFromPath(pathname))) {
    return (
      <div className="grid min-h-screen place-items-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur">
            <SidebarTrigger className="text-muted-foreground" />
            <div className="relative hidden max-w-md flex-1 md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search chapters, cases, members, donations…"
                className="h-9 pl-9 bg-background"
              />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <span className="text-sm">12 cases pending &gt; 7 days</span>
                    <span className="text-xs text-muted-foreground">Verification • just now</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <span className="text-sm">Large expense awaiting approval</span>
                    <span className="text-xs text-muted-foreground">Finance • 30m ago</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex-col items-start gap-0.5">
                    <span className="text-sm">New chapter proposal: Hyderabad</span>
                    <span className="text-xs text-muted-foreground">Board • 5h ago</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-muted transition">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(user.name)}
                    </span>
                    <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span>{user.name}</span>
                      <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {canAccessModule(role, "settings") && (
                    <DropdownMenuItem asChild>
                      <Link to="/settings">Settings</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => {
                      void logout().then(() => navigate({ to: "/login" }));
                    }}
                  >
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <div className="border-b border-border bg-card/40 px-6 py-2.5">
            <Breadcrumbs />
          </div>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
        <Toaster richColors position="top-right" />
      </div>
    </SidebarProvider>
  );
}
