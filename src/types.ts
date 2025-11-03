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
  level: number;
  baseHitpoints: number;
  hitpointEvents: number[];
  abilities: Record<AbilityT, number>;
  baseAttackBonus: number;
  baseSaves: Record<SaveT, number>;
  feats: Feat[];
  items: Item[];
  temporaryEffects: Effect[];
}
export enum EffectKind {
  WEAPON = "weapon",
  ARMOR = "armor",
  SHIELD = "shield",
  OTHER_ITEM = "other item",
  SPELL = "spell",
  FEAT = "feat",
  CLASS = "class",
  RACIAL = "racial",
}
export interface Effect {
  name: string;
  description?: string;
  kind: EffectKind;
  tags?: string[];
  details: EffectDetails[];
  active?: boolean;
}
export interface Weapon extends Effect {
  kind: EffectKind.WEAPON;
  dice: string;
  ranged?: boolean;
  strMod: number;
}
export interface Armor extends Effect {
  kind: EffectKind.ARMOR|EffectKind.SHIELD;
  weightClass: "light" | "medium" | "heavy";
}
export interface OtherItem extends Effect {
  kind: EffectKind.OTHER_ITEM;
}
export type Item = Weapon | Armor | OtherItem;

export interface Feat extends Effect {
  kind: EffectKind.FEAT;
}

export const NumericEffectTarget = {
  HP: "hp",
  SAVES: "saves",
  ATTACK: "attack",
  DAMAGE: "damage",
  AC: "ac",
  TOUCH_AC: "touchAc",
  ARMOR_AC: "armorAc",
  SHIELD_AC: "shieldAc",
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
export interface Attack {
  name: string;
  attack: number;
  damage: number;
  dice: string;
  extraDice: string;
}
