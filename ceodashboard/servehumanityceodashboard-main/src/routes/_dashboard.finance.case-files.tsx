import { createFileRoute } from "@tanstack/react-router";
import { FinanceCasePage } from "@/components/finance/FinanceCasePage";

export const Route = createFileRoute("/_dashboard/finance/case-files")({
  head: () => ({ meta: [{ title: "Finance Case Files — Finance" }] }),
  component: FinanceCasePage,
});
