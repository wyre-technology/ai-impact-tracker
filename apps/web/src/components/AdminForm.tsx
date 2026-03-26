"use client";

import { FormEvent, ReactNode } from "react";

// ---- Reusable form wrapper ----

interface AdminFormProps {
  onSubmit: (e: FormEvent) => void;
  children: ReactNode;
  submitLabel?: string;
  loading?: boolean;
  error?: string | null;
  success?: string | null;
}

export function AdminForm({
  onSubmit,
  children,
  submitLabel = "Save",
  loading = false,
  error = null,
  success = null,
}: AdminFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          {success}
        </div>
      )}
      {children}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-wyre-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-wyre-500 disabled:opacity-50"
      >
        {loading ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

// ---- Field components ----

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-300">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-wyre-500 focus:outline-none focus:ring-1 focus:ring-wyre-500";

export const selectClass =
  "w-full rounded-lg border border-dark-border bg-dark-bg px-3 py-2 text-sm text-white focus:border-wyre-500 focus:outline-none focus:ring-1 focus:ring-wyre-500";
