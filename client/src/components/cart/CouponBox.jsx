import { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiTag, FiX } from 'react-icons/fi';
import { useGetAvailableCouponsQuery } from '../../services/productApi';
import { formatPrice } from '../../utils/format';

export default function CouponBox({ coupon, couponError, onApply, onRemove, applying }) {
  const user = useSelector((s) => s.auth.user);
  const [code, setCode] = useState('');
  const [showList, setShowList] = useState(false);
  const { data } = useGetAvailableCouponsQuery(undefined, { skip: !showList });

  const apply = async (value) => {
    if (!value.trim()) return;
    if (await onApply(value.trim())) {
      setCode('');
      setShowList(false);
    }
  };

  return (
    <div className="card p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
        <FiTag /> Coupons
      </p>
      {coupon ? (
        <div className="flex items-center justify-between rounded-lg border border-green-300 bg-green-50 px-3 py-2 text-sm dark:border-green-800 dark:bg-green-900/20">
          <span>
            <b>{coupon.code}</b> applied - you save {formatPrice(coupon.discount)}
          </span>
          <button type="button" onClick={onRemove} className="p-1 text-gray-500 hover:text-red-600" aria-label="Remove coupon">
            <FiX />
          </button>
        </div>
      ) : (
        <>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              apply(code);
            }}
          >
            <input
              className="input uppercase"
              placeholder={user ? 'Enter coupon code' : 'Login to use coupons'}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={!user}
              aria-label="Coupon code"
            />
            <button type="submit" className="btn-outline" disabled={!user || applying || !code.trim()}>
              Apply
            </button>
          </form>
          {couponError && (
            <p className="field-error">
              {couponError}{' '}
              <button type="button" className="underline" onClick={onRemove}>
                Remove
              </button>
            </p>
          )}
          {user && (
            <button type="button" className="mt-2 text-xs font-semibold text-brand-600" onClick={() => setShowList((s) => !s)}>
              {showList ? 'Hide offers' : 'View available offers'}
            </button>
          )}
          {showList && (
            <ul className="mt-2 space-y-2">
              {data?.coupons?.map((c) => (
                <li key={c._id} className="flex items-center justify-between gap-2 rounded-lg border border-dashed border-brand-300 p-2 text-xs">
                  <span>
                    <b className="text-brand-700 dark:text-brand-300">{c.code}</b> - {c.description}
                  </span>
                  <button type="button" className="btn-primary btn-sm" onClick={() => apply(c.code)}>
                    Apply
                  </button>
                </li>
              ))}
              {data && !data.coupons?.length && <li className="text-xs text-gray-500">No offers right now.</li>}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
