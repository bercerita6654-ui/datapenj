import React, { useMemo } from 'react';
import {
  CalendarCheck,
  Zap,
  Package,
  PenTool,
  Clock,
  Sparkles,
  Calendar,
  ChevronDown,
  Calculator,
  TrendingUp,
} from 'lucide-react';
import { SheetHeaderConfig, SheetRow } from '../types/sheets';
import { parseNumericValue, formatIndonesianCurrency, formatNumberLocale } from '../services/sheets';
import { detectTransactionCategory, detectColumnValueType } from '../utils/transactionColors';
import { filterRowsByMonth, MonthOption } from '../utils/monthHelper';

interface StatsCardsProps {
  rows: SheetRow[];
  headers: SheetHeaderConfig;
  selectedMonthKey: string;
  availableMonths: MonthOption[];
  onSelectMonth: (key: string) => void;
  onOpenNewEntry: () => void;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  rows,
  headers,
  selectedMonthKey,
  availableMonths,
  onSelectMonth,
  onOpenNewEntry,
}) => {
  // Rows filtered by active month
  const activeMonthRows = useMemo(() => {
    return filterRowsByMonth(rows, selectedMonthKey);
  }, [rows, selectedMonthKey]);

  const activeMonthOption = availableMonths.find((m) => m.key === selectedMonthKey);
  const activeMonthLabel = selectedMonthKey === 'all' ? 'Semua Periode' : (activeMonthOption?.label || 'Bulan Aktif');

  const totalRowsInActiveMonth = activeMonthRows.length;

  const todayISO = new Date().toISOString().split('T')[0];
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  const isTodayRecorded = rows.some(
    (r) =>
      r.dateRef.toLowerCase().includes(todayISO) ||
      r.dateRef.toLowerCase().includes(todayFormatted.toLowerCase()) ||
      r.dateRef.toLowerCase().includes('hari ini')
  );

  // Group totals by Transaction Category (Instan, Reguler, Manual) for the ACTIVE MONTH
  // Strictly separating Nominal (Rp) and Qty (Transaksi)
  const stats = useMemo(() => {
    let instanNominal = 0;
    let regulerNominal = 0;
    let manualNominal = 0;
    let instanTrx = 0;
    let regulerTrx = 0;
    let manualTrx = 0;

    const colCategories = [
      { key: 'col2' as const, cat: detectTransactionCategory(headers.col2Name, 2), type: detectColumnValueType(headers.col2Name, 2) },
      { key: 'col3' as const, cat: detectTransactionCategory(headers.col3Name, 3), type: detectColumnValueType(headers.col3Name, 3) },
      { key: 'col4' as const, cat: detectTransactionCategory(headers.col4Name, 4), type: detectColumnValueType(headers.col4Name, 4) },
      { key: 'col5' as const, cat: detectTransactionCategory(headers.col5Name, 5), type: detectColumnValueType(headers.col5Name, 5) },
      { key: 'col6' as const, cat: detectTransactionCategory(headers.col6Name, 6), type: detectColumnValueType(headers.col6Name, 6) },
      { key: 'col7' as const, cat: detectTransactionCategory(headers.col7Name, 7), type: detectColumnValueType(headers.col7Name, 7) },
    ];

    activeMonthRows.forEach((row) => {
      colCategories.forEach(({ key, cat, type }) => {
        const val = parseNumericValue(row[key]);

        if (type === 'nominal') {
          if (cat === 'instan') instanNominal += val;
          else if (cat === 'reguler') regulerNominal += val;
          else if (cat === 'manual') manualNominal += val;
        } else {
          // Qty (Jumlah Transaksi)
          if (cat === 'instan') instanTrx += val;
          else if (cat === 'reguler') regulerTrx += val;
          else if (cat === 'manual') manualTrx += val;
        }
      });
    });

    const grandTotalNominal = instanNominal + regulerNominal + manualNominal;
    const grandTotalTransaksi = instanTrx + regulerTrx + manualTrx;

    return {
      instanNominal,
      regulerNominal,
      manualNominal,
      instanTrx,
      regulerTrx,
      manualTrx,
      grandTotalNominal,
      grandTotalTransaksi,
    };
  }, [activeMonthRows, headers]);

  return (
    <div className="space-y-4">
      {/* Active Month Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fokus Periode:
              </span>
              <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                {activeMonthLabel}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Data &amp; filter kategori disaring khusus untuk <strong>{activeMonthLabel}</strong> ({totalRowsInActiveMonth} hari tercatat).
            </p>
          </div>
        </div>

        {/* Month Selector dropdown */}
        {availableMonths.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 hidden sm:inline">Pilih Bulan:</span>
            <div className="relative inline-block">
              <select
                value={selectedMonthKey}
                onChange={(e) => onSelectMonth(e.target.value)}
                aria-label="Pilih Bulan Aktif"
                className="text-xs font-bold text-slate-800 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl px-3 py-2 pr-8 cursor-pointer appearance-none focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition shadow-xs"
              >
                {availableMonths.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.label} ({m.count} hari)
                  </option>
                ))}
                <option value="all">Semua Bulan / Semua Data</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {/* Grand Total Overview Banner */}
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
            <Calculator className="w-7 h-7" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              TOTAL NOMINAL KESELURUHAN ({activeMonthLabel})
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400 mt-0.5">
              {formatIndonesianCurrency(stats.grandTotalNominal)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex flex-wrap items-center gap-1 mt-0.5">
              <span className="text-amber-300 font-semibold">{formatIndonesianCurrency(stats.instanNominal)}</span>
              <span className="text-slate-500">+</span>
              <span className="text-sky-300 font-semibold">{formatIndonesianCurrency(stats.regulerNominal)}</span>
              <span className="text-slate-500">+</span>
              <span className="text-purple-300 font-semibold">{formatIndonesianCurrency(stats.manualNominal)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 justify-between md:justify-end">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TOTAL TRANSAKSI (QTY)
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-white">
              {stats.grandTotalTransaksi}{' '}
              <span className="text-xs font-normal text-slate-400">Transaksi</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
              <span className="text-amber-300 font-semibold">{stats.instanTrx}</span>
              <span className="text-slate-500">+</span>
              <span className="text-sky-300 font-semibold">{stats.regulerTrx}</span>
              <span className="text-slate-500">+</span>
              <span className="text-purple-300 font-semibold">{stats.manualTrx}</span>
            </div>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              JUMLAH HARI
            </div>
            <div className="text-lg sm:text-xl font-bold font-mono text-emerald-300">
              {totalRowsInActiveMonth}{' '}
              <span className="text-xs font-normal text-slate-400">hari tercatat</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakout Cards (Instan, Reguler, Manual) for Active Month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: INSTAN (Kuning/Amber) */}
        <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              TOTAL INSTAN
            </span>
            <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate block">
              {formatIndonesianCurrency(stats.instanNominal)}
            </span>
          </div>
          <div className="mt-2 text-xs text-amber-800 flex items-center justify-between font-medium">
            <span className="font-semibold">{stats.instanTrx} Transaksi Instan (Qty)</span>
            <span className="text-slate-400">{activeMonthLabel}</span>
          </div>
        </div>

        {/* Card 2: REGULER (Biru/Sky) */}
        <div className="bg-white border-2 border-sky-300/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-4 h-4 text-sky-600" />
              TOTAL REGULER
            </span>
            <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-200">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate block">
              {formatIndonesianCurrency(stats.regulerNominal)}
            </span>
          </div>
          <div className="mt-2 text-xs text-sky-800 flex items-center justify-between font-medium">
            <span className="font-semibold">{stats.regulerTrx} Transaksi Reguler (Qty)</span>
            <span className="text-slate-400">{activeMonthLabel}</span>
          </div>
        </div>

        {/* Card 3: MANUAL (Ungu/Purple) */}
        <div className="bg-white border-2 border-purple-300/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
              <PenTool className="w-4 h-4 text-purple-600" />
              TOTAL MANUAL
            </span>
            <div className="p-2 rounded-xl bg-purple-100 text-purple-700 border border-purple-200">
              <PenTool className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 truncate block">
              {formatIndonesianCurrency(stats.manualNominal)}
            </span>
          </div>
          <div className="mt-2 text-xs text-purple-800 flex items-center justify-between font-medium">
            <span className="font-semibold">{stats.manualTrx} Transaksi Manual (Qty)</span>
            <span className="text-slate-400">{activeMonthLabel}</span>
          </div>
        </div>
      </div>

      {/* Secondary Quick Info Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Total Hari */}
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Hari Tercatat ({activeMonthLabel})</div>
              <div className="text-base sm:text-lg font-bold text-slate-900">
                {formatNumberLocale(totalRowsInActiveMonth)}{' '}
                <span className="text-xs text-slate-500 font-normal">
                  hari (total sheet: {formatNumberLocale(rows.length)} hari)
                </span>
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md border border-slate-200">
            Kolom 1 Acuan
          </div>
        </div>

        {/* Status Hari Ini */}
        <div
          className={`border rounded-xl p-3.5 flex items-center justify-between shadow-xs ${
            isTodayRecorded
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg border ${
                isTodayRecorded
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200'
              }`}
            >
              {isTodayRecorded ? <Sparkles className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
            </div>
            <div>
              <div className="text-xs text-slate-500">Status Hari Ini ({todayFormatted})</div>
              <div className="text-sm font-bold">
                {isTodayRecorded ? 'Sudah Tercatat di Sheet' : 'Belum Diisi Hari Ini'}
              </div>
            </div>
          </div>

          {!isTodayRecorded && (
            <button
              onClick={onOpenNewEntry}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-xs"
            >
              Isi Sekarang
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
