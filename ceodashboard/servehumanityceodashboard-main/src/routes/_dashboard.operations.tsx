import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { OperationTeamPanel } from "@/components/operations/OperationTeamPanel";

export const Route = createFileRoute("/_dashboard/operations")({
  head: () => ({ meta: [{ title: "Ration Cases Status File — Serve Humanity" }] }),
  component: OperationsPage,
});

function OperationsPage() {
  return (
    <PageShell>
      <PageHeader
        title="Ration Cases Status File"
        description="Ration cases status Excel — Case Number, Family Guardian, City, Rashan Status. Add rows, edit, and download."
      />
      <OperationTeamPanel />
    </PageShell>
  );
}
