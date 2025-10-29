export const Ability = {
  STR: "str",
  DEX: "dex",
  CON: "con",
  INT: "int",
  WIS: "wis",
  CHA: "cha",
} as const;
export type AbilityT = (typeof Ability)[keyof typeof Ability];
export const Save = {
  FORT: "fort",
  REFLEX: "reflex",
  WILL: "will",
} as const;
export type SaveT = (typeof Save)[keyof typeof Save];
export interface CharacterSheet {
  schemaVersion: "v1";
  name: string;
  abilities: Record<AbilityT, number>;
  baseAttackBonus: number;
  baseSaves: Record<SaveT, number>;
  items: Item[];
}
export enum ItemKind {
  WEAPON = "weapon",
  ARMOR = "armor",
  OTHER = "other",
}
export interface ItemBase {
  name: string;
  kind: ItemKind;
  effects: EffectDetails[];
  tags?: string[];
}
export interface Weapon extends ItemBase {
  kind: ItemKind.WEAPON;
  ranged?: boolean;
  dice: string;
  strMod: number;
}
export interface Armor extends ItemBase {
  kind: ItemKind.ARMOR;
  weightClass: "light" | "medium" | "heavy";
}
export interface OtherItem extends ItemBase {
  kind: ItemKind.OTHER;
}
export type Item = Weapon | Armor | OtherItem;

export interface Effect {
  name: string;
  description?: string;
  details: EffectDetails[];
  permanent?: boolean;
}
export const NumericEffectTarget = {
  SAVES: "saves",
  ATTACK: "attack",
  DAMAGE: "damage",
  AC: "ac",
  TOUCH_AC: "touchAc",
  ARMOR_AC: "armorAc",
  SKILLS: "skills",
  INITIATIVE: "initiative",
} as const;

export const TextEffectTarget = {
  DAMAGE_DIE: "damageDie",
} as const;
export type NumericEffectTargetT = (typeof NumericEffectTarget)[keyof typeof NumericEffectTarget];
export type TextEffectTargetT = (typeof TextEffectTarget)[keyof typeof TextEffectTarget];
export type EffectTarget = AbilityT | SaveT | NumericEffectTargetT | TextEffectTargetT;
export interface BaseEffectDetails {
  // Useful for matching certain effects to certain items/weapons.
  // If not defined, matches all relevant items/weapons/armor
  target: EffectTarget;
  tags?: string[];
  effectType?: string; // such as competence, circumstance, etc
}
export interface NumericEffectDetails extends BaseEffectDetails {
  target: NumericEffectTargetT | AbilityT | SaveT;
  modifier: number;
}
export interface TextEffectDetails extends BaseEffectDetails {
  target: TextEffectTargetT;
  value: string;
}
export type EffectDetails = NumericEffectDetails | TextEffectDetails;
