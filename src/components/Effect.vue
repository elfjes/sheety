<script setup lang="ts">
import { ref } from "vue";
import { EffectKind, type Effect } from "../types.ts";
import EffectDetails from "./EffectDetails.vue";
import Card from "./Card.vue";

const editing = defineModel<boolean>("editing", { default: false });
const {
  effect,
  allowedKinds = Object.values(EffectKind),
  editable = false,
  toggle = false,
} = defineProps<{
  effect: Effect;
  allowedKinds?: EffectKind[];
  editable?: boolean;
  toggle?: boolean;
}>();
const emit = defineEmits<{
  (e: "update:effect", effect: Effect): void;
  (e: "delete"): void;
}>();
const open = ref(false);
const deleting = ref(false);
const newTagValue = ref("");

if (!effect.name) {
  editing.value = true;
}

if (allowedKinds.length === 1) {
  emit("update:effect", {
    ...effect,
    kind: allowedKinds[0]!,
  });
}
function toggleEditing() {
  if (!editable) return;
  editing.value = !editing.value;
  if (editing) {
    open.value = true;
  }
}
function confirmDelete() {
  if (deleting.value) {
    emit("delete");
    deleting.value = false;
    editing.value = false;
    return;
  }
  deleting.value = true;
}
function newEffect() {
  effect.details.push({
    target: "str",
    modifier: 0,
  });
}
function deleteEffect(idx: number) {
  effect.details.splice(idx, 1);
}
function addNewTag() {
  effect.tags ??= [];
  effect.tags.push(newTagValue.value);
  newTagValue.value = "";
}
</script>
<template>
  <Card v-model:open="open" :collapse="!editing">
    <template #header>
      <div v-if="editing" class="flex flex-row gap-1">
        <input v-if="toggle" type="checkbox" class="checkbox checkbox-sm" v-model="effect.active" />
        <input class="input input-sm w-full" v-model="effect.name" />
        <div class="ml-auto"></div>
        <button
          v-if="editing"
          class="btn btn-sm"
          :class="deleting && 'btn-error'"
          @click="confirmDelete()"
          @blur="deleting = false"
          @mouseleave="deleting = false"
        >
          <i class="fas fa-trash text-center w-8" />
        </button>
        <button class="btn btn-sm" :disabled="deleting" @click="toggleEditing()">
          <i class="fas fa-check text-center w-8" />
        </button>
      </div>
      <div v-else class="flex flex-row gap-1 items-center">
        <input v-if="toggle" type="checkbox" class="checkbox checkbox-sm" v-model="effect.active" />
        <h3 class="font-bold overflow-hidden text-ellipsis flex-shrink-1">
          {{ effect.name }}
        </h3>
        <div class="text-gray-400">({{ effect.kind }})</div>
        <button v-if="editable" class="btn btn-xs ml-auto" @click="toggleEditing()">
          <i class="fas fa-pencil text-center w-8" />
        </button>
      </div>
    </template>
    <div class="flex flex-col gap-1">
      <div v-if="editing" class="flex flex-row flex-wrap justify-stretch gap-1">
        <label
          v-if="editing && allowedKinds.length > 1"
          class="select select-sm min-w-max max-w-1/2"
        >
          <span class="label">Type</span>
          <select class="min-w-max" v-model="effect.kind">
            <option v-for="kind in allowedKinds" :value="kind">{{ kind }}</option>
          </select>
        </label>
        <slot></slot>
      </div>
      <template v-for="(_, i) in effect.details">
        <EffectDetails v-model="effect.details[i]!" :editing="editing" @delete="deleteEffect(i)" />
      </template>
      <div
        v-if="editing"
        class="btn btn-xs btn-ghost w-full text-gray-400 border-dashed border-gray-400"
        @click="newEffect()"
      >
        Add a new effect...
      </div>
      <div class="flex flex-row gap-1 items-center flex-wrap">
        <div v-for="(tag, i) in effect.tags" class="bg-gray-200 border rounded-sm px-1 text-xs">
          {{ tag }}
          <i
            v-if="editing"
            class="fas fa-xmark bg-gray-200 text-xs"
            @click="effect.tags!.splice(i, 1)"
          />
        </div>
        <div
          v-if="editing"
          class="input input-xs h-4 border rounded-sm border-gray-400 text-gray-400 border-dashed px-1 text-xs w-fit"
        >
          <input
            class="w-16"
            type="text"
            placeholder="Add a tag..."
            v-model="newTagValue"
            @keydown.enter="addNewTag()"
          />
          <i v-if="newTagValue" class="fas fa-plus text-xs cursor-pointer" @click="addNewTag()" />
        </div>
      </div>
    </div>
  </Card>
</template>
<style scoped></style>
