<script setup lang="ts">
import { useCharacterStore } from "@/stores/character";
import type { Action } from "@/types";

import ActionMenu from "./ActionMenu.vue";

const { open } = defineProps<{ open: boolean }>();
const emit = defineEmits<{
  (e: "update:open", val: boolean): void;
  (e: "import"): void;
  (e: "export", idx: number): void;
}>();
const store = useCharacterStore();

function close() {
  emit("update:open", false);
}
function newCharacter() {
  store.newCharacter(null, true);
  close();
}
function activateCharacter(idx: number) {
  store.activateCharacter(idx);
  close();
}
const actions: Action[] = [
  {
    title: "Export",
    event: "export",
  },
  {
    title: "Duplicate",
    event: "duplicate",
  },
  {
    title: "Delete",
    event: "delete",
    color: "error",
    confirm: true,
  },
];
</script>

<template>
  <dialog ref="modal" class="modal" :open="open">
    <div class="modal-box flex flex-col gap-2">
      <h3 class="text-2xl font-bold">Characters</h3>
      <ul
        class="character-list border rounded-box border-base-300 w-full bg-base-100 z-10 shadow-md py-1"
      >
        <li
          v-for="(character, idx) in store.characters"
          class="character-item flex flex-row items-center text-lg font-medium w-full cursor-pointer hover:bg-base-200 focus:bg-base-200 px-2 py-1"
          :class="{ active: store.activeCharacterIndex === idx }"
        >
          <a class="flex-grow" @click="activateCharacter(idx)"
            >{{ character.name }} ({{ character.levelString() }})</a
          >
          <ActionMenu
            :actions="actions"
            @export="emit('export', idx)"
            @delete="store.deleteCharacter(idx)"
            @duplicate="store.duplicateCharacter(idx)"
          ></ActionMenu>
        </li>
      </ul>
      <button
        class="btn btn-ghost rounded-box bg-base-200/60 w-full text-gray-400 border-dashed border-gray-400"
        @click="newCharacter()"
      >
        Create a new character...
      </button>

      <div class="modal-action">
        <button class="btn btn-secondary" @click="emit('import')">Import</button>
        <button class="btn" @click="close">Cancel</button>
      </div>
    </div>
  </dialog>
</template>

<style lang="scss" scoped>
.character-item.active {
  background-color: var(--color-primary);

  &:hover {
    background-color: color-mix(in srgb, var(--color-primary) 80%, var(--color-base-200));
  }
}
</style>
