import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import Pagination from '../../components/common/Pagination';
import useDebounce from '../../hooks/useDebounce';
import { useGetAdminProductsQuery, useUpdateProductMutation, useDeleteProductMutation } from '../../services/adminApi';
import { formatPrice, errorMessage } from '../../utils/format';

export default function AdminProducts() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [lowStock, setLowStock] = useState(false);
  const search = useDebounce(q, 350);
  const { data, isLoading, isFetching } = useGetAdminProductsQuery({ q: search, page, lowStock: lowStock ? 'true' : '' });
  const [update] = useUpdateProductMutation();
  const [remove] = useDeleteProductMutation();

  const act = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <div>
      <Seo title="Products" noIndex />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-2xl font-bold">Products {data && <span className="text-base font-normal text-gray-500">({data.total})</span>}</h1>
        <Link to="/admin/products/new" className="btn-primary"><FiPlus /> Add product</Link>
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Search title, brand or SKU" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} aria-label="Search products" />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded text-brand-600" checked={lowStock} onChange={(e) => { setLowStock(e.target.checked); setPage(1); }} /> Low stock only
        </label>
      </div>

      {isLoading ? <Loader /> : (
        <div className={`card overflow-x-auto ${isFetching ? 'opacity-60' : ''}`}>
          <table className="table-base">
            <thead>
              <tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Sold</th><th>Featured</th><th>Active</th><th /></tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.url} alt="" className="h-10 w-10 shrink-0 rounded object-contain" />
                      <div className="min-w-0">
                        <p className="line-clamp-1 max-w-xs font-medium">{p.title}</p>
                        <p className="text-xs text-gray-500">{p.brandName} · {p.variants?.length} variant(s)</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">{p.category?.name}</td>
                  <td className="whitespace-nowrap">{formatPrice(p.price)}</td>
                  <td><span className={p.stock <= 5 ? 'font-semibold text-red-600' : ''}>{p.stock}</span></td>
                  <td>{p.soldCount}</td>
                  <td>
                    <button type="button" aria-label="Toggle featured" onClick={() => act(() => update({ id: p._id, isFeatured: !p.isFeatured }).unwrap(), 'Updated')}>
                      <FiStar className={p.isFeatured ? 'fill-amber-400 text-amber-400' : 'text-gray-400'} />
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => act(() => update({ id: p._id, isActive: !p.isActive }).unwrap(), 'Updated')}
                      className={`badge ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                    >
                      {p.isActive ? 'Active' : 'Hidden'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <Link to={`/admin/products/${p._id}/edit`} className="btn-ghost p-1.5" aria-label="Edit"><FiEdit2 /></Link>
                    <button type="button" className="btn-ghost p-1.5 text-red-600" aria-label="Delete" onClick={() => window.confirm(`Delete "${p.title}"?`) && act(() => remove(p._id).unwrap(), 'Product deleted')}>
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.products.length && <p className="p-6 text-center text-sm text-gray-500">No products found.</p>}
        </div>
      )}
      <Pagination page={page} pages={data?.pages} onChange={setPage} />
    </div>
  );
}
