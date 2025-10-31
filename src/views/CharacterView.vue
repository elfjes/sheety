<script setup lang="ts">
import { useCharacterStore } from "@/stores/character";
import { Ability, Save } from "@/types";
import { storeToRefs } from "pinia";
import NumberInput from "@/components/NumberInput.vue";
import { signedInt } from "@/utils";
import Card from "@/components/Card.vue";

const store = useCharacterStore();
const { abilities, saves, ac, hitpoints } = storeToRefs(store);
</script>
<template>
  <div class="flex flex-col gap-1">
    <Card>
      <template #header>
        <h2 class="text-lg font-bold">Hit Points</h2>
      </template>
      <div class="flex flex-col gap-1">
        <div class="flex items-center gap-1">
          <div class="w-16 text-right">Max HP:</div>
          <NumberInput type="number" v-model="store.character.baseHitpoints" />
          <div class="w-8 text-right">{{ hitpoints.max }}</div>
        </div>
      </div>
    </Card>

    <Card>
      <template #header>
        <h2 class="text-lg font-bold">Abilities</h2>
      </template>
      <div class="flex flex-col gap-1">
        <div v-for="ability in Ability" class="flex gap-1 items-center">
          <div class="w-16 text-right">{{ ability.toUpperCase() }}:</div>
          <NumberInput
            type="number"
            :model-value="abilities[ability].base"
            @update:model-value="(val) => store.updateBaseAbilityScore(ability, val)"
          />
          <div
            class="w-8 text-right"
            :class="abilities[ability].score !== abilities[ability].base && 'font-bold'"
          >
            {{ abilities[ability].score }}
          </div>
          <input disabled class="w-8 text-right" :value="signedInt(abilities[ability].mod)" />
        </div>
      </div>
    </Card>

    <Card>
      <template #header>
        <h2 class="text-lg font-bold">Saves</h2>
      </template>
      <div>
        <div class="p-2">
          <div class="flex flex-col gap-1">
            <div v-for="save in Save" class="flex gap-1 items-center">
              <div class="w-16 text-right">{{ save.toUpperCase() }}:</div>
              <NumberInput
                type="number"
                :model-value="saves[save].base"
                @update:model-value="(val) => store.updateBaseSave(save, val)"
              />
              <input disabled class="w-8 text-right" :value="signedInt(saves[save].score)" />
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
<style scoped></style>
