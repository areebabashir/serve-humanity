import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/media/")({
  beforeLoad: () => {
    throw redirect({ to: "/media/case-files" });
  },
});
