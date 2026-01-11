const Table = ({ children, className = "" }) => (
  <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
    <table className={`min-w-full text-sm ${className}`}>
      {children}
    </table>
  </div>
);

export const THead = ({ children }) => (
  <thead className="bg-slate-50 text-slate-700">
    {children}
  </thead>
);

export const TBody = ({ children }) => (
  <tbody className="divide-y">
    {children}
  </tbody>
);

export const TR = ({ children }) => (
  <tr className="hover:bg-slate-50 transition">
    {children}
  </tr>
);

export const TH = ({ children, className = "" }) => (
  <th className={`px-4 py-3 text-left font-semibold ${className}`}>
    {children}
  </th>
);

export const TD = ({ children, className = "" }) => (
  <td className={`px-4 py-3 ${className}`}>
    {children}
  </td>
);

export default Table;
