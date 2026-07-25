import { createFileRoute } from "@tanstack/react-router";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";

export const Route = createFileRoute("/_dashboard/documentation/marriage")({
  head: () => ({ meta: [{ title: "Marriage Cases — Documentation" }] }),
  component: () => (
    <DocumentationTypePage type="marriage" description="Regular case files for orphan / marriage support." />
  ),
});
