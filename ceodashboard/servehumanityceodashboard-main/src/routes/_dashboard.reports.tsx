import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import {
  Building2,
  Download,
  FileText,
  HandCoins,
  HeartPulse,
  Loader2,
  RefreshCw,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";
import {
  downloadChapterReportPdf,
  downloadOrgReportPdf,
  type ChapterReport,
  type OrgReportTotals,
} from "@/lib/chapter-report-pdf";
import logoAsset from "@/assets/logo.png";

export const Route = createFileRoute("/_dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — Serve Humanity" }] }),
  component: ReportsPage,
});

type ChapterOption = {
  _id: string;
  name: string;
  city?: string;
  status?: string;
};

type ChapterReportResponse = {
  mode: "chapter";
  generatedAt: string;
  report: ChapterReport;
};

type OrgReportResponse = {
  mode: "all";
  generatedAt: string;
  totals: OrgReportTotals;
  reports: ChapterReport[];
};

function fmtPKR(n: number) {
  if (!n || n <= 0) return "PKR 0";
  return `PKR ${Number(n).toLocaleString()}`;
}

function StatTile({
  label,
  value,
  icon: Icon,
  tone = "blue",
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "blue" | "orange" | "green";
}) {
  const tones = {
    blue: "bg-primary/10 text-primary",
    orange: "bg-accent/15 text-accent",
    green: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
  };
  return (
    <div className="rounded-xl border border-border/80 bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1.5 text-lg font-bold tracking-tight text-foreground">{value}</p>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}

function ReportsPage() {
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [chapterId, setChapterId] = useState<string>("all");
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [preview, setPreview] = useState<ChapterReport | null>(null);
  const [orgTotals, setOrgTotals] = useState<OrgReportTotals | null>(null);
  const [orgCount, setOrgCount] = useState(0);
  const [generatedAt, setGeneratedAt] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const loadChapters = useCallback(async () => {
    setLoadingChapters(true);
    try {
      const res = await api<{ success: true; data: ChapterOption[] }>("/chapters");
      setChapters(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load chapters");
    } finally {
      setLoadingChapters(false);
    }
  }, []);

  useEffect(() => {
    void loadChapters();
  }, [loadChapters]);

  const loadPreview = useCallback(async () => {
    setLoadingPreview(true);
    setPreview(null);
    setOrgTotals(null);
    try {
      const q = chapterId === "all" ? "all" : chapterId;
      const res = await api<{ success: true; data: ChapterReportResponse | OrgReportResponse }>(
        `/dashboard/report?chapter=${encodeURIComponent(q)}`,
      );
      setGeneratedAt(res.data.generatedAt);
      if (res.data.mode === "chapter") {
        setPreview(res.data.report);
        setOrgCount(0);
      } else {
        setOrgTotals(res.data.totals);
        setOrgCount(res.data.reports.length);
        setPreview(null);
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load report");
    } finally {
      setLoadingPreview(false);
    }
  }, [chapterId]);

  useEffect(() => {
    void loadPreview();
  }, [loadPreview]);

  async function downloadPdf() {
    setDownloading(true);
    try {
      const q = chapterId === "all" ? "all" : chapterId;
      const res = await api<{ success: true; data: ChapterReportResponse | OrgReportResponse }>(
        `/dashboard/report?chapter=${encodeURIComponent(q)}`,
      );
      if (res.data.mode === "chapter") {
        await downloadChapterReportPdf(res.data.report, res.data.generatedAt);
        toast.success("Chapter PDF downloaded");
      } else {
        await downloadOrgReportPdf(res.data.totals, res.data.reports, res.data.generatedAt);
        toast.success("All-chapters PDF downloaded");
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "PDF download failed");
    } finally {
      setDownloading(false);
    }
  }

  const selectedLabel =
    chapterId === "all"
      ? "All chapters"
      : chapters.find((c) => c._id === chapterId)?.name || "Chapter";

  return (
    <PageShell>
      {/* Brand hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 shadow-[var(--shadow-card)]">
        <div className="absolute inset-0" style={{ background: "var(--gradient-brand)" }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-center gap-4 text-white">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-white shadow-md ring-2 ring-white/40">
              <img src={logoAsset} alt="Serve Humanity" className="h-14 w-14 object-contain" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-white/75">
                Reports · PDF only
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                Chapter &amp; organization reports
              </h1>
              <p className="mt-1 max-w-xl text-sm text-white/80">
                Live data with Serve Humanity branding — download a branded PDF for one chapter or
                the full organization.
              </p>
            </div>
          </div>
          <Button
            variant="secondary"
            className="bg-white text-foreground hover:bg-white/90"
            onClick={() => void loadPreview()}
            disabled={loadingPreview}
          >
            {loadingPreview ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh data
          </Button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-12">
        {/* Controls */}
        <aside className="lg:col-span-4">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-card)]">
            <div className="border-b border-border/80 bg-gradient-to-r from-primary/[0.06] to-accent/[0.08] px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Export PDF</h2>
                  <p className="text-xs text-muted-foreground">Branded with official logo</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="grid gap-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Select scope
                </Label>
                <Select value={chapterId} onValueChange={setChapterId} disabled={loadingChapters}>
                  <SelectTrigger className="h-11 rounded-xl bg-background">
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All chapters (organization)</SelectItem>
                    {chapters.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                        {c.city ? ` · ${c.city}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-xl border border-dashed border-primary/25 bg-primary/[0.03] p-3 text-xs leading-relaxed text-muted-foreground">
                PDF includes president contact, members, team, donations, welfare cases (pending /
                done), documentation cases, and events — in Serve Humanity blue &amp; orange.
              </div>

              <Button
                className="h-11 w-full rounded-xl text-white border-0 shadow-sm"
                style={{ background: "var(--gradient-brand)" }}
                disabled={downloading || loadingPreview}
                onClick={() => void downloadPdf()}
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Download PDF
              </Button>
              <p className="text-center text-xs text-muted-foreground">{selectedLabel}</p>
            </div>
          </div>
        </aside>

        {/* Preview */}
        <div className="lg:col-span-8">
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-card)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold tracking-tight">Live preview</h2>
                <p className="text-xs text-muted-foreground">
                  {generatedAt
                    ? `Updated ${new Date(generatedAt).toLocaleString()}`
                    : "Loading…"}
                </p>
              </div>
              <Badge
                className="rounded-full border-0 px-3 py-1"
                style={{ background: "var(--gradient-brand)", color: "white" }}
              >
                {selectedLabel}
              </Badge>
            </div>

            <div className="p-5">
              {loadingPreview ? (
                <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading live report…
                </div>
              ) : preview ? (
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/[0.05] via-card to-accent/[0.08] p-5 sm:flex-row sm:items-center">
                    <img
                      src={logoAsset}
                      alt=""
                      className="h-14 w-14 shrink-0 object-contain drop-shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="text-lg font-bold tracking-tight text-foreground">
                        {preview.chapter.name}
                        {preview.chapter.city ? (
                          <span className="font-medium text-muted-foreground">
                            {" "}
                            · {preview.chapter.city}
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        President <span className="font-medium text-foreground">{preview.president.name}</span>
                        {preview.president.email ? ` · ${preview.president.email}` : ""}
                        {preview.president.phone ? ` · ${preview.president.phone}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="Members" value={String(preview.summary.members)} icon={Users} tone="blue" />
                    <StatTile
                      label="Funds raised"
                      value={fmtPKR(preview.summary.fundsRaised)}
                      icon={HandCoins}
                      tone="orange"
                    />
                    <StatTile
                      label="Cases pending / done"
                      value={`${preview.summary.casesPending} / ${preview.summary.casesDone}`}
                      icon={HeartPulse}
                      tone="green"
                    />
                    <StatTile
                      label="Events"
                      value={String(preview.summary.eventsTotal)}
                      icon={Building2}
                      tone="blue"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                      <p className="text-sm font-semibold text-primary">Donations</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>Verified · {fmtPKR(preview.summary.donationsVerified)}</li>
                        <li>Pending · {fmtPKR(preview.summary.donationsPending)}</li>
                        <li>Public · {fmtPKR(preview.summary.publicDonations)}</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                      <p className="text-sm font-semibold text-accent">Doc cases</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>Pending · {preview.summary.docPending}</li>
                        <li>Running · {preview.summary.docRunning}</li>
                        <li>Complete · {preview.summary.docComplete}</li>
                      </ul>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4">
                      <p className="text-sm font-semibold text-foreground">Team</p>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <li>Accounts · {preview.summary.teamAccounts}</li>
                        <li>Active members · {preview.summary.activeMembers}</li>
                        <li className="capitalize">Status · {preview.chapter.status || "—"}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : orgTotals ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3 rounded-2xl border border-accent/20 bg-gradient-to-r from-accent/[0.08] to-primary/[0.05] p-5">
                    <img src={logoAsset} alt="" className="h-12 w-12 object-contain" />
                    <div>
                      <p className="font-semibold">Organization overview</p>
                      <p className="text-sm text-muted-foreground">
                        {orgCount} chapter{orgCount === 1 ? "" : "s"} · PDF includes every chapter
                        section
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <StatTile label="Chapters" value={String(orgTotals.chapters)} icon={Building2} />
                    <StatTile label="Members" value={String(orgTotals.members)} icon={Users} />
                    <StatTile
                      label="Funds raised"
                      value={fmtPKR(orgTotals.fundsRaised)}
                      icon={HandCoins}
                      tone="orange"
                    />
                    <StatTile
                      label="Cases P / D"
                      value={`${orgTotals.casesPending} / ${orgTotals.casesDone}`}
                      icon={HeartPulse}
                      tone="green"
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
                      <p className="font-semibold text-primary">Donations</p>
                      <p className="mt-2 text-muted-foreground">
                        Verified {fmtPKR(orgTotals.donationsVerified)}
                      </p>
                      <p className="text-muted-foreground">
                        Pending {fmtPKR(orgTotals.donationsPending)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
                      <p className="font-semibold text-accent">Doc cases</p>
                      <p className="mt-2 text-muted-foreground">Pending {orgTotals.docPending}</p>
                      <p className="text-muted-foreground">
                        Running {orgTotals.docRunning} · Complete {orgTotals.docComplete}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-4 text-sm">
                      <p className="font-semibold">Events</p>
                      <p className="mt-2 text-muted-foreground">{orgTotals.eventsTotal} total</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="py-20 text-center text-sm text-muted-foreground">No report data yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
