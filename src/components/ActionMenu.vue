<script setup lang="ts">
import type { Action } from "@/types";
import { nextTick, ref, useTemplateRef } from "vue";

const { actions } = defineProps<{
  actions: Action[];
}>();
const emit = defineEmits<{
  (e: "action", val: string): void;
  (e: string): void;
}>();

const open = ref(false);

function toggleMenu() {
  open.value = !open.value;
  open.value &&
    nextTick(() => {
      document.addEventListener("click", checkFocus);
    });
}
const menu = useTemplateRef("menu");

const checkFocus = (event: Event) => {
  if (menu.value && !menu.value.contains(event.target as Node)) {
    closeMenu();
  }
};

function closeMenu() {
  open.value = false;
  document.removeEventListener("click", checkFocus);
}
function performAction(action: Action) {
  emit("action", action.event);
  emit(action.event);
  closeMenu();
}
</script>

<template>
  <div ref="menu" class="inline-block relative">
    <button class="btn btn-ghost btn-square" @click="toggleMenu">
      <i class="fas fa-ellipsis-vertical text-xl"></i>
    </button>
    <div v-if="open" class="absolute right-0 w-40 z-10 pt-1">
      <ul
        class="relative border rounded-field border-base-300 right-0 w-full bg-base-100 z-10 shadow-md py-1"
      >
        <li
          v-for="action in actions"
          class="text-lg font-medium w-full cursor-pointer hover:bg-base-200 px-2 py-1"
        >
          <a @click="performAction(action)">{{ action.title }}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped></style>
