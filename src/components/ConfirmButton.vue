<script setup lang="ts">
import { computed, ref } from "vue";

const {
  confirmColor,
  icon = "",
  size = "md",
} = defineProps<{
  confirmColor: string;
  icon?: string;
  size?: string;
}>();
const emit = defineEmits<{
  (e: "confirm"): void;
}>();
const confirming = ref(false);

// btn-primary text-primary-content text-primary
// btn-accent text-accent-content text-accent
// btn-success text-success-content text-success
// btn-warning text-warning-content text-warning
// btn-error text-error-content text-error
const buttonClasses = computed(() => {
  const classes = [`btn-${size}`];
  if (confirming.value) {
    classes.push(`btn-${confirmColor}`, `text-${confirmColor}-content`);
  } else {
    classes.push(`text-${confirmColor}`);
  }
  return classes;
});

function confirm() {
  if (!confirming.value) {
    confirming.value = true;
    return;
  }
  emit("confirm");
  confirming.value = false;
}
</script>

<template>
  <button
    class="btn"
    :class="buttonClasses"
    @click="confirm()"
    @blur="confirming = false"
    @mouseleave="confirming = false"
  >
    <slot :confirming="confirming">
      <i class="fas text-center" :class="icon" /> <slot id="text"></slot>
    </slot>
  </button>
</template>

<style scoped></style>
