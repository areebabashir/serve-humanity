import { createFileRoute } from "@tanstack/react-router";
import { DocumentationTypePage } from "@/components/documentation/DocumentationTypePage";

export const Route = createFileRoute("/_dashboard/documentation/stats")({
  head: () => ({ meta: [{ title: "Stat Files — Documentation" }] }),
  component: () => (
    <DocumentationTypePage type="stat" description="Category totals, drives, camps, and overall amounts." />
  ),
});
