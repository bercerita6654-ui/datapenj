import React, { useMemo, useState } from 'react';
import {
  TrendingUp,
  BarChart2,
  Calendar,
  Zap,
  Package,
  PenTool,
  ArrowUpRight,
  PieChart,
  ChevronDown,
} from 'lucide-react';
import { SheetHeaderConfig, SheetRow } from '../types/sheets';
import { parseNumericValue, formatIndonesianCurrency, formatNumberLocale } from '../services/sheets';
import {
  detectTransactionCategory,
  TRANSACTION_THEMES,
} from '../utils/transactionColors';
import { filterRowsByMonth, MonthOption } from '../utils/monthHelper';

interface AnalyticsViewProps {
  rows: SheetRow[];
  headers: SheetHeaderConfig;
  selectedMonthKey: string;
  availableMonths: MonthOption[];
  onSelectMonth: (key: string) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  rows,
  headers,
  selectedMonthKey,
  availableMonths,
  onSelectMonth,
}) => {
  const [selectedColumnKey, setSelectedColumnKey] = useState<
    'col2' | 'col3' | 'col4' | 'col5' | 'col6' | 'col7'
  >('col2');

  const colOptions = useMemo(() => {
    return [
      { key: 'col2' as const, num: 2, label: headers.col2Name, category: detectTransactionCategory(headers.col2Name, 2) },
      { key: 'col3' as const, num: 3, label: headers.col3Name, category: detectTransactionCategory(headers.col3Name, 3) },
      { key: 'col4' as const, num: 4, label: headers.col4Name, category: detectTransactionCategory(headers.col4Name, 4) },
      { key: 'col5' as const, num: 5, label: headers.col5Name, category: detectTransactionCategory(headers.col5Name, 5) },
      { key: 'col6' as const, num: 6, label: headers.col6Name, category: detectTransactionCategory(headers.col6Name, 6) },
      { key: 'col7' as const, num: 7, label: headers.col7Name, category: detectTransactionCategory(headers.col7Name, 7) },
    ];
  }, [headers]);

  // Filter rows for the active month
  const activeMonthRows = useMemo(() => {
    return filterRowsByMonth(rows, selectedMonthKey);
  }, [rows, selectedMonthKey]);

  const activeMonthOption = availableMonths.find((m) => m.key === selectedMonthKey);
  const activeMonthLabel = selectedMonthKey === 'all' ? 'Semua Periode' : (activeMonthOption?.label || 'Bulan Aktif');

  // Aggregate totals by category for active month
  const categorySummary = useMemo(() => {
    let instan = 0;
    let reguler = 0;
    let manual = 0;

    activeMonthRows.forEach((row) => {
      colOptions.forEach((col) => {
        const val = parseNumericValue(row[col.key]);
        if (col.category === 'instan') instan += val;
        else if (col.category === 'reguler') reguler += val;
        else if (col.category === 'manual') manual += val;
      });
    });

    const total = instan + reguler + manual;
    const instanPct = total > 0 ? Math.round((instan / total) * 100) : 0;
    const regulerPct = total > 0 ? Math.round((reguler / total) * 100) : 0;
    const manualPct = total > 0 ? Math.round((manual / total) * 100) : 0;

    return { instan, reguler, manual, total, instanPct, regulerPct, manualPct };
  }, [activeMonthRows, colOptions]);

  // Chart data for currently selected column within active month
  const chartData = useMemo(() => {
    const sorted = [...activeMonthRows].sort((a, b) => a.rowIndex - b.rowIndex);
    return sorted.map((row) => ({
      date: row.dateRef || `Baris #${row.rowIndex}`,
      value: parseNumericValue(row[selectedColumnKey]),
      rawValue: row[selectedColumnKey],
      rowIndex: row.rowIndex,
    }));
  }, [activeMonthRows, selectedColumnKey]);

  const activeColConfig = colOptions.find((c) => c.key === selectedColumnKey);
  const activeCategory = activeColConfig ? activeColConfig.category : 'neutral';
  const activeTheme = TRANSACTION_THEMES[activeCategory];

  const nonZeroData = chartData.filter((d) => d.value > 0);
  const maxValue = Math.max(...chartData.map((d) => d.value), 1);
  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const avgValue = chartData.length > 0 ? Math.round(totalValue / chartData.length) : 0;

  const highestDay = useMemo(() => {
    if (nonZeroData.length === 0) return null;
    return nonZeroData.reduce((prev, curr) => (curr.value > prev.value ? curr : prev), nonZeroData[0]);
  }, [nonZeroData]);

  return (
    <div className="space-y-6">
      {/* Month Selection Bar for Analytics */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fokus Analisis Periode:
              </span>
              <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                {activeMonthLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grafik dan perbandingan kategori di bawah menampilkan data bulan <strong>{activeMonthLabel}</strong>.
            </p>
          </div>
        </div>

        {availableMonths.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">Pilih Bulan:</span>
            <div className="relative inline-block">
              <select
                value={selectedMonthKey}
                onChange={(e) => onSelectMonth(e.target.value)}
                aria-label="Pilih Bulan Analisis"
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 pr-8 cursor-pointer appearance-none focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition shadow-xs"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} ({m.count} hari)
                  </option>
                ))}
                <option value="all">Semua Bulan</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Category Distribution Comparison Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              Komparasi Kategori ({activeMonthLabel})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Perbandingan proporsi nilai antara Instan, Reguler, dan Manual pada bulan aktif
            </p>
          </div>
          <div className="text-xs font-mono text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
            Total {activeMonthLabel}: <strong className="text-emerald-700">{formatIndonesianCurrency(categorySummary.total)}</strong>
          </div>
        </div>

        {/* Multi-segment progress bar */}
        <div className="h-4 rounded-full bg-slate-100 overflow-hidden flex p-0.5 border border-slate-200">
          {categorySummary.instanPct > 0 && (
            <div
              style={{ width: `${categorySummary.instanPct}%` }}
              className="h-full bg-amber-500 rounded-l-full transition-all duration-500"
              title={`Instan: ${categorySummary.instanPct}%`}
            />
          )}
          {categorySummary.regulerPct > 0 && (
            <div
              style={{ width: `${categorySummary.regulerPct}%` }}
              className="h-full bg-sky-500 transition-all duration-500"
              title={`Reguler: ${categorySummary.regulerPct}%`}
            />
          )}
          {categorySummary.manualPct > 0 && (
            <div
              style={{ width: `${categorySummary.manualPct}%` }}
              className="h-full bg-purple-500 rounded-r-full transition-all duration-500"
              title={`Manual: ${categorySummary.manualPct}%`}
            />
          )}
        </div>

        {/* 3 Category Detail Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
          {/* Instan */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-800">TRANSAKSI INSTAN</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5 font-mono">
                  {formatIndonesianCurrency(categorySummary.instan)}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-mono">
              {categorySummary.instanPct}%
            </span>
          </div>

          {/* Reguler */}
          <div className="p-4 rounded-xl bg-sky-50/70 border border-sky-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-sky-100 text-sky-700">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-sky-800">TRANSAKSI REGULER</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5 font-mono">
                  {formatIndonesianCurrency(categorySummary.reguler)}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 font-mono">
              {categorySummary.regulerPct}%
            </span>
          </div>

          {/* Manual */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-purple-800">TRANSAKSI MANUAL</div>
                <div className="text-sm font-extrabold text-slate-900 mt-0.5 font-mono">
                  {formatIndonesianCurrency(categorySummary.manual)}
                </div>
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-300 font-mono">
              {categorySummary.manualPct}%
            </span>
          </div>
        </div>
      </div>

      {/* Column Specific Trends & Interactive Chart */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-indigo-600" />
              Grafik Tren Harian per Kolom ({activeMonthLabel})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih kolom untuk melihat pergerakan angka dari hari ke hari pada {activeMonthLabel}
            </p>
          </div>

          {/* Column Selector Pills with Color Accents */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {colOptions.map((opt) => {
              const isSelected = selectedColumnKey === opt.key;
              const isInstan = opt.category === 'instan';
              const isReguler = opt.category === 'reguler';
              const isManual = opt.category === 'manual';

              return (
                <button
                  key={opt.key}
                  onClick={() => setSelectedColumnKey(opt.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap border ${
                    isSelected
                      ? isInstan
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : isReguler
                        ? 'bg-sky-600 text-white border-sky-700 shadow-xs'
                        : isManual
                        ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                        : 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                      : isInstan
                      ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                      : isReguler
                      ? 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                      : isManual
                      ? 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {isInstan && <Zap className="w-3 h-3" />}
                  {isReguler && <Package className="w-3 h-3" />}
                  {isManual && <PenTool className="w-3 h-3" />}
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Column Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold uppercase">Total Nilai ({activeMonthLabel})</span>
            <div className={`text-lg font-bold font-mono mt-1 ${activeTheme.badgeText}`}>
              {totalValue > 0 ? formatIndonesianCurrency(totalValue) : '0'}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold uppercase">Rata-Rata</span>
            <div className="text-lg font-bold font-mono text-slate-900 mt-1">
              {avgValue > 0 ? formatIndonesianCurrency(avgValue) : '0'}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] text-slate-500 font-semibold uppercase">Tertinggi</span>
            <div className="text-lg font-bold font-mono text-emerald-700 mt-1 truncate">
              {highestDay ? formatIndonesianCurrency(highestDay.value) : '-'}
            </div>
          </div>
        </div>

        {/* Visual Bars Container */}
        {chartData.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Belum ada data pada bulan {activeMonthLabel} untuk ditampilkan dalam grafik
          </div>
        ) : (
          <div className="space-y-3">
            <div className="h-64 flex items-end gap-2 pt-6 pb-2 px-2 overflow-x-auto border-b border-slate-200">
              {chartData.map((item, idx) => {
                const heightPercent = maxValue > 0 ? Math.max((item.value / maxValue) * 100, 4) : 4;
                const isHighest = highestDay && item.rowIndex === highestDay.rowIndex;

                return (
                  <div
                    key={idx}
                    className="flex-1 min-w-[36px] max-w-[56px] flex flex-col items-center gap-2 group relative h-full justify-end"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[11px] rounded-lg px-2.5 py-1 opacity-0 group-hover:opacity-100 transition pointer-events-none whitespace-nowrap z-20 shadow-xl">
                      <div className="font-bold text-amber-300">
                        {item.value > 0 ? formatIndonesianCurrency(item.value) : item.rawValue || '0'}
                      </div>
                      <div className="text-[10px] text-slate-300">{item.date}</div>
                    </div>

                    {/* Bar with Category Colors */}
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-300 ${
                        isHighest
                          ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-md ring-1 ring-emerald-400'
                          : item.value > 0
                          ? `bg-gradient-to-t ${activeTheme.barGradient}`
                          : 'bg-slate-200'
                      }`}
                    />

                    {/* Date label */}
                    <div className="text-[10px] text-slate-500 truncate max-w-full text-center">
                      {item.date.slice(0, 5)}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 px-2">
              <span>← Tanggal Terlama</span>
              <span>Tanggal Terbaru →</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
