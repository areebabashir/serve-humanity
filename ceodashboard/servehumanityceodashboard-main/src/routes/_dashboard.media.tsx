import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/media")({
  component: MediaLayout,
});

function MediaLayout() {
  return <Outlet />;
}
