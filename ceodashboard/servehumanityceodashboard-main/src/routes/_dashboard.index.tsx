import { createFileRoute } from "@tanstack/react-router";
import {
  Building2,
  Users,
  HandCoins,
  ClipboardCheck,
  HeartPulse,
  Calendar,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

import { PageHeader, PageShell, KpiCard } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  activityFeed,
  alerts,
  chapters,
  donationTrend,
  fmtPKR,
  kpis,
} from "@/lib/mock-data";

export const Route = createFileRoute("/_dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview — Serve Humanity CEO Dashboard" },
      { name: "description", content: "Organization-wide command center for Serve Humanity leadership." },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const leaderboard = [...chapters]
    .sort((a, b) => b.fundsRaised - a.fundsRaised)
    .slice(0, 6);

  return (
    <PageShell>
      <PageHeader
        title="Good morning, Dr. Ahsan"
        description="Here's the pulse of every Serve Humanity chapter today."
        actions={
          <>
            <Button variant="outline">Export</Button>
            <Button style={{ background: "var(--gradient-brand)" }} className="text-white border-0">
              Weekly briefing
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Total Chapters" value={String(kpis.totalChapters)} delta="+2 this quarter" icon={Building2} accent="blue" />
        <KpiCard label="Members / Volunteers" value={`${kpis.totalMembers.toLocaleString()} / ${kpis.totalVolunteers.toLocaleString()}`} delta="+184 this month" icon={Users} accent="orange" />
        <KpiCard label="Donations (MTD)" value={fmtPKR(kpis.donationsMonth)} delta={`YTD ${fmtPKR(kpis.donationsYTD)}`} icon={HandCoins} accent="gradient" />
        <KpiCard label="Active Cases" value={String(kpis.activeCases)} delta={`${kpis.pendingVerifications} awaiting CEO`} icon={HeartPulse} accent="green" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold">Donations vs Expenses</h2>
              <p className="text-xs text-muted-foreground">Organization-wide, last 12 months</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3" /> +14.2% MoM
            </Badge>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={donationTrend}>
                <defs>
                  <linearGradient id="gDon" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-blue)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-blue)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gExp" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1_000_000}M`} />
                <Tooltip
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => fmtPKR(v)}
                />
                <Area type="monotone" dataKey="donations" stroke="var(--brand-blue)" strokeWidth={2} fill="url(#gDon)" />
                <Area type="monotone" dataKey="expenses" stroke="var(--brand-orange)" strokeWidth={2} fill="url(#gExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold">Alerts</h2>
              <p className="text-xs text-muted-foreground">Items needing your attention</p>
            </div>
            <AlertTriangle className="h-4 w-4 text-accent" />
          </div>
          <ul className="space-y-3">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/60 p-3">
                <span
                  className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                    a.severity === "danger" ? "bg-destructive" : "bg-[color:var(--warning)]"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.chapter}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> {kpis.upcomingEvents} upcoming events
            </span>
            <Button variant="link" size="sm" className="h-auto p-0 text-primary">View all</Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold">Chapter leaderboard</h2>
              <p className="text-xs text-muted-foreground">Ranked by funds raised YTD</p>
            </div>
            <Button variant="ghost" size="sm">View all chapters</Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chapter</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead className="text-right">Cases</TableHead>
                <TableHead className="text-right">Events</TableHead>
                <TableHead className="text-right">Funds Raised</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground">{c.city} • {c.president}</div>
                  </TableCell>
                  <TableCell className="text-right">{c.members}</TableCell>
                  <TableCell className="text-right">{c.casesClosed}</TableCell>
                  <TableCell className="text-right">{c.events}</TableCell>
                  <TableCell className="text-right font-medium">{fmtPKR(c.fundsRaised)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Live activity</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success)] animate-pulse" />
              Real-time
            </span>
          </div>
          <ol className="relative space-y-4 border-l border-border/70 pl-4">
            {activityFeed.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-primary" />
                <p className="text-sm leading-tight">{a.text}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.meta}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </PageShell>
  );
}