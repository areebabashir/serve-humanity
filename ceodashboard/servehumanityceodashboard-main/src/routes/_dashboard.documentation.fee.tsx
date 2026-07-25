import { createFileRoute } from "@tanstack/react-router";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";

export const Route = createFileRoute("/_dashboard/documentation/fee")({
  head: () => ({ meta: [{ title: "Fee Cases — Documentation" }] }),
  component: () => (
    <DocumentationTypePage type="fee" description="Regular case files for student fee support." />
  ),
});
