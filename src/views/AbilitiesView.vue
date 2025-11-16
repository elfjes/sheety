<script setup lang="ts">
import { storeToRefs } from "pinia";

import Effect from "@/components/Effect.vue";
import { useCharacterStore } from "@/stores/character";
import { EffectKind } from "@/types";

const { character } = storeToRefs(useCharacterStore());
function newAbility() {
  character.value?.abilities.push({
    name: "",
    kind: EffectKind.FEAT,
    details: [],
    active: true,
    passive: false,
  });
}
function deleteAbility(itemIdx: number) {
  character.value?.abilities.splice(itemIdx, 1);
}
</script>
<template>
  <div class="flex flex-col gap-1">
    <Effect
      v-for="(ability, idx) in character?.abilities ?? []"
      :effect="ability"
      @delete="deleteAbility(idx)"
      :allowed-kinds="[EffectKind.FEAT, EffectKind.CLASS, EffectKind.RACIAL]"
      editable
    >
      <template v-if="ability.passive" #display>
        <div class="italic">Passive</div>
      </template>
      <template #editing>
        <label class="label text-sm">
          <input type="checkbox" class="checkbox checkbox-xs" v-model="ability.passive" />
          Passive
        </label>
      </template>
    </Effect>
    <div
      class="btn btn-ghost rounded-box bg-base-200/60 w-full text-gray-400 border-dashed border-gray-400"
      @click="newAbility()"
    >
      Add a new ability...
    </div>
  </div>
</template>
<style scoped></style>
