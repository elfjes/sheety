<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

import Card from "@/components/Card.vue";
import EffectCard from "@/components/EffectCard.vue";
import NumberInput from "@/components/NumberInput.vue";
import Slider from "@/components/Slider.vue";
import { useConfirmation } from "@/composables/useConfirmation";
import { useCharacterStore } from "@/stores/character";
import { Ability, EffectKind, type Spell } from "@/types";

const store = useCharacterStore();
const { character, spellLevels } = storeToRefs(store);
const cardOpen = ref(true);
const spontaneousCaster = computed({
  get: () => character.value?.caster?.spontaneous,
  set: (val: boolean) => {
    if (!character.value) return;
    if (val) {
      const caster = character.value.ensureCaster();
      caster.spontaneous = true;
    }
  },
});

const { confirming: confirmingDeleteSpellLevel, events: eventsDeleteSpellLevel } = useConfirmation(
  () => {
    if (!character.value?.caster) return;
    const caster = character.value.caster;
    caster.spellLevels.pop();
  },
);
const { confirming: confirmingDisableCaster, events: eventsDisableCaster } = useConfirmation(() => {
  if (!character.value?.caster) return;
  if (character.value.caster.spellLevels.flat().length !== 0) {
    alert("Delete all spells levels before disabling caster");
    return;
  }
  character.value.caster = undefined;
});
function enableCasting() {
  if (!character.value) return;
  character.value.ensureCaster();
  cardOpen.value = true;
}

function newSpellLevel() {
  if (!character.value?.caster) return;
  const caster = character.value.ensureCaster();
  caster.spellLevels.push({
    baseSpellsPerDay: 1,
    castAmount: 0,
    spells: [],
  });
}
function newSpell(spellLevel: number) {
  if (!character.value?.caster?.spellLevels[spellLevel]) return;

  const newSpell: Spell = {
    name: "",
    kind: EffectKind.SPELL,
    details: [],
    active: false,
  };
  if (!character.value.caster.spontaneous) {
    newSpell.usages = {
      max: 1,
      current: 0,
    };
  }
  character.value.caster.spellLevels[spellLevel].spells.push(newSpell);
}

function deleteSpell(spellLevel: number, idx: number) {
  if (!character.value?.caster?.spellLevels[spellLevel]) return;
  character.value.caster.spellLevels[spellLevel].spells.splice(idx, 1);
}

function updateSpell(item: Spell, spellLevel: number, idx: number) {
  if (!character.value?.caster?.spellLevels[spellLevel]) return;
  character.value.caster.spellLevels[spellLevel].spells[idx] = item;
}
</script>
<template>
  <div v-if="character?.caster" class="flex flex-col gap-1">
    <Card collapse v-model:open="cardOpen">
      <template #header>
        <h2 class="text-lg font-bold">{{ character.casterString() }}</h2>
      </template>
      <div class="flex flex-row justify-between w-full">
        <div class="flex flex-col gap-1 mb-3 w-2/3">
          <div class="flex flex-row justify-stretch">
            <label class="select select-sm w-full">
              <span class="label">Ability</span>
              <select class="min-w-max" v-model="character.caster.ability">
                <option v-for="ability in Ability" :value="ability">{{ ability }}</option>
              </select>
            </label>
          </div>

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
        <button
          class="btn btn-sm"
          :class="{ 'btn-error': confirmingDisableCaster }"
          v-on="eventsDisableCaster"
        >
          <i class="fas fa-trash text-center w-5" />
        </button>
      </div>

      <div class="grid grid-cols-[repeat(5, max-content)] gap-y-1 gap-x-3 justify-stretch">
        <div class="text-sm text-right">Spell Level</div>
        <div class="text-sm">Spells per day</div>
        <div class="text-sm text-center">Bonus</div>
        <div class="text-sm text-center">Total</div>
        <div></div>
        <template v-for="(obj, level) in spellLevels">
          <div class="text-right">{{ level }}</div>
          <NumberInput
            size="xs"
            :model-value="obj.baseSpellsPerDay"
            @update:model-value="(v) => store.updateBaseSpellsPerDay(level, v)"
          />
          <div class="text-center">{{ obj.bonusSpells }}</div>
          <div class="text-center font-bold">
            {{ obj.bonusSpells + obj.baseSpellsPerDay || "-" }}
          </div>
          <div class="text-right">
            <button
              v-if="level === spellLevels.length - 1"
              class="btn btn-xs"
              :class="{ 'btn-error': confirmingDeleteSpellLevel }"
              v-on="eventsDeleteSpellLevel"
            >
              <i class="fas fa-trash text-center w-5" />
            </button>
          </div>
        </template>
        <div
          v-if="spellLevels.length < 10"
          class="btn btn-ghost btn-xs col-span-5 text-gray-400 border-dashed border-gray-400"
          @click="newSpellLevel()"
        >
          Add a new spell level...
        </div>
      </div>
    </Card>
    <div v-for="(spells, spellLevel) in character.spellLevels()" class="flex flex-col gap-1">
      <div class="divider text-sm mt-6 mb-1">LEVEL {{ spellLevel }}</div>
      <Card v-if="spontaneousCaster">
        <template #header><h2 class="font-bold">Spells cast</h2></template>
        <Slider
          :model-value="spells.castAmount"
          @update:model-value="(val) => store.updateCastAmount(spellLevel, val)"
          :max-val="Math.max(spells.baseSpellsPerDay + spells.bonusSpells, 0)"
      /></Card>
      <EffectCard
        v-for="(spell, idx) in spells.spells"
        editable
        :allowedKinds="[EffectKind.SPELL]"
        :effect="spell"
        @update:effect="(s) => updateSpell(s as Spell, spellLevel, idx)"
        @delete="deleteSpell(spellLevel, idx)"
        :usage-slider="!spontaneousCaster"
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
