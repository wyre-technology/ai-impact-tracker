"use client";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label: string;
  };
}

export function KPICard({ title, value, subtitle, trend }: KPICardProps) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <p className="text-sm font-medium text-gray-400">{title}</p>
      <p className="mt-2 text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      {trend && (
        <p
          className={`mt-2 text-sm font-medium ${
            trend.value >= 0 ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {trend.value >= 0 ? "+" : ""}
          {trend.value.toFixed(1)}% {trend.label}
        </p>
      )}
    </div>
  );
}
