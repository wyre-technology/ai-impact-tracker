"use client";

import { useState, FormEvent } from "react";
import { useEngineers, adminCreateEngineer, adminUpdateEngineer } from "@/lib/api";
import type { Engineer, EngineerUpdate } from "@/lib/types";
import { AdminForm, Field, inputClass } from "@/components/AdminForm";

export default function AdminEngineersPage() {
  const { data: engineers, mutate } = useEngineers();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Manage Engineers</h1>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); }}
          className="rounded-lg bg-wyre-600 px-4 py-2 text-sm font-medium text-white hover:bg-wyre-500"
        >
          {showAdd ? "Cancel" : "Add Engineer"}
        </button>
      </div>

      {showAdd && (
        <AddEngineerForm
          onDone={() => { setShowAdd(false); mutate(); }}
        />
      )}

      {/* Engineer list */}
      <div className="space-y-3">
        {engineers?.map((eng) => (
          <div key={eng.id}>
            {editingId === eng.id ? (
              <EditEngineerForm
                engineer={eng}
                onDone={() => { setEditingId(null); mutate(); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <EngineerRow engineer={eng} onEdit={() => setEditingId(eng.id)} />
            )}
          </div>
        ))}
        {engineers?.length === 0 && (
          <p className="text-sm text-gray-500">No engineers found.</p>
        )}
      </div>
    </div>
  );
}

// ---- Engineer row ----

function EngineerRow({ engineer, onEdit }: { engineer: Engineer; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-dark-border bg-dark-card px-5 py-4">
      <div>
        <p className="text-sm font-medium text-white">{engineer.name}</p>
        <p className="text-xs text-gray-400">{engineer.email}</p>
        <div className="mt-1 flex gap-3 text-xs text-gray-500">
          <span>${engineer.default_hourly_rate}/hr</span>
          <span className={engineer.active ? "text-green-400" : "text-red-400"}>
            {engineer.active ? "Active" : "Inactive"}
          </span>
          {engineer.is_admin && <span className="text-wyre-400">Admin</span>}
        </div>
      </div>
      <button onClick={onEdit} className="rounded-lg border border-dark-border px-3 py-1.5 text-xs text-gray-300 hover:bg-dark-hover">
        Edit
      </button>
    </div>
  );
}

// ---- Add engineer form ----

function AddEngineerForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [entraOid, setEntraOid] = useState("");
  const [rate, setRate] = useState("225.00");
  const [isAdmin, setIsAdmin] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminCreateEngineer({
        entra_oid: entraOid,
        name,
        email,
        default_hourly_rate: parseFloat(rate),
        is_admin: isAdmin,
      });
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add engineer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Add Engineer</h2>
      <AdminForm onSubmit={handleSubmit} loading={loading} error={error} submitLabel="Add Engineer">
        <Field label="Name *">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email *">
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Entra Object ID *">
          <input className={inputClass} value={entraOid} onChange={(e) => setEntraOid(e.target.value)} required placeholder="UUID from Entra ID" />
        </Field>
        <Field label="Hourly Rate ($)">
          <input type="number" step="0.01" min="0" className={inputClass} value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="rounded border-dark-border" />
          Admin access
        </label>
      </AdminForm>
    </div>
  );
}

// ---- Edit engineer form ----

function EditEngineerForm({ engineer, onDone, onCancel }: { engineer: Engineer; onDone: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(engineer.name);
  const [email, setEmail] = useState(engineer.email);
  const [rate, setRate] = useState(String(engineer.default_hourly_rate));
  const [active, setActive] = useState(engineer.active);
  const [isAdmin, setIsAdmin] = useState(engineer.is_admin);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updates: EngineerUpdate = {};
      if (name !== engineer.name) updates.name = name;
      if (email !== engineer.email) updates.email = email;
      if (parseFloat(rate) !== engineer.default_hourly_rate) updates.default_hourly_rate = parseFloat(rate);
      if (active !== engineer.active) updates.active = active;
      if (isAdmin !== engineer.is_admin) updates.is_admin = isAdmin;

      await adminUpdateEngineer(engineer.id, updates);
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update engineer");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-wyre-500/30 bg-dark-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Edit: {engineer.name}</h2>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-white">Cancel</button>
      </div>
      <AdminForm onSubmit={handleSubmit} loading={loading} error={error} submitLabel="Save Changes">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Email">
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
        </Field>
        <Field label="Hourly Rate ($)">
          <input type="number" step="0.01" min="0" className={inputClass} value={rate} onChange={(e) => setRate(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-dark-border" />
          Active
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={isAdmin} onChange={(e) => setIsAdmin(e.target.checked)} className="rounded border-dark-border" />
          Admin access
        </label>
      </AdminForm>
    </div>
  );
}
