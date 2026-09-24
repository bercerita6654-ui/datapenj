export interface SheetRow {
  rowIndex: number; // 1-based index corresponding to actual Google Sheet row (e.g., 2, 3, ...)
  dateRef: string; // Column 1 (Col A) - Reference date/day
  col2: string; // Column 2 (Col B)
  col3: string; // Column 3 (Col C)
  col4: string; // Column 4 (Col D)
  col5: string; // Column 5 (Col E)
  col6: string; // Column 6 (Col F)
  col7: string; // Column 7 (Col G)
  extraCols?: string[]; // Any columns beyond col 7
  raw: string[];
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    index: number;
    rowCount?: number;
    columnCount?: number;
  }[];
}

export interface SheetHeaderConfig {
  col1Name: string; // Header for Col 1 (Date)
  col2Name: string; // Header for Col 2
  col3Name: string; // Header for Col 3
  col4Name: string; // Header for Col 4
  col5Name: string; // Header for Col 5
  col6Name: string; // Header for Col 6
  col7Name: string; // Header for Col 7
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
