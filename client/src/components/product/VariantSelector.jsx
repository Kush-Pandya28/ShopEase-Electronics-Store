const ATTRS = [
  { key: 'color', label: 'Color' },
  { key: 'ram', label: 'RAM' },
  { key: 'storage', label: 'Storage' },
];

/**
 * Lets the user pick color / RAM / storage. Picks the closest matching variant
 * when an attribute changes so the selection is always a real SKU.
 */
export default function VariantSelector({ variants = [], selected, onSelect }) {
  if (variants.length <= 1) return null;

  const choose = (key, value) => {
    const wanted = { ...selected, [key]: value };
    const score = (v) => ATTRS.reduce((s, a) => s + (v[a.key] === wanted[a.key] ? (a.key === key ? 10 : 1) : 0), 0);
    const best = variants.filter((v) => v[key] === value).sort((a, b) => score(b) - score(a))[0];
    if (best) onSelect(best);
  };

  return (
    <div className="space-y-4">
      {ATTRS.map(({ key, label }) => {
        const values = [...new Set(variants.map((v) => v[key]).filter(Boolean))];
        if (values.length <= 1) return null;
        return (
          <div key={key}>
            <p className="mb-2 text-sm font-medium">
              {label}: <span className="font-semibold">{selected?.[key]}</span>
            </p>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
              {values.map((value) => {
                const match = variants.find((v) => v[key] === value);
                const isActive = selected?.[key] === value;
                const available = variants.some((v) => v[key] === value && v.stock > 0);
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isActive}
                    onClick={() => choose(key, value)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition ${
                      isActive
                        ? 'border-brand-600 bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/30 dark:text-brand-200'
                        : 'border-gray-300 hover:border-brand-400 dark:border-gray-700'
                    } ${available ? '' : 'opacity-50 line-through'}`}
                  >
                    {key === 'color' && match?.colorHex && (
                      <span className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: match.colorHex }} />
                    )}
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
