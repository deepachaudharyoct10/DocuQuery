import { v2 as cloudinary } from "cloudinary";

import { env } from "../config/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export interface UploadedFile {
  url: string;
  publicId: string;
}

export async function uploadDocumentToCloudinary(
  fileBuffer: Buffer,
  originalName: string
): Promise<UploadedFile> {
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        folder: "docuquery/documents",
        public_id: originalName.replace(/\.[^/.]+$/, ""),
        use_filename: true,
        unique_filename: true,
      },
      (error, uploadResult) => {
        if (error || !uploadResult) return reject(error ?? new Error("Cloudinary upload failed"));
        resolve(uploadResult);
      }
    );
    stream.end(fileBuffer);
  });

  return { url: result.secure_url, publicId: result.public_id };
}

export async function deleteDocumentFromCloudinary(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}
