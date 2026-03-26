"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useEngineers, useClients, adminCreateSession } from "@/lib/api";
import { TASK_TYPE_LABELS, type TaskType } from "@/lib/types";
import { AdminForm, Field, inputClass, selectClass } from "@/components/AdminForm";

export default function NewSessionPage() {
  const router = useRouter();
  const { data: engineers } = useEngineers();
  const { data: clients } = useClients();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [engineerId, setEngineerId] = useState("");
  const [clientId, setClientId] = useState("");
  const [project, setProject] = useState("");
  const [taskSummary, setTaskSummary] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("development");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [estimatedManualHours, setEstimatedManualHours] = useState("");
  const [filesCreated, setFilesCreated] = useState("0");
  const [filesModified, setFilesModified] = useState("0");
  const [linesAdded, setLinesAdded] = useState("0");
  const [linesRemoved, setLinesRemoved] = useState("0");
  const [hourlyRate, setHourlyRate] = useState("");
  const [notes, setNotes] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminCreateSession({
        engineer_id: engineerId,
        client_id: clientId || null,
        project,
        task_summary: taskSummary,
        task_type: taskType,
        duration_minutes: parseInt(durationMinutes, 10),
        estimated_manual_hours: parseFloat(estimatedManualHours),
        files_created: parseInt(filesCreated, 10) || 0,
        files_modified: parseInt(filesModified, 10) || 0,
        lines_added: parseInt(linesAdded, 10) || 0,
        lines_removed: parseInt(linesRemoved, 10) || 0,
        hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
        notes: notes || null,
        created_at: createdAt ? new Date(createdAt).toISOString() : null,
      });
      router.push("/admin");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create session");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Manual Session Entry</h1>
      <div className="rounded-xl border border-dark-border bg-dark-card p-6">
        <AdminForm onSubmit={handleSubmit} loading={loading} error={error} submitLabel="Create Session">
          {/* Engineer */}
          <Field label="Engineer *">
            <select className={selectClass} value={engineerId} onChange={(e) => setEngineerId(e.target.value)} required>
              <option value="">Select engineer...</option>
              {engineers?.map((eng) => (
                <option key={eng.id} value={eng.id}>
                  {eng.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Client */}
          <Field label="Client">
            <select className={selectClass} value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">WYRE Internal</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          {/* Project */}
          <Field label="Project *">
            <input className={inputClass} value={project} onChange={(e) => setProject(e.target.value)} required placeholder="e.g. TenantGuard v2" />
          </Field>

          {/* Task Summary */}
          <Field label="Task Summary *">
            <textarea
              className={inputClass + " min-h-[80px] resize-y"}
              value={taskSummary}
              onChange={(e) => setTaskSummary(e.target.value)}
              required
              placeholder="What was accomplished?"
            />
          </Field>

          {/* Task Type */}
          <Field label="Task Type *">
            <select className={selectClass} value={taskType} onChange={(e) => setTaskType(e.target.value as TaskType)} required>
              {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>

          {/* Duration + Estimated Hours */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Duration (minutes) *">
              <input type="number" min="0" className={inputClass} value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required />
            </Field>
            <Field label="Est. Manual Hours *">
              <input type="number" min="0" step="0.25" className={inputClass} value={estimatedManualHours} onChange={(e) => setEstimatedManualHours(e.target.value)} required />
            </Field>
          </div>

          {/* File stats */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Files Created">
              <input type="number" min="0" className={inputClass} value={filesCreated} onChange={(e) => setFilesCreated(e.target.value)} />
            </Field>
            <Field label="Files Modified">
              <input type="number" min="0" className={inputClass} value={filesModified} onChange={(e) => setFilesModified(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lines Added">
              <input type="number" min="0" className={inputClass} value={linesAdded} onChange={(e) => setLinesAdded(e.target.value)} />
            </Field>
            <Field label="Lines Removed">
              <input type="number" min="0" className={inputClass} value={linesRemoved} onChange={(e) => setLinesRemoved(e.target.value)} />
            </Field>
          </div>

          {/* Optional fields */}
          <Field label="Hourly Rate Override ($)">
            <input type="number" step="0.01" min="0" className={inputClass} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="Leave blank for engineer default" />
          </Field>

          <Field label="Date (for backdating)">
            <input type="datetime-local" className={inputClass} value={createdAt} onChange={(e) => setCreatedAt(e.target.value)} />
          </Field>

          <Field label="Notes">
            <textarea className={inputClass + " min-h-[60px] resize-y"} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </Field>
        </AdminForm>
      </div>
    </div>
  );
}
