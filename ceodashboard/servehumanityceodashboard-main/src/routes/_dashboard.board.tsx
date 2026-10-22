import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/lib/auth";
import { api, ApiRequestError } from "@/lib/api";
import { ORG_ROLE_LABEL, isFullAccessRole, type OrgRole } from "@/lib/roles";

export const Route = createFileRoute("/_dashboard/board")({
  head: () => ({ meta: [{ title: "Board & Governance — Serve Humanity" }] }),
  component: BoardPage,
});

type BoardUser = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  systemRole: OrgRole;
  isActive?: boolean;
  createdAt?: string;
  lastLogin?: string | null;
};

const BOARD_CREATABLE_ROLES: OrgRole[] = [
  "founder",
  "cto",
  "coo",
  "bog_verification",
  "bog_operations",
  "bog_media",
  "bog_finance",
  "bog_documentation",
  "bog_it",
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  systemRole: "bog_verification" as OrgRole,
};

/** Full-access may delete any BOG seat. Founder may also delete CEO / CTO / COO / other Founders. */
function canDeleteMember(
  actorRole: OrgRole | undefined,
  target: BoardUser,
  selfId?: string,
) {
  if (!actorRole || !isFullAccessRole(actorRole)) return false;
  if (selfId && target._id === selfId) return false;
  if (!isFullAccessRole(target.systemRole)) return true; // any BOG
  return actorRole === "founder";
}

function BoardPage() {
  const { user } = useAuth();
  const canManage = isFullAccessRole(user?.systemRole);

  const [members, setMembers] = useState<BoardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: BoardUser[] }>("/users/board");
      setMembers(res.data);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load board members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

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
    setSaving(true);
    try {
      await api("/users/board", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone: form.phone.trim() || undefined,
          systemRole: form.systemRole,
        }),
      });
      toast.success("Account created — share the email and password with them");
      setForm(emptyForm);
      setShowPassword(false);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(member: BoardUser, isActive: boolean) {
    if (!canManage || isFullAccessRole(member.systemRole)) return;
    try {
      await api(`/users/${member._id}`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      setMembers((prev) => prev.map((m) => (m._id === member._id ? { ...m, isActive } : m)));
      toast.success(isActive ? "Account activated" : "Account deactivated");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api(`/users/${deleteId}`, { method: "DELETE" });
      toast.success("Account deleted");
      setDeleteId(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const takenRoles = new Set(
    members.filter((m) => m.isActive !== false).map((m) => m.systemRole),
  );
  const availableBogRoles = BOARD_CREATABLE_ROLES.filter((r) => !takenRoles.has(r));

  return (
    <PageShell>
      <PageHeader
        title="Board & Governance"
        description="CEO and Board of Governors accounts for the leadership dashboard."
        actions={
          canManage ? (
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (v && availableBogRoles[0]) {
                  setForm((f) => ({ ...f, systemRole: availableBogRoles[0] }));
                }
              }}
            >
              <DialogTrigger asChild>
                <Button disabled={availableBogRoles.length === 0}>
                  <UserPlus className="h-4 w-4" />
                  Add board account
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <form onSubmit={onCreate}>
                  <DialogHeader>
                    <DialogTitle>Create board account</DialogTitle>
                    <DialogDescription>
                      Create a login for Founder, CTO, COO, or a BOG seat. Full-access roles can open
                      every module; BOG roles keep their assigned modules.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="mt-4 space-y-3">
                    <div className="grid gap-1.5">
                      <Label htmlFor="bog-name">Full name</Label>
                      <Input
                        id="bog-name"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        placeholder="e.g. Amina Rashid"
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="bog-email">Email (login)</Label>
                      <Input
                        id="bog-email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="bog.verification@servehumanity.org"
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="bog-password">Login password</Label>
                        <button
                          type="button"
                          className="text-xs text-muted-foreground underline-offset-2 hover:underline"
                          onClick={() => setShowPassword((v) => !v)}
                        >
                          {showPassword ? "Hide" : "Show"}
                        </button>
                      </div>
                      <Input
                        id="bog-password"
                        type={showPassword ? "text" : "password"}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                        placeholder="Set a password (min. 6 characters)"
                        minLength={6}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="bog-password-confirm">Confirm password</Label>
                      <Input
                        id="bog-password-confirm"
                        type={showPassword ? "text" : "password"}
                        value={form.confirmPassword}
                        onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
                        placeholder="Re-enter password"
                        minLength={6}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label>Role</Label>
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
                          {availableBogRoles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ORG_ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="bog-phone">Phone (optional)</Label>
                      <Input
                        id="bog-phone"
                        value={form.phone}
                        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                        placeholder="+92 …"
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving || availableBogRoles.length === 0}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Create account
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {canManage && availableBogRoles.length === 0 && (
        <p className="text-sm text-muted-foreground">
          All board seats have active accounts. Deactivate or delete a BOG seat to add another.
        </p>
      )}

      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : members.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No board accounts yet. {canManage ? "Add a board account to get started." : ""}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                {canManage && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m) => (
                <TableRow key={m._id}>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>
                    <Badge variant={isFullAccessRole(m.systemRole) ? "default" : "secondary"}>
                      {ORG_ROLE_LABEL[m.systemRole] ?? m.systemRole}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{m.email}</div>
                    {m.phone ? (
                      <div className="text-xs text-muted-foreground">{m.phone}</div>
                    ) : null}
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
                  {canManage && (
                    <TableCell className="text-right">
                      {canDeleteMember(user?.systemRole as OrgRole | undefined, m, user?._id) ? (
                        <div className="flex items-center justify-end gap-3">
                          {!isFullAccessRole(m.systemRole) ? (
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={m.isActive !== false}
                                onCheckedChange={(v) => void toggleActive(m, v)}
                              />
                              <span className="text-xs text-muted-foreground">Active</span>
                            </div>
                          ) : null}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive"
                            onClick={() => setDeleteId(m._id)}
                            title={
                              isFullAccessRole(m.systemRole)
                                ? `Delete ${ORG_ROLE_LABEL[m.systemRole]}`
                                : "Delete"
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : isFullAccessRole(m.systemRole) ? (
                        <span className="text-xs text-muted-foreground">
                          {m._id === user?._id ? "You" : "Protected"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={(v) => !v && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete account?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes their login. They will no longer access the CEO dashboard.
              BOG seats can be recreated afterward; full-access seats can only be removed by the
              Founder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
