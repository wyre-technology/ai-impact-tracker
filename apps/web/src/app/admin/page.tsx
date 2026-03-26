"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useAdminSettings, updateAdminSettings, adminExportCsv } from "@/lib/api";
import { AdminForm, Field, inputClass } from "@/components/AdminForm";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>

      {/* Quick links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminCard href="/admin/sessions/new" title="New Session" description="Manually enter a session" />
        <AdminCard href="/admin/engineers" title="Engineers" description="Add or edit engineers" />
        <AdminCard href="/admin/clients" title="Clients" description="Add or edit clients" />
        <AdminCard href="#settings" title="Settings" description="Global configuration" />
      </div>

      {/* Settings section */}
      <div id="settings">
        <SettingsForm />
      </div>

      {/* Export section */}
      <ExportSection />
    </div>
  );
}

// ---- Admin link card ----

function AdminCard({ href, title, description }: { href: string; title: string; description: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-dark-border bg-dark-card p-5 transition-colors hover:border-wyre-500/40"
    >
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs text-gray-400">{description}</p>
    </Link>
  );
}

// ---- Settings form ----

function SettingsForm() {
  const { data: settings, mutate } = useAdminSettings();
  const [rate, setRate] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize rate from fetched settings
  const displayRate = rate || (settings ? String(settings.default_hourly_rate) : "");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await updateAdminSettings({ default_hourly_rate: parseFloat(displayRate) });
      await mutate();
      setSuccess("Settings saved.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Global Settings</h2>
      <AdminForm onSubmit={handleSubmit} loading={loading} error={error} success={success} submitLabel="Save Settings">
        <Field label="Default Hourly Rate ($)">
          <input
            type="number"
            step="0.01"
            min="0"
            className={inputClass}
            value={displayRate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="225.00"
          />
        </Field>
      </AdminForm>
    </div>
  );
}

// ---- Export section ----

function ExportSection() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const blob = await adminExportCsv({
        start: start || undefined,
        end: end || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sessions_export.csv";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Export Sessions (CSV)</h2>
      <AdminForm onSubmit={handleExport} loading={loading} error={error} submitLabel="Download CSV">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Start Date">
            <input type="date" className={inputClass} value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="End Date">
            <input type="date" className={inputClass} value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
        </div>
      </AdminForm>
    </div>
  );
}
