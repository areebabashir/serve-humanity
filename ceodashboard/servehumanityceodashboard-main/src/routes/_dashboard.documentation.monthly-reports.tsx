import { createFileRoute } from "@tanstack/react-router";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";

export const Route = createFileRoute("/_dashboard/documentation/monthly-reports")({
  head: () => ({ meta: [{ title: "Monthly Reports — Documentation" }] }),
  component: () => (
    <DocumentationTypePage
      type="monthly_report"
      description="Monthly reports covering regular cases, ration, and drives."
    />
  ),
});
