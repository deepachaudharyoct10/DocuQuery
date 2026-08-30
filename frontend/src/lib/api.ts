const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export interface DocumentRecord {
  _id: string;
  originalName: string;
  fileType: "pdf" | "docx" | "md" | "txt";
  sizeBytes: number;
  status: "processing" | "completed" | "failed";
  failureReason?: string;
  chunkCount: number;
  cloudinaryUrl: string;
  createdAt: string;
}

export interface Citation {
  documentId: string;
  documentName: string;
  chunkIndex: number;
  pageNumber?: number;
  snippet: string;
}

export interface Message {
  role: "user" | "assistant";
  content: string;
  citations: Citation[];
  createdAt: string;
}

export interface Conversation {
  _id: string;
  title: string;
  messages: Message[];
}

export interface RetrievedChunk {
  id: string;
  score: number;
  payload: {
    documentId: string;
    documentName: string;
    chunkIndex: number;
    text: string;
  };
}

export interface AskQuestionResponse {
  conversationId: string;
  answer: string;
  citations: Citation[];
  retrievedChunks: RetrievedChunk[];
}

export interface Contradiction {
  _id: string;
  statementA: { documentId: string; documentName: string; chunkIndex: number; pageNumber?: number; text: string };
  statementB: { documentId: string; documentName: string; chunkIndex: number; pageNumber?: number; text: string };
  type: "factual" | "logical" | "temporal" | "numerical" | "other";
  severity: "critical" | "warning" | "info";
  explanation: string;
  status: "open" | "resolved" | "false_positive";
  createdAt: string;
}

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...init?.headers },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(body.error ?? "Request failed", res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ document: DocumentRecord }>("/api/documents/upload", { method: "POST", body: formData });
  },

  listDocuments: () => request<{ documents: DocumentRecord[] }>("/api/documents"),

  deleteDocument: (id: string) => request<void>(`/api/documents/${id}`, { method: "DELETE" }),

  askQuestion: (question: string, conversationId?: string) =>
    request<AskQuestionResponse>("/api/chat", {
      method: "POST",
      body: JSON.stringify({ question, conversationId }),
    }),

  getConversation: (id: string) => request<{ conversation: Conversation }>(`/api/conversations/${id}`),

  listContradictions: (status?: string) =>
    request<{ contradictions: Contradiction[] }>(`/api/contradictions${status ? `?status=${status}` : ""}`),

  updateContradictionStatus: (id: string, status: "resolved" | "false_positive") =>
    request<{ contradiction: Contradiction }>(`/api/contradictions/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};
