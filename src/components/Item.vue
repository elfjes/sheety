<script setup lang="ts">
import { ref } from "vue";
import { ItemKind, type Item } from "../types.ts";
import ItemEffect from "./ItemEffect.vue";
import Card from "./Card.vue";

const { item } = defineProps<{ item: Item }>();
const emit = defineEmits(["delete"]);
const open = ref(false);
const editing = ref(false);
const deleting = ref(false);
const newTagValue = ref("");
if (!item.name) {
  editing.value = true;
}
function toggleEditing() {
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
function addNewTag() {
  item.tags ??= [];
  item.tags.push(newTagValue.value);
  newTagValue.value = "";
}
</script>
<template>
  <Card v-model:open="open" :collapse="!editing">
    <template #header>
      <div v-if="editing" class="flex flex-row gap-1">
        <input class="input input-sm w-full" v-model="item.name" />
        <div class="ml-auto"></div>
        <button
          v-if="editing"
          class="btn btn-sm"
          :class="deleting && 'btn-error'"
          @click="confirmDelete()"
          @blur="deleting = false"
          @mouseleave="deleting = false"
        >
          <i class="fas fa-trash text-center w-8" />
        </button>
        <button class="btn btn-sm" :disabled="deleting" @click="toggleEditing()">
          <i class="fas fa-check text-center w-8" />
        </button>
      </div>
      <div v-else class="flex flex-row gap-1">
        <h3 class="font-bold overflow-hidden text-ellipsis flex-shrink-1">
          {{ item.name }}
        </h3>
        <div class="text-gray-400">({{ item.kind }})</div>
        <button class="btn btn-xs ml-auto" @click="toggleEditing()">
          <i class="fas fa-pencil text-center w-8" />
        </button>
      </div>
    </template>
    <div class="flex flex-col gap-1">
      <div v-if="editing" class="flex flex-row gap-1">
        <label v-if="editing" class="select select-sm max-w-1/2">
          <span class="label">Type</span>
          <select class="min-w-max" v-model="item.kind">
            <option v-for="kind in ItemKind" :value="kind">{{ kind }}</option>
          </select>
        </label>
        <label v-if="item.kind === ItemKind.WEAPON" class="input input-sm max-w-1/2">
          <span class="label text-xs">Dice</span>
          <input class="text-xs" v-model="item.dice" />
        </label>
      </div>
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
      <div class="flex flex-row gap-1 items-center">
        <div v-for="(tag, i) in item.tags" class="bg-gray-200 border rounded-sm px-1 text-xs">
          {{ tag }}
          <i
            v-if="editing"
            class="fas fa-xmark bg-gray-200 text-xs"
            @click="item.tags!.splice(i, 1)"
          />
        </div>
        <div
          v-if="editing"
          class="input input-xs h-4 border rounded-sm border-gray-400 text-gray-400 border-dashed px-1 text-xs w-fit"
        >
          <input
            class="w-16"
            type="text"
            placeholder="Add a tag..."
            v-model="newTagValue"
            @keydown.enter="addNewTag()"
          />
          <i v-if="newTagValue" class="fas fa-plus text-xs cursor-pointer" @click="addNewTag()" />
        </div>
      </div>
    </div>
  </Card>
</template>
<style scoped></style>
