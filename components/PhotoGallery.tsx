"use client";

import { useState } from "react";
import { Bowl } from "./Icons";
import type { Photo } from "@/lib/types";

export default function PhotoGallery({ photos, title }: { photos: Photo[]; title: string }) {
  const [active, setActive] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="detail-hero">
        <div className="recipe-photo-empty">
          <Bowl size={64} />
        </div>
      </div>
    );
  }

  const current = photos[Math.min(active, photos.length - 1)];

  return (
    <div>
      <div className="detail-hero">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={title} />
      </div>

      {photos.length > 1 && (
        <div className="detail-thumbs">
          {photos.map((photo, index) => (
            <button
              key={photo.url}
              type="button"
              className="detail-thumb"
              aria-pressed={index === active}
              aria-label={`Photo ${index + 1}`}
              onClick={() => setActive(index)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
