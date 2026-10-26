import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiUpload, FiArrowLeft } from 'react-icons/fi';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import { useGetCategoriesQuery, useGetBrandsQuery } from '../../services/productApi';
import {
  useGetAdminProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useUploadImagesMutation,
} from '../../services/adminApi';
import { errorMessage } from '../../utils/format';

const emptyVariant = () => ({ sku: '', color: '', colorHex: '', ram: '', storage: '', price: '', mrp: '', stock: '' });
const emptySpec = () => ({ group: 'General', key: '', value: '' });

const initial = {
  title: '',
  description: '',
  highlights: '',
  brand: '',
  category: '',
  tags: '',
  images: [],
  variants: [emptyVariant()],
  specifications: [emptySpec()],
  warranty: { months: 12, type: 'Brand warranty', extendedAvailable: false, extendedPrice: 0 },
  returnDays: 7,
  emiAvailable: true,
  isFeatured: false,
  isActive: true,
};

const toForm = (p) => ({
  ...initial,
  ...p,
  brand: p.brand?._id || p.brand,
  category: p.category?._id || p.category,
  highlights: (p.highlights || []).join('\n'),
  tags: (p.tags || []).join(', '),
  variants: p.variants?.length ? p.variants.map((v) => ({ ...emptyVariant(), ...v, images: v.images || [] })) : [emptyVariant()],
  specifications: p.specifications?.length ? p.specifications : [emptySpec()],
  warranty: { ...initial.warranty, ...p.warranty },
});

function Card({ title, children, action }) {
  return (
    <section className="card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { data: existing, isLoading } = useGetAdminProductQuery(id, { skip: !isEdit });
  const { data: cats } = useGetCategoriesQuery(true);
  const { data: brands } = useGetBrandsQuery(true);
  const [create, { isLoading: creating }] = useCreateProductMutation();
  const [update, { isLoading: updating }] = useUpdateProductMutation();
  const [upload, { isLoading: uploading }] = useUploadImagesMutation();
  const [form, setForm] = useState(initial);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (existing?.product) setForm(toForm(existing.product));
  }, [existing]);

  if (isEdit && isLoading) return <Loader full />;

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setRow = (key, i, field, value) =>
    setForm((f) => ({ ...f, [key]: f[key].map((row, idx) => (idx === i ? { ...row, [field]: value } : row)) }));
  const addRow = (key, row) => setForm((f) => ({ ...f, [key]: [...f[key], row] }));
  const removeRow = (key, i) => setForm((f) => ({ ...f, [key]: f[key].filter((_, idx) => idx !== i) }));

  const onFiles = async (e) => {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    try {
      const res = await upload({ files }).unwrap();
      set('images', [...form.images, ...res.images]);
      toast.success(`${res.images.length} image(s) uploaded`);
    } catch (err) {
      toast.error(errorMessage(err, 'Upload failed'));
    }
  };

  const addImageUrl = () => {
    if (!/^https?:\/\//.test(imageUrl)) {
      toast.error('Enter a valid image URL');
      return;
    }
    set('images', [...form.images, { url: imageUrl }]);
    setImageUrl('');
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.images.length) {
      toast.error('Add at least one image');
      return;
    }
    const payload = {
      title: form.title,
      description: form.description,
      brand: form.brand,
      category: form.category,
      images: form.images.map(({ url, publicId }) => ({ url, publicId })),
      highlights: form.highlights.split('\n').map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean),
      variants: form.variants.map((v) => ({
        ...(v._id ? { _id: v._id } : {}),
        sku: v.sku.trim(),
        color: v.color || undefined,
        colorHex: v.colorHex || undefined,
        ram: v.ram || undefined,
        storage: v.storage || undefined,
        price: Number(v.price),
        mrp: Number(v.mrp || v.price),
        stock: Number(v.stock || 0),
        images: v.images || [],
      })),
      specifications: form.specifications.filter((s) => s.key.trim() && s.value.trim()),
      warranty: { ...form.warranty, months: Number(form.warranty.months), extendedPrice: Number(form.warranty.extendedPrice || 0) },
      returnDays: Number(form.returnDays),
      emiAvailable: form.emiAvailable,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
    };
    try {
      if (isEdit) await update({ id, ...payload }).unwrap();
      else await create(payload).unwrap();
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <form onSubmit={submit} className="mx-auto max-w-5xl space-y-5">
      <Seo title={isEdit ? 'Edit product' : 'New product'} noIndex />
      <div className="flex items-center gap-3">
        <Link to="/admin/products" className="btn-ghost p-2" aria-label="Back"><FiArrowLeft /></Link>
        <h1 className="mr-auto text-2xl font-bold">{isEdit ? 'Edit product' : 'Add product'}</h1>
        <button type="submit" className="btn-primary" disabled={creating || updating}>
          {creating || updating ? 'Saving...' : 'Save product'}
        </button>
      </div>

      <Card title="Basic information">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="label" htmlFor="title">Title</label>
            <input id="title" className="input" required minLength={3} value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="brand">Brand</label>
            <select id="brand" className="input" required value={form.brand} onChange={(e) => set('brand', e.target.value)}>
              <option value="">Select brand</option>
              {brands?.items?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="category">Category</label>
            <select id="category" className="input" required value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select category</option>
              {cats?.items?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" className="input min-h-[110px]" value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="highlights">Highlights (one per line)</label>
            <textarea id="highlights" className="input min-h-[110px]" value={form.highlights} onChange={(e) => set('highlights', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="tags">Search tags (comma separated)</label>
            <input id="tags" className="input" value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="5g, gaming, camera phone" />
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} /> Featured</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.emiAvailable} onChange={(e) => set('emiAvailable', e.target.checked)} /> EMI available</label>
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Images"
        action={
          <label className="btn-outline btn-sm cursor-pointer">
            <FiUpload /> {uploading ? 'Uploading...' : 'Upload'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="hidden" onChange={onFiles} disabled={uploading} />
          </label>
        }
      >
        <div className="flex flex-wrap gap-3">
          {form.images.map((img, i) => (
            <div key={img.url + i} className="relative">
              <img src={img.url} alt="" className="h-24 w-24 rounded-lg border border-gray-200 object-contain dark:border-gray-700" />
              {i === 0 && <span className="badge absolute bottom-1 left-1 bg-brand-600 text-white">Main</span>}
              <button type="button" onClick={() => removeRow('images', i)} className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white" aria-label="Remove image">
                <FiTrash2 size={12} />
              </button>
            </div>
          ))}
          {!form.images.length && <p className="text-sm text-gray-500">No images yet. Upload (Cloudinary) or paste an image URL.</p>}
        </div>
        <div className="mt-3 flex gap-2">
          <input className="input" placeholder="https://... image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} aria-label="Image URL" />
          <button type="button" className="btn-outline" onClick={addImageUrl}>Add URL</button>
        </div>
      </Card>

      <Card title="Variants, price & stock" action={<button type="button" className="btn-outline btn-sm" onClick={() => addRow('variants', emptyVariant())}><FiPlus /> Variant</button>}>
        <div className="overflow-x-auto">
          <table className="table-base min-w-[860px]">
            <thead><tr><th>SKU</th><th>Color</th><th>Hex</th><th>RAM</th><th>Storage</th><th>Price</th><th>MRP</th><th>Stock</th><th /></tr></thead>
            <tbody>
              {form.variants.map((v, i) => (
                <tr key={v._id || i}>
                  <td><input className="input px-2 py-1.5" required value={v.sku} onChange={(e) => setRow('variants', i, 'sku', e.target.value)} aria-label="SKU" /></td>
                  <td><input className="input px-2 py-1.5" value={v.color || ''} onChange={(e) => setRow('variants', i, 'color', e.target.value)} aria-label="Color" /></td>
                  <td><input type="color" className="h-9 w-12 rounded" value={v.colorHex || '#000000'} onChange={(e) => setRow('variants', i, 'colorHex', e.target.value)} aria-label="Color hex" /></td>
                  <td><input className="input px-2 py-1.5" placeholder="8 GB" value={v.ram || ''} onChange={(e) => setRow('variants', i, 'ram', e.target.value)} aria-label="RAM" /></td>
                  <td><input className="input px-2 py-1.5" placeholder="128 GB" value={v.storage || ''} onChange={(e) => setRow('variants', i, 'storage', e.target.value)} aria-label="Storage" /></td>
                  <td><input type="number" min="0" required className="input px-2 py-1.5" value={v.price} onChange={(e) => setRow('variants', i, 'price', e.target.value)} aria-label="Price" /></td>
                  <td><input type="number" min="0" className="input px-2 py-1.5" value={v.mrp} onChange={(e) => setRow('variants', i, 'mrp', e.target.value)} aria-label="MRP" /></td>
                  <td><input type="number" min="0" required className="input w-20 px-2 py-1.5" value={v.stock} onChange={(e) => setRow('variants', i, 'stock', e.target.value)} aria-label="Stock" /></td>
                  <td>
                    <button type="button" className="btn-ghost p-1.5 text-red-600" disabled={form.variants.length === 1} onClick={() => removeRow('variants', i)} aria-label="Remove variant"><FiTrash2 /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-gray-500">Listing price and total stock are derived from variants automatically. Use spec keys <b>Battery Capacity</b> and <b>Screen Size</b> to power the storefront filters.</p>
      </Card>

      <Card title="Specifications" action={<button type="button" className="btn-outline btn-sm" onClick={() => addRow('specifications', emptySpec())}><FiPlus /> Row</button>}>
        <div className="space-y-2">
          {form.specifications.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1.5fr_auto] gap-2">
              <input className="input px-2 py-1.5" placeholder="Group (Display)" value={s.group} onChange={(e) => setRow('specifications', i, 'group', e.target.value)} aria-label="Spec group" />
              <input className="input px-2 py-1.5" placeholder="Key (Screen Size)" value={s.key} onChange={(e) => setRow('specifications', i, 'key', e.target.value)} aria-label="Spec key" />
              <input className="input px-2 py-1.5" placeholder="Value (6.7 inch)" value={s.value} onChange={(e) => setRow('specifications', i, 'value', e.target.value)} aria-label="Spec value" />
              <button type="button" className="btn-ghost p-1.5 text-red-600" onClick={() => removeRow('specifications', i)} aria-label="Remove spec"><FiTrash2 /></button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Warranty & returns">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="label" htmlFor="wm">Warranty (months)</label>
            <input id="wm" type="number" min="0" className="input" value={form.warranty.months} onChange={(e) => set('warranty', { ...form.warranty, months: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="wt">Warranty type</label>
            <input id="wt" className="input" value={form.warranty.type} onChange={(e) => set('warranty', { ...form.warranty, type: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="rd">Return window (days)</label>
            <input id="rd" type="number" min="0" className="input" value={form.returnDays} onChange={(e) => set('returnDays', e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="ep">Extended warranty price</label>
            <input id="ep" type="number" min="0" className="input" value={form.warranty.extendedPrice} disabled={!form.warranty.extendedAvailable} onChange={(e) => set('warranty', { ...form.warranty, extendedPrice: e.target.value })} />
            <label className="mt-1 flex items-center gap-2 text-xs">
              <input type="checkbox" checked={form.warranty.extendedAvailable} onChange={(e) => set('warranty', { ...form.warranty, extendedAvailable: e.target.checked })} /> Offer extended warranty
            </label>
          </div>
        </div>
      </Card>
    </form>
  );
}
