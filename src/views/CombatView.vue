<script setup lang="ts">
import HitPoints from "@/components/HitPoints.vue";
import Attack from "@/components/Attack.vue";
import { useCharacterStore } from "@/stores/character";
import { storeToRefs } from "pinia";
import { EffectKind } from "@/types";
import Effect from "@/components/Effect.vue";

const store = useCharacterStore();
const { character, attacks } = storeToRefs(store);
function newEffect() {
  character.value.temporaryEffects.push({
    name: "",
    kind: EffectKind.SPELL,
    details: [],
    active: false,
  });
}
function deleteEffect(itemIdx: number) {
  character.value.temporaryEffects.splice(itemIdx, 1);
}
</script>

<template>
  <div class="flex flex-col gap-1">
    <HitPoints />

    <h3 class="mt-2 font-bold">Attacks</h3>
    <Attack v-for="attack in attacks" :attack="attack" />

    <h3 class="mt-2 font-bold">Temporary Effects</h3>
    <div class="flex flex-col gap-1">
      <Effect
        v-for="(effect, idx) in character.temporaryEffects"
        :effect="effect"
        @delete="deleteEffect(idx)"
        toggle
      />
      <div
        class="btn btn-ghost w-full text-gray-400 border-dashed border-gray-400"
        @click="newEffect()"
      >
        Add a new effect...
      </div>
    </div>
  </div>
</template>
<style scoped></style>
