"use client";

import { useState, FormEvent } from "react";
import { useClients, adminCreateClient, adminUpdateClient } from "@/lib/api";
import type { Client, ClientUpdate } from "@/lib/types";
import { AdminForm, Field, inputClass } from "@/components/AdminForm";

export default function AdminClientsPage() {
  const { data: clients, mutate } = useClients();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Manage Clients</h1>
        <button
          onClick={() => { setShowAdd(!showAdd); setEditingId(null); }}
          className="rounded-lg bg-wyre-600 px-4 py-2 text-sm font-medium text-white hover:bg-wyre-500"
        >
          {showAdd ? "Cancel" : "Add Client"}
        </button>
      </div>

      {showAdd && (
        <AddClientForm onDone={() => { setShowAdd(false); mutate(); }} />
      )}

      {/* Client list */}
      <div className="space-y-3">
        {clients?.map((client) => (
          <div key={client.id}>
            {editingId === client.id ? (
              <EditClientForm
                client={client}
                onDone={() => { setEditingId(null); mutate(); }}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <ClientRow client={client} onEdit={() => setEditingId(client.id)} />
            )}
          </div>
        ))}
        {clients?.length === 0 && (
          <p className="text-sm text-gray-500">No clients found.</p>
        )}
      </div>
    </div>
  );
}

// ---- Client row ----

function ClientRow({ client, onEdit }: { client: Client; onEdit: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-dark-border bg-dark-card px-5 py-4">
      <div>
        <p className="text-sm font-medium text-white">{client.name}</p>
        <div className="mt-1 flex gap-3 text-xs text-gray-500">
          <span>Slug: {client.slug}</span>
          {client.monthly_mrr != null && <span>MRR: ${client.monthly_mrr.toLocaleString()}</span>}
          <span className={client.active ? "text-green-400" : "text-red-400"}>
            {client.active ? "Active" : "Inactive"}
          </span>
        </div>
      </div>
      <button onClick={onEdit} className="rounded-lg border border-dark-border px-3 py-1.5 text-xs text-gray-300 hover:bg-dark-hover">
        Edit
      </button>
    </div>
  );
}

// ---- Add client form ----

function AddClientForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [mrr, setMrr] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminCreateClient({
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, "-"),
        monthly_mrr: mrr ? parseFloat(mrr) : null,
      });
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to add client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-dark-border bg-dark-card p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Add Client</h2>
      <AdminForm onSubmit={handleSubmit} loading={loading} error={error} submitLabel="Add Client">
        <Field label="Name *">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Slug">
          <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto-generated from name" />
        </Field>
        <Field label="Monthly MRR ($)">
          <input type="number" step="0.01" min="0" className={inputClass} value={mrr} onChange={(e) => setMrr(e.target.value)} placeholder="Optional" />
        </Field>
      </AdminForm>
    </div>
  );
}

// ---- Edit client form ----

function EditClientForm({ client, onDone, onCancel }: { client: Client; onDone: () => void; onCancel: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(client.name);
  const [slug, setSlug] = useState(client.slug);
  const [mrr, setMrr] = useState(client.monthly_mrr != null ? String(client.monthly_mrr) : "");
  const [active, setActive] = useState(client.active);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updates: ClientUpdate = {};
      if (name !== client.name) updates.name = name;
      if (slug !== client.slug) updates.slug = slug;
      const newMrr = mrr ? parseFloat(mrr) : null;
      if (newMrr !== client.monthly_mrr) updates.monthly_mrr = newMrr;
      if (active !== client.active) updates.active = active;

      await adminUpdateClient(client.id, updates);
      onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-wyre-500/30 bg-dark-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Edit: {client.name}</h2>
        <button onClick={onCancel} className="text-xs text-gray-400 hover:text-white">Cancel</button>
      </div>
      <AdminForm onSubmit={handleSubmit} loading={loading} error={error} submitLabel="Save Changes">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Slug">
          <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </Field>
        <Field label="Monthly MRR ($)">
          <input type="number" step="0.01" min="0" className={inputClass} value={mrr} onChange={(e) => setMrr(e.target.value)} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-gray-300">
          <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="rounded border-dark-border" />
          Active
        </label>
      </AdminForm>
    </div>
  );
}
