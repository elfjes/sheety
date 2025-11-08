import { defineStore } from "pinia";
import {
  Ability,
  EffectKind,
  Save,
  type AbilityT,
  type Attack,
  type CharacterSheet,
  type CharacterSheetV1,
  type ConditionalModifiers,
  type Effect,
  type EffectTarget,
  type NumericEffectDetails,
  type NumericEffectTargetT,
  type SavesStats,
  type SaveT,
  type SingleSaveStats,
  type TextEffectDetails,
  type Weapon,
} from "@/types";

import { computed, ref, watch } from "vue";
import { b64decode, b64encode, hasOwnProperty } from "@/utils";
import { migrateCharacterV1V2 } from "@/migrate";
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
    schemaVersion: "v2",
    name: "MyHero",
    levels: [],
    hitpointEvents: [],
    abilityScores: {
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
    abilities: [],
    items: [],
    temporaryEffects: [],
  };
}
function isCharacterSheetV1(obj: unknown): obj is CharacterSheetV1 {
  return (
    (obj as CharacterSheetV1).schemaVersion && (obj as CharacterSheetV1).schemaVersion === "v1"
  );
}
function isCharacterSheet(obj: unknown): obj is CharacterSheet {
  return (obj as CharacterSheet).schemaVersion && (obj as CharacterSheet).schemaVersion === "v2";
}
function relevantEffects(
  character: CharacterSheet,
  filter?: (effect: Effect) => boolean,
  matchTags?: string[],
) {
  return [...character.abilities, ...character.items, ...character.temporaryEffects]
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
function getEffectsForTarget(target: EffectTarget | EffectTarget[], effects: Effect[]) {
  if (!Array.isArray(target)) {
    target = [target];
  }
  return effects
    .map((item) => item.details)
    .flat()
    .filter((effect) => target.includes(effect.target));
}
function getModifiersByEffectType(effects: NumericEffectDetails[]) {
  const effectsByType: Record<string, number[]> = {};
  for (const eff of effects) {
    const key = eff.effectType || "";
    effectsByType[key] ??= [];
    effectsByType[key]!.push(eff.modifier);
  }
  return effectsByType;
}
function getEffectModifier(effects: NumericEffectDetails[]) {
  const effectsByType = getModifiersByEffectType(effects.filter((e) => !e.conditional));
  return Object.entries(effectsByType).reduce((result, [type, mods]) => {
    if (type === "") {
      return result + mods.reduce((v, n) => v + n, 0);
    }
    return result + Math.max(...mods);
  }, 0);
}

function getConditionalModifiers(
  target: NumericEffectTargetT | NumericEffectTargetT[],
  effects: Effect[],
) {
  const effectDetails = getEffectsForTarget(target, effects) as NumericEffectDetails[];
  const modifiers: Record<string, Record<string, number>> = {};
  // here we filter for named bonuses, because only those do not stack
  for (const eff of effectDetails) {
    const effectTypeKey = eff.effectType || "";
    const conditionalKey = eff.conditional || "";
    modifiers[conditionalKey] ??= {};
    modifiers[conditionalKey][effectTypeKey] ??= 0;
    if (!effectTypeKey) {
      modifiers[conditionalKey][effectTypeKey] += eff.modifier;
      continue;
    }
    modifiers[conditionalKey][effectTypeKey] = Math.max(
      modifiers[conditionalKey][effectTypeKey],
      eff.modifier,
    );
  }
  const alwaysModifiers = modifiers[""] || {};
  const conditionals: Record<string, Record<string, number>> = {};
  for (const [conditional, mods] of Object.entries(modifiers).filter(([c, _]) => !!c)) {
    for (const [effectType, modifier] of Object.entries(mods)) {
      if (!effectType) {
        conditionals[conditional] ??= {};
        conditionals[conditional][""] = modifier;
        continue;
      }
      let effectiveValue = modifier;
      if (hasOwnProperty(alwaysModifiers, effectType)) {
        if (alwaysModifiers[effectType]! >= modifier) {
          continue;
        }
        effectiveValue -= alwaysModifiers[effectType]!;
      }
      conditionals[conditional] ??= {};
      conditionals[conditional][effectType] ??= 0;
      conditionals[conditional][effectType] = Math.max(
        conditionals[conditional][effectType],
        effectiveValue,
      );
    }
  }
  return Object.entries(conditionals).reduce(
    (result, [conditional, mods]) => {
      const value = Object.values(mods).reduce((a, b) => a + b, 0);
      if (value === 0) return result;
      result[conditional] = value;
      return result;
    },
    {} as Record<string, number>,
  );
}
function getTotalEffectModifier(
  target: NumericEffectTargetT[] | NumericEffectTargetT,
  effects: Effect[],
) {
  return getEffectModifier(getEffectsForTarget(target, effects) as NumericEffectDetails[]);
}

function getAbilityStats(ability: AbilityT, character: CharacterSheet) {
  const baseScore = character.abilityScores[ability];
  const effects = relevantEffects(character);
  const score = getTotalEffectModifier(ability, effects) + baseScore;
  return {
    base: baseScore,
    score: score,
    mod: scoreToMod(score),
  };
}

function getSaveStats(
  save: SaveT,
  abilityModifier: number,
  character: CharacterSheet,
): SingleSaveStats {
  const baseSave = character.baseSaves[save];
  const effects = relevantEffects(character);

  const score = getTotalEffectModifier([save, "saves"], effects) + baseSave + abilityModifier;
  return {
    base: baseSave,
    score: score,
    conditional: getConditionalModifiers([save, "saves"], effects),
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
    let result = loadFromLocalStorage() || defaultCharacter();

    if (isCharacterSheetV1(result)) {
      result = migrateCharacterV1V2(result);
    }
    if (isCharacterSheet(result)) {
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
    character.value.abilityScores[ability] =
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
        abilityScores.value.con.mod * character.value.levels.length +
        getTotalEffectModifier("hp", relevantEffects(character.value));
      return {
        max: maxHitpoints,
        min: -abilityScores.value.con.score,
        current: (character.value.hitpointEvents ?? []).reduce(
          (total, current) => total + current,
          maxHitpoints,
        ),
        events: character.value.hitpointEvents,
      };
    },
  );
  const abilityScores = computed(() => {
    return {
      str: getAbilityStats(Ability.STR, character.value),
      dex: getAbilityStats(Ability.DEX, character.value),
      con: getAbilityStats(Ability.CON, character.value),
      int: getAbilityStats(Ability.INT, character.value),
      wis: getAbilityStats(Ability.WIS, character.value),
      cha: getAbilityStats(Ability.CHA, character.value),
    };
  });
  const saves = computed((): SavesStats => {
    return {
      fort: getSaveStats(Save.FORT, abilityScores.value.con.mod, character.value),
      reflex: getSaveStats(Save.REFLEX, abilityScores.value.dex.mod, character.value),
      will: getSaveStats(Save.WILL, abilityScores.value.wis.mod, character.value),
    };
  });
  const baseAttack = computed((): number => {
    return character.value.levels.reduce((curr, lvl) => Number(lvl.baseAttack) + curr, 0);
  });
  const ac = computed(
    (): {
      ac: {
        value: number;
        conditional: ConditionalModifiers;
      };
      touch: {
        value: number;
        conditional: ConditionalModifiers;
      };
      flatfooted: {
        value: number;
        conditional: ConditionalModifiers;
      };
    } => {
      const armor = relevantEffects(character.value, (e) => e.kind === EffectKind.ARMOR);
      const shield = relevantEffects(character.value, (e) => e.kind === EffectKind.SHIELD);
      const effects = relevantEffects(
        character.value,
        (e) => e.kind !== EffectKind.ARMOR && e.kind !== EffectKind.SHIELD,
      );

      const allEffects = [...armor.slice(0, 1), ...shield.slice(0, 1), ...effects];
      const overallMod = getTotalEffectModifier("ac", effects);
      const touchMod = getTotalEffectModifier("touchAc", allEffects);
      const armorMod = getTotalEffectModifier("armorAc", [...armor.slice(0, 1), ...effects]);
      const shieldMod = getTotalEffectModifier("shieldAc", [...shield.slice(0, 1), ...effects]);

      return {
        ac: {
          value: 10 + overallMod + abilityScores.value.dex.mod + armorMod + shieldMod + touchMod,
          conditional: getConditionalModifiers(
            ["ac", "touchAc", "armorAc", "shieldAc"],
            allEffects,
          ),
        },
        touch: {
          value: 10 + overallMod + abilityScores.value.dex.mod + touchMod,
          conditional: getConditionalModifiers(["ac", "touchAc"], allEffects),
        },
        flatfooted: {
          value: 10 + overallMod + armorMod + shieldMod,
          conditional: getConditionalModifiers(["ac", "armorAc", "shieldAc"], allEffects),
        },
      };
    },
  );
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
          (wpn.ranged ? abilityScores.value.dex.mod : abilityScores.value.str.mod) +
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
            Math.floor(abilityScores.value.str.mod * wpn.strMod) +
            getEffectModifier(getEffectsForTarget("damage", effects) as NumericEffectDetails[]),
          extraDice: (getEffectsForTarget("damageDie", effects) as TextEffectDetails[])
            .map((e) => e.value)
            .join(" + "),
          conditional: getConditionalModifiers("attack", effects),
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
    abilityScores,
    saves,
    baseAttack,
    ac,
    attacks,
    importCharacter,
    characterAsExport,
  };
});
