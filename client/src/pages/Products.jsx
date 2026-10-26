import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { FiFilter, FiX } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import ProductGrid from '../components/product/ProductGrid';
import ProductFilters from '../components/product/ProductFilters';
import Pagination from '../components/common/Pagination';
import EmptyState from '../components/common/EmptyState';
import { Spinner } from '../components/common/Loader';
import { useGetProductsQuery, useGetCategoryQuery } from '../services/productApi';
import { SORT_OPTIONS } from '../utils/constants';

const FILTER_KEYS = [
  'q',
  'category',
  'brand',
  'minPrice',
  'maxPrice',
  'rating',
  'ram',
  'storage',
  'battery',
  'screen',
  'minDiscount',
  'inStock',
  'featured',
];
const PAGE_SIZE = 12;

export default function Products() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const [drawer, setDrawer] = useState(false);
  const [infinite, setInfinite] = useState(false);
  const [loadedPages, setLoadedPages] = useState(1);
  const sentinel = useRef(null);

  const filters = useMemo(
    () => Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) || ''])),
    [params]
  );
  const sort = params.get('sort') || 'newest';
  const page = Number(params.get('page')) || 1;
  const { data: catData } = useGetCategoryQuery(slug, { skip: !slug });

  // Infinite mode asks for a growing page size so the list simply extends
  const query = {
    ...filters,
    ...(slug ? { category: slug } : {}),
    sort,
    page: infinite ? 1 : page,
    limit: infinite ? PAGE_SIZE * loadedPages : PAGE_SIZE,
  };
  const { data, isFetching, isLoading } = useGetProductsQuery(query);
  const filterKey = JSON.stringify({ filters, slug, sort });

  useEffect(() => {
    setLoadedPages(1);
  }, [filterKey, infinite]);

  useEffect(() => {
    if (!infinite || !sentinel.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Only grow when the last response was a full page (the API caps limit at 100)
        const fullPage = data && data.products.length === PAGE_SIZE * loadedPages;
        if (entry.isIntersecting && !isFetching && fullPage && data.products.length < data.total) {
          setLoadedPages((p) => p + 1);
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [infinite, isFetching, data, loadedPages]);

  /** update('sort', 'price_asc') or update({ minPrice, maxPrice }) - several keys in one URL change */
  const update = (keyOrValues, value) => {
    const changes = typeof keyOrValues === 'string' ? { [keyOrValues]: value } : keyOrValues;
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, val]) => {
      if (val) next.set(key, val);
      else next.delete(key);
    });
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const clear = () => setParams(params.get('q') ? { q: params.get('q') } : {});
  const title = slug
    ? catData?.item?.name || 'Products'
    : filters.q
      ? `Results for "${filters.q}"`
      : 'All products';
  const activeChips = FILTER_KEYS.filter((k) => k !== 'q' && filters[k]);

  const filterPanel = (
    <ProductFilters filters={filters} onChange={update} onClear={clear} lockedCategory={slug} />
  );

  return (
    <div className="container-x py-6">
      <Seo title={title} description={catData?.item?.description} />
      <div className="flex gap-6">
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="card sticky top-32 max-h-[calc(100vh-9rem)] overflow-y-auto p-4">{filterPanel}</div>
        </aside>

        <section className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="mr-auto">
              <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
              <p className="text-sm text-gray-500">{data ? `${data.total} products` : ' '}</p>
            </div>
            <button type="button" className="btn-outline btn-sm lg:hidden" onClick={() => setDrawer(true)}>
              <FiFilter /> Filters {activeChips.length > 0 && `(${activeChips.length})`}
            </button>
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline">Sort by</span>
              <select
                className="input w-auto py-2"
                value={sort}
                onChange={(e) => update('sort', e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-500">
              <input
                type="checkbox"
                checked={infinite}
                onChange={(e) => setInfinite(e.target.checked)}
                className="rounded text-brand-600"
              />
              Infinite scroll
            </label>
          </div>

          {activeChips.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {activeChips.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => update(k, '')}
                  className="badge gap-1 bg-brand-50 py-1 text-brand-700 hover:bg-brand-100 dark:bg-brand-900/40 dark:text-brand-200"
                >
                  {k}: {filters[k]} <FiX />
                </button>
              ))}
            </div>
          )}

          {!isLoading && data?.products?.length === 0 ? (
            <EmptyState
              icon={FiFilter}
              title="No products found"
              message="Try removing a few filters or searching for something else."
              actionLabel="Clear filters"
              actionTo={slug ? `/category/${slug}` : '/products'}
            />
          ) : (
            <div className={isFetching && !infinite ? 'opacity-60 transition' : ''}>
              <ProductGrid products={data?.products} loading={isLoading} skeletons={PAGE_SIZE} />
            </div>
          )}

          {infinite ? (
            <div ref={sentinel} className="flex justify-center py-6 text-brand-600">
              {isFetching && <Spinner className="h-6 w-6" />}
              {data && data.products.length >= data.total && data.total > 0 && (
                <p className="text-sm text-gray-500">You have reached the end</p>
              )}
            </div>
          ) : (
            <Pagination
              page={page}
              pages={data?.pages}
              onChange={(p) => {
                update('page', String(p));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setDrawer(false)}>
          <div
            className="absolute inset-y-0 right-0 w-80 max-w-[90vw] overflow-y-auto bg-white p-4 dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close filters">
                <FiX size={22} />
              </button>
            </div>
            {filterPanel}
            <button type="button" className="btn-primary mt-4 w-full" onClick={() => setDrawer(false)}>
              Show {data?.total ?? ''} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
