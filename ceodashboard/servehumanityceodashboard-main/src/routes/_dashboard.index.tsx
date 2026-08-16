import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  Users,
  HandCoins,
  HeartPulse,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ArrowUpRight,
  Sparkles,
  CircleDot,
  FileText,
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

import { PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_dashboard/")({
  head: () => ({
    meta: [
      { title: "Overview — Serve Humanity CEO Dashboard" },
      {
        name: "description",
        content: "Organization-wide command center for Serve Humanity leadership.",
      },
    ],
  }),
  component: OverviewPage,
});

type OverviewData = {
  kpis: {
    totalChapters: number;
    activeChapters: number;
    totalMembers: number;
    totalVolunteers: number;
    totalPeople: number;
    activeAccounts: number;
    people: {
      ceo: number;
      bog: number;
      presidents: number;
      directors: number;
      members: number;
      volunteers: number;
      activeAccounts: number;
      total: number;
    };
    donationsMTD: number;
    donationsYTD: number;
    activeCases: number;
    pendingCeoCases: number;
    pendingDocCases: number;
    runningDocCases: number;
    completeDocCases: number;
    upcomingEvents: number;
    unreadContact: number;
    pendingReviews: number;
    newsletterSubscribers: number;
    unreadNotifications: number;
    expensesAwaitingCeo: number;
  };
  trend: { month: string; donations: number; membersJoined: number }[];
  momPct: number;
  chapters: { id: string; name: string; city: string }[];
  alerts: {
    id: string;
    severity: "danger" | "warning";
    title: string;
    chapter: string;
    href?: string;
  }[];
  leaderboard: {
    id: string;
    name: string;
    city: string;
    president: string;
    members: number;
    casesClosed: number;
    events: number;
    fundsRaised: number;
    status: string;
    imageUrl?: string;
  }[];
  activity: { id: string; type: string; text: string; meta: string }[];
};

type TrendPoint = { month: string; label?: string; donations: number; membersJoined: number };

type TrendData = {
  mode: "monthly" | "daily";
  month: string;
  chapter: string;
  points: TrendPoint[];
  momPct?: number;
  totals: { donations: number; membersJoined: number };
};

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function last12MonthOptions() {
  const out: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push({ value, label: `${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}` });
  }
  return out;
}

function fmtPKR(n: number) {
  if (!n || n <= 0) return "PKR 0";
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `PKR ${(n / 100_000).toFixed(2)} Lac`;
  return `PKR ${n.toLocaleString()}`;
}

function greetingFor(name: string) {
  const hour = new Date().getHours();
  const hello =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = name?.trim().split(/\s+/)[0] || "there";
  return `${hello}, ${first}`;
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function OverviewKpi({
  label,
  value,
  delta,
  icon: Icon,
  accent,
  href,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: "blue" | "orange" | "green" | "gradient";
  href?: string;
}) {
  const accents = {
    blue: {
      bar: "from-[var(--brand-blue)] to-[var(--brand-blue-mid)]",
      icon: "bg-primary/10 text-primary",
      glow: "bg-primary/5",
    },
    orange: {
      bar: "from-[var(--brand-orange)] to-[var(--brand-orange-deep)]",
      icon: "bg-accent/15 text-accent",
      glow: "bg-accent/5",
    },
    green: {
      bar: "from-[var(--success)] to-emerald-400",
      icon: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
      glow: "bg-[color:var(--success)]/5",
    },
    gradient: {
      bar: "from-[var(--brand-blue)] via-[var(--brand-blue-mid)] to-[var(--brand-orange)]",
      icon: "text-white",
      glow: "bg-primary/5",
    },
  } as const;
  const a = accents[accent];
  const body = (
    <div className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-elevated)]">
      <div className={cn("pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl", a.glow)} />
      <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r", a.bar)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 truncate text-2xl font-bold tracking-tight text-foreground sm:text-[1.65rem]">
            {value}
          </p>
          {delta ? (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{delta}</p>
          ) : null}
        </div>
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl shadow-sm transition group-hover:scale-105",
            a.icon,
          )}
          style={accent === "gradient" ? { background: "var(--gradient-brand)" } : undefined}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {href ? (
        <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition group-hover:opacity-100">
          Open <ArrowUpRight className="h-3 w-3" />
        </span>
      ) : null}
    </div>
  );
  if (href) {
    return (
      <Link to={href} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

function OverviewPage() {
  const { user } = useAuth();
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chapterFilter, setChapterFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [trendMomPct, setTrendMomPct] = useState(0);
  const [trendMode, setTrendMode] = useState<"monthly" | "daily">("monthly");
  const [trendLoading, setTrendLoading] = useState(false);

  const monthOptions = useMemo(() => last12MonthOptions(), []);

  const loadTrend = useCallback(async (chapter: string, month: string) => {
    setTrendLoading(true);
    try {
      const qs = new URLSearchParams();
      if (chapter && chapter !== "all") qs.set("chapter", chapter);
      if (month && month !== "all") qs.set("month", month);
      const q = qs.toString();
      const res = await api<{ success: true; data: TrendData }>(
        `/dashboard/trend${q ? `?${q}` : ""}`,
      );
      setTrend(res.data.points || []);
      setTrendMode(res.data.mode);
      setTrendMomPct(res.data.momPct ?? 0);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load chart");
    } finally {
      setTrendLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: OverviewData }>("/dashboard/overview");
      setData(res.data);
      setTrend(res.data.trend || []);
      setTrendMomPct(res.data.momPct ?? 0);
      setTrendMode("monthly");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load overview");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data) return;
    if (chapterFilter === "all" && monthFilter === "all") {
      setTrend(data.trend || []);
      setTrendMomPct(data.momPct ?? 0);
      setTrendMode("monthly");
      return;
    }
    void loadTrend(chapterFilter, monthFilter);
  }, [chapterFilter, monthFilter, data, loadTrend]);

  const kpis = data?.kpis;
  const chapters = data?.chapters || [];
  const alerts = data?.alerts || [];
  const leaderboard = data?.leaderboard || [];
  const activity = data?.activity || [];
  const momPct = trendMomPct;
  const maxFunds = Math.max(...leaderboard.map((c) => c.fundsRaised || 0), 1);

  const chartSubtitle =
    chapterFilter === "all" && monthFilter === "all"
      ? "Organization-wide · last 12 months"
      : [
          chapterFilter === "all"
            ? "All chapters"
            : chapters.find((c) => c.id === chapterFilter)?.name || "Chapter",
          monthFilter === "all"
            ? "last 12 months"
            : monthOptions.find((m) => m.value === monthFilter)?.label || monthFilter,
        ].join(" · ");

  const docTotal =
    (kpis?.pendingDocCases ?? 0) +
    (kpis?.runningDocCases ?? 0) +
    (kpis?.completeDocCases ?? 0);

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[var(--shadow-card)]">
        <div
          className="absolute inset-0 opacity-[0.92]"
          style={{ background: "var(--gradient-brand)" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between sm:p-7">
          <div className="text-white">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              Serve Humanity command center
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {greetingFor(user?.name || "")}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-white/80">
              Live pulse across chapters — donations, cases, people, and alerts in one place.
            </p>
            <p className="mt-3 text-xs text-white/65">{todayLabel()}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
              Live data
            </span>
            <Button
              variant="secondary"
              className="bg-white text-foreground hover:bg-white/90"
              onClick={() => {
                void load().then(() => {
                  if (chapterFilter !== "all" || monthFilter !== "all") {
                    void loadTrend(chapterFilter, monthFilter);
                  }
                });
              }}
              disabled={loading || trendLoading}
            >
              {loading || trendLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </section>

      {loading && !data ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading overview…
        </div>
      ) : !data ? (
        <p className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Could not load overview. Check that the backend is running, then refresh.
        </p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewKpi
              label="Total Chapters"
              value={String(kpis?.totalChapters ?? 0)}
              delta={`${kpis?.activeChapters ?? 0} active chapters`}
              icon={Building2}
              accent="blue"
              href="/chapters"
            />
            <OverviewKpi
              label="Active accounts"
              value={(kpis?.activeAccounts ?? kpis?.people?.activeAccounts ?? 0).toLocaleString()}
              delta="All joined accounts (active)"
              icon={Users}
              accent="orange"
              href="/roles"
            />
            <OverviewKpi
              label="Donations (MTD)"
              value={fmtPKR(kpis?.donationsMTD ?? 0)}
              delta={`YTD ${fmtPKR(kpis?.donationsYTD ?? 0)}`}
              icon={HandCoins}
              accent="gradient"
              href="/finance"
            />
            <OverviewKpi
              label="Doc cases"
              value={String(docTotal)}
              delta="Health, fee, marriage & ration"
              icon={HeartPulse}
              accent="green"
              href="/documentation/cases"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Donations vs Members joined</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">{chartSubtitle}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-[var(--brand-blue)]" /> Donations
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <span className="h-2 w-2 rounded-full bg-[var(--brand-orange)]" /> Members joined
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select value={chapterFilter} onValueChange={setChapterFilter}>
                    <SelectTrigger className="h-8 w-[150px] rounded-lg bg-background text-xs">
                      <SelectValue placeholder="Chapter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All chapters</SelectItem>
                      {chapters.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={monthFilter} onValueChange={setMonthFilter}>
                    <SelectTrigger className="h-8 w-[130px] rounded-lg bg-background text-xs">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All months</SelectItem>
                      {monthOptions.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {trendMode === "monthly" ? (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "gap-1 rounded-full",
                        momPct >= 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700",
                      )}
                    >
                      <TrendingUp className="h-3 w-3" />
                      {momPct >= 0 ? "+" : ""}
                      {momPct}% MoM
                    </Badge>
                  ) : null}
                </div>
              </div>
              <div className="relative h-72 rounded-xl bg-gradient-to-b from-muted/40 to-transparent p-2">
                {trendLoading ? (
                  <div className="absolute inset-0 z-10 grid place-items-center rounded-xl bg-card/70 backdrop-blur-[1px]">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : null}
                {trend.every((t) => t.donations === 0 && (t.membersJoined || 0) === 0) ? (
                  <div className="grid h-full place-items-center text-sm text-muted-foreground">
                    No donation or member join data for this filter.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trend}>
                      <defs>
                        <linearGradient id="gDon" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="var(--brand-blue)" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="var(--brand-blue)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gMembers" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis
                        dataKey="month"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        interval={trendMode === "daily" ? 4 : 0}
                      />
                      <YAxis
                        yAxisId="donations"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) =>
                          v >= 1_000_000
                            ? `${(v / 1_000_000).toFixed(1)}M`
                            : `${Math.round(v / 1000)}K`
                        }
                      />
                      <YAxis
                        yAxisId="members"
                        orientation="right"
                        stroke="var(--muted-foreground)"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--card)",
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          fontSize: 12,
                          boxShadow: "var(--shadow-elevated)",
                        }}
                        labelFormatter={(_, payload) =>
                          (payload?.[0]?.payload as TrendPoint | undefined)?.label || ""
                        }
                        formatter={(v: number, name: string) =>
                          name === "membersJoined" || name === "Members joined"
                            ? [v, "Members joined"]
                            : [fmtPKR(v), "Donations"]
                        }
                      />
                      <Area
                        yAxisId="donations"
                        type="monotone"
                        dataKey="donations"
                        name="Donations"
                        stroke="var(--brand-blue)"
                        strokeWidth={2.5}
                        fill="url(#gDon)"
                      />
                      <Area
                        yAxisId="members"
                        type="monotone"
                        dataKey="membersJoined"
                        name="Members joined"
                        stroke="var(--brand-orange)"
                        strokeWidth={2.5}
                        fill="url(#gMembers)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Alerts</h2>
                  <p className="text-xs text-muted-foreground">Needs your attention</p>
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 text-accent">
                  <AlertTriangle className="h-4 w-4" />
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-2.5 overflow-auto">
                {alerts.length === 0 ? (
                  <div className="grid h-full min-h-[140px] place-items-center rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                    You’re caught up — no alerts right now.
                  </div>
                ) : (
                  alerts.map((a) => (
                    <Link
                      key={a.id}
                      to={a.href || "/"}
                      className="flex items-start gap-3 rounded-xl border border-border/70 bg-gradient-to-r from-background to-muted/20 p-3 transition hover:border-primary/30 hover:shadow-sm"
                    >
                      <span
                        className={cn(
                          "mt-1.5 h-2 w-2 shrink-0 rounded-full ring-4",
                          a.severity === "danger"
                            ? "bg-destructive ring-destructive/15"
                            : "bg-[color:var(--warning)] ring-[color:var(--warning)]/15",
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-snug">{a.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{a.chapter}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/70 pt-4 text-xs">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  {kpis?.upcomingEvents ?? 0} upcoming events
                </span>
                <Button asChild variant="link" size="sm" className="h-auto p-0 text-primary">
                  <Link to="/website-events">View events</Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[var(--shadow-card)] lg:col-span-2">
              <div className="flex items-center justify-between border-b border-border/80 bg-gradient-to-r from-primary/[0.04] to-transparent px-5 py-4">
                <div>
                  <h2 className="text-base font-semibold tracking-tight">Chapter leaderboard</h2>
                  <p className="text-xs text-muted-foreground">Ranked by funds raised</p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-full">
                  <Link to="/chapters">
                    View all <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
              {leaderboard.length === 0 ? (
                <p className="p-8 text-sm text-muted-foreground">No chapters yet.</p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {leaderboard.map((c, i) => (
                    <li
                      key={c.id}
                      className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-muted/30"
                    >
                      <span
                        className={cn(
                          "grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold",
                          i === 0
                            ? "bg-amber-100 text-amber-800"
                            : i === 1
                              ? "bg-slate-100 text-slate-700"
                              : i === 2
                                ? "bg-orange-100 text-orange-800"
                                : "bg-muted text-muted-foreground",
                        )}
                      >
                        {i + 1}
                      </span>
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt=""
                          className="h-11 w-14 shrink-0 rounded-lg border border-border object-cover"
                        />
                      ) : (
                        <div className="grid h-11 w-14 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                          <Building2 className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-medium">{c.name}</p>
                          <Badge variant="outline" className="hidden capitalize sm:inline-flex">
                            {c.status}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {c.city} · {c.president}
                        </p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[var(--brand-blue)] to-[var(--brand-orange)] transition-all"
                            style={{
                              width: `${Math.max(4, Math.round(((c.fundsRaised || 0) / maxFunds) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold tabular-nums">{fmtPKR(c.fundsRaised)}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {c.members} mem · {c.casesClosed} cases
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold tracking-tight">Live activity</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </span>
              </div>
              {activity.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent activity yet.</p>
              ) : (
                <ol className="relative space-y-4 border-l-2 border-primary/15 pl-4">
                  {activity.map((a) => (
                    <li key={a.id} className="relative">
                      <span className="absolute -left-[23px] top-1 grid h-4 w-4 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-sm">
                        <CircleDot className="h-2.5 w-2.5" />
                      </span>
                      <p className="text-sm font-medium leading-snug">{a.text}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{a.meta}</p>
                    </li>
                  ))}
                </ol>
              )}
              {(kpis?.unreadContact || kpis?.pendingReviews || kpis?.unreadNotifications) ? (
                <div className="mt-5 space-y-2 border-t border-border/70 pt-4">
                  {kpis?.unreadNotifications ? (
                    <Link
                      to="/notifications"
                      className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs transition hover:bg-muted"
                    >
                      <span className="text-muted-foreground">Notifications</span>
                      <Badge variant="secondary">{kpis.unreadNotifications}</Badge>
                    </Link>
                  ) : null}
                  {kpis?.unreadContact ? (
                    <Link
                      to="/contact-messages"
                      className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs transition hover:bg-muted"
                    >
                      <span className="text-muted-foreground">Contact messages</span>
                      <Badge variant="secondary">{kpis.unreadContact}</Badge>
                    </Link>
                  ) : null}
                  {kpis?.pendingReviews ? (
                    <Link
                      to="/reviews"
                      className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-xs transition hover:bg-muted"
                    >
                      <span className="text-muted-foreground">Pending reviews</span>
                      <Badge variant="secondary">{kpis.pendingReviews}</Badge>
                    </Link>
                  ) : null}
                </div>
              ) : (
                <div className="mt-5 flex items-center gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Inbox is clear
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </PageShell>
  );
}
