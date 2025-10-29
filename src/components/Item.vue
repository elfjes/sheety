<script setup lang="ts">
import { ref } from "vue";
import { ItemKind, type Item } from "../types.ts";
import ItemEffect from "./ItemEffect.vue";

const { item } = defineProps<{ item: Item }>();
const emit = defineEmits(["delete"]);
const open = ref(false);
const editing = ref(false);
const deleting = ref(false);
if (!item.name) {
  editing.value = true;
}
function toggleEditing() {
  // When waiting for delete confirmation, the edit button becomes a delete cancel button
  if (deleting.value) {
    deleting.value = false;
    return;
  }
  editing.value = !editing.value;
  if (editing) {
    open.value = true;
  }
}
function confirmDelete() {
  if (deleting.value) {
    emit("delete");
    deleting.value = false;
    editing.value = false;
    return;
  }
  deleting.value = true;
}
function newEffect() {
  item.effects.push({
    target: "str",
    modifier: 0,
  });
}
function deleteEffect(idx: number) {
  item.effects.splice(idx, 1);
}
</script>
<template>
  <div class="border rounded-md p-2 flex flex-col gap-1">
    <template v-if="editing">
      <div class="flex flex-row gap-1">
        <input class="input input-sm w-full" v-model="item.name" />
        <div class="ml-auto"></div>
        <button
          v-if="editing"
          class="btn btn-sm"
          :class="deleting && 'btn-error'"
          @click="confirmDelete()"
          @blur="deleting = false"
        >
          <i class="fas fa-trash text-center w-8" />
        </button>
        <button class="btn btn-sm" @click="toggleEditing()">
          <i class="fas text-center w-8" :class="deleting ? 'fa-xmark' : 'fa-check'" />
        </button>
      </div>
      <label class="select select-sm max-w-1/2">
        <span class="label">Type</span>
        <select class="min-w-max" v-model="item.kind">
          <option v-for="kind in ItemKind" :value="kind">{{ kind }}</option>
        </select>
      </label>
    </template>
    <template v-else>
      <div class="flex flex-row gap-1 max-w-full items-center">
        <h3 class="font-bold overflow-hidden text-ellipsis flex-shrink-1">
          {{ item.name }}
        </h3>
        <div class="text-gray-400">({{ item.kind }})</div>
        <div class="ml-auto"></div>
        <button class="btn btn-xs" @click="toggleEditing()">
          <i class="fas fa-pencil text-center w-8" />
        </button>
        <i
          class="fas min-w-5"
          :class="open ? 'fa-caret-up' : 'fa-caret-down'"
          @click="open = !open"
        />
      </div>
    </template>
    <div v-if="open">
      <template v-for="(_, i) in item.effects">
        <ItemEffect v-model="item.effects[i]!" :editing="editing" @delete="deleteEffect(i)" />
      </template>
      <div
        v-if="editing"
        class="btn btn-xs btn-ghost w-full text-gray-400 border-dashed border-gray-400"
        @click="newEffect()"
      >
        Add a new effect...
      </div>
    </div>
  </div>
</template>
<style scoped></style>
