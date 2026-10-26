import { useEffect, useState } from 'react';
import { FALLBACK_IMAGE } from '../../utils/constants';

/** Image gallery with thumbnails and hover zoom (desktop) - no external zoom library needed. */
export default function ProductGallery({ images = [], title }) {
  const list = images.length ? images : [FALLBACK_IMAGE];
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });

  const imagesKey = list.join('|');
  useEffect(() => {
    setActive(0);
  }, [imagesKey]);
  const src = list[Math.min(active, list.length - 1)];

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({ on: true, x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  };

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      <div className="no-scrollbar flex gap-2 overflow-x-auto md:flex-col" role="tablist" aria-label="Product images">
        {list.map((img, i) => (
          <button
            key={img + i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`Image ${i + 1}`}
            onMouseEnter={() => setActive(i)}
            onClick={() => setActive(i)}
            className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 bg-white transition md:h-20 md:w-20 ${
              i === active ? 'border-brand-600 shadow-md shadow-brand-600/20' : 'border-gray-200 opacity-75 hover:opacity-100 dark:border-gray-700'
            }`}
          >
            <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
          </button>
        ))}
      </div>

      <div
        className="relative flex-1 cursor-zoom-in overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800"
        onMouseMove={onMove}
        onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
      >
        <img
          src={src}
          alt={title}
          className="aspect-square w-full object-contain transition-transform duration-150"
          style={zoom.on ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          onError={(e) => {
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        <span className="pointer-events-none absolute bottom-2 right-2 hidden rounded bg-black/60 px-2 py-1 text-xs text-white md:block">
          Hover to zoom
        </span>
      </div>
    </div>
  );
}
