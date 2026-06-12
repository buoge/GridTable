<template>
  <div class="grid-table-header" :style="{ gridTemplateColumns }">
    <div
      v-for="(label, columnIndex) in labels"
      :key="columnIndex"
      class="grid-table-header__cell"
    >
      <input
        :value="label"
        :disabled="!editable"
        @input="$emit('update-label', columnIndex, $event.target.value)"
      />
      <button
        v-if="editable"
        type="button"
        class="grid-table-header__resizer"
        aria-label="Resize column"
        @mousedown.prevent="startResize(columnIndex, $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  columnWidths: {
    type: Array,
    default: () => [],
  },
  gridTemplateColumns: {
    type: String,
    default: '',
  },
  editable: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update-label', 'resize-column']);
const resizeState = ref(null);

function startResize(columnIndex, event) {
  resizeState.value = {
    columnIndex,
    startX: event.clientX,
    startWidth: props.columnWidths[columnIndex] || 240,
  };
  window.addEventListener('mousemove', handleResizeMove);
  window.addEventListener('mouseup', stopResize);
}

function handleResizeMove(event) {
  if (!resizeState.value) {
    return;
  }
  const delta = event.clientX - resizeState.value.startX;
  emit('resize-column', resizeState.value.columnIndex, resizeState.value.startWidth + delta);
}

function stopResize() {
  resizeState.value = null;
  window.removeEventListener('mousemove', handleResizeMove);
  window.removeEventListener('mouseup', stopResize);
}

onBeforeUnmount(stopResize);
</script>
