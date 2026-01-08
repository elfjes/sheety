import type { ApplicationDataV3, CharacterSheetV1, CharacterSheetV2, Effect } from "./types";

export function migrateApplicationData(data: unknown): ApplicationDataV3 | null {
  const result = migrateApplicationDataV3(data);
  if (!result) return result;
  for (const character of result.characters) {
    for (const item of character.items) {
      migrateExtraAttackEffectInPlace(item);
    }
    for (const ability of character.abilities) {
      migrateExtraAttackEffectInPlace(ability);
    }
    for (const ability of character.temporaryEffects) {
      migrateExtraAttackEffectInPlace(ability);
    }
  }
  return result;
}
function migrateExtraAttackEffectInPlace(effect: Effect) {
  for (const [idx, details] of effect.details.entries()) {
    // There used to be an extraAttack numerical effect
    if ((details.target as string) == "extraAttack") {
      effect.details[idx] = {
        target: "fullAttack",
        value: `+/${(details as any).modifier}`,
      };
    }
  }
}
function migrateApplicationDataV3(data: unknown): ApplicationDataV3 | null {
  if (isApplicationDataV3(data)) return data;
  const character = migrateCharacter(data);
  return character ? migrateCharacterV2ApplicationDataV3(character) : null;
}

export function migrateCharacter(data: unknown): CharacterSheetV2 | null {
  if (isCharacterSheetV2(data)) return data;

  if (isCharacterSheetV1(data)) {
    return migrateCharacterV1V2(data);
  }
  return null;
}

function migrateCharacterV1V2(character: CharacterSheetV1): CharacterSheetV2 {
  return {
    ...character,
    schemaVersion: "v2",
    abilities: character.feats,
    abilityScores: character.abilities,
  };
}
function migrateCharacterV2ApplicationDataV3(character: CharacterSheetV2): ApplicationDataV3 {
  return {
    schemaVersion: "v3",
    characters: [character],
    currentCharacter: 0,
  };
}
function isCharacterSheetV1(obj: unknown): obj is CharacterSheetV1 {
  return (obj as CharacterSheetV1).schemaVersion === "v1";
}
function isCharacterSheetV2(obj: unknown): obj is CharacterSheetV2 {
  return (obj as CharacterSheetV2).schemaVersion === "v2";
}
function isApplicationDataV3(obj: unknown): obj is ApplicationDataV3 {
  return (obj as ApplicationDataV3).schemaVersion === "v3";
}
