<script setup lang="ts">
import { computed, ref } from "vue";

import { useCharacterStore } from "@/stores/character";

import Modal from "./Modal.vue";

const { open, index } = defineProps<{ open: boolean; index: number | null }>();
const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
}>();
const store = useCharacterStore();
const isSuccess = ref(false);
const exportData = computed(() => {
  return index != null ? store.characterAsExport(index) : "";
});
function onCopy() {
  if (isSuccess.value) {
    close();
    return;
  }
  navigator.clipboard.writeText(exportData.value);
  isSuccess.value = true;
}

function close() {
  emit("update:open", false);
  setTimeout(() => {
    isSuccess.value = false;
  }, 300);
}
</script>

<template>
  <Modal header="Export Character Sheet" :open="open" @update:open="(v) => emit('update:open', v)">
    <p class="mb-1">Press Copy to export your Character Sheet:</p>
    <textarea
      class="textarea w-full min-h-50"
      onclick="this.focus();this.select()"
      readonly
      :value="exportData"
    />
    <template #buttons>
      <button
        class="btn"
        :class="{ 'btn-success': isSuccess, 'btn-primary': !isSuccess }"
        @click="onCopy"
      >
        {{ isSuccess ? "Success!" : "Copy" }}
      </button>
      <button class="btn" @click="close">Cancel</button>
    </template>
  </Modal>
</template>

<style scoped></style>
