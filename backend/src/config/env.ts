import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.string().default("5000"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  QDRANT_URL: z.string().min(1, "QDRANT_URL is required"),
  QDRANT_API_KEY: z.string().min(1, "QDRANT_API_KEY is required"),
  QDRANT_COLLECTION: z.string().default("docuquery_chunks"),

  CLOUDINARY_CLOUD_NAME: z.string().min(1, "CLOUDINARY_CLOUD_NAME is required"),
  CLOUDINARY_API_KEY: z.string().min(1, "CLOUDINARY_API_KEY is required"),
  CLOUDINARY_API_SECRET: z.string().min(1, "CLOUDINARY_API_SECRET is required"),

  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_CHAT_MODEL: z.string().default("gemini-3.5-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),

  MAX_UPLOAD_SIZE_MB: z.string().default("20"),
  FRONTEND_ORIGIN: z.string().default("http://localhost:3000"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Missing or invalid environment variables. Check backend/.env against .env.example.");
}

export const env = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
  MAX_UPLOAD_SIZE_MB: Number(parsed.data.MAX_UPLOAD_SIZE_MB),
};
