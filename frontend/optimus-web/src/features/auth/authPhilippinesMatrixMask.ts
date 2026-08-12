import {
  PH_MATRIX_COLS,
  PH_MATRIX_ROWS,
  PH_MATRIX_ROWS_DATA,
} from './authPhilippinesMatrixData';

export type MatrixCell = {
  land: boolean;
};

export function buildPhilippinesMatrix(
  cols = PH_MATRIX_COLS,
  rows = PH_MATRIX_ROWS,
): MatrixCell[][] {
  const grid: MatrixCell[][] = [];

  for (let row = 0; row < rows; row += 1) {
    const rowData = PH_MATRIX_ROWS_DATA[row] ?? '';
    grid[row] = [];

    for (let col = 0; col < cols; col += 1) {
      grid[row][col] = { land: rowData[col] === '1' };
    }
  }

  return grid;
}

export { PH_MATRIX_COLS, PH_MATRIX_ROWS };
