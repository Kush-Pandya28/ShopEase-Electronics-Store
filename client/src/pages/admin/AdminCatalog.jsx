import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { useGetCategoriesQuery, useGetBrandsQuery, useGetBannersQuery } from '../../services/productApi';
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useCreateBrandMutation,
  useUpdateBrandMutation,
  useDeleteBrandMutation,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} from '../../services/adminApi';
import { errorMessage } from '../../utils/format';

/**
 * Generic CRUD table used for categories, brands and home banners.
 * `fields`: [{ name, label, type?: 'text'|'number'|'checkbox'|'select', options? }]
 */
function CrudSection({ title, items = [], loading, fields, columns, hooks, blank }) {
  const [create] = hooks.create();
  const [update] = hooks.update();
  const [remove] = hooks.remove();
  const [editing, setEditing] = useState(null);

  const save = async (e) => {
    e.preventDefault();
    const body = Object.fromEntries(
      fields.map((f) => {
        let v = editing[f.name];
        if (f.type === 'number') v = Number(v);
        if (f.type === 'select' && v === '') v = null;
        return [f.name, v];
      })
    );
    try {
      if (editing._id) await update({ id: editing._id, ...body }).unwrap();
      else await create(body).unwrap();
      toast.success(`${title.replace(/s$/, '')} saved`);
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const onDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name || item.title}"?`)) return;
    try {
      await remove(item._id).unwrap();
      toast.success('Deleted');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button type="button" className="btn-primary btn-sm" onClick={() => setEditing({ ...blank })}><FiPlus /> Add</button>
      </div>
      {loading ? <Loader /> : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr>{columns.map((c) => <th key={c.label}>{c.label}</th>)}<th /></tr></thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id}>
                  {columns.map((c) => <td key={c.label}>{c.render(item)}</td>)}
                  <td className="whitespace-nowrap text-right">
                    <button type="button" className="btn-ghost p-1.5" onClick={() => setEditing({ ...blank, ...item, parent: item.parent || '' })} aria-label="Edit"><FiEdit2 /></button>
                    <button type="button" className="btn-ghost p-1.5 text-red-600" onClick={() => onDelete(item)} aria-label="Delete"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!items.length && <p className="p-6 text-center text-sm text-gray-500">Nothing here yet.</p>}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={`${editing?._id ? 'Edit' : 'Add'} ${title.replace(/s$/, '').toLowerCase()}`}>
        {editing && (
          <form onSubmit={save} className="space-y-3">
            {fields.map((f) => (
              <div key={f.name}>
                {f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={Boolean(editing[f.name])} onChange={(e) => setEditing((s) => ({ ...s, [f.name]: e.target.checked }))} /> {f.label}
                  </label>
                ) : f.type === 'select' ? (
                  <>
                    <label className="label" htmlFor={f.name}>{f.label}</label>
                    <select id={f.name} className="input" value={editing[f.name] || ''} onChange={(e) => setEditing((s) => ({ ...s, [f.name]: e.target.value }))}>
                      <option value="">None</option>
                      {f.options.filter((o) => o.value !== editing._id).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </>
                ) : (
                  <>
                    <label className="label" htmlFor={f.name}>{f.label}</label>
                    <input
                      id={f.name}
                      type={f.type || 'text'}
                      required={f.required}
                      className="input"
                      value={editing[f.name] ?? ''}
                      onChange={(e) => setEditing((s) => ({ ...s, [f.name]: e.target.value }))}
                    />
                  </>
                )}
              </div>
            ))}
            {editing.image && <img src={editing.image} alt="" className="h-20 rounded object-contain" />}
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </form>
        )}
      </Modal>
    </section>
  );
}

const TABS = ['Categories', 'Brands', 'Banners'];
const ICONS = ['smartphone', 'laptop', 'tablet', 'headphones', 'watch', 'camera', 'tv', 'speaker', 'gamepad', 'keyboard', 'battery', 'home'];

export default function AdminCatalog() {
  const [tab, setTab] = useState(TABS[0]);
  const cats = useGetCategoriesQuery(true);
  const brands = useGetBrandsQuery(true);
  const banners = useGetBannersQuery(true);
  const active = (v) => <span className={`badge ${v ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{v ? 'Active' : 'Hidden'}</span>;
  const catName = (id) => cats.data?.items?.find((c) => c._id === id)?.name || '-';

  return (
    <div className="space-y-4">
      <Seo title="Catalog" noIndex />
      <h1 className="text-2xl font-bold">Categories, brands & banners</h1>
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} className={`btn-sm btn ${tab === t ? 'bg-brand-600 text-white' : 'btn-outline'}`}>{t}</button>
        ))}
      </div>

      {tab === 'Categories' && (
        <CrudSection
          title="Categories"
          items={cats.data?.items}
          loading={cats.isLoading}
          blank={{ name: '', description: '', image: '', icon: 'smartphone', parent: '', isActive: true }}
          hooks={{ create: useCreateCategoryMutation, update: useUpdateCategoryMutation, remove: useDeleteCategoryMutation }}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'description', label: 'Description' },
            { name: 'image', label: 'Image URL' },
            { name: 'icon', label: `Icon (${ICONS.join(', ')})` },
            { name: 'parent', label: 'Parent category (for sub-categories)', type: 'select', options: (cats.data?.items || []).map((c) => ({ value: c._id, label: c.name })) },
            { name: 'isActive', label: 'Active', type: 'checkbox' },
          ]}
          columns={[
            { label: 'Name', render: (c) => <span className="font-medium">{c.name}</span> },
            { label: 'Slug', render: (c) => <span className="text-xs text-gray-500">{c.slug}</span> },
            { label: 'Parent', render: (c) => (c.parent ? catName(c.parent) : '-') },
            { label: 'Products', render: (c) => c.productCount },
            { label: 'Status', render: (c) => active(c.isActive) },
          ]}
        />
      )}

      {tab === 'Brands' && (
        <CrudSection
          title="Brands"
          items={brands.data?.items}
          loading={brands.isLoading}
          blank={{ name: '', logo: '', isActive: true }}
          hooks={{ create: useCreateBrandMutation, update: useUpdateBrandMutation, remove: useDeleteBrandMutation }}
          fields={[
            { name: 'name', label: 'Name', required: true },
            { name: 'logo', label: 'Logo URL' },
            { name: 'isActive', label: 'Active', type: 'checkbox' },
          ]}
          columns={[
            { label: 'Name', render: (b) => <span className="font-medium">{b.name}</span> },
            { label: 'Slug', render: (b) => <span className="text-xs text-gray-500">{b.slug}</span> },
            { label: 'Products', render: (b) => b.productCount },
            { label: 'Status', render: (b) => active(b.isActive) },
          ]}
        />
      )}

      {tab === 'Banners' && (
        <CrudSection
          title="Banners"
          items={banners.data?.banners}
          loading={banners.isLoading}
          blank={{ title: '', subtitle: '', image: '', link: '/products', buttonText: 'Shop now', position: 0, isActive: true }}
          hooks={{ create: useCreateBannerMutation, update: useUpdateBannerMutation, remove: useDeleteBannerMutation }}
          fields={[
            { name: 'title', label: 'Title', required: true },
            { name: 'subtitle', label: 'Subtitle' },
            { name: 'image', label: 'Image URL', required: true },
            { name: 'link', label: 'Link (e.g. /category/mobiles)' },
            { name: 'buttonText', label: 'Button text' },
            { name: 'position', label: 'Position', type: 'number' },
            { name: 'isActive', label: 'Active', type: 'checkbox' },
          ]}
          columns={[
            { label: 'Banner', render: (b) => <div className="flex items-center gap-2"><img src={b.image} alt="" className="h-10 w-16 rounded object-cover" /><span className="font-medium">{b.title}</span></div> },
            { label: 'Link', render: (b) => <span className="text-xs">{b.link}</span> },
            { label: 'Position', render: (b) => b.position },
            { label: 'Status', render: (b) => active(b.isActive) },
          ]}
        />
      )}
    </div>
  );
}
