import React from 'react';
import { AlertCircle, Check, X, ArrowRight, Zap, Package, PenTool } from 'lucide-react';
import { SheetHeaderConfig } from '../types/sheets';
import { detectTransactionCategory, TRANSACTION_THEMES } from '../utils/transactionColors';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  details?: {
    dateRef: string;
    rowIndex?: number;
    headers: SheetHeaderConfig;
    values: {
      col2: string;
      col3: string;
      col4: string;
      col5: string;
      col6: string;
      col7: string;
    };
    originalValues?: {
      col2: string;
      col3: string;
      col4: string;
      col5: string;
      col6: string;
      col7: string;
    };
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  description,
  actionLabel = 'Konfirmasi & Simpan',
  isDestructive = false,
  isLoading = false,
  details,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 bg-white">
          <div className="flex items-start gap-3">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isDestructive
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              }`}
            >
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
            </div>
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {details && (
          <div className="p-6 bg-slate-50 max-h-[50vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span>Kolom & Kategori</span>
              <span>Nilai Simpan</span>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-white border border-slate-200 text-sm shadow-xs">
              <span className="text-slate-500 text-xs font-medium">
                {details.headers.col1Name} (Kolom 1 - Acuan Tanggal)
              </span>
              <span className="font-semibold text-emerald-700">{details.dateRef || '-'}</span>
            </div>

            {[
              { num: 2, name: details.headers.col2Name, val: details.values.col2, orig: details.originalValues?.col2, cat: detectTransactionCategory(details.headers.col2Name, 2) },
              { num: 3, name: details.headers.col3Name, val: details.values.col3, orig: details.originalValues?.col3, cat: detectTransactionCategory(details.headers.col3Name, 3) },
              { num: 4, name: details.headers.col4Name, val: details.values.col4, orig: details.originalValues?.col4, cat: detectTransactionCategory(details.headers.col4Name, 4) },
              { num: 5, name: details.headers.col5Name, val: details.values.col5, orig: details.originalValues?.col5, cat: detectTransactionCategory(details.headers.col5Name, 5) },
              { num: 6, name: details.headers.col6Name, val: details.values.col6, orig: details.originalValues?.col6, cat: detectTransactionCategory(details.headers.col6Name, 6) },
              { num: 7, name: details.headers.col7Name, val: details.values.col7, orig: details.originalValues?.col7, cat: detectTransactionCategory(details.headers.col7Name, 7) },
            ].map((col) => {
              const theme = TRANSACTION_THEMES[col.cat];
              return (
                <div
                  key={col.num}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-white border border-slate-200 text-sm shadow-xs"
                >
                  <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                    {col.cat === 'instan' && <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                    {col.cat === 'reguler' && <Package className="w-3.5 h-3.5 text-sky-600 shrink-0" />}
                    {col.cat === 'manual' && <PenTool className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    <span className="text-slate-700 text-xs truncate">
                      <strong className={`mr-1 ${theme.badgeText}`}>K{col.num}:</strong>
                      {col.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-right font-mono text-xs">
                    {col.orig !== undefined && col.orig !== col.val && (
                      <>
                        <span className="text-slate-400 line-through truncate max-w-[90px]">{col.orig || '(kosong)'}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      </>
                    )}
                    <span className="text-slate-900 font-semibold truncate max-w-[140px]">
                      {col.val || <span className="text-slate-400 italic">kosong</span>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-sm flex items-center gap-2 transition disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
