import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { HandCoins, FileSpreadsheet, Loader2, Wallet } from "lucide-react";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { FINANCE_NAV, type FinanceType } from "@/lib/finance";
import { api, ApiRequestError } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_dashboard/finance/")({
  head: () => ({ meta: [{ title: "Finance — Serve Humanity" }] }),
  component: FinanceHubPage,
});

const ICONS: Record<FinanceType, typeof Wallet> = {
  monthly_donation: HandCoins,
  case: FileSpreadsheet,
};

function FinanceHubPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ success: true; data: Record<string, number> }>("/finance-files/stats");
        setStats(res.data);
      } catch (err) {
        toast.error(err instanceof ApiRequestError ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = FINANCE_NAV.filter((n) => n.type !== "hub");

  return (
    <PageShell>
      <PageHeader
        title="Finance"
        description="BOG Finance Head and chapter Finance Head can view and edit all Finance team files. Directors, Assistant Directors, and General Members can create files."
      />
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading counts…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item) => {
            const Icon = ICONS[item.type as FinanceType] ?? Wallet;
            const count = stats[item.type as FinanceType] ?? 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">{count}</span>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
