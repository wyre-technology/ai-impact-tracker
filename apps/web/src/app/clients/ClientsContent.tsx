"use client";

import Link from "next/link";
import { DateRangePicker, useDateRangePreset } from "@/components/DateRangePicker";
import { LoadingState, ErrorState } from "@/components/LoadingState";
import { useClientMetrics } from "@/lib/api";
import { getDateRangeFromPreset } from "@/lib/date-range";
import { formatDollars, formatHours, formatNumber } from "@/lib/format";

export function ClientsContent() {
  const preset = useDateRangePreset();
  const dateRange = getDateRangeFromPreset(preset);

  const { data: clients, error, isLoading } = useClientMetrics({ dateRange });

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;

  const sorted = [...(clients || [])].sort(
    (a, b) => b.hours_saved - a.hours_saved,
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Clients</h1>
          <p className="mt-1 text-sm text-gray-400">
            AI impact breakdown by client
          </p>
        </div>
        <DateRangePicker />
      </div>

      {/* Client Cards */}
      {sorted.length === 0 ? (
        <div className="py-20 text-center text-gray-500">
          No client data available for this period.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((client) => (
            <Link
              key={client.client_id}
              href={`/clients/${client.client_slug}`}
              className="group rounded-xl border border-dark-border bg-dark-card p-6 transition-colors hover:border-wyre-600/40 hover:bg-dark-hover"
            >
              <h3 className="text-lg font-semibold text-white group-hover:text-wyre-400 transition-colors">
                {client.client_name}
              </h3>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Hours Saved</p>
                  <p className="mt-1 text-lg font-bold text-emerald-400">
                    {formatHours(client.hours_saved)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Dollar Value</p>
                  <p className="mt-1 text-lg font-bold text-white">
                    {formatDollars(client.dollar_value)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sessions</p>
                  <p className="mt-1 text-lg font-bold text-gray-300">
                    {formatNumber(client.total_sessions)}
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
