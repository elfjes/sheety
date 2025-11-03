import { createRouter, createWebHistory } from "vue-router";

import CharacterView from "../views/CharacterView.vue";
import SkillsView from "../views/SkillsView.vue";
import FeatsView from "../views/FeatsView.vue";
import ItemsView from "../views/ItemsView.vue";
import CombatView from "../views/CombatView.vue";
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
      path: "/feats",
      name: "feats",

      component: FeatsView,
    },
    {
      path: "/items",
      name: "items",

      component: ItemsView,
    },
    {
      path: "/combat",
      name: "combat",

      component: CombatView,
    },
  ],
});

export default router;
