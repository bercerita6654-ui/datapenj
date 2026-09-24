import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Edit2,
  Trash2,
  ArrowUpDown,
  Check,
  X,
  Calendar,
  AlertCircle,
  Zap,
  Package,
  PenTool,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { SheetHeaderConfig, SheetRow } from '../types/sheets';
import { parseNumericValue, formatNumberLocale, formatNumberInput } from '../services/sheets';
import {
  detectTransactionCategory,
  TRANSACTION_THEMES,
  TransactionType,
} from '../utils/transactionColors';
import { filterRowsByMonth, MonthOption } from '../utils/monthHelper';

interface DataTableProps {
  rows: SheetRow[];
  headers: SheetHeaderConfig;
  selectedMonthKey: string;
  availableMonths: MonthOption[];
  onSelectMonth: (key: string) => void;
  isLoading: boolean;
  onEditRow: (row: SheetRow) => void;
  onDeleteRow: (row: SheetRow) => void;
  onQuickSaveRow: (
    rowIndex: number,
    values: {
      col2: string;
      col3: string;
      col4: string;
      col5: string;
      col6: string;
      col7: string;
    }
  ) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  rows,
  headers,
  selectedMonthKey,
  availableMonths,
  onSelectMonth,
  isLoading,
  onEditRow,
  onDeleteRow,
  onQuickSaveRow,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'instan' | 'reguler' | 'manual'>('all');

  // Inline editing state
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [inlineValues, setInlineValues] = useState<{
    col2: string;
    col3: string;
    col4: string;
    col5: string;
    col6: string;
    col7: string;
  }>({
    col2: '',
    col3: '',
    col4: '',
    col5: '',
    col6: '',
    col7: '',
  });

  // Categorize columns
  const colConfigs = useMemo(() => {
    return [
      { num: 2, key: 'col2' as const, name: headers.col2Name, category: detectTransactionCategory(headers.col2Name, 2) },
      { num: 3, key: 'col3' as const, name: headers.col3Name, category: detectTransactionCategory(headers.col3Name, 3) },
      { num: 4, key: 'col4' as const, name: headers.col4Name, category: detectTransactionCategory(headers.col4Name, 4) },
      { num: 5, key: 'col5' as const, name: headers.col5Name, category: detectTransactionCategory(headers.col5Name, 5) },
      { num: 6, key: 'col6' as const, name: headers.col6Name, category: detectTransactionCategory(headers.col6Name, 6) },
      { num: 7, key: 'col7' as const, name: headers.col7Name, category: detectTransactionCategory(headers.col7Name, 7) },
    ];
  }, [headers]);

  // Step 1: Filter rows by Active Month
  const activeMonthRows = useMemo(() => {
    return filterRowsByMonth(rows, selectedMonthKey);
  }, [rows, selectedMonthKey]);

  // Step 2: Filter by Search, Category Filter, and Sort Order
  const filteredRows = useMemo(() => {
    return activeMonthRows
      .filter((row) => {
        const matchesSearch =
          searchTerm === '' ||
          row.dateRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.col2.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.col3.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.col4.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.col5.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.col6.toLowerCase().includes(searchTerm.toLowerCase()) ||
          row.col7.toLowerCase().includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (categoryFilter === 'all') return true;

        const matchingCols = colConfigs.filter((c) => c.category === categoryFilter);
        if (matchingCols.length > 0) {
          return matchingCols.some((c) => {
            const val = row[c.key];
            return val && val.trim() !== '' && val !== '0' && val !== '-';
          });
        }

        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'asc') {
          return a.rowIndex - b.rowIndex;
        } else {
          return b.rowIndex - a.rowIndex;
        }
      });
  }, [activeMonthRows, searchTerm, categoryFilter, sortOrder, colConfigs]);

  const activeMonthOption = availableMonths.find((m) => m.key === selectedMonthKey);
  const activeMonthLabel = selectedMonthKey === 'all' ? 'Semua Periode' : (activeMonthOption?.label || 'Bulan Aktif');

  // Start inline edit
  const handleStartInlineEdit = (row: SheetRow) => {
    setEditingRowIndex(row.rowIndex);
    setInlineValues({
      col2: row.col2,
      col3: row.col3,
      col4: row.col4,
      col5: row.col5,
      col6: row.col6,
      col7: row.col7,
    });
  };

  const handleCancelInlineEdit = () => {
    setEditingRowIndex(null);
  };

  const handleSaveInlineEdit = (rowIndex: number) => {
    onQuickSaveRow(rowIndex, inlineValues);
    setEditingRowIndex(null);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvHeader = [
      `"${headers.col1Name}"`,
      `"${headers.col2Name}"`,
      `"${headers.col3Name}"`,
      `"${headers.col4Name}"`,
      `"${headers.col5Name}"`,
      `"${headers.col6Name}"`,
      `"${headers.col7Name}"`,
    ].join(',');

    const csvRows = filteredRows.map((r) =>
      [
        `"${r.dateRef.replace(/"/g, '""')}"`,
        `"${r.col2.replace(/"/g, '""')}"`,
        `"${r.col3.replace(/"/g, '""')}"`,
        `"${r.col4.replace(/"/g, '""')}"`,
        `"${r.col5.replace(/"/g, '""')}"`,
        `"${r.col6.replace(/"/g, '""')}"`,
        `"${r.col7.replace(/"/g, '""')}"`,
      ].join(',')
    );

    const blob = new Blob([[csvHeader, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `penjualan_${activeMonthLabel.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute column totals for visible filtered rows
  const columnSums = useMemo(() => {
    const sums = { col2: 0, col3: 0, col4: 0, col5: 0, col6: 0, col7: 0 };
    filteredRows.forEach((r) => {
      sums.col2 += parseNumericValue(r.col2);
      sums.col3 += parseNumericValue(r.col3);
      sums.col4 += parseNumericValue(r.col4);
      sums.col5 += parseNumericValue(r.col5);
      sums.col6 += parseNumericValue(r.col6);
      sums.col7 += parseNumericValue(r.col7);
    });
    return sums;
  }, [filteredRows]);

  const renderCategoryIcon = (category: TransactionType) => {
    if (category === 'instan') return <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
    if (category === 'reguler') return <Package className="w-3.5 h-3.5 text-sky-600 shrink-0" />;
    if (category === 'manual') return <PenTool className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
    return null;
  };

  const renderCellContent = (value: string, category: TransactionType) => {
    if (!value || value.trim() === '') return <span className="text-slate-300">-</span>;

    const lower = value.toLowerCase();
    let cellTheme = TRANSACTION_THEMES[category];

    if (lower.includes('instan')) {
      cellTheme = TRANSACTION_THEMES.instan;
    } else if (lower.includes('reguler')) {
      cellTheme = TRANSACTION_THEMES.reguler;
    } else if (lower.includes('manual')) {
      cellTheme = TRANSACTION_THEMES.manual;
    }

    if (cellTheme.type !== 'neutral') {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-semibold border ${cellTheme.badgeBg} ${cellTheme.badgeText} ${cellTheme.badgeBorder}`}
        >
          {cellTheme.type === 'instan' && <Zap className="w-3 h-3 text-amber-600" />}
          {cellTheme.type === 'reguler' && <Package className="w-3 h-3 text-sky-600" />}
          {cellTheme.type === 'manual' && <PenTool className="w-3 h-3 text-purple-600" />}
          <span className="truncate max-w-[130px]">{value}</span>
        </span>
      );
    }

    return <span className="truncate block max-w-[140px] font-mono text-slate-800">{value}</span>;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-0">
      {/* Active Month & Category Filter Controls */}
      <div className="p-4 bg-slate-50/90 border-b border-slate-200 space-y-3">
        {/* Row 1: Month Focus Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              Bulan Aktif:
            </span>
            <div className="relative inline-block">
              <select
                value={selectedMonthKey}
                onChange={(e) => onSelectMonth(e.target.value)}
                aria-label="Pilih Bulan Aktif untuk Tabel Data"
                className="text-xs font-extrabold text-emerald-800 bg-white hover:bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-1.5 pr-8 cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    🗓️ {m.label} ({m.count} baris)
                  </option>
                ))}
                <option value="all">📂 Semua Periode ({rows.length} baris)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Fokus: <strong className="text-emerald-700">{activeMonthLabel}</strong> • Menampilkan{' '}
            <strong className="text-slate-900">{filteredRows.length}</strong> dari {activeMonthRows.length} baris
          </div>
        </div>

        {/* Row 2: Category Filter Buttons per Bulan Aktif */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              Filter Kategori:
            </span>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  categoryFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua Kategori ({activeMonthLabel})
              </button>

              {/* Instan Pill */}
              <button
                onClick={() => setCategoryFilter('instan')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  categoryFilter === 'instan'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>TRANSAKSI INSTAN</span>
              </button>

              {/* Reguler Pill */}
              <button
                onClick={() => setCategoryFilter('reguler')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  categoryFilter === 'reguler'
                    ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                    : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                <span>TRANSAKSI REGULER</span>
              </button>

              {/* Manual Pill */}
              <button
                onClick={() => setCategoryFilter('manual')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  categoryFilter === 'manual'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>TRANSAKSI MANUAL</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table Toolbar */}
      <div className="p-3.5 border-b border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={`Cari data pada ${activeMonthLabel}...`}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 transition whitespace-nowrap"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
            <span>{sortOrder === 'desc' ? 'Terbaru di Atas' : 'Terlama di Atas'}</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredRows.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 hover:text-slate-900 transition disabled:opacity-40 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/90 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-3 w-14 text-center">#Baris</th>
              <th className="py-3 px-4 min-w-[140px] text-emerald-800 bg-emerald-50/70 border-r border-emerald-100">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="truncate">{headers.col1Name}</span>
                </div>
                <span className="text-[10px] lowercase text-emerald-600 font-normal">(Kolom 1 - Acuan)</span>
              </th>

              {/* Column Headers 2-7 with Distinct Color Themes in Light Mode */}
              {colConfigs.map((col) => {
                const theme = TRANSACTION_THEMES[col.category];
                return (
                  <th
                    key={col.num}
                    className={`py-3 px-3 min-w-[130px] border-t-2 ${
                      col.category === 'instan'
                        ? 'border-t-amber-500 bg-amber-50/60 text-amber-900'
                        : col.category === 'reguler'
                        ? 'border-t-sky-500 bg-sky-50/60 text-sky-900'
                        : col.category === 'manual'
                        ? 'border-t-purple-500 bg-purple-50/60 text-purple-900'
                        : 'border-t-slate-400 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      {renderCategoryIcon(col.category)}
                      <span className="truncate font-bold">{col.name}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${theme.badgeBg} ${theme.badgeText} border ${theme.badgeBorder}`}
                      >
                        {col.category === 'instan'
                          ? '⚡ INSTAN'
                          : col.category === 'reguler'
                          ? '📦 REGULER'
                          : col.category === 'manual'
                          ? '✍️ MANUAL'
                          : `KOLOM ${col.num}`}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">Col {String.fromCharCode(64 + col.num)}</span>
                    </div>
                  </th>
                );
              })}

              <th className="py-3 px-3 w-28 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-medium">Memuat data dari Google Sheet...</p>
                  </div>
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-16 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                    <p className="text-sm font-semibold text-slate-800">
                      Tidak ada data pada {activeMonthLabel}
                    </p>
                    <p className="text-xs text-slate-500">
                      Coba ganti filter kategori atau pilih bulan lain pada pemilih bulan di atas.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredRows.map((row) => {
                const isInlineEditing = editingRowIndex === row.rowIndex;

                return (
                  <tr
                    key={row.rowIndex}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isInlineEditing ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    {/* Row Index in Sheet */}
                    <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                        #{row.rowIndex}
                      </span>
                    </td>

                    {/* Column 1: Date Reference */}
                    <td className="py-2.5 px-4 font-semibold text-slate-900 bg-emerald-50/30 border-r border-emerald-100/60 whitespace-nowrap">
                      {row.dateRef || <span className="text-slate-400 italic">(Tanpa tanggal)</span>}
                    </td>

                    {/* Columns 2-7 with Category Color Accents */}
                    {colConfigs.map((col) => {
                      const isInstan = col.category === 'instan';
                      const isReguler = col.category === 'reguler';
                      const isManual = col.category === 'manual';

                      return (
                        <td
                          key={col.num}
                          className={`py-2 px-3 ${
                            isInstan
                              ? 'bg-amber-50/20'
                              : isReguler
                              ? 'bg-sky-50/20'
                              : isManual
                              ? 'bg-purple-50/20'
                              : ''
                          }`}
                        >
                          {isInlineEditing ? (
                            <input
                              type="text"
                              value={inlineValues[col.key]}
                              onChange={(e) =>
                                setInlineValues({ ...inlineValues, [col.key]: formatNumberInput(e.target.value) })
                              }
                              className={`w-full bg-white border rounded px-2 py-1 text-xs text-slate-900 focus:outline-none ${
                                isInstan
                                  ? 'border-amber-500'
                                  : isReguler
                                  ? 'border-sky-500'
                                  : isManual
                                  ? 'border-purple-500'
                                  : 'border-indigo-500'
                              }`}
                            />
                          ) : (
                            renderCellContent(row[col.key], col.category)
                          )}
                        </td>
                      );
                    })}

                    {/* Actions Column */}
                    <td className="py-2 px-3 text-right">
                      {isInlineEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleSaveInlineEdit(row.rowIndex)}
                            title="Simpan Perubahan ke Sheet"
                            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelInlineEdit}
                            title="Batal"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleStartInlineEdit(row)}
                            title="Edit Langsung di Baris"
                            className="hidden sm:inline-flex p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 border border-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onEditRow(row)}
                            title="Buka Form Edit"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 border border-slate-200 transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteRow(row)}
                            title="Kosongkan Baris di Sheet"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-500 border border-slate-200 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>

          {/* Table Summary Footer for Active Month */}
          {filteredRows.length > 0 && (
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-[11px]">
                <td className="py-3 px-3 text-center text-slate-400 font-mono">Total</td>
                <td className="py-3 px-4 text-emerald-800 bg-emerald-50/70 border-r border-emerald-100 font-bold">
                  {filteredRows.length} Hari ({activeMonthLabel})
                </td>
                {colConfigs.map((col) => {
                  const sum = columnSums[col.key];
                  const textColor =
                    col.category === 'instan'
                      ? 'text-amber-800'
                      : col.category === 'reguler'
                      ? 'text-sky-800'
                      : col.category === 'manual'
                      ? 'text-purple-800'
                      : 'text-indigo-800';

                  return (
                    <td key={col.num} className={`py-3 px-3 font-mono font-bold ${textColor}`}>
                      {sum > 0 ? formatNumberLocale(sum) : '-'}
                    </td>
                  );
                })}
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};
