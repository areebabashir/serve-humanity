import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  fetchWarningMails,
  sendWarningMail,
  type WarningMailRow,
} from "@/lib/notifications";
import { api, ApiRequestError } from "@/lib/api";

export const Route = createFileRoute("/_dashboard/warning-mail")({
  head: () => ({ meta: [{ title: "Warning Mail — Serve Humanity" }] }),
  component: WarningMailPage,
});

type ChapterOption = {
  _id: string;
  name: string;
  city?: string;
};

type ChapterMember = {
  _id: string;
  name: string;
  email?: string;
  chapterRole?: string;
  systemRole?: string;
  isActive?: boolean;
};

function roleLabel(role?: string) {
  if (!role) return "Member";
  return role
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function WarningMailPage() {
  const { user } = useAuth();
  const isCeo = isFullAccessRole(user?.systemRole);

  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [members, setMembers] = useState<ChapterMember[]>([]);
  const [chapterId, setChapterId] = useState("");
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("Official Warning Letter");
  const [body, setBody] = useState("");
  const [loadingChapters, setLoadingChapters] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<WarningMailRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const selectedMember = useMemo(
    () => members.find((m) => m._id === userId) || null,
    [members, userId],
  );

  async function loadChapters() {
    setLoadingChapters(true);
    try {
      const res = await api<{ success: true; data: ChapterOption[] }>("/chapters");
      setChapters(res.data || []);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load chapters");
    } finally {
      setLoadingChapters(false);
    }
  }

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      setHistory(await fetchWarningMails());
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load warning history");
    } finally {
      setLoadingHistory(false);
    }
  }

  async function loadMembers(id: string) {
    setLoadingMembers(true);
    setMembers([]);
    setUserId("");
    try {
      const res = await api<{
        success: true;
        data: { team?: ChapterMember[] };
      }>(`/chapters/${id}/details`);
      const team = (res.data?.team || []).filter((m) => (m.email || "").trim());
      setMembers(team);
      if (!team.length) {
        toast.message("No members with email found in this chapter");
      }
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load members");
    } finally {
      setLoadingMembers(false);
    }
  }

  useEffect(() => {
    if (!isCeo) return;
    void loadChapters();
    void loadHistory();
  }, [isCeo]);

  useEffect(() => {
    if (!chapterId) {
      setMembers([]);
      setUserId("");
      return;
    }
    void loadMembers(chapterId);
  }, [chapterId]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    if (!chapterId) {
      toast.error("Select a chapter");
      return;
    }
    if (!userId) {
      toast.error("Select a member");
      return;
    }
    if (!body.trim()) {
      toast.error("Write the warning message");
      return;
    }
    setSending(true);
    try {
      const res = await sendWarningMail({
        chapterId,
        userId,
        title: title.trim() || "Official Warning Letter",
        body: body.trim(),
      });
      if (res.meta.emailed) {
        toast.success(`Warning mail sent to ${res.meta.recipientName}`);
      } else {
        toast.error(
          res.meta.emailError?.slice(0, 180) ||
            "Warning saved, but email failed to send. Check SMTP settings.",
        );
      }
      setBody("");
      setTitle("Official Warning Letter");
      await loadHistory();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to send warning mail");
    } finally {
      setSending(false);
    }
  }

  if (!isCeo) {
    return (
      <PageShell>
        <PageHeader
          title="Warning Mail"
          description="Only CEO, Founder, CTO, and COO can send warning letters."
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Warning Mail"
        description="Select a chapter and member, then send an official warning letter by email (also appears in their notifications inbox)."
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSend}
          className="space-y-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              This sends a branded <strong>Warning</strong> email to one chapter member. Use clear,
              factual language. The member will also see it in their in-app notifications.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Chapter</Label>
              <Select
                value={chapterId || undefined}
                onValueChange={setChapterId}
                disabled={loadingChapters}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={loadingChapters ? "Loading chapters…" : "Select chapter"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {chapters.map((c) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                      {c.city ? ` · ${c.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Member</Label>
              <Select
                value={userId || undefined}
                onValueChange={setUserId}
                disabled={!chapterId || loadingMembers}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !chapterId
                        ? "Select a chapter first"
                        : loadingMembers
                          ? "Loading members…"
                          : "Select member"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name} · {roleLabel(m.chapterRole || m.systemRole)}
                      {m.isActive === false ? " (inactive)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedMember?.email ? (
                <p className="text-xs text-muted-foreground">Email: {selectedMember.email}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="warning-title">Subject / title</Label>
            <Input
              id="warning-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Official Warning Letter"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warning-body">Warning message</Label>
            <Textarea
              id="warning-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Describe the issue, expected corrective action, and any deadline…"
              className="min-h-[160px]"
              required
            />
          </div>

          <Button type="submit" disabled={sending || !chapterId || !userId} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {sending ? "Sending…" : "Send warning mail"}
          </Button>
        </form>

        <div className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold tracking-tight">Sent warnings</h2>
            <Badge variant="secondary">{history.length}</Badge>
          </div>

          {loadingHistory ? (
            <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
            </div>
          ) : history.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No warning letters sent yet.
            </p>
          ) : (
            <ul className="max-h-[560px] space-y-3 overflow-y-auto pr-1">
              {history.map((row) => (
                <li key={row._id} className="rounded-xl border bg-muted/30 p-3.5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{row.title}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.recipientName}
                        {row.recipientEmail ? ` · ${row.recipientEmail}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {row.chapterName}
                        {row.recipientRole ? ` · ${roleLabel(row.recipientRole)}` : ""}
                      </p>
                    </div>
                    <Badge variant={row.emailed ? "default" : "destructive"}>
                      {row.emailed ? "Emailed" : "Email failed"}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {row.body}
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatWhen(row.createdAt)}
                    {row.createdBy?.name ? ` · by ${row.createdBy.name}` : ""}
                  </p>
                  {row.emailError ? (
                    <p className="mt-1 text-[11px] text-destructive">{row.emailError}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageShell>
  );
}
