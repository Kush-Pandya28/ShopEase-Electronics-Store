import { useSelector } from 'react-redux';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatPrice } from '../../utils/format';

const compact = (n) => (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${Math.round(n / 1000)}k` : n);

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs shadow-md dark:border-gray-700 dark:bg-gray-900">
      <p className="font-semibold">{label}</p>
      <p className="text-gray-700 dark:text-gray-300">Revenue: {formatPrice(d.revenue)}</p>
      <p className="text-gray-500">Orders: {d.orders}</p>
    </div>
  );
}

/** Single-series revenue trend. Orders are shown in the tooltip instead of a second axis. */
export default function RevenueChart({ data = [] }) {
  const dark = useSelector((s) => s.ui.theme === 'dark');
  const stroke = dark ? '#818cf8' : '#4f46e5';
  const grid = dark ? '#1f2937' : '#eef0f3';
  const axis = dark ? '#9ca3af' : '#6b7280';

  if (!data.length) return <p className="py-16 text-center text-sm text-gray-500">No sales in this period yet.</p>;

  return (
    <div className="h-72" role="img" aria-label="Revenue over time">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.25} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={grid} vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis tickFormatter={compact} tick={{ fontSize: 11, fill: axis }} tickLine={false} axisLine={false} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: axis, strokeDasharray: '3 3' }} />
          <Area type="monotone" dataKey="revenue" stroke={stroke} strokeWidth={2} fill="url(#rev)" activeDot={{ r: 5, strokeWidth: 2, stroke: dark ? '#111827' : '#fff' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
