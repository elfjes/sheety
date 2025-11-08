<script setup lang="ts">
import { ref } from "vue";

const open = defineModel<boolean>("open", { default: false });
const { collapse = false } = defineProps<{ collapse?: boolean }>();
</script>
<template>
  <div class="border rounded-md p-2 flex flex-col gap-1">
    <div class="flex flex-row justify-between gap-1 items-center">
      <div class="flex-grow"><slot name="header"></slot></div>
      <button class="btn btn-xs btn-square btn-ghost" @click="open = !open">
        <i v-if="collapse" class="fas text-base" :class="open ? 'fa-caret-up' : 'fa-caret-down'" />
      </button>
    </div>
    <div v-if="!collapse || (collapse && open)">
      <slot></slot>
    </div>
  </div>
</template>
<style scoped></style>
