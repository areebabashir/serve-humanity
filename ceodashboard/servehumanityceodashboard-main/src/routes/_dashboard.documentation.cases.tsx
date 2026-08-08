import { createFileRoute } from "@tanstack/react-router";
import { DocumentationCasesPage } from "@/components/documentation/DocumentationCasesPage";

export const Route = createFileRoute("/_dashboard/documentation/cases")({
  head: () => ({
    meta: [{ title: "Documentation Cases — Pending / Running / Complete" }],
  }),
  component: DocumentationCasesPage,
});
