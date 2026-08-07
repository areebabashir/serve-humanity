import { createFileRoute } from "@tanstack/react-router";

import { PageHeader, PageShell } from "@/components/dashboard/page-shell";
import { MediaTeamPanel } from "@/components/operations/MediaTeamPanel";

export const Route = createFileRoute("/_dashboard/media/case-files")({
  head: () => ({
    meta: [{ title: "Reference File – Team Media and Graphic — Serve Humanity" }],
  }),
  component: MediaCaseFilesPage,
});

function MediaCaseFilesPage() {
  return (
    <PageShell>
      <PageHeader
        title="Reference File – Team Media and Graphic"
        description="Media and graphic reference file — add rows, edit, and download. Same interface as verification."
      />
      <MediaTeamPanel canWrite />
    </PageShell>
  );
}
