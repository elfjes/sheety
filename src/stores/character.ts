import { defineStore } from "pinia";
import {
  Ability,
  EffectKind,
  Save,
  type AbilityStats,
  type AbilityT,
  type ApplicationDataV3,
  type Attack,
  type CharacterSheetV2,
  type ConditionalModifiers,
  type Effect,
  type EffectDetails,
  type EffectTarget,
  type NumericEffectDetails,
  type NumericEffectTargetT,
  type SavesStats,
  type SaveT,
  type SingleAbiiltyStats,
  type SingleSaveStats,
  type TextEffectDetails,
  type Weapon,
} from "@/types";

import { computed, ref, watch } from "vue";
import { b64decode, b64encode, hasOwnProperty } from "@/utils";
import { migrateApplicationData, migrateCharacter } from "@/migrate";
const LOCAL_STORAGE_KEY = "character";

function saveToLocalStorage(data: ApplicationDataV3) {
  localStorage.setItem(LOCAL_STORAGE_KEY, serialize(data));
}
function loadFromLocalStorage(): unknown {
  const result = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!result) return null;
  return deserialize(result);
}
function serialize(data: unknown) {
  return b64encode(JSON.stringify(data));
}

function deserialize(text: string) {
  try {
    const parsed = JSON.parse(b64decode(text));
    return parsed as unknown;
  } catch {
    return null;
  }
}
function scoreToMod(score: number) {
  return Math.floor((score - 10) / 2);
}

function defaultApplicationData(): ApplicationDataV3 {
  return {
    schemaVersion: "v3",
    characters: [],
    currentCharacter: null,
  };
}
function defaultCharacter(): CharacterSheetV2 {
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
function relevantEffects(
  character: CharacterSheetV2,
  filter?: (effect: Effect) => boolean,
  matchTags?: string[],
): EffectDetails[] {
  const maxItemCount = {
    [EffectKind.SHIELD]: 1,
    [EffectKind.ARMOR]: 1,
  };
  const items = character.items.filter((item) => {
    if (!hasOwnProperty(maxItemCount, item.kind)) {
      return true;
    }

    if (maxItemCount[item.kind] > 0) {
      maxItemCount[item.kind] -= 1;
      return true;
    }
    return false;
  });
  return [...character.abilities, ...items, ...character.temporaryEffects]
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
    })
    .map((e) => e.details)
    .flat();
}
function getEffectsForTarget(target: EffectTarget | EffectTarget[], effects: EffectDetails[]) {
  if (!Array.isArray(target)) {
    target = [target];
  }
  return effects.filter((effect) => target.includes(effect.target));
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
  effects: EffectDetails[],
): ConditionalModifiers<number> {
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
  const aggregate = Object.entries(conditionals).reduce(
    (result, [conditional, mods]) => {
      const value = Object.values(mods).reduce((a, b) => a + b, 0);
      if (value === 0) return result;
      result[conditional] = value;
      return result;
    },
    {} as Record<string, number>,
  );
  return Object.entries(aggregate).map(([key, value]) => ({ condition: key, modifier: value }));
}
function getTotalEffectModifier(
  target: NumericEffectTargetT[] | NumericEffectTargetT,
  effects: EffectDetails[],
) {
  return getEffectModifier(getEffectsForTarget(target, effects) as NumericEffectDetails[]);
}

function getAbilityStats(ability: AbilityT, character: CharacterSheetV2): SingleAbiiltyStats {
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
  character: CharacterSheetV2,
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
  const applicationData = ref<ApplicationDataV3>(defaultApplicationData());

  function initialize() {
    let result = loadFromLocalStorage() || defaultApplicationData();

    const data = migrateApplicationData(result);
    applicationData.value = data ?? defaultApplicationData();
  }

  const character = computed<CharacterSheetV2 | null>(() => {
    if (applicationData.value.currentCharacter == null) return null;
    return applicationData.value.characters[applicationData.value.currentCharacter] ?? null;
  });

  const characterAsExport = computed(() => {
    if (!character.value) return "";
    return serialize(character.value);
  });

  function importCharacter(text: string): boolean {
    const result = deserialize(text);
    const character = migrateCharacter(result);
    if (!character) return false;

    applicationData.value.characters.push(character);
    return true;
  }
  function newCharacter(character?: CharacterSheetV2) {
    if (character) {
      applicationData.value.characters.push(character);
    } else {
      applicationData.value.characters.push(defaultCharacter());
    }
  }
  function updateBaseAbilityScore(ability: AbilityT, newScore: number | string) {
    if (!character.value) return;
    character.value.abilityScores[ability] =
      typeof newScore == "string" ? parseInt(newScore) : newScore;
  }
  function updateBaseSave(save: SaveT, newScore: number | string) {
    if (!character.value) return;
    character.value.baseSaves[save] = typeof newScore == "string" ? parseInt(newScore) : newScore;
  }
  function resetHitpoints() {
    if (!character.value) return;
    character.value.hitpointEvents?.splice(0);
  }

  const classLevels = computed(() => {
    if (!character.value) return {} as Record<string, number>;
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
      if (!character.value) return { min: 0, max: 0, current: 0, events: [] };
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
  const abilityScores = computed((): AbilityStats => {
    if (!character.value)
      return {
        str: { base: 10, score: 10, mod: 10 },
        dex: { base: 10, score: 10, mod: 10 },
        con: { base: 10, score: 10, mod: 10 },
        int: { base: 10, score: 10, mod: 10 },
        wis: { base: 10, score: 10, mod: 10 },
        cha: { base: 10, score: 10, mod: 10 },
      };
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
    if (!character.value)
      return {
        fort: { base: 0, score: 0, conditional: [] },
        reflex: { base: 0, score: 0, conditional: [] },
        will: { base: 0, score: 0, conditional: [] },
      };
    return {
      fort: getSaveStats(Save.FORT, abilityScores.value.con.mod, character.value),
      reflex: getSaveStats(Save.REFLEX, abilityScores.value.dex.mod, character.value),
      will: getSaveStats(Save.WILL, abilityScores.value.wis.mod, character.value),
    };
  });
  const baseAttack = computed((): number => {
    if (!character.value) return 0;
    return character.value.levels.reduce((curr, lvl) => Number(lvl.baseAttack) + curr, 0);
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
      if (!character.value) {
        return {
          ac: {
            value: 10,
            conditional: [],
          },
          touch: {
            value: 10,
            conditional: [],
          },
          flatfooted: {
            value: 10,
            conditional: [],
          },
        };
      }
      const armorEffects = relevantEffects(character.value, (e) => e.kind === EffectKind.ARMOR);
      const shieldEffects = relevantEffects(character.value, (e) => e.kind === EffectKind.SHIELD);
      const otherEffects = relevantEffects(
        character.value,
        (e) => e.kind !== EffectKind.ARMOR && e.kind !== EffectKind.SHIELD,
      );

      const allEffects = [...armorEffects, ...shieldEffects, ...otherEffects];
      const overallMod = getTotalEffectModifier("ac", allEffects);
      const touchMod = getTotalEffectModifier("touchAc", allEffects);
      const armorMod = getTotalEffectModifier("armorAc", [...armorEffects, ...otherEffects]);
      const shieldMod = getTotalEffectModifier("shieldAc", [...shieldEffects, ...otherEffects]);

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
    if (!character.value) return [];

    return character.value.items
      .filter((item): item is Weapon => item.kind === EffectKind.WEAPON)
      .filter((item) => item.active)
      .map((wpn: Weapon) => {
        const effects = [
          ...wpn.details,
          ...relevantEffects(character.value!, (e) => e.kind !== EffectKind.WEAPON, wpn.tags),
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
          extraDice: (
            getEffectsForTarget("damageDie", effects).filter(
              (e) => !e.conditional,
            ) as TextEffectDetails[]
          )
            .map((e) => e.value)
            .join(" + "),
          conditionalAttack: getConditionalModifiers("attack", effects),
          conditionalDamage: getEffectsForTarget(["damage", "damageDie"], effects)
            .filter((e) => e.conditional)
            .map((e) => {
              console.log(e);
              return {
                condition: e.conditional!,
                modifier: hasOwnProperty(e, "modifier")
                  ? (e as NumericEffectDetails).modifier
                  : (e as TextEffectDetails).value,
              };
            }),
        };
      });
  });
  watch(
    applicationData,
    () => {
      saveToLocalStorage(applicationData.value);
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
    newCharacter,
  };
});
