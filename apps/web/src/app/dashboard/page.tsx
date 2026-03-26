import { Suspense } from "react";
import { DashboardContent } from "./DashboardContent";
import { LoadingState } from "@/components/LoadingState";

export const metadata = {
  title: "Dashboard | WYRE AI Impact Tracker",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardContent />
    </Suspense>
  );
}
