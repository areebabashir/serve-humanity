import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { MonthCollectionHistory, type MonthCollectionRow } from "@/components/chapter/MonthCollectionHistory";
import { api, ApiRequestError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DirectorTotal = {
  director: { _id: string; name: string; email?: string; chapterRole?: string };
  pendingTotal: number;
  verifiedTotal: number;
  grandTotal: number;
  pendingCount: number;
  verifiedCount: number;
};

type DonationRow = {
  _id: string;
  amount: number;
  screenshotUrl?: string;
  status: string;
  createdAt?: string;
  donor?: { name?: string };
  teamDirector?: { name?: string } | null;
};

function fmt(n: number) {
  return `PKR ${Number(n || 0).toLocaleString()}`;
}

export default function DirectorDonationsPage() {
  const [loading, setLoading] = useState(true);
  const [directors, setDirectors] = useState<DirectorTotal[]>([]);
  const [unassigned, setUnassigned] = useState({ pendingTotal: 0, verifiedTotal: 0, grandTotal: 0 });
  const [chapterPending, setChapterPending] = useState(0);
  const [chapterVerified, setChapterVerified] = useState(0);
  const [chapterGrand, setChapterGrand] = useState(0);
  const [periodLabel, setPeriodLabel] = useState("This month");
  const [byMonth, setByMonth] = useState<MonthCollectionRow[]>([]);
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [canVerify, setCanVerify] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [totals, list] = await Promise.all([
        api<{
          success: true;
          directors: DirectorTotal[];
          unassigned: { pendingTotal: number; verifiedTotal: number; grandTotal: number };
          chapterPendingTotal: number;
          chapterVerifiedTotal: number;
          chapterGrandTotal: number;
          canVerify?: boolean;
          period?: { label?: string; year?: number; month?: number };
          byMonth?: MonthCollectionRow[];
        }>("/chapter-donations/director-totals"),
        api<{ success: true; data: DonationRow[] }>("/chapter-donations"),
      ]);
      setDirectors(totals.directors || []);
      setUnassigned(totals.unassigned || { pendingTotal: 0, verifiedTotal: 0, grandTotal: 0 });
      setChapterPending(totals.chapterPendingTotal || 0);
      setChapterVerified(totals.chapterVerifiedTotal || 0);
      setChapterGrand(totals.chapterGrandTotal || 0);
      setPeriodLabel(totals.period?.label || "This month");
      setByMonth(totals.byMonth || []);
      setCanVerify(Boolean(totals.canVerify));
      setRows(list.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function verify(id: string, status: "verified" | "rejected") {
    setBusyId(id);
    try {
      await api(`/chapter-donations/${id}/verify`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      toast.success(status === "verified" ? "Donation verified" : "Donation rejected");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <ChapterPageHeader
        title="Director team donations"
        description={`Month-wise chapter collection for ${periodLabel}. Totals reset when a new month starts; previous months stay saved.`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Pending</p>
          <p className="mt-1 font-display text-xl font-bold text-amber-700">{fmt(chapterPending)}</p>
        </ChapterCard>
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Verified</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-700">{fmt(chapterVerified)}</p>
        </ChapterCard>
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Total collection</p>
          <p className="mt-1 font-display text-xl font-bold">{fmt(chapterGrand)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{periodLabel}</p>
        </ChapterCard>
      </div>

      <div className="mb-5">
        <MonthCollectionHistory rows={byMonth} />
      </div>

      <Tabs defaultValue="by-director" className="gap-4">
        <TabsList>
          <TabsTrigger value="by-director">By director (this month)</TabsTrigger>
          <TabsTrigger value="all">This month&apos;s donations</TabsTrigger>
        </TabsList>

        <TabsContent value="by-director">
          <ChapterCard className="overflow-x-auto p-0 md:p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Director</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Verified</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-muted-foreground">
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
                    </TableCell>
                  </TableRow>
                ) : (
                  <>
                    {directors.map((d) => (
                      <TableRow key={d.director._id}>
                        <TableCell className="font-medium">
                          {d.director.name}
                          {d.director.chapterRole ? (
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {d.director.chapterRole.replace(/_/g, " ")}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right text-amber-700">{fmt(d.pendingTotal)}</TableCell>
                        <TableCell className="text-right text-emerald-700">
                          {fmt(d.verifiedTotal)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">{fmt(d.grandTotal)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="text-muted-foreground">
                        President / VP own collection
                      </TableCell>
                      <TableCell className="text-right text-amber-700">
                        {fmt(unassigned.pendingTotal)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-700">
                        {fmt(unassigned.verifiedTotal)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {fmt(unassigned.grandTotal)}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </ChapterCard>
        </TabsContent>

        <TabsContent value="all">
          <ChapterCard className="overflow-x-auto p-0 md:p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Director team</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                      No donations this month yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r._id}>
                      <TableCell className="font-medium">{r.donor?.name || "—"}</TableCell>
                      <TableCell>{r.teamDirector?.name || "Own collection"}</TableCell>
                      <TableCell>{fmt(r.amount)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{r.status}</Badge>
                      </TableCell>
                      <TableCell className="space-x-1 text-right">
                        {r.screenshotUrl ? (
                          <Button size="sm" variant="outline" asChild>
                            <a href={r.screenshotUrl} target="_blank" rel="noreferrer">
                              SS
                            </a>
                          </Button>
                        ) : null}
                        {r.status === "pending" && canVerify ? (
                          <>
                            <Button
                              size="sm"
                              disabled={busyId === r._id}
                              onClick={() => void verify(r._id, "verified")}
                            >
                              {busyId === r._id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Check className="h-3.5 w-3.5" />
                              )}
                              Verify
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={busyId === r._id}
                              onClick={() => void verify(r._id, "rejected")}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ChapterCard>
        </TabsContent>
      </Tabs>
    </div>
  );
}
