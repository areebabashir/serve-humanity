import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_dashboard/finance")({
  component: FinanceLayout,
});

function FinanceLayout() {
  return <Outlet />;
}
