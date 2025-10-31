<script setup lang="ts">
import HitPoints from "@/components/HitPoints.vue";
import Attack from "@/components/Attack.vue";
import { useCharacterStore } from "@/stores/character";
import { storeToRefs } from "pinia";

const store = useCharacterStore();
const { attacks } = storeToRefs(store);
</script>

<template>
  <div class="flex flex-col gap-1">
    <HitPoints />

    <h3 class="mt-2 font-bold">Attacks</h3>
    <Attack v-for="attack in attacks" :attack="attack" />
    
    <h3 class="mt-2 font-bold">Temporary Effects</h3>
    :te
  </div>
</template>
<style scoped></style>
