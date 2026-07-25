import { createFileRoute } from "@tanstack/react-router";
import { WebsiteCmsPage } from "@/components/website/WebsiteCmsPage";

export const Route = createFileRoute("/_dashboard/website")({
  component: WebsiteCmsPage,
});
