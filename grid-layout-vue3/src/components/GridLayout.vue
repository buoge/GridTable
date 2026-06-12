<template>
  <section class="grid-table">
    <header class="grid-table__title-row">
      <h2>{{ normalized.label }}</h2>
      <span>{{ normalized.rowNum }} rows · {{ columnCount }} columns</span>
    </header>

    <div class="grid-table__scroll">
      <GridLayoutHeader
        v-if="normalized.showColumnHeader"
        :labels="normalized.headerLabels"
        :column-widths="normalized.columnWidths"
        :grid-template-columns="gridTemplateColumns"
        :editable="editable"
        @update-label="handleHeaderLabelUpdate"
        @resize-column="handleColumnResize"
      />

      <div class="grid-table__body" :style="{ gridTemplateColumns }">
        <button
          v-for="cell in visibleCells"
          :key="cell.key"
          type="button"
          class="grid-table__cell"
          :class="{ 'grid-table__cell--selected': selectedSlots.includes(cell.slotIndex) }"
          :style="cell.style"
          @click="selectCell(cell.slotIndex, $event)"
          @dragover.prevent
          @drop.prevent="handleCellDrop(cell.slotIndex, $event)"
        >
          <slot
            v-if="cell.component"
            name="component"
            :component="cell.component"
            :cell="cell"
          >
            <MockComponentRenderer :component="cell.component" />
          </slot>
          <slot v-else name="empty-cell" :cell="cell">
            <span class="grid-table__empty">Drop component</span>
          </slot>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import GridLayoutHeader from './GridLayoutHeader.vue';
import MockComponentRenderer from './MockComponentRenderer.vue';
import { getRectangularSelection } from '../core/selection';
import {
  getCellKey,
  getColumnCount,
  getCoveredCellKeys,
  getSlotIndex,
  normalizeGridLayout,
} from '../core/schema';
import { addMockComponentToCell, resizeColumn, updateHeaderLabel } from '../core/commands';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  editable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'change', 'selection-change', 'warning']);

const selectedSlots = ref([]);

const normalized = computed(() => normalizeGridLayout(props.modelValue));
const columnCount = computed(() => getColumnCount(normalized.value));
const gridTemplateColumns = computed(() => normalized.value.columnWidths.map(width => `${width}px`).join(' '));
const coveredCellKeys = computed(() => getCoveredCellKeys(normalized.value));

const visibleCells = computed(() => {
  const cells = [];
  for (let rowIndex = 0; rowIndex < normalized.value.rowNum; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < columnCount.value; columnIndex += 1) {
      const key = getCellKey(rowIndex, columnIndex);
      if (coveredCellKeys.value.has(key)) {
        continue;
      }
      const cell = normalized.value.cells[key] || {};
      const componentId = cell.componentIds?.[0];
      cells.push({
        key,
        rowIndex,
        columnIndex,
        slotIndex: getSlotIndex(rowIndex, columnIndex, columnCount.value),
        component: componentId ? normalized.value.components[componentId] : null,
        raw: cell,
        style: {
          gridColumn: cell.colSpan ? `span ${cell.colSpan}` : undefined,
          gridRow: cell.rowSpan ? `span ${cell.rowSpan}` : undefined,
          backgroundColor: cell.backgroundColor || '#fff',
        },
      });
    }
  }
  return cells;
});

watch(
  () => props.modelValue,
  () => {
    selectedSlots.value = selectedSlots.value.filter(slot => slot < normalized.value.rowNum * columnCount.value);
  },
  { deep: true },
);

function emitValue(value, command, meta = {}) {
  emit('update:modelValue', value);
  emit('change', { value, command, meta });
}

function handleHeaderLabelUpdate(columnIndex, label) {
  emitValue(updateHeaderLabel(normalized.value, columnIndex, label), 'update-header-label', { columnIndex });
}

function handleColumnResize(columnIndex, width) {
  emitValue(resizeColumn(normalized.value, columnIndex, width), 'resize-column', { columnIndex, width });
}

function handleCellDrop(slotIndex, event) {
  if (!props.editable) {
    return;
  }
  const rawPayload = event.dataTransfer?.getData('application/grid-table-palette');
  if (!rawPayload) {
    return;
  }
  try {
    const paletteItem = JSON.parse(rawPayload);
    emitValue(addMockComponentToCell(normalized.value, slotIndex, paletteItem), 'drop-component', {
      slotIndex,
      paletteItem,
    });
    selectedSlots.value = [slotIndex];
    emit('selection-change', selectedSlots.value);
  } catch (error) {
    emit('warning', { code: 'invalid-drop-payload', message: error.message });
  }
}

function selectCell(slotIndex, event) {
  if (event.shiftKey && selectedSlots.value.length) {
    selectedSlots.value = getRectangularSelection(selectedSlots.value[0], slotIndex, columnCount.value);
  } else if (event.metaKey || event.ctrlKey) {
    selectedSlots.value = selectedSlots.value.includes(slotIndex)
      ? selectedSlots.value.filter(slot => slot !== slotIndex)
      : [...selectedSlots.value, slotIndex].sort((left, right) => left - right);
  } else {
    selectedSlots.value = [slotIndex];
  }
  emit('selection-change', selectedSlots.value);
}

defineExpose({
  selectedSlots,
});
</script>
