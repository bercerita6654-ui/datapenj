import React from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  LogOut,
  BarChart2,
  Table as TableIcon,
  Calendar as CalendarIcon,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  user: User | null;
  spreadsheetId: string;
  sheetTitle: string;
  currentSheetName: string;
  availableSheets: string[];
  isLoading: boolean;
  activeView: 'calendar' | 'table' | 'analytics';
  onViewChange: (view: 'calendar' | 'table' | 'analytics') => void;
  onRefresh: () => void;
  onSelectSheet: (name: string) => void;
  onOpenNewEntry: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  spreadsheetId,
  sheetTitle,
  currentSheetName,
  availableSheets,
  isLoading,
  activeView,
  onViewChange,
  onRefresh,
  onSelectSheet,
  onOpenNewEntry,
  onLogout,
}) => {
  const googleSheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Sheet Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                  Editor Penjualan Harian
                </h1>
                <a
                  href={googleSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-emerald-600 bg-slate-100 hover:bg-emerald-50 px-2 py-0.5 rounded-md border border-slate-200 transition"
                  title="Buka file langsung di Google Sheets"
                >
                  <span>Google Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Sheet Switcher dropdown */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-slate-500">Sheet:</span>
                {availableSheets.length > 1 ? (
                  <div className="relative inline-block">
                    <select
                      value={currentSheetName}
                      onChange={(e) => onSelectSheet(e.target.value)}
                      className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md px-2 py-0.5 pr-6 cursor-pointer appearance-none focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {availableSheets.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-emerald-700 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {currentSheetName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center Tabs: Calendar vs Table vs Analytics */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => onViewChange('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'calendar'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
            <button
              onClick={() => onViewChange('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'table'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel Data</span>
            </button>
            <button
              onClick={() => onViewChange('analytics')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'analytics'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Grafik Tren</span>
            </button>
          </div>

          {/* Right Action Buttons & User Profile */}
          <div className="flex items-center gap-2">
            {/* New Entry Button */}
            <button
              onClick={onOpenNewEntry}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="hidden sm:inline">+ Isi Penjualan</span>
              <span className="sm:hidden">+ Isi</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh Data dari Google Sheets"
              className="p-2 text-slate-500 hover:text-emerald-700 rounded-xl bg-slate-100 hover:bg-emerald-50 border border-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

            {/* User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-emerald-300"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
              )}

              <div className="hidden lg:block text-left text-xs">
                <div className="font-semibold text-slate-800 truncate max-w-[120px]">
                  {user?.displayName || 'Pengguna'}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {user?.email}
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Keluar"
                className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile View Switcher */}
        <div className="md:hidden flex items-center justify-center pb-3 pt-1 border-t border-slate-100">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 w-full">
            <button
              onClick={() => onViewChange('calendar')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'calendar'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
            <button
              onClick={() => onViewChange('table')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'table'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              onClick={() => onViewChange('analytics')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeView === 'analytics'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Grafik</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
