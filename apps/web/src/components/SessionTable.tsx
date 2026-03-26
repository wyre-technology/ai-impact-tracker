"use client";

import type { Session } from "@/lib/types";
import { TASK_TYPE_LABELS } from "@/lib/types";
import { formatDateShort, formatHours, formatDollars } from "@/lib/format";

interface SessionTableProps {
  sessions: Session[];
  showClient?: boolean;
  showEngineer?: boolean;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export function SessionTable({
  sessions,
  showClient = true,
  showEngineer = true,
  page,
  totalPages,
  onPageChange,
}: SessionTableProps) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-border text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Type</th>
              {showEngineer && (
                <th className="px-4 py-3 font-medium">Engineer</th>
              )}
              {showClient && (
                <th className="px-4 py-3 font-medium">Client</th>
              )}
              <th className="px-4 py-3 font-medium text-right">Duration</th>
              <th className="px-4 py-3 font-medium text-right">Hours Saved</th>
              <th className="px-4 py-3 font-medium text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 && (
              <tr>
                <td
                  colSpan={showClient && showEngineer ? 9 : 7}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No sessions found
                </td>
              </tr>
            )}
            {sessions.map((session) => {
              const hoursSaved =
                session.estimated_manual_hours -
                session.duration_minutes / 60;
              const rate = session.hourly_rate || 225;
              const dollarValue = session.estimated_manual_hours * rate;

              return (
                <tr
                  key={session.id}
                  className="border-b border-dark-border/50 hover:bg-dark-hover transition-colors"
                >
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                    {formatDateShort(session.created_at)}
                  </td>
                  <td className="px-4 py-3 text-white font-medium max-w-[160px] truncate">
                    {session.project}
                  </td>
                  <td className="px-4 py-3 text-gray-300 max-w-[240px] truncate">
                    {session.task_summary}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-wyre-950/50 px-2.5 py-0.5 text-xs font-medium text-wyre-300">
                      {TASK_TYPE_LABELS[session.task_type] || session.task_type}
                    </span>
                  </td>
                  {showEngineer && (
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {session.engineer_name || "Unknown"}
                    </td>
                  )}
                  {showClient && (
                    <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                      {session.client_name || "WYRE Internal"}
                    </td>
                  )}
                  <td className="px-4 py-3 text-right text-gray-300 whitespace-nowrap">
                    {session.duration_minutes}m
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-400 font-medium whitespace-nowrap">
                    {formatHours(hoursSaved)}
                  </td>
                  <td className="px-4 py-3 text-right text-white font-medium whitespace-nowrap">
                    {formatDollars(dollarValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages && totalPages > 1 && onPageChange && (
        <div className="flex items-center justify-between border-t border-dark-border px-4 py-3">
          <p className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(Math.max(1, (page || 1) - 1))}
              disabled={page === 1}
              className="rounded-md border border-dark-border px-3 py-1.5 text-sm text-gray-400 hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() =>
                onPageChange(Math.min(totalPages, (page || 1) + 1))
              }
              disabled={page === totalPages}
              className="rounded-md border border-dark-border px-3 py-1.5 text-sm text-gray-400 hover:bg-dark-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
