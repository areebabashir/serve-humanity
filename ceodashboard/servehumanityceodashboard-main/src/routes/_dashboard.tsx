import { createFileRoute, Outlet, useRouterState, Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, ChevronRight, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
import {
  fetchInbox,
  fetchUnreadCount,
  type InboxNotification,
} from "@/lib/notifications";

export const Route = createFileRoute("/_dashboard")({
  component: DashboardLayout,
});

const routeLabels: Record<string, string> = {
  "": "Overview",
  chapters: "Chapters",
  roles: "Roles & Permissions",
  verification: "Verification",
  operations: "Ration Cases Status File",
  ops: "Operations & Verification",
  media: "Media & Graphics",
  "case-files": "Ref File",
  documentation: "Documentation",
  cases: "All Cases",
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
  it: "IT Management",
  "it-board-messages": "IT — Board messages",
  "it-chapter-messages": "IT — Chapter messages",
  "contact-it": "Contact IT",
  reports: "Reports & Analytics",
  notifications: "Notifications",
  "warning-mail": "Warning Mail",
  reviews: "Reviews",
  "contact-messages": "Contact Messages",
  newsletter: "Newsletter",
  "website-events": "Website Events",
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

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function DashboardLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const [bellItems, setBellItems] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshBell = useCallback(async () => {
    try {
      const [items, count] = await Promise.all([fetchInbox(), fetchUnreadCount()]);
      setBellItems(items.slice(0, 5));
      setUnreadCount(count);
    } catch {
      // Keep last known state if API fails (e.g. offline)
    }
  }, []);

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

  useEffect(() => {
    if (!user || !isCeoDashboardRole(user.systemRole)) return;
    void refreshBell();
    const id = window.setInterval(() => void refreshBell(), 60_000);
    return () => window.clearInterval(id);
  }, [user, refreshBell]);

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
              <DropdownMenu onOpenChange={(open) => { if (open) void refreshBell(); }}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unreadCount > 0 && (
                      <span className="text-xs font-normal text-muted-foreground">
                        {unreadCount} unread
                      </span>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {bellItems.length === 0 ? (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No notifications yet
                    </div>
                  ) : (
                    bellItems.map((n) => (
                      <DropdownMenuItem key={n._id} asChild className="flex-col items-start gap-0.5">
                        <Link to="/notifications">
                          <span className={`text-sm ${n.readAt ? "text-muted-foreground" : "font-medium"}`}>
                            {n.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {n.createdBy?.name ?? "Leadership"} · {relativeTime(n.createdAt)}
                          </span>
                        </Link>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/notifications" className="justify-center text-sm font-medium">
                      View all
                    </Link>
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
                  {canAccessModule(role, "notifications") && (
                    <DropdownMenuItem asChild>
                      <Link to="/notifications">Notifications</Link>
                    </DropdownMenuItem>
                  )}
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
