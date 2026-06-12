<template>
  <main class="app-shell">
    <section class="workspace">
      <div class="toolbar">
        <button @click="runCommand('add-row')">Add row</button>
        <button :disabled="!selectedSlots.length" @click="runCommand('delete-row')">Delete row</button>
        <button :disabled="!selectedSlots.length" @click="runCommand('duplicate-row')">Duplicate row</button>
        <button @click="runCommand('add-column')">Add column</button>
        <button :disabled="!selectedSlots.length" @click="runCommand('delete-column')">Delete column</button>
        <button :disabled="!selectedSlots.length" @click="runCommand('duplicate-column')">Duplicate column</button>
        <button :disabled="selectedSlots.length < 2" @click="runCommand('merge')">Merge</button>
        <button :disabled="!selectedSlots.length" @click="runCommand('unmerge')">Unmerge</button>
        <button @click="resetMock">Reset mock</button>
      </div>

      <GridLayout
        v-model="gridLayout"
        editable
        @selection-change="selectedSlots = $event"
      />
    </section>

    <aside class="side-panel">
      <section class="panel">
        <h3>基础组件 Draggable component</h3>
        <div class="palette">
          <button
            v-for="item in palette"
            :key="item.type"
            draggable="true"
            @dragstart="startPaletteDrag(item, $event)"
            @click="addPaletteItem(item)"
          >
            {{ item.label }}
          </button>
        </div>
      </section>

      <section class="panel">
        <h3>Cell Background</h3>
        <div class="swatches">
          <button
            v-for="color in colors"
            :key="color.label"
            :title="color.label"
            :disabled="!selectedSlots.length"
            :style="{ backgroundColor: color.preview }"
            @click="setBackground(color.value)"
          />
        </div>
      </section>

      <section class="panel panel--grow">
        <h3>Local Schema JSON</h3>
        <textarea v-model="schemaText" spellcheck="false" />
        <div class="json-actions">
          <button @click="applyJson">Apply JSON</button>
          <button @click="schemaText = JSON.stringify(gridLayout, null, 2)">Refresh JSON</button>
        </div>
        <p v-if="jsonError" class="error">{{ jsonError }}</p>
      </section>
    </aside>
  </main>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import GridLayout from './components/GridLayout.vue';
import { gridLayoutMock } from './mock/gridLayoutMock';
import { palette } from './mock/palette';
import {
  addColumn,
  addMockComponentToCell,
  addRow,
  deleteColumn,
  deleteRow,
  duplicateColumn,
  duplicateRow,
  mergeCells,
  setCellBackground,
  unmergeCell,
} from './core/commands';
import { clone, getColumnCount, getPositionFromSlot, normalizeGridLayout } from './core/schema';

const gridLayout = ref(normalizeGridLayout(clone(gridLayoutMock)));
const selectedSlots = ref([]);
const schemaText = ref(JSON.stringify(gridLayout.value, null, 2));
const jsonError = ref('');

const colors = [
  { label: 'Default', value: '', preview: '#ffffff' },
  { label: 'Gray', value: '#f0efec', preview: '#f0efec' },
  { label: 'Yellow', value: '#fff6d8', preview: '#fff6d8' },
  { label: 'Green', value: '#e8f3ec', preview: '#e8f3ec' },
  { label: 'Blue', value: '#e5f2ff', preview: '#e5f2ff' },
  { label: 'Pink', value: '#fbecf2', preview: '#fbecf2' },
];

const firstSelection = computed(() => {
  const firstSlot = selectedSlots.value[0];
  if (firstSlot === undefined) {
    return null;
  }
  return getPositionFromSlot(firstSlot, getColumnCount(gridLayout.value));
});

watch(
  gridLayout,
  value => {
    schemaText.value = JSON.stringify(value, null, 2);
  },
  { deep: true },
);

function runCommand(command) {
  const selected = firstSelection.value;
  switch (command) {
    case 'add-row':
      gridLayout.value = addRow(gridLayout.value, selected ? selected.rowIndex + 1 : null);
      break;
    case 'delete-row':
      if (selected) gridLayout.value = deleteRow(gridLayout.value, selected.rowIndex);
      break;
    case 'duplicate-row':
      if (selected) gridLayout.value = duplicateRow(gridLayout.value, selected.rowIndex);
      break;
    case 'add-column':
      gridLayout.value = addColumn(gridLayout.value, selected ? selected.columnIndex + 1 : null);
      break;
    case 'delete-column':
      if (selected) gridLayout.value = deleteColumn(gridLayout.value, selected.columnIndex);
      break;
    case 'duplicate-column':
      if (selected) gridLayout.value = duplicateColumn(gridLayout.value, selected.columnIndex);
      break;
    case 'merge':
      gridLayout.value = mergeCells(gridLayout.value, selectedSlots.value);
      break;
    case 'unmerge':
      gridLayout.value = unmergeCell(gridLayout.value, selectedSlots.value[0]);
      break;
    default:
      break;
  }
}

function addPaletteItem(item) {
  if (!selectedSlots.value.length) {
    return;
  }
  gridLayout.value = addMockComponentToCell(gridLayout.value, selectedSlots.value[0], item);
}

function startPaletteDrag(item, event) {
  event.dataTransfer.effectAllowed = 'copy';
  event.dataTransfer.setData('application/grid-table-palette', JSON.stringify(item));
}

function setBackground(value) {
  gridLayout.value = setCellBackground(gridLayout.value, selectedSlots.value, value);
}

function resetMock() {
  gridLayout.value = normalizeGridLayout(clone(gridLayoutMock));
  selectedSlots.value = [];
  jsonError.value = '';
}

function applyJson() {
  try {
    gridLayout.value = normalizeGridLayout(JSON.parse(schemaText.value));
    selectedSlots.value = [];
    jsonError.value = '';
  } catch (error) {
    jsonError.value = `Invalid JSON: ${error.message}`;
  }
}
</script>
