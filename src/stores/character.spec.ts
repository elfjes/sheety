import { setActivePinia, createPinia } from "pinia";
import { useCharacterStore } from "./character";
import { describe, test, beforeEach, expect } from "vitest";
import { EffectKind, type CharacterSheet } from "@/types";

function defaultCharacter(): CharacterSheet {
  return {
    schemaVersion: "v1",
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
    abilities: {
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
    feats: [],
    items: [],
    temporaryEffects: [],
  };
}
function defaultStore() {
  const store = useCharacterStore();
  store.character = defaultCharacter();
  return store;
}
describe("Character Store AC", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });
  test("Calculates correct AC, touch and Flatfooted ac", () => {
    const store = defaultStore();
    store.character.abilities.dex = 12;
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
    expect(store.ac.ac).toBe(13);
    expect(store.ac.touch).toBe(11);
    expect(store.ac.flatfooted).toBe(12);
  });
  test("calculates AC using first armor", () => {
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
    expect(store.ac.ac).toBe(12);
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
    expect(store.ac.ac).toBe(15);
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
    expect(store.ac.ac).toBe(17);
  });
});
