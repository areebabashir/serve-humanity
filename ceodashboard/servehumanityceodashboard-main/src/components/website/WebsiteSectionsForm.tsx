import type { ReactNode } from "react";
import { useRef, useState } from "react";
import { ImagePlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiRequestError } from "@/lib/api";
import type { WebsitePageKey } from "@/lib/website";

type Sections = Record<string, unknown>;

function asObj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function asArr<T = Record<string, unknown>>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}

function str(v: unknown) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {children}
    </div>
  );
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-xl border border-border bg-background/60 p-4 md:p-5">
      <div>
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function setPath(sections: Sections, path: string[], value: unknown): Sections {
  const next = structuredClone(sections) as Sections;
  let cur: Record<string, unknown> = next;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]!;
    const existing = cur[key];
    if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
      cur[key] = {};
    }
    cur = cur[key] as Record<string, unknown>;
  }
  cur[path[path.length - 1]!] = value;
  return next;
}

function TextInput({
  label,
  value,
  onChange,
  hint,
  multiline,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  multiline?: boolean;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      {multiline ? (
        <Textarea
          className={className || "min-h-[88px]"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </Field>
  );
}

function HeroFields({
  hero,
  onChange,
  variant = "standard",
}: {
  hero: Record<string, unknown>;
  onChange: (hero: Record<string, unknown>) => void;
  variant?: "standard" | "home";
}) {
  const set = (key: string, value: string) => onChange({ ...hero, [key]: value });

  if (variant === "home") {
    return (
      <Section title="Top banner (Hero)" description="Main headline visitors see first on the home page.">
        <TextInput label="Small label above title" value={str(hero.eyebrow)} onChange={(v) => set("eyebrow", v)} />
        <TextInput label="Title (first part)" value={str(hero.titlePrefix)} onChange={(v) => set("titlePrefix", v)} hint='e.g. "Together We"' />
        <TextInput label="Highlighted title words" value={str(hero.titleHighlight)} onChange={(v) => set("titleHighlight", v)} hint='e.g. "Build Hope"' />
        <div className="sm:col-span-2">
          <TextInput label="Subtitle" value={str(hero.subtitle)} onChange={(v) => set("subtitle", v)} multiline />
        </div>
        <TextInput label="Primary button text" value={str(hero.primaryCta)} onChange={(v) => set("primaryCta", v)} />
        <TextInput label="Primary button link" value={str(hero.primaryCtaLink)} onChange={(v) => set("primaryCtaLink", v)} hint="e.g. /donate" />
        <TextInput label="Secondary button text" value={str(hero.secondaryCta)} onChange={(v) => set("secondaryCta", v)} />
        <TextInput label="Secondary button link" value={str(hero.secondaryCtaLink)} onChange={(v) => set("secondaryCtaLink", v)} hint="e.g. /volunteer" />
      </Section>
    );
  }

  return (
    <Section title="Page header" description="Title area at the top of this page.">
      <TextInput label="Small label" value={str(hero.eyebrow)} onChange={(v) => set("eyebrow", v)} />
      <TextInput label="Title" value={str(hero.title)} onChange={(v) => set("title", v)} />
      <TextInput
        label="Highlighted words in title"
        value={str(hero.titleHighlight)}
        onChange={(v) => set("titleHighlight", v)}
        hint="Must appear inside the title text"
      />
      <div className="sm:col-span-2">
        <TextInput label="Description" value={str(hero.description)} onChange={(v) => set("description", v)} multiline />
      </div>
    </Section>
  );
}

function ListToolbar({
  title,
  onAdd,
  addLabel,
}: {
  title: string;
  onAdd: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 sm:col-span-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {addLabel}
      </Button>
    </div>
  );
}

function ItemCard({
  index,
  onRemove,
  children,
  label,
}: {
  index: number;
  onRemove: () => void;
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className="sm:col-span-2 space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label || "Item"} {index + 1}
        </span>
        <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function GalleryImageField({
  imageUrl,
  onUploaded,
  onClear,
}: {
  imageUrl: string;
  onUploaded: (url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onPick(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, or WebP)");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await api<{ success: true; data: { url: string } }>("/website/upload-image", {
        method: "POST",
        body: form,
      });
      onUploaded(res.data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Image upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="sm:col-span-2 space-y-2">
      <Label className="text-sm font-medium">Photo</Label>
      {imageUrl ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <img src={imageUrl} alt="" className="h-40 w-full object-cover" />
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-xs text-muted-foreground">
          No image yet — upload one below
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          {imageUrl ? "Replace image" : "Upload image"}
        </Button>
        {imageUrl ? (
          <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={onClear}>
            <Trash2 className="h-4 w-4" />
            Remove image
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function WebsiteSectionsForm({
  page,
  sections,
  onChange,
}: {
  page: WebsitePageKey;
  sections: Sections;
  onChange: (next: Sections) => void;
}) {
  const patch = (path: string[], value: unknown) => onChange(setPath(sections, path, value));

  if (page === "home") {
    const hero = asObj(sections.hero);
    const stats = asArr<{ label?: string; value?: string }>(sections.stats);
    const story = asObj(sections.story);
    const storyPoints = asArr<string>(story.points).map((p) => (typeof p === "string" ? p : ""));
    const sideStats = asArr<{ value?: string; label?: string }>(story.sideStats);
    const principles = asObj(sections.principles);
    const principleItems = asArr<{ title?: string; desc?: string }>(principles.items);
    const impact = asObj(sections.impact);
    const impactStats = asArr<{ label?: string; end?: number | string; suffix?: string }>(impact.stats);
    const eightWays = asObj(sections.eightWays);
    const eightItems = asArr<{ title?: string; desc?: string }>(eightWays.items);
    const about = asObj(sections.aboutTeaser);
    const donate = asObj(sections.donateCta);
    const chaptersMap = asObj(sections.chaptersMap);
    const testimonials = asObj(sections.testimonials);
    const partners = asObj(sections.partners);
    const partnerItems = (() => {
      const fromItems = asArr<{ name?: string; logoUrl?: string }>(partners.items);
      if (fromItems.length) return fromItems;
      // legacy: names: string[]
      return asArr<string>(partners.names).map((n) => ({
        name: typeof n === "string" ? n : "",
        logoUrl: "",
      }));
    })();
    return (
      <div className="space-y-5">
        <HeroFields hero={hero} variant="home" onChange={(h) => patch(["hero"], h)} />
        <Section title="Hero impact cards" description="Live stats shown beside the home banner.">
          <ListToolbar
            title="Stats"
            addLabel="Add stat"
            onAdd={() => patch(["stats"], [...stats, { label: "New label", value: "0" }])}
          />
          {stats.map((s, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Stat"
              onRemove={() => patch(["stats"], stats.filter((_, j) => j !== i))}
            >
              <TextInput
                label="Label"
                value={str(s.label)}
                onChange={(v) => {
                  const next = [...stats];
                  next[i] = { ...s, label: v };
                  patch(["stats"], next);
                }}
              />
              <TextInput
                label="Value"
                value={str(s.value)}
                onChange={(v) => {
                  const next = [...stats];
                  next[i] = { ...s, value: v };
                  patch(["stats"], next);
                }}
              />
            </ItemCard>
          ))}
        </Section>

        <Section title="Our story" description="Homepage story section with quote card.">
          <TextInput label="Small label" value={str(story.eyebrow)} onChange={(v) => patch(["story", "eyebrow"], v)} />
          <TextInput label="Title (first part)" value={str(story.title)} onChange={(v) => patch(["story", "title"], v)} />
          <TextInput
            label="Highlighted title words"
            value={str(story.titleHighlight)}
            onChange={(v) => patch(["story", "titleHighlight"], v)}
          />
          <div className="sm:col-span-2">
            <TextInput label="Body" value={str(story.body)} onChange={(v) => patch(["story", "body"], v)} multiline />
          </div>
          <TextInput label="Button text" value={str(story.cta)} onChange={(v) => patch(["story", "cta"], v)} />
          <TextInput label="Button link" value={str(story.ctaLink)} onChange={(v) => patch(["story", "ctaLink"], v)} />
          <TextInput label="Quote card label" value={str(story.estLabel)} onChange={(v) => patch(["story", "estLabel"], v)} />
          <TextInput label="Quote attribution" value={str(story.quoteAttr)} onChange={(v) => patch(["story", "quoteAttr"], v)} />
          <div className="sm:col-span-2">
            <TextInput label="Quote" value={str(story.quote)} onChange={(v) => patch(["story", "quote"], v)} multiline />
          </div>
          <ListToolbar
            title="Story bullet points"
            addLabel="Add point"
            onAdd={() => patch(["story", "points"], [...storyPoints, ""])}
          />
          {storyPoints.map((p, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Point"
              onRemove={() => patch(["story", "points"], storyPoints.filter((_, j) => j !== i))}
            >
              <div className="sm:col-span-2">
                <TextInput
                  label="Text"
                  value={p}
                  multiline
                  onChange={(v) => {
                    const next = [...storyPoints];
                    next[i] = v;
                    patch(["story", "points"], next);
                  }}
                />
              </div>
            </ItemCard>
          ))}
          <ListToolbar
            title="Quote card stats"
            addLabel="Add stat"
            onAdd={() => patch(["story", "sideStats"], [...sideStats, { value: "0", label: "Label" }])}
          />
          {sideStats.map((s, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Side stat"
              onRemove={() => patch(["story", "sideStats"], sideStats.filter((_, j) => j !== i))}
            >
              <TextInput
                label="Value"
                value={str(s.value)}
                onChange={(v) => {
                  const next = [...sideStats];
                  next[i] = { ...s, value: v };
                  patch(["story", "sideStats"], next);
                }}
              />
              <TextInput
                label="Label"
                value={str(s.label)}
                onChange={(v) => {
                  const next = [...sideStats];
                  next[i] = { ...s, label: v };
                  patch(["story", "sideStats"], next);
                }}
              />
            </ItemCard>
          ))}
        </Section>

        <Section title="Principles (core values)" description="Six commitment cards on the home page.">
          <TextInput
            label="Small label"
            value={str(principles.eyebrow)}
            onChange={(v) => patch(["principles", "eyebrow"], v)}
          />
          <TextInput
            label="Title (first part)"
            value={str(principles.title)}
            onChange={(v) => patch(["principles", "title"], v)}
          />
          <TextInput
            label="Highlighted title words"
            value={str(principles.titleHighlight)}
            onChange={(v) => patch(["principles", "titleHighlight"], v)}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Subtitle"
              value={str(principles.subtitle)}
              onChange={(v) => patch(["principles", "subtitle"], v)}
              multiline
            />
          </div>
          <ListToolbar
            title="Principles"
            addLabel="Add principle"
            onAdd={() =>
              patch(["principles", "items"], [...principleItems, { title: "New principle", desc: "" }])
            }
          />
          {principleItems.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Principle"
              onRemove={() =>
                patch(
                  ["principles", "items"],
                  principleItems.filter((_, j) => j !== i),
                )
              }
            >
              <TextInput
                label="Title"
                value={str(item.title)}
                onChange={(v) => {
                  const next = [...principleItems];
                  next[i] = { ...item, title: v };
                  patch(["principles", "items"], next);
                }}
              />
              <div className="sm:col-span-2">
                <TextInput
                  label="Description"
                  value={str(item.desc)}
                  multiline
                  onChange={(v) => {
                    const next = [...principleItems];
                    next[i] = { ...item, desc: v };
                    patch(["principles", "items"], next);
                  }}
                />
              </div>
            </ItemCard>
          ))}
        </Section>

        <Section title="Measured impact" description="Animated count-up numbers on the home page.">
          <TextInput
            label="Small label"
            value={str(impact.eyebrow)}
            onChange={(v) => patch(["impact", "eyebrow"], v)}
          />
          <TextInput
            label="Title (first part)"
            value={str(impact.title)}
            onChange={(v) => patch(["impact", "title"], v)}
          />
          <TextInput
            label="Highlighted title words"
            value={str(impact.titleHighlight)}
            onChange={(v) => patch(["impact", "titleHighlight"], v)}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Body"
              value={str(impact.body)}
              onChange={(v) => patch(["impact", "body"], v)}
              multiline
            />
          </div>
          <ListToolbar
            title="Impact stats"
            addLabel="Add stat"
            onAdd={() =>
              patch(["impact", "stats"], [...impactStats, { label: "New label", end: 0, suffix: "" }])
            }
          />
          {impactStats.map((s, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Impact"
              onRemove={() =>
                patch(
                  ["impact", "stats"],
                  impactStats.filter((_, j) => j !== i),
                )
              }
            >
              <TextInput
                label="Label"
                value={str(s.label)}
                onChange={(v) => {
                  const next = [...impactStats];
                  next[i] = { ...s, label: v };
                  patch(["impact", "stats"], next);
                }}
              />
              <TextInput
                label="Number (count-up end)"
                value={str(s.end)}
                onChange={(v) => {
                  const next = [...impactStats];
                  next[i] = { ...s, end: Number(v.replace(/,/g, "")) || 0 };
                  patch(["impact", "stats"], next);
                }}
                hint="Digits only, e.g. 48200"
              />
              <TextInput
                label="Suffix"
                value={str(s.suffix)}
                onChange={(v) => {
                  const next = [...impactStats];
                  next[i] = { ...s, suffix: v };
                  patch(["impact", "stats"], next);
                }}
                hint='e.g. "+" or "K"'
              />
            </ItemCard>
          ))}
        </Section>

        <Section title="Eight ways we show up" description="Program cards on the home page.">
          <TextInput
            label="Small label"
            value={str(eightWays.eyebrow)}
            onChange={(v) => patch(["eightWays", "eyebrow"], v)}
          />
          <TextInput
            label="Title (first part)"
            value={str(eightWays.title)}
            onChange={(v) => patch(["eightWays", "title"], v)}
          />
          <TextInput
            label="Highlighted title words"
            value={str(eightWays.titleHighlight)}
            onChange={(v) => patch(["eightWays", "titleHighlight"], v)}
          />
          <ListToolbar
            title="Programs"
            addLabel="Add program"
            onAdd={() => patch(["eightWays", "items"], [...eightItems, { title: "New program", desc: "" }])}
          />
          {eightItems.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Program"
              onRemove={() =>
                patch(
                  ["eightWays", "items"],
                  eightItems.filter((_, j) => j !== i),
                )
              }
            >
              <TextInput
                label="Title"
                value={str(item.title)}
                onChange={(v) => {
                  const next = [...eightItems];
                  next[i] = { ...item, title: v };
                  patch(["eightWays", "items"], next);
                }}
              />
              <div className="sm:col-span-2">
                <TextInput
                  label="Description"
                  value={str(item.desc)}
                  multiline
                  onChange={(v) => {
                    const next = [...eightItems];
                    next[i] = { ...item, desc: v };
                    patch(["eightWays", "items"], next);
                  }}
                />
              </div>
            </ItemCard>
          ))}
        </Section>

        <Section title="About teaser">
          <TextInput label="Small label" value={str(about.eyebrow)} onChange={(v) => patch(["aboutTeaser", "eyebrow"], v)} />
          <TextInput label="Title" value={str(about.title)} onChange={(v) => patch(["aboutTeaser", "title"], v)} />
          <div className="sm:col-span-2">
            <TextInput label="Body" value={str(about.body)} onChange={(v) => patch(["aboutTeaser", "body"], v)} multiline />
          </div>
          <TextInput label="Button text" value={str(about.cta)} onChange={(v) => patch(["aboutTeaser", "cta"], v)} />
          <TextInput label="Button link" value={str(about.ctaLink)} onChange={(v) => patch(["aboutTeaser", "ctaLink"], v)} />
        </Section>
        <Section title="Chapters map" description="Headings for the home map section. Chapter pins load live from Chapters.">
          <TextInput
            label="Small label"
            value={str(chaptersMap.eyebrow)}
            onChange={(v) => patch(["chaptersMap", "eyebrow"], v)}
          />
          <TextInput
            label="Title (first part)"
            value={str(chaptersMap.title)}
            onChange={(v) => patch(["chaptersMap", "title"], v)}
          />
          <TextInput
            label="Highlighted title words"
            value={str(chaptersMap.titleHighlight)}
            onChange={(v) => patch(["chaptersMap", "titleHighlight"], v)}
          />
        </Section>

        <Section title="Voices / Testimonials" description="Section headings only. Reviews appear after visitors submit and you approve them under Reviews.">
          <TextInput
            label="Small label"
            value={str(testimonials.eyebrow)}
            onChange={(v) => patch(["testimonials", "eyebrow"], v)}
          />
          <TextInput
            label="Title (first part)"
            value={str(testimonials.title)}
            onChange={(v) => patch(["testimonials", "title"], v)}
          />
          <TextInput
            label="Highlighted title words"
            value={str(testimonials.titleHighlight)}
            onChange={(v) => patch(["testimonials", "titleHighlight"], v)}
          />
        </Section>

        <Section title="Donate call-to-action" description="Home banner copy. Bank account number is set under Website → Donate.">
          <TextInput
            label="Small label"
            value={str(donate.eyebrow)}
            onChange={(v) => patch(["donateCta", "eyebrow"], v)}
          />
          <TextInput label="Title (first part)" value={str(donate.title)} onChange={(v) => patch(["donateCta", "title"], v)} />
          <TextInput
            label="Highlighted title words"
            value={str(donate.titleHighlight)}
            onChange={(v) => patch(["donateCta", "titleHighlight"], v)}
          />
          <TextInput label="Button text" value={str(donate.cta)} onChange={(v) => patch(["donateCta", "cta"], v)} />
          <div className="sm:col-span-2">
            <TextInput label="Body" value={str(donate.body)} onChange={(v) => patch(["donateCta", "body"], v)} multiline />
          </div>
        </Section>
        <Section
          title="Trusted partners"
          description="Upload each partner’s logo — logos appear in the scrolling strip on the home page."
        >
          <div className="sm:col-span-2">
            <TextInput
              label="Section title"
              value={str(partners.title)}
              onChange={(v) => patch(["partners", "title"], v)}
            />
          </div>
          <ListToolbar
            title="Partners"
            addLabel="Add partner"
            onAdd={() =>
              patch(["partners", "items"], [...partnerItems, { name: "New partner", logoUrl: "" }])
            }
          />
          {partnerItems.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Partner"
              onRemove={() =>
                patch(
                  ["partners", "items"],
                  partnerItems.filter((_, j) => j !== i),
                )
              }
            >
              <GalleryImageField
                imageUrl={str(item.logoUrl)}
                onUploaded={(url) => {
                  const next = [...partnerItems];
                  next[i] = { ...item, logoUrl: url };
                  patch(["partners", "items"], next);
                }}
                onClear={() => {
                  const next = [...partnerItems];
                  next[i] = { ...item, logoUrl: "" };
                  patch(["partners", "items"], next);
                }}
              />
              <div className="sm:col-span-2">
                <TextInput
                  label="Partner name"
                  value={str(item.name)}
                  onChange={(v) => {
                    const next = [...partnerItems];
                    next[i] = { ...item, name: v };
                    patch(["partners", "items"], next);
                  }}
                  hint="Shown under the logo on the home page"
                />
              </div>
            </ItemCard>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "about") {
    const hero = asObj(sections.hero);
    const story = asObj(sections.story);
    const paragraphs = asArr<string>(story.paragraphs).map((p) => (typeof p === "string" ? p : ""));
    const values = asArr<{ title?: string; body?: string }>(sections.values);
    const founder = asObj(sections.founder);
    const ceo = asObj(sections.ceo);
    const programs = asObj(sections.programs);
    const programItems = asArr<{ title?: string; body?: string; stat?: string }>(programs.items);

    const setMessage = (key: "founder" | "ceo", field: string, value: string) => {
      const current = asObj(sections[key]);
      patch([key], { ...current, [field]: value });
    };

    const moveProgram = (i: number, dir: -1 | 1) => {
      const to = i + dir;
      if (to < 0 || to >= programItems.length) return;
      const next = [...programItems];
      const tmp = next[i]!;
      next[i] = next[to]!;
      next[to] = tmp;
      patch(["programs", "items"], next);
    };

    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-brand-orange/25 bg-accent/40 px-4 py-3 text-sm text-foreground">
          <p className="font-semibold">About page — full CMS</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Edit every block shown on the public About page: hero, story, values, founder message,
            CEO message, and programs. Click <b>Save &amp; publish</b> when done.
          </p>
        </div>

        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />

        <Section title="1 · Our story" description="Left column text + CTA on About.">
          <TextInput label="Section title" value={str(story.title)} onChange={(v) => patch(["story", "title"], v)} />
          <TextInput label="Button text" value={str(story.cta)} onChange={(v) => patch(["story", "cta"], v)} />
          <TextInput label="Button link" value={str(story.ctaLink)} onChange={(v) => patch(["story", "ctaLink"], v)} hint="e.g. /team" />
          <ListToolbar
            title="Story paragraphs"
            addLabel="Add paragraph"
            onAdd={() => patch(["story", "paragraphs"], [...paragraphs, ""])}
          />
          {paragraphs.map((p, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Paragraph"
              onRemove={() => patch(["story", "paragraphs"], paragraphs.filter((_, j) => j !== i))}
            >
              <div className="sm:col-span-2">
                <TextInput
                  label="Text"
                  value={p}
                  multiline
                  onChange={(v) => {
                    const next = [...paragraphs];
                    next[i] = v;
                    patch(["story", "paragraphs"], next);
                  }}
                />
              </div>
            </ItemCard>
          ))}
        </Section>

        <Section title="2 · Values / principles" description="Small cards beside the story.">
          <ListToolbar
            title="Values"
            addLabel="Add value"
            onAdd={() => patch(["values"], [...values, { title: "New value", body: "" }])}
          />
          {values.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Value"
              onRemove={() => patch(["values"], values.filter((_, j) => j !== i))}
            >
              <TextInput
                label="Title"
                value={str(item.title)}
                onChange={(v) => {
                  const next = [...values];
                  next[i] = { ...item, title: v };
                  patch(["values"], next);
                }}
              />
              <TextInput
                label="Short text"
                value={str(item.body)}
                onChange={(v) => {
                  const next = [...values];
                  next[i] = { ...item, body: v };
                  patch(["values"], next);
                }}
              />
            </ItemCard>
          ))}
        </Section>

        <Section title="3 · Founder's message" description="Photo + quote block on About.">
          <TextInput
            label="Small label"
            value={str(founder.eyebrow)}
            onChange={(v) => setMessage("founder", "eyebrow", v)}
            hint='e.g. Founder message'
          />
          <TextInput label="Name" value={str(founder.name)} onChange={(v) => setMessage("founder", "name", v)} />
          <TextInput
            label="Role / title"
            value={str(founder.role)}
            onChange={(v) => setMessage("founder", "role", v)}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Message"
              value={str(founder.message)}
              onChange={(v) => setMessage("founder", "message", v)}
              multiline
              className="min-h-[120px]"
            />
          </div>
          <GalleryImageField
            imageUrl={str(founder.imageUrl)}
            onUploaded={(url) => setMessage("founder", "imageUrl", url)}
            onClear={() => setMessage("founder", "imageUrl", "")}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Or paste image URL"
              value={str(founder.imageUrl)}
              onChange={(v) => setMessage("founder", "imageUrl", v)}
            />
          </div>
        </Section>

        <Section title="4 · CEO's message" description="Photo + quote block on About (image on the right).">
          <TextInput
            label="Small label"
            value={str(ceo.eyebrow)}
            onChange={(v) => setMessage("ceo", "eyebrow", v)}
            hint='e.g. CEO message'
          />
          <TextInput label="Name" value={str(ceo.name)} onChange={(v) => setMessage("ceo", "name", v)} />
          <TextInput label="Role / title" value={str(ceo.role)} onChange={(v) => setMessage("ceo", "role", v)} />
          <div className="sm:col-span-2">
            <TextInput
              label="Message"
              value={str(ceo.message)}
              onChange={(v) => setMessage("ceo", "message", v)}
              multiline
              className="min-h-[120px]"
            />
          </div>
          <GalleryImageField
            imageUrl={str(ceo.imageUrl)}
            onUploaded={(url) => setMessage("ceo", "imageUrl", url)}
            onClear={() => setMessage("ceo", "imageUrl", "")}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Or paste image URL"
              value={str(ceo.imageUrl)}
              onChange={(v) => setMessage("ceo", "imageUrl", v)}
            />
          </div>
        </Section>

        <Section
          title="5 · Programs"
          description="Program cards at the bottom of About (/programs redirects here)."
        >
          <TextInput
            label="Section eyebrow"
            value={str(programs.eyebrow)}
            onChange={(v) => patch(["programs"], { ...programs, eyebrow: v })}
          />
          <TextInput
            label="Section title"
            value={str(programs.title)}
            onChange={(v) => patch(["programs"], { ...programs, title: v })}
          />
          <TextInput
            label="Highlighted words in title"
            value={str(programs.titleHighlight)}
            onChange={(v) => patch(["programs"], { ...programs, titleHighlight: v })}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Section description"
              value={str(programs.description)}
              onChange={(v) => patch(["programs"], { ...programs, description: v })}
              multiline
            />
          </div>
          <ListToolbar
            title={`Program cards (${programItems.length})`}
            addLabel="Add program"
            onAdd={() =>
              patch(["programs", "items"], [...programItems, { title: "", body: "", stat: "" }])
            }
          />
          {programItems.length === 0 ? (
            <p className="sm:col-span-2 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
              No programs yet. Click “Add program” or save after loading defaults from the server.
            </p>
          ) : null}
          {programItems.map((item, i) => (
            <div key={i} className="sm:col-span-2 space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Program {i + 1}
                  {item.title ? ` · ${item.title}` : ""}
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button type="button" variant="outline" size="sm" disabled={i === 0} onClick={() => moveProgram(i, -1)}>
                    Up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={i === programItems.length - 1}
                    onClick={() => moveProgram(i, 1)}
                  >
                    Down
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() =>
                      patch(
                        ["programs", "items"],
                        programItems.filter((_, j) => j !== i),
                      )
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextInput
                  label="Title"
                  value={str(item.title)}
                  onChange={(v) => {
                    const next = [...programItems];
                    next[i] = { ...item, title: v };
                    patch(["programs", "items"], next);
                  }}
                />
                <TextInput
                  label="Stat badge"
                  value={str(item.stat)}
                  onChange={(v) => {
                    const next = [...programItems];
                    next[i] = { ...item, stat: v };
                    patch(["programs", "items"], next);
                  }}
                  hint='e.g. "210K packages"'
                />
                <div className="sm:col-span-2">
                  <TextInput
                    label="Description"
                    value={str(item.body)}
                    multiline
                    onChange={(v) => {
                      const next = [...programItems];
                      next[i] = { ...item, body: v };
                      patch(["programs", "items"], next);
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "mission") {
    const hero = asObj(sections.hero);
    const mission = asObj(sections.mission);
    const vision = asObj(sections.vision);
    return (
      <div className="space-y-5">
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />
        <Section title="Mission card">
          <TextInput label="Title" value={str(mission.title)} onChange={(v) => patch(["mission", "title"], v)} />
          <div className="sm:col-span-2">
            <TextInput label="Text" value={str(mission.body)} onChange={(v) => patch(["mission", "body"], v)} multiline />
          </div>
        </Section>
        <Section title="Vision card">
          <TextInput label="Title" value={str(vision.title)} onChange={(v) => patch(["vision", "title"], v)} />
          <div className="sm:col-span-2">
            <TextInput label="Text" value={str(vision.body)} onChange={(v) => patch(["vision", "body"], v)} multiline />
          </div>
        </Section>
      </div>
    );
  }

  if (page === "leadership") {
    const hero = asObj(sections.hero);
    type Person = {
      name?: string;
      role?: string;
      phone?: string;
      email?: string;
      photoUrl?: string;
      linkedin?: string;
    };
    const emptyPerson = (): Person => ({
      name: "",
      role: "",
      phone: "",
      email: "",
      photoUrl: "",
      linkedin: "",
    });
    const groups = asArr<{ title?: string; members?: Person[] }>(sections.groups);

    const setGroups = (next: typeof groups) => patch(["groups"], next);

    const setMember = (gi: number, mi: number, patchMember: Partial<Person>) => {
      const g = groups[gi];
      const next = [...groups];
      const members = [...(g.members || [])];
      members[mi] = { ...members[mi], ...patchMember };
      next[gi] = { ...g, members };
      setGroups(next);
    };

    const moveGroup = (gi: number, dir: -1 | 1) => {
      const to = gi + dir;
      if (to < 0 || to >= groups.length) return;
      const next = [...groups];
      const tmp = next[gi]!;
      next[gi] = next[to]!;
      next[to] = tmp;
      setGroups(next);
    };

    const moveMember = (gi: number, mi: number, dir: -1 | 1) => {
      const members = [...(groups[gi]?.members || [])];
      const to = mi + dir;
      if (to < 0 || to >= members.length) return;
      const tmp = members[mi]!;
      members[mi] = members[to]!;
      members[to] = tmp;
      const next = [...groups];
      next[gi] = { ...groups[gi], members };
      setGroups(next);
    };

    return (
      <div className="space-y-5">
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />

        <Section
          title="Team groups & people"
          description="Matches the public Team page: photo, name, role, phone, email, and LinkedIn only."
        >
          <ListToolbar
            title="Groups"
            addLabel="Add group"
            onAdd={() => setGroups([...groups, { title: "New group", members: [emptyPerson()] }])}
          />
          {groups.length === 0 ? (
            <p className="sm:col-span-2 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-sm text-muted-foreground">
              No groups yet. Click “Add group” to start building the Team page.
            </p>
          ) : null}
          {groups.map((g, gi) => (
            <div key={gi} className="sm:col-span-2 space-y-3 rounded-lg border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Group {gi + 1}
                </span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={gi === 0}
                    onClick={() => moveGroup(gi, -1)}
                  >
                    Move up
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={gi === groups.length - 1}
                    onClick={() => moveGroup(gi, 1)}
                  >
                    Move down
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setGroups(groups.filter((_, j) => j !== gi))}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove group
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <TextInput
                    label="Group title"
                    value={str(g.title)}
                    onChange={(v) => {
                      const next = [...groups];
                      next[gi] = { ...g, title: v };
                      setGroups(next);
                    }}
                    hint='e.g. "Executive Leadership Team" or "Board of Directors"'
                  />
                </div>
              </div>

              <ListToolbar
                title={`People (${(g.members || []).length})`}
                addLabel="Add person"
                onAdd={() => {
                  const next = [...groups];
                  next[gi] = { ...g, members: [...(g.members || []), emptyPerson()] };
                  setGroups(next);
                }}
              />

              {(g.members || []).map((m, mi) => (
                <div
                  key={mi}
                  className="space-y-4 rounded-lg border border-border/80 bg-background/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Person {mi + 1}
                      {m.name ? ` · ${m.name}` : ""}
                    </span>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={mi === 0}
                        onClick={() => moveMember(gi, mi, -1)}
                      >
                        Up
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={mi === (g.members || []).length - 1}
                        onClick={() => moveMember(gi, mi, 1)}
                      >
                        Down
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => {
                          const next = [...groups];
                          next[gi] = {
                            ...g,
                            members: (g.members || []).filter((_, j) => j !== mi),
                          };
                          setGroups(next);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <TextInput
                      label="Full name"
                      value={str(m.name)}
                      onChange={(v) => setMember(gi, mi, { name: v })}
                    />
                    <TextInput
                      label="Role / title"
                      value={str(m.role)}
                      onChange={(v) => setMember(gi, mi, { role: v })}
                      hint="Orange tag under the name on the website"
                    />

                    <GalleryImageField
                      imageUrl={str(m.photoUrl)}
                      onUploaded={(url) => setMember(gi, mi, { photoUrl: url })}
                      onClear={() => setMember(gi, mi, { photoUrl: "" })}
                    />
                    <div className="sm:col-span-2">
                      <TextInput
                        label="Or paste photo URL"
                        value={str(m.photoUrl)}
                        onChange={(v) => setMember(gi, mi, { photoUrl: v })}
                        hint="Optional if you uploaded a photo above"
                      />
                    </div>

                    <TextInput
                      label="Phone"
                      value={str(m.phone)}
                      onChange={(v) => setMember(gi, mi, { phone: v })}
                      hint="Shown as a phone icon only on the website"
                    />
                    <TextInput
                      label="Email"
                      value={str(m.email)}
                      onChange={(v) => setMember(gi, mi, { email: v })}
                      hint="Shown as an email icon only on the website"
                    />
                    <div className="sm:col-span-2">
                      <TextInput
                        label="LinkedIn link"
                        value={str(m.linkedin)}
                        onChange={(v) => setMember(gi, mi, { linkedin: v })}
                        hint="Full URL — shown as a LinkedIn icon on the website"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "chapters") {
    const hero = asObj(sections.hero);
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-brand-orange/25 bg-accent/40 px-4 py-3 text-sm">
          <p className="font-semibold">Chapters page</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Edit the page header here. Chapter cards on the public site load live from the{" "}
            <b>Chapters</b> module in the CEO dashboard (active chapters only) — not from a dummy list.
          </p>
        </div>
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />
      </div>
    );
  }

  if (page === "programs") {
    const hero = asObj(sections.hero);
    const items = asArr<{ title?: string; body?: string; stat?: string }>(sections.items);
    return (
      <div className="space-y-5">
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />
        <Section title="Programs">
          <ListToolbar
            title="Program cards"
            addLabel="Add program"
            onAdd={() => patch(["items"], [...items, { title: "", body: "", stat: "" }])}
          />
          {items.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Program"
              onRemove={() => patch(["items"], items.filter((_, j) => j !== i))}
            >
              <TextInput
                label="Title"
                value={str(item.title)}
                onChange={(v) => {
                  const next = [...items];
                  next[i] = { ...item, title: v };
                  patch(["items"], next);
                }}
              />
              <TextInput
                label="Stat badge"
                value={str(item.stat)}
                onChange={(v) => {
                  const next = [...items];
                  next[i] = { ...item, stat: v };
                  patch(["items"], next);
                }}
              />
              <div className="sm:col-span-2">
                <TextInput
                  label="Description"
                  value={str(item.body)}
                  multiline
                  onChange={(v) => {
                    const next = [...items];
                    next[i] = { ...item, body: v };
                    patch(["items"], next);
                  }}
                />
              </div>
            </ItemCard>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "events") {
    const hero = asObj(sections.hero);
    const items = asArr<{
      title?: string;
      date?: string;
      location?: string;
      days?: number | string;
      capacity?: string;
    }>(sections.items);
    return (
      <div className="space-y-5">
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />
        <Section title="Events">
          <ListToolbar
            title="Event cards"
            addLabel="Add event"
            onAdd={() =>
              patch(["items"], [...items, { title: "", date: "", location: "", days: 0, capacity: "" }])
            }
          />
          {items.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Event"
              onRemove={() => patch(["items"], items.filter((_, j) => j !== i))}
            >
              <TextInput
                label="Title"
                value={str(item.title)}
                onChange={(v) => {
                  const next = [...items];
                  next[i] = { ...item, title: v };
                  patch(["items"], next);
                }}
              />
              <TextInput
                label="Date"
                value={str(item.date)}
                onChange={(v) => {
                  const next = [...items];
                  next[i] = { ...item, date: v };
                  patch(["items"], next);
                }}
              />
              <TextInput
                label="Location / city"
                value={str(item.location)}
                onChange={(v) => {
                  const next = [...items];
                  next[i] = { ...item, location: v };
                  patch(["items"], next);
                }}
              />
              <TextInput
                label="Days to go"
                value={str(item.days)}
                onChange={(v) => {
                  const next = [...items];
                  next[i] = { ...item, days: Number(v) || 0 };
                  patch(["items"], next);
                }}
              />
              <TextInput
                label="Capacity"
                value={str(item.capacity)}
                onChange={(v) => {
                  const next = [...items];
                  next[i] = { ...item, capacity: v };
                  patch(["items"], next);
                }}
              />
            </ItemCard>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "gallery") {
    const hero = asObj(sections.hero);
    const items = asArr<{ caption?: string; imageUrl?: string }>(sections.items);
    return (
      <div className="space-y-5">
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />
        <Section title="Gallery photos" description="Upload a photo and add a short caption for each item.">
          <ListToolbar
            title="Photos"
            addLabel="Add photo"
            onAdd={() => patch(["items"], [...items, { caption: "", imageUrl: "" }])}
          />
          {items.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Photo"
              onRemove={() => patch(["items"], items.filter((_, j) => j !== i))}
            >
              <GalleryImageField
                imageUrl={str(item.imageUrl)}
                onUploaded={(url) => {
                  const next = [...items];
                  next[i] = { ...item, imageUrl: url };
                  patch(["items"], next);
                }}
                onClear={() => {
                  const next = [...items];
                  next[i] = { ...item, imageUrl: "" };
                  patch(["items"], next);
                }}
              />
              <div className="sm:col-span-2">
                <TextInput
                  label="Caption"
                  value={str(item.caption)}
                  onChange={(v) => {
                    const next = [...items];
                    next[i] = { ...item, caption: v };
                    patch(["items"], next);
                  }}
                  hint="Shown when people hover or open the photo"
                />
              </div>
            </ItemCard>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "faq") {
    const hero = asObj(sections.hero);
    const items = asArr<{ q?: string; a?: string }>(sections.items);
    return (
      <div className="space-y-5">
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />
        <Section title="Questions & answers">
          <ListToolbar
            title="FAQs"
            addLabel="Add question"
            onAdd={() => patch(["items"], [...items, { q: "", a: "" }])}
          />
          {items.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="FAQ"
              onRemove={() => patch(["items"], items.filter((_, j) => j !== i))}
            >
              <div className="sm:col-span-2">
                <TextInput
                  label="Question"
                  value={str(item.q)}
                  onChange={(v) => {
                    const next = [...items];
                    next[i] = { ...item, q: v };
                    patch(["items"], next);
                  }}
                />
              </div>
              <div className="sm:col-span-2">
                <TextInput
                  label="Answer"
                  value={str(item.a)}
                  multiline
                  onChange={(v) => {
                    const next = [...items];
                    next[i] = { ...item, a: v };
                    patch(["items"], next);
                  }}
                />
              </div>
            </ItemCard>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "contact") {
    const hero = asObj(sections.hero);
    const details = asArr<{ label?: string; value?: string }>(sections.details);
    return (
      <div className="space-y-5">
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />
        <Section title="Contact details">
          <ListToolbar
            title="Details"
            addLabel="Add detail"
            onAdd={() => patch(["details"], [...details, { label: "", value: "" }])}
          />
          {details.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Detail"
              onRemove={() => patch(["details"], details.filter((_, j) => j !== i))}
            >
              <TextInput
                label="Label"
                value={str(item.label)}
                onChange={(v) => {
                  const next = [...details];
                  next[i] = { ...item, label: v };
                  patch(["details"], next);
                }}
              />
              <TextInput
                label="Value"
                value={str(item.value)}
                onChange={(v) => {
                  const next = [...details];
                  next[i] = { ...item, value: v };
                  patch(["details"], next);
                }}
              />
            </ItemCard>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "donate") {
    const hero = asObj(sections.hero);
    const bank = asObj(sections.bankAccount);
    const causes = asArr<string>(sections.causes).map((c) => (typeof c === "string" ? c : ""));
    return (
      <div className="space-y-5">
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />
        <Section
          title="Bank account (shared)"
          description="Used by the Donate page and the Home donate button popup."
        >
          <TextInput
            label="Donate button text"
            value={str(sections.cta)}
            onChange={(v) => patch(["cta"], v)}
          />
          <TextInput
            label="Bank name"
            value={str(bank.bankName)}
            onChange={(v) => patch(["bankAccount", "bankName"], v)}
          />
          <TextInput
            label="Account title"
            value={str(bank.accountTitle)}
            onChange={(v) => patch(["bankAccount", "accountTitle"], v)}
          />
          <TextInput
            label="Account number"
            value={str(bank.accountNumber)}
            onChange={(v) => patch(["bankAccount", "accountNumber"], v)}
          />
          <TextInput
            label="IBAN (optional)"
            value={str(bank.iban)}
            onChange={(v) => patch(["bankAccount", "iban"], v)}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Modal note"
              value={str(bank.note)}
              onChange={(v) => patch(["bankAccount", "note"], v)}
              multiline
            />
          </div>
        </Section>
        <Section title="Donation options">
          <div className="sm:col-span-2">
            <TextInput
              label="Note under donate section"
              value={str(sections.note)}
              onChange={(v) => patch(["note"], v)}
            />
          </div>
          <ListToolbar
            title="Causes"
            addLabel="Add cause"
            onAdd={() => patch(["causes"], [...causes, "New cause"])}
          />
          {causes.map((c, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Cause"
              onRemove={() => patch(["causes"], causes.filter((_, j) => j !== i))}
            >
              <div className="sm:col-span-2">
                <TextInput
                  label="Cause name"
                  value={c}
                  onChange={(v) => {
                    const next = [...causes];
                    next[i] = v;
                    patch(["causes"], next);
                  }}
                />
              </div>
            </ItemCard>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "volunteer") {
    const hero = asObj(sections.hero);
    const perks = asArr<{ title?: string; body?: string }>(sections.perks);
    return (
      <div className="space-y-5">
        <HeroFields hero={hero} onChange={(h) => patch(["hero"], h)} />
        <Section title="Why volunteer">
          <ListToolbar
            title="Perks"
            addLabel="Add perk"
            onAdd={() => patch(["perks"], [...perks, { title: "", body: "" }])}
          />
          {perks.map((item, i) => (
            <ItemCard
              key={i}
              index={i}
              label="Perk"
              onRemove={() => patch(["perks"], perks.filter((_, j) => j !== i))}
            >
              <TextInput
                label="Title"
                value={str(item.title)}
                onChange={(v) => {
                  const next = [...perks];
                  next[i] = { ...item, title: v };
                  patch(["perks"], next);
                }}
              />
              <TextInput
                label="Description"
                value={str(item.body)}
                onChange={(v) => {
                  const next = [...perks];
                  next[i] = { ...item, body: v };
                  patch(["perks"], next);
                }}
              />
            </ItemCard>
          ))}
        </Section>
      </div>
    );
  }

  if (page === "footer") {
    const social = asObj(sections.social);
    return (
      <div className="space-y-5">
        <Section title="Footer text">
          <div className="sm:col-span-2">
            <TextInput
              label="Organization tagline"
              value={str(sections.tagline)}
              onChange={(v) => patch(["tagline"], v)}
              multiline
            />
          </div>
          <TextInput
            label="Newsletter title"
            value={str(sections.newsletterTitle)}
            onChange={(v) => patch(["newsletterTitle"], v)}
          />
          <TextInput
            label="Copyright text"
            value={str(sections.copyright)}
            onChange={(v) => patch(["copyright"], v)}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="Newsletter description"
              value={str(sections.newsletterBody)}
              onChange={(v) => patch(["newsletterBody"], v)}
              multiline
            />
          </div>
        </Section>
        <Section
          title="Social media links"
          description="Paste full URLs (https://…). WhatsApp: use https://wa.me/923XXXXXXXXX (country code + number, no + or spaces)."
        >
          <TextInput
            label="Facebook"
            value={str(social.facebook)}
            onChange={(v) => patch(["social", "facebook"], v)}
          />
          <TextInput
            label="Instagram"
            value={str(social.instagram)}
            onChange={(v) => patch(["social", "instagram"], v)}
          />
          <TextInput
            label="Twitter / X"
            value={str(social.twitter)}
            onChange={(v) => patch(["social", "twitter"], v)}
          />
          <TextInput
            label="YouTube"
            value={str(social.youtube)}
            onChange={(v) => patch(["social", "youtube"], v)}
          />
          <div className="sm:col-span-2">
            <TextInput
              label="WhatsApp"
              value={str(social.whatsapp)}
              onChange={(v) => patch(["social", "whatsapp"], v)}
              hint="Shown as WhatsApp icon in the public site footer. Example: https://wa.me/923001234567"
            />
          </div>
        </Section>
      </div>
    );
  }

  return (
    <p className="text-sm text-muted-foreground">No form available for this page yet.</p>
  );
}
