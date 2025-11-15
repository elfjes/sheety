import { defineStore } from "pinia";
import {
  Ability,
  EffectKind,
  Save,
  type AbilityStats,
  type AbilityT,
  type ApplicationDataV3,
  type Attack,
  type CharacterLevel,
  type CharacterSheetV2,
  type ConditionalModifiers,
  type Effect,
  type EffectDetails,
  type EffectTarget,
  type Item,
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
import {
  hasOwnProperty,
  loadFromLocalStorage,
  serialize,
  deserialize,
  saveToLocalStorage,
} from "@/utils";
import { migrateApplicationData, migrateCharacter } from "@/migrate";
function scoreToMod(score: number) {
  return Math.floor((score - 10) / 2);
}

class Character {
  schemaVersion: "v2";
  name: string;
  levels: CharacterLevel[];
  hitpointEvents: number[];
  baseAbilityScores: Record<AbilityT, number>;
  abilities: Effect[];
  baseSaves: Record<SaveT, number>;
  items: Item[];
  temporaryEffects: Effect[];
  constructor(data?: CharacterSheetV2) {
    data = data ?? defaultCharacterSheet();
    this.schemaVersion = "v2";
    this.name = data.name;
    this.levels = data.levels;
    this.hitpointEvents = data.hitpointEvents;
    this.baseAbilityScores = data.abilityScores;
    this.abilities = data.abilities;
    this.baseSaves = data.baseSaves;
    ((this.items = data.items), (this.temporaryEffects = data.temporaryEffects));
  }
  classLevels(): Record<string, number> {
    return this.levels.reduce(
      (obj, lvl) => {
        obj[lvl.class] ??= 0;
        obj[lvl.class]! += 1;

        return obj;
      },
      {} as Record<string, number>,
    );
  }
  updateBaseAbilityScore(ability: AbilityT, newScore: number | string) {
    this.baseAbilityScores[ability] = typeof newScore == "string" ? parseInt(newScore) : newScore;
  }
  updateBaseSave(save: SaveT, newScore: number | string) {
    this.baseSaves[save] = typeof newScore == "string" ? parseInt(newScore) : newScore;
  }
  resetHitpoints() {
    this.hitpointEvents.splice(0);
  }
  abilityScores(): Record<AbilityT, SingleAbiiltyStats> {
    return {
      str: getAbilityStats(Ability.STR, this),
      dex: getAbilityStats(Ability.DEX, this),
      con: getAbilityStats(Ability.CON, this),
      int: getAbilityStats(Ability.INT, this),
      wis: getAbilityStats(Ability.WIS, this),
      cha: getAbilityStats(Ability.CHA, this),
    };
  }
  hitpoints(): { min: number; max: number; current: number; events: number[] } {
    const baseHitpoints = this.levels.reduce(
      (curr, lvl) => curr + lvl.hitpoints + Number(lvl.favored_class_hp),
      0,
    );
    const abilityScores = this.abilityScores();
    const maxHitpoints =
      baseHitpoints +
      abilityScores.con.mod * this.levels.length +
      getTotalEffectModifier("hp", relevantEffects(this));
    return {
      max: maxHitpoints,
      min: -abilityScores.con.score,
      current: (this.hitpointEvents ?? []).reduce(
        (total, current) => total + current,
        maxHitpoints,
      ),
      events: this.hitpointEvents,
    };
  }
  saves(): SavesStats {
    const abilityScores = this.abilityScores();
    return {
      fort: getSaveStats(Save.FORT, abilityScores.con.mod, this),
      reflex: getSaveStats(Save.REFLEX, abilityScores.dex.mod, this),
      will: getSaveStats(Save.WILL, abilityScores.wis.mod, this),
    };
  }
  baseAttack(): number {
    return this.levels.reduce((curr, lvl) => Number(lvl.baseAttack) + curr, 0);
  }
  ac() {
    const abilityScores = this.abilityScores();
    const armorEffects = relevantEffects(this, (e) => e.kind === EffectKind.ARMOR);
    const shieldEffects = relevantEffects(this, (e) => e.kind === EffectKind.SHIELD);
    const otherEffects = relevantEffects(
      this,
      (e) => e.kind !== EffectKind.ARMOR && e.kind !== EffectKind.SHIELD,
    );

    const allEffects = [...armorEffects, ...shieldEffects, ...otherEffects];
    const overallMod = getTotalEffectModifier("ac", allEffects);
    const touchMod = getTotalEffectModifier("touchAc", allEffects);
    const armorMod = getTotalEffectModifier("armorAc", [...armorEffects, ...otherEffects]);
    const shieldMod = getTotalEffectModifier("shieldAc", [...shieldEffects, ...otherEffects]);

    return {
      ac: {
        value: 10 + overallMod + abilityScores.dex.mod + armorMod + shieldMod + touchMod,
        conditional: getConditionalModifiers(["ac", "touchAc", "armorAc", "shieldAc"], allEffects),
      },
      touch: {
        value: 10 + overallMod + abilityScores.dex.mod + touchMod,
        conditional: getConditionalModifiers(["ac", "touchAc"], allEffects),
      },
      flatfooted: {
        value: 10 + overallMod + armorMod + shieldMod,
        conditional: getConditionalModifiers(["ac", "armorAc", "shieldAc"], allEffects),
      },
    };
  }
  attacks(): Attack[] {
    const baseAttack = this.baseAttack();
    const abilityScores = this.abilityScores();

    return this.items
      .filter((item): item is Weapon => item.kind === EffectKind.WEAPON)
      .filter((item) => item.active)
      .map((wpn: Weapon) => {
        const effects = [
          ...wpn.details,
          ...relevantEffects(this!, (e) => e.kind !== EffectKind.WEAPON, wpn.tags),
        ];
        const adjustedBaseAttack = baseAttack + getTotalEffectModifier("baseAttack", effects);
        const fullAttackBase = attacksFromBaseAttack(adjustedBaseAttack);

        const attackBonus =
          (wpn.ranged ? abilityScores.dex.mod : abilityScores.str.mod) +
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
            Math.floor(abilityScores.str.mod * wpn.strMod) +
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
  }

  dump(): CharacterSheetV2 {
    return {
      schemaVersion: this.schemaVersion,
      name: this.name,
      levels: this.levels,
      hitpointEvents: this.hitpointEvents,
      abilityScores: this.baseAbilityScores,
      abilities: this.abilities,
      baseSaves: this.baseSaves,
      items: this.items,
      temporaryEffects: this.temporaryEffects,
    };
  }
}

function defaultApplicationData(): ApplicationDataV3 {
  return {
    schemaVersion: "v3",
    characters: [],
    currentCharacter: null,
  };
}
function defaultCharacterSheet(): CharacterSheetV2 {
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
  character: Character,
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

function getAbilityStats(ability: AbilityT, character: Character): SingleAbiiltyStats {
  const baseScore = character.baseAbilityScores[ability];
  const effects = relevantEffects(character);
  const score = getTotalEffectModifier(ability, effects) + baseScore;
  return {
    base: baseScore,
    score: score,
    mod: scoreToMod(score),
  };
}

function getSaveStats(save: SaveT, abilityModifier: number, character: Character): SingleSaveStats {
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

  const activeCharacter = computed<Character | null>(() => {
    if (applicationData.value.currentCharacter == null) return null;
    const characterSheet = applicationData.value.characters[applicationData.value.currentCharacter];
    return characterSheet ? new Character(characterSheet) : null;
  });

  const characterAsExport = computed(() => {
    if (!activeCharacter.value) return "";
    return serialize(activeCharacter.value.dump());
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
      applicationData.value.characters.push(defaultCharacterSheet());
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
    applicationData,
    () => {
      saveToLocalStorage(applicationData.value);
    },
    { deep: true },
  );
  initialize();
  return {
    character: activeCharacter,
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
