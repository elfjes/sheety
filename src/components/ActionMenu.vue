<script setup lang="ts">
import type { Action } from "@/types";
import { ref } from "vue";

const { actions } = defineProps<{
  actions: Action[];
}>();
const emit = defineEmits<{
  (e: "action", val: string): void;
  (e: string): void;
}>();

const open = ref(false);

function performAction(action: Action) {
  emit("action", action.event);
  emit(action.event);
  open.value = false;
}
</script>

<template>
  <div class="inline-block relative">
    <button class="btn btn-ghost btn-square" @click="open = !open">
      <i class="fas fa-ellipsis-vertical text-xl"></i>
    </button>
    <div class="absolute right-0 w-40 z-10 pt-1">
      <ul
        v-if="open"
        class="absolute border rounded-xs border-base-300 right-0 w-full bg-base-100 z-10 shadow-md py-1"
      >
        <li
          v-for="action in actions"
          class="text-lg font-medium w-full cursor-pointer hover:bg-neutral-content px-2 py-1"
        >
          <a @click="performAction(action)">{{ action.title }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped></style>
