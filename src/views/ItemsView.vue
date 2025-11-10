<script setup lang="ts">
import { useCharacterStore } from "@/stores/character";
import Item from "@/components/Item.vue";
import { EffectKind } from "@/types";
const { character } = useCharacterStore();
function newItem() {
  character.items.push({
    name: "",
    kind: EffectKind.OTHER_ITEM,
    details: [],
    active: true,
  });
}
function deleteItem(itemIdx: number) {
  character.items.splice(itemIdx, 1);
}
</script>
<template>
  <div class="flex flex-col gap-1">
    <Item v-for="(item, idx) in character.items" :item="item" @delete="deleteItem(idx)" />
    <div
      class="btn btn-ghost rounded-box bg-base-200/60 w-full text-gray-400 border-dashed border-gray-400"
      @click="newItem()"
    >
      Add a new item...
    </div>
  </div>
</template>
<style scoped></style>
