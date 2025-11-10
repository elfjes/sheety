<script setup lang="ts">
import {
  type AbilityT,
  type EffectDetails,
  type EffectTarget,
  type NumericEffectDetails,
  type NumericEffectTargetT,
  type SaveT,
  type TextEffectDetails,
  type TextEffectTargetT,
} from "@/types";
import NumberInput from "./NumberInput.vue";
import ConfirmButton from "./ConfirmButton.vue";
import { hasOwnProperty, signedInt } from "@/utils";
import { computed } from "vue";
import { effectTypes } from "@/constants";
import { useConfirmation } from "@/composables/useConfirmation";
const effect = defineModel<EffectDetails>("effect", { required: true });
const { editing = false } = defineProps<{ editing: boolean }>();
const emit = defineEmits<{
  (e: "delete"): void;
  (e: "update:effect", v: EffectDetails): void;
}>();
const { confirming, events } = useConfirmation(() => {
  toggleConditional();
});
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

const hasConditional = computed(() => effect.value.conditional != undefined);
const conditionalButtonEvents = computed(() => {
  if (hasConditional.value) return events;
  return {
    click: () => (effect.value.conditional ??= ""),
  };
});
function toggleConditional() {
  if (hasConditional.value) {
    effect.value.conditional = undefined;
  } else {
    effect.value.conditional = "";
  }
}

function confirmDelete() {
  emit("delete");
}

function updateTarget(newTarget: EffectTarget) {
  if (hasOwnProperty(numericTargets, newTarget)) {
    emit("update:effect", {
      target: newTarget,
      modifier: (effect.value as NumericEffectDetails).modifier ?? 0,
      tags: effect.value.tags,
      effectType: effect.value.effectType,
      conditional: effect.value.conditional,
    });
  } else if (hasOwnProperty(textTargets, newTarget)) {
    emit("update:effect", {
      target: newTarget,
      value: (effect.value as TextEffectDetails).value ?? "",
      tags: effect.value.tags,
      effectType: effect.value.effectType,
      conditional: effect.value.conditional,
    });
  }
}
</script>
<template>
  <div class="flex flex-row gap-1">
    <template v-if="editing">
      <select
        class="select select-xs w-auto min-w-20"
        :value="effect.target"
        @input="(val) => updateTarget((val.target as HTMLInputElement).value as EffectTarget)"
      >
        <option v-for="(desc, key) in allTargets" :value="key">{{ desc }}</option>
      </select>
      <button
        class="btn btn-xs"
        :class="{ 'btn-error': confirming, 'btn-primary': !confirming && hasConditional }"
        v-on="conditionalButtonEvents"
      >
        ?
      </button>

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
      <template v-else-if="hasOwnProperty(textTargets, effect.target)">
        <div>{{ (effect as TextEffectDetails).value }}</div>
        <div v-if="effect.conditional" class="text-gray-400">({{ effect.conditional }})</div>
      </template>
    </template>
  </div>
  <div v-if="editing && hasConditional" class="flex flex-row gap-1 text-xs pl-5 pr-9 items-center">
    <div>Conditional:</div>
    <input class="input input-xs text-xs" v-model="effect.conditional" />
  </div>
</template>
<style scoped></style>
