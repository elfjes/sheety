<script setup lang="ts">
import { computed } from "vue";

import { useConfirmation } from "@/composables/useConfirmation";
import { type Action } from "@/types";

const { action } = defineProps<{
  action: Action;
}>();

const emit = defineEmits<{
  (e: "action", event: string): void;
}>();
const { confirming, events: confiringEvents } = useConfirmation(emitEvent);

const events = computed(() => {
  return action.confirm
    ? confiringEvents
    : {
        click: emitEvent,
      };
});
// bg-primary text-primary-content text-primary
// bg-accent text-accent-content text-accent
// bg-success text-success-content text-success
// bg-warning text-warning-content text-warning
// bg-error text-error-content text-error
const classes = computed(() => {
  const color = action.color ?? (action.confirm ? "neutral" : null);
  if (!color) return ["hover:bg-base-200 "];
  if (!action.confirm) return ["bg-" + color, "hover:bg-base-200 "];
  if (confirming.value) return ["bg-" + color, `text-${color}-content`];
  return ["text-" + color, "hover:bg-base-200 "];
});
function emitEvent() {
  emit("action", action.event);
}
</script>

<template>
  <li class="text-lg font-medium w-full cursor-pointer px-2 py-1" :class="classes">
    <a v-on="events">{{ action.title }}</a>
  </li>
</template>

<style scoped></style>
