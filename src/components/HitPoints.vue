<script setup lang="ts">
import { useCharacterStore } from "@/stores/character";
import { computed, ref } from "vue";
import NumberInput from "./NumberInput.vue";
import { storeToRefs } from "pinia";
import Card from "./Card.vue";
import ConfirmButton from "./ConfirmButton.vue";

const store = useCharacterStore();
const { hitpoints } = storeToRefs(store);
const hitpointMax = computed(() =>
  hitpoints.value.current < 0 ? hitpoints.value.min : hitpoints.value.max,
);

const addingEvent = ref(false);
const isDamageEvent = ref(false);
const eventValue = ref(0);
function newEvent(isDamage: boolean = false) {
  addingEvent.value = true;
  isDamageEvent.value = isDamage;
}
function finishNewEvent() {
  if (eventValue.value !== 0) {
    hitpoints.value.events.push(eventValue.value * (isDamageEvent.value ? -1 : 1));
  }
  cancelEvent();
}
function cancelEvent() {
  addingEvent.value = false;
  eventValue.value = 0;
}
function resetHP() {
  store.resetHitpoints();
}
</script>
<template>
  <Card>
    <template #header>
      <h3 class="font-bold overflow-hidden text-ellipsis flex-shrink-1">
        Hit Points
        <span
          :class="{
            'text-success': hitpoints.current > hitpoints.max,
            'text-error': hitpoints.current < 0,
          }"
          >{{ hitpoints.current }}</span
        >
        / {{ hitpointMax }}
      </h3>
    </template>
    <div class="flex flex-col flex-wrap content-start gap-x-2 max-h-30">
      <div
        v-for="evt in hitpoints.events"
        class="font-bold text-right w-4"
        :class="evt < 0 ? 'text-error' : 'text-success'"
      >
        {{ evt }}
      </div>
    </div>
    <div v-if="addingEvent" class="flex gap-1 items-center">
      <NumberInput
        v-model="eventValue"
        :btnStyle="isDamageEvent ? 'btn-error' : 'btn-success'"
        @keydown.enter="finishNewEvent()"
      />
      <button class="btn btn-ghost w-8" @click="finishNewEvent()">
        <i class="fas fa-check" />
      </button>
      <button class="btn btn-ghost w-8" @click="cancelEvent()">
        <i class="fas fa-xmark" />
      </button>
    </div>
    <div v-else>
      <div class="join">
        <button class="join-item btn" @click="newEvent(true)">
          <i class="fas fa-skull text-error" />
        </button>
        <button class="join-item btn" @click="newEvent(false)">
          <i class="fas fa-heart text-success" />
        </button>
        <button class="join-item btn" @click="hitpoints.events.pop()">
          <i class="fas fa-arrow-up" />
        </button>
        <ConfirmButton
          class="join-item"
          confirm-color="warning"
          icon="fa-rotate-left"
          @confirm="resetHP"
        />
      </div>
    </div>
  </Card>
</template>
<style scoped></style>
