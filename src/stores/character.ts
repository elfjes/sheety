import { defineStore } from "pinia";
import {
  Ability,
  ItemKind,
  NumericEffectTarget,
  Save,
  type AbilityT,
  type CharacterSheet,
  type NumericEffectDetails,
  type SaveT,
} from "@/types";

const character: CharacterSheet = {
  schemaVersion: "v1",
  name: "MyHero",
  abilities: {
    str: 15,
    dex: 14,
    con: 13,
    int: 12,
    wis: 11,
    cha: 10,
  },
  baseAttackBonus: 1,
  baseSaves: {
    fort: 2,
    reflex: 2,
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
      name: "Belt of Con +2",
      kind: ItemKind.OTHER,
      effects: [
        {
          effectType: "enhancement",
          target: Ability.CON,
          modifier: 2,
        },
      ],
    },
    {
      name: "thisisaverylongwordthatoverflows",
      kind: ItemKind.OTHER,
      effects: [
        {
          effectType: "unnamed",
          target: Ability.CON,
          modifier: 0,
        },
      ],
    },
  ],
};
function scoreToMod(score: number) {
  return Math.floor((score - 10) / 2);
}

function getTotalEffectModifier(target: NumericEffectDetails["target"], character: CharacterSheet) {
  let score = 0;
  for (const item of character.items) {
    for (const effect of item.effects) {
      if (effect.target === target) {
        score += (effect as NumericEffectDetails).modifier;
      }
    }
  }
  return score;
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
  },
  getters: {
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
  },
});
