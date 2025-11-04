<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import Modal from "./Modal.vue";
import { useCharacterStore } from "@/stores/character";
import { storeToRefs } from "pinia";

const { open } = defineProps<{ open: boolean; mode: "import" | "export" }>();
const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
}>();
const { characterAsExport } = storeToRefs(useCharacterStore());

const copySuccess = ref(false);
const textarea = useTemplateRef("textarea");
function onCopy() {
  if (copySuccess.value) {
    close();
    return;
  }
  navigator.clipboard.writeText(characterAsExport.value);
  copySuccess.value = true;
}

function close() {
  emit("update:open", false);
  setTimeout(() => {
    copySuccess.value = false;
  }, 300);
}
</script>

<template>
  <Modal header="Export Character Sheet" :open="open" @update:open="(v) => emit('update:open', v)">
    <p class="mb-1">Press Copy to export your Character Sheet:</p>
    <textarea
      ref="textarea"
      class="textarea w-full min-h-50 pointer-events-none"
      :value="characterAsExport"
    />
    <template #buttons>
      <button class="btn" :class="{ 'btn-success': copySuccess }" @click="onCopy">
        {{ copySuccess ? "Success!" : "Copy" }}
      </button>
      <button class="btn" @click="close">Cancel</button>
    </template>
  </Modal>
</template>

<style scoped></style>
