import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  Bell,
  Globe,
  KeyRound,
  Landmark,
  Loader2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiRequestError, setToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ORG_ROLE_LABEL, isFullAccessRole, type OrgRole } from "@/lib/roles";

export const Route = createFileRoute("/_dashboard/settings")({
  head: () => ({ meta: [{ title: "Settings — Serve Humanity" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    setName(user?.name || "");
    setEmail(user?.email || "");
    setPhone(user?.phone || "");
  }, [user?.name, user?.email, user?.phone]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    setSaving(true);
    try {
      await api(`/users/${user._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
        }),
      });
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    if (!pw.current) {
      toast.error("Enter your current password");
      return;
    }
    if (pw.next.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setPwSaving(true);
    try {
      const res = await api<{ success: true; token?: string }>("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.next,
        }),
      });
      if (res.token) setToken(res.token);
      await refresh();
      toast.success("Password updated");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err) {
      toast.error(err instanceof ApiRequestError ? err.message : "Password change failed");
    } finally {
      setPwSaving(false);
    }
  }

  const roleLabel =
    user?.systemRole && ORG_ROLE_LABEL[user.systemRole as OrgRole]
      ? ORG_ROLE_LABEL[user.systemRole as OrgRole]
      : user?.systemRole || "—";

  return (
    <PageShell>
      <PageHeader
        title="Settings"
        description="Your account profile, security, and shortcuts to live tools."
      />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="tools">Shortcuts</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                  <UserRound className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Account</h2>
                  <p className="text-xs text-muted-foreground">Signed-in leadership profile</p>
                </div>
              </div>
              <dl className="mb-5 space-y-2.5 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Role</dt>
                  <dd>
                    <Badge variant={isFullAccessRole(user?.systemRole) ? "default" : "secondary"}>
                      {roleLabel}
                    </Badge>
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>
                    {user?.isActive === false ? (
                      <Badge variant="outline">Inactive</Badge>
                    ) : (
                      <Badge
                        className="border-0 bg-[color:var(--success)]/15 text-[color:var(--success)]"
                        variant="secondary"
                      >
                        Active
                      </Badge>
                    )}
                  </dd>
                </div>
              </dl>
              <form onSubmit={saveProfile} className="space-y-3">
                <div className="grid gap-1.5">
                  <Label htmlFor="settings-name">Display name</Label>
                  <Input
                    id="settings-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="settings-email">Email (login)</Label>
                  <Input
                    id="settings-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@servehumanity.org"
                    autoComplete="email"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This is your login email. Use a unique address not already on another account.
                  </p>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="settings-phone">Phone</Label>
                  <Input
                    id="settings-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 …"
                  />
                </div>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Save profile
                </Button>
              </form>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold">About this page</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Profile changes save to your live account. Organization website content (name,
                contact, about) is edited under Website CMS. Board seats are managed under Board
                &amp; Governance.
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <Link to="/website" className="text-primary hover:underline">
                    Edit public website content →
                  </Link>
                </li>
                <li>
                  <Link to="/board" className="text-primary hover:underline">
                    Manage board accounts →
                  </Link>
                </li>
                <li>
                  <Link to="/roles" className="text-primary hover:underline">
                    View roles &amp; permissions →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-4">
          <div className="max-w-lg rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent/15 text-accent">
                <KeyRound className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Change password</h2>
                <p className="text-xs text-muted-foreground">
                  Requires your current password. Minimum 6 characters.
                </p>
              </div>
            </div>
            <form onSubmit={changePassword} className="space-y-3">
              <div className="grid gap-1.5">
                <Label htmlFor="pw-current">Current password</Label>
                <Input
                  id="pw-current"
                  type="password"
                  autoComplete="current-password"
                  value={pw.current}
                  onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pw-next">New password</Label>
                <Input
                  id="pw-next"
                  type="password"
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                  minLength={6}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="pw-confirm">Confirm new password</Label>
                <Input
                  id="pw-confirm"
                  type="password"
                  autoComplete="new-password"
                  value={pw.confirm}
                  onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
                  minLength={6}
                  required
                />
              </div>
              <Button type="submit" disabled={pwSaving}>
                {pwSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Update password
              </Button>
            </form>
          </div>
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Notifications",
                desc: "Send announcements to BOG, presidents, or members.",
                to: "/notifications",
                icon: Bell,
              },
              {
                title: "Website CMS",
                desc: "Update public site pages, donate details, and about content.",
                to: "/website",
                icon: Globe,
              },
              {
                title: "Board & Governance",
                desc: "Create or remove CEO dashboard leadership accounts.",
                to: "/board",
                icon: Landmark,
              },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.desc}</p>
                <p className="mt-3 text-xs font-medium text-primary">Open →</p>
              </Link>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
