<script setup lang="ts">
import { signedInt } from "@/utils.ts";
import { hasOwnProperty } from "@/utils.ts";

import {
  type Effect,
  EffectKind,
  type NumericEffectDetails,
  type TextEffectDetails,
} from "../types.ts";
import Card from "./Card.vue";
import Slider from "./Slider.vue";
import { allTargets, numericTargets, textTargets } from "./effectTargets.ts";

const {
  effect,
  editable = false,
  toggle = false,
  open = false,
  usageSlider = false,
} = defineProps<{
  effect: Effect;
  allowedKinds?: EffectKind[];
  editable?: boolean;
  toggle?: boolean;
  open?: boolean;
  usageSlider?: boolean;
}>();

const emit = defineEmits<{
  (e: "edit"): void;
  (e: "update:open", val: boolean): void;
}>();
</script>
<template>
  <Card :open="open" @update:open="(e) => emit('update:open', e)" collapse>
    <template #pre-header v-if="toggle">
      <input type="checkbox" class="checkbox checkbox-sm mr-1" v-model="effect.active" />
    </template>
    <template #header>
      <div class="flex flex-row gap-1 items-center">
        <h3 class="font-bold overflow-hidden text-ellipsis flex-shrink-1">
          {{ effect.name }}
        </h3>
        <div class="text-gray-400">({{ effect.kind }})</div>
        <button
          v-if="editable"
          class="btn btn-xs btn-square btn-ghost ml-auto"
          @click="emit('edit')"
        >
          <i class="fas fa-pencil text-center w-8" />
        </button>
      </div>
    </template>

    <template #sub-header v-if="usageSlider && effect.usages">
      <Slider
        v-model="effect.usages.current"
        :max-val="effect.usages.max"
        :compact-ticks="effect.usages.max > 10"
      />
    </template>
    <div class="flex flex-col gap-1 max-w-100">
      <template v-if="effect.usages">
        <div>Max usages: {{ effect.usages.max }}</div>
      </template>
      <slot></slot>
      <template v-for="details in effect.details">
        <div class="flex flex-row gap-1">
          <div>{{ allTargets[details.target] }}</div>

          <template v-if="hasOwnProperty(numericTargets, details.target)">
            <div>{{ signedInt((details as NumericEffectDetails).modifier) }}</div>
            <div v-if="details.conditional" class="text-gray-400">({{ details.conditional }})</div>
            <div class="text-gray-400">({{ details.effectType || "-" }})</div>
          </template>
          <template v-else-if="hasOwnProperty(textTargets, details.target)">
            <div>{{ (details as TextEffectDetails).value }}</div>
            <div v-if="details.conditional" class="text-gray-400">({{ details.conditional }})</div>
          </template>
        </div>
      </template>

      <div class="flex flex-row gap-1 items-center flex-wrap">
        <div v-for="tag in effect.tags" class="bg-gray-200 border rounded-sm px-1 text-xs">
          {{ tag }}
        </div>
      </div>
    </div>
  </Card>
</template>
<style scoped></style>
