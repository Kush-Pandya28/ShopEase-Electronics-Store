import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import Seo from '../../components/common/Seo';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { useGetCouponsQuery, useCreateCouponMutation, useUpdateCouponMutation, useDeleteCouponMutation } from '../../services/adminApi';
import { formatPrice, formatDate, errorMessage } from '../../utils/format';

const blank = { code: '', description: '', type: 'percent', value: 10, minOrderValue: 0, maxDiscount: 0, expiresAt: '', usageLimit: 0, isActive: true };

export default function AdminCoupons() {
  const { data, isLoading } = useGetCouponsQuery();
  const [create, { isLoading: creating }] = useCreateCouponMutation();
  const [update, { isLoading: updating }] = useUpdateCouponMutation();
  const [remove] = useDeleteCouponMutation();
  const [editing, setEditing] = useState(null);

  const open = (c) =>
    setEditing(c ? { ...blank, ...c, expiresAt: c.expiresAt?.slice(0, 10) } : { ...blank, expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10) });
  const set = (k, v) => setEditing((e) => ({ ...e, [k]: v }));

  const save = async (e) => {
    e.preventDefault();
    const body = {
      code: editing.code.toUpperCase(),
      description: editing.description,
      type: editing.type,
      value: Number(editing.value),
      minOrderValue: Number(editing.minOrderValue),
      maxDiscount: Number(editing.maxDiscount),
      usageLimit: Number(editing.usageLimit),
      expiresAt: new Date(`${editing.expiresAt}T23:59:59`).toISOString(),
      isActive: editing.isActive,
    };
    try {
      if (editing._id) await update({ id: editing._id, ...body }).unwrap();
      else await create(body).unwrap();
      toast.success('Coupon saved');
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const onDelete = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}?`)) return;
    try {
      await remove(c._id).unwrap();
      toast.success('Coupon deleted');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const num = (k, label, props = {}) => (
    <div>
      <label className="label" htmlFor={`c-${k}`}>{label}</label>
      <input id={`c-${k}`} type="number" min="0" className="input" value={editing[k]} onChange={(e) => set(k, e.target.value)} {...props} />
    </div>
  );

  return (
    <div>
      <Seo title="Coupons" noIndex />
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <button type="button" className="btn-primary" onClick={() => open(null)}><FiPlus /> New coupon</button>
      </div>
      {isLoading ? <Loader /> : (
        <div className="card overflow-x-auto">
          <table className="table-base">
            <thead><tr><th>Code</th><th>Discount</th><th>Min order</th><th>Expires</th><th>Usage</th><th>Status</th><th /></tr></thead>
            <tbody>
              {data.coupons.map((c) => {
                const expired = new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c._id}>
                    <td><p className="font-bold">{c.code}</p><p className="text-xs text-gray-500">{c.description}</p></td>
                    <td className="whitespace-nowrap">{c.type === 'percent' ? `${c.value}%${c.maxDiscount ? ` (max ${formatPrice(c.maxDiscount)})` : ''}` : formatPrice(c.value)}</td>
                    <td>{formatPrice(c.minOrderValue)}</td>
                    <td className={`whitespace-nowrap ${expired ? 'text-red-600' : ''}`}>{formatDate(c.expiresAt)}</td>
                    <td>{c.usedCount} / {c.usageLimit || '∞'}</td>
                    <td><span className={`badge ${c.isActive && !expired ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{expired ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}</span></td>
                    <td className="whitespace-nowrap text-right">
                      <button type="button" className="btn-ghost p-1.5" onClick={() => open(c)} aria-label="Edit"><FiEdit2 /></button>
                      <button type="button" className="btn-ghost p-1.5 text-red-600" onClick={() => onDelete(c)} aria-label="Delete"><FiTrash2 /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!data.coupons.length && <p className="p-6 text-center text-sm text-gray-500">No coupons yet.</p>}
        </div>
      )}

      <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editing?._id ? 'Edit coupon' : 'New coupon'}>
        {editing && (
          <form onSubmit={save} className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="c-code">Code</label>
              <input id="c-code" required pattern="[A-Za-z0-9_\-]{3,20}" className="input uppercase" value={editing.code} onChange={(e) => set('code', e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="c-type">Type</label>
              <select id="c-type" className="input" value={editing.type} onChange={(e) => set('type', e.target.value)}>
                <option value="percent">Percent</option>
                <option value="flat">Flat amount</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-desc">Description</label>
              <input id="c-desc" className="input" value={editing.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            {num('value', editing.type === 'percent' ? 'Discount %' : 'Discount (Rs.)', { required: true, max: editing.type === 'percent' ? 100 : undefined })}
            {num('maxDiscount', 'Max discount (0 = no cap)', { disabled: editing.type === 'flat' })}
            {num('minOrderValue', 'Minimum order value')}
            {num('usageLimit', 'Usage limit (0 = unlimited)')}
            <div>
              <label className="label" htmlFor="c-exp">Expires on</label>
              <input id="c-exp" type="date" required className="input" value={editing.expiresAt} onChange={(e) => set('expiresAt', e.target.value)} />
            </div>
            <label className="flex items-center gap-2 self-end pb-3 text-sm">
              <input type="checkbox" checked={editing.isActive} onChange={(e) => set('isActive', e.target.checked)} /> Active
            </label>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-outline" onClick={() => setEditing(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={creating || updating}>Save</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
