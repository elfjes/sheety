import { defineStore } from "pinia";
import {
  Ability,
  ItemKind,
  NumericEffectTarget,
  Save,
  TextEffectTarget,
  type AbilityT,
  type Attack,
  type CharacterSheet,
  type EffectDetails,
  type NumericEffectDetails,
  type SaveT,
  type TextEffectDetails,
  type Weapon,
} from "@/types";

const character: CharacterSheet = {
  schemaVersion: "v1",
  name: "MyHero",
  level: 3,
  baseHitpoints: 12 + 7 + 1 + 1 + 1,
  abilities: {
    str: 15,
    dex: 13,
    con: 16,
    int: 10,
    wis: 14,
    cha: 9,
  },
  hitpointEvents: [-12],
  baseAttackBonus: 3,
  baseSaves: {
    fort: 5,
    reflex: 0,
    will: 0,
  },
  items: [
    {
      name: "+1 Breastplate",
      kind: ItemKind.ARMOR,
      weightClass: "medium",
      effects: [
        {
          effectType: "armor",
          target: NumericEffectTarget.ARMOR_AC,
          modifier: 5,
        },
        {
          effectType: "armor-enhancement",
          target: NumericEffectTarget.ARMOR_AC,
          modifier: 1,
        },
      ],
    },
    {
      name: "Masterwork Great Sword",
      kind: ItemKind.WEAPON,
      tags: ["greatsword", "two-handed sword"],
      dice: "2d6 (S)",
      strMod: 1.5,
      effects: [
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
  ],
};
function scoreToMod(score: number) {
  return Math.floor((score - 10) / 2);
}
function getEffectsForTarget(target: EffectDetails["target"], character: CharacterSheet) {
  return character.items
    .map((item) => item.effects)
    .flat()
    .filter((effect) => effect.target === target);
}
function getEffectModifier(effects: NumericEffectDetails[]) {
  return effects.reduce((total, effect) => effect.modifier + total, 0);
}
function getTotalEffectModifier(target: NumericEffectDetails["target"], character: CharacterSheet) {
  return getEffectModifier(getEffectsForTarget(target, character) as NumericEffectDetails[]);
}

function getAbilityStats(ability: AbilityT, character: CharacterSheet) {
  const baseScore = character.abilities[ability]!;
  const score = getTotalEffectModifier(ability, character) + baseScore;
  return {
    base: baseScore,
    score: score,
    mod: scoreToMod(score),
  };
}

function getSaveStats(save: SaveT, abilityModifier: number, character: CharacterSheet) {
  const baseSave = character.baseSaves[save];
  const score = getTotalEffectModifier(save, character) + baseSave + abilityModifier;
  return {
    base: baseSave,
    score: score,
  };
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
    hitpoints(state): { min: number; max: number; current: number; events: number[] } {
      const maxHitpoints =
        state.character.baseHitpoints +
        this.abilities.con.mod * state.character.level +
        getTotalEffectModifier("hp", state.character);
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
    ac(state): { ac: number; touch: number; flatfooted: number } {
      const overallMod = getTotalEffectModifier("ac", state.character);
      const touchMod = getTotalEffectModifier("touchAc", state.character);
      const armorMod = getTotalEffectModifier("armorAc", state.character);
      return {
        ac: 10 + overallMod + this.abilities.dex.mod + armorMod + touchMod,
        touch: 10 + overallMod + this.abilities.dex.mod + touchMod,
        flatfooted: 10 + overallMod + armorMod,
      };
    },
    attacks(state): Attack[] {
      return state.character.items
        .filter((item): item is Weapon => item.kind === ItemKind.WEAPON)
        .map((wpn: Weapon) => {
          return {
            name: wpn.name,
            attack:
              state.character.baseAttackBonus +
              (wpn.ranged ? this.abilities.dex.mod : this.abilities.str.mod) +
              getTotalEffectModifier("attack", state.character),
            dice: wpn.dice,
            damage:
              this.abilities.str.mod * wpn.strMod +
              getTotalEffectModifier("damage", state.character),
            extraDice: (getEffectsForTarget("damageDie", state.character) as TextEffectDetails[])
              .map((e) => e.value)
              .join(" + "),
          };
        });
    },
  },
});
