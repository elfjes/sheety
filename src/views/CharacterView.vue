<script setup lang="ts">
import { useCharacterStore } from '@/stores/character'
import { Ability, Save } from '@/types';
import { storeToRefs } from 'pinia';
import NumberInput from '@/components/NumberInput.vue';
import { signedInt } from '@/utils';

const store = useCharacterStore()
const { abilities, saves, ac } = storeToRefs(store)
</script>
<template>
  <div>
    <h2 class="text-lg font-bold">Abilities</h2>
    <div class="p-2">
      <div class="flex flex-col gap-1">
        <div v-for="ability in Ability" class="flex gap-1 items-center">
          <div class="w-16 text-right">{{ ability.toUpperCase() }}:</div>
          <NumberInput type="number" :model-value=abilities[ability].base
            @update:model-value="(val) => store.updateBaseAbilityScore(ability, val)" />
          <input class="w-8 text-right" :class="abilities[ability].score !== abilities[ability].base && 'font-bold'"
            :value=abilities[ability].score>
          <input disabled class="w-8 text-right" :value=signedInt(abilities[ability].mod)>
        </div>
      </div>
    </div>
  </div>

  <div>
    <h2 class="text-lg font-bold">AC</h2>
    <div class="p-2">
      <div class="flex flex-col gap-1">
        <div class="flex gap-1 items-center">
          <div class="w-32 text-right">AC:</div>
          <input disabled class="w-8 text-right" :value=ac.ac>
        </div>
        <div class="flex gap-1 items-center">
          <div class="w-32 text-right">Touch AC:</div>
          <input disabled class="w-8 text-right" :value=ac.touch>
        </div>
        <div class="flex gap-1 items-center">
          <div class="w-32 text-right">Flat footed AC:</div>
          <input disabled class="w-8 text-right" :value=ac.flatfooted>
        </div>


      </div>
    </div>
  </div>

  <div>
    <h2 class="text-lg font-bold">Saves</h2>
    <div class="p-2">
      <div class="flex flex-col gap-1">
        <div v-for="save in Save" class="flex gap-1 items-center">
          <div class="w-16 text-right">{{ save.toUpperCase() }}:</div>
          <NumberInput type="number" :model-value=saves[save].base
            @update:model-value="(val) => store.updateBaseSave(save, val)" />
          <input disabled class="w-8 text-right" :value=signedInt(saves[save].score)>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped></style>
