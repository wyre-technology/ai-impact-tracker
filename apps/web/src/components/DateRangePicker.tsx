"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { DATE_RANGE_OPTIONS } from "@/lib/date-range";
import type { DateRangePreset } from "@/lib/types";

export function DateRangePicker() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const current = (searchParams.get("range") as DateRangePreset) || "3m";

  function setRange(value: DateRangePreset) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("range", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-dark-border bg-dark-card p-1">
      {DATE_RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setRange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            current === opt.value
              ? "bg-wyre-600 text-white"
              : "text-gray-400 hover:text-white hover:bg-dark-hover"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Hook to read the current date range preset from URL params.
 */
export function useDateRangePreset(): DateRangePreset {
  const searchParams = useSearchParams();
  return (searchParams.get("range") as DateRangePreset) || "3m";
}
