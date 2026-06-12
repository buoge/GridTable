import {
  MAX_COLUMN_COUNT,
  MAX_ROW_COUNT,
  clone,
  getCellKey,
  getCellKeyFromSlot,
  getColumnCount,
  getPositionFromSlot,
  normalizeColumnWidth,
  normalizeGridLayout,
} from './schema.js';
import { getSelectionBounds } from './selection.js';

export function updateHeaderLabel(schema, columnIndex, label) {
  const next = normalizeGridLayout(schema);
  next.headerLabels[columnIndex] = label;
  return next;
}

export function resizeColumn(schema, columnIndex, width) {
  const next = normalizeGridLayout(schema);
  const index = Math.max(0, Math.min(columnIndex, next.columnWidths.length - 1));
  next.columnWidths[index] = normalizeColumnWidth(width);
  return next;
}

export function addRow(schema, insertIndex = null) {
  const next = normalizeGridLayout(schema);
  if (next.rowNum >= MAX_ROW_COUNT) {
    return next;
  }
  const columnCount = getColumnCount(next);
  const insertAt = insertIndex === null ? next.rowNum : Math.max(0, Math.min(insertIndex, next.rowNum));
  const nextCells = {};
  Object.entries(next.cells).forEach(([key, cell]) => {
    const [rowIndex, columnIndex] = key.split(':').map(Number);
    const row = rowIndex >= insertAt ? rowIndex + 1 : rowIndex;
    nextCells[getCellKey(row, columnIndex)] = cell;
  });
  next.rowNum += 1;
  next.cells = nextCells;
  return normalizeGridLayout({ ...next, columnWidths: next.columnWidths.slice(0, columnCount) });
}

export function deleteRow(schema, rowIndex) {
  const next = normalizeGridLayout(schema);
  if (next.rowNum <= 1) {
    return next;
  }
  const deleteIndex = Math.max(0, Math.min(rowIndex, next.rowNum - 1));
  const nextCells = {};
  Object.entries(next.cells).forEach(([key, cell]) => {
    const [cellRow, columnIndex] = key.split(':').map(Number);
    if (cellRow < deleteIndex) {
      nextCells[key] = cell;
    }
    if (cellRow > deleteIndex) {
      nextCells[getCellKey(cellRow - 1, columnIndex)] = cell;
    }
  });
  next.rowNum -= 1;
  next.cells = nextCells;
  return normalizeGridLayout(next);
}

export function addColumn(schema, insertIndex = null) {
  const next = normalizeGridLayout(schema);
  const oldColumnCount = getColumnCount(next);
  if (oldColumnCount >= MAX_COLUMN_COUNT) {
    return next;
  }
  const insertAt = insertIndex === null ? oldColumnCount : Math.max(0, Math.min(insertIndex, oldColumnCount));
  next.columnWidths.splice(insertAt, 0, next.columnWidths[insertAt - 1] || 240);
  next.headerLabels.splice(insertAt, 0, `Column ${insertAt + 1}`);
  const nextCells = {};
  Object.entries(next.cells).forEach(([key, cell]) => {
    const [rowIndex, columnIndex] = key.split(':').map(Number);
    const column = columnIndex >= insertAt ? columnIndex + 1 : columnIndex;
    nextCells[getCellKey(rowIndex, column)] = cell;
  });
  next.cells = nextCells;
  return normalizeGridLayout(next);
}

export function deleteColumn(schema, columnIndex) {
  const next = normalizeGridLayout(schema);
  const oldColumnCount = getColumnCount(next);
  if (oldColumnCount <= 1) {
    return next;
  }
  const deleteIndex = Math.max(0, Math.min(columnIndex, oldColumnCount - 1));
  next.columnWidths.splice(deleteIndex, 1);
  next.headerLabels.splice(deleteIndex, 1);
  const nextCells = {};
  Object.entries(next.cells).forEach(([key, cell]) => {
    const [rowIndex, cellColumn] = key.split(':').map(Number);
    if (cellColumn < deleteIndex) {
      nextCells[key] = cell;
    }
    if (cellColumn > deleteIndex) {
      nextCells[getCellKey(rowIndex, cellColumn - 1)] = cell;
    }
  });
  next.cells = nextCells;
  return normalizeGridLayout(next);
}

export function duplicateRow(schema, rowIndex) {
  const next = addRow(schema, rowIndex + 1);
  const normalized = normalizeGridLayout(schema);
  if (normalized.rowNum >= MAX_ROW_COUNT) {
    return next;
  }
  const nextCells = clone(next.cells);
  const nextComponents = clone(next.components);
  Object.entries(normalized.cells).forEach(([key, cell]) => {
    const [cellRow, columnIndex] = key.split(':').map(Number);
    if (cellRow === rowIndex) {
      nextCells[getCellKey(rowIndex + 1, columnIndex)] = cloneCellWithCopiedComponents(cell, nextComponents);
    }
  });
  next.cells = nextCells;
  next.components = nextComponents;
  return normalizeGridLayout(next);
}

export function duplicateColumn(schema, columnIndex) {
  const next = addColumn(schema, columnIndex + 1);
  const normalized = normalizeGridLayout(schema);
  if (getColumnCount(normalized) >= MAX_COLUMN_COUNT) {
    return next;
  }
  const nextCells = clone(next.cells);
  const nextComponents = clone(next.components);
  Object.entries(normalized.cells).forEach(([key, cell]) => {
    const [rowIndex, cellColumn] = key.split(':').map(Number);
    if (cellColumn === columnIndex) {
      nextCells[getCellKey(rowIndex, columnIndex + 1)] = cloneCellWithCopiedComponents(cell, nextComponents);
    }
  });
  next.cells = nextCells;
  next.components = nextComponents;
  return normalizeGridLayout(next);
}

export function mergeCells(schema, slots = []) {
  const next = normalizeGridLayout(schema);
  const columnCount = getColumnCount(next);
  const bounds = getSelectionBounds(slots, columnCount);
  if (!bounds || (bounds.rowSpan === 1 && bounds.colSpan === 1)) {
    return next;
  }
  const startKey = getCellKeyFromSlot(bounds.startSlot, columnCount);
  const startCell = clone(next.cells[startKey] || {});
  slots.forEach(slot => {
    delete next.cells[getCellKeyFromSlot(slot, columnCount)];
  });
  next.cells[startKey] = {
    ...startCell,
    colSpan: bounds.colSpan,
    rowSpan: bounds.rowSpan,
  };
  return normalizeGridLayout(next);
}

export function unmergeCell(schema, slotIndex) {
  const next = normalizeGridLayout(schema);
  const key = getCellKeyFromSlot(slotIndex, getColumnCount(next));
  if (!next.cells[key]) {
    return next;
  }
  delete next.cells[key].colSpan;
  delete next.cells[key].rowSpan;
  return normalizeGridLayout(next);
}

export function setCellBackground(schema, slots = [], backgroundColor = '') {
  const next = normalizeGridLayout(schema);
  const columnCount = getColumnCount(next);
  slots.forEach(slot => {
    const key = getCellKeyFromSlot(slot, columnCount);
    next.cells[key] = next.cells[key] || {};
    if (backgroundColor) {
      next.cells[key].backgroundColor = backgroundColor;
    } else {
      delete next.cells[key].backgroundColor;
    }
  });
  return normalizeGridLayout(next);
}

export function addMockComponentToCell(schema, slotIndex, paletteItem) {
  const next = normalizeGridLayout(schema);
  const columnCount = getColumnCount(next);
  const key = getCellKeyFromSlot(slotIndex, columnCount);
  const position = getPositionFromSlot(slotIndex, columnCount);
  const id = `mock-${paletteItem.type}-${Date.now()}-${position.rowIndex}-${position.columnIndex}`;
  next.components[id] = {
    id,
    type: paletteItem.type,
    label: paletteItem.label,
    value: paletteItem.defaultValue || '',
  };
  next.cells[key] = {
    ...(next.cells[key] || {}),
    componentIds: [id],
  };
  return normalizeGridLayout(next);
}

function cloneCellWithCopiedComponents(cell, components) {
  const nextCell = clone(cell);
  if (!Array.isArray(cell.componentIds) || !cell.componentIds.length) {
    return nextCell;
  }

  const sourceId = cell.componentIds[0];
  const sourceComponent = components[sourceId];
  if (!sourceComponent) {
    return nextCell;
  }

  const copiedId = createCopiedComponentId(sourceId, components);
  components[copiedId] = {
    ...clone(sourceComponent),
    id: copiedId,
  };
  nextCell.componentIds = [copiedId];
  return nextCell;
}

function createCopiedComponentId(sourceId, components) {
  let index = 1;
  let id = `${sourceId}-copy`;
  while (components[id]) {
    index += 1;
    id = `${sourceId}-copy-${index}`;
  }
  return id;
}
