"use client";

import { KPICard } from "@/components/KPICard";
import { DateRangePicker, useDateRangePreset } from "@/components/DateRangePicker";
import { HoursSavedChart, TaskTypeDonut, TopClientsBar } from "@/components/Charts";
import { SessionTable } from "@/components/SessionTable";
import { LoadingState, ErrorState } from "@/components/LoadingState";
import { useMetricsSummary, useClientMetrics, useSessions } from "@/lib/api";
import { getDateRangeFromPreset } from "@/lib/date-range";
import { formatDollars, formatHours, formatRatio, formatNumber } from "@/lib/format";

export function DashboardContent() {
  const preset = useDateRangePreset();
  const dateRange = getDateRangeFromPreset(preset);

  const { data: metrics, error: metricsError, isLoading: metricsLoading } =
    useMetricsSummary({ dateRange });
  const { data: clientMetrics } = useClientMetrics({ dateRange });
  const { data: sessionsData } = useSessions({
    dateRange,
    page: 1,
    perPage: 10,
  });

  if (metricsLoading) return <LoadingState />;
  if (metricsError) return <ErrorState />;

  const clientBarData = (clientMetrics || []).map((c) => ({
    name: c.client_name,
    hours_saved: c.hours_saved,
    dollar_value: c.dollar_value,
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            Aggregate AI impact across all engineers and clients
          </p>
        </div>
        <DateRangePicker />
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Hours Saved"
            value={formatHours(metrics.hours_saved)}
            subtitle={`${formatHours(metrics.total_estimated_manual_hours)} manual equiv.`}
          />
          <KPICard
            title="Dollar Value"
            value={formatDollars(metrics.dollar_value)}
            subtitle="Cost avoidance"
          />
          <KPICard
            title="AI Leverage Ratio"
            value={formatRatio(metrics.ai_leverage_ratio)}
            subtitle="Manual hours per AI hour"
          />
          <KPICard
            title="Total Sessions"
            value={formatNumber(metrics.total_sessions)}
            subtitle={`${formatHours(metrics.total_ai_hours)} AI time`}
          />
        </div>
      )}

      {/* Charts Row */}
      {metrics && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <HoursSavedChart data={metrics.by_month || []} />
          <TaskTypeDonut data={metrics.by_task_type || {}} />
        </div>
      )}

      {/* Top Clients */}
      {clientBarData.length > 0 && (
        <TopClientsBar data={clientBarData} />
      )}

      {/* Recent Sessions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-white">
          Recent Sessions
        </h2>
        <SessionTable sessions={sessionsData?.items || []} />
      </div>
    </div>
  );
}
