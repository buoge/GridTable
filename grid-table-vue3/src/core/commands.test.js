import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addColumn,
  addMockComponentToCell,
  addRow,
  deleteColumn,
  deleteRow,
  duplicateColumn,
  duplicateRow,
  mergeCells,
  resizeColumn,
  setCellBackground,
  unmergeCell,
  updateHeaderLabel,
} from './commands.js';
import { getCellKeyFromSlot, normalizeGridLayout } from './schema.js';

function createSchema() {
  return normalizeGridLayout({
    label: 'Grid Layout',
    columnWidths: [200, 240],
    rowNum: 2,
    headerLabels: ['A', 'B'],
    cells: {
      '0:0': { componentIds: ['component-a'], backgroundColor: '#fff6d8' },
      '1:1': { componentIds: ['component-b'] },
    },
    components: {
      'component-a': { id: 'component-a', type: 'text', label: 'A', value: 'Alpha' },
      'component-b': { id: 'component-b', type: 'text', label: 'B', value: 'Beta' },
    },
  });
}

test('updates header labels and clamps column resize', () => {
  const schema = resizeColumn(updateHeaderLabel(createSchema(), 1, 'Updated'), 0, 80);

  assert.equal(schema.headerLabels[1], 'Updated');
  assert.equal(schema.columnWidths[0], 120);
});

test('adds and deletes rows while shifting cells', () => {
  const added = addRow(createSchema(), 1);
  assert.equal(added.rowNum, 3);
  assert.deepEqual(added.cells['2:1'].componentIds, ['component-b']);

  const deleted = deleteRow(added, 1);
  assert.equal(deleted.rowNum, 2);
  assert.deepEqual(deleted.cells['1:1'].componentIds, ['component-b']);
});

test('adds and deletes columns while shifting cells', () => {
  const added = addColumn(createSchema(), 1);
  assert.equal(added.columnWidths.length, 3);
  assert.deepEqual(added.cells['1:2'].componentIds, ['component-b']);

  const deleted = deleteColumn(added, 1);
  assert.equal(deleted.columnWidths.length, 2);
  assert.deepEqual(deleted.cells['1:1'].componentIds, ['component-b']);
});

test('duplicates rows with copied component instances', () => {
  const duplicated = duplicateRow(createSchema(), 0);
  const copiedId = duplicated.cells['1:0'].componentIds[0];

  assert.notEqual(copiedId, 'component-a');
  assert.deepEqual(duplicated.components[copiedId], {
    id: copiedId,
    type: 'text',
    label: 'A',
    value: 'Alpha',
  });
});

test('duplicates columns with copied component instances', () => {
  const duplicated = duplicateColumn(createSchema(), 0);
  const copiedId = duplicated.cells['0:1'].componentIds[0];

  assert.notEqual(copiedId, 'component-a');
  assert.equal(duplicated.components[copiedId].value, 'Alpha');
});

test('merges, unmerges, and styles cells', () => {
  const styled = setCellBackground(createSchema(), [0, 1], '#e5f2ff');
  assert.equal(styled.cells['0:1'].backgroundColor, '#e5f2ff');

  const merged = mergeCells(styled, [0, 1]);
  assert.equal(merged.cells['0:0'].colSpan, 2);
  assert.equal(merged.cells['0:0'].rowSpan, undefined);

  const unmerged = unmergeCell(merged, 0);
  assert.equal(unmerged.cells['0:0'].colSpan, undefined);
});

test('adds local mock components to a target slot', () => {
  const schema = addMockComponentToCell(createSchema(), 1, {
    type: 'number',
    label: 'Number',
    defaultValue: '42',
  });
  const key = getCellKeyFromSlot(1, 2);
  const componentId = schema.cells[key].componentIds[0];

  assert.equal(schema.components[componentId].type, 'number');
  assert.equal(schema.components[componentId].value, '42');
});
