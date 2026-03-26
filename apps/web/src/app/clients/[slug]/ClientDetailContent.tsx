"use client";

import Link from "next/link";
import { KPICard } from "@/components/KPICard";
import { DateRangePicker, useDateRangePreset } from "@/components/DateRangePicker";
import { HoursSavedChart, TaskTypeDonut, EngineerContributions } from "@/components/Charts";
import { SessionTable } from "@/components/SessionTable";
import { LoadingState, ErrorState } from "@/components/LoadingState";
import { useClient, useMetricsSummary, useEngineerMetrics, useSessions } from "@/lib/api";
import { getDateRangeFromPreset } from "@/lib/date-range";
import { formatDollars, formatHours, formatRatio, formatNumber } from "@/lib/format";
import { useState } from "react";

interface Props {
  slug: string;
}

export function ClientDetailContent({ slug }: Props) {
  const preset = useDateRangePreset();
  const dateRange = getDateRangeFromPreset(preset);
  const [page, setPage] = useState(1);

  const { data: client, error: clientError } = useClient(slug);
  const { data: metrics, error: metricsError, isLoading } = useMetricsSummary({
    dateRange,
    clientId: client?.id,
  });
  const { data: engineers } = useEngineerMetrics({
    dateRange,
    clientId: client?.id,
  });
  const { data: sessionsData } = useSessions({
    dateRange,
    clientId: client?.id,
    page,
    perPage: 10,
  });

  if (isLoading || !client) return <LoadingState />;
  if (clientError || metricsError) return <ErrorState />;

  const engineerBarData = (engineers || []).map((e) => ({
    engineer_name: e.engineer_name,
    hours_saved: e.hours_saved,
    sessions: e.total_sessions,
  }));

  return (
    <div className="space-y-8">
      {/* Breadcrumb + Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link
              href="/clients"
              className="hover:text-white transition-colors"
            >
              Clients
            </Link>
            <span>/</span>
            <span className="text-white">{client.name}</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white">{client.name}</h1>
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
      {metrics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <HoursSavedChart data={metrics.by_month || []} />
          <TaskTypeDonut data={metrics.by_task_type || {}} />
        </div>
      )}

      {/* Engineer Contributions */}
      {engineerBarData.length > 0 && (
        <EngineerContributions data={engineerBarData} />
      )}

      {/* Session History */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Session History
        </h2>
        <SessionTable
          sessions={sessionsData?.items || []}
          showClient={false}
          page={page}
          totalPages={sessionsData?.pages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
