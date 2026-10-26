import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';

export function Stars({ value = 0, size = 14 }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        if (value >= n) return <FaStar key={n} size={size} />;
        if (value >= n - 0.5) return <FaStarHalfAlt key={n} size={size} />;
        return <FaRegStar key={n} size={size} />;
      })}
    </span>
  );
}

/** Compact green badge like "4.3 ★ (1,204)" */
export default function Rating({ value = 0, count = 0 }) {
  if (!count) return <span className="text-xs text-gray-400">No ratings yet</span>;
  const color = value >= 4 ? 'bg-green-600' : value >= 3 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold text-white ${color}`}>
        {value.toFixed(1)} <FaStar size={10} />
      </span>
      <span className="text-gray-500">({count.toLocaleString('en-IN')})</span>
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="text-2xl text-amber-400 transition hover:scale-110"
        >
          {value >= n ? <FaStar /> : <FaRegStar />}
        </button>
      ))}
    </div>
  );
}
