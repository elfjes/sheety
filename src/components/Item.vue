<script setup lang="ts">
import { ref, watchEffect } from "vue";
import { EffectKind, type Item } from "../types.ts";
import ItemEffect from "./ItemEffect.vue";
import Card from "./Card.vue";
import Effect from "./Effect.vue";
import NumberInput from "./NumberInput.vue";

const { item } = defineProps<{ item: Item }>();
const emit = defineEmits<{ (e: "delete"): void; (e: "update:item", item: Item): void }>();
const open = ref(false);
const editing = ref(false);
const deleting = ref(false);
const newTagValue = ref("");
if (!item.name) {
  editing.value = true;
}
watchEffect(() => {
  if (item.kind === EffectKind.WEAPON && item.strMod === undefined) {
    item.strMod = 1;
  }
});
</script>
<template>
  <Effect
    v-model:editing="editing"
    :effect="item"
    @delete="emit('delete')"
    @update:effect="(e) => emit('update:item', e as Item)"
    :allowed-kinds="[EffectKind.WEAPON, EffectKind.ARMOR, EffectKind.OTHER_ITEM]"
    toggle
  >
    <div
      v-if="item.kind === EffectKind.WEAPON"
      class="min-w-max border rounded-sm border-gray-300 flex flex-row flex-grow"
    >
      <span class="px-3 label text-xs my-1 border-gray-100">Str x</span>
      <NumberInput class="ml-auto" size="sm" :step="0.5" v-model="item.strMod" />
    </div>
    <label v-if="item.kind === EffectKind.WEAPON" class="input input-sm w-1/2">
      <span class="label text-xs">Dice</span>
      <input class="text-xs" v-model="item.dice" />
    </label>
  </Effect>
</template>
<style scoped></style>
