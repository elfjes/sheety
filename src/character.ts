import type {
  AbilityT,
  Attack,
  CasterInfo,
  CharacterLevel,
  CharacterSheetV2,
  ConditionalModifiers,
  Effect,
  EffectDetails,
  EffectTarget,
  Item,
  NumericEffectDetails,
  NumericEffectTargetT,
  SaveT,
  SavesStats,
  SingleAbiiltyStats,
  SingleSaveStats,
  Spell,
  TextEffectDetails,
  Weapon,
} from "./types";
import { Ability, EffectKind, Save } from "./types";
import { hasOwnProperty } from "./utils";

export class Character {
  schemaVersion: "v2";
  name: string;
  levels: CharacterLevel[];
  hitpointEvents: number[];
  baseAbilityScores: Record<AbilityT, number>;
  baseSaves: Record<SaveT, number>;
  abilities: Effect[];
  caster?: CasterInfo;
  items: Item[];
  temporaryEffects: Effect[];
  constructor(data?: CharacterSheetV2) {
    data = data ?? defaultCharacterSheet();
    this.schemaVersion = "v2";
    this.name = data.name;
    this.levels = data.levels;
    this.hitpointEvents = data.hitpointEvents;
    this.baseAbilityScores = data.abilityScores;
    this.baseSaves = data.baseSaves;
    this.abilities = data.abilities;
    this.caster = data.caster;
    this.items = data.items;
    this.temporaryEffects = data.temporaryEffects;
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
  levelString() {
    const classLevels = this.classLevels();
    if (Object.keys(classLevels).length === 0) return "-";
    return Object.entries(this.classLevels())
      .map(([cls, lvl]) => `${cls} ${lvl}`)
      .join("/");
  }
  casterString() {
    if (!this.caster) return "";
    const spellsPerDayString = this.spellsPerDay()
      .map((spd) => (spd.base + spd.bonus ? spd.base + spd.bonus : "-"))
      .join("/");
    return `Caster level ${this.caster.casterLevel} (${spellsPerDayString || "-"})`;
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
        let fullAttackBase = attacksFromBaseAttack(adjustedBaseAttack);

        const attackBonus =
          (wpn.ranged ? abilityScores.dex.mod : abilityScores.str.mod) +
          getEffectModifier(getEffectsForTarget("attack", effects) as NumericEffectDetails[]);

        fullAttackBase = applyFullAttackModifiers(
          fullAttackBase,
          adjustedBaseAttack,
          getEffectsForTarget("fullAttack", effects).map((e) => (e as TextEffectDetails).value),
        );
        fullAttackBase.sort((a, b) => b - a);
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
  spellsPerDay() {
    const caster = this.caster;
    if (!caster) return [];
    const abilityMod = this.abilityScores()[caster.ability].mod;
    return caster.baseSpellsPerDay.map((n, spellLevel) => {
      return {
        base: n,
        bonus: spellLevel < 1 ? 0 : Math.max(0, Math.ceil((1 + abilityMod - spellLevel) / 4)),
      };
    });
  }
  updateBaseSpellsPerDay(spellLevel: number, newAmount: number) {
    if (!this.caster) return;
    this.caster.baseSpellsPerDay[spellLevel] = newAmount;
  }
  activeSpells(): Spell[] {
    return this.caster?.spells.flat().filter((s) => s.active) || [];
  }

  dump(): CharacterSheetV2 {
    return {
      schemaVersion: this.schemaVersion,
      name: this.name,
      levels: this.levels,
      hitpointEvents: this.hitpointEvents,
      abilityScores: this.baseAbilityScores,
      baseSaves: this.baseSaves,
      abilities: this.abilities,
      caster: this.caster,
      items: this.items,
      temporaryEffects: this.temporaryEffects,
    };
  }
}
export function defaultCharacterSheet(): CharacterSheetV2 {
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

function scoreToMod(score: number) {
  return Math.floor((score - 10) / 2);
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
  const items = character.items
    .filter((effect) => effect.active !== false)
    .filter((item) => {
      if (!hasOwnProperty(maxItemCount, item.kind)) {
        return true;
      }

      if (maxItemCount[item.kind] > 0) {
        maxItemCount[item.kind] -= 1;
        return true;
      }
      return false;
    });
  return [
    ...character.abilities,
    ...items,
    ...character.temporaryEffects,
    ...character.activeSpells(),
  ]
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

const fullAttackAdditionalAttacksPattern = /^\+(\/([-+]?\d+))+$/; // matches "+/+2/-3/0" etc
const fullAttackAttackModifierPattern = /^(\/([-+]?\d+))+\/\*$/; // matches "/+2/-3/*" etc
const fullAttackOverridePattern = /^(\/([-+]?\d+))+\/$/; // matches "/0/-5/" etc

export function validateFullAttackModifier(modifier: string) {
  return Boolean(
    modifier.match(fullAttackAdditionalAttacksPattern) ||
      modifier.match(fullAttackAttackModifierPattern) ||
      modifier.match(fullAttackOverridePattern),
  );
}

export function applyFullAttackModifiers(
  fullAttack: number[],
  baseAttackBonus: number,
  modifiers: string[],
): number[] {
  const additionalAttacks: string[] = [];
  const attackModifiers: string[] = [];
  let overriddenFullAttack: string | null = null;
  let result: number[] = [...fullAttack];

  for (const mod of modifiers) {
    if (mod.match(fullAttackAdditionalAttacksPattern)) {
      additionalAttacks.push(mod);
    }
    if (mod.match(fullAttackOverridePattern)) {
      overriddenFullAttack = mod;
    }
    if (mod.match(fullAttackAttackModifierPattern)) {
      attackModifiers.push(mod);
    }
  }

  if (overriddenFullAttack) {
    result = parseFullAttackOverride(overriddenFullAttack).map((v) => v + baseAttackBonus!);
  } else {
    for (const mod of additionalAttacks) {
      result.push(...parseFullAttackAdditionalAttacks(mod).map((v) => v + baseAttackBonus));
    }
  }
  for (const mod of attackModifiers) {
    const mods = parseFullAttackAttackModifier(mod);
    for (let i = 0; i < result.length; i++) {
      const thisMod = mods[Math.min(i, mods.length - 1)]!;
      result[i]! += thisMod;
    }
  }
  return result;
}

function parseFullAttackOverride(modifier: string): number[] {
  return modifier
    .split("/")
    .filter((p) => p)
    .map(Number);
}

function parseFullAttackAdditionalAttacks(modifier: string): number[] {
  return modifier.slice(2).split("/").map(Number);
}
function parseFullAttackAttackModifier(modifier: string): number[] {
  return modifier
    .split("/")
    .filter((p) => p && p !== "*")
    .map(Number);
}
