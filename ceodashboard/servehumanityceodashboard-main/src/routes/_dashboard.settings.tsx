import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Serve Humanity" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <PageShell>
      <PageHeader title="Settings" description="Organization profile, notifications, integrations, and broadcasts." />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Organization</TabsTrigger>
          <TabsTrigger value="notify">Notifications</TabsTrigger>
          <TabsTrigger value="broadcast">Announcements</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] space-y-4 max-w-2xl">
            <div className="grid gap-1.5"><Label>Organization name</Label><Input defaultValue="Serve Humanity (Khidmat-e-Insaniyat Welfare Society)" /></div>
            <div className="grid gap-1.5"><Label>Registered address</Label><Textarea defaultValue="Head Office, Lahore, Pakistan" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Primary contact email</Label><Input defaultValue="hq@servehumanity.org" /></div>
              <div className="grid gap-1.5"><Label>Helpline</Label><Input defaultValue="+92 300 000 0000" /></div>
            </div>
            <div className="flex justify-end"><Button onClick={() => toast.success("Profile saved")}>Save changes</Button></div>
          </div>
        </TabsContent>
        <TabsContent value="notify" className="mt-4">
          <div className="rounded-xl border border-border bg-card divide-y divide-border shadow-[var(--shadow-card)] max-w-2xl">
            {["Verification queue > SLA","New chapter proposals","Large expense approvals","Media submissions","Weekly finance summary"].map((n) => (
              <div key={n} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{n}</p>
                  <p className="text-xs text-muted-foreground">Email + in-app</p>
                </div>
                <Switch defaultChecked />
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="broadcast" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] max-w-2xl space-y-3">
            <div className="grid gap-1.5"><Label>Announcement</Label><Textarea placeholder="Message shown as a banner across every chapter dashboard…" rows={4} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Priority</Label><Input defaultValue="Normal" /></div>
              <div className="grid gap-1.5"><Label>Expires on</Label><Input type="date" /></div>
            </div>
            <div className="flex justify-end"><Button style={{ background: "var(--gradient-brand)" }} className="text-white border-0" onClick={() => toast.success("Announcement broadcast")}>Broadcast to all chapters</Button></div>
          </div>
        </TabsContent>
        <TabsContent value="integrations" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Payment Gateway", status: "Connected" },
              { name: "Email Provider", status: "Connected" },
              { name: "SMS Provider", status: "Not connected" },
              { name: "Cloud Storage", status: "Connected" },
              { name: "Analytics", status: "Not connected" },
            ].map((i) => (
              <div key={i.name} className="rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                <p className="font-medium">{i.name}</p>
                <p className={`mt-1 text-xs ${i.status === "Connected" ? "text-[color:var(--success)]" : "text-muted-foreground"}`}>{i.status}</p>
                <Button size="sm" variant="outline" className="mt-3 w-full">{i.status === "Connected" ? "Manage" : "Connect"}</Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}