"use client";

import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  Legend,
} from "recharts";
import { TASK_TYPE_COLORS, TASK_TYPE_LABELS, type TaskType } from "@/lib/types";

// ---- Shared tooltip style ----

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#1a1d2e",
    border: "1px solid #2a2d3e",
    borderRadius: "8px",
    color: "#fff",
    fontSize: "13px",
  },
  itemStyle: { color: "#9ca3af" },
  labelStyle: { color: "#fff", fontWeight: 600 },
};

// ---- Hours Saved Line Chart ----

interface LineChartProps {
  data: Array<{
    month: string;
    hours_saved: number;
    sessions: number;
    dollar_value: number;
  }>;
}

export function HoursSavedChart({ data }: LineChartProps) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">
        Hours Saved Over Time
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
            <XAxis
              dataKey="month"
              stroke="#6b7280"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <YAxis
              stroke="#6b7280"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <Tooltip {...tooltipStyle} />
            <Line
              type="monotone"
              dataKey="hours_saved"
              stroke="#3366ff"
              strokeWidth={2}
              dot={{ fill: "#3366ff", r: 4 }}
              activeDot={{ r: 6 }}
              name="Hours Saved"
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- Task Type Donut Chart ----

interface DonutChartProps {
  data: Record<
    string,
    { sessions: number; hours_saved: number; dollar_value: number }
  >;
}

export function TaskTypeDonut({ data }: DonutChartProps) {
  const chartData = Object.entries(data)
    .map(([type, metrics]) => ({
      name: TASK_TYPE_LABELS[type as TaskType] || type,
      value: metrics.hours_saved,
      sessions: metrics.sessions,
      color: TASK_TYPE_COLORS[type as TaskType] || "#6b7280",
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">
        Task Type Breakdown
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number) => [`${value.toFixed(1)}h`, "Hours Saved"]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- Top Clients Bar Chart ----

interface BarChartProps {
  data: Array<{
    name: string;
    hours_saved: number;
    dollar_value: number;
  }>;
  title?: string;
  dataKey?: string;
  barColor?: string;
}

export function TopClientsBar({
  data,
  title = "Top Clients by Impact",
  dataKey = "hours_saved",
  barColor = "#3366ff",
}: BarChartProps) {
  const sorted = [...data].sort(
    (a, b) => (b as Record<string, number>)[dataKey] - (a as Record<string, number>)[dataKey],
  ).slice(0, 10);

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">{title}</h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={sorted} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
            <XAxis
              type="number"
              stroke="#6b7280"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <YAxis
              dataKey="name"
              type="category"
              stroke="#6b7280"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              width={120}
            />
            <Tooltip {...tooltipStyle} />
            <Bar
              dataKey={dataKey}
              fill={barColor}
              radius={[0, 4, 4, 0]}
              name="Hours Saved"
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- Engineer Contributions Bar Chart ----

interface EngineerBarProps {
  data: Array<{
    engineer_name: string;
    hours_saved: number;
    sessions: number;
  }>;
}

export function EngineerContributions({ data }: EngineerBarProps) {
  const sorted = [...data].sort((a, b) => b.hours_saved - a.hours_saved);

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">
        Engineer Contributions
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart data={sorted} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3e" />
            <XAxis
              type="number"
              stroke="#6b7280"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <YAxis
              dataKey="engineer_name"
              type="category"
              stroke="#6b7280"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              width={120}
            />
            <Tooltip {...tooltipStyle} />
            <Bar
              dataKey="hours_saved"
              fill="#10b981"
              radius={[0, 4, 4, 0]}
              name="Hours Saved"
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---- Client Distribution Donut ----

interface ClientDistributionProps {
  data: Array<{
    client_name: string;
    hours_saved: number;
  }>;
}

const DISTRIBUTION_COLORS = [
  "#3366ff",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#6b7280",
];

export function ClientDistribution({ data }: ClientDistributionProps) {
  const chartData = data
    .map((d) => ({
      name: d.client_name || "WYRE Internal",
      value: d.hours_saved,
    }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h3 className="mb-4 text-lg font-semibold text-white">
        Client Distribution
      </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, index) => (
                <Cell
                  key={index}
                  fill={DISTRIBUTION_COLORS[index % DISTRIBUTION_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              {...tooltipStyle}
              formatter={(value: number) => [`${value.toFixed(1)}h`, "Hours Saved"]}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: "#9ca3af", fontSize: "12px" }}>
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
