import React from 'react';
import { FileSpreadsheet, LogIn, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthScreenProps {
  onSignIn: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  isLoading,
  errorMessage,
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-emerald-600 selection:text-white">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6 relative overflow-hidden">
        {/* Top Accent */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-600/20">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Editor Penjualan Harian
          </h1>
          <p className="text-sm text-slate-500">
            Kelola dan edit data Google Sheets secara real-time dengan aman dan cepat
          </p>
        </div>

        {/* Features Checklist */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Acuan Hari / Tanggal otomatis pada <strong>Kolom 1</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Edit langsung <strong>Kolom 2 s/d 7</strong> (Instan, Reguler, Manual)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Sinkronisasi instan ke spreadsheet Google resmi</span>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sign In with Google Button */}
        <div className="space-y-3">
          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-white hover:bg-slate-50 border-2 border-slate-300 hover:border-slate-400 text-slate-800 font-semibold rounded-2xl shadow-sm transition active:scale-98 disabled:opacity-60"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isLoading ? 'Menghubungkan Akun...' : 'Masuk dengan Google'}</span>
          </button>
        </div>

        {/* Security badge */}
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs text-center">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Autentikasi resmi & aman via Google OAuth</span>
        </div>
      </div>
    </div>
  );
};
