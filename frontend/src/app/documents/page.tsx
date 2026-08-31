"use client";

import { useEffect, useState } from "react";

import { api, type DocumentRecord } from "@/lib/api";

const STATUS_STYLES: Record<DocumentRecord["status"], string> = {
  processing: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  completed: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [deletingId, setDeletingId] = useState<string>();

  async function load() {
    setIsLoading(true);
    setError(undefined);
    try {
      const { documents } = await api.listDocuments();
      setDocuments(documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    } finally {
      setDeletingId(undefined);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Document Library</h1>
      <p className="mt-1 text-sm text-neutral-500">All uploaded documents and their processing status.</p>

      {isLoading && <p className="mt-8 text-sm text-neutral-500">Loading…</p>}
      {error && <p className="mt-8 text-sm text-red-600">{error}</p>}
      {!isLoading && documents.length === 0 && (
        <p className="mt-8 text-sm text-neutral-400">No documents uploaded yet.</p>
      )}

      <ul className="mt-6 space-y-2">
        {documents.map((doc) => (
          <li
            key={doc._id}
            className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 px-4 py-3 text-sm dark:border-neutral-800"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">{doc.originalName}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {doc.fileType.toUpperCase()} · {formatSize(doc.sizeBytes)} · {doc.chunkCount} chunks ·{" "}
                {new Date(doc.createdAt).toLocaleString()}
              </p>
              {doc.status === "failed" && doc.failureReason && (
                <p className="mt-0.5 text-xs text-red-600">{doc.failureReason}</p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[doc.status]}`}>
                {doc.status}
              </span>
              <button
                onClick={() => handleDelete(doc._id)}
                disabled={deletingId === doc._id}
                className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
