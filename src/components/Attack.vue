<script setup lang="ts">
import Card from "./Card.vue";
import { signedInt } from "@/utils";
import type { Attack } from "@/types";
import { computed } from "vue";

const { attack } = defineProps<{ attack: Attack }>();
const damageString = computed(() => {
  return `${attack.dice} + ${attack.damage}` + (attack.extraDice && ` + ${attack.extraDice}`);
});
const fullAttackString = computed(() => {
  return attack.fullAttack.map(signedInt).join("/");
});
</script>
<template>
  <Card>
    <template #header>
      <h3 class="font-bold">{{ attack.name }}</h3>
    </template>
    <div class="grid grid-cols-[minmax(max-content,30%)_max-content_auto] text-sm gap-x-1">
      <div>Single</div>
      <div>{{ signedInt(attack.attack) }}</div>
      <div>({{ damageString }})</div>
      <template v-if="attack.fullAttack.length > 1">
        <div>Full Attack</div>
        <div>{{ fullAttackString }}</div>
        <div>({{ damageString }})</div>
      </template>
    </div>
  </Card>
</template>
<style scoped></style>
