"use client";

import Link from "next/link";
import { DateRangePicker, useDateRangePreset } from "@/components/DateRangePicker";
import { LoadingState, ErrorState } from "@/components/LoadingState";
import { useEngineerMetrics } from "@/lib/api";
import { getDateRangeFromPreset } from "@/lib/date-range";
import { formatHours, formatRatio, formatNumber } from "@/lib/format";

export function EngineersContent() {
  const preset = useDateRangePreset();
  const dateRange = getDateRangeFromPreset(preset);

  const { data: engineers, error, isLoading } = useEngineerMetrics({ dateRange });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;

  const sorted = [...(engineers || [])].sort(
    (a, b) => b.hours_saved - a.hours_saved,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Engineers</h1>
          <p className="mt-1 text-sm text-gray-400">
            Individual AI impact by engineer
          </p>
        </div>
        <DateRangePicker />
      </div>

      {/* Engineer Cards */}
      {sorted.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          No engineer data available for this period.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((engineer) => (
            <Link
              key={engineer.engineer_id}
              href={`/engineers/${engineer.engineer_id}`}
              className="group rounded-xl border border-dark-border bg-dark-card p-6 transition-colors hover:border-wyre-600/40 hover:bg-dark-hover"
            >
              {/* Avatar + Name */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wyre-600/20 text-sm font-bold text-wyre-400">
                  {engineer.engineer_name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-wyre-400 transition-colors">
                  {engineer.engineer_name}
                </h3>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Sessions</p>
                  <p className="mt-1 text-lg font-bold text-gray-300">
                    {formatNumber(engineer.total_sessions)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hours Saved</p>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {formatHours(engineer.hours_saved)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Leverage</p>
                  <p className="mt-1 text-lg font-bold text-wyre-400">
                    {formatRatio(engineer.ai_leverage_ratio)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
