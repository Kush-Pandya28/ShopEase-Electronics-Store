import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { INDIAN_STATES } from '../../utils/constants';

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required'),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10 digit mobile number'),
  street: z.string().trim().min(5, 'Enter house no., building and street'),
  landmark: z.string().trim().optional(),
  city: z.string().trim().min(2, 'City is required'),
  state: z.string().min(2, 'Select a state'),
  pincode: z.string().trim().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  isDefault: z.boolean().optional(),
});

export default function AddressForm({ defaultValues, onSubmit, onCancel, submitting }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: { fullName: '', phone: '', street: '', landmark: '', city: '', state: '', pincode: '', isDefault: false, ...defaultValues },
  });

  const field = (name, label, props = {}) => (
    <div>
      <label htmlFor={`addr-${name}`} className="label">{label}</label>
      <input id={`addr-${name}`} className="input" {...register(name)} {...props} />
      {errors[name] && <p className="field-error">{errors[name].message}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-2" noValidate>
      {field('fullName', 'Full name', { autoComplete: 'name' })}
      {field('phone', 'Mobile number', { inputMode: 'numeric', maxLength: 10, autoComplete: 'tel' })}
      <div className="sm:col-span-2">{field('street', 'Address (house no., building, street, area)', { autoComplete: 'street-address' })}</div>
      {field('landmark', 'Landmark (optional)')}
      {field('pincode', 'Pincode', { inputMode: 'numeric', maxLength: 6, autoComplete: 'postal-code' })}
      {field('city', 'City', { autoComplete: 'address-level2' })}
      <div>
        <label htmlFor="addr-state" className="label">State</label>
        <select id="addr-state" className="input" {...register('state')}>
          <option value="">Select state</option>
          {INDIAN_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {errors.state && <p className="field-error">{errors.state.message}</p>}
      </div>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <input type="checkbox" className="rounded text-brand-600" {...register('isDefault')} /> Make this my default address
      </label>
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save address'}
        </button>
        {onCancel && (
          <button type="button" className="btn-outline" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
