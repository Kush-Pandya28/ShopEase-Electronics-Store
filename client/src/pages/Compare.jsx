import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiColumns, FiX } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import Rating from '../components/common/Rating';
import Price from '../components/common/Price';
import { useCompareProductsQuery } from '../services/productApi';
import { removeFromCompare, clearCompare } from '../features/compare/compareSlice';
import useCart from '../hooks/useCart';
import { errorMessage } from '../utils/format';

export default function Compare() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.compare.items);
  const ids = items.map((i) => i._id);
  const { data, isFetching, error } = useCompareProductsQuery(ids, { skip: ids.length < 2 });
  const { addToCart } = useCart();

  if (ids.length < 2) {
    return (
      <div className="container-x py-10">
        <Seo title="Compare products" />
        <EmptyState
          icon={FiColumns}
          title={ids.length ? 'Add one more product to compare' : 'Nothing to compare yet'}
          message="Use the compare button on any product card. You can compare 2 to 4 products from the same category."
          actionLabel="Browse products"
          actionTo={items[0] ? `/products` : '/products'}
        />
      </div>
    );
  }
  if (isFetching && !data) return <Loader full />;
  if (error) return <div className="container-x py-10"><EmptyState title="Could not compare" message={errorMessage(error)} actionLabel="Browse products" /></div>;

  const products = data?.products || [];
  // Union of all spec rows grouped by spec group
  const rows = [];
  const seen = new Set();
  products.forEach((p) =>
    p.specifications.forEach((s) => {
      const id = `${s.group}::${s.key}`;
      if (!seen.has(id)) {
        seen.add(id);
        rows.push({ id, group: s.group, key: s.key });
      }
    })
  );
  const valueOf = (p, row) => p.specifications.find((s) => `${s.group}::${s.key}` === row.id)?.value || '-';
  const differs = (row) => new Set(products.map((p) => valueOf(p, row))).size > 1;

  return (
    <div className="container-x py-6">
      <Seo title="Compare products" />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Compare {products[0]?.category?.name}</h1>
        <button type="button" className="btn-ghost btn-sm" onClick={() => dispatch(clearCompare())}>
          Clear all
        </button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr>
              <th className="w-40 p-3 text-left align-bottom text-xs uppercase text-gray-500">Product</th>
              {products.map((p) => (
                <th key={p._id} className="relative p-3 text-left align-top font-normal">
                  <button type="button" onClick={() => dispatch(removeFromCompare(p._id))} className="absolute right-2 top-2 text-gray-400 hover:text-red-500" aria-label={`Remove ${p.title}`}>
                    <FiX />
                  </button>
                  <Link to={`/product/${p.slug}`}>
                    <img src={p.images?.[0]?.url} alt={p.title} className="mx-auto h-32 w-32 object-contain" loading="lazy" />
                    <p className="mt-2 line-clamp-2 font-semibold hover:text-brand-600">{p.title}</p>
                  </Link>
                  <div className="mt-1"><Price price={p.price} mrp={p.mrp} size="sm" /></div>
                  <div className="mt-1"><Rating value={p.ratingAverage} count={p.ratingCount} /></div>
                  <button
                    type="button"
                    className="btn-primary btn-sm mt-2 w-full"
                    disabled={!p.stock}
                    onClick={() => addToCart(p, p.variants.find((v) => v.stock > 0))}
                  >
                    {p.stock ? 'Add to cart' : 'Out of stock'}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-gray-100 dark:border-gray-800">
              <th className="p-3 text-left font-medium text-gray-500">Brand</th>
              {products.map((p) => <td key={p._id} className="p-3">{p.brandName}</td>)}
            </tr>
            <tr className="border-t border-gray-100 dark:border-gray-800">
              <th className="p-3 text-left font-medium text-gray-500">Warranty</th>
              {products.map((p) => <td key={p._id} className="p-3">{p.warranty?.months} months</td>)}
            </tr>
            <tr className="border-t border-gray-100 dark:border-gray-800">
              <th className="p-3 text-left font-medium text-gray-500">Variants</th>
              {products.map((p) => <td key={p._id} className="p-3">{p.variants.length}</td>)}
            </tr>
            {rows.map((row, i) => (
              <tr key={row.id} className={`border-t border-gray-100 dark:border-gray-800 ${differs(row) ? 'bg-amber-50/60 dark:bg-amber-900/10' : ''}`}>
                <th className="p-3 text-left font-medium text-gray-500">
                  {(i === 0 || rows[i - 1].group !== row.group) && <span className="block text-[10px] uppercase tracking-wide text-brand-600">{row.group}</span>}
                  {row.key}
                </th>
                {products.map((p) => <td key={p._id} className="p-3">{valueOf(p, row)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500">Highlighted rows show where the products differ.</p>
    </div>
  );
}
