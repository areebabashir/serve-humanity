import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/_dashboard/reviews")({
  head: () => ({ meta: [{ title: "Reviews — Serve Humanity" }] }),
  component: ReviewsPage,
});

type ReviewRow = {
  _id: string;
  name: string;
  role?: string;
  email?: string;
  text: string;
  stars: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

function ReviewsPage() {
  const [status, setStatus] = useState<string>("pending");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = status === "all" ? "" : `?status=${encodeURIComponent(status)}`;
      const res = await api<{ success: true; data: ReviewRow[] }>(`/reviews${q}`);
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setReviewStatus(id: string, next: "approved" | "rejected" | "pending") {
    setBusyId(id);
    try {
      await api(`/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      toast.success(
        next === "approved" ? "Review approved — now visible on the website" : `Marked ${next}`,
      );
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this review permanently?")) return;
    setBusyId(id);
    try {
      await api(`/reviews/${id}`, { method: "DELETE" });
      toast.success("Review deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Website Reviews"
        description="Visitor reviews submitted from the site. Approve to show them on the home page Voices section."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No reviews in this filter.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r._id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.name}</h3>
                    {r.role ? (
                      <span className="text-xs text-muted-foreground">{r.role}</span>
                    ) : null}
                    <Badge
                      variant={
                        r.status === "approved"
                          ? "default"
                          : r.status === "rejected"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {r.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex text-amber-500">
                    {Array.from({ length: r.stars || 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">{r.text}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString()}
                    {r.email ? ` · ${r.email}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status !== "approved" ? (
                    <Button
                      size="sm"
                      disabled={busyId === r._id}
                      onClick={() => void setReviewStatus(r._id, "approved")}
                    >
                      <Check className="h-4 w-4" /> Approve
                    </Button>
                  ) : null}
                  {r.status !== "rejected" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === r._id}
                      onClick={() => void setReviewStatus(r._id, "rejected")}
                    >
                      <X className="h-4 w-4" /> Reject
                    </Button>
                  ) : null}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={busyId === r._id}
                    onClick={() => void remove(r._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
