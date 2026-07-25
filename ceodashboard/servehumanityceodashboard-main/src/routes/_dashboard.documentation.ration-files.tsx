import { createFileRoute } from "@tanstack/react-router";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";

export const Route = createFileRoute("/_dashboard/documentation/ration-files")({
  head: () => ({ meta: [{ title: "Ration Case Files — Documentation" }] }),
  component: () => (
    <DocumentationTypePage
      type="ration_file"
      description="Dedicated ration transfer case files with payment details."
    />
  ),
});
