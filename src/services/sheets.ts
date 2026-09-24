import { SheetHeaderConfig, SheetMetadata, SheetRow } from '../types/sheets';

export const DEFAULT_SPREADSHEET_ID = '1HSUiF20wpTJbfYdpOE08gtbRzm1N8IXOrZDs-KGSvnI';
export const DEFAULT_SHEET_NAME = 'Penjualan Harian';

interface GoogleSheetResponse {
  values?: string[][];
  range?: string;
  majorDimension?: string;
}

export class SheetsApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SheetsApiError';
    this.status = status;
  }
}

/**
 * Fetch spreadsheet metadata (title, list of sheets)
 */
export async function getSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken: string
): Promise<SheetMetadata> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}?fields=properties.title,sheets.properties`;
  
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Gagal memuat metadata spreadsheet (Status ${response.status})`;
    throw new SheetsApiError(message, response.status);
  }

  const data = await response.json();
  return {
    spreadsheetId,
    title: data.properties?.title || 'Spreadsheet',
    sheets: (data.sheets || []).map((s: { properties: { sheetId: number; title: string; index: number; gridProperties?: { rowCount?: number; columnCount?: number } } }) => ({
      sheetId: s.properties.sheetId,
      title: s.properties.title,
      index: s.properties.index,
      rowCount: s.properties.gridProperties?.rowCount,
      columnCount: s.properties.gridProperties?.columnCount,
    })),
  };
}

/**
 * Fetch all values from a sheet
 */
export async function fetchSheetData(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string
): Promise<{
  headers: SheetHeaderConfig;
  rows: SheetRow[];
  rawHeaders: string[];
}> {
  // Fetch columns A through Z
  const range = `'${sheetName.replace(/'/g, "''")}'!A1:Z1000`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueRenderOption=FORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Gagal mengambil data sheet '${sheetName}' (Status ${response.status})`;
    throw new SheetsApiError(message, response.status);
  }

  const data: GoogleSheetResponse = await response.json();
  const rawValues = data.values || [];

  if (rawValues.length === 0) {
    return {
      headers: {
        col1Name: 'Hari / Tanggal (Kolom 1)',
        col2Name: 'Kolom 2',
        col3Name: 'Kolom 3',
        col4Name: 'Kolom 4',
        col5Name: 'Kolom 5',
        col6Name: 'Kolom 6',
        col7Name: 'Kolom 7',
      },
      rows: [],
      rawHeaders: [],
    };
  }

  const headerRow = rawValues[0] || [];
  const headers: SheetHeaderConfig = {
    col1Name: headerRow[0] || 'Hari / Tanggal (Kolom 1)',
    col2Name: headerRow[1] || 'Kolom 2',
    col3Name: headerRow[2] || 'Kolom 3',
    col4Name: headerRow[3] || 'Kolom 4',
    col5Name: headerRow[4] || 'Kolom 5',
    col6Name: headerRow[5] || 'Kolom 6',
    col7Name: headerRow[6] || 'Kolom 7',
  };

  const rows: SheetRow[] = [];

  for (let i = 1; i < rawValues.length; i++) {
    const row = rawValues[i];
    // Check if row has any content
    const hasData = row.some((cell) => cell !== undefined && cell !== null && cell.trim() !== '');
    if (!hasData) continue;

    rows.push({
      rowIndex: i + 1, // 1-based index in Sheet (Row 1 is header, Row 2 is first data row)
      dateRef: (row[0] || '').trim(),
      col2: (row[1] || '').trim(),
      col3: (row[2] || '').trim(),
      col4: (row[3] || '').trim(),
      col5: (row[4] || '').trim(),
      col6: (row[5] || '').trim(),
      col7: (row[6] || '').trim(),
      extraCols: row.slice(7),
      raw: row,
    });
  }

  return {
    headers,
    rows,
    rawHeaders: headerRow,
  };
}

/**
 * Update editable columns 2 to 7 (Columns B to G) for a specific row in the Google Sheet.
 * (Column 1 is preserved as the date reference)
 */
export async function updateEditableColumns(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  values: {
    col2: string;
    col3: string;
    col4: string;
    col5: string;
    col6: string;
    col7: string;
  },
  accessToken: string,
  includeDate?: string // Optional if user also wants to edit date reference
): Promise<void> {
  const sanitizedSheet = sheetName.replace(/'/g, "''");
  
  if (includeDate !== undefined) {
    // Range A to G
    const range = `'${sanitizedSheet}'!A${rowIndex}:G${rowIndex}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [[
          includeDate,
          values.col2 || '',
          values.col3 || '',
          values.col4 || '',
          values.col5 || '',
          values.col6 || '',
          values.col7 || '',
        ]],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || `Gagal mengupdate baris #${rowIndex} (Status ${response.status})`;
      throw new SheetsApiError(message, response.status);
    }
  } else {
    // Range B to G (preserving Column 1 Date)
    const range = `'${sanitizedSheet}'!B${rowIndex}:G${rowIndex}`;
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: [[
          values.col2 || '',
          values.col3 || '',
          values.col4 || '',
          values.col5 || '',
          values.col6 || '',
          values.col7 || '',
        ]],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const message = errorData?.error?.message || `Gagal mengupdate baris #${rowIndex} (Status ${response.status})`;
      throw new SheetsApiError(message, response.status);
    }
  }
}

/**
 * Append a new daily record row to the sheet
 */
export async function appendDailyRecord(
  spreadsheetId: string,
  sheetName: string,
  dateRef: string,
  values: {
    col2: string;
    col3: string;
    col4: string;
    col5: string;
    col6: string;
    col7: string;
  },
  accessToken: string
): Promise<void> {
  const sanitizedSheet = sheetName.replace(/'/g, "''");
  const range = `'${sanitizedSheet}'!A:G`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range,
      majorDimension: 'ROWS',
      values: [[
        dateRef,
        values.col2 || '',
        values.col3 || '',
        values.col4 || '',
        values.col5 || '',
        values.col6 || '',
        values.col7 || '',
      ]],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Gagal menambah data baru ke sheet (Status ${response.status})`;
    throw new SheetsApiError(message, response.status);
  }
}

/**
 * Clear data of a specific row in the sheet
 */
export async function clearSheetRow(
  spreadsheetId: string,
  sheetName: string,
  rowIndex: number,
  accessToken: string
): Promise<void> {
  const sanitizedSheet = sheetName.replace(/'/g, "''");
  const range = `'${sanitizedSheet}'!A${rowIndex}:G${rowIndex}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.error?.message || `Gagal mengosongkan baris #${rowIndex} (Status ${response.status})`;
    throw new SheetsApiError(message, response.status);
  }
}

/**
 * Helper to parse numbers and currency properly handling Indonesian locale (dots as thousand separators, commas as decimals)
 * as well as standard/US formats without dropping trailing zeros or decimal places.
 */
export function parseNumericValue(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;

  let str = val.toString().trim();
  if (!str || str === '-' || str === 'NaN') return 0;

  // Check negative in parentheses like (1.000) or leading minus
  const isNegative = str.startsWith('-') || /^\(.*\)$/.test(str);

  // Remove currency prefixes/suffixes like Rp, IDR, $, €, and parentheses
  str = str.replace(/^(Rp\.?|IDR|\$|€|USD)\s*/i, '');
  str = str.replace(/[()]/g, '');
  str = str.replace(/\s+/g, '');

  const hasComma = str.includes(',');
  const hasDot = str.includes('.');

  let normalized = '';

  if (hasDot && hasComma) {
    // Both dot and comma exist, e.g. "1.500.000,50" (Indonesian) vs "1,500,000.50" (US)
    const lastDotIndex = str.lastIndexOf('.');
    const lastCommaIndex = str.lastIndexOf(',');

    if (lastCommaIndex > lastDotIndex) {
      // Indonesian format: dots are thousands, comma is decimal -> "1.500.000,50"
      normalized = str.replace(/\./g, '').replace(',', '.');
    } else {
      // US format: commas are thousands, dot is decimal -> "1,500,000.50"
      normalized = str.replace(/,/g, '');
    }
  } else if (hasDot && !hasComma) {
    // Only dot(s) exist
    const dotCount = (str.match(/\./g) || []).length;
    if (dotCount > 1) {
      // Multiple dots: e.g. "1.500.000" or "25.000.000" -> thousand separators
      normalized = str.replace(/\./g, '');
    } else {
      // Single dot: e.g. "500.000", "1.500", "12.50", "1.5"
      const parts = str.split('.');
      const afterDot = parts[1] || '';
      // If exactly 3 digits after dot (e.g. 500.000, 1.000, 25.000) -> Indonesian thousand separator
      if (afterDot.length === 3 && parts[0].length >= 1) {
        normalized = str.replace('.', '');
      } else {
        // Decimal e.g. "1.5" or "12.50" or "0.75"
        normalized = str;
      }
    }
  } else if (hasComma && !hasDot) {
    // Only comma(s) exist
    const commaCount = (str.match(/,/g) || []).length;
    if (commaCount > 1) {
      // Multiple commas: e.g. "1,500,000" -> thousand separators
      normalized = str.replace(/,/g, '');
    } else {
      // Single comma: e.g. "1,500" or "500,00" or "12,5"
      const parts = str.split(',');
      const afterComma = parts[1] || '';
      if (afterComma.length === 3 && parts[0].length >= 1) {
        // e.g. "1,500" -> US thousand
        normalized = str.replace(',', '');
      } else {
        // Indonesian decimal: "150,50" or "12,5" -> "150.50"
        normalized = str.replace(',', '.');
      }
    }
  } else {
    // Plain number string: "1500000"
    normalized = str;
  }

  // Strip anything remaining that isn't a digit, dot, or minus
  normalized = normalized.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(normalized);
  if (isNaN(parsed)) return 0;
  return isNegative ? -Math.abs(parsed) : parsed;
}

export function formatIndonesianCurrency(amount: number): string {
  if (isNaN(amount) || amount === 0) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatNumberLocale(amount: number): string {
  if (isNaN(amount)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/**
 * Formats a number input string in real-time as the user types with thousand dots (.)
 * Example: typing "390000" -> becomes "390.000"
 * Example: typing "1500000" -> becomes "1.500.000"
 */
export function formatNumberInput(value: string): string {
  if (!value) return '';

  const trimmed = value.trim();
  if (trimmed === '' || trimmed === '-') return trimmed;

  const isNegative = trimmed.startsWith('-');
  let clean = trimmed.replace(/^-/, '').replace(/\s+/g, '');

  // If decimal comma is present (e.g. "390000,50")
  if (clean.includes(',')) {
    const parts = clean.split(',');
    const integerPart = parts[0].replace(/\D/g, '');
    const decimalPart = parts.slice(1).join('').replace(/\D/g, '');
    const formattedInteger = integerPart ? integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0';
    const result = `${formattedInteger},${decimalPart}`;
    return isNegative ? `-${result}` : result;
  }

  // Pure digits or already dotted
  const digitsOnly = clean.replace(/\D/g, '');
  if (!digitsOnly) return isNegative ? '-' : '';

  const formatted = digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return isNegative ? `-${formatted}` : formatted;
}

