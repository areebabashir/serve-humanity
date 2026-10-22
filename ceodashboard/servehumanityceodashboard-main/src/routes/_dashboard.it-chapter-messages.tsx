import { createFileRoute } from "@tanstack/react-router";
import { ItInboxPage } from "@/components/dashboard/it-inbox-page";

export const Route = createFileRoute("/_dashboard/it-chapter-messages")({
  head: () => ({ meta: [{ title: "IT — Chapter Messages — Serve Humanity" }] }),
  component: () => (
    <ItInboxPage
      scope="chapter"
      title="IT — Chapter messages"
      description="Queries and chats with every chapter account (presidents, cabinet, members). Reply here and start new conversations."
    />
  ),
});
