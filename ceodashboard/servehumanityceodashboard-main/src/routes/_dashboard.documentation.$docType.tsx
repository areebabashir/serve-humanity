import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, Pencil, Trash2, Upload, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiRequestError } from "@/lib/api";
import { getDocConfig, type DocField, type DocType } from "@/lib/documentation-schemas";

export const Route = createFileRoute("/_dashboard/documentation/$docType")({
  component: DocTypePage,
});

interface ChapterOption {
  _id: string;
  name: string;
  city: string;
}

interface DocAttachment {
  key: string;
  name?: string;
  url?: string;
  publicId?: string;
  note?: string;
}

interface DocRecord {
  _id: string;
  type: DocType;
  title?: string;
  caseNumber?: string;
  chapter?: ChapterOption | string | null;
  fields?: Record<string, unknown>;
  attachments?: DocAttachment[];
  notes?: string;
  status?: string;
  createdAt?: string;
  createdBy?: { name?: string };
}

function emptyFields(fields: DocField[]) {
  const out: Record<string, string> = {};
  for (const f of fields) out[f.key] = "";
  return out;
}

async function uploadFile(file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const token = typeof window !== "undefined" ? localStorage.getItem("sh_token") : null;
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
  const res = await fetch(`${API_BASE}/documentation/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw new ApiRequestError(data.message || "Upload failed", res.status);
  return data.data as { url: string; publicId: string; name: string };
}

function DocTypePage() {
  const { docType } = Route.useParams();
  const config = getDocConfig(docType);

  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [chapters, setChapters] = useState<ChapterOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DocRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [chapterId, setChapterId] = useState<string>("");
  const [status, setStatus] = useState("draft");
  const [values, setValues] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Record<string, DocAttachment>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    try {
      const [list, ch] = await Promise.all([
        api<{ success: true; data: DocRecord[] }>(`/documentation?type=${config.type}&limit=100`),
        api<{ success: true; data: ChapterOption[] }>("/chapters"),
      ]);
      setDocs(list.data);
      setChapters(ch.data);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [config]);

  useEffect(() => {
    void load();
  }, [load]);

  const fieldMap = useMemo(() => config?.fields ?? [], [config]);

  function openCreate() {
    if (!config) return;
    setEditing(null);
    setChapterId("");
    setStatus("draft");
    setValues(emptyFields(config.fields));
    setAttachments({});
    setOpen(true);
  }

  function openEdit(doc: DocRecord) {
    if (!config) return;
    const fields = { ...emptyFields(config.fields), ...(doc.fields as Record<string, string>) };
    // map known top-level into fields for display
    if (doc.caseNumber) fields.caseNumber = doc.caseNumber;
    if (doc.notes) fields.notes = doc.notes;

    const att: Record<string, DocAttachment> = {};
    for (const a of doc.attachments || []) att[a.key] = a;

    setEditing(doc);
    setChapterId(typeof doc.chapter === "object" && doc.chapter ? doc.chapter._id : (doc.chapter as string) || "");
    setStatus(doc.status || "draft");
    setValues(fields);
    setAttachments(att);
    setOpen(true);
  }

  async function onUpload(key: string, file: File | null) {
    if (!file) return;
    setUploadingKey(key);
    try {
      const uploaded = await uploadFile(file);
      setAttachments((prev) => ({
        ...prev,
        [key]: {
          key,
          url: uploaded.url,
          publicId: uploaded.publicId,
          name: uploaded.name,
          note: prev[key]?.note || "",
        },
      }));
      toast.success("File uploaded");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Upload failed");
    } finally {
      setUploadingKey(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    try {
      const fields = { ...values };
      const caseNumber = fields.caseNumber || fields.rationCaseNumber || fields.referenceNumber || "";
      const notes = fields.notes || "";
      const title = `${config.title}${caseNumber ? ` — ${caseNumber}` : ""}`;

      const payload = {
        type: config.type,
        title,
        caseNumber,
        chapter: chapterId || null,
        fields,
        attachments: Object.values(attachments),
        notes,
        status,
      };

      if (editing) {
        await api(`/documentation/${editing._id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        toast.success("Document updated");
      } else {
        await api("/documentation", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast.success("Document created");
      }
      setOpen(false);
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    try {
      await api(`/documentation/${id}`, { method: "DELETE" });
      toast.success("Deleted");
      await load();
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Delete failed");
    }
  }

  if (!config) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="font-medium">Unknown document type</p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/documentation">Back to Documentation</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{config.title}</h2>
          <p className="text-sm text-muted-foreground">{config.description}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New file
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case / Title</TableHead>
                <TableHead>Chapter</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((d) => (
                <TableRow key={d._id}>
                  <TableCell className="font-medium">
                    {d.caseNumber || d.title || "Untitled"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {typeof d.chapter === "object" && d.chapter ? d.chapter.name : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{d.status || "draft"}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : "—"}
                    {d.createdBy?.name ? ` · ${d.createdBy.name}` : ""}
                  </TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button size="sm" variant="outline" onClick={() => openEdit(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => void onDelete(d._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {docs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    No files yet. Create the first {config.title.toLowerCase()}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Create"} — {config.title}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Chapter</Label>
                <Select value={chapterId || "none"} onValueChange={(v) => setChapterId(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select chapter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All / Unassigned</SelectItem>
                    {chapters.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name} ({c.city})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="reviewed">Reviewed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {fieldMap.map((f) => (
              <FieldInput
                key={f.key}
                field={f}
                value={values[f.key] || ""}
                attachment={attachments[f.key]}
                uploading={uploadingKey === f.key}
                onChange={(v) => setValues((prev) => ({ ...prev, [f.key]: v }))}
                onNoteChange={(note) =>
                  setAttachments((prev) => ({
                    ...prev,
                    [f.key]: { ...(prev[f.key] || { key: f.key }), note },
                  }))
                }
                onUpload={(file) => void onUpload(f.key, file)}
              />
            ))}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : editing ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldInput({
  field,
  value,
  attachment,
  uploading,
  onChange,
  onNoteChange,
  onUpload,
}: {
  field: DocField;
  value: string;
  attachment?: DocAttachment;
  uploading: boolean;
  onChange: (v: string) => void;
  onNoteChange: (note: string) => void;
  onUpload: (file: File | null) => void;
}) {
  if (field.kind === "textarea") {
    return (
      <div className="space-y-2">
        <Label>
          {field.label}
          {field.required ? " *" : ""}
        </Label>
        <Textarea
          required={field.required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          rows={3}
        />
      </div>
    );
  }

  if (field.kind === "select") {
    return (
      <div className="space-y-2">
        <Label>
          {field.label}
          {field.required ? " *" : ""}
        </Label>
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (field.kind === "file" || field.kind === "file_note") {
    return (
      <div className="space-y-2 rounded-lg border border-border p-3">
        <Label>
          {field.label}
          {field.required ? " *" : ""}
        </Label>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm hover:bg-muted">
            <Upload className="h-4 w-4" />
            {uploading ? "Uploading…" : "Upload file"}
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={(e) => onUpload(e.target.files?.[0] || null)}
            />
          </label>
          {attachment?.url && (
            <a
              href={attachment.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {attachment.name || "View file"}
            </a>
          )}
        </div>
        {field.kind === "file_note" && (
          <Textarea
            placeholder="Description / note for this attachment"
            value={attachment?.note || ""}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={2}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>
        {field.label}
        {field.required ? " *" : ""}
      </Label>
      <Input
        type={field.kind === "number" ? "number" : field.kind === "date" ? "date" : "text"}
        required={field.required && field.kind !== "file"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    </div>
  );
}
