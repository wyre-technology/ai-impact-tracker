import { Suspense } from "react";
import { EngineerDetailContent } from "./EngineerDetailContent";
import { LoadingState } from "@/components/LoadingState";

export const metadata = {
  title: "Engineer Detail | WYRE AI Impact Tracker",
};

export default function EngineerDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <Suspense fallback={<LoadingState />}>
      <EngineerDetailContent engineerId={params.id} />
    </Suspense>
  );
}
