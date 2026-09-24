import React, { useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Zap,
  Package,
  PenTool,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  Clock,
  Edit2,
  CalendarCheck,
} from 'lucide-react';
import { SheetHeaderConfig, SheetRow } from '../types/sheets';
import {
  parseNumericValue,
  formatIndonesianCurrency,
  formatNumberLocale,
} from '../services/sheets';
import { detectTransactionCategory, detectColumnValueType } from '../utils/transactionColors';
import { MonthOption, extractMonthYear } from '../utils/monthHelper';

interface CalendarViewProps {
  rows: SheetRow[];
  headers: SheetHeaderConfig;
  selectedMonthKey: string;
  availableMonths: MonthOption[];
  onSelectMonth: (key: string) => void;
  onOpenDateEntry: (isoDate: string) => void;
  onOpenNewEntry: () => void;
}

interface DayData {
  dayNumber: number;
  isoDate: string;
  formattedDate: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  matchingRow?: SheetRow;
  totalNominal: number;
  totalTransaksi: number;
  instanNominal: number;
  regulerNominal: number;
  manualNominal: number;
  instanCount: number;
  regulerCount: number;
  manualCount: number;
}

const INDO_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const WEEKDAY_NAMES = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  rows,
  headers,
  selectedMonthKey,
  availableMonths,
  onSelectMonth,
  onOpenDateEntry,
  onOpenNewEntry,
}) => {
  // Determine year and monthIndex
  const activeMonthInfo = useMemo(() => {
    if (selectedMonthKey && selectedMonthKey !== 'all') {
      const parts = selectedMonthKey.split('-');
      if (parts.length === 2) {
        const year = parseInt(parts[0], 10);
        const monthIndex = parseInt(parts[1], 10) - 1;
        if (!isNaN(year) && !isNaN(monthIndex)) {
          return { year, monthIndex, label: `${INDO_MONTH_NAMES[monthIndex]} ${year}` };
        }
      }
    }
    // Default to current date
    const now = new Date();
    return {
      year: now.getFullYear(),
      monthIndex: now.getMonth(),
      label: `${INDO_MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`,
    };
  }, [selectedMonthKey]);

  const today = new Date();
  const todayISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
    today.getDate()
  ).padStart(2, '0')}`;

  // Helper to find matching row for a specific day
  const findRowForDay = (year: number, monthIndex: number, day: number): SheetRow | undefined => {
    const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayStr = String(day);
    const dayPadded = String(day).padStart(2, '0');
    const monthPadded = String(monthIndex + 1).padStart(2, '0');
    const monthName = INDO_MONTH_NAMES[monthIndex].toLowerCase();
    const dmy = `${dayPadded}/${monthPadded}/${year}`;
    const dmyShort = `${dayStr}/${monthPadded}/${year}`;
    const dmyDash = `${dayPadded}-${monthPadded}-${year}`;

    return rows.find((r) => {
      const ref = (r.dateRef || '').toLowerCase().trim();
      if (!ref) return false;
      if (ref.includes(iso)) return true;
      if (ref.includes(dmy) || ref.includes(dmyShort) || ref.includes(dmyDash)) return true;

      // Check if matches e.g. "24 September 2026"
      if (ref.includes(monthName) && (ref.includes(`${dayStr} `) || ref.includes(`${dayPadded} `) || ref.startsWith(`${dayStr} `) || ref.startsWith(`${dayPadded} `))) {
        // also check year if present
        if (!ref.includes(String(year))) {
          // If no year in ref, still match if month and day match
          const parsed = extractMonthYear(ref);
          if (parsed && parsed.monthIndex === monthIndex) return true;
        } else {
          return true;
        }
      }
      return false;
    });
  };

  // Generate calendar days grid (Monday-first)
  const calendarDays = useMemo(() => {
    const { year, monthIndex } = activeMonthInfo;
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    
    // First day of month: 0 (Sun) to 6 (Sat)
    const firstDayWeekday = new Date(year, monthIndex, 1).getDay();
    // Convert to Monday = 0 ... Sunday = 6
    const startingPadding = (firstDayWeekday + 6) % 7;

    const days: DayData[] = [];

    // Days in previous month for padding
    const prevMonthDays = new Date(year, monthIndex, 0).getDate();
    for (let i = startingPadding - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
      const prevYear = monthIndex === 0 ? year - 1 : year;
      const iso = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        isoDate: iso,
        formattedDate: `${d} ${INDO_MONTH_NAMES[prevMonth]} ${prevYear}`,
        isCurrentMonth: false,
        isToday: iso === todayISO,
        isPast: new Date(iso) < new Date(todayISO),
        totalNominal: 0,
        totalTransaksi: 0,
        instanNominal: 0,
        regulerNominal: 0,
        manualNominal: 0,
        instanCount: 0,
        regulerCount: 0,
        manualCount: 0,
      });
    }

    // Days in current active month
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const matchedRow = findRowForDay(year, monthIndex, d);

      let instanNominal = 0;
      let regulerNominal = 0;
      let manualNominal = 0;
      let instanCount = 0;
      let regulerCount = 0;
      let manualCount = 0;

      if (matchedRow) {
        const cols = [
          { val: matchedRow.col2, cat: detectTransactionCategory(headers.col2Name, 2), type: detectColumnValueType(headers.col2Name, 2) },
          { val: matchedRow.col3, cat: detectTransactionCategory(headers.col3Name, 3), type: detectColumnValueType(headers.col3Name, 3) },
          { val: matchedRow.col4, cat: detectTransactionCategory(headers.col4Name, 4), type: detectColumnValueType(headers.col4Name, 4) },
          { val: matchedRow.col5, cat: detectTransactionCategory(headers.col5Name, 5), type: detectColumnValueType(headers.col5Name, 5) },
          { val: matchedRow.col6, cat: detectTransactionCategory(headers.col6Name, 6), type: detectColumnValueType(headers.col6Name, 6) },
          { val: matchedRow.col7, cat: detectTransactionCategory(headers.col7Name, 7), type: detectColumnValueType(headers.col7Name, 7) },
        ];

        cols.forEach((col) => {
          const num = parseNumericValue(col.val);

          if (col.type === 'nominal') {
            if (col.cat === 'instan') instanNominal += num;
            else if (col.cat === 'reguler') regulerNominal += num;
            else if (col.cat === 'manual') manualNominal += num;
          } else {
            // Qty Transaksi
            if (col.cat === 'instan') instanCount += num;
            else if (col.cat === 'reguler') regulerCount += num;
            else if (col.cat === 'manual') manualCount += num;
          }
        });
      }

      // TOTAL NOMINAL = TOTAL INSTAN + TOTAL REGULER + TOTAL MANUAL
      const totalNominal = instanNominal + regulerNominal + manualNominal;
      // TOTAL TRANSAKSI = TRANSAKSI INSTAN + TRANSAKSI REGULER + TRANSAKSI MANUAL
      const totalTransaksi = instanCount + regulerCount + manualCount;

      days.push({
        dayNumber: d,
        isoDate: iso,
        formattedDate: `${d} ${INDO_MONTH_NAMES[monthIndex]} ${year}`,
        isCurrentMonth: true,
        isToday: iso === todayISO,
        isPast: new Date(iso) < new Date(todayISO),
        matchingRow: matchedRow,
        totalNominal,
        totalTransaksi,
        instanNominal,
        regulerNominal,
        manualNominal,
        instanCount,
        regulerCount,
        manualCount,
      });
    }

    // Padding for next month to complete 7-day rows (up to 35 or 42 total cells)
    const remainingPadding = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remainingPadding; d++) {
      const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
      const nextYear = monthIndex === 11 ? year + 1 : year;
      const iso = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNumber: d,
        isoDate: iso,
        formattedDate: `${d} ${INDO_MONTH_NAMES[nextMonth]} ${nextYear}`,
        isCurrentMonth: false,
        isToday: iso === todayISO,
        isPast: new Date(iso) < new Date(todayISO),
        totalNominal: 0,
        totalTransaksi: 0,
        instanNominal: 0,
        regulerNominal: 0,
        manualNominal: 0,
        instanCount: 0,
        regulerCount: 0,
        manualCount: 0,
      });
    }

    return days;
  }, [activeMonthInfo, rows, headers, todayISO]);

  // Aggregate stats for current calendar month
  const monthStats = useMemo(() => {
    let recordedDays = 0;
    let totalNominalMonth = 0;
    let totalTransaksiMonth = 0;

    calendarDays.forEach((day) => {
      if (day.isCurrentMonth && day.matchingRow) {
        recordedDays += 1;
        totalNominalMonth += day.totalNominal;
        totalTransaksiMonth += day.totalTransaksi;
      }
    });

    const averagePerRecordedDay = recordedDays > 0 ? totalNominalMonth / recordedDays : 0;

    return { recordedDays, totalNominalMonth, totalTransaksiMonth, averagePerRecordedDay };
  }, [calendarDays]);

  // Navigation handlers
  const handlePrevMonth = () => {
    const { year, monthIndex } = activeMonthInfo;
    const prevYear = monthIndex === 0 ? year - 1 : year;
    const prevMonth = monthIndex === 0 ? 12 : monthIndex;
    const key = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;
    onSelectMonth(key);
  };

  const handleNextMonth = () => {
    const { year, monthIndex } = activeMonthInfo;
    const nextYear = monthIndex === 11 ? year + 1 : year;
    const nextMonth = monthIndex === 11 ? 1 : monthIndex + 2;
    const key = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
    onSelectMonth(key);
  };

  const handleTodayMonth = () => {
    const now = new Date();
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    onSelectMonth(key);
  };

  return (
    <div className="space-y-4">
      {/* Calendar Control & Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Navigation & Title */}
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {activeMonthInfo.label}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                {monthStats.recordedDays} Hari Terisi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Klik pada tanggal manapun untuk <strong>Input Baru</strong> atau <strong>Edit Penjualan</strong>
            </p>
          </div>
        </div>

        {/* Navigation Buttons & Month Selector */}
        <div className="flex flex-wrap items-center gap-2 justify-between md:justify-end">
          <div className="flex items-center border border-slate-300 rounded-xl bg-slate-50 p-0.5 shadow-xs">
            <button
              onClick={handlePrevMonth}
              title="Bulan Sebelumnya"
              className="p-2 hover:bg-white hover:text-emerald-700 rounded-lg text-slate-600 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleTodayMonth}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-emerald-700 hover:bg-white rounded-lg transition"
            >
              Bulan Ini
            </button>
            <button
              onClick={handleNextMonth}
              title="Bulan Berikutnya"
              className="p-2 hover:bg-white hover:text-emerald-700 rounded-lg text-slate-600 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {availableMonths.length > 0 && (
            <select
              value={selectedMonthKey}
              onChange={(e) => onSelectMonth(e.target.value)}
              aria-label="Pilih Bulan Kalender"
              className="text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded-xl px-3 py-2 cursor-pointer shadow-xs focus:outline-none focus:border-emerald-600"
            >
              {availableMonths.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} ({m.count} data)
                </option>
              ))}
            </select>
          )}

          <button
            onClick={onOpenNewEntry}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Input Data</span>
          </button>
        </div>
      </div>

      {/* Month Quick Summary Mini-Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            TOTAL NOMINAL BULAN INI
          </div>
          <div className="text-base sm:text-lg font-extrabold font-mono text-emerald-700 mt-0.5 truncate">
            {formatIndonesianCurrency(monthStats.totalNominalMonth)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            TOTAL TRANSAKSI
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5">
            {monthStats.totalTransaksiMonth}{' '}
            <span className="text-xs font-normal text-slate-500">entri</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            HARI TERCATAT
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5 flex items-center gap-1">
            <CalendarCheck className="w-4 h-4 text-emerald-600" />
            <span>{monthStats.recordedDays} hari</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            RATA-RATA / HARI
          </div>
          <div className="text-base sm:text-lg font-bold font-mono text-slate-900 mt-0.5 truncate">
            {formatIndonesianCurrency(monthStats.averagePerRecordedDay)}
          </div>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        {/* Weekday Header (Senin - Minggu) */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center text-xs font-bold text-slate-700 py-3">
          {WEEKDAY_NAMES.map((name, idx) => {
            const isWeekend = idx >= 5;
            return (
              <div
                key={name}
                className={`flex flex-col items-center justify-center ${
                  isWeekend ? 'text-rose-600' : 'text-slate-700'
                }`}
              >
                <span className="hidden sm:inline">{name}</span>
                <span className="sm:hidden">{name.slice(0, 3)}</span>
              </div>
            );
          })}
        </div>

        {/* Calendar Matrix Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-200 bg-slate-100">
          {calendarDays.map((day, index) => {
            const hasData = !!day.matchingRow;
            const isToday = day.isToday;

            return (
              <div
                key={`${day.isoDate}-${index}`}
                onClick={() => onOpenDateEntry(day.isoDate)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onOpenDateEntry(day.isoDate);
                  }
                }}
                className={`min-h-[110px] sm:min-h-[135px] p-2 sm:p-2.5 transition-all flex flex-col justify-between cursor-pointer group relative ${
                  !day.isCurrentMonth
                    ? 'bg-slate-50/40 text-slate-400 hover:bg-slate-100'
                    : isToday
                    ? 'bg-emerald-50/40 hover:bg-emerald-50 border-2 border-emerald-400 z-10'
                    : hasData
                    ? 'bg-white hover:bg-emerald-50/30'
                    : 'bg-white hover:bg-slate-50'
                }`}
              >
                {/* Cell Header: Day Number & Status Badges */}
                <div className="flex items-start justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-sm sm:text-base font-extrabold flex items-center justify-center w-7 h-7 rounded-lg ${
                        isToday
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : hasData
                          ? 'bg-emerald-100 text-emerald-900 font-black'
                          : day.isCurrentMonth
                          ? 'text-slate-800 group-hover:text-emerald-700'
                          : 'text-slate-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {isToday && (
                      <span className="hidden sm:inline-block text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-600 text-white uppercase tracking-wider">
                        Hari Ini
                      </span>
                    )}
                  </div>

                  {hasData && (
                    <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      #{day.matchingRow?.rowIndex}
                    </span>
                  )}
                </div>

                {/* Cell Body: Data or Empty Placeholder */}
                <div className="my-1.5 space-y-1">
                  {hasData ? (
                    <div className="space-y-1">
                      {/* TOTAL NOMINAL for this day */}
                      <div className="bg-emerald-50/90 border border-emerald-200 rounded-lg p-1 sm:p-1.5">
                        <div className="text-[9px] font-bold uppercase tracking-wider text-emerald-800">
                          Total Nominal
                        </div>
                        <div className="text-xs sm:text-sm font-extrabold font-mono text-emerald-900 truncate">
                          {formatIndonesianCurrency(day.totalNominal)}
                        </div>
                      </div>

                      {/* TOTAL TRANSAKSI badge */}
                      <div className="flex items-center justify-between text-[10px] text-slate-600 px-1 font-medium">
                        <span className="flex items-center gap-1 font-bold text-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{day.totalTransaksi} Transaksi</span>
                        </span>
                      </div>

                      {/* Mini Category Badges */}
                      <div className="hidden sm:flex flex-wrap items-center gap-1 pt-0.5">
                        {day.instanNominal > 0 && (
                          <span
                            title={`⚡ Instan: ${formatIndonesianCurrency(day.instanNominal)}`}
                            className="text-[9px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold"
                          >
                            ⚡ {formatNumberLocale(day.instanNominal)}
                          </span>
                        )}
                        {day.regulerNominal > 0 && (
                          <span
                            title={`📦 Reguler: ${formatIndonesianCurrency(day.regulerNominal)}`}
                            className="text-[9px] px-1 py-0.2 rounded bg-sky-100 text-sky-900 border border-sky-300 font-bold"
                          >
                            📦 {formatNumberLocale(day.regulerNominal)}
                          </span>
                        )}
                        {day.manualNominal > 0 && (
                          <span
                            title={`✍️ Manual: ${formatIndonesianCurrency(day.manualNominal)}`}
                            className="text-[9px] px-1 py-0.2 rounded bg-purple-100 text-purple-900 border border-purple-300 font-bold"
                          >
                            ✍️ {formatNumberLocale(day.manualNominal)}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-2 sm:py-3 text-slate-300 group-hover:text-emerald-600 transition-colors">
                      <Plus className="w-4 h-4 mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-[10px] font-medium hidden sm:inline-block">
                        {day.isCurrentMonth ? 'Klik isi data' : ''}
                      </span>
                    </div>
                  )}
                </div>

                {/* Cell Footer: Hover action prompt */}
                <div className="text-[10px] text-emerald-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1 bg-white/90 rounded py-0.5 shadow-xs border border-emerald-200">
                  <Edit2 className="w-2.5 h-2.5" />
                  <span>{hasData ? 'Edit Data' : '+ Input'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Guide */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Petunjuk Kategori:
          </span>
          <span className="flex items-center gap-1 text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Zap className="w-3 h-3 text-amber-600" />
            ⚡ Instan (Kuning)
          </span>
          <span className="flex items-center gap-1 text-sky-800 font-semibold bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
            <Package className="w-3 h-3 text-sky-600" />
            📦 Reguler (Biru)
          </span>
          <span className="flex items-center gap-1 text-purple-800 font-semibold bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
            <PenTool className="w-3 h-3 text-purple-600" />
            ✍️ Manual (Ungu)
          </span>
        </div>

        <div className="text-slate-500">
          💡 Klik pada tanggal manapun di kalender untuk membuka pop up formulir isian.
        </div>
      </div>
    </div>
  );
};
