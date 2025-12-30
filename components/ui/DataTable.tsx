'use client';

import { ReactNode, useState } from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => ReactNode);
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  className?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  className = '',
  emptyMessage = 'No data available',
  isLoading = false,
  selectable = false,
  onSelectionChange,
}: DataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const toggleRow = (id: string) => {
    const updated = selectedRows.includes(id)
      ? selectedRows.filter((x) => x !== id)
      : [...selectedRows, id];

    setSelectedRows(updated);
    onSelectionChange?.(updated);
  };

  const toggleAll = () => {
    if (selectedRows.length === data.length) {
      setSelectedRows([]);
      onSelectionChange?.([]);
    } else {
      const allIds = data.map((row) => String(row.id));
      setSelectedRows(allIds);
      onSelectionChange?.(allIds);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto -mx-4 sm:mx-0 ${className}`}>
      <div className="inline-block min-w-full align-middle">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {selectable && (
                <th className="px-3 sm:px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === data.length}
                    onChange={toggleAll}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
              )}

              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    column.hideOnMobile ? 'hidden md:table-cell' : ''
                  } ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((row, rowIndex) => {
              const id = String(row.id);

              return (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 transition-colors ${
                    selectedRows.includes(id) ? 'bg-blue-50' : ''
                  }`}
                >
                  {selectable && (
                    <td className="px-3 sm:px-4 py-3 sm:py-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(id)}
                        onChange={() => toggleRow(id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                  )}

                  {columns.map((column, colIndex) => {
                    const value =
                      typeof column.accessor === 'function'
                        ? column.accessor(row)
                        : row[column.accessor];

                    return (
                      <td
                        key={colIndex}
                        className={`px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900 ${
                          column.hideOnMobile ? 'hidden md:table-cell' : ''
                        } ${column.className || ''}`}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
