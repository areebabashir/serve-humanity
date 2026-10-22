import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  ClipboardCheck,
  ClipboardList,
  Boxes,
  Image as ImageIcon,
  Globe,
  FileText,
  Wallet,
  Landmark,
  BarChart3,
  Settings,
  Bell,
  HeartHandshake,
  ChevronDown,
  FolderOpen,
  HeartPulse,
  Heart,
  GraduationCap,
  Package,
  CalendarDays,
  FileSpreadsheet,
  Truck,
  PieChart,
  Bookmark,
  Award,
  HandCoins,
  MessageSquareText,
  MessagesSquare,
  Calendar,
  Mail,
  AlertTriangle,
  MonitorCog,
  Headset,
  UsersRound,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth } from "@/lib/auth";
import {
  canAccessModule,
  ORG_ROLE_LABEL,
  isFullAccessRole,
  type OrgRole,
} from "@/lib/roles";
import { DOC_NAV, type DocNavItem } from "@/lib/documentation";
import { FINANCE_NAV, type FinanceNavItem } from "@/lib/finance";

const MEDIA_NAV = [
  { title: "Ref File", path: "/media/case-files", icon: FileSpreadsheet },
  { title: "Certificate Generator", path: "/media/certificate-generator", icon: Award },
] as const;

const OPS_NAV = [
  { title: "Verification", path: "/verification", icon: ClipboardCheck },
  { title: "Ration Cases Status File", path: "/operations", icon: Boxes },
] as const;

const items = [
  { title: "Overview", url: "/", module: "overview", icon: LayoutDashboard },
  { title: "Donate", url: "/donate", module: "donate", icon: HandCoins },
  { title: "Chapters", url: "/chapters", module: "chapters", icon: Building2 },
  { title: "Roles & Permissions", url: "/roles", module: "roles", icon: ShieldCheck },
  {
    title: "Operations & Verification",
    url: "/verification",
    module: "ops",
    icon: Boxes,
    hasOpsSub: true,
  },
  { title: "Media & Graphics", url: "/media/case-files", module: "media", icon: ImageIcon, hasMediaSub: true },
  { title: "Website", url: "/website", module: "website", icon: Globe },
  { title: "Website Events", url: "/website-events", module: "website", icon: Calendar },
  { title: "Reviews", url: "/reviews", module: "website", icon: MessageSquareText },
  { title: "Contact Messages", url: "/contact-messages", module: "website", icon: MessagesSquare },
  { title: "Newsletter", url: "/newsletter", module: "website", icon: Mail },
  { title: "Documentation", url: "/documentation", module: "documentation", icon: FileText, hasSub: true },
  { title: "Finance", url: "/finance", module: "finance", icon: Wallet, hasFinanceSub: true },
  { title: "Board & Governance", url: "/board", module: "board", icon: Landmark },
  { title: "IT Management", url: "/it", module: "it", icon: MonitorCog },
  {
    title: "IT — Board messages",
    url: "/it-board-messages",
    module: "it-messages",
    icon: MessagesSquare,
  },
  {
    title: "IT — Chapter messages",
    url: "/it-chapter-messages",
    module: "it-messages",
    icon: UsersRound,
  },
  { title: "Contact IT", url: "/contact-it", module: "contact-it", icon: Headset },
  { title: "Reports & Analytics", url: "/reports", module: "reports", icon: BarChart3 },
  { title: "Notifications", url: "/notifications", module: "notifications", icon: Bell },
  { title: "Warning Mail", url: "/warning-mail", module: "warning-mail", icon: AlertTriangle, fullAccessOnly: true },
  { title: "Settings", url: "/settings", module: "settings", icon: Settings },
];

const DOC_ICONS: Record<DocNavItem["type"], typeof FileText> = {
  hub: FolderOpen,
  cases: ClipboardList,
  health: HeartPulse,
  marriage: Heart,
  fee: GraduationCap,
  ration: Package,
  monthly_report: CalendarDays,
  ration_file: FileSpreadsheet,
  drive: Truck,
  stat: PieChart,
  reference: Bookmark,
};

const FINANCE_ICONS: Record<FinanceNavItem["type"], typeof Wallet> = {
  hub: Wallet,
  monthly_donation: HandCoins,
  case: FileSpreadsheet,
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function isDocPathActive(path: string, pathname: string) {
  if (path === "/documentation") return pathname === "/documentation";
  return pathname === path || pathname.startsWith(path + "/");
}

function isMediaPathActive(path: string, pathname: string) {
  return pathname === path || pathname.startsWith(path + "/");
}

function isOpsPathActive(path: string, pathname: string) {
  return pathname === path || pathname.startsWith(path + "/");
}

function isFinancePathActive(path: string, pathname: string) {
  if (path === "/finance") return pathname === "/finance" || pathname === "/finance/";
  return pathname === path || pathname.startsWith(path + "/");
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user } = useAuth();
  const role = (user?.systemRole ?? "ceo") as OrgRole;
  const docsOpenDefault = pathname.startsWith("/documentation");
  const mediaOpenDefault = pathname.startsWith("/media");
  const financeOpenDefault = pathname.startsWith("/finance");
  const opsOpenDefault = pathname.startsWith("/verification") || pathname.startsWith("/operations");
  const [docsOpen, setDocsOpen] = useState(docsOpenDefault);
  const [mediaOpen, setMediaOpen] = useState(mediaOpenDefault);
  const [financeOpen, setFinanceOpen] = useState(financeOpenDefault);
  const [opsOpen, setOpsOpen] = useState(opsOpenDefault);

  /** CEO keeps Documentation/Finance as dropdowns; BOG sees each page separately */
  const docsAsDropdown = isFullAccessRole(role);
  const financeAsDropdown = isFullAccessRole(role);

  const isActive = (url: string) =>
    url === "/" ? pathname === "/" : pathname === url || pathname.startsWith(url + "/");
  const visibleItems = items.filter((item) => {
    if (!canAccessModule(role, item.module)) return false;
    if ("fullAccessOnly" in item && item.fullAccessOnly && !isFullAccessRole(role)) return false;
    return true;
  });
  const showDocs = canAccessModule(role, "documentation");
  const showMedia = canAccessModule(role, "media");
  const showFinance = canAccessModule(role, "finance");
  const showOps = canAccessModule(role, "ops");

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-3 px-2 py-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-sm"
            style={{ background: "var(--gradient-brand)" }}
          >
            <HeartHandshake className="h-5 w-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Serve Humanity</span>
              <span className="text-[11px] text-muted-foreground">CEO / Board Dashboard</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel>Command Center</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                if ("hasOpsSub" in item && item.hasOpsSub) {
                  if (!showOps) return null;

                  if (!collapsed) {
                    return (
                      <Collapsible
                        key={item.url}
                        open={opsOpen}
                        onOpenChange={setOpsOpen}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={
                                pathname.startsWith("/verification") ||
                                pathname.startsWith("/operations")
                              }
                              tooltip={item.title}
                              className="w-full"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {OPS_NAV.map((sub) => (
                                <SidebarMenuSubItem key={sub.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isOpsPathActive(sub.path, pathname)}
                                  >
                                    <Link to={sub.path}>{sub.title}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <div key="ops-flat" className="contents">
                      {OPS_NAV.map((sub) => (
                        <SidebarMenuItem key={sub.path}>
                          <SidebarMenuButton
                            asChild
                            isActive={isOpsPathActive(sub.path, pathname)}
                            tooltip={sub.title}
                          >
                            <Link to={sub.path} className="flex items-center gap-2">
                              <sub.icon className="h-4 w-4" />
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  );
                }

                if ("hasMediaSub" in item && item.hasMediaSub) {
                  if (!showMedia) return null;

                  if (!collapsed) {
                    return (
                      <Collapsible
                        key={item.url}
                        open={mediaOpen}
                        onOpenChange={setMediaOpen}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={pathname.startsWith("/media")}
                              tooltip={item.title}
                              className="w-full"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {MEDIA_NAV.map((sub) => (
                                <SidebarMenuSubItem key={sub.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isMediaPathActive(sub.path, pathname)}
                                  >
                                    <Link to={sub.path}>{sub.title}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <div key="media-flat" className="contents">
                      {MEDIA_NAV.map((sub) => (
                        <SidebarMenuItem key={sub.path}>
                          <SidebarMenuButton
                            asChild
                            isActive={isMediaPathActive(sub.path, pathname)}
                            tooltip={sub.title}
                          >
                            <Link to={sub.path} className="flex items-center gap-2">
                              <sub.icon className="h-4 w-4" />
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  );
                }

                if ("hasFinanceSub" in item && item.hasFinanceSub) {
                  if (!showFinance) return null;

                  if (financeAsDropdown && !collapsed) {
                    return (
                      <Collapsible
                        key={item.url}
                        open={financeOpen}
                        onOpenChange={setFinanceOpen}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={pathname.startsWith("/finance")}
                              tooltip={item.title}
                              className="w-full"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {FINANCE_NAV.map((sub) => (
                                <SidebarMenuSubItem key={sub.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isFinancePathActive(sub.path, pathname)}
                                  >
                                    <Link to={sub.path}>{sub.title}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <div key="finance-flat" className="contents">
                      {!collapsed && (
                        <div className="px-2 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Finance
                        </div>
                      )}
                      {FINANCE_NAV.map((sub) => {
                        const Icon = FINANCE_ICONS[sub.type] ?? Wallet;
                        return (
                          <SidebarMenuItem key={sub.path}>
                            <SidebarMenuButton
                              asChild
                              isActive={isFinancePathActive(sub.path, pathname)}
                              tooltip={sub.title}
                            >
                              <Link to={sub.path} className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {!collapsed && <span>{sub.title}</span>}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </div>
                  );
                }

                if (item.hasSub) {
                  if (!showDocs) return null;

                  if (docsAsDropdown && !collapsed) {
                    return (
                      <Collapsible
                        key={item.url}
                        open={docsOpen}
                        onOpenChange={setDocsOpen}
                        className="group/collapsible"
                      >
                        <SidebarMenuItem>
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={pathname.startsWith("/documentation")}
                              tooltip={item.title}
                              className="w-full"
                            >
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {DOC_NAV.map((sub) => (
                                <SidebarMenuSubItem key={sub.path}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isDocPathActive(sub.path, pathname)}
                                  >
                                    <Link to={sub.path}>{sub.title}</Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              ))}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </SidebarMenuItem>
                      </Collapsible>
                    );
                  }

                  return (
                    <div key="documentation-flat" className="contents">
                      {!collapsed && (
                        <div className="px-2 pb-1 pt-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          Documentation
                        </div>
                      )}
                      {DOC_NAV.map((sub) => {
                        const Icon = DOC_ICONS[sub.type] ?? FileText;
                        return (
                          <SidebarMenuItem key={sub.path}>
                            <SidebarMenuButton
                              asChild
                              isActive={isDocPathActive(sub.path, pathname)}
                              tooltip={sub.title}
                            >
                              <Link to={sub.path} className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {!collapsed && <span>{sub.title}</span>}
                              </Link>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
              {user ? getInitials(user.name) : "—"}
            </div>
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-medium truncate">{user?.name ?? "User"}</span>
              <span className="text-[11px] text-muted-foreground truncate">
                {ORG_ROLE_LABEL[role] ?? role}
              </span>
            </div>
          </div>
        ) : (
          <div className="mx-auto my-1 h-8 w-8 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-semibold">
            {user ? getInitials(user.name) : "—"}
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
