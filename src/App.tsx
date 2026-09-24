/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessToken,
} from './services/auth';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SHEET_NAME,
  getSpreadsheetMetadata,
  fetchSheetData,
  updateEditableColumns,
  appendDailyRecord,
  clearSheetRow,
  SheetsApiError,
} from './services/sheets';
import { SheetHeaderConfig, SheetMetadata, SheetRow, ToastMessage } from './types/sheets';
import { Navbar } from './components/Navbar';
import { StatsCards } from './components/StatsCards';
import { CalendarView } from './components/CalendarView';
import { DataTable } from './components/DataTable';
import { DailyEntryModal } from './components/DailyEntryModal';
import { EditRowModal } from './components/EditRowModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { AnalyticsView } from './components/AnalyticsView';
import { AuthScreen } from './components/AuthScreen';
import { ToastContainer } from './components/Toast';
import { FileSpreadsheet, PlusCircle, Calendar as CalendarIcon, Table as TableIcon, BarChart2 } from 'lucide-react';
import {
  getAvailableMonthsFromRows,
  getCurrentActiveMonth,
  MonthOption,
} from './utils/monthHelper';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Spreadsheet state
  const [spreadsheetId] = useState<string>(DEFAULT_SPREADSHEET_ID);
  const [sheetName, setSheetName] = useState<string>(DEFAULT_SHEET_NAME);
  const [sheetMetadata, setSheetMetadata] = useState<SheetMetadata | null>(null);
  const [headers, setHeaders] = useState<SheetHeaderConfig>({
    col1Name: 'Hari / Tanggal',
    col2Name: 'Kolom 2',
    col3Name: 'Kolom 3',
    col4Name: 'Kolom 4',
    col5Name: 'Kolom 5',
    col6Name: 'Kolom 6',
    col7Name: 'Kolom 7',
  });
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeView, setActiveView] = useState<'calendar' | 'table' | 'analytics'>('calendar');

  // Active Month Filter state
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('auto');

  // Modals state
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedDateForEntry, setSelectedDateForEntry] = useState<string | undefined>(undefined);
  const [editingRow, setEditingRow] = useState<SheetRow | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
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
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: async () => {},
  });

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastMessage['type'], title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // 1. Initialize Auth on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser, token) => {
        setUser(authedUser);
        setTokenState(token);
        setAuthChecked(true);
      },
      () => {
        setUser(null);
        setTokenState(null);
        setAuthChecked(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Load spreadsheet data
  const loadSpreadsheet = useCallback(
    async (token: string, targetSheetName: string) => {
      setIsLoadingData(true);
      try {
        const metadata = await getSpreadsheetMetadata(spreadsheetId, token);
        setSheetMetadata(metadata);

        let finalSheetName = targetSheetName;
        const exists = metadata.sheets.some((s) => s.title === targetSheetName);
        if (!exists && metadata.sheets.length > 0) {
          finalSheetName = metadata.sheets[0].title;
          setSheetName(finalSheetName);
        }

        const data = await fetchSheetData(spreadsheetId, finalSheetName, token);
        setHeaders(data.headers);
        setRows(data.rows);
      } catch (err: unknown) {
        console.error('Error fetching sheet data:', err);
        const apiError = err as SheetsApiError;
        if (apiError.status === 401 || apiError.status === 403) {
          addToast('error', 'Sesi Berakhir', 'Sesi login Google telah kedaluwarsa. Silakan login kembali.');
          await logout();
        } else {
          addToast('error', 'Gagal Memuat Data', apiError.message || 'Tidak dapat membaca data dari Google Sheets.');
        }
      } finally {
        setIsLoadingData(false);
      }
    },
    [spreadsheetId, addToast]
  );

  // Trigger load when authenticated
  useEffect(() => {
    if (accessToken) {
      loadSpreadsheet(accessToken, sheetName);
    }
  }, [accessToken, sheetName, loadSpreadsheet]);

  // Months available in the dataset
  const availableMonths = useMemo(() => {
    return getAvailableMonthsFromRows(rows);
  }, [rows]);

  // Auto set to newest month if 'auto'
  useEffect(() => {
    if (selectedMonthKey === 'auto') {
      if (availableMonths.length > 0) {
        setSelectedMonthKey(availableMonths[0].key);
      } else {
        const current = getCurrentActiveMonth();
        setSelectedMonthKey(current.key);
      }
    }
  }, [availableMonths, selectedMonthKey]);

  // Auth actions
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setTokenState(result.accessToken);
        setAccessToken(result.accessToken);
        addToast('success', 'Berhasil Masuk', `Selamat datang, ${result.user.displayName || 'Pengguna'}!`);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      const msg = err instanceof Error ? err.message : 'Gagal melakukan login dengan Google.';
      setLoginError(msg);
      addToast('error', 'Login Gagal', msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setTokenState(null);
      setRows([]);
      setSheetMetadata(null);
      addToast('info', 'Keluar Akun', 'Anda telah berhasil keluar.');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSelectSheet = (name: string) => {
    setSheetName(name);
    if (accessToken) {
      loadSpreadsheet(accessToken, name);
    }
  };

  // Open entry modal with specific date clicked from calendar
  const handleOpenDateEntry = (isoDate: string) => {
    setSelectedDateForEntry(isoDate);
    setIsEntryModalOpen(true);
  };

  const handleOpenGeneralEntry = () => {
    setSelectedDateForEntry(undefined);
    setIsEntryModalOpen(true);
  };

  // Submission handler
  const handleRequestNewEntry = (entry: {
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
  }) => {
    setIsEntryModalOpen(false);

    if (entry.existingRowIndex) {
      const existing = rows.find((r) => r.rowIndex === entry.existingRowIndex);
      setConfirmModal({
        isOpen: true,
        title: `Update Data Tanggal ${entry.dateRef}?`,
        description: `Tanggal ini sudah tercatat pada Baris #${entry.existingRowIndex}. Apakah Anda ingin menimpa data pada baris tersebut?`,
        actionLabel: 'Update Baris',
        details: {
          dateRef: entry.dateRef,
          rowIndex: entry.existingRowIndex,
          headers,
          values: entry.values,
          originalValues: existing
            ? {
                col2: existing.col2,
                col3: existing.col3,
                col4: existing.col4,
                col5: existing.col5,
                col6: existing.col6,
                col7: existing.col7,
              }
            : undefined,
        },
        onConfirm: async () => {
          const token = await getAccessToken();
          if (!token) throw new Error('Token tidak tersedia.');
          await updateEditableColumns(spreadsheetId, sheetName, entry.existingRowIndex!, entry.values, token);
          addToast('success', 'Berhasil Diperbarui', `Data baris #${entry.existingRowIndex} berhasil diupdate.`);
          await loadSpreadsheet(token, sheetName);
        },
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: `Simpan Data Baru untuk ${entry.dateRef}?`,
        description: `Data akan ditambahkan sebagai baris baru pada sheet '${sheetName}'.`,
        actionLabel: 'Simpan ke Sheet',
        details: {
          dateRef: entry.dateRef,
          headers,
          values: entry.values,
        },
        onConfirm: async () => {
          const token = await getAccessToken();
          if (!token) throw new Error('Token tidak tersedia.');
          await appendDailyRecord(spreadsheetId, sheetName, entry.dateRef, entry.values, token);
          addToast('success', 'Data Ditambahkan', `Data baru untuk ${entry.dateRef} berhasil disimpan.`);
          await loadSpreadsheet(token, sheetName);
        },
      });
    }
  };

  const handleRequestEditRow = (
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
  ) => {
    const existing = rows.find((r) => r.rowIndex === rowIndex);
    setEditingRow(null);

    setConfirmModal({
      isOpen: true,
      title: `Simpan Perubahan Baris #${rowIndex}?`,
      description: `Perubahan akan langsung disimpan ke Google Sheet.`,
      actionLabel: 'Simpan Perubahan',
      details: {
        dateRef: updatedDate || existing?.dateRef || `Baris #${rowIndex}`,
        rowIndex,
        headers,
        values,
        originalValues: existing
          ? {
              col2: existing.col2,
              col3: existing.col3,
              col4: existing.col4,
              col5: existing.col5,
              col6: existing.col6,
              col7: existing.col7,
            }
          : undefined,
      },
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Token tidak tersedia.');
        await updateEditableColumns(spreadsheetId, sheetName, rowIndex, values, token, updatedDate);
        addToast('success', 'Tersimpan', `Perubahan baris #${rowIndex} berhasil diperbarui.`);
        await loadSpreadsheet(token, sheetName);
      },
    });
  };

  const handleQuickSaveInline = async (
    rowIndex: number,
    values: {
      col2: string;
      col3: string;
      col4: string;
      col5: string;
      col6: string;
      col7: string;
    }
  ) => {
    const existing = rows.find((r) => r.rowIndex === rowIndex);
    setConfirmModal({
      isOpen: true,
      title: `Simpan Edit Cepat Baris #${rowIndex}?`,
      description: `Apakah Anda ingin menerapkan perubahan angka pada baris #${rowIndex} (${existing?.dateRef || 'Tanggal'})?`,
      actionLabel: 'Terapkan Simpan',
      details: {
        dateRef: existing?.dateRef || `Baris #${rowIndex}`,
        rowIndex,
        headers,
        values,
        originalValues: existing
          ? {
              col2: existing.col2,
              col3: existing.col3,
              col4: existing.col4,
              col5: existing.col5,
              col6: existing.col6,
              col7: existing.col7,
            }
          : undefined,
      },
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Token tidak tersedia.');
        await updateEditableColumns(spreadsheetId, sheetName, rowIndex, values, token);
        addToast('success', 'Tersimpan', `Baris #${rowIndex} berhasil diupdate.`);
        await loadSpreadsheet(token, sheetName);
      },
    });
  };

  const handleRequestDeleteRow = (row: SheetRow) => {
    setConfirmModal({
      isOpen: true,
      title: `Kosongkan Baris #${row.rowIndex}?`,
      description: `Apakah Anda yakin ingin mengosongkan data untuk tanggal '${row.dateRef}' pada baris #${row.rowIndex}? Tindakan ini akan menghapus isi sel pada Google Sheet.`,
      actionLabel: 'Kosongkan Baris',
      isDestructive: true,
      onConfirm: async () => {
        const token = await getAccessToken();
        if (!token) throw new Error('Token tidak tersedia.');
        await clearSheetRow(spreadsheetId, sheetName, row.rowIndex, token);
        addToast('warning', 'Baris Dikosongkan', `Data baris #${row.rowIndex} telah dibersihkan dari sheet.`);
        await loadSpreadsheet(token, sheetName);
      },
    });
  };

  if (!authChecked || !user || !accessToken) {
    return (
      <AuthScreen
        onSignIn={handleSignIn}
        isLoading={isLoggingIn}
        errorMessage={loginError}
      />
    );
  }

  const effectiveMonthKey = selectedMonthKey === 'auto' ? (availableMonths[0]?.key || 'all') : selectedMonthKey;
  const availableSheetTitles = sheetMetadata?.sheets.map((s) => s.title) || [sheetName];

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Navbar */}
      <Navbar
        user={user}
        spreadsheetId={spreadsheetId}
        sheetTitle={sheetMetadata?.title || 'Penjualan Harian'}
        currentSheetName={sheetName}
        availableSheets={availableSheetTitles}
        isLoading={isLoadingData}
        activeView={activeView}
        onViewChange={setActiveView}
        onRefresh={() => loadSpreadsheet(accessToken, sheetName)}
        onSelectSheet={handleSelectSheet}
        onOpenNewEntry={handleOpenGeneralEntry}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner / Sheet Quick Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 shrink-0">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Sheet Aktif: {sheetName}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Tersinkronisasi
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Acuan Hari / Tanggal di <strong>Kolom 1</strong> • Kolom 2 s/d 7 siap diedit dan diisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenGeneralEntry}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Input Penjualan Harian</span>
            </button>
          </div>
        </div>

        {/* Stats & Key Metrics focusing on Active Month */}
        <StatsCards
          rows={rows}
          headers={headers}
          selectedMonthKey={effectiveMonthKey}
          availableMonths={availableMonths}
          onSelectMonth={setSelectedMonthKey}
          onOpenNewEntry={handleOpenGeneralEntry}
        />

        {/* View Switcher Bar */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-2 shadow-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveView('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeView === 'calendar'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <CalendarIcon className="w-4 h-4 text-emerald-600" />
              <span>Tampilan Kalender</span>
            </button>

            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeView === 'table'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <TableIcon className="w-4 h-4 text-emerald-600" />
              <span>Tabel Spreadsheet</span>
            </button>

            <button
              onClick={() => setActiveView('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ${
                activeView === 'analytics'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart2 className="w-4 h-4 text-emerald-600" />
              <span>Grafik Tren</span>
            </button>
          </div>

          <div className="hidden sm:block text-xs text-slate-500 pr-3">
            {activeView === 'calendar' && 'Klik tanggal pada kalender untuk input atau edit.'}
            {activeView === 'table' && 'Tabel data penjualan dengan pencarian dan edit baris.'}
            {activeView === 'analytics' && 'Visualisasi distribusi penjualan per kolom.'}
          </div>
        </div>

        {/* Main View: Calendar vs Table vs Analytics */}
        {activeView === 'calendar' && (
          <CalendarView
            rows={rows}
            headers={headers}
            selectedMonthKey={effectiveMonthKey}
            availableMonths={availableMonths}
            onSelectMonth={setSelectedMonthKey}
            onOpenDateEntry={handleOpenDateEntry}
            onOpenNewEntry={handleOpenGeneralEntry}
          />
        )}

        {activeView === 'table' && (
          <DataTable
            rows={rows}
            headers={headers}
            selectedMonthKey={effectiveMonthKey}
            availableMonths={availableMonths}
            onSelectMonth={setSelectedMonthKey}
            isLoading={isLoadingData}
            onEditRow={(row) => setEditingRow(row)}
            onDeleteRow={handleRequestDeleteRow}
            onQuickSaveRow={handleQuickSaveInline}
          />
        )}

        {activeView === 'analytics' && (
          <AnalyticsView
            rows={rows}
            headers={headers}
            selectedMonthKey={effectiveMonthKey}
            availableMonths={availableMonths}
            onSelectMonth={setSelectedMonthKey}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Editor Penjualan Harian • Terhubung ke Google Sheets API</span>
          <span className="font-mono text-[11px] text-slate-400">ID: {spreadsheetId}</span>
        </div>
      </footer>

      {/* Daily Entry Modal */}
      <DailyEntryModal
        isOpen={isEntryModalOpen}
        headers={headers}
        existingRows={rows}
        initialIsoDate={selectedDateForEntry}
        onClose={() => {
          setIsEntryModalOpen(false);
          setSelectedDateForEntry(undefined);
        }}
        onSubmit={handleRequestNewEntry}
      />

      {/* Edit Row Modal */}
      <EditRowModal
        isOpen={!!editingRow}
        row={editingRow}
        headers={headers}
        onClose={() => setEditingRow(null)}
        onSave={handleRequestEditRow}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        actionLabel={confirmModal.actionLabel}
        isDestructive={confirmModal.isDestructive}
        isLoading={confirmModal.isLoading}
        details={confirmModal.details}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          setConfirmModal((prev) => ({ ...prev, isLoading: true }));
          try {
            await confirmModal.onConfirm();
            setConfirmModal((prev) => ({ ...prev, isOpen: false, isLoading: false }));
          } catch (err: unknown) {
            console.error('Operation failed:', err);
            const msg = err instanceof Error ? err.message : 'Operasi gagal dieksekusi.';
            addToast('error', 'Gagal Memproses', msg);
            setConfirmModal((prev) => ({ ...prev, isLoading: false }));
          }
        }}
      />
    </div>
  );
}
