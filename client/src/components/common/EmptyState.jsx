import { Link } from 'react-router-dom';

export default function EmptyState({ icon: Icon, title, message, actionLabel, actionTo = '/products' }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-brand-50 p-5 text-brand-600 dark:bg-brand-900/30">
          <Icon size={36} />
        </div>
      )}
      <h2 className="text-lg font-bold">{title}</h2>
      {message && <p className="mt-1 max-w-md text-sm text-gray-500">{message}</p>}
      {actionLabel && (
        <Link to={actionTo} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
