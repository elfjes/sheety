import { createPinia, setActivePinia } from "pinia";
import { beforeEach, describe, expect, test } from "vitest";

import { Character } from "@/character";
import { type CharacterSheetV2, EffectKind } from "@/types";

import { useCharacterStore } from "./character";

function defaultCharacter(): CharacterSheetV2 {
  return {
    schemaVersion: "v2",
    name: "TestHero",
    levels: [
      {
        class: "fighter",
        hitpoints: 10,
        baseAttack: true,
        favored_class_hp: true,
        favored_class_skillpoint: false,
      },
    ],
    abilityScores: {
      str: 10,
      dex: 10,
      con: 10,
      int: 10,
      wis: 10,
      cha: 0,
    },
    hitpointEvents: [],
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
function defaultStore(): ReturnType<typeof useCharacterStore> & { character: Character } {
  const store = useCharacterStore();
  store.characters = [new Character()];
  store.activateCharacter(0);
  return store as ReturnType<typeof useCharacterStore> & { character: Character };
}
describe("Character Store AC", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  test("Calculates correct AC, touch and Flatfooted ac", () => {
    const store = defaultStore();
    store.character.baseAbilityScores.dex = 12;
    store.character.items.push({
      name: "Leather Armor",
      kind: EffectKind.ARMOR,
      active: true,
      weightClass: "medium",
      details: [
        {
          target: "armorAc",
          effectType: "armor",
          modifier: 2,
        },
      ],
    });
    expect(store.ac.ac.value).toBe(13);
    expect(store.ac.touch.value).toBe(11);
    expect(store.ac.flatfooted.value).toBe(12);
  });
  test("calculates AC using first active armor", () => {
    const store = defaultStore();
    store.character.items.push(
      {
        name: "Leather Armor",
        kind: EffectKind.ARMOR,
        active: false,
        weightClass: "medium",
        details: [
          {
            target: "armorAc",
            effectType: "armor",
            modifier: 2,
          },
        ],
      },
      {
        name: "Studded Leather Armor",
        kind: EffectKind.ARMOR,
        active: true,
        weightClass: "medium",
        details: [
          {
            target: "armorAc",
            effectType: "armor",
            modifier: 3,
          },
        ],
      },
      {
        name: "Breastplate",
        kind: EffectKind.ARMOR,
        active: true,
        weightClass: "medium",
        details: [
          {
            target: "armorAc",
            effectType: "armor",
            modifier: 6,
          },
        ],
      },
    );
    expect(store.ac.ac.value).toBe(13);
  });
  test("Shield and armor can have enhancement bonus", () => {
    const store = defaultStore();
    store.character.items.push(
      {
        name: "Leather Armor",
        kind: EffectKind.ARMOR,
        active: true,
        weightClass: "medium",
        details: [
          {
            target: "armorAc",
            effectType: "armor",
            modifier: 2,
          },
          {
            target: "armorAc",
            effectType: "enhancement",
            modifier: 1,
          },
        ],
      },
      {
        name: "Shield",
        kind: EffectKind.SHIELD,
        weightClass: "medium",
        details: [
          {
            target: "shieldAc",
            effectType: "enhancement",
            modifier: 1,
          },
          {
            target: "shieldAc",
            effectType: "armor",
            modifier: 1,
          },
        ],
      },
    );
    expect(store.ac.ac.value).toBe(15);
  });
  test("Uses only highest from same typed bonuses except unnamed", () => {
    const store = defaultStore();
    store.character.items.push({
      name: "armor",
      kind: EffectKind.ARMOR,
      weightClass: "light",
      details: [
        {
          target: "armorAc",
          modifier: 1,
        },
        {
          target: "armorAc",
          modifier: 2,
        },
        {
          target: "armorAc",
          modifier: 3,
          effectType: "enhancement",
        },
        {
          target: "armorAc",
          modifier: 4,
          effectType: "enhancement",
        },
      ],
    });
    expect(store.ac.ac.value).toBe(17);
  });
  test("Returns conditional modifiers", () => {
    const store = defaultStore();
    store.character.items.push({
      name: "armor",
      kind: EffectKind.ARMOR,
      weightClass: "light",
      details: [
        {
          conditional: "giants",
          target: "ac",
          modifier: 1,
        },
      ],
    });
    expect(store.ac.ac.value).toBe(10);
    expect(store.ac.ac.conditional).toEqual([
      {
        condition: "giants",
        modifier: 1,
      },
    ]);
    expect(store.ac.touch.conditional).toEqual([
      {
        condition: "giants",
        modifier: 1,
      },
    ]);
    expect(store.ac.flatfooted.conditional).toEqual([
      {
        condition: "giants",
        modifier: 1,
      },
    ]);
  });
  test("Returns conditional touch and flat footed ac", () => {
    const store = defaultStore();
    store.character.items.push({
      name: "armor",
      kind: EffectKind.ARMOR,
      weightClass: "light",
      details: [
        {
          conditional: "giants",
          target: "touchAc",
          modifier: 1,
        },
        {
          conditional: "giants",
          target: "armorAc",
          modifier: 2,
        },
      ],
    });
    expect(store.ac.ac.value).toBe(10);
    expect(store.ac.ac.conditional).toEqual([
      {
        condition: "giants",
        modifier: 3,
      },
    ]);
    expect(store.ac.touch.conditional).toEqual([
      {
        condition: "giants",
        modifier: 1,
      },
    ]);
    expect(store.ac.flatfooted.conditional).toEqual([
      {
        condition: "giants",
        modifier: 2,
      },
    ]);
  });
});

describe("CharacterStore saves", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  test("Returns all unnamed conditional bonuses", () => {
    const store = defaultStore();
    store.character.temporaryEffects.push({
      name: "Bless",
      kind: EffectKind.SPELL,
      details: [
        {
          target: "saves",
          modifier: 1,
          conditional: "fear",
        },
        {
          target: "saves",
          modifier: 2,
          conditional: "fear",
        },
      ],
    });
    expect(store.saves.fort.conditional).toEqual([
      {
        condition: "fear",
        modifier: 3,
      },
    ]);
    expect(store.saves.reflex.conditional).toEqual([
      {
        condition: "fear",
        modifier: 3,
      },
    ]);
    expect(store.saves.will.conditional).toEqual([
      {
        condition: "fear",
        modifier: 3,
      },
    ]);
  });
  test("Returns highest named conditional bonuses", () => {
    const store = defaultStore();
    store.character.temporaryEffects.push({
      name: "Bless",
      kind: EffectKind.SPELL,
      details: [
        {
          target: "will",
          modifier: 1,
          conditional: "fear",
          effectType: "resistance",
        },
        {
          target: "will",
          modifier: 2,
          conditional: "fear",
          effectType: "resistance",
        },
      ],
    });
    expect(store.saves.will.conditional).toEqual([
      {
        condition: "fear",
        modifier: 2,
      },
    ]);
  });
  test("Returns only extra named conditional bonus if unconditional bonus exists", () => {
    const store = defaultStore();
    store.character.temporaryEffects.push({
      name: "Bless",
      kind: EffectKind.SPELL,
      details: [
        {
          target: "saves",
          modifier: 1,
          effectType: "resistance",
        },
        {
          target: "will",
          modifier: 2,
          conditional: "fear",
          effectType: "resistance",
        },
      ],
    });
    expect(store.saves.will.conditional).toEqual([
      {
        condition: "fear",
        modifier: 1,
      },
    ]);
  });
  test("Doesn't return conditional bonus if regular named bonus exists", () => {
    const store = defaultStore();
    store.character.temporaryEffects.push({
      name: "Bless",
      kind: EffectKind.SPELL,
      details: [
        {
          target: "will",
          modifier: 1,
          effectType: "resistance",
        },
        {
          target: "will",
          modifier: 1,
          conditional: "fear",
          effectType: "resistance",
        },
      ],
    });
    expect(store.saves.will.conditional).toEqual([]);
  });
  test("Doesn't return conditional bonus if exactly 0", () => {
    const store = defaultStore();
    store.character.temporaryEffects.push({
      name: "Bless",
      kind: EffectKind.SPELL,
      details: [
        {
          target: "will",
          modifier: 1,
          conditional: "fear",
          effectType: "resistance",
        },
        {
          target: "will",
          modifier: -1,
          conditional: "fear",
        },
      ],
    });
    expect(store.saves.will.conditional).toEqual([]);
  });
});
