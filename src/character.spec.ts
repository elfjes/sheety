import { describe, expect, test } from "vitest";

import { validateFullAttackModifier } from "./character";

describe("validateFullAttackModifier", () => {
  test.each(["+/+3", "+/0", "+/+0", "+/-5/0"])("matches %s for additional attacks", (mod) => {
    expect(validateFullAttackModifier(mod)).toBeTruthy();
  });
  test.each(["/+3/*", "/0/*", "/+0/*", "/-5/0/*"])(
    "matches %s for full attack modifiers",
    (mod) => {
      expect(validateFullAttackModifier(mod)).toBeTruthy();
    },
  );
  test.each(["/+3/", "/0/", "/+0/", "/-5/0/"])("matches %s for full attack override", (mod) => {
    expect(validateFullAttackModifier(mod)).toBeTruthy();
  });
  test.each(["/+3", "/0", "/+0", "/5/0", "+/-5/0/*", "//", "/"])("doesn't match %s", (mod) => {
    expect(validateFullAttackModifier(mod)).toBeFalsy();
  });
});
