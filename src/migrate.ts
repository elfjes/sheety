import type { CharacterSheet, CharacterSheetV1 } from "./types";

export function migrateCharacterV1V2(character: CharacterSheetV1): CharacterSheet {
  return {
    ...character,
    schemaVersion: "v2",
    abilities: character.feats,
    abilityScores: character.abilities,
  };
}
