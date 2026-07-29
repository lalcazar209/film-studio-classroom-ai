"use client";

import { useState } from "react";

export function VideoUpload({
  submissionId,
  onUploaded,
}: {
  submissionId: string;
  onUploaded: (secureUrl: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setProgress(0);
    setError(null);

    try {
      const signResponse = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      if (!signResponse.ok) {
        const data = await signResponse.json().catch(() => ({}));
        throw new Error(typeof data.error === "string" ? data.error : "Could not start upload");
      }
      const signed = await signResponse.json();

      const secureUrl = await uploadToCloudinary(file, signed, setProgress);
      onUploaded(secureUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <label>
        <span className="mb-1 block text-sm font-medium">Or upload a video file</span>
        <input
          type="file"
          accept="video/*"
          disabled={isUploading}
          onChange={handleFileChange}
          className="text-sm"
        />
      </label>
      {isUploading && (
        <div className="h-1.5 w-full max-w-xs rounded bg-black/10 dark:bg-white/10">
          <div className="h-1.5 rounded bg-studio-accent transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

interface SignedUploadParams {
  uploadUrl: string;
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
  publicId: string;
}

function uploadToCloudinary(
  file: File,
  signed: SignedUploadParams,
  onProgress: (percent: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signed.apiKey);
    formData.append("timestamp", String(signed.timestamp));
    formData.append("signature", signed.signature);
    formData.append("folder", signed.folder);
    formData.append("public_id", signed.publicId);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", signed.uploadUrl);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url as string);
        } catch {
          reject(new Error("Cloudinary returned an unexpected response"));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));

    xhr.send(formData);
  });
}
