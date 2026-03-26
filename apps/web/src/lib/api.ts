import useSWR, { SWRConfiguration } from "swr";
import type {
  MetricsSummary,
  ClientMetric,
  EngineerMetric,
  Client,
  Engineer,
  Session,
  PaginatedResponse,
  DateRange,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ---- Generic Fetcher ----

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(`API error ${res.status}`, res.status, body);
  }

  return res.json();
}

// ---- URL Builders ----

function buildUrl(
  path: string,
  params?: Record<string, string | number | undefined | null>,
): string {
  const url = new URL(`${API_BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

interface DateRangeParams {
  dateRange?: DateRange;
  clientId?: string;
  engineerId?: string;
}

function dateParams(opts: DateRangeParams): Record<string, string | undefined> {
  return {
    start: opts.dateRange?.start,
    end: opts.dateRange?.end,
    client_id: opts.clientId,
    engineer_id: opts.engineerId,
  };
}

// ---- SWR Hooks ----

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 30_000,
};

export function useMetricsSummary(opts: DateRangeParams = {}) {
  const url = buildUrl("/api/v1/metrics/summary", dateParams(opts));
  return useSWR<MetricsSummary>(url, fetcher, defaultConfig);
}

export function useClientMetrics(opts: DateRangeParams = {}) {
  const url = buildUrl("/api/v1/metrics/clients", dateParams(opts));
  return useSWR<ClientMetric[]>(url, fetcher, defaultConfig);
}

export function useEngineerMetrics(opts: DateRangeParams = {}) {
  const url = buildUrl("/api/v1/metrics/engineers", dateParams(opts));
  return useSWR<EngineerMetric[]>(url, fetcher, defaultConfig);
}

export function useClients() {
  const url = buildUrl("/api/v1/clients");
  return useSWR<Client[]>(url, fetcher, defaultConfig);
}

export function useClient(slug: string) {
  const url = buildUrl(`/api/v1/clients/${slug}`);
  return useSWR<Client>(slug ? url : null, fetcher, defaultConfig);
}

export function useEngineers() {
  const url = buildUrl("/api/v1/engineers");
  return useSWR<Engineer[]>(url, fetcher, defaultConfig);
}

export function useEngineer(id: string) {
  const url = buildUrl(`/api/v1/engineers/${id}`);
  return useSWR<Engineer>(id ? url : null, fetcher, defaultConfig);
}

export function useSessions(
  opts: DateRangeParams & { page?: number; perPage?: number } = {},
) {
  const url = buildUrl("/api/v1/sessions", {
    ...dateParams(opts),
    page: opts.page,
    per_page: opts.perPage,
  });
  return useSWR<PaginatedResponse<Session>>(url, fetcher, defaultConfig);
}

// ---- Server-side Fetch (for server components) ----

export async function fetchMetricsSummary(
  opts: DateRangeParams = {},
): Promise<MetricsSummary> {
  const url = buildUrl("/api/v1/metrics/summary", dateParams(opts));
  return fetcher<MetricsSummary>(url);
}

export async function fetchClientMetrics(
  opts: DateRangeParams = {},
): Promise<ClientMetric[]> {
  const url = buildUrl("/api/v1/metrics/clients", dateParams(opts));
  return fetcher<ClientMetric[]>(url);
}

export async function fetchEngineerMetrics(
  opts: DateRangeParams = {},
): Promise<EngineerMetric[]> {
  const url = buildUrl("/api/v1/metrics/engineers", dateParams(opts));
  return fetcher<EngineerMetric[]>(url);
}

export async function fetchClients(): Promise<Client[]> {
  const url = buildUrl("/api/v1/clients");
  return fetcher<Client[]>(url);
}

export async function fetchClient(slug: string): Promise<Client> {
  const url = buildUrl(`/api/v1/clients/${slug}`);
  return fetcher<Client>(url);
}

export async function fetchEngineers(): Promise<Engineer[]> {
  const url = buildUrl("/api/v1/engineers");
  return fetcher<Engineer[]>(url);
}

export async function fetchEngineer(id: string): Promise<Engineer> {
  const url = buildUrl(`/api/v1/engineers/${id}`);
  return fetcher<Engineer>(url);
}

export async function fetchSessions(
  opts: DateRangeParams & { page?: number; perPage?: number } = {},
): Promise<PaginatedResponse<Session>> {
  const url = buildUrl("/api/v1/sessions", {
    ...dateParams(opts),
    page: opts.page,
    per_page: opts.perPage,
  });
  return fetcher<PaginatedResponse<Session>>(url);
}
