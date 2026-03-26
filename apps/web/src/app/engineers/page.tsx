import { Suspense } from "react";
import { EngineersContent } from "./EngineersContent";
import { LoadingState } from "@/components/LoadingState";

export const metadata = {
  title: "Engineers | WYRE AI Impact Tracker",
};

export default function EngineersPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <EngineersContent />
    </Suspense>
  );
}
