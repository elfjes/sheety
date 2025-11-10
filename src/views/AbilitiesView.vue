<script setup lang="ts">
import { useCharacterStore } from "@/stores/character";
import Effect from "@/components/Effect.vue";
import { EffectKind } from "@/types";
const { character } = useCharacterStore();
function newAbility() {
  character.abilities.push({
    name: "",
    kind: EffectKind.FEAT,
    details: [],
    active: true,
    passive: true,
  });
}
function deleteAbility(itemIdx: number) {
  character.abilities.splice(itemIdx, 1);
}
</script>
<template>
  <div class="flex flex-col gap-1">
    <Effect
      v-for="(ability, idx) in character.abilities"
      :effect="ability"
      @delete="deleteAbility(idx)"
      :allowed-kinds="[EffectKind.FEAT, EffectKind.CLASS, EffectKind.RACIAL]"
      editable
    >
      <label class="label text-sm">
        <input type="checkbox" class="checkbox checkbox-xs" v-model="ability.passive" />
        Passive
      </label>
    </Effect>
    <div
      class="btn btn-ghost bg-base-200/60 w-full text-gray-400 border-dashed border-gray-400"
      @click="newAbility()"
    >
      Add a new ability...
    </div>
  </div>
</template>
<style scoped></style>
