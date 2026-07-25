import { createFileRoute } from "@tanstack/react-router";
import { CertificateGenerator } from "@/components/media/CertificateGenerator";

export const Route = createFileRoute("/_dashboard/media/certificate-generator")({
  head: () => ({ meta: [{ title: "Certificate Generator — Serve Humanity" }] }),
  component: CertificateGenerator,
});
