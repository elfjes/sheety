import type { AbilityT, NumericEffectTargetT, SaveT, TextEffectTargetT } from "@/types";

export const numericTargets: Record<NumericEffectTargetT | AbilityT | SaveT, string> = {
  str: "Strength",
  dex: "Dexterity",
  con: "Constitution",
  int: "Intelligence",
  wis: "Wisdom",
  cha: "Charisma",
  fort: "Fortitude",
  reflex: "Reflex",
  will: "Will",
  saves: "All saves",
  attack: "Attack",
  damage: "Damage",
  ac: "AC",
  armorAc: "Armor",
  shieldAc: "Shield",
  touchAc: "Touch AC",
  skills: "Skills",
  initiative: "Initiative",
  hp: "HP",
  extraAttack: "Extra attack (@)",
  baseAttack: "Base attack",
};

export const textTargets: Record<TextEffectTargetT, string> = {
  damageDie: "damage die",
};
export const allTargets = { ...numericTargets, ...textTargets };
