import { defineStore } from "pinia";
import { computed, ref, toRaw, unref, watch } from "vue";

import { Character, defaultCharacterSheet } from "@/character";
import { migrateApplicationData, migrateCharacter } from "@/migrate";
import {
  type AbilityStats,
  type AbilityT,
  type ApplicationDataV3,
  type Attack,
  type CharacterSheetV2,
  type ConditionalModifiers,
  type SaveT,
  type SavesStats,
} from "@/types";
import { deserialize, loadFromLocalStorage, saveToLocalStorage, serialize } from "@/utils";

function defaultApplicationData(): ApplicationDataV3 {
  return {
    schemaVersion: "v3",
    characters: [],
    currentCharacter: null,
  };
}

export const useCharacterStore = defineStore("character", () => {
  const characters = ref<Character[]>([]);
  const activeCharacterIndex = ref<number | null>(null);

  function initialize() {
    let result = loadFromLocalStorage() || defaultApplicationData();

    const data = migrateApplicationData(result);
    if (!data) return;
    characters.value = data.characters.map((c) => new Character(c));
    activeCharacterIndex.value = data.currentCharacter;
  }

  const activeCharacter = computed<Character | null>(() => {
    if (activeCharacterIndex.value == null) return null;
    return characters.value[activeCharacterIndex.value] ?? null;
  });

  function characterAsExport(index: number) {
    const character = characters.value[index];
    if (!character) return "";
    return serialize(character.dump());
  }

  function importCharacter(text: string): boolean {
    const result = deserialize(text);
    const character = migrateCharacter(result);
    if (!character) return false;

    newCharacter(character, true);
    return true;
  }

  function newCharacter(characterSheet?: CharacterSheetV2 | null, activate: boolean = false) {
    const character = new Character(characterSheet ?? defaultCharacterSheet());
    characters.value.push(character);
    if (activate) {
      activeCharacterIndex.value = characters.value.length - 1;
    }
  }
  function activateCharacter(idx: number) {
    const count = characters.value.length;
    if (!count) {
      activeCharacterIndex.value = null;
    }
    idx = Math.max(Math.min(idx, count), 0);

    activeCharacterIndex.value = idx;
  }
  function duplicateCharacter(idx: number) {
    const original: Character | undefined = characters.value[idx];
    if (!original) throw Error(`Invalid character index ${idx}`);
    const clone = JSON.parse(JSON.stringify(original.dump()))
    clone.name += " (copy)";
    newCharacter(clone);
  }
  function deleteCharacter(idx: number) {
    characters.value.splice(idx, 1);
    if (!activeCharacterIndex.value) return;

    if (idx <= activeCharacterIndex.value) {
      activateCharacter(activeCharacterIndex.value - 1);
    }
  }
  function updateBaseAbilityScore(ability: AbilityT, newScore: number | string) {
    if (!activeCharacter.value) return;
    activeCharacter.value.updateBaseAbilityScore(ability, newScore);
  }

  function updateBaseSave(save: SaveT, newScore: number | string) {
    if (!activeCharacter.value) return;
    activeCharacter.value.updateBaseSave(save, newScore);
  }

  function resetHitpoints() {
    if (!activeCharacter.value) return;
    activeCharacter.value.hitpointEvents?.splice(0);
  }

  const classLevels = computed(() => {
    return (activeCharacter.value ?? new Character()).classLevels();
  });

  const hitpoints = computed(
    (): { min: number; max: number; current: number; events: number[] } => {
      return (activeCharacter.value ?? new Character()).hitpoints();
    },
  );

  const abilityScores = computed((): AbilityStats => {
    return (activeCharacter.value ?? new Character()).abilityScores();
  });

  const saves = computed((): SavesStats => {
    return (activeCharacter.value ?? new Character()).saves();
  });

  const baseAttack = computed((): number => {
    return (activeCharacter.value ?? new Character()).baseAttack();
  });
  const ac = computed(
    (): {
      ac: {
        value: number;
        conditional: ConditionalModifiers<number>;
      };
      touch: {
        value: number;
        conditional: ConditionalModifiers<number>;
      };
      flatfooted: {
        value: number;
        conditional: ConditionalModifiers<number>;
      };
    } => {
      return (activeCharacter.value ?? new Character()).ac();
    },
  );
  const attacks = computed((): Attack[] => {
    return (activeCharacter.value ?? new Character()).attacks();
  });
  watch(
    [characters, () => unref(activeCharacterIndex)],
    () => {
      const data: ApplicationDataV3 = {
        schemaVersion: "v3",
        characters: characters.value.map((c) => c.dump()),
        currentCharacter: activeCharacterIndex.value,
      };
      saveToLocalStorage(data);
    },
    { deep: true },
  );
  initialize();
  return {
    characters,
    character: activeCharacter,
    activeCharacterIndex,
    updateBaseAbilityScore,
    updateBaseSave,
    resetHitpoints,
    initialize,
    classLevels,
    hitpoints,
    abilityScores,
    saves,
    baseAttack,
    ac,
    attacks,
    importCharacter,
    activateCharacter,
    characterAsExport,
    newCharacter,
    deleteCharacter,
    duplicateCharacter,
  };
});
