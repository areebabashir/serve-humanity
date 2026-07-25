import { createFileRoute } from "@tanstack/react-router";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";

export const Route = createFileRoute("/_dashboard/documentation/references")({
  head: () => ({ meta: [{ title: "Reference Files — Documentation" }] }),
  component: () => (
    <DocumentationTypePage type="reference" description="Reference numbers with descriptions and dates." />
  ),
});
