import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Copy, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { KpiCard, PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";
import { ORG_ROLE_LABEL, type OrgRole } from "@/lib/roles";

export const Route = createFileRoute("/_dashboard/donate")({
  head: () => ({ meta: [{ title: "Donate — Serve Humanity" }] }),
  component: BogDonatePage,
});

type DonationAccount = {
  bankName?: string;
  accountTitle?: string;
  accountNumber?: string;
  iban?: string;
  note?: string;
};

type PublicChapter = {
  id: string;
  name: string;
  city: string;
  donationAccounts?: DonationAccount[];
};

type BogDonation = {
  _id: string;
  amount: number;
  status: "pending" | "verified" | "rejected" | string;
  screenshotUrl?: string;
  note?: string;
  createdAt?: string;
  donor?: { name?: string; email?: string; systemRole?: string };
  chapter?: { _id?: string; name?: string; city?: string };
  verifiedBy?: { name?: string } | null;
};

function fmt(n: number) {
  return `PKR ${Number(n || 0).toLocaleString()}`;
}

function roleLabel(role?: string) {
  if (!role) return "—";
  return ORG_ROLE_LABEL[role as OrgRole] || role;
}

function BogDonatePage() {
  const [chapters, setChapters] = useState<PublicChapter[]>([]);
  const [chapterId, setChapterId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mineRows, setMineRows] = useState<BogDonation[]>([]);
  const [orgRows, setOrgRows] = useState<BogDonation[]>([]);
  const [mineLifetime, setMineLifetime] = useState(0);
  const [minePending, setMinePending] = useState(0);
  const [orgLifetime, setOrgLifetime] = useState(0);
  const [orgPending, setOrgPending] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selected = useMemo(
    () => chapters.find((c) => c.id === chapterId) || null,
    [chapters, chapterId],
  );
  const accounts = selected?.donationAccounts || [];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [chapterRes, mineRes, orgRes] = await Promise.all([
        api<{ success: true; data: PublicChapter[] }>("/chapters/public"),
        api<{
          success: true;
          data: BogDonation[];
          mine?: { lifetimeTotal?: number; pendingTotal?: number };
        }>("/chapter-donations/bog?month=all"),
        api<{
          success: true;
          data: BogDonation[];
          org?: { lifetimeTotal?: number; pendingTotal?: number };
        }>("/chapter-donations/bog?scope=all&month=all"),
      ]);
      setChapters(chapterRes.data || []);
      setMineRows(mineRes.data || []);
      setOrgRows(orgRes.data || []);
      setMineLifetime(mineRes.mine?.lifetimeTotal || 0);
      setMinePending(mineRes.mine?.pendingTotal || 0);
      setOrgLifetime(orgRes.org?.lifetimeTotal || 0);
      setOrgPending(orgRes.org?.pendingTotal || 0);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load donations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function copyText(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      toast.error("Could not copy");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!chapterId) {
      toast.error("Select a chapter first");
      return;
    }
    if (!file) {
      toast.error("Upload a payment screenshot");
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("chapterId", chapterId);
      form.append("amount", String(amt));
      if (note.trim()) form.append("note", note.trim());
      form.append("screenshot", file);

      await api("/chapter-donations/bog", { method: "POST", body: form });
      toast.success("Submitted — chapter finance will verify your donation");
      setAmount("");
      setNote("");
      setFile(null);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Donate"
        description="Choose a chapter, transfer to their account, then submit amount and screenshot. Chapter finance verifies it before it counts."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Your verified total" value={fmt(mineLifetime)} accent="green" />
        <KpiCard label="Your pending" value={fmt(minePending)} accent="orange" />
        <KpiCard label="All BOG verified" value={fmt(orgLifetime)} accent="blue" />
        <KpiCard label="All BOG pending" value={fmt(orgPending)} accent="gradient" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(e) => void onSubmit(e)}
          className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
        >
          <h2 className="text-sm font-semibold tracking-tight">Submit a donation</h2>

          <div className="space-y-2">
            <Label>Chapter</Label>
            <Select value={chapterId || undefined} onValueChange={setChapterId}>
              <SelectTrigger>
                <SelectValue placeholder="Select chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.city ? ` — ${c.city}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected ? (
            <div className="space-y-3 rounded-lg border border-border/80 bg-muted/30 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {selected.name} bank accounts
              </p>
              {accounts.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This chapter has not published donation accounts yet. Ask the chapter president to
                  add them in settings.
                </p>
              ) : (
                accounts.map((a, i) => (
                  <div key={i} className="space-y-1.5 text-sm">
                    <p className="font-medium">{a.bankName || "Bank"}</p>
                    {a.accountTitle ? (
                      <p className="text-muted-foreground">Title: {a.accountTitle}</p>
                    ) : null}
                    {a.accountNumber ? (
                      <CopyRow
                        label="Account"
                        value={a.accountNumber}
                        copied={copiedKey === `acc-${i}`}
                        onCopy={() => void copyText(`acc-${i}`, a.accountNumber || "")}
                      />
                    ) : null}
                    {a.iban ? (
                      <CopyRow
                        label="IBAN"
                        value={a.iban}
                        copied={copiedKey === `iban-${i}`}
                        onCopy={() => void copyText(`iban-${i}`, a.iban || "")}
                      />
                    ) : null}
                    {a.note ? <p className="text-xs text-muted-foreground">{a.note}</p> : null}
                  </div>
                ))
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="bog-amount">Amount (PKR)</Label>
            <Input
              id="bog-amount"
              type="number"
              min={1}
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bog-note">Note (optional)</Label>
            <Input
              id="bog-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reference or message"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bog-ss">Payment screenshot</Label>
            <Input
              id="bog-ss"
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
            {file ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Upload className="h-3.5 w-3.5" />
                {file.name}
              </p>
            ) : null}
          </div>

          <Button type="submit" disabled={submitting || !chapterId}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Submit for verification
          </Button>
        </form>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="mb-3 text-sm font-semibold tracking-tight">Your donation history</h2>
          <DonationTable rows={mineRows} loading={loading} showDonor={false} />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="mb-1 text-sm font-semibold tracking-tight">All BOG / Board donations</h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Verified amounts are added to that chapter’s funds and appear across CEO / Founder / CTO /
          COO and BOG dashboards here.
        </p>
        <DonationTable rows={orgRows} loading={loading} showDonor />
      </div>
    </PageShell>
  );
}

function CopyRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono text-xs">{value}</span>
      <Button type="button" size="sm" variant="ghost" className="h-7 px-2" onClick={onCopy}>
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

function DonationTable({
  rows,
  loading,
  showDonor,
}: {
  rows: BogDonation[];
  loading: boolean;
  showDonor: boolean;
}) {
  const cols = showDonor ? 6 : 5;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {showDonor ? <TableHead>Donor</TableHead> : null}
            <TableHead>Chapter</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Screenshot</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={cols} className="text-muted-foreground">
                <Loader2 className="mr-2 inline h-4 w-4 animate-spin" /> Loading…
              </TableCell>
            </TableRow>
          ) : rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={cols} className="text-muted-foreground">
                No donations yet.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((r) => (
              <TableRow key={r._id}>
                {showDonor ? (
                  <TableCell>
                    <div className="font-medium">{r.donor?.name || "—"}</div>
                    <div className="text-xs text-muted-foreground">
                      {roleLabel(r.donor?.systemRole)}
                    </div>
                  </TableCell>
                ) : null}
                <TableCell>
                  {r.chapter?.name || "—"}
                  {r.chapter?.city ? (
                    <span className="block text-xs text-muted-foreground">{r.chapter.city}</span>
                  ) : null}
                </TableCell>
                <TableCell>{fmt(r.amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      r.status === "verified"
                        ? "default"
                        : r.status === "rejected"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {r.screenshotUrl ? (
                    <Button size="sm" variant="outline" asChild>
                      <a href={r.screenshotUrl} target="_blank" rel="noreferrer">
                        View
                      </a>
                    </Button>
                  ) : (
                    "—"
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
