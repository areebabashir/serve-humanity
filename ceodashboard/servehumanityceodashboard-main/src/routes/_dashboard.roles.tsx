import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search, Shield, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  CEO_DASHBOARD_ROLES,
  FULL_ACCESS_ROLES,
  ORG_ROLE_LABEL,
  ROLE_MODULES,
  isFullAccessRole,
  type OrgRole,
} from "@/lib/roles";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/roles")({
  head: () => ({ meta: [{ title: "Roles & Permissions — Serve Humanity" }] }),
  component: RolesPage,
});

type BoardUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  systemRole: OrgRole;
  isActive?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
};

type ChapterOption = { _id: string; name: string; city?: string };

type ChapterMemberRow = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  chapterRole?: string;
  systemRole?: string;
  isActive?: boolean;
  lastLogin?: string | null;
  createdAt?: string;
  chapter?: { _id: string; name: string; city?: string } | null;
  teamDirector?: { name?: string; chapterRole?: string } | null;
  cabinetMember?: { name?: string; chapterRole?: string } | null;
  donationTotals?: {
    total: number;
    verified: number;
    pending: number;
    count: number;
  };
};

type MemberDonation = {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  teamDirector?: { name?: string; chapterRole?: string } | null;
};

type MemberDetail = {
  user: ChapterMemberRow;
  donations: MemberDonation[];
  donationTotals: {
    pending: number;
    verified: number;
    rejected: number;
    count: number;
    grandTotal: number;
  };
};

const MODULE_LABEL: Record<string, string> = {
  "*": "Full access",
  overview: "Overview",
  chapters: "Chapters",
  roles: "Roles",
  ops: "Verification & Ops",
  media: "Media",
  documentation: "Documentation",
  finance: "Finance",
  board: "Board",
  website: "Website",
  reports: "Reports",
  notifications: "Notifications",
  "warning-mail": "Warning Mail",
  settings: "Settings",
};

function modulesFor(role: OrgRole): string[] {
  const mods = ROLE_MODULES[role] ?? [];
  if (mods.includes("*")) return ["Full access"];
  return mods.map((m) => MODULE_LABEL[m] ?? m);
}

function relativeTime(iso?: string | null) {
  if (!iso) return "Never";
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const mins = Math.floor((Date.now() - t) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function fmtPKR(n: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(n || 0);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" });
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function roleLabel(role?: string) {
  if (!role) return "Member";
  return role
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function donationStatusClass(status: string) {
  if (status === "verified") {
    return "bg-[color:var(--success)]/15 text-[color:var(--success)] border-0";
  }
  if (status === "rejected") {
    return "bg-destructive/10 text-destructive border-0";
  }
  return "bg-muted text-muted-foreground border-0";
}

function RolesPage() {
  const { user } = useAuth();
  const canDeleteMembers = isFullAccessRole(user?.systemRole);
  const [tab, setTab] = useState("board");

  const [members, setMembers] = useState<BoardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [chapterFilter, setChapterFilter] = useState("all");
  const [chapterQ, setChapterQ] = useState("");
  const [chapterMembers, setChapterMembers] = useState<ChapterMemberRow[]>([]);
  const [chapterLoading, setChapterLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState<MemberDetail | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: BoardUser[] }>("/users/board");
      setMembers(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load users");
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadChapterMembers = useCallback(async () => {
    setChapterLoading(true);
    try {
      const params = new URLSearchParams();
      if (chapterFilter && chapterFilter !== "all") params.set("chapter", chapterFilter);
      if (chapterQ.trim()) params.set("q", chapterQ.trim());
      const qs = params.toString();
      const res = await api<{ success: true; data: ChapterMemberRow[] }>(
        `/users/chapter-members${qs ? `?${qs}` : ""}`,
      );
      setChapterMembers(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load chapter members");
      setChapterMembers([]);
    } finally {
      setChapterLoading(false);
    }
  }, [chapterFilter, chapterQ]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ success: true; data: ChapterOption[] }>("/chapters");
        setChapters(res.data || []);
      } catch {
        /* optional */
      }
    })();
  }, []);

  useEffect(() => {
    if (tab !== "chapter") return;
    const t = window.setTimeout(() => void loadChapterMembers(), 250);
    return () => window.clearTimeout(t);
  }, [tab, loadChapterMembers]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members.filter((m) => {
      if (roleFilter !== "all" && m.systemRole !== roleFilter) return false;
      if (!needle) return true;
      return (
        m.name.toLowerCase().includes(needle) ||
        m.email.toLowerCase().includes(needle) ||
        (ORG_ROLE_LABEL[m.systemRole] || m.systemRole).toLowerCase().includes(needle)
      );
    });
  }, [members, q, roleFilter]);

  const counts = useMemo(() => {
    const active = members.filter((m) => m.isActive !== false).length;
    const leadership = members.filter((m) => isFullAccessRole(m.systemRole)).length;
    const bog = members.length - leadership;
    return { total: members.length, active, leadership, bog };
  }, [members]);

  async function openMember(userId: string) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api<{ success: true; data: MemberDetail }>(
        `/users/${userId}/chapter-detail`,
      );
      setDetail(res.data);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load member");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function deleteChapterMember(m: ChapterMemberRow) {
    if (
      !window.confirm(
        `Delete account for ${m.name}${m.email ? ` (${m.email})` : ""}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingId(m._id);
    try {
      await api(`/users/${m._id}`, { method: "DELETE" });
      toast.success("Account deleted");
      if (detail?.user?._id === m._id) {
        setDetailOpen(false);
        setDetail(null);
      }
      await loadChapterMembers();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  }

  const detailUser = detail?.user;

  return (
    <PageShell>
      <PageHeader
        title="Roles & Permissions"
        description="CEO / Board accounts and chapter members. Click a chapter member name for profile and donations."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (tab === "chapter") void loadChapterMembers();
                else void load();
              }}
              disabled={tab === "chapter" ? chapterLoading : loading}
            >
              {(tab === "chapter" ? chapterLoading : loading) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
            <Button asChild variant="secondary">
              <Link to="/board">Manage accounts</Link>
            </Button>
          </div>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="board">CEO / Board</TabsTrigger>
          <TabsTrigger value="chapter">Chapter members</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Total accounts", value: counts.total },
              { label: "Active", value: counts.active },
              { label: "Leadership", value: counts.leadership },
              { label: "BOG seats", value: counts.bog },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-border bg-card px-4 py-3 shadow-[var(--shadow-card)]"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search name, email, role…"
                    className="h-9 pl-8"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-9 w-full bg-background sm:w-[200px]">
                    <SelectValue placeholder="Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {CEO_DASHBOARD_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ORG_ROLE_LABEL[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
                {loading ? (
                  <div className="flex items-center gap-2 p-10 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading live accounts…
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="p-10 text-center text-sm text-muted-foreground">
                    No accounts match this filter.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last login</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((m) => (
                        <TableRow key={m._id}>
                          <TableCell>
                            <div className="font-medium">{m.name}</div>
                            <div className="text-xs text-muted-foreground">{m.email}</div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={isFullAccessRole(m.systemRole) ? "default" : "secondary"}
                            >
                              {ORG_ROLE_LABEL[m.systemRole] ?? m.systemRole}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex max-w-[220px] flex-wrap gap-1">
                              {modulesFor(m.systemRole).slice(0, 4).map((label) => (
                                <Badge key={label} variant="outline" className="font-normal">
                                  {label}
                                </Badge>
                              ))}
                              {modulesFor(m.systemRole).length > 4 ? (
                                <Badge variant="outline" className="font-normal">
                                  +{modulesFor(m.systemRole).length - 4}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            {m.isActive === false ? (
                              <Badge variant="outline">Inactive</Badge>
                            ) : (
                              <Badge
                                className="border-0 bg-[color:var(--success)]/15 text-[color:var(--success)]"
                                variant="secondary"
                              >
                                Active
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {relativeTime(m.lastLogin)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Shield className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Role access</h2>
                  <p className="text-xs text-muted-foreground">What each role can open</p>
                </div>
              </div>
              <ul className="space-y-3">
                {CEO_DASHBOARD_ROLES.map((role) => (
                  <li
                    key={role}
                    className={cn(
                      "rounded-lg border border-border/70 p-3",
                      FULL_ACCESS_ROLES.includes(role) && "bg-primary/[0.03]",
                    )}
                  >
                    <p className="text-sm font-medium">{ORG_ROLE_LABEL[role]}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {modulesFor(role).map((label) => (
                        <Badge key={label} variant="secondary" className="font-normal">
                          {label}
                        </Badge>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Permissions are fixed by role. Create or remove accounts on{" "}
                <Link to="/board" className="font-medium text-primary hover:underline">
                  Board & Governance
                </Link>
                .
              </p>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="chapter" className="mt-4 space-y-4">
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-end">
              <div className="grid w-full max-w-xs gap-1.5">
                <Label>Chapter</Label>
                <Select value={chapterFilter} onValueChange={setChapterFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All chapters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All chapters</SelectItem>
                    {chapters.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                        {c.city ? ` · ${c.city}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative w-full max-w-sm flex-1">
                <Label className="mb-1.5 block">Search</Label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={chapterQ}
                    onChange={(e) => setChapterQ(e.target.value)}
                    placeholder="Search name, email, phone…"
                    className="pl-9"
                  />
                </div>
              </div>
              <p className="pb-2 text-xs text-muted-foreground sm:ml-auto">
                {chapterLoading
                  ? "Loading…"
                  : `${chapterMembers.length} member${chapterMembers.length === 1 ? "" : "s"}`}
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Director team</TableHead>
                  <TableHead className="text-right">Donations</TableHead>
                  <TableHead>Status</TableHead>
                  {canDeleteMembers ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {chapterLoading ? (
                  <TableRow>
                    <TableCell colSpan={canDeleteMembers ? 7 : 6} className="text-muted-foreground">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading members…
                    </TableCell>
                  </TableRow>
                ) : chapterMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canDeleteMembers ? 7 : 6} className="text-muted-foreground">
                      No members found for this filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  chapterMembers.map((m) => (
                    <TableRow key={m._id} className="hover:bg-muted/40">
                      <TableCell>
                        <Button
                          variant="link"
                          className="h-auto p-0 font-medium text-primary"
                          onClick={() => void openMember(m._id)}
                        >
                          {m.name}
                        </Button>
                        <div className="text-xs text-muted-foreground">{m.email || "—"}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{m.chapter?.name || "—"}</div>
                        <div className="text-xs text-muted-foreground">{m.chapter?.city || ""}</div>
                      </TableCell>
                      <TableCell>{roleLabel(m.chapterRole || m.systemRole)}</TableCell>
                      <TableCell>{m.teamDirector?.name || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-medium">{fmtPKR(m.donationTotals?.total || 0)}</div>
                        <div className="text-xs text-muted-foreground">
                          {m.donationTotals?.count || 0} entries
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {m.isActive === false ? "Inactive" : "Active"}
                        </Badge>
                      </TableCell>
                      {canDeleteMembers ? (
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            disabled={deletingId === m._id}
                            onClick={() => void deleteChapterMember(m)}
                          >
                            {deletingId === m._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Delete
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{detailUser?.name || "Member details"}</SheetTitle>
            <SheetDescription>
              {detailUser?.chapter
                ? `${detailUser.chapter.name}${detailUser.chapter.city ? ` · ${detailUser.chapter.city}` : ""}`
                : "Profile and team donations"}
            </SheetDescription>
          </SheetHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading member…
            </div>
          ) : detail && detailUser ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total donated</p>
                  <p className="mt-1 text-lg font-semibold">
                    {fmtPKR(detail.donationTotals.grandTotal)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Verified</p>
                  <p className="mt-1 text-lg font-semibold">
                    {fmtPKR(detail.donationTotals.verified)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="mt-1 text-lg font-semibold">
                    {fmtPKR(detail.donationTotals.pending)}
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4 space-y-3">
                <h3 className="text-sm font-medium">Profile</h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{detailUser.email || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{detailUser.phone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="font-medium">
                      {roleLabel(detailUser.chapterRole || detailUser.systemRole)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Account</p>
                    <p className="font-medium">
                      {detailUser.isActive === false ? "Inactive" : "Active"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cabinet</p>
                    <p className="font-medium">{detailUser.cabinetMember?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Director team</p>
                    <p className="font-medium">{detailUser.teamDirector?.name || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Last login</p>
                    <p className="font-medium">{formatDateTime(detailUser.lastLogin)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="font-medium">{formatDate(detailUser.createdAt)}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-border">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-sm font-medium">
                    Donations ({detail.donationTotals.count})
                  </h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Team</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detail.donations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No team donations recorded for this member.
                        </TableCell>
                      </TableRow>
                    ) : (
                      detail.donations.map((d) => (
                        <TableRow key={d._id}>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(d.createdAt)}
                          </TableCell>
                          <TableCell className="font-medium">{fmtPKR(d.amount)}</TableCell>
                          <TableCell>
                            <Badge className={donationStatusClass(d.status)}>{d.status}</Badge>
                          </TableCell>
                          <TableCell>{d.teamDirector?.name || "Own collection"}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </PageShell>
  );
}
