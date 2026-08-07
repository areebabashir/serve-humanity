import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { HeartHandshake, Loader2, Send, Trash2, UserMinus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

type ThemeOption = {
  id: string;
  label: string;
  icon: string;
  eyebrow: string;
};

const FALLBACK_THEMES: ThemeOption[] = [
  { id: "heart", label: "Donate / Heart", icon: "❤️", eyebrow: "Compassion in action" },
  { id: "food", label: "Food & Ration", icon: "🍽️", eyebrow: "Feed a family" },
  { id: "medical", label: "Medical care", icon: "🩺", eyebrow: "Health & healing" },
  { id: "education", label: "Education", icon: "📚", eyebrow: "Hope through learning" },
  { id: "event", label: "Event invite", icon: "📅", eyebrow: "Join us" },
  { id: "update", label: "Field update", icon: "✨", eyebrow: "From the field" },
  { id: "gratitude", label: "Thank you", icon: "🤲", eyebrow: "With gratitude" },
];

function NewsletterPage() {
  const [tab, setTab] = useState("compose");
  const [status, setStatus] = useState("active");
  const [rows, setRows] = useState<SubscriberRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sendingReminders, setSendingReminders] = useState(false);

  const [themes, setThemes] = useState<ThemeOption[]>(FALLBACK_THEMES);
  const [theme, setTheme] = useState("heart");
  const [eyebrow, setEyebrow] = useState(FALLBACK_THEMES[0].eyebrow);
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [ctaLabel, setCtaLabel] = useState("Donate now");
  const [ctaUrl, setCtaUrl] = useState("");
  const [sendingCompose, setSendingCompose] = useState(false);

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

  useEffect(() => {
    void api<{ success: true; data: ThemeOption[] }>("/newsletter/themes")
      .then((res) => {
        if (res.data?.length) setThemes(res.data);
      })
      .catch(() => {
        /* keep fallbacks */
      });
  }, []);

  function onThemeChange(id: string) {
    setTheme(id);
    const t = themes.find((x) => x.id === id) || FALLBACK_THEMES.find((x) => x.id === id);
    if (t) setEyebrow(t.eyebrow);
  }

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

  async function onComposeSend(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    if (
      !confirm(
        `Send this newsletter to all active subscribers? Theme: ${themes.find((t) => t.id === theme)?.label || theme}`,
      )
    ) {
      return;
    }
    setSendingCompose(true);
    try {
      const res = await api<{
        success: true;
        message?: string;
        data: { sent: number; failed: number; candidateCount: number; subject: string };
      }>("/newsletter/compose-send", {
        method: "POST",
        body: JSON.stringify({
          theme,
          eyebrow: eyebrow.trim() || undefined,
          title: title.trim(),
          body: body.trim(),
          subject: subject.trim() || undefined,
          ctaLabel: ctaLabel.trim() || undefined,
          ctaUrl: ctaUrl.trim() || undefined,
        }),
      });
      toast.success(res.message || `Sent to ${res.data?.sent ?? 0} subscribers`);
      if (res.data?.failed) {
        toast.error(`${res.data.failed} email(s) failed — check SMTP`);
      }
      setTitle("");
      setBody("");
      setSubject("");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to send newsletter");
    } finally {
      setSendingCompose(false);
    }
  }

  const selectedTheme = themes.find((t) => t.id === theme) || FALLBACK_THEMES[0];

  return (
    <PageShell>
      <PageHeader
        title="Newsletter"
        description="Compose custom emails with different icons/themes, or send the standard donation reminder."
        actions={
          <Button onClick={() => void sendReminders()} disabled={sendingReminders} variant="outline">
            {sendingReminders ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              <>
                <HeartHandshake className="h-4 w-4" /> Quick donation reminder
              </>
            )}
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="mt-4">
          <form
            onSubmit={onComposeSend}
            className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="grid gap-1.5">
              <Label>Icon / theme</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onThemeChange(t.id)}
                    className={`rounded-xl border px-3 py-3 text-left transition ${
                      theme === t.id
                        ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="text-2xl leading-none">{t.icon}</div>
                    <div className="mt-1.5 text-xs font-medium">{t.label}</div>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Selected: {selectedTheme.icon} {selectedTheme.label}
              </p>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="nl-eyebrow">Small label (eyebrow)</Label>
              <Input
                id="nl-eyebrow"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
                placeholder="e.g. From the field"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="nl-subject">Email subject (optional)</Label>
              <Input
                id="nl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Defaults to the title"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="nl-title">Headline</Label>
              <Input
                id="nl-title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Your kindness feeds a family tonight"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="nl-body">Message</Label>
              <Textarea
                id="nl-body"
                required
                rows={6}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write your newsletter message…"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="nl-cta-label">Button text (optional)</Label>
                <Input
                  id="nl-cta-label"
                  value={ctaLabel}
                  onChange={(e) => setCtaLabel(e.target.value)}
                  placeholder="Donate now"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="nl-cta-url">Button link (optional)</Label>
                <Input
                  id="nl-cta-url"
                  type="url"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://yoursite.com/donate"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={sendingCompose}>
                {sendingCompose ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Send to subscribers
                  </>
                )}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="subscribers" className="mt-4">
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
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
