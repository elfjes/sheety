<script setup lang="ts">

import { ref } from "vue";
import { RouterView, RouterLink } from "vue-router";
import { useCharacterStore } from "./stores/character";

const open = ref(false)
const store = useCharacterStore()
const menuItems = [
  { "title": "Character", "route": "/character" },
  { "title": "Skills & Feats", "route": "/skills-and-feats" },
  { "title": "Items", "route": "/items" },
  { "title": "Combat", "route": "/combat" },
]
</script>

<template>
  <header class="border-b">
    <div class="flex flex-row items-center">
      <div class="space-y-2 p-4" @click="open = !open">
        <span class="block w-8 h-1 bg-gray-600"></span>
        <span class="block w-8 h-1 bg-gray-600"></span>
        <span class="block w-8 h-1 bg-gray-600"></span>
      </div>
      <div>{{ store.character.name }}</div>
    </div>
    <div v-if="open">
      <ul class="divide-y">
        <RouterLink v-for="item in menuItems" :to=item.route>
          <li class="px-4" @click="open = false">{{ item.title }}</li>
        </RouterLink>
      </ul>
    </div>
  </header>
  <div class="p-4">

    <RouterView />
  </div>
</template>

<style scoped></style>
