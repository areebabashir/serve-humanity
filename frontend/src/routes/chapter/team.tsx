import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import {
  CABINET_ASSIGNABLE_ROLES,
  CHAPTER_ROLE_LABEL,
  canAssignChapterRoles,
  canManageCabinetTeam,
  idOfRef,
  isCabinetRole,
  isOwnCollectionRole,
  isTeamDirectorRole,
  type ChapterRole,
} from "@/lib/chapterRoles";
import { api, ApiRequestError, type AuthUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
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

function roleLabel(role: string | undefined): string {
  if (!role) return CHAPTER_ROLE_LABEL.member;
  return CHAPTER_ROLE_LABEL[role as ChapterRole] || role;
}

function refId(u: AuthUser, key: "cabinetMember" | "teamDirector"): string {
  return idOfRef(u[key]) || "none";
}

const emptyForm = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  chapterRole: "operations_head" as ChapterRole,
};

export default function ChapterTeamPage() {
  const { user: me, refresh } = useAuth();
  const canAssign = canAssignChapterRoles(me);
  const isCabinet = canManageCabinetTeam(me);
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const cabinetMembers = useMemo(
    () => rows.filter((u) => isCabinetRole(u.chapterRole) && u.isActive !== false),
    [rows],
  );

  const myDirectors = useMemo(
    () =>
      rows.filter(
        (u) =>
          isTeamDirectorRole(u.chapterRole) &&
          idOfRef(u.cabinetMember) === me?._id &&
          u.isActive !== false,
      ),
    [rows, me?._id],
  );

  const takenRoles = useMemo(
    () =>
      new Set(
        rows
          .filter(
            (u) =>
              u.isActive !== false &&
              CABINET_ASSIGNABLE_ROLES.includes((u.chapterRole as ChapterRole) || "member"),
          )
          .map((u) => u.chapterRole as ChapterRole),
      ),
    [rows],
  );

  const availableRoles = useMemo(
    () => CABINET_ASSIGNABLE_ROLES.filter((r) => !takenRoles.has(r)),
    [takenRoles],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: AuthUser[] }>("/users?limit=200");
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeRole(userId: string, chapterRole: string) {
    if (userId === me?._id) {
      toast.error("You cannot change your own role.");
      return;
    }
    try {
      await api(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ chapterRole }),
      });
      toast.success("Role updated");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  async function changeCabinet(userId: string, cabinetMember: string) {
    try {
      await api(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          cabinetMember: cabinetMember === "none" ? null : cabinetMember,
        }),
      });
      toast.success("Cabinet assignment updated");
      await load();
      if (userId === me?._id) await refresh();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  async function changeDirector(userId: string, teamDirector: string) {
    try {
      await api(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          teamDirector: teamDirector === "none" ? null : teamDirector,
        }),
      });
      toast.success("Director assignment updated");
      await load();
      if (userId === me?._id) await refresh();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
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
    setSaving(true);
    try {
      if (isCabinet && !canAssign) {
        await api("/users/team-directors", {
          method: "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            phone: form.phone.trim() || undefined,
          }),
        });
        toast.success("Director account created — share the email and password with them");
      } else {
        await api("/users/chapter-directors", {
          method: "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            phone: form.phone.trim() || undefined,
            chapterRole: form.chapterRole,
          }),
        });
        toast.success("Account created — share the email and password with them");
      }
      setForm(emptyForm);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  const canCreate = canAssign ? availableRoles.length > 0 : isCabinet;
  const createLabel = canAssign ? "Add VP / cabinet" : "Add director";

  return (
    <div>
      <ChapterPageHeader
        title="Team & Roles"
        description={
          canAssign
            ? "Create Vice President and cabinet members. Assign registered members to a cabinet. Cabinet members then add directors and place members on those teams."
            : isCabinet
              ? "Add directors for your cabinet team, then assign your members to a director."
              : "Chapter login accounts and their roles."
        }
        actions={
          canCreate ? (
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (v && availableRoles[0]) {
                  setForm((f) => ({ ...f, chapterRole: availableRoles[0] }));
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="h-4 w-4" />
                  {createLabel}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md sm:rounded-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {canAssign ? "Add VP or cabinet member" : "Add director"}
                  </DialogTitle>
                  <DialogDescription>
                    {canAssign
                      ? "Creates a chapter login. One active seat per cabinet role."
                      : "Creates a director under your cabinet. Share the email and password with them."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={onCreate} className="space-y-3">
                  <div>
                    <Label htmlFor="dir-name">Full name</Label>
                    <Input
                      id="dir-name"
                      required
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dir-email">Email</Label>
                    <Input
                      id="dir-email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dir-phone">Phone (optional)</Label>
                    <Input
                      id="dir-phone"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                  {canAssign ? (
                    <div>
                      <Label>Role</Label>
                      <Select
                        value={form.chapterRole}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, chapterRole: v as ChapterRole }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {CHAPTER_ROLE_LABEL[r]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <div>
                    <Label htmlFor="dir-password">Password</Label>
                    <Input
                      id="dir-password"
                      type="password"
                      required
                      minLength={6}
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dir-confirm">Confirm password</Label>
                    <Input
                      id="dir-confirm"
                      type="password"
                      required
                      minLength={6}
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, confirmPassword: e.target.value }))
                      }
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={saving || (canAssign && availableRoles.length === 0)}>
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Creating…
                        </>
                      ) : (
                        "Create account"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />
      <ChapterCard className="overflow-x-auto p-0 md:p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Cabinet</TableHead>
              <TableHead>Director</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground">
                  No users found for this chapter.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((u) => {
                const isSelf = u._id === me?._id;
                const isTargetPresident =
                  u.systemRole === "president" || u.chapterRole === "president";
                const ownCollectionOnly =
                  isTargetPresident || isOwnCollectionRole(u.chapterRole);
                const canEditRole = canAssign && !isSelf && !isTargetPresident;
                const isMember =
                  u.chapterRole === "member" || u.chapterRole === "assistant_director";
                const canEditCabinet = canAssign && isMember;
                const inMyCabinet = idOfRef(u.cabinetMember) === me?._id;
                const canEditDirector = isCabinet && !canAssign && isMember && inMyCabinet;
                const current = (u.chapterRole as ChapterRole) || "member";
                const selectValue = CABINET_ASSIGNABLE_ROLES.includes(current)
                  ? current
                  : undefined;

                return (
                  <TableRow key={u._id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {isSelf ? (
                        <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                      ) : null}
                    </TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      {canEditRole ? (
                        <Select
                          value={selectValue}
                          onValueChange={(v) => void changeRole(u._id, v)}
                        >
                          <SelectTrigger className="w-[240px]">
                            <SelectValue placeholder={roleLabel(current)} />
                          </SelectTrigger>
                          <SelectContent>
                            {CABINET_ASSIGNABLE_ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {CHAPTER_ROLE_LABEL[r]}
                              </SelectItem>
                            ))}
                            {current !== "member" ? (
                              <SelectItem value="member">Remove role</SelectItem>
                            ) : null}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">
                          {roleLabel(u.chapterRole)}
                          {isSelf && canAssign ? (
                            <span className="ml-2 text-xs text-muted-foreground">— locked</span>
                          ) : null}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ownCollectionOnly || isCabinetRole(u.chapterRole) ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : isTeamDirectorRole(u.chapterRole) ? (
                        <span className="text-xs text-muted-foreground">
                          {typeof u.cabinetMember === "object" && u.cabinetMember?.name
                            ? u.cabinetMember.name
                            : "Your cabinet"}
                        </span>
                      ) : canEditCabinet ? (
                        <Select
                          value={refId(u, "cabinetMember")}
                          onValueChange={(v) => void changeCabinet(u._id, v)}
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Assign cabinet" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {cabinetMembers.map((c) => (
                              <SelectItem key={c._id} value={c._id}>
                                {c.name} · {roleLabel(c.chapterRole)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {typeof u.cabinetMember === "object" && u.cabinetMember?.name
                            ? u.cabinetMember.name
                            : "Unassigned"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ownCollectionOnly || isCabinetRole(u.chapterRole) ? (
                        <span className="text-xs text-muted-foreground">Own collection</span>
                      ) : isTeamDirectorRole(u.chapterRole) ? (
                        <span className="text-xs text-muted-foreground">Leads this team</span>
                      ) : canEditDirector ? (
                        <Select
                          value={refId(u, "teamDirector")}
                          onValueChange={(v) => void changeDirector(u._id, v)}
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Assign director" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {myDirectors.map((d) => (
                              <SelectItem key={d._id} value={d._id}>
                                {d.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {typeof u.teamDirector === "object" && u.teamDirector?.name
                            ? u.teamDirector.name
                            : "Unassigned"}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </ChapterCard>
    </div>
  );
}
