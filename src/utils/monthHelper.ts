export interface MonthOption {
  key: string; // e.g. "2026-09" or "September 2026"
  label: string; // e.g. "September 2026"
  monthIndex: number; // 0 to 11
  year: number;
  count: number;
}

const INDO_MONTHS = [
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

const INDO_MONTHS_LOWER = INDO_MONTHS.map((m) => m.toLowerCase());

const MONTH_ALIASES: Record<string, number> = {
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
