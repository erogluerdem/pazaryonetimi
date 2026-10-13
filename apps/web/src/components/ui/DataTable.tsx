'use client';

import React, { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  ArrowUpDown,
} from 'lucide-react';

export interface ColumnDef<TData> {
  id?: string;
  header: React.ReactNode | string;
  accessorKey?: keyof TData | string;
  accessor?: (row: TData) => any;
  cell?: (info: { row: TData; value: any }) => React.ReactNode;
  sortable?: boolean;
}

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
  title?: string;
  searchable?: boolean;
  exportable?: boolean;
  pagination?: boolean;
  pageSize?: number;
  onRowClick?: (row: TData) => void;
  bulkActions?: Array<{
    label: string;
    icon: React.ReactNode;
    onClick: (selectedRows: TData[]) => void;
  }>;
  emptyState?: React.ReactNode;
  loading?: boolean;
}

export function DataTable<TData extends Record<string, any>>({
  data,
  columns,
  title,
  searchable = true,
  exportable = true,
  pagination = true,
  pageSize = 10,
  onRowClick,
  bulkActions,
  emptyState,
  loading,
}: DataTableProps<TData>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const getCellValue = (row: TData, col: ColumnDef<TData>) => {
    if (col.accessor) return col.accessor(row);
    if (col.accessorKey) return row[col.accessorKey as string];
    if (col.id) return row[col.id];
    return '';
  };

  // Filtered rows
  const filteredData = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = getCellValue(row, col);
        if (val == null) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  // Sorted rows
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    const col = columns.find((c) => (c.id || c.accessorKey) === sortKey);
    if (!col) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = getCellValue(a, col);
      const valB = getCellValue(b, col);
      if (valA == null) return 1;
      if (valB == null) return -1;
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortOrder, columns]);

  // Paginated rows
  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const currentPageRows = useMemo(() => {
    if (!pagination) return sortedData;
    const start = page * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, page, pageSize, pagination]);

  const toggleSort = (colId: string) => {
    if (sortKey === colId) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(colId);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const all = new Set<number>();
      currentPageRows.forEach((_, idx) => all.add(idx));
      setSelectedIndices(all);
    } else {
      setSelectedIndices(new Set());
    }
  };

  const toggleSelectRow = (index: number) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelectedIndices(next);
  };

  const selectedRows = useMemo(() => {
    return Array.from(selectedIndices).map((i) => currentPageRows[i]).filter(Boolean);
  }, [selectedIndices, currentPageRows]);

  const exportData = () => {
    const headers = columns.map((col) => String(col.header || col.id || ''));
    const rows = sortedData.map((row) =>
      columns.map((col) => {
        const val = getCellValue(row, col);
        return typeof val === 'object' ? JSON.stringify(val) : `"${String(val ?? '').replace(/"/g, '""')}"`;
      })
    );

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'export'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="w-full h-64 flex items-center justify-center rounded-xl border border-border bg-card">
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <span className="text-xs font-medium text-muted-foreground">Veriler yükleniyor...</span>
        </div>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const allSelected =
    currentPageRows.length > 0 && selectedIndices.size === currentPageRows.length;

  return (
    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden transition-colors">
      {/* Table Toolbar Header */}
      <div className="p-4 border-b border-border/80 flex items-center justify-between flex-wrap gap-3">
        {title && (
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
        )}

        <div className="flex items-center gap-2.5 ml-auto flex-wrap">
          {searchable && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(0);
                }}
                placeholder="Tabloda ara..."
                className="pl-9 pr-3.5 py-1.5 bg-muted/40 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-48 sm:w-64"
              />
            </div>
          )}

          {bulkActions && selectedRows.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground">
                {selectedRows.length} seçili
              </span>
              {bulkActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => action.onClick(selectedRows)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary rounded-lg hover:opacity-95 transition-opacity shadow-xs"
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {exportable && (
            <button
              type="button"
              onClick={exportData}
              title="CSV Olarak İndir"
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border rounded-lg transition-colors"
            >
              <Download className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground border-b border-border/80">
            <tr>
              {bulkActions && (
                <th className="px-3.5 py-2.5 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/20 size-4 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => {
                const colId = String(col.id || col.accessorKey || idx);
                const isSorted = sortKey === colId;
                return (
                  <th
                    key={colId}
                    className="px-3.5 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.sortable !== false ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(colId)}
                        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer select-none font-medium"
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="size-3.5 text-primary" />
                          ) : (
                            <ChevronDown className="size-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3 text-muted-foreground/50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {currentPageRows.map((row, rowIdx) => {
              const isSelected = selectedIndices.has(rowIdx);
              return (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick?.(row)}
                  className={`transition-colors hover:bg-muted/40 ${
                    onRowClick ? 'cursor-pointer' : ''
                  } ${isSelected ? 'bg-muted/30' : ''}`}
                >
                  {bulkActions && (
                    <td className="px-3.5 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(rowIdx)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded border-border text-primary focus:ring-primary/20 size-4 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col, colIdx) => {
                    const val = getCellValue(row, col);
                    return (
                      <td
                        key={String(col.id || col.accessorKey || colIdx)}
                        className="px-3.5 py-3 text-foreground text-sm whitespace-nowrap"
                      >
                        {col.cell ? col.cell({ row, value: val }) : String(val ?? '')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {currentPageRows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + (bulkActions ? 1 : 0)}
                  className="py-10 text-center text-xs text-muted-foreground"
                >
                  Sonuç bulunamadı
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && (
        <div className="px-4 py-3 border-t border-border/80 flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>
              Sayfa {page + 1} / {totalPages}
            </span>
            <span>({sortedData.length} kayıt)</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage(0)}
              disabled={page === 0}
              className="p-1.5 rounded-md border border-border bg-card hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-md border border-border bg-card hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-md border border-border bg-card hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPage(totalPages - 1)}
              disabled={page >= totalPages - 1}
              className="p-1.5 rounded-md border border-border bg-card hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronsRight className="size-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
