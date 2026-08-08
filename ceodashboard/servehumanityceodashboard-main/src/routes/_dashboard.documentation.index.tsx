import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { DOC_NAV, type DocType } from "@/lib/documentation";
import { api, ApiRequestError } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/_dashboard/documentation/")({
  head: () => ({ meta: [{ title: "Documentation — Serve Humanity" }] }),
  component: DocsHubPage,
});

function DocsHubPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        const res = await api<{ success: true; data: Record<string, number> }>("/documentation/stats");
        setStats(res.data);
      } catch (err) {
        toast.error(err instanceof ApiRequestError ? err.message : "Failed to load stats");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const items = DOC_NAV.filter((n) => n.type !== "hub");

  return (
    <PageShell>
      <PageHeader
        title="Documentation"
        description="BOG Documentation Head can view and edit documentation across all chapters."
      />
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading counts…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const count =
              item.type === "cases"
                ? (stats.health || 0) +
                  (stats.marriage || 0) +
                  (stats.fee || 0) +
                  (stats.ration || 0)
                : stats[item.type as DocType] ?? 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="h-5 w-5" />
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
