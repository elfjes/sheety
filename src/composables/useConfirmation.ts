import { ref, type Ref } from "vue";

function handleConfirm(confirm: Ref<boolean>, onConfirm: () => void) {
  if (!confirm.value) {
    confirm.value = true;
    return;
  }
  onConfirm();
  confirm.value = false;
}

export function useConfirmation(onConfirm: () => void) {
  const confirming = ref(false);
  const events = {
    click: () => {
      handleConfirm(confirming, onConfirm);
    },

    blur: () => {
      confirming.value = false;
    },
    mouseleave: () => {
      confirming.value = false;
    },
  };
  return {
    confirming,
    events,
  };
}
