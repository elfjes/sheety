<script setup lang="ts">
import { storeToRefs } from "pinia";

import VItem from "@/components/Item.vue";
import { useCharacterStore } from "@/stores/character";
import { EffectKind, type Item } from "@/types";

const { character } = storeToRefs(useCharacterStore());
function newItem() {
  character.value?.items.push({
    name: "",
    kind: EffectKind.OTHER_ITEM,
    details: [],
    active: true,
  });
}
function deleteItem(itemIdx: number) {
  character.value?.items.splice(itemIdx, 1);
}
function updateItem(item: Item, idx: number) {
  if (!character.value) return;
  character.value.items[idx] = item;
}
</script>
<template>
  <div class="flex flex-col gap-1">
    <VItem
      v-for="(item, idx) in character?.items ?? []"
      :item="item"
      @update:item="(i) => updateItem(i, idx)"
      @delete="deleteItem(idx)"
    />
    <div
      class="btn btn-ghost rounded-box bg-base-200/60 w-full text-gray-400 border-dashed border-gray-400"
      @click="newItem()"
    >
      Add a new item...
    </div>
  </div>
</template>
<style scoped></style>
