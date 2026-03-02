<script setup lang="ts">
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

import Card from "@/components/Card.vue";
import NumberInput from "@/components/NumberInput.vue";
import { useCharacterStore } from "@/stores/character";
import { Ability, type AbilityT, type CharacterLevel, Save } from "@/types";
import { signedInt } from "@/utils";

const store = useCharacterStore();
const { abilityScores, saves, classLevels, character } = storeToRefs(store);

const levelsOpen = ref((character.value?.levels.length ?? 0) == 0);
const deleting = ref(false);
function confirmDelete(idx: number) {
  if (!deleting.value) {
    deleting.value = true;
    return;
  }
  character.value?.levels.splice(idx, 1);
  deleting.value = false;
}
function defaultLevel(): CharacterLevel {
  return {
    class: "",
    hitpoints: 0,
    baseAttack: false,
    favored_class_hp: false,
    favored_class_skillpoint: false,
  };
}
function newLevel() {
  character.value?.levels.push(defaultLevel());
}
function temporaryScoreClass(ability: AbilityT) {
  const abilityScore = abilityScores.value[ability];
  return abilityScore.score !== abilityScore.permanentScore ? "font-bold" : "opacity-50";
}
function permanentScoreClass(ability: AbilityT) {
  const abilityScore = abilityScores.value[ability];
  if (abilityScore.permanentScore === abilityScore.base) return "";
  return abilityScore.permanentScore === abilityScore.score ? "font-bold" : "opacity-50";
}
</script>
<template>
  <div v-if="character" class="flex flex-col gap-1">
    <Card collapse v-model:open="levelsOpen">
      <template #header>
        <h2 class="text-lg font-bold">Classes ({{ character.levelString() }})</h2>
      </template>
      <div
        class="grid grid-cols-[minmax(40px,25%)_max-content_repeat(3,_auto)_max-content] gap-1 items-center"
      >
        <div class="text-sm">Class</div>
        <div class="text-sm">HP</div>
        <div class="text-sm">BAB</div>
        <div class="text-sm">+1 HP</div>
        <div class="text-sm">+1 Skl</div>
        <div></div>
        <template v-for="(_, idx) in character.levels">
          <input type="text" class="input input-xs" v-model="character.levels[idx]!.class" />
          <NumberInput size="xs" v-model="character.levels[idx]!.hitpoints"></NumberInput>
          <input
            type="checkbox"
            class="checkbox checkbox-xs"
            v-model="character.levels[idx]!.baseAttack"
          />
          <input
            type="checkbox"
            class="checkbox checkbox-xs"
            v-model="character.levels[idx]!.favored_class_hp"
          />
          <input
            type="checkbox"
            class="checkbox checkbox-xs"
            v-model="character.levels[idx]!.favored_class_skillpoint"
          />
          <div>
            <button
              v-if="idx === character.levels.length - 1"
              class="btn btn-xs"
              :class="deleting ? 'btn-error' : 'btn-ghost'"
              @click="confirmDelete(idx)"
              @blur="deleting = false"
              @mouseleave="deleting = false"
            >
              <i class="fas fa-trash text-center w-5" />
            </button>
          </div>
        </template>
        <div
          class="btn btn-ghost btn-xs col-span-6 text-gray-400 border-dashed border-gray-400"
          @click="newLevel()"
        >
          Add a new character level...
        </div>
      </div>
    </Card>

    <Card>
      <template #header>
        <h2 class="text-lg font-bold">Ability Scores</h2>
      </template>
      <div
        class="grid grid-cols-[max-content_max-content_repeat(4,auto)] pl-3 gap-y-1 max-w-100 justify-start"
      >
        <div class="col-span-2"></div>
        <div class="flex items-end justify-center col-span-2 text-sm">ADJ</div>
        <div class="flex items-end justify-center col-span-2 text-sm">TEMP</div>
        <template v-for="ability in Ability">
          <div class="flex items-center justify-end mr-3">{{ ability.toUpperCase() }}:</div>
          <NumberInput
            class="mr-3"
            type="number"
            :model-value="abilityScores[ability].base"
            @update:model-value="(val) => store.updateBaseAbilityScore(ability, val)"
          />
          <div class="flex items-center justify-end mr-1" :class="permanentScoreClass(ability)">
            {{ abilityScores[ability].permanentScore }}
          </div>
          <div class="flex items-center justify-end mr-3" :class="permanentScoreClass(ability)">
            ({{ signedInt(abilityScores[ability].permanentMod) }})
          </div>
          <div class="flex items-center justify-end mr-1" :class="temporaryScoreClass(ability)">
            {{ abilityScores[ability].score }}
          </div>
          <div class="flex items-center justify-end" :class="temporaryScoreClass(ability)">
            ({{ signedInt(abilityScores[ability].mod) }})
          </div>
        </template>
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
  <div v-else>Please select or create a character</div>
</template>
<style scoped></style>
