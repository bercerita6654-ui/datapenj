import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Calendar, Sparkles, Zap, Package, PenTool, Calculator, CheckCircle2, RotateCcw } from 'lucide-react';
import { SheetHeaderConfig, SheetRow } from '../types/sheets';
import { formatNumberInput, parseNumericValue, formatIndonesianCurrency } from '../services/sheets';
import { detectTransactionCategory, detectColumnValueType, TRANSACTION_THEMES } from '../utils/transactionColors';
import { parseIndonesianDateToISO, getTodayISO, formatDateID } from '../utils/monthHelper';
import { getIndonesianHoliday } from '../utils/holidays';

interface DailyEntryModalProps {
  isOpen: boolean;
  headers: SheetHeaderConfig;
  rows?: SheetRow[];
  existingRows?: SheetRow[];
  initialIsoDate?: string;
  onClose: () => void;
  onSubmit: (data: {
    dateRef: string;
    values: {
      col2: string;
      col3: string;
      col4: string;
      col5: string;
      col6: string;
      col7: string;
    };
    existingRowIndex?: number;
  }) => void;
}

export const DailyEntryModal: React.FC<DailyEntryModalProps> = ({
  isOpen,
  headers,
  rows = [],
  existingRows,
  initialIsoDate,
  onClose,
  onSubmit,
}) => {
  const allRows = existingRows || rows || [];
  const [dateType, setDateType] = useState<'standard' | 'custom'>('standard');
  const [selectedIsoDate, setSelectedIsoDate] = useState(initialIsoDate || getTodayISO());
  const [customDateText, setCustomDateText] = useState('');

  const [col2, setCol2] = useState('');
  const [col3, setCol3] = useState('');
  const [col4, setCol4] = useState('');
  const [col5, setCol5] = useState('');
  const [col6, setCol6] = useState('');
  const [col7, setCol7] = useState('');

  // When initialIsoDate changes or modal opens, update selected date
  useEffect(() => {
    if (isOpen) {
      if (initialIsoDate) {
        setSelectedIsoDate(initialIsoDate);
        setCustomDateText(formatDateID(initialIsoDate));
      } else if (!selectedIsoDate) {
        const today = getTodayISO();
        setSelectedIsoDate(today);
        setCustomDateText(formatDateID(today));
      }
    }
  }, [isOpen, initialIsoDate]);

  // Active date string to check against existing rows
  const activeDateRef = useMemo(() => {
    if (dateType === 'standard') {
      return formatDateID(selectedIsoDate);
    }
    return customDateText;
  }, [dateType, selectedIsoDate, customDateText]);

  // Check if active selected date is an Indonesian National Holiday
  const activeHoliday = useMemo(() => {
    const iso = dateType === 'standard' ? selectedIsoDate : parseIndonesianDateToISO(customDateText);
    if (!iso) return null;
    return getIndonesianHoliday(iso);
  }, [dateType, selectedIsoDate, customDateText]);

  // Find if active date already has an existing row
  const matchingExistingRow = useMemo(() => {
    if (!activeDateRef || !allRows.length) return null;

    const trimmedActive = activeDateRef.trim().toLowerCase();
    const activeIso = parseIndonesianDateToISO(activeDateRef);

    return allRows.find((r) => {
      const rowRef = (r.dateRef || '').trim().toLowerCase();
      if (!rowRef) return false;

      if (rowRef === trimmedActive) return true;

      const rowIso = parseIndonesianDateToISO(rowRef);
      if (activeIso && rowIso && activeIso === rowIso) return true;

      return false;
    }) || null;
  }, [activeDateRef, allRows]);

  // Automatically populate fields if date exists in Sheet
  useEffect(() => {
    if (matchingExistingRow) {
      setCol2(formatNumberInput(matchingExistingRow.col2 || ''));
      setCol3(formatNumberInput(matchingExistingRow.col3 || ''));
      setCol4(formatNumberInput(matchingExistingRow.col4 || ''));
      setCol5(formatNumberInput(matchingExistingRow.col5 || ''));
      setCol6(formatNumberInput(matchingExistingRow.col6 || ''));
      setCol7(formatNumberInput(matchingExistingRow.col7 || ''));
    } else {
      setCol2('');
      setCol3('');
      setCol4('');
      setCol5('');
      setCol6('');
      setCol7('');
    }
  }, [matchingExistingRow]);

  // Reset form when modal opens anew
  useEffect(() => {
    if (isOpen && !initialIsoDate) {
      const today = getTodayISO();
      setSelectedIsoDate(today);
      setCustomDateText(formatDateID(today));
      setDateType('standard');
    }
  }, [isOpen]);

  // Calculations for TOTAL TRANSAKSI (Qty) & TOTAL NOMINAL (Rp)
  const columnData = useMemo(() => {
    const rawCols = [
      { key: 'col2', val: col2, colIndex: 2, cat: detectTransactionCategory(headers.col2Name, 2), type: detectColumnValueType(headers.col2Name, 2), name: headers.col2Name },
      { key: 'col3', val: col3, colIndex: 3, cat: detectTransactionCategory(headers.col3Name, 3), type: detectColumnValueType(headers.col3Name, 3), name: headers.col3Name },
      { key: 'col4', val: col4, colIndex: 4, cat: detectTransactionCategory(headers.col4Name, 4), type: detectColumnValueType(headers.col4Name, 4), name: headers.col4Name },
      { key: 'col5', val: col5, colIndex: 5, cat: detectTransactionCategory(headers.col5Name, 5), type: detectColumnValueType(headers.col5Name, 5), name: headers.col5Name },
      { key: 'col6', val: col6, colIndex: 6, cat: detectTransactionCategory(headers.col6Name, 6), type: detectColumnValueType(headers.col6Name, 6), name: headers.col6Name },
      { key: 'col7', val: col7, colIndex: 7, cat: detectTransactionCategory(headers.col7Name, 7), type: detectColumnValueType(headers.col7Name, 7), name: headers.col7Name },
    ];

    let instanNominal = 0;
    let regulerNominal = 0;
    let manualNominal = 0;
    let instanTrx = 0;
    let regulerTrx = 0;
    let manualTrx = 0;

    rawCols.forEach((col) => {
      const num = parseNumericValue(col.val);

      if (col.type === 'nominal') {
        // NOMINAL columns (TOTAL INSTAN, TOTAL REGULER, TOTAL MANUAL) in Rp
        if (col.cat === 'instan') instanNominal += num;
        else if (col.cat === 'reguler') regulerNominal += num;
        else if (col.cat === 'manual') manualNominal += num;
      } else {
        // QTY columns (TRANSAKSI INSTAN, TRANSAKSI REGULER, TRANSAKSI MANUAL) in Jumlah Transaksi
        if (col.cat === 'instan') instanTrx += num;
        else if (col.cat === 'reguler') regulerTrx += num;
        else if (col.cat === 'manual') manualTrx += num;
      }
    });

    // TOTAL NOMINAL = TOTAL INSTAN + TOTAL REGULER + TOTAL MANUAL (Hanya nominal Rp)
    const totalNominal = instanNominal + regulerNominal + manualNominal;
    // TOTAL TRANSAKSI = TRANSAKSI INSTAN + TRANSAKSI REGULER + TRANSAKSI MANUAL (Hanya Qty Transaksi)
    const totalTransaksi = instanTrx + regulerTrx + manualTrx;

    return {
      totalNominal,
      totalTransaksi,
      instanNominal,
      regulerNominal,
      manualNominal,
      instanTrx,
      regulerTrx,
      manualTrx,
    };
  }, [col2, col3, col4, col5, col6, col7, headers]);

  const handleResetFields = () => {
    setCol2('');
    setCol3('');
    setCol4('');
    setCol5('');
    setCol6('');
    setCol7('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDateRef.trim()) {
      alert('Mohon masukkan tanggal atau hari acuan pada Kolom 1.');
      return;
    }

    onSubmit({
      dateRef: activeDateRef.trim(),
      values: {
        col2: col2.trim(),
        col3: col3.trim(),
        col4: col4.trim(),
        col5: col5.trim(),
        col6: col6.trim(),
        col7: col7.trim(),
      },
      existingRowIndex: matchingExistingRow ? matchingExistingRow.rowIndex : undefined,
    });
  };

  if (!isOpen) return null;

  const columnFields = [
    { num: 2, name: headers.col2Name, val: col2, setVal: setCol2, category: detectTransactionCategory(headers.col2Name, 2), valueType: detectColumnValueType(headers.col2Name, 2) },
    { num: 3, name: headers.col3Name, val: col3, setVal: setCol3, category: detectTransactionCategory(headers.col3Name, 3), valueType: detectColumnValueType(headers.col3Name, 3) },
    { num: 4, name: headers.col4Name, val: col4, setVal: setCol4, category: detectTransactionCategory(headers.col4Name, 4), valueType: detectColumnValueType(headers.col4Name, 4) },
    { num: 5, name: headers.col5Name, val: col5, setVal: setCol5, category: detectTransactionCategory(headers.col5Name, 5), valueType: detectColumnValueType(headers.col5Name, 5) },
    { num: 6, name: headers.col6Name, val: col6, setVal: setCol6, category: detectTransactionCategory(headers.col6Name, 6), valueType: detectColumnValueType(headers.col6Name, 6) },
    { num: 7, name: headers.col7Name, val: col7, setVal: setCol7, category: detectTransactionCategory(headers.col7Name, 7), valueType: detectColumnValueType(headers.col7Name, 7) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Input Data Penjualan Harian</h2>
              <p className="text-xs text-slate-500">
                Kategori: <span className="text-amber-700 font-bold">⚡ Instan</span>,{' '}
                <span className="text-sky-700 font-bold">📦 Reguler</span>, &{' '}
                <span className="text-purple-700 font-bold">✍️ Manual</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Kolom 1 Section: Acuan Hari / Tanggal */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Kolom 1: {headers.col1Name || 'Acuan Hari / Tanggal'}
              </label>
              <div className="flex bg-slate-200/80 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setDateType('standard');
                    setCustomDateText(formatDateID(selectedIsoDate));
                  }}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    dateType === 'standard' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kalender
                </button>
                <button
                  type="button"
                  onClick={() => setDateType('custom')}
                  className={`px-2.5 py-1 rounded-md transition font-medium ${
                    dateType === 'custom' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Teks Bebas
                </button>
              </div>
            </div>

            {dateType === 'standard' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedIsoDate}
                    onChange={(e) => {
                      setSelectedIsoDate(e.target.value);
                      setCustomDateText(formatDateID(e.target.value));
                    }}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const today = getTodayISO();
                      setSelectedIsoDate(today);
                      setCustomDateText(formatDateID(today));
                    }}
                    className="px-3 py-2.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 transition shrink-0"
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() - 1);
                      const yest = d.toISOString().split('T')[0];
                      setSelectedIsoDate(yest);
                      setCustomDateText(formatDateID(yest));
                    }}
                    className="px-3 py-2.5 text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 transition shrink-0"
                  >
                    Kemarin
                  </button>
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 px-1">
                  <span>Format simpan Kolom 1:</span>
                  <span className="font-semibold text-emerald-700 font-mono">
                    {formatDateID(selectedIsoDate)}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  value={customDateText}
                  onChange={(e) => setCustomDateText(e.target.value)}
                  placeholder="Contoh: Senin, 24 September 2026 atau 24/09/2026"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              </div>
            )}

            {/* Indonesian National Holiday Banner */}
            {activeHoliday && (
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs shadow-xs">
                <span className="text-base shrink-0">🚩</span>
                <div>
                  <div className="font-extrabold uppercase tracking-wider text-[10px] text-rose-700">
                    Hari Libur Nasional Indonesia
                  </div>
                  <div className="font-bold text-rose-950 text-xs mt-0.5">
                    {activeHoliday}
                  </div>
                </div>
              </div>
            )}

            {/* Auto-detected existing row notification */}
            {matchingExistingRow ? (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    <strong>Tanggal ini sudah ada di baris #{matchingExistingRow.rowIndex}.</strong> Angka otomatis dimuat dan siap diedit.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleResetFields}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-100 text-emerald-800 font-semibold rounded-lg text-xs border border-emerald-200 transition shrink-0 flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Kosongkan
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-1 px-1">
                <span>Tanggal baru (belum ada di sheet). Kolom siap diisi.</span>
              </div>
            )}
          </div>

          {/* TOTAL TRANSAKSI (Qty) & TOTAL NOMINAL (Rp) SUMMARY BANNER */}
          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* TOTAL NOMINAL = TOTAL INSTAN + TOTAL REGULER + TOTAL MANUAL (Hanya Nominal Rp) */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>TOTAL NOMINAL (Rp)</span>
                    <span className="text-[9px] text-emerald-400 font-semibold hidden sm:inline">(TOTAL INSTAN + TOTAL REGULER + TOTAL MANUAL)</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400">
                    {formatIndonesianCurrency(columnData.totalNominal)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex flex-wrap items-center gap-1 mt-0.5">
                    <span className="text-amber-300 font-semibold">{formatIndonesianCurrency(columnData.instanNominal)}</span>
                    <span className="text-slate-500">+</span>
                    <span className="text-sky-300 font-semibold">{formatIndonesianCurrency(columnData.regulerNominal)}</span>
                    <span className="text-slate-500">+</span>
                    <span className="text-purple-300 font-semibold">{formatIndonesianCurrency(columnData.manualNominal)}</span>
                  </div>
                </div>
              </div>

              {/* TOTAL TRANSAKSI = TRANSAKSI INSTAN + TRANSAKSI REGULER + TRANSAKSI MANUAL (Hanya Qty) */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>TOTAL TRANSAKSI (Qty)</span>
                    <span className="text-[9px] text-indigo-300 font-semibold hidden sm:inline">({columnData.instanTrx} + {columnData.regulerTrx} + {columnData.manualTrx})</span>
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-white flex items-center gap-1.5">
                    <span>{columnData.totalTransaksi}</span>
                    <span className="text-xs font-normal text-slate-400">Transaksi</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <span className="text-amber-300 font-semibold">{columnData.instanTrx}</span>
                    <span className="text-slate-500">+</span>
                    <span className="text-sky-300 font-semibold">{columnData.regulerTrx}</span>
                    <span className="text-slate-500">+</span>
                    <span className="text-purple-300 font-semibold">{columnData.manualTrx}</span>
                  </div>
                </div>

                {matchingExistingRow && (
                  <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 whitespace-nowrap">
                    Baris #{matchingExistingRow.rowIndex}
                  </span>
                )}
              </div>
            </div>

            {/* Category Breakdown Badges (Nominal Rp & Transaksi Qty per Kategori) */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              {/* INSTAN */}
              <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-2.5 text-amber-300 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1 font-bold text-amber-400">
                    <Zap className="w-3.5 h-3.5" />
                    <span>⚡ INSTAN</span>
                  </div>
                  <div className="text-[10px] text-amber-300/80 mt-0.5 font-medium">
                    Transaksi: <strong className="text-amber-200 font-mono">{columnData.instanTrx} Qty</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-amber-400/70 font-semibold">TOTAL INSTAN</div>
                  <div className="font-mono font-extrabold text-xs sm:text-sm text-amber-200">
                    {formatIndonesianCurrency(columnData.instanNominal)}
                  </div>
                </div>
              </div>

              {/* REGULER */}
              <div className="bg-sky-950/40 border border-sky-800/40 rounded-lg p-2.5 text-sky-300 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1 font-bold text-sky-400">
                    <Package className="w-3.5 h-3.5" />
                    <span>📦 REGULER</span>
                  </div>
                  <div className="text-[10px] text-sky-300/80 mt-0.5 font-medium">
                    Transaksi: <strong className="text-sky-200 font-mono">{columnData.regulerTrx} Qty</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-sky-400/70 font-semibold">TOTAL REGULER</div>
                  <div className="font-mono font-extrabold text-xs sm:text-sm text-sky-200">
                    {formatIndonesianCurrency(columnData.regulerNominal)}
                  </div>
                </div>
              </div>

              {/* MANUAL */}
              <div className="bg-purple-950/40 border border-purple-800/40 rounded-lg p-2.5 text-purple-300 flex items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1 font-bold text-purple-400">
                    <PenTool className="w-3.5 h-3.5" />
                    <span>✍️ MANUAL</span>
                  </div>
                  <div className="text-[10px] text-purple-300/80 mt-0.5 font-medium">
                    Transaksi: <strong className="text-purple-200 font-mono">{columnData.manualTrx} Qty</strong>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-purple-400/70 font-semibold">TOTAL MANUAL</div>
                  <div className="font-mono font-extrabold text-xs sm:text-sm text-purple-200">
                    {formatIndonesianCurrency(columnData.manualNominal)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Color-Separated Transaction Fields (Columns 2-7) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Isian Kolom 2 s/d 7 (Transaksi Qty & Total Nominal Rp)
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {columnFields.map((field) => {
                const theme = TRANSACTION_THEMES[field.category];
                const isInstan = field.category === 'instan';
                const isReguler = field.category === 'reguler';
                const isManual = field.category === 'manual';
                const isQty = field.valueType === 'qty';

                return (
                  <div
                    key={field.num}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isInstan
                        ? 'bg-amber-50/60 border-amber-200 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500'
                        : isReguler
                        ? 'bg-sky-50/60 border-sky-200 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500'
                        : isManual
                        ? 'bg-purple-50/60 border-purple-200 focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500'
                        : 'bg-slate-50 border-slate-200 focus-within:border-indigo-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold flex items-center gap-1.5 truncate max-w-[200px]">
                        {isInstan && <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        {isReguler && <Package className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                        {isManual && <PenTool className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                        <span className={theme.badgeText}>{field.name}</span>
                      </label>

                      <div className="flex items-center gap-1">
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                        >
                          {isInstan
                            ? '⚡ Instan'
                            : isReguler
                            ? '📦 Reguler'
                            : isManual
                            ? '✍️ Manual'
                            : `Col ${String.fromCharCode(64 + field.num)}`}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                            isQty
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isQty ? 'Jumlah Qty' : 'Nominal Rp'}
                        </span>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={field.val}
                      onChange={(e) => field.setVal(formatNumberInput(e.target.value))}
                      placeholder={isQty ? `Isi jumlah transaksi ${field.name} (contoh: 15)...` : `Isi total nominal ${field.name} (contoh: 500.000)...`}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 font-mono shadow-xs"
                    />

                    <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 px-1 font-mono">
                      <span>Preview Nilai:</span>
                      <span className="font-semibold text-slate-800">
                        {field.val
                          ? isQty
                            ? `${parseNumericValue(field.val)} transaksi (Qty)`
                            : formatIndonesianCurrency(parseNumericValue(field.val))
                          : isQty
                          ? '0 transaksi'
                          : 'Rp 0'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              {matchingExistingRow ? `Update Baris #${matchingExistingRow.rowIndex}` : 'Simpan Data Baru'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
