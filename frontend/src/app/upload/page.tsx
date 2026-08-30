"use client";

import { useCallback, useRef, useState } from "react";

import { api, type DocumentRecord } from "@/lib/api";

interface UploadItem {
  file: File;
  status: "uploading" | "done" | "error";
  error?: string;
  document?: DocumentRecord;
}

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".md", ".txt"];

export default function UploadPage() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    setItems((prev) => [...prev, ...fileArray.map((file) => ({ file, status: "uploading" as const }))]);

    for (const file of fileArray) {
      try {
        const { document } = await api.uploadDocument(file);
        setItems((prev) =>
          prev.map((item) => (item.file === file ? { ...item, status: "done", document } : item))
        );
      } catch (err) {
        setItems((prev) =>
          prev.map((item) =>
            item.file === file
              ? { ...item, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
              : item
          )
        );
      }
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles]
  );

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold">Upload documents</h1>
      <p className="mt-1 text-sm text-neutral-500">Accepted formats: PDF, DOCX, MD, TXT.</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" : "border-neutral-300 dark:border-neutral-700"
        }`}
      >
        <p className="text-sm">Drag and drop files here, or click to browse</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={(e) => e.target.files && uploadFiles(e.target.files)}
        />
      </div>

      {items.length > 0 && (
        <ul className="mt-6 space-y-2">
          {items.map((item, i) => (
            <li
              key={`${item.file.name}-${i}`}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-4 py-2 text-sm dark:border-neutral-800"
            >
              <span className="truncate">{item.file.name}</span>
              {item.status === "uploading" && <span className="text-neutral-500">Uploading…</span>}
              {item.status === "done" && <span className="text-green-600">Processing</span>}
              {item.status === "error" && <span className="text-red-600">{item.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
