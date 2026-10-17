import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Eye, Loader2, Plus, Search, Trash2, UserCog } from "lucide-react";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
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
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { isFullAccessRole } from "@/lib/roles";
import { toast } from "sonner";

export const Route = createFileRoute("/_dashboard/chapters")({
  head: () => ({ meta: [{ title: "Chapters — Serve Humanity" }] }),
  component: ChaptersPage,
});

type ChapterPresident = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  systemRole?: string;
  chapterRole?: string;
  lastLogin?: string | null;
  isActive?: boolean;
} | null;

type ChapterRow = {
  _id: string;
  name: string;
  city: string;
  imageUrl?: string;
  president?: ChapterPresident | string;
  status: "active" | "inactive";
  established?: string | null;
  monthlyBudget?: number;
  budgetThreshold?: number;
  monthlySpent?: number;
  memberCount?: number;
  fundsRaised?: number;
  casesClosed?: number;
  totalEvents?: number;
  lastActivity?: string | null;
};

type TeamUser = {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  chapterRole?: string;
  systemRole?: string;
  isActive?: boolean;
  lastLogin?: string | null;
  teamDirector?: { _id: string; name: string; chapterRole?: string } | null;
  cabinetMember?: { _id?: string; name?: string; chapterRole?: string } | null;
};

type CaseRow = {
  _id: string;
  type?: string;
  title?: string;
  caseNumber?: string;
  caseStatus?: string;
  approvalStatus?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  fields?: Record<string, unknown>;
  createdBy?: { name?: string; email?: string; chapterRole?: string } | null;
};

type MonthDonation = {
  year: number;
  month: number;
  label: string;
  total: number;
  verified?: number;
  pending?: number;
  count: number;
};

type RecentDonation = {
  _id: string;
  amount: number;
  status: string;
  createdAt: string;
  donor?: { name?: string; email?: string; chapterRole?: string };
  teamDirector?: { name?: string; chapterRole?: string } | null;
};

type ChapterDetails = {
  chapter: ChapterRow;
  president: ChapterPresident;
  team: TeamUser[];
  cases?: CaseRow[];
  activeCases: number;
  casesClosed?: number;
  donationTotals: {
    pending: number;
    verified: number;
    rejected: number;
    count: number;
    grandTotal: number;
  };
  teamDonationsByMonth: MonthDonation[];
  publicDonationsByMonth: MonthDonation[];
  recentTeamDonations: RecentDonation[];
};

function caseTypeLabel(type?: string) {
  if (!type) return "—";
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function beneficiaryFromCase(c: CaseRow) {
  const f = c.fields || {};
  const name = f.beneficiaryName || f.patientName || f.applicantName || f.name;
  return typeof name === "string" && name.trim() ? name.trim() : "—";
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

function presidentLabel(president?: ChapterPresident | string) {
  if (!president) return "—";
  if (typeof president === "string") return president;
  return president.name || president.email || "—";
}

function roleLabel(role?: string) {
  if (!role) return "Member";
  return role
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

const emptyForm = {
  name: "",
  city: "",
  presidentName: "",
  presidentEmail: "",
  presidentPassword: "",
  established: "",
  image: null as File | null,
};

function ChaptersPage() {
  const { user } = useAuth();
  const isCeo = isFullAccessRole(user?.systemRole);
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<ChapterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [details, setDetails] = useState<ChapterDetails | null>(null);
  const [detailChapterId, setDetailChapterId] = useState<string | null>(null);
  const [newPresidentId, setNewPresidentId] = useState("");
  const [deactivatePrevious, setDeactivatePrevious] = useState(true);
  const [presidentActionLoading, setPresidentActionLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ChapterRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [memberDetailOpen, setMemberDetailOpen] = useState(false);
  const [memberDetailLoading, setMemberDetailLoading] = useState(false);
  const [memberDetail, setMemberDetail] = useState<{
    user: TeamUser & {
      createdAt?: string;
      chapter?: { name?: string; city?: string } | null;
      cabinetMember?: { name?: string } | null;
    };
    donations: Array<{
      _id: string;
      amount: number;
      status: string;
      createdAt: string;
      teamDirector?: { name?: string } | null;
    }>;
    donationTotals: {
      pending: number;
      verified: number;
      rejected: number;
      count: number;
      grandTotal: number;
    };
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: ChapterRow[] }>("/chapters");
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load chapters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((c) => {
      const president = presidentLabel(c.president);
      return `${c.name} ${c.city} ${president}`.toLowerCase().includes(needle);
    });
  }, [rows, q]);

  const presidentCandidates = useMemo(() => {
    if (!details?.team) return [];
    const currentId = details.president?._id;
    return details.team.filter((u) => u._id !== currentId);
  }, [details]);

  async function refreshDetails(chapterId: string) {
    const res = await api<{ success: true; data: ChapterDetails }>(`/chapters/${chapterId}/details`);
    setDetails(res.data);
    setNewPresidentId("");
  }

  async function openDetails(chapterId: string) {
    setDetailOpen(true);
    setDetailChapterId(chapterId);
    setDetailLoading(true);
    setDetails(null);
    setNewPresidentId("");
    setDeactivatePrevious(true);
    try {
      await refreshDetails(chapterId);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load chapter details");
      setDetailOpen(false);
      setDetailChapterId(null);
    } finally {
      setDetailLoading(false);
    }
  }

  async function openMemberDetail(userId: string) {
    setMemberDetailOpen(true);
    setMemberDetailLoading(true);
    setMemberDetail(null);
    try {
      const res = await api<{
        success: true;
        data: NonNullable<typeof memberDetail>;
      }>(`/users/${userId}/chapter-detail`);
      setMemberDetail(res.data);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load member");
      setMemberDetailOpen(false);
    } finally {
      setMemberDetailLoading(false);
    }
  }

  async function deleteTeamUser(u: TeamUser) {
    if (
      !window.confirm(
        `Delete account for ${u.name}${u.email ? ` (${u.email})` : ""}? This cannot be undone.`,
      )
    ) {
      return;
    }
    setDeletingUserId(u._id);
    try {
      await api(`/users/${u._id}`, { method: "DELETE" });
      toast.success("Account deleted");
      if (detailChapterId) await refreshDetails(detailChapterId);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete account");
    } finally {
      setDeletingUserId(null);
    }
  }

  async function assignPresident(presidentId: string, deactivate = deactivatePrevious) {
    if (!detailChapterId || !presidentId) return;
    setPresidentActionLoading(true);
    try {
      await api(`/chapters/${detailChapterId}/president`, {
        method: "PATCH",
        body: JSON.stringify({
          presidentId,
          deactivatePrevious: deactivate,
        }),
      });
      toast.success("President updated");
      await Promise.all([refreshDetails(detailChapterId), load()]);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to update president");
    } finally {
      setPresidentActionLoading(false);
    }
  }

  async function deactivatePresident() {
    if (!detailChapterId) return;
    if (!window.confirm("Deactivate the current president? They will lose president access.")) return;
    setPresidentActionLoading(true);
    try {
      await api(`/chapters/${detailChapterId}/president`, {
        method: "PATCH",
        body: JSON.stringify({ deactivateOnly: true }),
      });
      toast.success("President deactivated");
      await Promise.all([refreshDetails(detailChapterId), load()]);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to deactivate president");
    } finally {
      setPresidentActionLoading(false);
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.city.trim()) {
      toast.error("Chapter name and city are required.");
      return;
    }
    if (form.presidentEmail.trim() && !form.presidentName.trim()) {
      toast.error("President name is required when providing an email.");
      return;
    }

    setSaving(true);
    try {
      const body = new FormData();
      body.append("name", form.name.trim());
      body.append("city", form.city.trim());
      if (form.established) body.append("established", form.established);
      if (form.presidentName.trim()) body.append("presidentName", form.presidentName.trim());
      if (form.presidentEmail.trim()) body.append("presidentEmail", form.presidentEmail.trim());
      if (form.presidentPassword) body.append("presidentPassword", form.presidentPassword);
      if (form.image) body.append("image", form.image);

      await api("/chapters", {
        method: "POST",
        body,
      });
      toast.success("Chapter created");
      setForm(emptyForm);
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to create chapter");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteChapter() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/chapters/${deleteTarget._id}`, { method: "DELETE" });
      toast.success(`Chapter "${deleteTarget.name}" deleted`);
      if (detailChapterId === deleteTarget._id) {
        setDetailOpen(false);
        setDetailChapterId(null);
        setDetails(null);
      }
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete chapter");
    } finally {
      setDeleting(false);
    }
  }

  async function onReplaceImage(file: File | null) {
    if (!file || !detailChapterId) return;
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append("image", file);
      await api(`/chapters/${detailChapterId}/image`, { method: "PATCH", body });
      toast.success("Chapter image updated");
      await Promise.all([refreshDetails(detailChapterId), load()]);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  }

  const chapter = details?.chapter;
  const president = details?.president;

  return (
    <PageShell>
      <PageHeader
        title="Chapters"
        description={`${rows.length} chapter${rows.length === 1 ? "" : "s"} across Pakistan`}
        actions={
          isCeo ? (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button style={{ background: "var(--gradient-brand)" }} className="text-white border-0">
                  <Plus className="h-4 w-4" /> New chapter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={(e) => void onCreate(e)}>
                  <DialogHeader>
                    <DialogTitle>Create new chapter</DialogTitle>
                    <DialogDescription>
                      Set up a new city chapter and optionally create its President login.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3 py-2">
                    <div className="grid gap-1.5">
                      <Label htmlFor="chapter-name">Chapter name</Label>
                      <Input
                        id="chapter-name"
                        placeholder="e.g. Hyderabad"
                        value={form.name}
                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="chapter-city">City / Region</Label>
                      <Input
                        id="chapter-city"
                        placeholder="Hyderabad, Sindh"
                        value={form.city}
                        onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="chapter-image">Chapter image</Label>
                      <Input
                        id="chapter-image"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) =>
                          setForm((f) => ({ ...f, image: e.target.files?.[0] || null }))
                        }
                      />
                      {form.image ? (
                        <p className="text-xs text-muted-foreground">{form.image.name}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Shown on the public City Chapters page.
                        </p>
                      )}
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="president-name">President name</Label>
                      <Input
                        id="president-name"
                        placeholder="e.g. Ali Raza"
                        value={form.presidentName}
                        onChange={(e) => setForm((f) => ({ ...f, presidentName: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="president-email">President email</Label>
                      <Input
                        id="president-email"
                        type="email"
                        placeholder="president@example.org"
                        value={form.presidentEmail}
                        onChange={(e) => setForm((f) => ({ ...f, presidentEmail: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="president-password">President password (optional)</Label>
                      <Input
                        id="president-password"
                        type="password"
                        placeholder="Defaults to ChangeMe123!"
                        value={form.presidentPassword}
                        onChange={(e) => setForm((f) => ({ ...f, presidentPassword: e.target.value }))}
                      />
                    </div>
                    <div className="grid gap-1.5">
                      <Label htmlFor="launch">Launch date</Label>
                      <Input
                        id="launch"
                        type="date"
                        value={form.established}
                        onChange={(e) => setForm((f) => ({ ...f, established: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Create chapter
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 border-b border-border p-4">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search chapters, cities, presidents…"
              className="pl-9"
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Chapter</TableHead>
              <TableHead>President</TableHead>
              <TableHead className="text-right">Members</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Established</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading chapters…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-muted-foreground">
                  No chapters found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c._id} className="hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt=""
                          className="h-10 w-14 shrink-0 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="grid h-10 w-14 shrink-0 place-items-center rounded-md border border-dashed border-border bg-muted text-[10px] text-muted-foreground">
                          No img
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.city}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{presidentLabel(c.president)}</TableCell>
                  <TableCell className="text-right">{c.memberCount ?? 0}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        c.status === "active"
                          ? "bg-[color:var(--success)]/15 text-[color:var(--success)] border-0"
                          : "bg-muted text-muted-foreground border-0"
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(c.established)}</TableCell>
                  <TableCell className="text-right">
                    <div className="inline-flex items-center justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => void openDetails(c._id)}>
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </Button>
                      {isCeo ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>{chapter?.name || "Chapter details"}</SheetTitle>
            <SheetDescription>
              {chapter ? `${chapter.city} · Full profile, donations, team & cases` : "Loading chapter profile…"}
            </SheetDescription>
          </SheetHeader>

          {isCeo && chapter ? (
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setDeleteTarget(chapter)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete chapter
              </Button>
            </div>
          ) : null}

          {detailLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading details…
            </div>
          ) : details && chapter ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Team donations</p>
                  <p className="mt-1 text-lg font-semibold">{fmtPKR(details.donationTotals.grandTotal)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Login accounts</p>
                  <p className="mt-1 text-lg font-semibold">{details.team.length}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Active cases</p>
                  <p className="mt-1 text-lg font-semibold">{details.activeCases}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Pending + running · {details.casesClosed ?? chapter.casesClosed ?? 0} complete
                  </p>
                </div>
              </div>

              <Tabs defaultValue="overview">
                <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="president">President</TabsTrigger>
                  <TabsTrigger value="donations">Donations</TabsTrigger>
                  <TabsTrigger value="team">Team</TabsTrigger>
                  <TabsTrigger value="cases">Cases</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-4 space-y-3">
                  <div className="overflow-hidden rounded-xl border border-border">
                    {chapter.imageUrl ? (
                      <img
                        src={chapter.imageUrl}
                        alt={chapter.name}
                        className="h-40 w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-28 place-items-center bg-muted text-sm text-muted-foreground">
                        No chapter image yet
                      </div>
                    )}
                    {isCeo ? (
                      <div className="flex flex-wrap items-center gap-2 border-t border-border p-3">
                        <Label htmlFor="replace-chapter-image" className="text-xs text-muted-foreground">
                          {uploadingImage ? "Uploading…" : "Change image"}
                        </Label>
                        <Input
                          id="replace-chapter-image"
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={uploadingImage}
                          className="max-w-xs"
                          onChange={(e) => {
                            void onReplaceImage(e.target.files?.[0] || null);
                            e.target.value = "";
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="rounded-xl border border-border">
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Status</TableCell>
                          <TableCell className="font-medium capitalize">{chapter.status}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Established</TableCell>
                          <TableCell>{formatDate(chapter.established)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Monthly budget</TableCell>
                          <TableCell>{fmtPKR(chapter.monthlyBudget ?? 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Monthly spent</TableCell>
                          <TableCell>{fmtPKR(chapter.monthlySpent ?? 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Funds raised (YTD)</TableCell>
                          <TableCell>{fmtPKR(chapter.fundsRaised ?? 0)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Member count</TableCell>
                          <TableCell>{details.team.length}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Cases closed</TableCell>
                          <TableCell>{details.casesClosed ?? chapter.casesClosed ?? 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Total events</TableCell>
                          <TableCell>{chapter.totalEvents ?? 0}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground">Last activity</TableCell>
                          <TableCell>{formatDateTime(chapter.lastActivity)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="president" className="mt-4 space-y-4">
                  {president ? (
                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="font-medium">{president.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <p className="font-medium">
                          {president.email ? (
                            <a className="text-primary underline-offset-2 hover:underline" href={`mailto:${president.email}`}>
                              {president.email}
                            </a>
                          ) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Phone</p>
                        <p className="font-medium">
                          {president.phone ? (
                            <a className="text-primary underline-offset-2 hover:underline" href={`tel:${president.phone}`}>
                              {president.phone}
                            </a>
                          ) : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Role</p>
                        <p className="font-medium">{roleLabel(president.chapterRole || president.systemRole)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Account status</p>
                        <p className="font-medium">{president.isActive === false ? "Inactive" : "Active"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Last login</p>
                        <p className="font-medium">{formatDateTime(president.lastLogin)}</p>
                      </div>
                      {isCeo && president.isActive !== false ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={presidentActionLoading}
                          onClick={() => void deactivatePresident()}
                        >
                          {presidentActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          Deactivate president
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No president assigned to this chapter.</p>
                  )}

                  {isCeo ? (
                    <div className="rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">
                          {president ? "Transfer presidency" : "Assign president"}
                        </h3>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Choose any login account from this chapter. The previous president is demoted to member.
                      </p>
                      <div className="grid gap-1.5">
                        <Label>New president</Label>
                        <Select value={newPresidentId} onValueChange={setNewPresidentId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select chapter member…" />
                          </SelectTrigger>
                          <SelectContent>
                            {presidentCandidates.length === 0 ? (
                              <SelectItem value="__none" disabled>
                                No other chapter users available
                              </SelectItem>
                            ) : (
                              presidentCandidates.map((u) => (
                                <SelectItem key={u._id} value={u._id}>
                                  {u.name} · {roleLabel(u.chapterRole)} · {u.email}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {president ? (
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={deactivatePrevious}
                            onCheckedChange={(v) => setDeactivatePrevious(v === true)}
                          />
                          Deactivate previous president account
                        </label>
                      ) : null}
                      <Button
                        disabled={!newPresidentId || presidentActionLoading || presidentCandidates.length === 0}
                        onClick={() => void assignPresident(newPresidentId)}
                      >
                        {presidentActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                        {president ? "Make selected person president" : "Assign president"}
                      </Button>
                    </div>
                  ) : null}
                </TabsContent>

                <TabsContent value="donations" className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Verified</p>
                      <p className="mt-1 font-semibold">{fmtPKR(details.donationTotals.verified)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Pending</p>
                      <p className="mt-1 font-semibold">{fmtPKR(details.donationTotals.pending)}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-xs text-muted-foreground">Records</p>
                      <p className="mt-1 font-semibold">{details.donationTotals.count}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium">Month-wise team donations</h3>
                    <div className="rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Verified</TableHead>
                            <TableHead className="text-right">Pending</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.teamDonationsByMonth.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-muted-foreground">
                                No team donations yet.
                              </TableCell>
                            </TableRow>
                          ) : (
                            details.teamDonationsByMonth.map((m) => (
                              <TableRow key={`${m.year}-${m.month}`}>
                                <TableCell>{m.label}</TableCell>
                                <TableCell className="text-right">{fmtPKR(m.verified ?? 0)}</TableCell>
                                <TableCell className="text-right">{fmtPKR(m.pending ?? 0)}</TableCell>
                                <TableCell className="text-right font-medium">{fmtPKR(m.total)}</TableCell>
                                <TableCell className="text-right">{m.count}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium">Month-wise public donations</h3>
                    <div className="rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Month</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.publicDonationsByMonth.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} className="text-muted-foreground">
                                No public donations linked to this chapter.
                              </TableCell>
                            </TableRow>
                          ) : (
                            details.publicDonationsByMonth.map((m) => (
                              <TableRow key={`pub-${m.year}-${m.month}`}>
                                <TableCell>{m.label}</TableCell>
                                <TableCell className="text-right font-medium">{fmtPKR(m.total)}</TableCell>
                                <TableCell className="text-right">{m.count}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-medium">Recent team donations</h3>
                    <div className="rounded-xl border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Donor</TableHead>
                            <TableHead>Director</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {details.recentTeamDonations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-muted-foreground">
                                No recent donations.
                              </TableCell>
                            </TableRow>
                          ) : (
                            details.recentTeamDonations.map((d) => (
                              <TableRow key={d._id}>
                                <TableCell>
                                  <div className="font-medium">{d.donor?.name || "—"}</div>
                                  <div className="text-xs text-muted-foreground">{d.donor?.email}</div>
                                </TableCell>
                                <TableCell>{d.teamDirector?.name || "Own collection"}</TableCell>
                                <TableCell className="capitalize">{d.status}</TableCell>
                                <TableCell className="text-right">{fmtPKR(d.amount)}</TableCell>
                                <TableCell className="text-muted-foreground text-sm">
                                  {formatDate(d.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="team" className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    All chapter login accounts — president, VPs, cabinet, directors, and general members (
                    {details.team.length}).
                  </p>
                  <div className="rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Director team</TableHead>
                          {isCeo ? <TableHead className="text-right">Actions</TableHead> : null}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {details.team.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={isCeo ? 5 : 4} className="text-muted-foreground">
                              No login accounts in this chapter.
                            </TableCell>
                          </TableRow>
                        ) : (
                          details.team.map((u) => {
                            const isCurrentPresident =
                              details.president?._id === u._id ||
                              u.systemRole === "president" ||
                              u.chapterRole === "president";
                            return (
                              <TableRow key={u._id}>
                                <TableCell className="font-medium">
                                  <button
                                    type="button"
                                    className="text-left text-primary underline-offset-2 hover:underline"
                                    onClick={() => void openMemberDetail(u._id)}
                                  >
                                    {u.name}
                                  </button>
                                  {u.isActive === false ? (
                                    <Badge variant="secondary" className="ml-2">
                                      Inactive
                                    </Badge>
                                  ) : null}
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">{u.email || "—"}</div>
                                  <div className="text-xs text-muted-foreground">{u.phone || "No phone"}</div>
                                </TableCell>
                                <TableCell>{roleLabel(u.chapterRole || u.systemRole)}</TableCell>
                                <TableCell>{u.teamDirector?.name || "—"}</TableCell>
                                {isCeo ? (
                                  <TableCell className="text-right">
                                    <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                      {isCurrentPresident ? (
                                        <span className="text-xs text-muted-foreground">Current president</span>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          disabled={presidentActionLoading}
                                          onClick={() => {
                                            if (
                                              !window.confirm(
                                                `Make ${u.name} the chapter president?${
                                                  deactivatePrevious
                                                    ? " Previous president will be deactivated."
                                                    : ""
                                                }`,
                                              )
                                            ) {
                                              return;
                                            }
                                            void assignPresident(u._id);
                                          }}
                                        >
                                          Make president
                                        </Button>
                                      )}
                                      {!isCurrentPresident ? (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                          disabled={deletingUserId === u._id}
                                          onClick={() => void deleteTeamUser(u)}
                                        >
                                          {deletingUserId === u._id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                          ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                          )}
                                          Delete
                                        </Button>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                ) : null}
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                <TabsContent value="cases" className="mt-4 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    All documentation cases for this chapter (health, marriage, fee, ration). Active:{" "}
                    {details.activeCases} · Complete: {details.casesClosed ?? 0}.
                  </p>
                  <div className="rounded-xl border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Title / beneficiary</TableHead>
                          <TableHead>Case #</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created by</TableHead>
                          <TableHead>Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(details.cases || []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-muted-foreground">
                              No cases for this chapter yet.
                            </TableCell>
                          </TableRow>
                        ) : (
                          (details.cases || []).map((c) => (
                            <TableRow key={c._id}>
                              <TableCell>
                                <Badge variant="secondary">{caseTypeLabel(c.type)}</Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div>{c.title || beneficiaryFromCase(c)}</div>
                                {c.title && beneficiaryFromCase(c) !== "—" ? (
                                  <div className="text-xs text-muted-foreground">{beneficiaryFromCase(c)}</div>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-sm">{c.caseNumber || "—"}</TableCell>
                              <TableCell className="capitalize">
                                {c.caseStatus || "pending"}
                              </TableCell>
                              <TableCell className="text-sm">
                                {c.createdBy?.name || "—"}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {formatDate(c.updatedAt || c.createdAt)}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      <Sheet open={memberDetailOpen} onOpenChange={setMemberDetailOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{memberDetail?.user?.name || "Member details"}</SheetTitle>
            <SheetDescription>
              {memberDetail?.user?.chapter
                ? `${memberDetail.user.chapter.name || ""}${
                    memberDetail.user.chapter.city ? ` · ${memberDetail.user.chapter.city}` : ""
                  }`
                : "Profile and team donations"}
            </SheetDescription>
          </SheetHeader>
          {memberDetailLoading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading member…
            </div>
          ) : memberDetail ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Total donated</p>
                  <p className="mt-1 text-lg font-semibold">
                    {fmtPKR(memberDetail.donationTotals.grandTotal)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Verified</p>
                  <p className="mt-1 text-lg font-semibold">
                    {fmtPKR(memberDetail.donationTotals.verified)}
                  </p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="mt-1 text-lg font-semibold">
                    {fmtPKR(memberDetail.donationTotals.pending)}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium">{memberDetail.user.email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{memberDetail.user.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Role</p>
                  <p className="font-medium">
                    {roleLabel(memberDetail.user.chapterRole || memberDetail.user.systemRole)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Cabinet</p>
                  <p className="font-medium">{memberDetail.user.cabinetMember?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Director team</p>
                  <p className="font-medium">{memberDetail.user.teamDirector?.name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Last login</p>
                  <p className="font-medium">{formatDateTime(memberDetail.user.lastLogin)}</p>
                </div>
              </div>
              <div className="rounded-xl border border-border">
                <div className="border-b border-border px-4 py-3">
                  <h3 className="text-sm font-medium">
                    Donations ({memberDetail.donationTotals.count})
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
                    {memberDetail.donations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-muted-foreground">
                          No team donations for this member.
                        </TableCell>
                      </TableRow>
                    ) : (
                      memberDetail.donations.map((d) => (
                        <TableRow key={d._id}>
                          <TableCell>{formatDate(d.createdAt)}</TableCell>
                          <TableCell className="font-medium">{fmtPKR(d.amount)}</TableCell>
                          <TableCell className="capitalize">{d.status}</TableCell>
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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chapter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <b>{deleteTarget?.name}</b>
              {deleteTarget?.city ? ` (${deleteTarget.city})` : ""}. Users linked to this chapter will be
              unassigned. Related donations and cases are not deleted from history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void onDeleteChapter();
              }}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete chapter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}
