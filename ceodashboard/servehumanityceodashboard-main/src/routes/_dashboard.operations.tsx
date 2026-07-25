import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { OperationTeamPanel } from "@/components/operations/OperationTeamPanel";

export const Route = createFileRoute("/_dashboard/operations")({
  head: () => ({ meta: [{ title: "Team Operation — Serve Humanity" }] }),
  component: OperationsPage,
});

function OperationsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Team Operation"
        description="Operation Excel file — add rows, edit, and download."
      />
      <OperationTeamPanel />
    </PageShell>
  );
}
