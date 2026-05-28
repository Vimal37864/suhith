import React from 'react';
import { cn } from './Sidebar';

export function RiskBadge({ level }: { level: string }) {
  const getStyles = () => {
    if (level.includes('High')) {
      return 'text-red-500 bg-red-50';
    } else if (level.includes('Medium')) {
      return 'text-orange-500 bg-orange-50';
    } else {
      return 'text-green-500 bg-green-50';
    }
  };

  return (
    <span className={cn("px-2 py-1 rounded-md text-xs font-semibold whitespace-nowrap", getStyles())}>
      {level}
    </span>
  );
}

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  title: string;
  columns: Column<T>[];
  data: T[];
}

export function DataTable<T>({ title, columns, data }: DataTableProps<T>) {
  return (
    <div className="dashboard-card flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 font-semibold text-slate-800">
        {title}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              {columns.map((col, i) => (
                <th key={i} className="px-5 py-3 text-xs font-bold text-slate-700">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-5 py-3 text-sm text-slate-600 font-medium">
                    {col.accessor(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
