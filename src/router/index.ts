import { createRouter, createWebHistory } from "vue-router";

import CharacterView from "../views/CharacterView.vue";
import SkillsView from "../views/SkillsView.vue";
import AbilitiesView from "../views/AbilitiesView.vue";
import ItemsView from "../views/ItemsView.vue";
import CombatView from "../views/CombatView.vue";
import SpellsView from "@/views/SpellsView.vue";
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      alias: "/character",
      name: "character",
      component: CharacterView,
    },
    {
      path: "/skills",
      name: "skills",

      component: SkillsView,
    },
    {
      path: "/abilities",
      name: "abilities",

      component: AbilitiesView,
    },
    {
      path: "/items",
      name: "items",

      component: ItemsView,
    },
    {
      path: "/spells",
      name: "spells",

      component: SpellsView,
    },
    {
      path: "/combat",
      name: "combat",

      component: CombatView,
    },
  ],
});

export default router;
