import React, { useState, useEffect, useMemo } from 'react';
import { Edit3, X, Save, Calendar, CheckSquare, Sparkles, Zap, Package, PenTool, Calculator } from 'lucide-react';
import { SheetHeaderConfig, SheetRow } from '../types/sheets';
import { formatNumberInput, parseNumericValue, formatIndonesianCurrency } from '../services/sheets';
import { detectTransactionCategory, TRANSACTION_THEMES } from '../utils/transactionColors';

interface EditRowModalProps {
  isOpen: boolean;
  row: SheetRow | null;
  headers: SheetHeaderConfig;
  onClose: () => void;
  onSave: (
    rowIndex: number,
    values: {
      col2: string;
      col3: string;
      col4: string;
      col5: string;
      col6: string;
      col7: string;
    },
    updatedDate?: string
  ) => void;
}

export const EditRowModal: React.FC<EditRowModalProps> = ({
  isOpen,
  row,
  headers,
  onClose,
  onSave,
}) => {
  const [dateRef, setDateRef] = useState('');
  const [allowDateEdit, setAllowDateEdit] = useState(false);
  const [col2, setCol2] = useState('');
  const [col3, setCol3] = useState('');
  const [col4, setCol4] = useState('');
  const [col5, setCol5] = useState('');
  const [col6, setCol6] = useState('');
  const [col7, setCol7] = useState('');

  useEffect(() => {
    if (row && isOpen) {
      setDateRef(row.dateRef);
      setAllowDateEdit(false);
      setCol2(formatNumberInput(row.col2 || ''));
      setCol3(formatNumberInput(row.col3 || ''));
      setCol4(formatNumberInput(row.col4 || ''));
      setCol5(formatNumberInput(row.col5 || ''));
      setCol6(formatNumberInput(row.col6 || ''));
      setCol7(formatNumberInput(row.col7 || ''));
    }
  }, [row, isOpen]);

  // Calculations for TOTAL TRANSAKSI & TOTAL NOMINAL
  const columnData = useMemo(() => {
    const rawCols = [
      { key: 'col2', val: col2, cat: detectTransactionCategory(headers.col2Name, 2) },
      { key: 'col3', val: col3, cat: detectTransactionCategory(headers.col3Name, 3) },
      { key: 'col4', val: col4, cat: detectTransactionCategory(headers.col4Name, 4) },
      { key: 'col5', val: col5, cat: detectTransactionCategory(headers.col5Name, 5) },
      { key: 'col6', val: col6, cat: detectTransactionCategory(headers.col6Name, 6) },
      { key: 'col7', val: col7, cat: detectTransactionCategory(headers.col7Name, 7) },
    ];

    let totalNominal = 0;
    let totalTransaksi = 0;
    let instanNominal = 0;
    let regulerNominal = 0;
    let manualNominal = 0;

    rawCols.forEach((col) => {
      const num = parseNumericValue(col.val);
      if (num !== 0 || col.val.trim() !== '') {
        totalTransaksi += 1;
      }
      totalNominal += num;
      if (col.cat === 'instan') instanNominal += num;
      if (col.cat === 'reguler') regulerNominal += num;
      if (col.cat === 'manual') manualNominal += num;
    });

    return { totalNominal, totalTransaksi, instanNominal, regulerNominal, manualNominal };
  }, [col2, col3, col4, col5, col6, col7, headers]);

  if (!isOpen || !row) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(
      row.rowIndex,
      {
        col2: col2.trim(),
        col3: col3.trim(),
        col4: col4.trim(),
        col5: col5.trim(),
        col6: col6.trim(),
        col7: col7.trim(),
      },
      allowDateEdit ? dateRef.trim() : undefined
    );
  };

  const hasChanges =
    col2 !== (row.col2 || '') ||
    col3 !== (row.col3 || '') ||
    col4 !== (row.col4 || '') ||
    col5 !== (row.col5 || '') ||
    col6 !== (row.col6 || '') ||
    col7 !== (row.col7 || '') ||
    (allowDateEdit && dateRef !== row.dateRef);

  const columnFields = [
    { num: 2, name: headers.col2Name, val: col2, setVal: setCol2, orig: row.col2, category: detectTransactionCategory(headers.col2Name, 2) },
    { num: 3, name: headers.col3Name, val: col3, setVal: setCol3, orig: row.col3, category: detectTransactionCategory(headers.col3Name, 3) },
    { num: 4, name: headers.col4Name, val: col4, setVal: setCol4, orig: row.col4, category: detectTransactionCategory(headers.col4Name, 4) },
    { num: 5, name: headers.col5Name, val: col5, setVal: setCol5, orig: row.col5, category: detectTransactionCategory(headers.col5Name, 5) },
    { num: 6, name: headers.col6Name, val: col6, setVal: setCol6, orig: row.col6, category: detectTransactionCategory(headers.col6Name, 6) },
    { num: 7, name: headers.col7Name, val: col7, setVal: setCol7, orig: row.col7, category: detectTransactionCategory(headers.col7Name, 7) },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Edit Data Baris #{row.rowIndex}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                  Sheet Row {row.rowIndex}
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Acuan Tanggal: <strong className="text-emerald-700">{row.dateRef}</strong>
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
          {/* Kolom 1 (Date Reference) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                Kolom 1: {headers.col1Name} (Acuan)
              </label>
              <button
                type="button"
                onClick={() => setAllowDateEdit(!allowDateEdit)}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <CheckSquare className={`w-3.5 h-3.5 ${allowDateEdit ? 'text-indigo-600' : 'text-slate-400'}`} />
                {allowDateEdit ? 'Kunci Tanggal' : 'Ubah Tanggal'}
              </button>
            </div>
            <input
              type="text"
              value={dateRef}
              onChange={(e) => setDateRef(e.target.value)}
              disabled={!allowDateEdit}
              className={`w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                allowDateEdit
                  ? 'bg-white border border-indigo-500 text-slate-900 focus:outline-none'
                  : 'bg-slate-100 border border-slate-200 text-emerald-800 cursor-not-allowed'
              }`}
            />
          </div>

          {/* TOTAL TRANSAKSI & TOTAL NOMINAL BANNER */}
          <div className="p-4 rounded-xl bg-slate-900 text-white shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* TOTAL NOMINAL */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    TOTAL NOMINAL
                  </div>
                  <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400">
                    {formatIndonesianCurrency(columnData.totalNominal)}
                  </div>
                </div>
              </div>

              {/* TOTAL TRANSAKSI */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 sm:border-l border-slate-800 pt-3 sm:pt-0 sm:pl-6">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    TOTAL TRANSAKSI
                  </div>
                  <div className="text-lg sm:text-xl font-bold font-mono text-white flex items-center gap-1.5">
                    <span>{columnData.totalTransaksi}</span>
                    <span className="text-xs font-normal text-slate-400">kolom terisi</span>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-400/20 text-indigo-300 border border-indigo-400/30 whitespace-nowrap">
                  Baris #{row.rowIndex}
                </span>
              </div>
            </div>

            {/* Category Breakdown Badges */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px]">
              <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-2 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="flex items-center gap-1 font-medium">
                  <Zap className="w-3 h-3 text-amber-400" />
                  Instan:
                </span>
                <span className="font-mono font-bold">{formatIndonesianCurrency(columnData.instanNominal)}</span>
              </div>

              <div className="bg-sky-950/40 border border-sky-800/40 rounded-lg p-2 text-sky-300 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="flex items-center gap-1 font-medium">
                  <Package className="w-3 h-3 text-sky-400" />
                  Reguler:
                </span>
                <span className="font-mono font-bold">{formatIndonesianCurrency(columnData.regulerNominal)}</span>
              </div>

              <div className="bg-purple-950/40 border border-purple-800/40 rounded-lg p-2 text-purple-300 flex flex-col sm:flex-row sm:items-center justify-between gap-0.5">
                <span className="flex items-center gap-1 font-medium">
                  <PenTool className="w-3 h-3 text-purple-400" />
                  Manual:
                </span>
                <span className="font-mono font-bold">{formatIndonesianCurrency(columnData.manualNominal)}</span>
              </div>
            </div>
          </div>

          {/* Kolom 2 to 7 Grid with Visual Colors */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Kolom Isian (Kolom 2 s/d 7)
              </h3>
              {hasChanges && (
                <span className="text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Ada perubahan belum disimpan
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {columnFields.map((field) => {
                const theme = TRANSACTION_THEMES[field.category];
                const isInstan = field.category === 'instan';
                const isReguler = field.category === 'reguler';
                const isManual = field.category === 'manual';
                const isChanged = field.val !== (field.orig || '');

                return (
                  <div
                    key={field.num}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isInstan
                        ? 'bg-amber-50/60 border-amber-200'
                        : isReguler
                        ? 'bg-sky-50/60 border-sky-200'
                        : isManual
                        ? 'bg-purple-50/60 border-purple-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold flex items-center gap-1.5 truncate max-w-[190px]">
                        {isInstan && <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        {isReguler && <Package className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                        {isManual && <PenTool className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                        <span className={theme.badgeText}>{field.name}</span>
                      </label>

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
                    </div>

                    <input
                      type="text"
                      value={field.val}
                      onChange={(e) => field.setVal(formatNumberInput(e.target.value))}
                      placeholder={`Isi nilai ${field.name} (contoh: 390.000)...`}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-500 font-mono shadow-xs"
                    />

                    {isChanged && (
                      <div className="text-[11px] text-amber-700 mt-1 truncate">
                        Sebelumnya: <span className="line-through text-slate-400">{field.orig || '(kosong)'}</span>
                      </div>
                    )}
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
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!hasChanges}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm flex items-center gap-2 transition"
            >
              <Save className="w-4 h-4" />
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
