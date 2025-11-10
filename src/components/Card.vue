<script setup lang="ts">
import { ref } from "vue";

const open = defineModel<boolean>("open", { default: false });
const { collapse = false } = defineProps<{ collapse?: boolean }>();
function toggleOpen() {
  if (!collapse) return;
  open.value = !open.value;
}
</script>
<template>
  <div class="flex flex-col gap-1 p-2 border border-base-200 rounded-box bg-base-100 shadow">
    <div class="flex flex-row items-center">
      <slot name="pre-header"></slot>
      <div
        class="flex flex-1 flex-row justify-between gap-1 items-center"
        :class="{ 'cursor-pointer': collapse }"
        @click="toggleOpen()"
      >
        <div class="flex-grow"><slot name="header"></slot></div>
        <div v-if="collapse">
          <i class="fas text-base" :class="open ? 'fa-caret-up' : 'fa-caret-down'" />
        </div>
      </div>
    </div>
    <div v-if="!collapse || (collapse && open)">
      <slot></slot>
    </div>
  </div>
</template>
<style scoped></style>
