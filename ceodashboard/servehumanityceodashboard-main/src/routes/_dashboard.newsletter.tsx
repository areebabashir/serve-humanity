import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { HeartHandshake, Loader2, Trash2, UserMinus } from "lucide-react";
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

export const Route = createFileRoute("/_dashboard/newsletter")({
  head: () => ({ meta: [{ title: "Newsletter — Serve Humanity" }] }),
  component: NewsletterPage,
});

type SubscriberRow = {
  _id: string;
  email: string;
  source?: string;
  isActive?: boolean;
  createdAt: string;
  lastDonationReminderAt?: string | null;
};

function NewsletterPage() {
  const [status, setStatus] = useState("active");
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = status === "all" ? "?status=all" : `?status=${encodeURIComponent(status)}`;
      const res = await api<{ success: true; total: number; data: SubscriberRow[] }>(
        `/newsletter${q}`,
      );
      setRows(res.data || []);
      setTotal(res.total || 0);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load subscribers");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function deactivate(id: string) {
    setBusyId(id);
    try {
      await api(`/newsletter/${id}/unsubscribe`, { method: "PATCH" });
      toast.success("Marked inactive");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    if (!confirm("Permanently delete this subscriber?")) return;
    setBusyId(id);
    try {
      await api(`/newsletter/${id}`, { method: "DELETE" });
      toast.success("Subscriber deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function sendReminders() {
    if (
      !confirm(
        "Send a donation reminder email to all active subscribers now? (SMTP must be configured.)",
      )
    ) {
      return;
    }
    setSendingReminders(true);
    try {
      const res = await api<{
        success: true;
        message?: string;
        data: { sent: number; failed: number; candidateCount: number; intervalDays: number };
      }>("/newsletter/send-donation-reminders", {
        method: "POST",
        body: JSON.stringify({ force: true }),
      });
      toast.success(
        res.message ||
          `Sent ${res.data?.sent ?? 0} of ${res.data?.candidateCount ?? 0} reminders`,
      );
      if (res.data?.failed) {
        toast.error(`${res.data.failed} email(s) failed — check SMTP settings`);
      }
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to send reminders");
    } finally {
      setSendingReminders(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Newsletter"
        description="Subscribers get occasional donation reminders automatically. You can also send one now."
        actions={
          <Button onClick={() => void sendReminders()} disabled={sendingReminders}>
            {sendingReminders ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <HeartHandshake className="h-4 w-4" /> Send donation reminders
              </>
            )}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
          Refresh
        </Button>
        <span className="text-xs text-muted-foreground">{total} total</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No subscribers in this filter yet.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((s) => (
            <article
              key={s._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{s.email}</p>
                  <Badge variant={s.isActive !== false ? "default" : "secondary"}>
                    {s.isActive !== false ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {s.source || "footer"} · joined {new Date(s.createdAt).toLocaleString()}
                  {s.lastDonationReminderAt
                    ? ` · last reminder ${new Date(s.lastDonationReminderAt).toLocaleDateString()}`
                    : " · no reminder yet"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {s.isActive !== false ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === s._id}
                    onClick={() => void deactivate(s._id)}
                  >
                    <UserMinus className="h-4 w-4" />
                    Deactivate
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={busyId === s._id}
                  onClick={() => void remove(s._id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
