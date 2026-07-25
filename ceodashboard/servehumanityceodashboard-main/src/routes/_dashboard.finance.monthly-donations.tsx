import { createFileRoute } from "@tanstack/react-router";
import { FinanceDonationPage } from "@/components/finance/FinanceDonationPage";

export const Route = createFileRoute("/_dashboard/finance/monthly-donations")({
  head: () => ({ meta: [{ title: "Monthly Team Donations — Finance" }] }),
  component: FinanceDonationPage,
});
