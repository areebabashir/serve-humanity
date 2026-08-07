import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { isFullAccessRole } from "@/lib/roles";
import {
  AUDIENCE_LABELS,
  clearSentHistory,
  createNotification,
  deleteSentNotification,
  dismissNotification,
  fetchInbox,
  fetchSentNotifications,
  markNotificationRead,
  type InboxNotification,
  type NotificationAudience,
  type NotificationPriority,
  type SentNotification,
} from "@/lib/notifications";
import { ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/_dashboard/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Serve Humanity" }] }),
  component: NotificationsPage,
});

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function priorityVariant(p: NotificationPriority): "secondary" | "default" | "destructive" {
  if (p === "urgent") return "destructive";
  if (p === "high") return "default";
  return "secondary";
}

function NotificationsPage() {
  const { user } = useAuth();
  const isCeo = isFullAccessRole(user?.systemRole);
  const [tab, setTab] = useState(isCeo ? "compose" : "inbox");

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<NotificationAudience>("bogs");
  const [priority, setPriority] = useState<NotificationPriority>("normal");
  const [expiresAt, setExpiresAt] = useState("");
  const [sending, setSending] = useState(false);

  const [inbox, setInbox] = useState<InboxNotification[]>([]);
  const [sent, setSent] = useState<SentNotification[]>([]);
  const [loadingInbox, setLoadingInbox] = useState(true);
  const [loadingSent, setLoadingSent] = useState(false);

  async function loadInbox() {
    setLoadingInbox(true);
    try {
      setInbox(await fetchInbox());
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load inbox");
    } finally {
      setLoadingInbox(false);
    }
  }

  async function loadSent() {
    if (!isCeo) return;
    setLoadingSent(true);
    try {
      setSent(await fetchSentNotifications());
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load sent history");
    } finally {
      setLoadingSent(false);
    }
  }

  useEffect(() => {
    void loadInbox();
    if (isCeo) void loadSent();
  }, [isCeo]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Title and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await createNotification({
        title: title.trim(),
        body: body.trim(),
        audience,
        priority,
        expiresAt: expiresAt || null,
      });
      toast.success(
        `Sent to ${res.meta.recipientCount} recipients` +
          (res.meta.emailFailed ? ` (${res.meta.emailFailed} email failures)` : ""),
      );
      if (res.meta.emailFailed && res.meta.emailError) {
        toast.error(res.meta.emailError.slice(0, 180));
      }
      setTitle("");
      setBody("");
      setExpiresAt("");
      setPriority("normal");
      setAudience("bogs");
      await Promise.all([loadInbox(), loadSent()]);
      setTab("sent");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to send notification");
    } finally {
      setSending(false);
    }
  }

  async function handleMarkRead(id: string) {
    try {
      await markNotificationRead(id);
      setInbox((prev) =>
        prev.map((n) => (n._id === id ? { ...n, readAt: new Date().toISOString() } : n)),
      );
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to mark as read");
    }
  }

  async function handleDismiss(id: string) {
    try {
      await dismissNotification(id);
      setInbox((prev) => prev.filter((n) => n._id !== id));
      toast.success("Removed from your notifications");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete");
    }
  }

  async function handleDeleteSent(id: string) {
    if (!confirm("Delete this notification from sent history? Recipients will no longer see it either.")) {
      return;
    }
    try {
      await deleteSentNotification(id);
      setSent((prev) => prev.filter((n) => n._id !== id));
      setInbox((prev) => prev.filter((n) => n._id !== id));
      toast.success("Removed from history");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to delete");
    }
  }

  async function handleClearHistory() {
    if (
      !confirm(
        "Clear ALL sent notification history? This removes every notification for all users.",
      )
    ) {
      return;
    }
    try {
      const res = await clearSentHistory();
      setSent([]);
      setInbox([]);
      toast.success(res.message || "History cleared");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to clear history");
    }
  }

  return (
    <PageShell>
      <PageHeader
        title="Notifications"
        description={
          isCeo
            ? "Compose broadcasts with email delivery, review sent history, and read your inbox."
            : "Your in-app notification inbox from leadership."
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {isCeo && <TabsTrigger value="compose">Compose</TabsTrigger>}
          {isCeo && <TabsTrigger value="sent">Sent history</TabsTrigger>}
          <TabsTrigger value="inbox">My inbox</TabsTrigger>
        </TabsList>

        {isCeo && (
          <TabsContent value="compose" className="mt-4">
            <form
              onSubmit={handleSend}
              className="max-w-2xl space-y-4 rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
            >
              <div className="grid gap-1.5">
                <Label htmlFor="notif-title">Title</Label>
                <Input
                  id="notif-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Subject line for in-app and email"
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="notif-body">Message</Label>
                <Textarea
                  id="notif-body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write the full notification…"
                  rows={5}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label>Audience</Label>
                <RadioGroup
                  value={audience}
                  onValueChange={(v) => setAudience(v as NotificationAudience)}
                  className="gap-3"
                >
                  {(Object.keys(AUDIENCE_LABELS) as NotificationAudience[]).map((key) => (
                    <div key={key} className="flex items-center gap-2">
                      <RadioGroupItem value={key} id={`aud-${key}`} />
                      <Label htmlFor={`aud-${key}`} className="font-normal cursor-pointer">
                        {AUDIENCE_LABELS[key]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Priority</Label>
                  <Select
                    value={priority}
                    onValueChange={(v) => setPriority(v as NotificationPriority)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="notif-expires">Expires on (optional)</Label>
                  <Input
                    id="notif-expires"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={sending}
                  className="border-0 text-white"
                  style={{ background: "var(--gradient-brand)" }}
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send notification + email
                </Button>
              </div>
            </form>
          </TabsContent>
        )}

        {isCeo && (
          <TabsContent value="sent" className="mt-4">
            {loadingSent ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications sent yet.</p>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => void handleClearHistory()}
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear all history
                  </Button>
                </div>
                {sent.map((n) => (
                  <div
                    key={n._id}
                    className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{n.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{n.body}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={priorityVariant(n.priority)}>{n.priority}</Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void handleDeleteSent(n._id)}
                          title="Delete from history"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{AUDIENCE_LABELS[n.audience]}</span>
                      <span>
                        {n.recipientCount} recipients · {n.emailedCount} emailed
                        {n.emailFailedCount ? ` · ${n.emailFailedCount} failed` : ""}
                        {` · ${n.readCount} read`}
                      </span>
                      <span>{formatWhen(n.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        )}

        <TabsContent value="inbox" className="mt-4">
          {loadingInbox ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : inbox.length === 0 ? (
            <p className="text-sm text-muted-foreground">Your inbox is empty.</p>
          ) : (
            <div className="space-y-3">
              {inbox.map((n) => {
                const unread = !n.readAt;
                return (
                  <div
                    key={n._id}
                    className={`rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] ${
                      unread ? "border-accent/40" : "border-border"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className={`font-medium ${unread ? "" : "text-muted-foreground"}`}>
                            {n.title}
                          </p>
                          {unread && (
                            <Badge variant="secondary" className="text-[10px]">
                              Unread
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm whitespace-pre-wrap">{n.body}</p>
                      </div>
                      <Badge variant={priorityVariant(n.priority)}>{n.priority}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground">
                        {n.createdBy?.name ?? "Leadership"} · {formatWhen(n.createdAt)}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {unread && (
                          <Button size="sm" variant="outline" onClick={() => void handleMarkRead(n._id)}>
                            Mark as read
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => void handleDismiss(n._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
