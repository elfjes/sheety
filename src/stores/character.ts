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

const character: CharacterSheet = {
  schemaVersion: "v1",
  name: "MyHero",
  levels: [
    {
      class: "brb",
      hitpoints: 12,
      baseAttack: true,
      favored_class_hp: false,
      favored_class_skillpoint: false,
    },
    {
      class: "fgt",
      hitpoints: 7,
      baseAttack: true,
      favored_class_hp: true,
      favored_class_skillpoint: false,
    },
    {
      class: "fgt",
      hitpoints: 1,
      baseAttack: true,
      favored_class_hp: true,
      favored_class_skillpoint: false,
    },
  ],
  baseHitpoints: 12 + 7 + 1 + 1 + 1,
  abilities: {
    str: 13,
    dex: 13,
    con: 16,
    int: 10,
    wis: 14,
    cha: 9,
  },
  hitpointEvents: [-12],
  baseSaves: {
    fort: 5,
    reflex: 0,
    will: 0,
  },
  feats: [
    {
      name: "Power Attack",
      kind: EffectKind.FEAT,
      active: false,
      details: [
        {
          target: "attack",
          modifier: -1,
        },
        {
          target: "damage",
          modifier: 3,
        },
      ],
    },
    {
      name: "Focus great sword",
      kind: EffectKind.FEAT,
      active: true,
      passive: true,
      details: [
        {
          target: "attack",
          modifier: 1,
        },
      ],
      tags: ["greatsword"],
    },
  ],
  items: [
    {
      name: "+1 Breastplate",
      kind: EffectKind.ARMOR,
      weightClass: "medium",
      active: true,
      details: [
        {
          effectType: "armor",
          target: NumericEffectTarget.ARMOR_AC,
          modifier: 5,
        },
        {
          effectType: "enhancement",
          target: NumericEffectTarget.ARMOR_AC,
          modifier: 1,
        },
      ],
    },
    {
      name: "Masterwork Great Sword",
      kind: EffectKind.WEAPON,
      tags: ["greatsword", "two-handed sword"],
      dice: "2d6 (S)",
      strMod: 1.5,
      active: true,
      details: [
        {
          target: TextEffectTarget.DAMAGE_DIE,
          value: "2d6",
        },
        {
          effectType: "enhancement",
          target: NumericEffectTarget.ATTACK,
          modifier: 1,
        },
      ],
    },
    {
      name: "Unarmed strike",
      kind: EffectKind.WEAPON,
      dice: "1d6 (B)",
      strMod: 1,
      active: true,
      tags: ["unarmed", "flurry of blows"],
      details: [],
    },
  ],
  temporaryEffects: [
    {
      name: "Rage",
      kind: EffectKind.CLASS,
      active: false,
      details: [
        {
          target: "str",
          modifier: 4,
        },
        {
          target: "con",
          modifier: 4,
        },
      ],
    },
    {
      name: "Haste",
      kind: EffectKind.SPELL,
      active: false,
      details: [
        {
          target: NumericEffectTarget.EXTRA_ATTACK,
          modifier: 0,
        },
      ],
    },
    {
      name: "Flurry of blows",
      kind: EffectKind.CLASS,
      active: true,
      tags: ["flurry of blows"],
      details: [
        {
          target: NumericEffectTarget.EXTRA_ATTACK,
          modifier: 0,
        },
        {
          target: NumericEffectTarget.BASE_ATTACK,
          modifier: +1,
        },
        {
          target: NumericEffectTarget.ATTACK,
          modifier: -2,
        },
      ],
    },
  ],
};
function scoreToMod(score: number) {
  return Math.floor((score - 10) / 2);
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
export const useCharacterStore = defineStore("character", {
  state: () => ({
    character: character,
  }),
  actions: {
    updateBaseAbilityScore(ability: AbilityT, newScore: number | string) {
      this.character.abilities[ability] =
        typeof newScore == "string" ? parseInt(newScore) : newScore;
    },
    updateBaseSave(save: SaveT, newScore: number | string) {
      this.character.baseSaves[save] = typeof newScore == "string" ? parseInt(newScore) : newScore;
    },
    resetHitpoints() {
      this.character.hitpointEvents?.splice(0);
    },
  },
  getters: {
    classLevels(state) {
      return state.character.levels.reduce(
        (obj, lvl) => {
          obj[lvl.class] ??= 0;
          obj[lvl.class]! += 1;

          return obj;
        },
        {} as Record<string, number>,
      );
    },
    hitpoints(state): { min: number; max: number; current: number; events: number[] } {
      const baseHitpoints = this.character.levels.reduce(
        (curr, lvl) => curr + lvl.hitpoints + Number(lvl.favored_class_hp),
        0,
      );
      const maxHitpoints =
        baseHitpoints +
        this.abilities.con.mod * state.character.levels.length +
        getTotalEffectModifier("hp", relevantEffects(state.character));
      return {
        max: maxHitpoints,
        min: -this.abilities.con.score,
        current: (state.character.hitpointEvents ?? []).reduce(
          (total, current) => total + current,
          maxHitpoints,
        ),
        events: state.character.hitpointEvents,
      };
    },
    abilities(state): Record<AbilityT, { base: number; score: number; mod: number }> {
      return {
        str: getAbilityStats(Ability.STR, state.character),
        dex: getAbilityStats(Ability.DEX, state.character),
        con: getAbilityStats(Ability.CON, state.character),
        int: getAbilityStats(Ability.INT, state.character),
        wis: getAbilityStats(Ability.WIS, state.character),
        cha: getAbilityStats(Ability.CHA, state.character),
      };
    },
    saves(state): Record<SaveT, { base: number; score: number }> {
      return {
        fort: getSaveStats(Save.FORT, this.abilities.con.mod, state.character),
        reflex: getSaveStats(Save.REFLEX, this.abilities.dex.mod, state.character),
        will: getSaveStats(Save.WILL, this.abilities.wis.mod, state.character),
      };
    },
    baseAttack(state): number {
      return state.character.levels.reduce((curr, lvl) => Number(lvl.baseAttack) + curr, 0);
    },
    ac(state): { ac: number; touch: number; flatfooted: number } {
      const armor = relevantEffects(state.character, (e) => e.kind === EffectKind.ARMOR);
      const shield = relevantEffects(state.character, (e) => e.kind === EffectKind.SHIELD);
      const effects = relevantEffects(
        state.character,
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
        ac: 10 + overallMod + this.abilities.dex.mod + armorMod + shieldMod + touchMod,
        touch: 10 + overallMod + this.abilities.dex.mod + touchMod,
        flatfooted: 10 + overallMod + armorMod + shieldMod,
      };
    },
    attacks(state): Attack[] {
      return state.character.items
        .filter((item): item is Weapon => item.kind === EffectKind.WEAPON)
        .filter((item) => item.active)
        .map((wpn: Weapon) => {
          const effects = [
            wpn,
            ...relevantEffects(state.character, (e) => e.kind !== EffectKind.WEAPON, wpn.tags),
          ];
          const baseAttack = this.baseAttack + getTotalEffectModifier("baseAttack", effects);
          const fullAttackBase = attacksFromBaseAttack(baseAttack);

          const attackBonus =
            (wpn.ranged ? this.abilities.dex.mod : this.abilities.str.mod) +
            getEffectModifier(getEffectsForTarget("attack", effects) as NumericEffectDetails[]);
          for (const effect of getEffectsForTarget(
            "extraAttack",
            effects,
          ) as NumericEffectDetails[]) {
            fullAttackBase.push(baseAttack + effect.modifier);
          }
          fullAttackBase.sort().reverse();
          return {
            name: wpn.name,
            attack: baseAttack + attackBonus,
            fullAttack: fullAttackBase.map((att) => att + attackBonus),
            dice: wpn.dice,
            damage:
              Math.floor(this.abilities.str.mod * wpn.strMod) +
              getEffectModifier(getEffectsForTarget("damage", effects) as NumericEffectDetails[]),
            extraDice: (getEffectsForTarget("damageDie", effects) as TextEffectDetails[])
              .map((e) => e.value)
              .join(" + "),
          };
        });
    },
  },
});
