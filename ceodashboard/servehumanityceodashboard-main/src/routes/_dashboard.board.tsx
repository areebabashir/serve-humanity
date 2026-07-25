import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { boardMembers } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarPlus } from "lucide-react";

export const Route = createFileRoute("/_dashboard/board")({
  head: () => ({ meta: [{ title: "Board & Governance — Serve Humanity" }] }),
  component: BoardPage,
});

const resolutions = [
  { id: "R-2026-07", title: "Approve Hyderabad chapter launch", votes: "6 / 7", outcome: "Passed" },
  { id: "R-2026-06", title: "Increase annual audit budget", votes: "5 / 7", outcome: "Passed" },
  { id: "R-2026-05", title: "Adopt new whistleblower policy", votes: "7 / 7", outcome: "Passed" },
  { id: "R-2026-04", title: "Purchase mobile medical unit", votes: "3 / 7", outcome: "Rejected" },
];

function BoardPage() {
  return (
    <PageShell>
      <PageHeader title="Board & Governance" description="Board directory, meetings, and resolutions." actions={
        <Button><CalendarPlus className="h-4 w-4" />Schedule meeting</Button>
      } />
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="resolutions">Resolutions</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="mt-4">
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Term</TableHead><TableHead>Contact</TableHead></TableRow></TableHeader>
              <TableBody>
                {boardMembers.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell>{m.role}</TableCell>
                    <TableCell>{m.term}</TableCell>
                    <TableCell className="text-muted-foreground">{m.contact}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="meetings" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { date: "2026-08-05", topic: "Q3 review + Hyderabad launch", status: "Upcoming" },
              { date: "2026-07-01", topic: "Mid-year finance audit", status: "Minutes available" },
              { date: "2026-06-04", topic: "New governance policy", status: "Minutes available" },
            ].map((m, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{m.topic}</p>
                  <Badge variant="secondary">{m.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{m.date}</p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline">View minutes</Button>
                  <Button size="sm" variant="ghost">Attendees</Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="resolutions" className="mt-4">
          <div className="rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Title</TableHead><TableHead>Votes</TableHead><TableHead>Outcome</TableHead></TableRow></TableHeader>
              <TableBody>
                {resolutions.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>{r.votes}</TableCell>
                    <TableCell><Badge className={r.outcome === "Passed" ? "bg-[color:var(--success)]/15 text-[color:var(--success)] border-0" : "bg-destructive/15 text-destructive border-0"}>{r.outcome}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}