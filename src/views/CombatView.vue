<script setup lang="ts">
import HitPoints from "@/components/HitPoints.vue";
import Attack from "@/components/Attack.vue";
import { useCharacterStore } from "@/stores/character";
import { storeToRefs } from "pinia";
import { EffectKind, Save, type ConditionalModifiers, type SaveT } from "@/types";
import Effect from "@/components/Effect.vue";
import Card from "@/components/Card.vue";
import { signedInt } from "@/utils";
import { computed } from "vue";

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
function processConditionals(input: Record<string, { conditional: ConditionalModifiers }>) {
  const conditionalsAsArray: Record<string, [string, number][]> = Object.entries(input).reduce(
    (prev, [save, values]) => {
      prev[save] = Object.entries(values.conditional);
      return prev;
    },
    {} as Record<string, [string, number][]>,
  );
  const maxLen = Math.max(...Object.values(conditionalsAsArray).map((v) => v.length));
  const result: Array<[string, number] | undefined>[] = [];
  for (let i = 0; i < maxLen; i++) {
    result.push(
      Object.keys(input).map((k) => conditionalsAsArray[k]![i] as [string, number] | undefined),
    );
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
              {{ signedInt(cond[1]) }} <span class="text-gray-400"> ({{ cond[0] }})</span>
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
              {{ signedInt(cond[1]) }} <span class="text-gray-400"> ({{ cond[0] }})</span>
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
      <template v-for="effect in character.abilities">
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
