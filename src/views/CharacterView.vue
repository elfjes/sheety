<script setup lang="ts">
import { useCharacterStore } from "@/stores/character";
import { Ability, Save, type CharacterLevel } from "@/types";
import { storeToRefs } from "pinia";
import NumberInput from "@/components/NumberInput.vue";
import { signedInt } from "@/utils";
import Card from "@/components/Card.vue";
import { computed, ref } from "vue";

const store = useCharacterStore();
const { abilities, saves, hitpoints, classLevels, character } = storeToRefs(store);

const levelsOpen = ref(true);
const deleting = ref(false);
const lvlString = computed(() =>
  Object.entries(classLevels.value)
    .map(([cls, lvl]) => `${cls} ${lvl}`)
    .join("/"),
);
function confirmDelete(idx: number) {
  if (!deleting.value) {
    deleting.value = true;
    return;
  }
  character.value.levels.splice(idx, 1);
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
  character.value.levels.push(defaultLevel());
}
</script>
<template>
  <div class="flex flex-col gap-1">
    <Card collapse v-model:open="levelsOpen">
      <template #header>
        <h2 class="text-lg font-bold">Classes ({{ lvlString }})</h2>
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
              class="btn btn-xs btn-ghost"
              :class="deleting && 'btn-error'"
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
