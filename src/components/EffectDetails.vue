<script setup lang="ts">
import type {
  AbilityT,
  EffectDetails,
  NumericEffectDetails,
  NumericEffectTargetT,
  SaveT,
  TextEffectDetails,
  TextEffectTargetT,
} from "@/types";
import NumberInput from "./NumberInput.vue";
import ConfirmButton from "./ConfirmButton.vue";
import { hasOwnProperty, signedInt } from "@/utils";
import { ref } from "vue";
import { effectTypes } from "@/constants";
const effect = defineModel<EffectDetails>({ required: true });
const { editing = false } = defineProps<{ editing: boolean }>();
const emit = defineEmits(["delete"]);
const numericTargets: Record<NumericEffectTargetT | AbilityT | SaveT, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
  fort: "Fortitude",
  reflex: "Reflex",
  will: "Will",
  saves: "All saves",
  attack: "Attack",
  damage: "Damage",
  ac: "AC",
  armorAc: "Armor",
  shieldAc: "Shield",
  touchAc: "Touch AC",
  skills: "Tkills",
  initiative: "Initiative",
  hp: "HP",
  extraAttack: "Extra attack (@)",
  baseAttack: "Base attack",
};
const textTargets: Record<TextEffectTargetT, string> = {
  damageDie: "damage die",
};
const allTargets = { ...numericTargets, ...textTargets };

function confirmDelete() {
  emit("delete");
}
</script>
<template>
  <div class="flex flex-row gap-1">
    <template v-if="editing">
      <select class="select select-xs w-auto min-w-20" v-model="effect.target">
        <option v-for="(desc, key) in allTargets" :value="key">{{ desc }}</option>
      </select>
      <button class="btn btn-xs" @click="effect.conditional ??= ''">?</button>
      <template v-if="hasOwnProperty(numericTargets, effect.target)">
        <NumberInput size="xs" v-model="(effect as NumericEffectDetails).modifier" />
        <select class="select select-xs" v-model="effect.effectType">
          <option v-for="tp in effectTypes" :value="tp">{{ tp }}</option>
        </select>
      </template>
      <input
        v-else-if="hasOwnProperty(textTargets, effect.target)"
        class="input input-xs text-xs"
        v-model="(effect as TextEffectDetails).value"
      />
      <ConfirmButton
        class="ml-auto"
        size="xs"
        confirm-color="error"
        icon="fa-trash"
        @confirm="confirmDelete"
      />
    </template>
    <template v-else>
      <div>{{ allTargets[effect.target] }}</div>

      <template v-if="hasOwnProperty(numericTargets, effect.target)">
        <div>{{ signedInt(effect.modifier) }}</div>
        <div v-if="effect.conditional" class="text-gray-400">({{ effect.conditional }})</div>
        <div class="text-gray-400">({{ effect.effectType || "-" }})</div>
      </template>
      <div v-else-if="hasOwnProperty(textTargets, effect.target)">
        {{ (effect as TextEffectDetails).value }}
      </div>
    </template>
  </div>
  <div
    v-if="editing && effect.conditional != undefined"
    class="flex flex-row gap-1 text-xs pl-5 pr-9 items-center"
  >
    <div>Conditional:</div>
    <input class="input input-xs text-xs" v-model="effect.conditional" />
    <ConfirmButton
      size="xs"
      confirm-color="error"
      icon="fa-trash"
      @confirm="effect.conditional = undefined"
    />
  </div>
</template>
<style scoped></style>
