<script setup lang="ts">
import { computed, ref } from "vue";

const {
  confirmColor,
  icon,
  size = "md",
} = defineProps<{
  confirmColor: string;
  icon: string;
  size?: string;
}>();
const emit = defineEmits<{
  (e: "confirm"): void;
}>();
const confirming = ref(false);

const buttonClasses = computed(() => {
  return ["btn-" + size, (confirming.value && "btn-") + confirmColor];
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
    <i class="fas text-center" :class="icon" />
  </button>
</template>

<style scoped></style>
