<template>
  <div class="mock-component">
    <div class="mock-component__label">{{ component.label }}</div>
    <div class="mock-component__value">{{ component.value || 'Empty mock value' }}</div>
    <div class="mock-component__type">{{ component.type }}</div>
  </div>
</template>

<script setup>
defineProps({
  component: {
    type: Object,
    required: true,
  },
});
</script>
