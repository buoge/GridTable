export const DEFAULT_COLUMN_WIDTHS = [240, 240, 240];
export const DEFAULT_ROW_NUM = 3;
export const DEFAULT_ROW_HEIGHT = 48;
export const MIN_COLUMN_WIDTH = 120;
export const MAX_COLUMN_WIDTH = 1200;
export const MAX_COLUMN_COUNT = 20;
export const MAX_ROW_COUNT = 100;

export function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function normalizeColumnWidth(width) {
  const nextWidth = Number(width);
  if (!Number.isFinite(nextWidth)) {
    return DEFAULT_COLUMN_WIDTHS[0];
  }
  return Math.min(MAX_COLUMN_WIDTH, Math.max(MIN_COLUMN_WIDTH, Math.round(nextWidth)));
}

export function getColumnCount(schema) {
  return normalizeGridLayout(schema).columnWidths.length;
}

export function getCellKey(rowIndex, columnIndex) {
  return `${rowIndex}:${columnIndex}`;
}

export function getSlotIndex(rowIndex, columnIndex, columnCount) {
  return rowIndex * columnCount + columnIndex;
}

export function getCellKeyFromSlot(slotIndex, columnCount) {
  const rowIndex = Math.floor(slotIndex / columnCount);
  const columnIndex = slotIndex % columnCount;
  return getCellKey(rowIndex, columnIndex);
}

export function getPositionFromSlot(slotIndex, columnCount) {
  return {
    rowIndex: Math.floor(slotIndex / columnCount),
    columnIndex: slotIndex % columnCount,
  };
}

export function normalizeGridLayout(schema = {}) {
  const columnWidths =
    Array.isArray(schema.columnWidths) && schema.columnWidths.length
      ? schema.columnWidths.map(normalizeColumnWidth)
      : [...DEFAULT_COLUMN_WIDTHS];
  const columnCount = columnWidths.length;
  const rowNum = Number(schema.rowNum) > 0 ? Math.round(Number(schema.rowNum)) : DEFAULT_ROW_NUM;
  const headerLabels = Array.from(
    { length: columnCount },
    (_, index) => schema.headerLabels?.[index] || `Column ${index + 1}`,
  );
  const cells = normalizeCells(schema.cells || {}, rowNum, columnCount);

  return {
    label: schema.label || 'Grid Table',
    showColumnHeader: schema.showColumnHeader !== false,
    columnWidths,
    rowNum,
    headerLabels,
    cells,
    components: schema.components && typeof schema.components === 'object' ? clone(schema.components) : {},
  };
}

export function normalizeCells(cells = {}, rowNum, columnCount) {
  return Object.entries(cells).reduce((nextCells, [key, cell]) => {
    const [rowIndex, columnIndex] = key.split(':').map(Number);
    if (
      !Number.isInteger(rowIndex) ||
      !Number.isInteger(columnIndex) ||
      rowIndex < 0 ||
      columnIndex < 0 ||
      rowIndex >= rowNum ||
      columnIndex >= columnCount
    ) {
      return nextCells;
    }

    const normalizedCell = {};
    if (Array.isArray(cell.componentIds) && cell.componentIds.length) {
      normalizedCell.componentIds = [cell.componentIds[0]];
    }
    if (cell.backgroundColor) {
      normalizedCell.backgroundColor = cell.backgroundColor;
    }
    const maxColSpan = columnCount - columnIndex;
    const maxRowSpan = rowNum - rowIndex;
    const colSpan = Math.min(Number(cell.colSpan) || 1, maxColSpan);
    const rowSpan = Math.min(Number(cell.rowSpan) || 1, maxRowSpan);
    if (colSpan > 1) {
      normalizedCell.colSpan = colSpan;
    }
    if (rowSpan > 1) {
      normalizedCell.rowSpan = rowSpan;
    }
    if (Object.keys(normalizedCell).length) {
      nextCells[key] = normalizedCell;
    }
    return nextCells;
  }, {});
}

export function getCoveredCellKeys(schema) {
  const normalized = normalizeGridLayout(schema);
  const covered = new Set();
  Object.entries(normalized.cells).forEach(([key, cell]) => {
    const [rowIndex, columnIndex] = key.split(':').map(Number);
    const colSpan = Number(cell.colSpan) || 1;
    const rowSpan = Number(cell.rowSpan) || 1;
    for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
      for (let columnOffset = 0; columnOffset < colSpan; columnOffset += 1) {
        if (rowOffset === 0 && columnOffset === 0) {
          continue;
        }
        covered.add(getCellKey(rowIndex + rowOffset, columnIndex + columnOffset));
      }
    }
  });
  return covered;
}
