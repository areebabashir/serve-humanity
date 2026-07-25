import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import {
  canAssignChapterRoles,
  CHAPTER_ROLE_LABEL,
  DIRECTOR_ASSIGNABLE_ROLES,
  isOwnCollectionRole,
  isTeamHeadRole,
  type ChapterRole,
} from "@/lib/chapterRoles";
import { api, ApiRequestError, type AuthUser } from "@/lib/api";
import { useAuth } from "@/lib/auth";
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

function directorIdOf(u: AuthUser): string {
  if (!u.teamDirector) return "none";
  if (typeof u.teamDirector === "string") return u.teamDirector;
  return u.teamDirector._id || "none";
}

export default function ChapterTeamPage() {
  const { user: me, refresh } = useAuth();
  const canAssign = canAssignChapterRoles(me);
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);

  const directors = useMemo(
    () => rows.filter((u) => isTeamHeadRole(u.chapterRole)),
    [rows],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: AuthUser[] }>("/users?limit=100");
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

  async function changeTeamDirector(userId: string, teamDirector: string) {
    try {
      await api(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({
          teamDirector: teamDirector === "none" ? null : teamDirector,
        }),
      });
      toast.success("Team director updated");
      await load();
      if (userId === me?._id) await refresh();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  return (
    <div>
      <ChapterPageHeader
        title="Team & Roles"
        description={
          canAssign
            ? "Assign director roles and place members under a director team. President and VP have their own collection only — no team. You cannot change your own role."
            : "Chapter login accounts and their roles."
        }
      />
      <ChapterCard className="overflow-x-auto p-0 md:p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Director team</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground">
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
                const canEditDirector =
                  canAssign && !ownCollectionOnly && !isTeamHeadRole(u.chapterRole);
                const current = (u.chapterRole as ChapterRole) || "member";
                const selectValue = DIRECTOR_ASSIGNABLE_ROLES.includes(current)
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
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder={roleLabel(current)} />
                          </SelectTrigger>
                          <SelectContent>
                            {DIRECTOR_ASSIGNABLE_ROLES.map((r) => (
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
                      {ownCollectionOnly ? (
                        <span className="text-xs text-muted-foreground">Own collection</span>
                      ) : isTeamHeadRole(u.chapterRole) ? (
                        <span className="text-xs text-muted-foreground">Leads this team</span>
                      ) : canEditDirector ? (
                        <Select
                          value={directorIdOf(u)}
                          onValueChange={(v) => void changeTeamDirector(u._id, v)}
                        >
                          <SelectTrigger className="w-[220px]">
                            <SelectValue placeholder="Assign director" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Unassigned</SelectItem>
                            {directors.map((d) => (
                              <SelectItem key={d._id} value={d._id}>
                                {d.name} ({roleLabel(d.chapterRole)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="text-sm">
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
