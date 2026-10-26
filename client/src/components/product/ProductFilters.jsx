import { useEffect, useState } from 'react';
import { useGetFilterOptionsQuery, useGetCategoriesQuery } from '../../services/productApi';
import { formatPrice } from '../../utils/format';

function Section({ title, children }) {
  return (
    <fieldset className="border-b border-gray-100 py-4 dark:border-gray-800">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function CheckList({ name, options, selected, onToggle, getLabel = (o) => o, getValue = (o) => o }) {
  const [showAll, setShowAll] = useState(false);
  const list = showAll ? options : options.slice(0, 6);
  return (
    <div className="space-y-1.5">
      {list.map((o) => {
        const value = getValue(o);
        return (
          <label key={value} className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              name={name}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={selected.includes(value)}
              onChange={() => onToggle(value)}
            />
            {getLabel(o)}
          </label>
        );
      })}
      {options.length > 6 && (
        <button
          type="button"
          className="text-xs font-semibold text-brand-600"
          onClick={() => setShowAll((s) => !s)}
        >
          {showAll ? 'Show less' : `+ ${options.length - 6} more`}
        </button>
      )}
    </div>
  );
}

/**
 * Controlled by URL search params. `filters` is a plain object; `onChange(key, value)` updates one param.
 */
export default function ProductFilters({ filters, onChange, onClear, lockedCategory }) {
  const category = lockedCategory || filters.category;
  const { data: options } = useGetFilterOptionsQuery(category || undefined);
  const { data: catData } = useGetCategoriesQuery();
  const [price, setPrice] = useState({ min: filters.minPrice || '', max: filters.maxPrice || '' });

  useEffect(() => {
    setPrice({ min: filters.minPrice || '', max: filters.maxPrice || '' });
  }, [filters.minPrice, filters.maxPrice]);

  const list = (key) => (filters[key] ? filters[key].split(',') : []);
  const toggle = (key) => (value) => {
    const current = list(key);
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    onChange(key, next.join(','));
  };

  return (
    <div className="text-gray-800 dark:text-gray-200">
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-bold">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-brand-600 hover:underline"
        >
          Clear all
        </button>
      </div>

      {!lockedCategory && (
        <Section title="Category">
          <select
            className="input"
            value={filters.category || ''}
            onChange={(e) => onChange('category', e.target.value)}
            aria-label="Category"
          >
            <option value="">All categories</option>
            {catData?.items?.map((c) => (
              <option key={c._id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Section>
      )}

      <Section title="Price">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const [min, max] =
              price.min && price.max && Number(price.min) > Number(price.max)
                ? [price.max, price.min]
                : [price.min, price.max];
            onChange({ minPrice: min, maxPrice: max });
          }}
        >
          <input
            type="number"
            min="0"
            className="input px-2"
            placeholder="Min"
            value={price.min}
            onChange={(e) => setPrice((p) => ({ ...p, min: e.target.value }))}
            aria-label="Minimum price"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            min="0"
            className="input px-2"
            placeholder="Max"
            value={price.max}
            onChange={(e) => setPrice((p) => ({ ...p, max: e.target.value }))}
            aria-label="Maximum price"
          />
          <button type="submit" className="btn-outline btn-sm">
            Go
          </button>
        </form>
        {options?.price?.max > 0 && (
          <p className="mt-1 text-xs text-gray-500">
            Range: {formatPrice(options.price.min)} - {formatPrice(options.price.max)}
          </p>
        )}
      </Section>

      {options?.brands?.length > 0 && (
        <Section title="Brand">
          <CheckList
            name="brand"
            options={options.brands}
            selected={list('brand')}
            onToggle={toggle('brand')}
            getLabel={(b) => b.name}
            getValue={(b) => b.slug}
          />
        </Section>
      )}

      <Section title="Customer rating">
        {[4, 3, 2].map((r) => (
          <label key={r} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm">
            <input
              type="radio"
              name="rating"
              className="text-brand-600"
              checked={filters.rating === String(r)}
              onChange={() => onChange('rating', String(r))}
            />
            {r}★ & above
          </label>
        ))}
      </Section>

      {options?.ram?.length > 0 && (
        <Section title="RAM">
          <CheckList name="ram" options={options.ram} selected={list('ram')} onToggle={toggle('ram')} />
        </Section>
      )}
      {options?.storage?.length > 0 && (
        <Section title="Storage">
          <CheckList
            name="storage"
            options={options.storage}
            selected={list('storage')}
            onToggle={toggle('storage')}
          />
        </Section>
      )}
      {options?.battery?.length > 0 && (
        <Section title="Battery capacity">
          <CheckList
            name="battery"
            options={options.battery}
            selected={list('battery')}
            onToggle={toggle('battery')}
          />
        </Section>
      )}
      {options?.screen?.length > 0 && (
        <Section title="Screen size">
          <CheckList
            name="screen"
            options={options.screen}
            selected={list('screen')}
            onToggle={toggle('screen')}
          />
        </Section>
      )}

      <Section title="Discount">
        {[10, 20, 30, 50].map((d) => (
          <label key={d} className="flex cursor-pointer items-center gap-2 py-0.5 text-sm">
            <input
              type="radio"
              name="discount"
              className="text-brand-600"
              checked={filters.minDiscount === String(d)}
              onChange={() => onChange('minDiscount', String(d))}
            />
            {d}% or more
          </label>
        ))}
      </Section>

      <Section title="Availability">
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 rounded text-brand-600"
            checked={filters.inStock === 'true'}
            onChange={(e) => onChange('inStock', e.target.checked ? 'true' : '')}
          />
          Exclude out of stock
        </label>
      </Section>
    </div>
  );
}
