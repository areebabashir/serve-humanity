import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Loader2, MailOpen } from "lucide-react";
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

export const Route = createFileRoute("/_dashboard/contact-messages")({
  head: () => ({ meta: [{ title: "Contact Messages — Serve Humanity" }] }),
  component: ContactMessagesPage,
});

type MessageRow = {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
};

function ContactMessagesPage() {
  const [status, setStatus] = useState<string>("new");
  const [rows, setRows] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = status === "all" ? "" : `?status=${encodeURIComponent(status)}`;
      const res = await api<{ success: true; data: MessageRow[] }>(`/contact${q}`);
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markRead(id: string) {
    setBusyId(id);
    try {
      await api(`/contact/${id}/read`, { method: "PATCH" });
      toast.success("Marked as read");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Contact Messages"
        description="Messages submitted from the public Contact form."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="read">Read</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
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
          No messages in this filter.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((m) => (
            <article key={m._id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{m.subject}</h3>
                    <Badge variant={m.status === "new" ? "default" : "secondary"}>{m.status}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {m.name} · {m.email} · {new Date(m.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{m.message}</p>
                </div>
                {m.status === "new" ? (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busyId === m._id}
                    onClick={() => void markRead(m._id)}
                  >
                    <MailOpen className="h-4 w-4" /> Mark read
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}
