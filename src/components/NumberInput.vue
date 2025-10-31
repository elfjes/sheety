<script setup lang="ts">
import { computed } from "vue";

const model = defineModel<number>({ required: true });
const {
  size = "md",
  step = 1,
  btnStyle = "",
} = defineProps<{ size?: string; step?: number; btnStyle?: string }>();
// input-xs input-sm input-lg input-xl
// btn-xs btn-sm btn-lg btn-xl
function increment() {
  model.value += step;
}
function decrement() {
  model.value -= step;
}
const inputWidth = computed(() => {
  return {
    xs: "w-8",
    sm: "w-10",
    md: "w-12",
    lg: "w-16",
    xl: "w-20",
  }[size] as string;
});
const additionalButtonClasses = computed(() => {
  return ["btn-" + size, btnStyle];
});
const additionalInputClasses = computed(() => {
  return [inputWidth.value, "input-" + size];
});
</script>
<template>
  <div class="join rounded-xs">
    <button class="btn join-item" :class="additionalButtonClasses" @click="decrement()">-</button>
    <input
      class="input join-item text-center p-px"
      :class="additionalInputClasses"
      type="number"
      v-model="model"
    />
    <button class="btn join-item" :class="additionalButtonClasses" @click="increment()">+</button>
  </div>
</template>
<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
</style>
