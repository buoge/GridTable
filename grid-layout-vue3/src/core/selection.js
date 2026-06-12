import { getPositionFromSlot, getSlotIndex } from './schema.js';

export function getRectangularSelection(fromSlot, toSlot, columnCount) {
  const from = getPositionFromSlot(fromSlot, columnCount);
  const to = getPositionFromSlot(toSlot, columnCount);
  const minRow = Math.min(from.rowIndex, to.rowIndex);
  const maxRow = Math.max(from.rowIndex, to.rowIndex);
  const minColumn = Math.min(from.columnIndex, to.columnIndex);
  const maxColumn = Math.max(from.columnIndex, to.columnIndex);
  const slots = [];

  for (let rowIndex = minRow; rowIndex <= maxRow; rowIndex += 1) {
    for (let columnIndex = minColumn; columnIndex <= maxColumn; columnIndex += 1) {
      slots.push(getSlotIndex(rowIndex, columnIndex, columnCount));
    }
  }

  return slots;
}

export function getSelectionBounds(slots = [], columnCount) {
  if (!slots.length) {
    return null;
  }
  const positions = slots.map(slot => getPositionFromSlot(slot, columnCount));
  const rows = positions.map(position => position.rowIndex);
  const columns = positions.map(position => position.columnIndex);
  const minRow = Math.min(...rows);
  const maxRow = Math.max(...rows);
  const minColumn = Math.min(...columns);
  const maxColumn = Math.max(...columns);
  const expectedSize = (maxRow - minRow + 1) * (maxColumn - minColumn + 1);
  if (expectedSize !== new Set(slots).size) {
    return null;
  }
  return {
    minRow,
    maxRow,
    minColumn,
    maxColumn,
    rowSpan: maxRow - minRow + 1,
    colSpan: maxColumn - minColumn + 1,
    startSlot: getSlotIndex(minRow, minColumn, columnCount),
  };
}
