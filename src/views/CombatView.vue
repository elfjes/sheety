<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed } from "vue";

import Attack from "@/components/Attack.vue";
import Card from "@/components/Card.vue";
import EffectCard from "@/components/EffectCard.vue";
import HitPoints from "@/components/HitPoints.vue";
import { useCharacterStore } from "@/stores/character";
import { type Conditional, type ConditionalModifiers, type Effect, EffectKind } from "@/types";
import { signedInt } from "@/utils";

const store = useCharacterStore();
const { character, attacks, ac, saves } = storeToRefs(store);
const allowedTemporaryEffectKinds = [EffectKind.SPELL, EffectKind.OTHER];
function newEffect() {
  character.value?.temporaryEffects.push({
    name: "",
    kind: EffectKind.SPELL,
    details: [],
    active: false,
  });
}
function updateEffect(idx: number, newEffect: Effect) {
  if (!character.value) return;
  character.value.temporaryEffects[idx] = newEffect;
}
function deleteEffect(itemIdx: number) {
  character.value?.temporaryEffects.splice(itemIdx, 1);
}
function processConditionals(input: Record<string, { conditional: ConditionalModifiers<number> }>) {
  const maxLen = Math.max(...Object.values(input).map((v) => v.conditional.length));
  const result: Array<Conditional<number> | undefined>[] = [];
  for (let i = 0; i < maxLen; i++) {
    result.push(Object.keys(input).map((k) => input[k]!.conditional[i]));
  }
  return result;
}
const conditionalAc = computed(() => {
  return processConditionals(ac.value);
});
const conditionalSaves = computed(() => {
  return processConditionals(saves.value);
});
</script>

<template>
  <div class="flex flex-col gap-1">
    <HitPoints />
    <Card collapse>
      <template #header>
        <h3 class="font-bold">
          Armor Class ({{ ac.ac.value }} / t{{ ac.touch.value }} / ff{{ ac.flatfooted.value }})
        </h3>
      </template>
      <div class="grid grid-cols-3 text-sm mb-2">
        <div>Base</div>
        <div>Touch</div>
        <div>Flat Footed</div>
        <div>{{ ac.ac.value }}</div>
        <div>{{ ac.touch.value }}</div>
        <div>{{ ac.flatfooted.value }}</div>
        <template v-for="conds in conditionalAc">
          <template v-for="cond in conds">
            <div v-if="cond">
              {{ signedInt(cond.modifier) }}
              <span class="text-gray-400"> ({{ cond.condition }})</span>
            </div>
            <div v-else></div>
          </template>
        </template>
      </div>
    </Card>
    <Card collapse>
      <template #header>
        <h3 class="font-bold">
          Saving Throws ({{ saves.fort.score }} / {{ saves.reflex.score }} / {{ saves.will.score }})
        </h3>
      </template>
      <div class="grid grid-cols-3 text-sm mb-2">
        <div>Fortitude</div>
        <div>Reflex</div>
        <div>Will</div>
        <div>{{ saves.fort.score }}</div>
        <div>{{ saves.reflex.score }}</div>
        <div>{{ saves.will.score }}</div>
        <template v-for="conds in conditionalSaves">
          <template v-for="cond in conds">
            <div v-if="cond">
              {{ signedInt(cond.modifier) }}
              <span class="text-gray-400"> ({{ cond.condition }})</span>
            </div>
            <div v-else></div>
          </template>
        </template>
      </div>
    </Card>
    <h3 class="mt-2 font-bold">Attacks</h3>
    <Attack v-for="attack in attacks" :attack="attack" />

    <h3 class="mt-2 font-bold">Abilities & Effects</h3>
    <div class="flex flex-col gap-1">
      <template v-for="effect in character?.abilities ?? []">
        <EffectCard v-if="!effect.passive" :effect="effect" toggle usage-slider />
      </template>
      <EffectCard
        v-for="(effect, idx) in character?.temporaryEffects ?? []"
        :effect="effect"
        @update:effect="(e) => updateEffect(idx, e)"
        @delete="deleteEffect(idx)"
        toggle
        editable
        usage-slider
        duration-slider
      />
      <div
        class="btn btn-ghost rounded-box bg-base-200/60 w-full text-gray-400 border-dashed border-gray-400"
        @click="newEffect()"
      >
        Add a new effect...
      </div>
    </div>
  </div>
</template>
<style scoped></style>
