import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Plus,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ORG_ROLE_LABEL, type OrgRole } from "@/lib/roles";

export const Route = createFileRoute("/_dashboard/it")({
  head: () => ({ meta: [{ title: "IT Management — Serve Humanity" }] }),
  component: ItManagementPage,
});

type ItAccount = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  systemRole?: string;
  chapterRole?: string;
  isActive?: boolean;
  lastLogin?: string | null;
  passwordChangedAt?: string | null;
  membershipStatus?: string;
  createdAt?: string;
  chapter?: { _id: string; name?: string; city?: string } | string | null;
};

type ChapterOpt = { _id: string; name: string; city?: string };
type StatusFilter = "all" | "active" | "inactive" | "never_login";

const BOARD_SEATS: OrgRole[] = [
  "bog_verification",
  "bog_operations",
  "bog_media",
  "bog_finance",
  "bog_documentation",
  "bog_it",
];

function roleLabel(u: ItAccount) {
  if (u.systemRole && ORG_ROLE_LABEL[u.systemRole as OrgRole]) {
    return ORG_ROLE_LABEL[u.systemRole as OrgRole];
  }
  if (u.chapterRole) return u.chapterRole.replace(/_/g, " ");
  return u.systemRole || "—";
}

function chapterLabel(chapter: ItAccount["chapter"]) {
  if (!chapter) return "—";
  if (typeof chapter === "string") return chapter;
  return chapter.name || "—";
}

function formatWhen(value?: string | null) {
  if (!value) return "Never";
  try {
    return new Date(value).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function generateTempPassword(length = 12) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function ItManagementPage() {
  const { user } = useAuth();

  const [rows, setRows] = useState<ItAccount[]>([]);
  const [chapters, setChapters] = useState<ChapterOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [revealedPassword, setRevealedPassword] = useState<{
    email: string;
    password: string;
    title: string;
  } | null>(null);
  const [resetTarget, setResetTarget] = useState<ItAccount | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [editTarget, setEditTarget] = useState<ItAccount | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [editBusy, setEditBusy] = useState(false);

  const [form, setForm] = useState({
    accountKind: "member" as "member" | "board",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    chapter: "",
    systemRole: "bog_it" as OrgRole,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (chapterFilter && chapterFilter !== "all") params.set("chapter", chapterFilter);
      const qs = params.toString() ? `?${params.toString()}` : "";
      const res = await api<{ success: true; data: ItAccount[] }>(`/it/accounts${qs}`);
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [q, chapterFilter]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 200);
    return () => window.clearTimeout(t);
  }, [load]);

  useEffect(() => {
    void api<{ success: true; data: ChapterOpt[] }>("/it/chapters")
      .then((res) => setChapters(res.data || []))
      .catch(() => setChapters([]));
  }, []);

  const stats = useMemo(() => {
    const active = rows.filter((r) => r.isActive !== false).length;
    const inactive = rows.length - active;
    const neverLogin = rows.filter((r) => !r.lastLogin).length;
    const recentPw = rows.filter((r) => {
      if (!r.passwordChangedAt) return false;
      const age = Date.now() - new Date(r.passwordChangedAt).getTime();
      return age < 30 * 24 * 60 * 60 * 1000;
    }).length;
    return { active, inactive, neverLogin, recentPw, total: rows.length };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "active") return rows.filter((r) => r.isActive !== false);
    if (statusFilter === "inactive") return rows.filter((r) => r.isActive === false);
    if (statusFilter === "never_login") return rows.filter((r) => !r.lastLogin);
    return rows;
  }, [rows, statusFilter]);

  function fillGeneratedPassword(target: "create" | "reset") {
    const pw = generateTempPassword();
    if (target === "create") {
      setForm((f) => ({ ...f, password: pw, confirmPassword: pw }));
      setShowPassword(true);
    } else {
      setResetPassword(pw);
      setResetConfirm(pw);
      setShowResetPassword(true);
    }
    toast.success("Generated a temporary password — copy it after saving");
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      toast.error("Name, email, and password are required");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.accountKind === "member" && !form.chapter) {
      toast.error("Pick a chapter for the member account");
      return;
    }
    setSaving(true);
    try {
      const body =
        form.accountKind === "board"
          ? {
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              phone: form.phone.trim() || undefined,
              systemRole: form.systemRole,
            }
          : {
              name: form.name.trim(),
              email: form.email.trim(),
              password: form.password,
              phone: form.phone.trim() || undefined,
              chapter: form.chapter,
              chapterRole: "member",
            };
      const res = await api<{
        success: true;
        temporaryPassword?: string;
        data: ItAccount;
      }>("/it/accounts", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setCreateOpen(false);
      setForm({
        accountKind: "member",
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        chapter: "",
        systemRole: "bog_it",
      });
      setShowPassword(false);
      setRevealedPassword({
        email: res.data.email,
        password: res.temporaryPassword || form.password,
        title: "Account created — share this password now",
      });
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmReset() {
    if (!resetTarget) return;
    if (resetPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (resetPassword !== resetConfirm) {
      toast.error("Passwords do not match");
      return;
    }
    setResetBusy(true);
    try {
      const res = await api<{ success: true; temporaryPassword: string }>(
        `/it/accounts/${resetTarget._id}/reset-password`,
        {
          method: "PATCH",
          body: JSON.stringify({ password: resetPassword }),
        },
      );
      setRevealedPassword({
        email: resetTarget.email,
        password: res.temporaryPassword,
        title: "Password reset — share it now",
      });
      setResetTarget(null);
      setResetPassword("");
      setResetConfirm("");
      toast.success("Password reset");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Reset failed");
    } finally {
      setResetBusy(false);
    }
  }

  async function toggleActive(row: ItAccount, isActive: boolean) {
    try {
      await api(`/it/accounts/${row._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setRows((prev) => prev.map((r) => (r._id === row._id ? { ...r, isActive } : r)));
      toast.success(isActive ? "Account activated" : "Account deactivated");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    setEditBusy(true);
    try {
      const res = await api<{ success: true; data: ItAccount }>(`/it/accounts/${editTarget._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: editForm.name.trim(),
          email: editForm.email.trim().toLowerCase(),
          phone: editForm.phone.trim(),
        }),
      });
      setRows((prev) => prev.map((r) => (r._id === editTarget._id ? { ...r, ...res.data } : r)));
      setEditTarget(null);
      toast.success("Account updated");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setEditBusy(false);
    }
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="IT Management"
        description="Single org desk for CEO / Board and every chapter: create accounts, reset passwords (shown once), activate/deactivate, and track last login / password changes."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4" />
                Create account
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={onCreate}>
                <DialogHeader>
                  <DialogTitle>Create account</DialogTitle>
                  <DialogDescription>
                    Board seat or any chapter member. Temporary password is shown once — share it securely.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  <div className="grid gap-1.5">
                    <Label>Account type</Label>
                    <Select
                      value={form.accountKind}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, accountKind: v as "member" | "board" }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="member">Chapter member</SelectItem>
                        <SelectItem value="board">Board / BOG seat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Full name</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Email (login)</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      required
                    />
                  </div>
                  {form.accountKind === "board" ? (
                    <div className="grid gap-1.5">
                      <Label>Board role</Label>
                      <Select
                        value={form.systemRole}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, systemRole: v as OrgRole }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BOARD_SEATS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ORG_ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="grid gap-1.5">
                      <Label>Chapter</Label>
                      <Select
                        value={form.chapter}
                        onValueChange={(v) => setForm((f) => ({ ...f, chapter: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select chapter" />
                        </SelectTrigger>
                        <SelectContent>
                          {chapters.map((c) => (
                            <SelectItem key={c._id} value={c._id}>
                              {c.name}
                              {c.city ? ` · ${c.city}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="grid gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Label>Temporary password</Label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                          onClick={() => fillGeneratedPassword("create")}
                        >
                          <Sparkles className="h-3 w-3" />
                          Generate
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-3.5 w-3.5" />
                          ) : (
                            <Eye className="h-3.5 w-3.5" />
                          )}
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      minLength={6}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Confirm password</Label>
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                      }
                      minLength={6}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Phone (optional)</Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Create
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Active accounts
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.active}</p>
          <p className="text-xs text-muted-foreground">{stats.total} total</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            Inactive / locked
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.inactive}</p>
          <p className="text-xs text-muted-foreground">Deactivated logins</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            Never logged in
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.neverLogin}</p>
          <p className="text-xs text-muted-foreground">May need invite / reset</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3 shadow-[var(--shadow-card)]">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            Password changed (30d)
          </div>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{stats.recentPw}</p>
          <p className="text-xs text-muted-foreground">Recent resets / changes</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">IT desk checklist</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-5">
          <li>Share temporary passwords out-of-band (call / WhatsApp) — they are shown only once.</li>
          <li>Deactivate leavers immediately; do not delete history unless leadership asks.</li>
          <li>Use Generate for strong temps; ask users to change password after first login.</li>
          <li>Never store or ask for anyone&apos;s current password — only reset and re-share.</li>
          <li>This desk covers Board/BOG and all chapters — there is no separate chapter IT page.</li>
        </ul>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="grid min-w-[220px] flex-1 gap-1.5">
          <Label htmlFor="it-search">Search</Label>
          <Input
            id="it-search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, email, or phone"
          />
        </div>
        <div className="grid min-w-[180px] gap-1.5">
          <Label>Chapter</Label>
          <Select value={chapterFilter} onValueChange={setChapterFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All chapters + board</SelectItem>
              {chapters.map((c) => (
                <SelectItem key={c._id} value={c._id}>
                  {c.name}
                  {c.city ? ` · ${c.city}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid min-w-[160px] gap-1.5">
          <Label>Status filter</Label>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
              <SelectItem value="never_login">Never logged in</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="pb-2 text-sm text-muted-foreground">
          Showing {filteredRows.length} of {rows.length}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Password changed</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-muted-foreground">
                    No accounts found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-sm hover:underline"
                        onClick={() => void copyText(r.email)}
                        title="Copy email"
                      >
                        {r.email}
                        <Copy className="h-3 w-3 text-muted-foreground" />
                      </button>
                      <div className="text-xs text-muted-foreground">{r.phone || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{roleLabel(r)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{chapterLabel(r.chapter)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatWhen(r.lastLogin)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatWhen(r.passwordChangedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={r.isActive !== false}
                          onCheckedChange={(v) => void toggleActive(r, v)}
                          disabled={r._id === user?._id}
                        />
                        <span className="text-xs text-muted-foreground">
                          {r.isActive === false ? "Inactive" : "Active"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex flex-wrap justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditTarget(r);
                            setEditForm({
                              name: r.name,
                              email: r.email,
                              phone: r.phone || "",
                            });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={r._id === user?._id}
                          onClick={() => {
                            setResetTarget(r);
                            setResetPassword("");
                            setResetConfirm("");
                            setShowResetPassword(false);
                          }}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Reset password
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog
        open={!!resetTarget}
        onOpenChange={(v) => {
          if (!v) {
            setResetTarget(null);
            setShowResetPassword(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password?</AlertDialogTitle>
            <AlertDialogDescription>
              Set a new temporary password for {resetTarget?.name} ({resetTarget?.email}). Share it
              once — it cannot be viewed again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label>New password</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => fillGeneratedPassword("reset")}
                  >
                    <Sparkles className="h-3 w-3" />
                    Generate
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
                    onClick={() => setShowResetPassword((v) => !v)}
                  >
                    {showResetPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                    {showResetPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
              <Input
                type={showResetPassword ? "text" : "password"}
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-1.5">
              <Label>Confirm</Label>
              <Input
                type={showResetPassword ? "text" : "password"}
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                minLength={6}
                autoComplete="new-password"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resetBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={resetBusy}
              onClick={(e) => {
                e.preventDefault();
                void confirmReset();
              }}
            >
              {resetBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editTarget} onOpenChange={(v) => !v && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={saveEdit}>
            <DialogHeader>
              <DialogTitle>Edit account</DialogTitle>
              <DialogDescription>Update name, login email, or phone.</DialogDescription>
            </DialogHeader>
            <div className="mt-4 space-y-3">
              <div className="grid gap-1.5">
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label>Phone</Label>
                <Input
                  value={editForm.phone}
                  onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={editBusy}>
                {editBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!revealedPassword}
        onOpenChange={(v) => !v && setRevealedPassword(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{revealedPassword?.title || "Share password now"}</AlertDialogTitle>
            <AlertDialogDescription>
              This password will not be shown again. Copy and send it securely to the user.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {revealedPassword ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Email</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-medium"
                  onClick={() => void copyText(revealedPassword.email)}
                >
                  {revealedPassword.email}
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">Password</span>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 font-mono font-medium"
                  onClick={() => void copyText(revealedPassword.password)}
                >
                  {revealedPassword.password}
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setRevealedPassword(null)}>Done</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
