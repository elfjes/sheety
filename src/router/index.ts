import { createRouter, createWebHistory } from 'vue-router'

import CharacterView from '../views/CharacterView.vue'
import SkillsAndFeatsView from '../views/SkillsAndFeatsView.vue'
import ItemsView from '../views/ItemsView.vue'
import CombatView from '../views/CombatView.vue'
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      alias: '/character',
      name: 'character',
      component: CharacterView
    },
    {
      path: '/skills-and-feats',
      name: 'skills-and-feats',

      component: SkillsAndFeatsView
    },
    {
      path: '/items',
      name: 'items',

      component: ItemsView
    },
    {
      path: '/combat',
      name: 'combat',

      component: CombatView
    },
  ],
})

export default router
