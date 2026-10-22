import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, MessageSquarePlus, Send } from "lucide-react";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth";
import { api, ApiRequestError } from "@/lib/api";
import {
  fetchItInbox,
  fetchItThread,
  replyItThread,
  requesterLabel,
  senderName,
  setItThreadStatus,
  startItInboxThread,
  type ItSupportScope,
  type ItSupportThread,
} from "@/lib/itSupport";
import { cn } from "@/lib/utils";

type AccountOpt = {
  _id: string;
  name: string;
  email: string;
  systemRole?: string;
  chapterRole?: string;
  chapter?: { name?: string } | string | null;
};

const DESIGNATION_LABELS: Record<string, string> = {
  ceo: "Chief Executive",
  founder: "Founder",
  cto: "Chief Technician Officer",
  coo: "Chief Operating Officer",
  bog_verification: "BOG — Verification",
  bog_operations: "BOG — Operations",
  bog_media: "BOG — Media & Website",
  bog_finance: "BOG — Finance",
  bog_documentation: "BOG — Documentation",
  bog_it: "IT Manager",
  president: "President",
  vice_president: "Vice President (Female)",
  vice_president_male: "Vice President (Male)",
  finance_head: "Cabinet — Finance",
  operations_head: "Cabinet — Operations",
  verification_head: "Cabinet — Verification",
  documentation_head: "Cabinet — Documentation",
  media_head: "Cabinet — Media & Graphics",
  director: "Director",
  assistant_director: "Assistant Director",
  member: "Member",
  public: "Public user",
};

function accountDesignation(account: AccountOpt) {
  const role =
    account.systemRole &&
    !["member", "public"].includes(account.systemRole)
      ? account.systemRole
      : account.chapterRole || account.systemRole || "member";
  return DESIGNATION_LABELS[role] || role.replace(/_/g, " ");
}

function formatWhen(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
}

export function ItInboxPage({
  scope,
  title,
  description,
}: {
  scope: ItSupportScope;
  title: string;
  description: string;
}) {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ItSupportThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [active, setActive] = useState<ItSupportThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">("open");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountOpt[]>([]);
  const [userId, setUserId] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [creating, setCreating] = useState(false);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await fetchItInbox(scope, statusFilter);
      setThreads(rows);
      if (activeId && !rows.some((r) => r._id === activeId)) {
        setActiveId(rows[0]?._id || null);
      } else if (!activeId && rows[0]) {
        setActiveId(rows[0]._id);
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [scope, statusFilter, activeId]);

  useEffect(() => {
    void loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, statusFilter]);

  useEffect(() => {
    if (!activeId) {
      setActive(null);
      return;
    }
    let cancelled = false;
    setLoadingThread(true);
    void fetchItThread(activeId)
      .then((t) => {
        if (!cancelled) {
          setActive(t);
          setThreads((prev) =>
            prev.map((row) => (row._id === t._id ? { ...row, unread: false, ...t } : row)),
          );
        }
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof ApiRequestError ? err.message : "Failed to open conversation");
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingThread(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeId]);

  useEffect(() => {
    if (!composeOpen) return;
    void api<{ success: true; data: AccountOpt[] }>("/it/accounts")
      .then((res) => {
        const rows = (res.data || [])
          .filter((a) => a._id !== user?._id)
          .sort((a, b) => a.name.localeCompare(b.name));
        setAccounts(rows);
      })
      .catch(() => setAccounts([]));
  }, [composeOpen, scope, user?._id]);

  const unreadCount = useMemo(() => threads.filter((t) => t.unread).length, [threads]);

  async function onStart(e: FormEvent) {
    e.preventDefault();
    if (!userId || !subject.trim() || !body.trim()) {
      toast.error("Pick a person, subject, and message");
      return;
    }
    setCreating(true);
    try {
      const created = await startItInboxThread({
        userId,
        subject: subject.trim(),
        body: body.trim(),
      });
      setComposeOpen(false);
      setUserId("");
      setSubject("");
      setBody("");
      setThreads((prev) => [created, ...prev.filter((t) => t._id !== created._id)]);
      setActiveId(created._id);
      setActive(created);
      toast.success("Conversation started");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Could not start chat");
    } finally {
      setCreating(false);
    }
  }

  async function onReply(e: FormEvent) {
    e.preventDefault();
    if (!activeId || !reply.trim()) return;
    setSending(true);
    try {
      const updated = await replyItThread(activeId, reply.trim());
      setActive(updated);
      setReply("");
      setThreads((prev) => [updated, ...prev.filter((t) => t._id !== updated._id)]);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Reply failed");
    } finally {
      setSending(false);
    }
  }

  async function toggleStatus() {
    if (!active) return;
    const next = active.status === "open" ? "closed" : "open";
    try {
      const updated = await setItThreadStatus(active._id, next);
      setActive(updated);
      setThreads((prev) => prev.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
      toast.success(next === "closed" ? "Marked closed" : "Reopened");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    }
  }

  return (
    <PageShell>
      <PageHeader
        title={title}
        description={description}
        actions={
          <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <MessageSquarePlus className="h-4 w-4" />
                Message someone
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <form onSubmit={onStart}>
                <DialogHeader>
                  <DialogTitle>Start conversation</DialogTitle>
                  <DialogDescription>
                    Reach out to any Board, BOG, leadership, or chapter account.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 space-y-3">
                  <div className="grid gap-1.5">
                    <Label>Person</Label>
                    <Select value={userId} onValueChange={setUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((a) => (
                          <SelectItem key={a._id} value={a._id}>
                            {a.name} · {accountDesignation(a)} · {a.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Subject</Label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      maxLength={200}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label>Message</Label>
                    <Textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setComposeOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as "all" | "open" | "closed")}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          {unreadCount} unread · {threads.length} shown
        </p>
      </div>

      <div className="grid min-h-[520px] gap-4 lg:grid-cols-[300px_1fr]">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : threads.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No conversations in this inbox.</p>
          ) : (
            <ul className="max-h-[70vh] divide-y divide-border overflow-y-auto">
              {threads.map((t) => (
                <li key={t._id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full px-3 py-3 text-left hover:bg-muted/50",
                      activeId === t._id && "bg-muted",
                    )}
                    onClick={() => setActiveId(t._id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn("text-sm font-medium", t.unread && "text-primary")}>
                        {t.subject}
                      </p>
                      {t.unread ? <Badge>New</Badge> : null}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {requesterLabel(t.requester)}
                      {typeof t.chapter === "object" && t.chapter?.name
                        ? ` · ${t.chapter.name}`
                        : ""}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {t.preview || "—"}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Badge variant="secondary">{t.status}</Badge>
                      <span>{formatWhen(t.lastMessageAt)}</span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex min-h-[520px] flex-col rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
              Select a conversation
            </div>
          ) : loadingThread && !active ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : active ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
                <div>
                  <h2 className="font-medium">{active.subject}</h2>
                  <p className="text-xs text-muted-foreground">
                    {requesterLabel(active.requester)}
                    {typeof active.requester === "object" && active.requester?.email
                      ? ` · ${active.requester.email}`
                      : ""}
                    {typeof active.chapter === "object" && active.chapter?.name
                      ? ` · ${active.chapter.name}`
                      : ""}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => void toggleStatus()}>
                  {active.status === "open" ? "Mark closed" : "Reopen"}
                </Button>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {(active.messages || []).map((m) => {
                  const mine =
                    typeof m.sender === "object" && m.sender?._id
                      ? m.sender._id === user?._id
                      : String(m.sender) === String(user?._id);
                  return (
                    <div
                      key={m._id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                          mine ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                      >
                        <p className="mb-1 text-[11px] opacity-80">
                          {mine ? "You (IT)" : senderName(m.sender)} · {formatWhen(m.createdAt)}
                        </p>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <form onSubmit={onReply} className="border-t border-border p-3">
                <div className="flex gap-2">
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    placeholder="Reply to this person…"
                    rows={2}
                    className="min-h-[64px]"
                  />
                  <Button type="submit" disabled={sending || !reply.trim()} className="self-end">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            </>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
