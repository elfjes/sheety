<script setup lang="ts">
import { ref } from "vue";

const open = defineModel<boolean>("open", { default: false });
const { collapse = false } = defineProps<{ collapse?: boolean }>();
</script>
<template>
  <div class="border rounded-md p-2 flex flex-col gap-1">
    <div class="flex flex-row justify-between gap-1 items-center">
      <div class="flex-grow"><slot name="header"></slot></div>
      <i
        v-if="collapse"
        class="fas min-w-5"
        :class="open ? 'fa-caret-up' : 'fa-caret-down'"
        @click="open = !open"
      />
    </div>
    <div v-if="!collapse || (collapse && open)">
      <slot></slot>
    </div>
  </div>
</template>
<style scoped></style>
