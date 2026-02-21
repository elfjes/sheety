<script setup lang="ts">
import { useConfirmation } from "@/composables/useConfirmation";

const model = defineModel<number>({ required: true });

const { maxVal, compactTicks = false } = defineProps<{
  maxVal: number;
  compactTicks?: boolean;
}>();
function decrement() {
  if (model.value <= 0) return;
  model.value--;
}
function increment() {
  if (model.value >= maxVal) return;
  model.value++;
}
const { confirming: resetConfirming, events: resetEvents } = useConfirmation(() => {
  model.value = 0;
});
</script>

<template>
  <div class="flex flex-row gap-1">
    <button class="btn btn-xs btn-square rounded-sm" @click="decrement">-</button>
    <div class="flex-grow">
      <input
        type="range"
        min="0"
        :max="maxVal"
        v-model="model"
        class="range range-primary range-xs pointer-events-none mt-[-2px] w-full"
      />
      <div class="flex justify-between px-1 text-xs">
        <template v-if="compactTicks">
          <span>0</span>
          <span class="font-bold text-primary">{{ model }}</span>
          <span>{{ maxVal }}</span>
        </template>
        <template v-else>
          <span>0</span>
          <span v-for="idx in maxVal">{{ idx }}</span>
        </template>
      </div>
    </div>
    <button class="btn btn-xs btn-square rounded-md" @click="increment">+</button>
    <button
      class="btn btn-xs btn-square rounded-md"
      :class="{ 'btn-warning': resetConfirming }"
      v-on="resetEvents"
    >
      <i class="fas fa-rotate-left" />
    </button>
  </div>
</template>

<style scoped></style>
