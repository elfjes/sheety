<script setup lang="ts">
import Card from "./Card.vue";
import { signedInt } from "@/utils";
import type { Attack } from "@/types";

const { attack } = defineProps<{ attack: Attack }>();
</script>
<template>
  <Card>
    <template #header>
      <h3 class="font-bold">{{ attack.name }}</h3>
    </template>
    <div>
      {{ signedInt(attack.attack) }} ({{ attack.dice }} + {{ attack.damage }} +
      {{ attack.extraDice }})
    </div>
  </Card>
</template>
<style scoped></style>
