import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiX } from 'react-icons/fi';
import { removeFromCompare, clearCompare } from '../../features/compare/compareSlice';

/** Floating tray showing products picked for comparison. */
export default function CompareBar() {
  const items = useSelector((s) => s.compare.items);
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  if (!items.length || pathname === '/compare') return null;

  return (
    <>
      {/* Spacer so the fixed bar never covers the end of the page */}
      <div className="h-16" aria-hidden="true" />
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 shadow-lg backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
        <div className="container-x flex items-center gap-3 py-2">
          <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
            {items.map((p) => (
              <div
                key={p._id}
                className="relative flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 py-1 pl-1 pr-6 dark:border-gray-700"
              >
                <img src={p.image} alt="" className="h-9 w-9 rounded object-cover" />
                <span className="max-w-[8rem] truncate text-xs">{p.title}</span>
                <button
                  type="button"
                  className="absolute right-1 top-1 text-gray-400 hover:text-red-500"
                  onClick={() => dispatch(removeFromCompare(p._id))}
                  aria-label={`Remove ${p.title} from compare`}
                >
                  <FiX size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn-ghost btn-sm hidden sm:inline-flex"
            onClick={() => dispatch(clearCompare())}
          >
            Clear
          </button>
          <Link
            to="/compare"
            className={`btn-primary btn-sm ${items.length < 2 ? 'pointer-events-none opacity-50' : ''}`}
            aria-disabled={items.length < 2}
          >
            Compare ({items.length})
          </Link>
        </div>
      </div>
    </>
  );
}
