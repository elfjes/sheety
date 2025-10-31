<script setup lang="ts">
import Card from "./Card.vue";
import { signedInt } from "@/utils";
import type { Attack } from "@/types";
import { computed } from "vue";

const { attack } = defineProps<{ attack: Attack }>();
const damageString = computed(() => {
  return `${attack.dice} + ${attack.damage}` + (attack.extraDice && ` + ${attack.extraDice}`);
});
</script>
<template>
  <Card>
    <template #header>
      <h3 class="font-bold">{{ attack.name }}</h3>
    </template>
    <div>{{ signedInt(attack.attack) }} ({{ damageString }})</div>
  </Card>
</template>
<style scoped></style>
