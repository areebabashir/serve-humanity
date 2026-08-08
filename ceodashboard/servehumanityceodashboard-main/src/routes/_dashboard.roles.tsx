import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, Search, Shield } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiRequestError } from "@/lib/api";
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

function RolesPage() {
  const [members, setMembers] = useState<BoardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");

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

  useEffect(() => {
    void load();
  }, [load]);

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

  return (
    <PageShell>
      <PageHeader
        title="Roles & Permissions"
        description="Live CEO dashboard accounts and what each role can open."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            <Button asChild variant="secondary">
              <Link to="/board">Manage accounts</Link>
            </Button>
          </div>
        }
      />

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
    </PageShell>
  );
}
