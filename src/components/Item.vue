<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";

import { EffectKind, type Item } from "../types.ts";
import Effect from "./Effect.vue";
import NumberInput from "./NumberInput.vue";

const { item } = defineProps<{ item: Item }>();
const emit = defineEmits<{ (e: "delete"): void; (e: "update:item", item: Item): void }>();
const editing = ref(false);
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
    editable
    toggle
  >
    <template v-if="item.kind === EffectKind.WEAPON" #display>
      <div>
        {{ item.dice }} <span v-if="item.strMod">(str x{{ item.strMod }})</span>
        <span v-if="item.ranged" class="italic"> (ranged)</span>
      </div>
    </template>
    <template v-if="item.kind === EffectKind.WEAPON" #editing>
      <label class="label text-xs">
        <input type="checkbox" class="checkbox checkbox-xs" v-model="item.ranged" />
        Ranged
      </label>
      <div class="min-w-max border rounded-sm border-gray-300 flex flex-row flex-grow">
        <span class="px-3 label text-xs my-1 border-gray-100">Str x</span>
        <NumberInput class="ml-auto" size="sm" :step="0.5" v-model="item.strMod" />
      </div>
      <label class="input input-sm">
        <span class="label text-xs">Dice</span>
        <input class="text-xs" v-model="item.dice" />
      </label>
    </template>
  </Effect>
</template>
<style scoped></style>
