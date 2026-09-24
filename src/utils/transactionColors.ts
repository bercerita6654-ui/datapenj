export type TransactionType = 'instan' | 'reguler' | 'manual' | 'neutral';

export interface CategoryTheme {
  type: TransactionType;
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  cardBg: string;
  cardBorder: string;
  glowColor: string;
  chartColor: string;
  barGradient: string;
  iconName: string;
}

export const TRANSACTION_THEMES: Record<TransactionType, CategoryTheme> = {
  instan: {
    type: 'instan',
    label: 'TRANSAKSI INSTAN',
    badgeBg: 'bg-amber-50',
    badgeText: 'text-amber-800',
    badgeBorder: 'border-amber-300',
    cardBg: 'bg-amber-50/70',
    cardBorder: 'border-amber-200 hover:border-amber-400',
    glowColor: 'shadow-amber-500/10',
    chartColor: '#d97706',
    barGradient: 'from-amber-500 to-amber-400',
    iconName: 'zap',
  },
  reguler: {
    type: 'reguler',
    label: 'TRANSAKSI REGULER',
    badgeBg: 'bg-sky-50',
    badgeText: 'text-sky-800',
    badgeBorder: 'border-sky-300',
    cardBg: 'bg-sky-50/70',
    cardBorder: 'border-sky-200 hover:border-sky-400',
    glowColor: 'shadow-sky-500/10',
    chartColor: '#0284c7',
    barGradient: 'from-sky-500 to-sky-400',
    iconName: 'package',
  },
  manual: {
    type: 'manual',
    label: 'TRANSAKSI MANUAL',
    badgeBg: 'bg-purple-50',
    badgeText: 'text-purple-800',
    badgeBorder: 'border-purple-300',
    cardBg: 'bg-purple-50/70',
    cardBorder: 'border-purple-200 hover:border-purple-400',
    glowColor: 'shadow-purple-500/10',
    chartColor: '#9333ea',
    barGradient: 'from-purple-500 to-purple-400',
    iconName: 'pen-tool',
  },
  neutral: {
    type: 'neutral',
    label: 'DATA',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    badgeBorder: 'border-slate-200',
    cardBg: 'bg-white',
    cardBorder: 'border-slate-200',
    glowColor: 'shadow-slate-500/5',
    chartColor: '#4f46e5',
    barGradient: 'from-indigo-600 to-indigo-400',
    iconName: 'file-text',
  },
};

/**
 * Detect transaction category from column header name or cell content
 */
export function detectTransactionCategory(text: string, colIndex?: number): TransactionType {
  if (!text) {
    if (colIndex === 2 || colIndex === 3) return 'instan';
    if (colIndex === 4 || colIndex === 5) return 'reguler';
    if (colIndex === 6 || colIndex === 7) return 'manual';
    return 'neutral';
  }

  const normalized = text.toLowerCase();

  if (
    normalized.includes('instan') ||
    normalized.includes('instant') ||
    normalized.includes('kilat') ||
    normalized.includes('express') ||
    normalized.includes('qris')
  ) {
    return 'instan';
  }

  if (
    normalized.includes('reguler') ||
    normalized.includes('regular') ||
    normalized.includes('standar') ||
    normalized.includes('normal') ||
    normalized.includes('transfer')
  ) {
    return 'reguler';
  }

  if (
    normalized.includes('manual') ||
    normalized.includes('tunai') ||
    normalized.includes('cash') ||
    normalized.includes('kasir') ||
    normalized.includes('offline')
  ) {
    return 'manual';
  }

  // Fallback based on column index if provided
  if (colIndex !== undefined) {
    if (colIndex === 2 || colIndex === 3) return 'instan';
    if (colIndex === 4 || colIndex === 5) return 'reguler';
    if (colIndex === 6 || colIndex === 7) return 'manual';
  }

  return 'neutral';
}
