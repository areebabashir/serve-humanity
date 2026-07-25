import { createFileRoute } from "@tanstack/react-router";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";

export const Route = createFileRoute("/_dashboard/documentation/ration")({
  head: () => ({ meta: [{ title: "Ration Cases — Documentation" }] }),
  component: () => (
    <DocumentationTypePage type="ration" description="Regular case files for ration / rashan support." />
  ),
});
