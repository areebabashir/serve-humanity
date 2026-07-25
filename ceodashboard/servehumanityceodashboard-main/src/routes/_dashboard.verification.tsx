import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { VerificationTeamPanel } from "@/components/operations/VerificationTeamPanel";

export const Route = createFileRoute("/_dashboard/verification")({
  head: () => ({ meta: [{ title: "Team Verification — Serve Humanity" }] }),
  component: VerificationPage,
});

function VerificationPage() {
  return (
    <PageShell>
      <PageHeader
        title="Team Verification"
        description="Verification Excel file — add rows, edit, and download."
      />
      <VerificationTeamPanel />
    </PageShell>
  );
}
