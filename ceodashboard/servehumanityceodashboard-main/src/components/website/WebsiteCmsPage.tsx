import { useCallback, useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { WebsiteSectionsForm } from "@/components/website/WebsiteSectionsForm";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api, ApiRequestError } from "@/lib/api";
import { WEBSITE_PAGES, websitePageLabel, type WebsitePageKey } from "@/lib/website";

interface WebsiteDoc {
  _id?: string | null;
  page: string;
  sections: Record<string, unknown>;
  published?: boolean;
  updatedAt?: string | null;
  updatedBy?: { name?: string } | null;
}

export function WebsiteCmsPage() {
  const [page, setPage] = useState<WebsitePageKey>("home");
  const [doc, setDoc] = useState<WebsiteDoc | null>(null);
  const [sections, setSections] = useState<Record<string, unknown>>({});
  const [published, setPublished] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (p: string) => {
    setLoading(true);
    try {
      const res = await api<{ success: true; data: WebsiteDoc }>(`/website/${p}`);
      setDoc(res.data);
      setPublished(res.data.published !== false);
      setSections((res.data.sections ?? {}) as Record<string, unknown>);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Failed to load page");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [page, load]);

  async function onSave() {
    setSaving(true);
    try {
      const res = await api<{ success: true; data: WebsiteDoc }>(`/website/${page}`, {
        method: "PUT",
        body: JSON.stringify({ sections, published }),
      });
      setDoc(res.data);
      setSections((res.data.sections ?? {}) as Record<string, unknown>);
      toast.success(`${websitePageLabel(page)} saved — live on the main website`);
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  const meta = WEBSITE_PAGES.find((p) => p.key === page);

  return (
    <PageShell>
      <PageHeader
        title="Website CMS"
        description="Edit website content below. Changes save to the database and appear on the live site after you save."
        actions={
          <Button disabled={saving || loading} onClick={() => void onSave()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save & publish
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label className="text-xs">Which page?</Label>
          <Select value={page} onValueChange={(v) => setPage(v as WebsitePageKey)}>
            <SelectTrigger className="w-[240px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEBSITE_PAGES.map((p) => (
                <SelectItem key={p.key} value={p.key}>
                  {p.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 pb-2">
          <Switch checked={published} onCheckedChange={setPublished} id="pub" />
          <Label htmlFor="pub" className="cursor-pointer text-sm">
            Show on website
          </Label>
        </div>
        {doc?.updatedAt ? (
          <p className="pb-2 text-xs text-muted-foreground">
            Last updated {new Date(doc.updatedAt).toLocaleString()}
            {doc.updatedBy?.name ? ` · ${doc.updatedBy.name}` : ""}
          </p>
        ) : (
          <Badge variant="secondary" className="mb-1">
            Using defaults (not saved yet)
          </Badge>
        )}
      </div>

      {meta ? <p className="mb-3 text-sm text-muted-foreground">{meta.description}</p> : null}

      <div className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] md:p-6">
        {loading ? (
          <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : (
          <WebsiteSectionsForm page={page} sections={sections} onChange={setSections} />
        )}
      </div>
    </PageShell>
  );
}
