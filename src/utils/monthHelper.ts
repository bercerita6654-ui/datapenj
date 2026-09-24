export interface MonthOption {
  key: string; // e.g. "2026-09" or "September 2026"
  label: string; // e.g. "September 2026"
  monthIndex: number; // 0 to 11
  year: number;
  count: number;
}

export const INDO_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export const INDO_MONTH_NAMES = INDO_MONTHS;

const INDO_MONTHS_LOWER = INDO_MONTHS.map((m) => m.toLowerCase());

export const MONTH_ALIASES: Record<string, number> = {
  jan: 0,
  januari: 0,
  january: 0,
  feb: 1,
  februari: 1,
  february: 1,
  mar: 2,
  maret: 2,
  march: 2,
  apr: 3,
  april: 3,
  mei: 4,
  may: 4,
  jun: 5,
  juni: 5,
  june: 5,
  jul: 6,
  juli: 6,
  july: 6,
  agu: 7,
  agust: 7,
  agustus: 7,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  okt: 9,
  oktober: 9,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  des: 11,
  desember: 11,
  dec: 11,
  december: 11,
};

export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateID(isoOrDateStr: string): string {
  if (!isoOrDateStr) return '';
  const match = isoOrDateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const year = parseInt(match[1], 10);
    const monthIndex = parseInt(match[2], 10) - 1;
    const day = parseInt(match[3], 10);
    const monthName = INDO_MONTHS[monthIndex] || '';
    return `${day} ${monthName} ${year}`;
  }
  return isoOrDateStr;
}

export function parseIndonesianDateToISO(text: string): string | null {
  if (!text) return null;
  const trimmed = text.trim();

  // 1. ISO YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const d = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const d = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    const m = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // 3. Textual Indonesian date like "24 September 2026" or "Senin, 24 September 2026"
  const words = trimmed.toLowerCase().split(/[\s,./-]+/);
  let foundDay: number | null = null;
  let foundMonth: number | null = null;
  let foundYear: number | null = null;

  for (const word of words) {
    if (MONTH_ALIASES[word] !== undefined && foundMonth === null) {
      foundMonth = MONTH_ALIASES[word];
      continue;
    }
    const num = parseInt(word, 10);
    if (!isNaN(num)) {
      if (num >= 1900 && num <= 2100 && foundYear === null) {
        foundYear = num;
      } else if (num >= 1 && num <= 31 && foundDay === null) {
        foundDay = num;
      }
    }
  }

  if (foundMonth !== null) {
    const y = foundYear || new Date().getFullYear();
    const m = String(foundMonth + 1).padStart(2, '0');
    const d = String(foundDay || 1).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Extract Month and Year from a date string
 */
export function extractMonthYear(dateStr: string): { key: string; label: string; year: number; monthIndex: number } | null {
  if (!dateStr || typeof dateStr !== 'string') return null;

  const text = dateStr.trim();
  if (!text) return null;

  // 1. Try ISO YYYY-MM-DD or YYYY-MM
  const isoMatch = text.match(/(\d{4})[-/.](\d{1,2})[-/.]?(\d{1,2})?/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const monthIndex = parseInt(isoMatch[2], 10) - 1;
    if (monthIndex >= 0 && monthIndex <= 11 && year > 1900 && year < 2100) {
      const monthLabel = INDO_MONTHS[monthIndex];
      return {
        key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
        label: `${monthLabel} ${year}`,
        year,
        monthIndex,
      };
    }
  }

  // 2. Try DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = text.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const monthIndex = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    if (monthIndex >= 0 && monthIndex <= 11 && year > 1900 && year < 2100) {
      const monthLabel = INDO_MONTHS[monthIndex];
      return {
        key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
        label: `${monthLabel} ${year}`,
        year,
        monthIndex,
      };
    }
  }

  // 3. Search for textual month name & year in string (e.g. "24 September 2026" or "Senin, 1 Okt 2026")
  const words = text.toLowerCase().split(/[\s,./-]+/);
  let detectedMonth: number | null = null;
  let detectedYear: number | null = null;

  for (const word of words) {
    if (MONTH_ALIASES[word] !== undefined && detectedMonth === null) {
      detectedMonth = MONTH_ALIASES[word];
    }
    const num = parseInt(word, 10);
    if (!isNaN(num) && num >= 2020 && num <= 2050 && detectedYear === null) {
      detectedYear = num;
    }
  }

  // If month is found but no year, default to current year
  const currentYear = new Date().getFullYear();
  if (detectedMonth !== null) {
    const year = detectedYear || currentYear;
    const monthLabel = INDO_MONTHS[detectedMonth];
    return {
      key: `${year}-${String(detectedMonth + 1).padStart(2, '0')}`,
      label: `${monthLabel} ${year}`,
      year,
      monthIndex: detectedMonth,
    };
  }

  // 4. Try Standard JS Date parse fallback
  const parsedDate = new Date(text);
  if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000) {
    const monthIndex = parsedDate.getMonth();
    const year = parsedDate.getFullYear();
    const monthLabel = INDO_MONTHS[monthIndex];
    return {
      key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
      label: `${monthLabel} ${year}`,
      year,
      monthIndex,
    };
  }

  return null;
}

/**
 * Get current system active month
 */
export function getCurrentActiveMonth(): { key: string; label: string; year: number; monthIndex: number } {
  const now = new Date();
  const year = now.getFullYear();
  const monthIndex = now.getMonth();
  return {
    key: `${year}-${String(monthIndex + 1).padStart(2, '0')}`,
    label: `${INDO_MONTHS[monthIndex]} ${year}`,
    year,
    monthIndex,
  };
}

/**
 * Extract list of unique months available from rows, sorted latest first
 */
export function getAvailableMonthsFromRows(
  rows: { dateRef: string }[]
): MonthOption[] {
  const map = new Map<string, MonthOption>();

  rows.forEach((row) => {
    const my = extractMonthYear(row.dateRef);
    if (my) {
      const existing = map.get(my.key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(my.key, {
          key: my.key,
          label: my.label,
          monthIndex: my.monthIndex,
          year: my.year,
          count: 1,
        });
      }
    }
  });

  const list = Array.from(map.values());
  // Sort descending: year then monthIndex
  list.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.monthIndex - a.monthIndex;
  });

  return list;
}

/**
 * Filter rows for a given active month key (e.g. '2026-09' or 'all')
 */
export function filterRowsByMonth<T extends { dateRef: string }>(
  rows: T[],
  monthKey: string
): T[] {
  if (monthKey === 'all') return rows;

  return rows.filter((row) => {
    const my = extractMonthYear(row.dateRef);
    if (!my) return false;
    return my.key === monthKey;
  });
}
