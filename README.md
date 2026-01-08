# Sheety Character Sheets

A simple application that can track Pathfinder (1e) character bonuses and penalties

## How to modify a full attack action

A full attack action can be described as a `/` followed by a series of integers and more
slashes (`/`) following those integer for every attack. The integers signify an attack
with a base attack modifier. For example, the full attack of a fighter at level 11 could
be represented as `/0/-5/-10/`. The beginning and trailing `/` indicates that this is
a complete full attack. However, this full attack may be modified. For example, starting
a full attack modifief with a `+` adds additional attacks to the full attack actions:

* `+/0` to add an additional attack at the highest base attack (such as for the Haste spell)
* Add two additional attacks, at +0 and -5: `+/0/-5`

An asterisk (`*`) may be used to modify some or all of the attacks in a full attack action
choose the full attack modifier, the `*` indicates a repeating modifier for all subsequent
attacks in the full attack action:

* TWF: every attack is at -2 `/-2/*`
  * For completeness, TWF also adds an additional attack `+/0` that needs to be described in
    a separate modifier
* Furious Focus: Remove the attack penalty from power attack for the first attack, for example:
  if you normally had a -2 penalty, you'd compensate with the following modifier: `/2/0/*`.
  The first attacks gets a +2 (compensation) bonus, but the second and subsequent attacks do not

A complete full attack may also be overridden by supplying a new - complete - full attack. Any
additional attacks (from effects or from having a high base attack) are negated, but modifiers
are still applied:

* Full attack is limited to a single attack: `/0/`. This overrides any other complete full attack
  actions or additional attacks, but attack modifiers (such as from a `/-2/*` rule) are still
  applied.

