import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const range = (page, pages) => {
  const out = new Set([1, pages, page - 1, page, page + 1]);
  return [...out].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
};

export default function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const list = range(page, pages);
  return (
    <nav className="mt-8 flex items-center justify-center gap-1" aria-label="Pagination">
      <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
        <FiChevronLeft />
      </button>
      {list.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && p - list[i - 1] > 1 && <span className="px-1 text-gray-400">...</span>}
          <button
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? 'page' : undefined}
            className={`btn-sm btn min-w-[2.25rem] ${p === page ? 'bg-brand-600 text-white' : 'btn-outline'}`}
          >
            {p}
          </button>
        </span>
      ))}
      <button type="button" className="btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)} aria-label="Next page">
        <FiChevronRight />
      </button>
    </nav>
  );
}
