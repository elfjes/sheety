<script setup lang="ts">
import { useTemplateRef } from "vue";
const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
}>();
const open = defineModel<boolean>("open", { default: true });

const { header = "" } = defineProps<{ header?: string }>();

function showModal() {
  emit("update:open", true);
  open.value = true;
}
defineExpose({
  showModal,
});
</script>

<template>
  <dialog ref="modal" class="modal" :open="open">
    <div class="modal-box bg-base-100">
      <h3 class="text-lg font-bold">{{ header }}</h3>
      <slot></slot>
      <div class="modal-action">
        <slot name="buttons">
          <button class="btn" @click="emit('update:open', false)">Close</button>
        </slot>
      </div>
    </div>
  </dialog>
</template>

<style scoped></style>
