import {
  startOfMonth,
  subMonths,
  startOfYear,
  format,
  endOfDay,
} from "date-fns";
import type { DateRange, DateRangePreset } from "./types";

export function getDateRangeFromPreset(preset: DateRangePreset): DateRange {
  const now = new Date();
  const end = format(endOfDay(now), "yyyy-MM-dd'T'HH:mm:ss");

  switch (preset) {
    case "1m":
      return {
        start: format(startOfMonth(now), "yyyy-MM-dd'T'HH:mm:ss"),
        end,
      };
    case "3m":
      return {
        start: format(startOfMonth(subMonths(now, 2)), "yyyy-MM-dd'T'HH:mm:ss"),
        end,
      };
    case "6m":
      return {
        start: format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd'T'HH:mm:ss"),
        end,
      };
    case "ytd":
      return {
        start: format(startOfYear(now), "yyyy-MM-dd'T'HH:mm:ss"),
        end,
      };
    case "custom":
      // Custom returns YTD as default; the component will override
      return {
        start: format(startOfYear(now), "yyyy-MM-dd'T'HH:mm:ss"),
        end,
      };
  }
}

export const DATE_RANGE_OPTIONS: { label: string; value: DateRangePreset }[] = [
  { label: "This Month", value: "1m" },
  { label: "Last 3 Months", value: "3m" },
  { label: "Last 6 Months", value: "6m" },
  { label: "Year to Date", value: "ytd" },
];
