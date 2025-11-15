<script setup lang="ts">
import { computed, ref } from "vue";
import Modal from "./Modal.vue";
import { useCharacterStore } from "@/stores/character";

const { open } = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
}>();
const store = useCharacterStore();
const importValue = ref("");
const isError = ref(false);
const isSuccess = ref(false);

function close() {
  emit("update:open", false);
  setTimeout(() => {
    importValue.value = "";
    isSuccess.value = false;
    isError.value = false;
  }, 300);
}
function onImport() {
  if (isSuccess.value) {
    close();
    return;
  }
  const success = store.importCharacter(importValue.value);
  if (success) {
    isSuccess.value = true;
    isError.value = false;
  } else {
    isSuccess.value = false;
    isError.value = true;
  }
}
</script>

<template>
  <Modal header="Import Character Sheet" :open="open" @update:open="(v) => emit('update:open', v)">
    <p class="mb-1">Input a previously exported Character Sheet here and press Import:</p>
    <textarea
      class="textarea w-full min-h-50"
      :class="{ 'textarea-error': isError }"
      v-model="importValue"
    />
    <template #buttons>
      <button
        class="btn"
        :class="{ 'btn-success': isSuccess, 'btn-primary': !isSuccess }"
        @click="onImport"
      >
        {{ isSuccess ? "Success!" : "Import" }}
      </button>
      <button class="btn" @click="close">Cancel</button>
    </template>
  </Modal>
</template>

<style scoped></style>
