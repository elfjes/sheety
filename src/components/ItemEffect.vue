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
import { hasOwnProperty, signedInt } from "@/utils";
import { ref } from "vue";

const effect = defineModel<EffectDetails>({ required: true });
const { editing = false } = defineProps<{ editing: boolean }>();
const emit = defineEmits(["delete"]);
const deleting = ref(false);
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
  "",
  "enhancement",
  "armor",
  "shield",
  "armor-enhancement",
  "shield-enhancement",
  "deflection",
];
function confirmDelete() {
  if (deleting.value) {
    emit("delete");
    deleting.value = false;
    return;
  }
  deleting.value = true;
}
</script>
<template>
  <div class="flex flex-row gap-1">
    <template v-if="editing">
      <select class="select select-xs w-auto min-w-max" v-model="effect.target">
        <option v-for="(desc, key) in allTargets" :value="key">{{ desc }}</option>
      </select>
      <template v-if="hasOwnProperty(numericTargets, effect.target)">
        <NumberInput size="xs" v-model="(effect as NumericEffectDetails).modifier" />
        <select class="select select-xs" v-model="effect.effectType">
          <option v-for="tp in effectTypes" :value="tp">{{ tp }}</option>
        </select>
      </template>
      <input
        v-else-if="hasOwnProperty(textTargets, effect.target)"
        class="input input-xs"
        v-model="(effect as TextEffectDetails).value"
      />
      <button
        class="btn btn-xs"
        :class="deleting && 'btn-error'"
        @click="confirmDelete()"
        @blur="deleting = false"
      >
        <i class="fas fa-trash text-center w-8" />
      </button>
    </template>
    <template v-else>
      <div>{{ allTargets[effect.target] }}</div>

      <template v-if="hasOwnProperty(numericTargets, effect.target)">
        <div>{{ signedInt(effect.modifier) }}</div>
        <div class="text-gray-400">({{ effect.effectType || "-" }})</div>
      </template>
      <input
        v-else-if="hasOwnProperty(textTargets, effect.target)"
        class="input input-xs"
        v-model="(effect as TextEffectDetails).value"
      />
    </template>
  </div>
</template>
<style scoped></style>
