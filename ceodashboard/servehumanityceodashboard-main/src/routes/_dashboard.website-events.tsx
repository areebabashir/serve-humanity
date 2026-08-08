import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { api, ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/_dashboard/website-events")({
  head: () => ({ meta: [{ title: "Website Events — Serve Humanity" }] }),
  component: WebsiteEventsPage,
});

type WebsiteEventRow = {
  _id: string;
  title: string;
  date: string;
  location: string;
  capacity?: string;
  description?: string;
  published?: boolean;
  chapter?: { _id: string; name?: string; city?: string } | null;
};

type RegistrationRow = {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  note?: string;
  status: string;
  createdAt: string;
};

const emptyForm = {
  title: "",
  date: "",
  location: "",
  capacity: "",
  description: "",
  published: true,
};

function toDateInput(iso: string) {
  try {
    return new Date(iso).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

function WebsiteEventsPage() {
  const [rows, setRows] = useState<WebsiteEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [regsOpen, setRegsOpen] = useState(false);
  const [regs, setRegs] = useState<RegistrationRow[]>([]);
  const [regsTitle, setRegsTitle] = useState("");
  const [regsLoading, setRegsLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: WebsiteEventRow[] }>("/website-events");
      setRows(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEdit(row: WebsiteEventRow) {
    setEditingId(row._id);
    setForm({
      title: row.title || "",
      date: toDateInput(row.date),
      location: row.location || "",
      capacity: row.capacity || "",
      description: row.description || "",
      published: row.published !== false,
    });
    setFormOpen(true);
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const body = {
        title: form.title.trim(),
        date: form.date,
        location: form.location.trim(),
        capacity: form.capacity.trim(),
        description: form.description.trim(),
        published: form.published,
      };
      if (editingId) {
        await api(`/website-events/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
        toast.success("Event updated");
      } else {
        await api("/website-events", {
          method: "POST",
          body: JSON.stringify(body),
        });
        toast.success("Event created");
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this event and its registrations?")) return;
    try {
      await api(`/website-events/${id}`, { method: "DELETE" });
      toast.success("Event deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    }
  }

  async function openRegs(row: WebsiteEventRow) {
    setRegsTitle(row.title);
    setRegsOpen(true);
    setRegsLoading(true);
    try {
      const res = await api<{ success: true; data: RegistrationRow[] }>(
        `/website-events/${row._id}/registrations`,
      );
      setRegs(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load registrations");
      setRegs([]);
    } finally {
      setRegsLoading(false);
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Website Events"
        description="Events shown on the public Events page and home preview. Visitors can register from the website."
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add event
          </Button>
        }
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No website events yet. Add one to show on /events.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <article
              key={row._id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{row.title}</h3>
                  <Badge variant={row.published !== false ? "default" : "secondary"}>
                    {row.published !== false ? "Published" : "Draft"}
                  </Badge>
                  {row.chapter?.name ? (
                    <Badge variant="outline">{row.chapter.name}</Badge>
                  ) : (
                    <Badge variant="outline">Org-wide</Badge>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {new Date(row.date).toLocaleDateString()} · {row.location}
                  {row.capacity ? ` · ${row.capacity}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => void openRegs(row)}>
                  <Users className="h-4 w-4" /> Registrations
                </Button>
                <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void remove(row._id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit event" : "Add event"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSave} className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Date</Label>
                <Input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div>
                <Label>Location</Label>
                <Input
                  required
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Capacity (e.g. 3,000 meals)</Label>
              <Input
                value={form.capacity}
                onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
              />
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="published">Published on website</Label>
              <Switch
                id="published"
                checked={form.published}
                onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
              />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Saving…
                </>
              ) : (
                "Save event"
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={regsOpen} onOpenChange={setRegsOpen}>
        <DialogContent className="max-w-lg sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Registrations — {regsTitle}</DialogTitle>
          </DialogHeader>
          {regsLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading…
            </div>
          ) : regs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No registrations yet.</p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {regs.map((r) => (
                <div key={r._id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.email}
                    {r.phone ? ` · ${r.phone}` : ""}
                  </div>
                  {r.note ? <p className="mt-1 text-xs">{r.note}</p> : null}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
