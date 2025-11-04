import { defineStore } from "pinia";
import {
  Ability,
  EffectKind,
  NumericEffectTarget,
  Save,
  TextEffectTarget,
  type AbilityT,
  type Attack,
  type CharacterSheet,
  type Effect,
  type EffectDetails,
  type NumericEffectDetails,
  type SaveT,
  type TextEffectDetails,
  type Weapon,
} from "@/types";

import { computed, ref, watch } from "vue";
import { b64decode, b64encode } from "@/utils";
const LOCAL_STORAGE_KEY = "character";

function saveToLocalStorage(character: CharacterSheet) {
  localStorage.setItem(LOCAL_STORAGE_KEY, serialize(character));
}
function loadFromLocalStorage(): unknown {
  const result = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!result) return null;
  return deserialize(result);
}
function serialize(character: CharacterSheet) {
  return b64encode(JSON.stringify(character));
}

function deserialize(text: string) {
  try {
    const parsed = JSON.parse(b64decode(text));
    return parsed as CharacterSheet;
  } catch {
    return null;
  }
}
function scoreToMod(score: number) {
  return Math.floor((score - 10) / 2);
}

function defaultCharacter(): CharacterSheet {
  return {
    schemaVersion: "v1",
    name: "MyHero",
    levels: [],
    hitpointEvents: [],
    abilities: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 10,
    },
    baseSaves: {
      fort: 0,
      reflex: 0,
      will: 0,
    },
    feats: [],
    items: [],
    temporaryEffects: [],
  };
}
function isCharacterSheet(obj: unknown): obj is CharacterSheet {
  return (obj as CharacterSheet).schemaVersion && (obj as CharacterSheet).schemaVersion === "v1";
}
function relevantEffects(
  character: CharacterSheet,
  filter?: (effect: Effect) => boolean,
  matchTags?: string[],
) {
  return [...character.feats, ...character.items, ...character.temporaryEffects]
    .filter((effect) => effect.active !== false)
    .filter(filter ?? (() => true))
    .filter((effect) => {
      if (!effect.tags) {
        return true;
      }
      for (const tag of matchTags ?? []) {
        if (effect.tags.includes(tag)) return true;
      }
      return false;
    });
}
function getEffectsForTarget(target: EffectDetails["target"], effects: Effect[]) {
  return effects
    .map((item) => item.details)
    .flat()
    .filter((effect) => effect.target === target);
}
function getEffectModifier(effects: NumericEffectDetails[]) {
  const effectsByType: Record<string, number[]> = {};
  let result = 0;
  for (const eff of effects) {
    if (!eff.effectType) {
      result += eff.modifier;
      continue;
    }
    effectsByType[eff.effectType] ??= [];
    effectsByType[eff.effectType]!.push(eff.modifier);
  }
  for (const mods of Object.values(effectsByType)) {
    result += Math.max(...mods);
  }
  return result;
}
function getTotalEffectModifier(target: NumericEffectDetails["target"], effects: Effect[]) {
  return getEffectModifier(getEffectsForTarget(target, effects) as NumericEffectDetails[]);
}

function getAbilityStats(ability: AbilityT, character: CharacterSheet) {
  const baseScore = character.abilities[ability];
  const effects = relevantEffects(character);
  const score = getTotalEffectModifier(ability, effects) + baseScore;
  return {
    base: baseScore,
    score: score,
    mod: scoreToMod(score),
  };
}

function getSaveStats(save: SaveT, abilityModifier: number, character: CharacterSheet) {
  const baseSave = character.baseSaves[save];
  const score =
    getTotalEffectModifier(save, relevantEffects(character)) + baseSave + abilityModifier;
  return {
    base: baseSave,
    score: score,
  };
}

function attacksFromBaseAttack(bab: number) {
  if (bab === 0) return [0];
  const result: number[] = [];
  let bonus: number = bab;
  while (bonus > 0) {
    result.push(bonus);
    bonus -= 5;
  }
  return result;
}
export const useCharacterStore = defineStore("character", () => {
  const character = ref<CharacterSheet>(defaultCharacter());

  function initialize() {
    const result = loadFromLocalStorage();
    if (result && isCharacterSheet(result)) {
      character.value = result;
      return;
    }
    character.value = defaultCharacter();
  }
  const characterAsExport = computed(() => {
    return serialize(character.value);
  });
  function importCharacter(text: string): boolean {
    const result = deserialize(text);
    if (!result || !isCharacterSheet(result)) return false;
    character.value = result;
    return true;
  }

  function updateBaseAbilityScore(ability: AbilityT, newScore: number | string) {
    character.value.abilities[ability] =
      typeof newScore == "string" ? parseInt(newScore) : newScore;
  }
  function updateBaseSave(save: SaveT, newScore: number | string) {
    character.value.baseSaves[save] = typeof newScore == "string" ? parseInt(newScore) : newScore;
  }
  function resetHitpoints() {
    character.value.hitpointEvents?.splice(0);
  }

  const classLevels = computed(() => {
    return character.value.levels.reduce(
      (obj, lvl) => {
        obj[lvl.class] ??= 0;
        obj[lvl.class]! += 1;

        return obj;
      },
      {} as Record<string, number>,
    );
  });
  const hitpoints = computed(
    (): { min: number; max: number; current: number; events: number[] } => {
      const baseHitpoints = character.value.levels.reduce(
        (curr, lvl) => curr + lvl.hitpoints + Number(lvl.favored_class_hp),
        0,
      );
      const maxHitpoints =
        baseHitpoints +
        abilities.value.con.mod * character.value.levels.length +
        getTotalEffectModifier("hp", relevantEffects(character.value));
      return {
        max: maxHitpoints,
        min: -abilities.value.con.score,
        current: (character.value.hitpointEvents ?? []).reduce(
          (total, current) => total + current,
          maxHitpoints,
        ),
        events: character.value.hitpointEvents,
      };
    },
  );
  const abilities = computed(() => {
    return {
      str: getAbilityStats(Ability.STR, character.value),
      dex: getAbilityStats(Ability.DEX, character.value),
      con: getAbilityStats(Ability.CON, character.value),
      int: getAbilityStats(Ability.INT, character.value),
      wis: getAbilityStats(Ability.WIS, character.value),
      cha: getAbilityStats(Ability.CHA, character.value),
    };
  });
  const saves = computed((): Record<SaveT, { base: number; score: number }> => {
    return {
      fort: getSaveStats(Save.FORT, abilities.value.con.mod, character.value),
      reflex: getSaveStats(Save.REFLEX, abilities.value.dex.mod, character.value),
      will: getSaveStats(Save.WILL, abilities.value.wis.mod, character.value),
    };
  });
  const baseAttack = computed((): number => {
    return character.value.levels.reduce((curr, lvl) => Number(lvl.baseAttack) + curr, 0);
  });
  const ac = computed((): { ac: number; touch: number; flatfooted: number } => {
    const armor = relevantEffects(character.value, (e) => e.kind === EffectKind.ARMOR);
    const shield = relevantEffects(character.value, (e) => e.kind === EffectKind.SHIELD);
    const effects = relevantEffects(
      character.value,
      (e) => e.kind !== EffectKind.ARMOR && e.kind !== EffectKind.SHIELD,
    );

    const overallMod = getTotalEffectModifier("ac", effects);
    const touchMod = getTotalEffectModifier("touchAc", [
      ...armor.slice(0, 1),
      ...shield.slice(0, 1),
      ...effects,
    ]);
    const armorMod = getTotalEffectModifier("armorAc", [...armor.slice(0, 1), ...effects]);
    const shieldMod = getTotalEffectModifier("shieldAc", [...shield.slice(0, 1), ...effects]);

    return {
      ac: 10 + overallMod + abilities.value.dex.mod + armorMod + shieldMod + touchMod,
      touch: 10 + overallMod + abilities.value.dex.mod + touchMod,
      flatfooted: 10 + overallMod + armorMod + shieldMod,
    };
  });
  const attacks = computed((): Attack[] => {
    return character.value.items
      .filter((item): item is Weapon => item.kind === EffectKind.WEAPON)
      .filter((item) => item.active)
      .map((wpn: Weapon) => {
        const effects = [
          wpn,
          ...relevantEffects(character.value, (e) => e.kind !== EffectKind.WEAPON, wpn.tags),
        ];
        const adjustedBaseAttack = baseAttack.value + getTotalEffectModifier("baseAttack", effects);
        const fullAttackBase = attacksFromBaseAttack(adjustedBaseAttack);

        const attackBonus =
          (wpn.ranged ? abilities.value.dex.mod : abilities.value.str.mod) +
          getEffectModifier(getEffectsForTarget("attack", effects) as NumericEffectDetails[]);
        for (const effect of getEffectsForTarget(
          "extraAttack",
          effects,
        ) as NumericEffectDetails[]) {
          fullAttackBase.push(adjustedBaseAttack + effect.modifier);
        }
        fullAttackBase.sort().reverse();
        return {
          name: wpn.name,
          attack: adjustedBaseAttack + attackBonus,
          fullAttack: fullAttackBase.map((att) => att + attackBonus),
          dice: wpn.dice,
          damage:
            Math.floor(abilities.value.str.mod * wpn.strMod) +
            getEffectModifier(getEffectsForTarget("damage", effects) as NumericEffectDetails[]),
          extraDice: (getEffectsForTarget("damageDie", effects) as TextEffectDetails[])
            .map((e) => e.value)
            .join(" + "),
        };
      });
  });
  watch(
    character,
    () => {
      saveToLocalStorage(character.value);
    },
    { deep: true },
  );
  initialize();
  return {
    character,
    updateBaseAbilityScore,
    updateBaseSave,
    resetHitpoints,
    initialize,
    classLevels,
    hitpoints,
    abilities,
    saves,
    baseAttack,
    ac,
    attacks,
    importCharacter,
    characterAsExport,
  };
});
