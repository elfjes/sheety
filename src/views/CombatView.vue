<script setup lang="ts">
import HitPoints from "@/components/HitPoints.vue";
import Attack from "@/components/Attack.vue";
import { useCharacterStore } from "@/stores/character";
import { storeToRefs } from "pinia";
import { EffectKind } from "@/types";
import Effect from "@/components/Effect.vue";
import Card from "@/components/Card.vue";
import { signedInt } from "@/utils";

const store = useCharacterStore();
const { character, attacks, ac, saves } = storeToRefs(store);
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
    <Card collapse>
      <template #header>
        <h3 class="font-bold">
          Armor Class ({{ ac.ac }} / t{{ ac.touch }} / ff{{ ac.flatfooted }})
        </h3>
      </template>
      <div class="grid grid-cols-3">
        <div>Base</div>
        <div>Touch</div>
        <div>Flat Footed</div>
        <div>{{ ac.ac }}</div>
        <div>{{ ac.touch }}</div>
        <div>{{ ac.flatfooted }}</div>
      </div>
      <div v-for="(mod, cond) in ac.conditional">{{ cond }}: {{ signedInt(mod) }}</div>
    </Card>
    <Card collapse>
      <template #header>
        <h3 class="font-bold">
          Saving Throws ({{ saves.fort.score }} / {{ saves.reflex.score }} / {{ saves.will.score }})
        </h3>
      </template>
      <div class="grid grid-cols-3">
        <div>Fortitude</div>
        <div>Reflex</div>
        <div>Will</div>
        <div>{{ saves.fort.score }}</div>
        <div>{{ saves.reflex.score }}</div>
        <div>{{ saves.will.score }}</div>
      </div>
      <div v-for="(mod, cond) in saves.conditional">{{ cond }}: {{ signedInt(mod) }}</div>
    </Card>
    <h3 class="mt-2 font-bold">Attacks</h3>
    <Attack v-for="attack in attacks" :attack="attack" />

    <h3 class="mt-2 font-bold">Abilities & Effects</h3>
    <div class="flex flex-col gap-1">
      <template v-for="(effect, idx) in character.feats">
        <Effect v-if="!effect.passive" :effect="effect" toggle />
      </template>
      <Effect
        v-for="(effect, idx) in character.temporaryEffects"
        :effect="effect"
        @delete="deleteEffect(idx)"
        toggle
        editable
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
