<script setup lang="ts">
import { useCharacterStore } from "@/stores/character";
import Effect from "@/components/Effect.vue";
import { EffectKind } from "@/types";
const { character } = useCharacterStore();
function newFeat() {
  character.feats.push({
    name: "",
    kind: EffectKind.FEAT,
    details: [],
    active: true,
    passive: true,
  });
}
function deleteFeat(itemIdx: number) {
  character.feats.splice(itemIdx, 1);
}
</script>
<template>
  <div class="flex flex-col gap-1">
    <Effect
      v-for="(feat, idx) in character.feats"
      :effect="feat"
      @delete="deleteFeat(idx)"
      :allowed-kinds="[EffectKind.FEAT, EffectKind.CLASS, EffectKind.RACIAL]"
      editable
    >
      <label class="label text-sm">
        <input type="checkbox" class="checkbox checkbox-xs" v-model="feat.passive" />
        Passive
      </label>
    </Effect>
    <div
      class="btn btn-ghost w-full text-gray-400 border-dashed border-gray-400"
      @click="newFeat()"
    >
      Add a new feat...
    </div>
  </div>
</template>
<style scoped></style>
