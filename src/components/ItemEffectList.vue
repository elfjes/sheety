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
import { hasOwnProperty } from "@/utils";

const effects = defineModel<EffectDetails[]>();
const numericTargets: Record<NumericEffectTargetT | AbilityT | SaveT, string> = {
  str: "str",
  dex: "dex",
  con: "con",
  int: "int",
  wis: "wis",
  cha: "cha",
  fort: "fortitude",
  reflex: "reflex",
  will: "will",
  saves: "all saves",
  attack: "attack",
  damage: "damage",
  ac: "AC",
  armorAc: "armor",
  touchAc: "touch AC",
  skills: "skills",
  initiative: "initiative",
};
const textTargets: Record<TextEffectTargetT, string> = {
  damageDie: "damage die",
};
const allTargets = { ...numericTargets, ...textTargets };

const effectTypes = [
  "unnamed",
  "enhancement",
  "armor",
  "shield",
  "armor-enhancement",
  "shield-enhancement",
  "deflection",
];
</script>
<template>
  <div class="flex flex-row gap-1" v-for="effect in effects">
    <select class="select select-xs w-auto min-w-max" v-model="effect.target">
      <option v-for="(desc, key) in allTargets" :value="key">{{ desc }}</option>
    </select>
    <template v-if="hasOwnProperty(effect.target, numericTargets)">
      <NumberInput size="xs" v-model="(effect as NumericEffectDetails).modifier" />
      <select class="select select-xs" v-model="effect.effectType">
        <option v-for="tp in effectTypes" :value="tp">{{ tp }}</option>
      </select>
    </template>
    <input
      v-else-if="hasOwnProperty(effect.target, textTargets)"
      class="input input-xs"
      v-model="(effect as TextEffectDetails).value"
    />
  </div>
</template>
<style scoped></style>
