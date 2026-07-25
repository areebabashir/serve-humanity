import { createFileRoute } from "@tanstack/react-router";
import { MediaTemplatesPage } from "@/components/media/MediaTemplatesPage";

export const Route = createFileRoute("/_dashboard/media/templates")({
  head: () => ({ meta: [{ title: "Templates — Serve Humanity" }] }),
  component: MediaTemplatesPage,
});
