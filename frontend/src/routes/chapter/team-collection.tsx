import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ChapterCard, ChapterPageHeader } from "@/components/chapter/ChapterPage";
import { MonthCollectionHistory, type MonthCollectionRow } from "@/components/chapter/MonthCollectionHistory";
import { api, ApiRequestError } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DonationRow = {
  _id: string;
  amount: number;
  screenshotUrl?: string;
  status: string;
  createdAt?: string;
  donor?: { name?: string; email?: string };
};

function fmt(n: number) {
  return `PKR ${Number(n || 0).toLocaleString()}`;
}

export default function TeamCollectionPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<DonationRow[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [verifiedTotal, setVerifiedTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [periodLabel, setPeriodLabel] = useState("This month");
  const [byMonth, setByMonth] = useState<MonthCollectionRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{
        success: true;
        data: DonationRow[];
        pendingTotal: number;
        verifiedTotal: number;
        grandTotal: number;
        period?: { label?: string };
        byMonth?: MonthCollectionRow[];
      }>("/chapter-donations/my-team");
      setRows(res.data || []);
      setPendingTotal(res.pendingTotal || 0);
      setVerifiedTotal(res.verifiedTotal || 0);
      setGrandTotal(res.grandTotal || 0);
      setPeriodLabel(res.period?.label || "This month");
      setByMonth(res.byMonth || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load team collection");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <ChapterPageHeader
        title="Your team collection"
        description={`This month (${periodLabel}). When a new month starts, totals reset to zero and previous months stay saved.`}
      />

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Pending</p>
          <p className="mt-1 font-display text-xl font-bold text-amber-700">{fmt(pendingTotal)}</p>
        </ChapterCard>
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Verified</p>
          <p className="mt-1 font-display text-xl font-bold text-emerald-700">{fmt(verifiedTotal)}</p>
        </ChapterCard>
        <ChapterCard>
          <p className="text-xs text-muted-foreground">This month · Team total</p>
          <p className="mt-1 font-display text-xl font-bold">{fmt(grandTotal)}</p>
        </ChapterCard>
      </div>

      <div className="mb-5">
        <MonthCollectionHistory rows={byMonth} />
      </div>

      <ChapterCard className="overflow-x-auto p-0 md:p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">This month&apos;s donations</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Screenshot</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
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
                  No team donations this month yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-medium">{r.donor?.name || "—"}</TableCell>
                  <TableCell>{fmt(r.amount)}</TableCell>
                  <TableCell>
                    {r.screenshotUrl ? (
                      <a
                        href={r.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-brand-blue hover:underline"
                      >
                        View
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{r.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </ChapterCard>
    </div>
  );
}
