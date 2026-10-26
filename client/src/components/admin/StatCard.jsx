export default function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
        <Icon size={22} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <p className="text-xl font-bold">{value}</p>
        {hint && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    </div>
  );
}
