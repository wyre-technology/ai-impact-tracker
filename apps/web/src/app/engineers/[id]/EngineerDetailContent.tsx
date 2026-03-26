"use client";

import Link from "next/link";
import { KPICard } from "@/components/KPICard";
import { DateRangePicker, useDateRangePreset } from "@/components/DateRangePicker";
import { TaskTypeDonut, ClientDistribution } from "@/components/Charts";
import { SessionTable } from "@/components/SessionTable";
import { LoadingState, ErrorState } from "@/components/LoadingState";
import {
  useEngineer,
  useMetricsSummary,
  useClientMetrics,
  useSessions,
} from "@/lib/api";
import { getDateRangeFromPreset } from "@/lib/date-range";
import { formatDollars, formatHours, formatRatio, formatNumber } from "@/lib/format";
import { useState } from "react";

interface Props {
  engineerId: string;
}

export function EngineerDetailContent({ engineerId }: Props) {
  const preset = useDateRangePreset();
  const dateRange = getDateRangeFromPreset(preset);
  const [page, setPage] = useState(1);

  const { data: engineer, error: engineerError } = useEngineer(engineerId);
  const { data: metrics, error: metricsError, isLoading } = useMetricsSummary({
    dateRange,
    engineerId,
  });
  const { data: clientMetrics } = useClientMetrics({
    dateRange,
    engineerId,
  });
  const { data: sessionsData } = useSessions({
    dateRange,
    engineerId,
    page,
    perPage: 10,
  });

  if (isLoading || !engineer) return <LoadingState />;
  if (engineerError || metricsError) return <ErrorState />;

  const clientDistData = (clientMetrics || []).map((c) => ({
    client_name: c.client_name,
    hours_saved: c.hours_saved,
  }));

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link
              href="/engineers"
              className="hover:text-white transition-colors"
            >
              Engineers
            </Link>
            <span>/</span>
            <span className="text-white">{engineer.name}</span>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-wyre-600/20 text-sm font-bold text-wyre-400">
              {engineer.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{engineer.name}</h1>
              <p className="text-sm text-gray-400">{engineer.email}</p>
            </div>
          </div>
        </div>
        <DateRangePicker />
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Hours Saved"
            value={formatHours(metrics.hours_saved)}
          />
          <KPICard
            title="Dollar Value"
            value={formatDollars(metrics.dollar_value)}
          />
          <KPICard
            title="AI Leverage Ratio"
            value={formatRatio(metrics.ai_leverage_ratio)}
          />
          <KPICard
            title="Total Sessions"
            value={formatNumber(metrics.total_sessions)}
          />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {metrics && <TaskTypeDonut data={metrics.by_task_type || {}} />}
        {clientDistData.length > 0 && (
          <ClientDistribution data={clientDistData} />
        )}
      </div>

      {/* Session History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Session History
        </h2>
        <SessionTable
          sessions={sessionsData?.items || []}
          showEngineer={false}
          page={page}
          totalPages={sessionsData?.pages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
