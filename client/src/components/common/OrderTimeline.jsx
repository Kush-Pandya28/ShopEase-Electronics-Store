import { FiCheck, FiX } from 'react-icons/fi';
import { ORDER_FLOW } from '../../utils/constants';
import { formatDateTime, statusLabel } from '../../utils/format';

/** Vertical status timeline: Placed -> Confirmed -> Packed -> Shipped -> Out for delivery -> Delivered */
export default function OrderTimeline({ order }) {
  const history = order.statusHistory || [];
  const dateOf = (status) => history.filter((h) => h.status === status).pop()?.date;
  const terminal = ['cancelled', 'returned'].includes(order.status) ? order.status : null;
  const reachedIndex = ORDER_FLOW.reduce((max, s, i) => (dateOf(s) ? i : max), 0);
  const steps = terminal ? [...ORDER_FLOW.slice(0, reachedIndex + 1), terminal] : ORDER_FLOW;
  const currentIndex = terminal ? steps.length - 1 : ORDER_FLOW.indexOf(order.status);

  return (
    <ol className="relative space-y-6 pl-2">
      {steps.map((s, i) => {
        const done = i <= currentIndex;
        const isBad = s === 'cancelled' || s === 'returned';
        return (
          <li key={s} className="relative flex gap-4">
            {i < steps.length - 1 && (
              <span className={`absolute left-[13px] top-7 h-[calc(100%+0.5rem)] w-0.5 ${i < currentIndex ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} aria-hidden="true" />
            )}
            <span
              className={`z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                isBad ? 'bg-red-500' : done ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-700'
              }`}
            >
              {isBad ? <FiX size={14} /> : done ? <FiCheck size={14} /> : null}
            </span>
            <div>
              <p className={`text-sm font-semibold ${done ? '' : 'text-gray-400'}`}>{statusLabel(s)}</p>
              {dateOf(s) && <p className="text-xs text-gray-500">{formatDateTime(dateOf(s))}</p>}
              {history.filter((h) => h.status === s).pop()?.note && done && (
                <p className="text-xs text-gray-500">{history.filter((h) => h.status === s).pop().note}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
