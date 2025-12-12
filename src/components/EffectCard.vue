<script setup lang="ts">
import { ref } from "vue";

import { type Effect, EffectKind } from "../types.ts";
import EffectDisplay from "./EffectDisplay.vue";
import EffectEdit from "./EffectEdit.vue";

const editing = defineModel<boolean>("editing", { default: false });
const {
  effect,
  allowedKinds = Object.values(EffectKind),
  editable = false,
  toggle = false,
} = defineProps<{
  effect: Effect;
  allowedKinds?: EffectKind[];
  editable?: boolean;
  toggle?: boolean;
}>();
const emit = defineEmits<{
  (e: "update:effect", effect: Effect): void;
  (e: "delete"): void;
}>();

const open = ref(false);

if (!effect.name) {
  editing.value = true;
}

if (allowedKinds.length === 1) {
  emit("update:effect", {
    ...effect,
    kind: allowedKinds[0]!,
  });
}
</script>
<template>
  <EffectEdit
    v-if="editing"
    :effect="effect"
    @update:effect="(e) => emit('update:effect', e)"
    :allowed-kinds="allowedKinds"
    @delete="emit('delete')"
    @done="editing = false"
  >
    <slot name="editing"></slot>
  </EffectEdit>
  <EffectDisplay
    v-else
    v-model:open="open"
    :effect="effect"
    :editable="editable"
    :toggle="toggle"
    :allowed-kinds="allowedKinds"
    @edit="editing = true"
  >
    <slot name="display"></slot>
  </EffectDisplay>
</template>
<style scoped></style>
