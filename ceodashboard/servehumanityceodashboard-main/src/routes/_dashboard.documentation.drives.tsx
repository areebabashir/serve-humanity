import { createFileRoute } from "@tanstack/react-router";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";

export const Route = createFileRoute("/_dashboard/documentation/drives")({
  head: () => ({ meta: [{ title: "Drive Files — Documentation" }] }),
  component: () => (
    <DocumentationTypePage type="drive" description="Drive files for all drive types with expenses and photos." />
  ),
});
