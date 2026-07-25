import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/documentation")({
  component: DocumentationLayout,
});

function DocumentationLayout() {
  return <Outlet />;
}
