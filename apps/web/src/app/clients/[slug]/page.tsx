import { Suspense } from "react";
import { ClientDetailContent } from "./ClientDetailContent";
import { LoadingState } from "@/components/LoadingState";

export const metadata = {
  title: "Client Detail | WYRE AI Impact Tracker",
};

export default function ClientDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <ClientDetailContent slug={params.slug} />
    </Suspense>
  );
}
