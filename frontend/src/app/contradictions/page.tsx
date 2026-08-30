"use client";

import { useEffect, useState } from "react";

import { api, type Contradiction } from "@/lib/api";

const SEVERITY_STYLES: Record<Contradiction["severity"], string> = {
  critical: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  info: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

const STATUS_LABELS: Record<Contradiction["status"], string> = {
  open: "Open",
  resolved: "Resolved",
  false_positive: "False positive",
};

export default function ContradictionsPage() {
  const [contradictions, setContradictions] = useState<Contradiction[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [updatingId, setUpdatingId] = useState<string>();

  async function load() {
    setIsLoading(true);
    setError(undefined);
    try {
      const { contradictions } = await api.listContradictions(statusFilter || undefined);
      setContradictions(contradictions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contradictions");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  async function updateStatus(id: string, status: "resolved" | "false_positive") {
    setUpdatingId(id);
    try {
      await api.updateContradictionStatus(id, status);
      setContradictions((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update contradiction");
    } finally {
      setUpdatingId(undefined);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Contradictions</h1>
          <p className="mt-1 text-sm text-neutral-500">Conflicting statements found across your documents.</p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
        >
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
          <option value="false_positive">False positives</option>
          <option value="">All</option>
        </select>
      </div>

      {isLoading && <p className="mt-8 text-sm text-neutral-500">Loading…</p>}
      {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      {!isLoading && contradictions.length === 0 && (
        <p className="mt-8 text-sm text-neutral-400">No contradictions found for this filter.</p>
      )}

      <ul className="mt-6 space-y-4">
        {contradictions.map((c) => (
          <li key={c._id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className={`rounded-full px-2 py-0.5 font-medium ${SEVERITY_STYLES[c.severity]}`}>
                {c.severity}
              </span>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 font-medium text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                {c.type}
              </span>
              <span className="text-neutral-400">{STATUS_LABELS[c.status]}</span>
            </div>

            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{c.explanation}</p>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-neutral-50 p-3 text-sm dark:bg-neutral-900">
                <p className="text-xs font-medium text-neutral-500">
                  {c.statementA.documentName}
                  {c.statementA.pageNumber ? ` — page ${c.statementA.pageNumber}` : ` — chunk ${c.statementA.chunkIndex}`}
                </p>
                <p className="mt-1">&ldquo;{c.statementA.text}&rdquo;</p>
              </div>
              <div className="rounded-lg bg-neutral-50 p-3 text-sm dark:bg-neutral-900">
                <p className="text-xs font-medium text-neutral-500">
                  {c.statementB.documentName}
                  {c.statementB.pageNumber ? ` — page ${c.statementB.pageNumber}` : ` — chunk ${c.statementB.chunkIndex}`}
                </p>
                <p className="mt-1">&ldquo;{c.statementB.text}&rdquo;</p>
              </div>
            </div>

            {c.status === "open" && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => updateStatus(c._id, "resolved")}
                  disabled={updatingId === c._id}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
                >
                  Mark Resolved
                </button>
                <button
                  onClick={() => updateStatus(c._id, "false_positive")}
                  disabled={updatingId === c._id}
                  className="rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium disabled:opacity-50 dark:border-neutral-700"
                >
                  False Positive
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
