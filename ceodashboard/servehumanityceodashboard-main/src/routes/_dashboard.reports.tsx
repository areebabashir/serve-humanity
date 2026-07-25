import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { chapters } from "@/lib/mock-data";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

export const Route = createFileRoute("/_dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports & Analytics — Serve Humanity" }] }),
  component: ReportsPage,
});

const categoryBreakdown = [
  { name: "Medical", value: 42, color: "var(--brand-blue)" },
  { name: "Education", value: 24, color: "var(--brand-orange)" },
  { name: "Housing", value: 14, color: "var(--brand-orange-deep)" },
  { name: "Livelihood", value: 12, color: "var(--brand-blue-mid)" },
  { name: "Emergency", value: 8, color: "var(--success)" },
];

function ReportsPage() {
  return (
    <PageShell>
      <PageHeader title="Reports & Analytics" description="Build custom reports or export pre-built templates." />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="text-sm font-semibold">Custom report builder</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="grid gap-1.5"><Label>Metric</Label>
              <Select defaultValue="donations"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="donations">Donations</SelectItem>
                  <SelectItem value="cases">Welfare cases</SelectItem>
                  <SelectItem value="volunteers">Volunteer growth</SelectItem>
                  <SelectItem value="events">Events & impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5"><Label>Date range</Label>
              <Select defaultValue="ytd"><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="qtd">This quarter</SelectItem>
                  <SelectItem value="ytd">Year to date</SelectItem>
                  <SelectItem value="custom">Custom…</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 grid gap-1.5">
              <Label>Chapters</Label>
              <div className="grid gap-2 sm:grid-cols-2 rounded-lg border border-border p-3 max-h-40 overflow-auto">
                {chapters.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-sm">
                    <Checkbox defaultChecked />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="grid gap-1.5"><Label>Format</Label><Input defaultValue="PDF + Excel" readOnly /></div>
            <div className="grid gap-1.5"><Label>Recipient email</Label><Input placeholder="board@servehumanity.org" /></div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline">Preview</Button>
            <Button style={{ background: "var(--gradient-brand)" }} className="text-white border-0"><Download className="h-4 w-4" />Generate</Button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <h2 className="text-sm font-semibold">Cases by category</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {categoryBreakdown.map((c, i) => <Cell key={i} fill={c.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Report templates</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {["Donations summary", "Cases handled", "Volunteer growth", "Event impact"].map((t) => (
            <div key={t} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent/15 text-accent"><FileText className="h-5 w-5" /></div>
              <p className="mt-3 font-medium">{t}</p>
              <p className="text-xs text-muted-foreground">Pre-built • updates monthly</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" className="flex-1"><FileText className="h-4 w-4" />PDF</Button>
                <Button size="sm" variant="outline" className="flex-1"><FileSpreadsheet className="h-4 w-4" />Excel</Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}