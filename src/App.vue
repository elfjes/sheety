<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import { RouterView, RouterLink } from "vue-router";
import { useCharacterStore } from "./stores/character";
import ActionMenu from "./components/ActionMenu.vue";
import TheImportModal from "./components/TheImportModal.vue";
import TheExportModal from "./components/TheExportModal.vue";

const open = ref(false);
const importModalOpen = ref(false);
const exportModalOpen = ref(false);
const editingName = ref(false);
const store = useCharacterStore();
const navItems = [
  { title: "Character", route: "/character" },
  { title: "Skills", route: "/skills" },
  { title: "Feats", route: "/feats" },
  { title: "Items", route: "/items" },
  { title: "Combat", route: "/combat" },
];

const menuItems = [
  {
    title: "Edit name",
    event: "edit",
  },
  {
    title: "Import",
    event: "import",
  },
  {
    title: "Export",
    event: "export",
  },
];

const modal = useTemplateRef<InstanceType<typeof TheImportModal>>("modal");
const exporting = ref(false);
const modalOpen = ref({
  import: false,
  export: false,
});
function openModal(modal: "import" | "export") {
  const importOpen = modal === "import";
  importModalOpen.value = importOpen;
  exportModalOpen.value = !importOpen;
}
</script>

<template>
  <TheImportModal v-model:open="importModalOpen" mode="import"></TheImportModal>
  <TheExportModal v-model:open="exportModalOpen" mode="import"></TheExportModal>
  <header class="p-2 flex flex-col align-center shadow-sm">
    <div class="flex flex-row gap-2 items-center">
      <div class="flex-none cursor-pointer">
        <div class="btn btn-ghost btn-square" @click="open = !open">
          <i class="fas fa-bars text-2xl"></i>
        </div>
      </div>
      <template v-if="editingName">
        <input class="input" v-model="store.character.name" />
        <button class="btn btn-ghost btn-square" @click="editingName = false">
          <i class="fas fa-check text-center w-8" />
        </button>
      </template>
      <div v-else class="text-xl font-semibold">
        {{ store.character.name }}
      </div>
      <div class="ml-auto">
        <ActionMenu
          :actions="menuItems"
          @edit="editingName = true"
          @import="openModal('import')"
          @export="openModal('export')"
        />
      </div>
    </div>
    <div v-if="open">
      <ul class="menu w-full text-lg">
        <li v-for="item in navItems" @click="open = false">
          <RouterLink :to="item.route">
            {{ item.title }}
          </RouterLink>
        </li>
      </ul>
    </div>
  </header>

  <div class="p-4">
    <RouterView />
  </div>
</template>

<style scoped></style>
