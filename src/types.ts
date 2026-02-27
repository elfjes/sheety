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
export interface CharacterSheetV1 {
  schemaVersion: "v1";
  name: string;
  levels: CharacterLevel[];
  hitpointEvents: number[];
  abilities: Record<AbilityT, number>;
  baseSaves: Record<SaveT, number>;
  feats: Feat[];
  items: Item[];
  temporaryEffects: Effect[];
}
export interface CharacterSheetV2 {
  schemaVersion: "v2";
  name: string;
  levels: CharacterLevel[];
  hitpointEvents: number[];
  abilityScores: Record<AbilityT, number>;
  abilities: Effect[];
  baseSaves: Record<SaveT, number>;
  items: Item[];
  temporaryEffects: Effect[];
}
export interface ApplicationDataV3 {
  schemaVersion: "v3";
  characters: CharacterSheetV2[];
  currentCharacter: number | null;
}
export interface CharacterLevel {
  class: string;
  hitpoints: number;
  baseAttack: boolean;
  favored_class_hp: boolean;
  favored_class_skillpoint: boolean;
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
  OTHER = "other",
}
export interface Effect {
  name: string;
  description?: string;
  kind: EffectKind;
  tags?: string[];
  details: EffectDetails[];
  active?: boolean;
  passive?: boolean;
  usages?: Usage;
  duration?: Duration;
}
export interface Weapon extends Effect {
  kind: EffectKind.WEAPON;
  dice: string;
  ranged?: boolean;
  strMod: number;
}
export interface Armor extends Effect {
  kind: EffectKind.ARMOR | EffectKind.SHIELD;
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
  BASE_ATTACK: "baseAttack",
} as const;

export const TextEffectTarget = {
  DAMAGE_DIE: "damageDie",
  FULL_ATTACK: "fullAttack",
} as const;
export type NumericEffectTargetT =
  | (typeof NumericEffectTarget)[keyof typeof NumericEffectTarget]
  | AbilityT
  | SaveT;
export type TextEffectTargetT = (typeof TextEffectTarget)[keyof typeof TextEffectTarget];
export type EffectTarget = AbilityT | SaveT | NumericEffectTargetT | TextEffectTargetT;
export interface Usage {
  max: number;
  current: number;
}

export const DurationUnit = {
  ROUNDS: "rounds",
  MINUTES: "minutes",
  HOURS: "hours",
  DAYS: "days",
} as const;
export type DurationUnitT = (typeof DurationUnit)[keyof typeof DurationUnit];

export interface Duration extends Usage {
  unit: DurationUnitT;
}
export interface BaseEffectDetails {
  target: EffectTarget;

  // Useful for matching certain effects to certain items/weapons.
  // If not defined, matches all relevant items/weapons/armor
  tags?: string[];
  effectType?: string; // such as competence, circumstance, etc
  conditional?: string; // Effect is only active under certain conditions (such as will save against fear, ac against giants etc)
}
export interface NumericEffectDetails extends BaseEffectDetails {
  target: NumericEffectTargetT;
  modifier: number;
}
export interface TextEffectDetails extends BaseEffectDetails {
  target: TextEffectTargetT;
  value: string;
}
export type EffectDetails = NumericEffectDetails | TextEffectDetails;
export type ConditionalTextModifiers = { condition: string; modifier: string }[];
export interface Conditional<T extends string | number> {
  condition: string;
  modifier: T;
}
export type ConditionalModifiers<T extends string | number> = Conditional<T>[];
export interface Attack {
  name: string;
  attack: number;
  fullAttack: number[];
  damage: number;
  dice: string;
  extraDice: string;
  conditionalAttack: ConditionalModifiers<number>;
  conditionalDamage: ConditionalModifiers<string | number>;
}

export interface Action {
  title: string;
  event: string;
  color?: string;
  confirm?: boolean;
}
export interface SingleSaveStats {
  base: number;
  score: number;
  conditional: ConditionalModifiers<number>;
}
export type SavesStats = Record<SaveT, SingleSaveStats>;

export interface SingleAbiiltyStats {
  base: number;
  score: number;
  mod: number;
}
export type AbilityStats = Record<AbilityT, SingleAbiiltyStats>;
