import React from 'react';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { ToastMessage } from '../types/sheets';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        let bg = 'bg-white text-slate-800 border-slate-200';
        let icon = <Info className="w-5 h-5 text-sky-600 shrink-0" />;

        if (toast.type === 'success') {
          bg = 'bg-white text-slate-800 border-emerald-300';
          icon = <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />;
        } else if (toast.type === 'error') {
          bg = 'bg-white text-slate-800 border-rose-300';
          icon = <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />;
        } else if (toast.type === 'warning') {
          bg = 'bg-white text-slate-800 border-amber-300';
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />;
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg transition-all duration-300 ${bg}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold text-slate-900">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
