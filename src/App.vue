<script setup lang="ts">
import { nextTick, reactive, ref, useTemplateRef } from "vue";
import { RouterLink, RouterView } from "vue-router";

import ActionMenu from "./components/ActionMenu.vue";
import TheCharacterModal from "./components/TheCharacterModal.vue";
import TheExportModal from "./components/TheExportModal.vue";
import TheImportModal from "./components/TheImportModal.vue";
import { useCharacterStore } from "./stores/character";

enum ModalKey {
  IMPORT = "import",
  EXPORT = "export",
  CHARACTER = "character",
}

const store = useCharacterStore();
const hamburgerMenuOpen = ref(false);
const openModals = reactive<Record<ModalKey, boolean>>({
  import: false,
  export: false,
  character: false,
});

const editingName = ref(false);
const characterNameInput = useTemplateRef("characterNameInput");

const exportIndex = ref<number | null>(null);
const navItems = [
  { title: "Character", route: "/character" },
  { title: "Skills", route: "/skills" },
  { title: "Abilities", route: "/abilities" },
  { title: "Items", route: "/items" },
  { title: "Combat", route: "/combat" },
];

const menuItems = [
  {
    title: "Characters",
    event: "characters",
  },
  {
    title: "Edit name",
    event: "edit",
  },
];

function openModal(modal: ModalKey) {
  for (const key of Object.keys(openModals)) {
    openModals[key as ModalKey] = false;
  }
  openModals[modal] = true;
}
function editName() {
  editingName.value = true;
  nextTick(() => {
    characterNameInput.value?.focus();
  });
}

function exportCharacter(idx: number) {
  exportIndex.value = idx;
  openModal(ModalKey.EXPORT);
}
</script>

<template>
  <TheImportModal v-model:open="openModals[ModalKey.IMPORT]"></TheImportModal>
  <TheExportModal v-model:open="openModals[ModalKey.EXPORT]" :index="exportIndex"></TheExportModal>
  <TheCharacterModal
    v-model:open="openModals[ModalKey.CHARACTER]"
    @import="openModal(ModalKey.IMPORT)"
    @export="(idx) => exportCharacter(idx)"
  ></TheCharacterModal>
  <header class="p-2 flex flex-col align-center bg-primary shadow-sm">
    <div class="flex flex-row gap-2 items-center">
      <div class="flex-none cursor-pointer">
        <div
          class="btn btn-ghost hover:bg-[color-mix(in_oklch,_var(--color-primary)_80%,_#ffffff)] btn-square"
          @click="hamburgerMenuOpen = !hamburgerMenuOpen"
        >
          <i class="fas fa-bars text-2xl"></i>
        </div>
      </div>
      <template v-if="store.character">
        <template v-if="editingName">
          <input ref="characterNameInput" class="input" v-model="store.character.name" />
          <button class="btn btn-ghost btn-square" @click="editingName = false">
            <i class="fas fa-check text-center w-8" />
          </button>
        </template>
        <div v-else class="text-xl font-semibold">
          {{ store.character.name }}
        </div>
      </template>
      <div class="ml-auto">
        <ActionMenu
          :actions="menuItems"
          @edit="editName"
          @import="openModal(ModalKey.IMPORT)"
          @export="openModal(ModalKey.EXPORT)"
          @characters="openModal(ModalKey.CHARACTER)"
        />
      </div>
    </div>
    <div v-if="hamburgerMenuOpen">
      <ul class="menu w-full text-lg">
        <li v-for="item in navItems" @click="hamburgerMenuOpen = false">
          <RouterLink :to="item.route" :disabled="!store.character">
            {{ item.title }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </header>

  <div class="p-4">
    <RouterView v-if="store.character" />
    <div v-else>Create a character to begin</div>
  </div>
</template>

<style scoped></style>
