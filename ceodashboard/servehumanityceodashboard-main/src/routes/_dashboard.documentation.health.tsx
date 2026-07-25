import { createFileRoute } from "@tanstack/react-router";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";

export const Route = createFileRoute("/_dashboard/documentation/health")({
  head: () => ({ meta: [{ title: "Health Cases — Documentation" }] }),
  component: () => (
    <DocumentationTypePage type="health" description="Regular case files for health / medical assistance." />
  ),
});
