// ---- Enums ----

export type TaskType =
  | "iac"
  | "documentation"
  | "scripting"
  | "troubleshooting"
  | "admin"
  | "development"
  | "analysis"
  | "other";

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  iac: "Infrastructure as Code",
  documentation: "Documentation",
  scripting: "Scripting",
  troubleshooting: "Troubleshooting",
  admin: "Admin",
  development: "Development",
  analysis: "Analysis",
  other: "Other",
};

export const TASK_TYPE_COLORS: Record<TaskType, string> = {
  iac: "#3366ff",
  documentation: "#10b981",
  scripting: "#f59e0b",
  troubleshooting: "#ef4444",
  admin: "#8b5cf6",
  development: "#06b6d4",
  analysis: "#ec4899",
  other: "#6b7280",
};

// ---- API Response Types ----

export interface Session {
  id: string;
  created_at: string;
  engineer_id: string;
  client_id: string | null;
  project: string;
  task_summary: string;
  task_type: TaskType;
  duration_minutes: number;
  tool_calls: Record<string, number>;
  files_created: number;
  files_modified: number;
  lines_added: number;
  lines_removed: number;
  estimated_manual_hours: number;
  hourly_rate: number | null;
  notes: string | null;
  session_metadata: Record<string, unknown>;
  // Joined fields
  engineer_name?: string;
  client_name?: string;
  client_slug?: string;
}

export interface Engineer {
  id: string;
  entra_oid: string;
  name: string;
  email: string;
  default_hourly_rate: number;
  active: boolean;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  slug: string;
  monthly_mrr: number | null;
  active: boolean;
  created_at: string;
}

export interface MetricsSummary {
  total_sessions: number;
  total_ai_hours: number;
  total_estimated_manual_hours: number;
  hours_saved: number;
  dollar_value: number;
  ai_leverage_ratio: number;
  by_task_type: Record<
    TaskType,
    {
      sessions: number;
      hours_saved: number;
      dollar_value: number;
    }
  >;
  by_month: Array<{
    month: string;
    hours_saved: number;
    sessions: number;
    dollar_value: number;
  }>;
}

export interface ClientMetric {
  client_id: string;
  client_name: string;
  client_slug: string;
  total_sessions: number;
  hours_saved: number;
  dollar_value: number;
  ai_leverage_ratio: number;
}

export interface EngineerMetric {
  engineer_id: string;
  engineer_name: string;
  total_sessions: number;
  hours_saved: number;
  dollar_value: number;
  ai_leverage_ratio: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// ---- Date Range ----

export type DateRangePreset = "1m" | "3m" | "6m" | "ytd" | "custom";

export interface DateRange {
  start: string; // ISO8601
  end: string;   // ISO8601
}
