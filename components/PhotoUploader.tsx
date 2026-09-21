"use client";

import { useRef, useState } from "react";
import { Camera, Plus, X } from "./Icons";
import type { Photo } from "@/lib/types";

const MAX_EDGE = 1600;
const QUALITY = 0.82;

/**
 * Shrinks a photo in the browser before it ever leaves the phone. A raw iPhone
 * shot is 3-5MB; this lands around 200-400KB, which uploads fast on cell data
 * and stays well under the server's body limit.
 */
async function downscale(file: File): Promise<Blob> {
  // imageOrientation honours the EXIF rotation, so portrait photos don't land sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  if (!bitmap) return file;

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", QUALITY)
  );
  return blob ?? file;
}

export default function PhotoUploader({
  photos,
  onChange,
}: {
  photos: Photo[];
  /** Takes an updater so uploads landing one after another can't clobber each other. */
  onChange: (update: (current: Photo[]) => Photo[]) => void;
}) {
  const pickRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  async function addFiles(files: FileList | File[] | null) {
    const images = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;

    setError("");
    setUploading((n) => n + images.length);

    // Sequential so a handful of phone photos doesn't saturate a weak connection.
    for (const file of images) {
      try {
        const shrunk = await downscale(file);
        const form = new FormData();
        form.append("file", new File([shrunk], "photo.jpg", { type: shrunk.type || "image/jpeg" }));

        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = (await res.json().catch(() => ({}))) as { photo?: Photo; error?: string };

        if (!res.ok || !data.photo) {
          setError(data.error ?? "That photo wouldn't upload.");
        } else {
          const added = data.photo;
          onChange((current) => [...current, added]);
        }
      } catch {
        setError("That photo wouldn't upload.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function remove(index: number) {
    onChange((current) => current.filter((_, i) => i !== index));
  }

  function makeCover(index: number) {
    onChange((current) => {
      const next = [...current];
      const [picked] = next.splice(index, 1);
      return [picked, ...next];
    });
  }

  return (
    <div className="field">
      <span className="field-label">Photos</span>
      <span className="field-hint">
        The first photo is the cover. Straight from your camera roll is fine, they get resized automatically.
      </span>

      {photos.length > 0 && (
        <div className="photo-strip" style={{ marginBottom: 4 }}>
          {photos.map((photo, index) => (
            <div key={photo.url} className="photo-thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" />
              <button
                type="button"
                className="photo-remove"
                onClick={() => remove(index)}
                aria-label="Remove photo"
              >
                <X size={12} />
              </button>
              {index === 0 ? (
                <div className="photo-cover-flag">Cover</div>
              ) : (
                <button type="button" className="photo-cover-set" onClick={() => makeCover(index)}>
                  Make cover
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div
        className="dropzone"
        data-drag={dragging}
        role="button"
        tabIndex={0}
        onClick={() => pickRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            pickRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void addFiles(e.dataTransfer.files);
        }}
      >
        <Plus size={22} />
        <span style={{ fontSize: 14, fontWeight: 550 }}>
          {uploading > 0 ? `Uploading ${uploading} photo${uploading === 1 ? "" : "s"}…` : "Add photos"}
        </span>
        <span style={{ fontSize: 12.5 }}>Tap to choose, or drop them here</span>
      </div>

      <div className="upload-actions">
        <button type="button" className="btn btn-sm" onClick={() => cameraRef.current?.click()}>
          <Camera size={15} />
          Take a photo
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      <input
        ref={pickRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
