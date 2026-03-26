"use client";

import { useState, FormEvent, useCallback } from "react";
import Link from "next/link";
import { useAdminSettings, updateAdminSettings, adminExportCsv, useApiKeys, adminCreateApiKey, adminRevokeApiKey } from "@/lib/api";
import { useEngineers } from "@/lib/api";
import { AdminForm, Field, inputClass, selectClass } from "@/components/AdminForm";

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

      {/* API Keys section */}
      <ApiKeysSection />

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

// ---- API Keys section ----

function ApiKeysSection() {
  const { data: keys, mutate } = useApiKeys();
  const { data: engineers } = useEngineers();
  const [engineerId, setEngineerId] = useState("");
  const [keyName, setKeyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!engineerId || !keyName) return;
    setLoading(true);
    setError(null);
    setCreatedKey(null);
    try {
      const result = await adminCreateApiKey({ engineer_id: engineerId, name: keyName });
      setCreatedKey(result.key);
      setKeyName("");
      await mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  }, [engineerId, keyName, mutate]);

  const handleRevoke = useCallback(async (id: string) => {
    if (!confirm("Revoke this API key? This cannot be undone.")) return;
    try {
      await adminRevokeApiKey(id);
      await mutate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to revoke key");
    }
  }, [mutate]);

  const handleCopy = useCallback(() => {
    if (createdKey) {
      navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [createdKey]);

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">API Keys</h2>

      {/* Created key dialog */}
      {createdKey && (
        <div className="mb-4 rounded-lg border border-wyre-500/30 bg-wyre-500/10 p-4">
          <p className="mb-2 text-sm font-medium text-wyre-400">
            API key created. Copy it now -- it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-dark-bg px-3 py-2 text-xs text-white break-all font-mono">
              {createdKey}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded-lg bg-wyre-600 px-3 py-2 text-xs font-medium text-white hover:bg-wyre-500"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button
            onClick={() => setCreatedKey(null)}
            className="mt-2 text-xs text-gray-400 hover:text-gray-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      <AdminForm onSubmit={handleCreate} loading={loading} error={error} submitLabel="Create Key">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Engineer">
            <select className={selectClass} value={engineerId} onChange={(e) => setEngineerId(e.target.value)} required>
              <option value="">Select engineer...</option>
              {engineers?.map((eng) => (
                <option key={eng.id} value={eng.id}>{eng.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Key Name">
            <input
              type="text"
              className={inputClass}
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder='e.g. "Mac Mini hook"'
              required
            />
          </Field>
        </div>
      </AdminForm>

      {/* Key list */}
      {keys && keys.length > 0 && (
        <div className="mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-border text-left text-gray-400">
                <th className="pb-2 font-medium">Name</th>
                <th className="pb-2 font-medium">Prefix</th>
                <th className="pb-2 font-medium">Created</th>
                <th className="pb-2 font-medium">Last Used</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {keys.map((k) => (
                <tr key={k.id} className="border-b border-dark-border/50">
                  <td className="py-2 text-white">{k.name}</td>
                  <td className="py-2 font-mono text-xs text-gray-400">{k.key_prefix}</td>
                  <td className="py-2 text-gray-400">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td className="py-2 text-gray-400">
                    {k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      k.active
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}>
                      {k.active ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="py-2 text-right">
                    {k.active && (
                      <button
                        onClick={() => handleRevoke(k.id)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
