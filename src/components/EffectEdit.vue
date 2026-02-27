<script setup lang="ts">
import { computed, ref } from "vue";

import { useConfirmation } from "@/composables/useConfirmation.ts";

import { type Armor, DurationUnit, type Effect, EffectKind, type Weapon } from "../types.ts";
import Card from "./Card.vue";
import EffectDetails from "./EffectDetails.vue";
import NumberInput from "./NumberInput.vue";

const { effect, allowedKinds = Object.values(EffectKind) } = defineProps<{
  effect: Effect;
  allowedKinds?: EffectKind[];
}>();
const emit = defineEmits<{
  (e: "update:effect", effect: Effect): void;
  (e: "delete"): void;
  (e: "done"): void;
}>();
const newTagValue = ref("");

if (allowedKinds.length === 1) {
  updateKind(allowedKinds[0]!);
}

const duration = computed({
  get: () => effect.duration !== undefined,
  set: (val: boolean) => {
    if (val) {
      effect.duration = { max: 1, current: 0, unit: "rounds" };
    } else {
      effect.duration = undefined;
    }
  },
});

function updateMaxDuration(newMax: number) {
  if (!effect.duration) return;
  effect.duration.max = newMax;
  effect.duration.current = Math.min(effect.duration.current, newMax);
}

const usages = computed({
  get: () => effect.usages !== undefined,
  set: (val: boolean) => {
    if (val) {
      effect.usages = { max: 1, current: 0 };
    } else {
      effect.usages = undefined;
    }
  },
});

function updateMaxUsages(newMax: number) {
  if (!effect.usages) return;
  effect.usages.max = newMax;
  effect.usages.current = Math.min(effect.usages.current, newMax);
}
function doneEditing() {
  emit("done");
}
const { confirming: deleting, events: deletingEvents } = useConfirmation(() => {
  emit("delete");
});

function newEffect() {
  effect.details.push({
    target: "str",
    modifier: 0,
  });
}
function deleteEffect(idx: number) {
  effect.details.splice(idx, 1);
}
function addNewTag() {
  effect.tags ??= [];
  effect.tags.push(newTagValue.value);
  newTagValue.value = "";
}
function updateKind(newKind: EffectKind) {
  const result: Effect = {
    name: effect.name,
    description: effect.description,
    kind: newKind,
    tags: effect.tags,
    details: effect.details,
    active: effect.active,
    passive: effect.passive,
  };
  if (result.kind == EffectKind.WEAPON) {
    emit("update:effect", {
      ...result,
      dice: (effect as Weapon).dice ?? "",
      ranged: (effect as Weapon).ranged,
      strMod: (effect as Weapon).strMod ?? 1,
    } as Weapon);
    return;
  }
  if (result.kind == EffectKind.ARMOR) {
    emit("update:effect", {
      ...result,
      weightClass: (effect as Armor).weightClass ?? "light",
    } as Armor);
    return;
  }
  emit("update:effect", result);
}
</script>
<template>
  <Card open>
    <template #header>
      <div class="flex flex-row gap-1 items-center">
        <input class="input input-sm w-full" v-model="effect.name" />
        <div class="ml-auto"></div>
        <button class="btn btn-sm" :class="deleting && 'btn-error'" v-on="deletingEvents">
          <i class="fas fa-trash text-center w-8" />
        </button>
        <button class="btn btn-sm" :disabled="deleting" @click="doneEditing()">
          <i class="fas fa-check text-center w-8" />
        </button>
      </div>
    </template>
    <div class="flex flex-col gap-1 max-w-100">
      <div class="grid grid-cols-2 justify-stretch gap-1">
        <label v-if="allowedKinds.length > 1" class="select select-sm">
          <span class="label">Type</span>
          <select
            class="min-w-max"
            :value="effect.kind"
            @input="
              (e) => e.target && updateKind((e.target as HTMLInputElement).value as EffectKind)
            "
          >
            <option v-for="kind in allowedKinds" :value="kind">{{ kind }}</option>
          </select>
        </label>
        <slot></slot>
      </div>
      <div class="flex flex-col gap-1 justify-stretch">
        <div class="grid grid-cols-3 justify-stretch">
          <label class="label text-xs">
            <input type="checkbox" class="checkbox checkbox-xs" v-model="usages" />
            Limit usages
          </label>
          <NumberInput
            v-if="usages"
            size="sm"
            :model-value="effect.usages!.max"
            @update:model-value="updateMaxUsages"
          />
        </div>
        <div class="grid grid-cols-3 justify-stretch">
          <label class="label text-xs">
            <input type="checkbox" class="checkbox checkbox-xs" v-model="duration" />
            Limit duration
          </label>
          <template v-if="effect.duration">
            <NumberInput
              size="sm"
              :model-value="effect.duration.max"
              @update:model-value="updateMaxDuration"
            />
            <label class="select select-sm">
              <select class="min-w-max" v-model="effect.duration.unit">
                <option v-for="unit in DurationUnit" :value="unit">{{ unit }}</option>
              </select>
            </label>
          </template>
        </div>
      </div>
      <template v-for="(_, i) in effect.details">
        <EffectDetails v-model:effect="effect.details[i]!" editing @delete="deleteEffect(i)" />
      </template>
      <div
        class="btn btn-xs btn-ghost w-full text-gray-400 border-dashed border-gray-400"
        @click="newEffect()"
      >
        Add a new effect...
      </div>
      <div class="flex flex-row gap-1 items-center flex-wrap">
        <div v-for="(tag, i) in effect.tags" class="bg-gray-200 border rounded-sm px-1 text-xs">
          {{ tag }}
          <i class="fas fa-xmark bg-gray-200 text-xs" @click="effect.tags!.splice(i, 1)" />
        </div>
        <div
          class="input input-xs h-4 border rounded-sm border-gray-400 text-gray-400 border-dashed px-1 text-xs w-fit"
        >
          <input
            class="w-16"
            type="text"
            placeholder="Add a tag..."
            v-model="newTagValue"
            @keydown.enter="addNewTag()"
          />
          <i v-if="newTagValue" class="fas fa-plus text-xs cursor-pointer" @click="addNewTag()" />
        </div>
      </div>
    </div>
  </Card>
</template>
<style scoped></style>
