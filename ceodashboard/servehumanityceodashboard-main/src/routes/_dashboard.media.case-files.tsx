import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { MediaTeamPanel } from "@/components/operations/MediaTeamPanel";

export const Route = createFileRoute("/_dashboard/media/case-files")({
  head: () => ({ meta: [{ title: "Team Media Cases — Serve Humanity" }] }),
  component: MediaCaseFilesPage,
});

function MediaCaseFilesPage() {
  return (
    <PageShell>
      <PageHeader
        title="Team Media Cases"
        description="Media case Excel file — add rows, edit, and download. Same interface as verification."
      />
      <MediaTeamPanel canWrite />
    </PageShell>
  );
}
