import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { FiUser, FiMapPin, FiLock, FiStar, FiPackage, FiHeart, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import Seo from '../components/common/Seo';
import Loader from '../components/common/Loader';
import AddressForm from '../components/common/AddressForm';
import { Stars } from '../components/common/Rating';
import {
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
} from '../services/userApi';
import { useGetMyReviewsQuery, useDeleteMyReviewMutation } from '../services/orderApi';
import { passwordRule } from './Register';
import { errorMessage, formatDate } from '../utils/format';

const TABS = [
  { id: 'info', label: 'Personal info', icon: FiUser },
  { id: 'addresses', label: 'Addresses', icon: FiMapPin },
  { id: 'password', label: 'Change password', icon: FiLock },
  { id: 'reviews', label: 'My reviews', icon: FiStar },
];

function PersonalInfo({ user }) {
  const [updateMe, { isLoading }] = useUpdateMeMutation();
  const schema = z.object({
    name: z.string().trim().min(2, 'Name is required'),
    phone: z.string().trim().regex(/^([6-9]\d{9})?$/, 'Enter a valid 10 digit mobile number'),
  });
  const { register, handleSubmit, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: user.name, phone: user.phone || '' },
  });
  const onSubmit = async (values) => {
    try {
      await updateMe(values).unwrap();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-lg gap-4" noValidate>
      <div>
        <label htmlFor="name" className="label">Full name</label>
        <input id="name" className="input" {...register('name')} />
        {errors.name && <p className="field-error">{errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" className="input bg-gray-50 dark:bg-gray-800" value={user.email} disabled />
        <p className="mt-1 text-xs text-gray-500">{user.isVerified ? 'Verified email' : 'Email not verified yet - check your inbox'}</p>
      </div>
      <div>
        <label htmlFor="phone" className="label">Mobile number</label>
        <input id="phone" className="input" inputMode="numeric" maxLength={10} {...register('phone')} />
        {errors.phone && <p className="field-error">{errors.phone.message}</p>}
      </div>
      <button type="submit" className="btn-primary w-fit" disabled={isLoading || !isDirty}>
        {isLoading ? 'Saving...' : 'Save changes'}
      </button>
    </form>
  );
}

function Addresses({ addresses }) {
  const [editing, setEditing] = useState(null); // null | 'new' | address
  const [add, { isLoading: adding }] = useAddAddressMutation();
  const [update, { isLoading: updating }] = useUpdateAddressMutation();
  const [remove] = useDeleteAddressMutation();

  const save = async (values) => {
    try {
      if (editing === 'new') await add(values).unwrap();
      else await update({ id: editing._id, ...values }).unwrap();
      toast.success('Address saved');
      setEditing(null);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const act = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (editing) {
    return (
      <div>
        <h3 className="mb-4 font-semibold">{editing === 'new' ? 'Add new address' : 'Edit address'}</h3>
        <AddressForm defaultValues={editing === 'new' ? {} : editing} onSubmit={save} onCancel={() => setEditing(null)} submitting={adding || updating} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button type="button" className="btn-outline btn-sm" onClick={() => setEditing('new')}><FiPlus /> Add new address</button>
      {!addresses.length && <p className="text-sm text-gray-500">No saved addresses yet.</p>}
      <div className="grid gap-3 md:grid-cols-2">
        {addresses.map((a) => (
          <div key={a._id} className="rounded-lg border border-gray-200 p-4 text-sm dark:border-gray-800">
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">
                {a.fullName} {a.isDefault && <span className="badge ml-1 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-200">Default</span>}
              </p>
              <div className="flex gap-1">
                <button type="button" className="btn-ghost p-1.5" onClick={() => setEditing(a)} aria-label="Edit address"><FiEdit2 /></button>
                <button type="button" className="btn-ghost p-1.5 text-red-600" onClick={() => window.confirm('Delete this address?') && act(() => remove(a._id).unwrap(), 'Address deleted')} aria-label="Delete address"><FiTrash2 /></button>
              </div>
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-400">{a.street}{a.landmark ? `, ${a.landmark}` : ''}, {a.city}, {a.state} - {a.pincode}</p>
            <p className="text-gray-600 dark:text-gray-400">Phone: {a.phone}</p>
            {!a.isDefault && (
              <button type="button" className="mt-2 text-xs font-semibold text-brand-600" onClick={() => act(() => update({ id: a._id, isDefault: true }).unwrap(), 'Default address updated')}>
                Set as default
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangePassword() {
  const [change, { isLoading }] = useChangePasswordMutation();
  const schema = z
    .object({ currentPassword: z.string().min(1, 'Required'), newPassword: passwordRule, confirm: z.string() })
    .refine((d) => d.newPassword === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const onSubmit = async ({ currentPassword, newPassword }) => {
    try {
      await change({ currentPassword, newPassword }).unwrap();
      toast.success('Password changed');
      reset();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };
  const field = (name, label) => (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} type="password" className="input" {...register(name)} />
      {errors[name] && <p className="field-error">{errors[name].message}</p>}
    </div>
  );
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-md gap-4" noValidate>
      {field('currentPassword', 'Current password')}
      {field('newPassword', 'New password')}
      {field('confirm', 'Confirm new password')}
      <button type="submit" className="btn-primary w-fit" disabled={isLoading}>{isLoading ? 'Updating...' : 'Update password'}</button>
    </form>
  );
}

function MyReviews() {
  const { data, isLoading } = useGetMyReviewsQuery();
  const [remove] = useDeleteMyReviewMutation();
  if (isLoading) return <Loader />;
  if (!data?.reviews?.length) return <p className="text-sm text-gray-500">You have not reviewed any products yet. Delivered orders can be reviewed from the product page.</p>;
  return (
    <div className="space-y-3">
      {data.reviews.map((r) => (
        <div key={r._id} className="flex gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-800">
          <img src={r.product?.images?.[0]?.url} alt="" className="h-14 w-14 rounded object-contain" />
          <div className="min-w-0 flex-1">
            <Link to={`/product/${r.product?.slug}`} className="font-medium hover:text-brand-600">{r.product?.title}</Link>
            <div className="flex items-center gap-2"><Stars value={r.rating} /> <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span></div>
            {r.title && <p className="font-semibold">{r.title}</p>}
            <p className="text-gray-600 dark:text-gray-400">{r.comment}</p>
          </div>
          <button
            type="button"
            className="btn-ghost h-fit p-1.5 text-red-600"
            aria-label="Delete review"
            onClick={async () => {
              if (!window.confirm('Delete this review?')) return;
              try {
                await remove({ id: r._id, productId: r.product?._id }).unwrap();
                toast.success('Review deleted');
              } catch (err) {
                toast.error(errorMessage(err));
              }
            }}
          >
            <FiTrash2 />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Profile() {
  const { data, isLoading } = useGetMeQuery();
  const [tab, setTab] = useState('info');
  if (isLoading || !data) return <Loader full />;
  const { user } = data;

  return (
    <div className="container-x max-w-5xl py-6">
      <Seo title="My profile" noIndex />
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          <div className="card flex items-center gap-3 p-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-lg font-bold text-brand-700 dark:bg-brand-900 dark:text-brand-200">
              {user.name[0]}
            </span>
            <div className="min-w-0">
              <p className="text-xs text-gray-500">Hello,</p>
              <p className="truncate font-semibold">{user.name}</p>
            </div>
          </div>
          <nav className="card p-2" aria-label="Profile sections">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${tab === id ? 'bg-brand-50 font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-200' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
              >
                <Icon /> {label}
              </button>
            ))}
            <Link to="/orders" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><FiPackage /> My orders</Link>
            <Link to="/wishlist" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800"><FiHeart /> Wishlist</Link>
          </nav>
        </aside>
        <section className="card p-4 sm:p-6">
          <h1 className="mb-5 text-lg font-bold">{TABS.find((t) => t.id === tab).label}</h1>
          {tab === 'info' && <PersonalInfo user={user} />}
          {tab === 'addresses' && <Addresses addresses={user.addresses || []} />}
          {tab === 'password' && <ChangePassword />}
          {tab === 'reviews' && <MyReviews />}
        </section>
      </div>
    </div>
  );
}
