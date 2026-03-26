import { Suspense } from "react";
import { ClientsContent } from "./ClientsContent";
import { LoadingState } from "@/components/LoadingState";

export const metadata = {
  title: "Clients | WYRE AI Impact Tracker",
};

export default function ClientsPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ClientsContent />
    </Suspense>
  );
}
