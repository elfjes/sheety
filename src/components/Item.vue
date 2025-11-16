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
const armorWeight = ["light", "medium", "heavy"];
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
    <template #display>
      <template v-if="item.kind === EffectKind.WEAPON">
        <div>
          {{ item.dice }} <span v-if="item.strMod">(str x{{ item.strMod }})</span>
          <span v-if="item.ranged" class="italic"> (ranged)</span>
        </div>
      </template>
      <template v-else-if="item.kind === EffectKind.ARMOR">
        <div class="italic">
          {{ item.weightClass }}
        </div>
      </template>
    </template>
    <template #editing>
      <template v-if="item.kind === EffectKind.WEAPON">
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
      <template v-if="item.kind === EffectKind.ARMOR">
        <label class="select select-sm">
          <span class="label">Weight Class</span>
          <select class="min-w-max" v-model="item.weightClass">
            <option v-for="weight in armorWeight" :value="weight">{{ weight }}</option>
          </select>
        </label>
      </template>
    </template>
  </Effect>
</template>
<style scoped></style>
