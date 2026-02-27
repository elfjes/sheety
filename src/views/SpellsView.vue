<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref, watch } from "vue";

import Card from "@/components/Card.vue";
import EffectCard from "@/components/EffectCard.vue";
import NumberInput from "@/components/NumberInput.vue";
import { useConfirmation } from "@/composables/useConfirmation";
import { useCharacterStore } from "@/stores/character";
import { Ability, EffectKind, type Spell } from "@/types";

const store = useCharacterStore();
const { character, spellsPerDay } = storeToRefs(store);
const cardOpen = ref(true);
const { confirming, events } = useConfirmation(() => {
  if (!character.value?.caster) return;
  const caster = character.value.caster;
  caster.baseSpellsPerDay.pop();
  pruneSpellLevels();
});
function enableCasting() {
  if (!character.value) return;
  character.value.caster ??= {
    casterLevel: 1,
    ability: "int",
    spontaneous: false,
    baseSpellsPerDay: [0],
    spells: [[]],
  };
  cardOpen.value = true;
}
function newSpellLevel() {
  if (!character.value?.caster) return;
  character.value.caster.baseSpellsPerDay.push(0);
  while (character.value.caster.spells.length < character.value.caster.baseSpellsPerDay.length) {
    character.value.caster.spells.push([]);
  }
}
function newSpell(spellLevel: number) {
  if (!character.value?.caster) return;
  character.value.caster.spells[spellLevel] ??= [];
  character.value.caster.spells[spellLevel].push({
    name: "",
    kind: EffectKind.SPELL,
    details: [],
    active: false,
    usages: {
      max: 1,
      current: 0,
    },
  });
}
function pruneSpellLevels() {
  if (!character.value?.caster) return;
  const caster = character.value.caster;
  const maxSpellLevel = caster.baseSpellsPerDay.length;
  while (
    caster.spells.length > maxSpellLevel &&
    caster.spells[caster.spells.length - 1]!.length === 0
  ) {
    caster.spells.pop();
  }
}
function deleteSpell(spellLevel: number, idx: number) {
  if (!character.value?.caster) return;
  const maxSpellLevel = character.value.caster.baseSpellsPerDay.length;
  const spells = character.value.caster.spells;
  spells[spellLevel]?.splice(idx, 1);
  if (
    spellLevel > maxSpellLevel &&
    spellLevel === spells.length - 1 &&
    spells[spellLevel]?.length === 0
  ) {
    spells.pop();
  }
  pruneSpellLevels();
}

function updateSpell(item: Spell, spellLevel: number, idx: number) {
  if (!character.value?.caster) return;
  if (!character.value?.caster.spells[spellLevel]) return;
  character.value.caster.spells[spellLevel][idx] = item;
}
</script>
<template>
  <div v-if="character?.caster" class="flex flex-col gap-1">
    <Card collapse v-model:open="cardOpen">
      <template #header>
        <h2 class="text-lg font-bold">{{ character.casterString() }}</h2>
      </template>
      <div class="flex flex-col gap-1 mb-3 w-2/3">
        <label class="select select-sm w-full">
          <span class="label">Ability</span>
          <select class="min-w-max" v-model="character.caster.ability">
            <option v-for="ability in Ability" :value="ability">{{ ability }}</option>
          </select>
        </label>

        <div class="flex flex-row text-sm w-full justify-between">
          <span>Caster level</span>
          <NumberInput size="xs" v-model="character.caster.casterLevel" />
        </div>

        <div class="flex flex-row text-sm w-full justify-between">
          <span>Spontaneous caster</span>
          <input
            type="checkbox"
            class="checkbox checkbox-xs"
            v-model="character.caster.spontaneous"
          />
        </div>
      </div>
      <div class="grid grid-cols-[repeat(5, max-content)] gap-y-1 gap-x-3 justify-stretch">
        <div class="text-sm text-right">Spell Level</div>
        <div class="text-sm">Spells per day</div>
        <div class="text-sm text-center">Bonus</div>
        <div class="text-sm text-center">Total</div>
        <div></div>
        <template v-for="(spd, level) in spellsPerDay">
          <div class="text-right">{{ level }}</div>
          <NumberInput
            size="xs"
            :model-value="spd.base"
            @update:model-value="(v) => store.updateBaseSpellsPerDay(level, v)"
          />
          <div class="text-center">{{ spd.bonus }}</div>
          <div class="text-center font-bold">{{ spd.bonus + spd.base || '-' }}</div>
          <div class="text-right">
            <button
              v-if="level === spellsPerDay.length - 1"
              class="btn btn-xs"
              :class="{ 'btn-error': confirming }"
              v-on="events"
            >
              <i class="fas fa-trash text-center w-5" />
            </button>
          </div>
        </template>
        <div
          v-if="spellsPerDay.length < 10"
          class="btn btn-ghost btn-xs col-span-5 text-gray-400 border-dashed border-gray-400"
          @click="newSpellLevel()"
        >
          Add a new spell level...
        </div>
      </div>
    </Card>
    <div v-for="(spells, spellLevel) in character.caster.spells" class="flex flex-col gap-1">
      <div class="divider text-sm mt-6 mb-1">LEVEL {{ spellLevel }}</div>
      <EffectCard
        v-for="(spell, idx) in spells"
        editable
        :allowedKinds="[EffectKind.SPELL]"
        :effect="spell"
        @update:effect="(s) => updateSpell(s as Spell, spellLevel, idx)"
        @delete="deleteSpell(spellLevel, idx)"
        usage-slider
        toggle
      />
      <div
        class="btn btn-ghost rounded-box bg-base-200/60 w-full text-gray-400 border-dashed border-gray-400"
        @click="newSpell(spellLevel)"
      >
        Add a new spell at level {{ spellLevel }}...
      </div>
    </div>
  </div>
  <div
    v-else
    class="btn btn-ghost rounded-box bg-base-200/60 w-full text-gray-400 border-dashed border-gray-400"
    @click="enableCasting"
  >
    Enable casting
  </div>
</template>
<style scoped></style>
