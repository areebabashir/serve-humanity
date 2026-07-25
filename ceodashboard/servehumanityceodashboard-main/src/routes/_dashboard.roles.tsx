import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { users } from "@/lib/mock-data";

export const Route = createFileRoute("/_dashboard/roles")({
  head: () => ({ meta: [{ title: "Roles & Permissions — Serve Humanity" }] }),
  component: RolesPage,
});

const modules = ["Chapters", "Verification", "Finance", "Media", "Documentation", "Reports"];
const roles = ["President", "Vice President", "Finance Head", "Operations Head", "Media Head", "Member"];

const auditLog = [
  { who: "Dr. Ahsan Khan (CEO)", what: "Promoted Sana Malik to Vice President", when: "1h ago" },
  { who: "Dr. Ahsan Khan (CEO)", what: "Granted Kamran Ali Media approval rights", when: "1d ago" },
  { who: "Board", what: "Removed inactive user account", when: "3d ago" },
];

function PermissionsMatrix() {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="p-3 text-left font-medium">Role</th>
            {modules.map((m) => <th key={m} className="p-3 text-center font-medium">{m}</th>)}
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r} className="border-t border-border">
              <td className="p-3 font-medium">{r}</td>
              {modules.map((m) => (
                <td key={m} className="p-3 text-center">
                  <Switch defaultChecked={r !== "Member" || m === "Chapters"} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RolesPage() {
  return (
    <PageShell>
      <PageHeader title="Roles & Permissions" description="Manage users, roles, and module-level access." />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="matrix">Permission matrix</TabsTrigger>
          <TabsTrigger value="requests">Pending requests</TabsTrigger>
          <TabsTrigger value="audit">Audit log</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Chapter</TableHead>
                  <TableHead>Permission</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.role}</TableCell>
                    <TableCell>{u.chapter}</TableCell>
                    <TableCell><Badge variant="secondary">{u.permission}</Badge></TableCell>
                    <TableCell className="text-muted-foreground">{u.lastActive}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline">Reassign</Button>
                      <Button size="sm" variant="ghost">Transfer</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="matrix" className="mt-4"><PermissionsMatrix /></TabsContent>
        <TabsContent value="requests" className="mt-4">
          <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="font-medium">Promote Hina Sheikh → Finance Board Member</p>
                <p className="text-xs text-muted-foreground">Requested by Lahore Central • 2h ago</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Reject</Button>
                <Button size="sm">Approve</Button>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3">
              <div>
                <p className="font-medium">New Media Head role — Peshawar</p>
                <p className="text-xs text-muted-foreground">Requested by Peshawar • 1d ago</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">Reject</Button>
                <Button size="sm">Approve</Button>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="audit" className="mt-4">
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <Table>
              <TableHeader><TableRow><TableHead>Actor</TableHead><TableHead>Action</TableHead><TableHead>When</TableHead></TableRow></TableHeader>
              <TableBody>
                {auditLog.map((a, i) => (
                  <TableRow key={i}><TableCell className="font-medium">{a.who}</TableCell><TableCell>{a.what}</TableCell><TableCell className="text-muted-foreground">{a.when}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}