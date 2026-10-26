export const groupSpecs = (specs = []) =>
  specs.reduce((acc, s) => {
    const g = s.group || 'General';
    (acc[g] ||= []).push(s);
    return acc;
  }, {});

export default function SpecsTable({ specifications = [] }) {
  const groups = groupSpecs(specifications);
  if (!specifications.length) return <p className="text-sm text-gray-500">Specifications not available.</p>;
  return (
    <div className="space-y-5">
      {Object.entries(groups).map(([group, rows]) => (
        <div key={group}>
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">{group}</h3>
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.key} className="border-b border-gray-100 dark:border-gray-800">
                  <th scope="row" className="w-2/5 py-2 pr-4 text-left font-normal text-gray-500">
                    {r.key}
                  </th>
                  <td className="py-2 font-medium">{r.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
