<script setup lang="ts">
/**
 * Interrupteur de thème.
 *
 * Bouton RÉEL — pas un `div` cliquable —, atteignable et actionnable au
 * clavier, portant un libellé décrivant l'action et exposant l'état courant.
 *
 * Le thème vient de `useColorMode()` du module `@nuxtjs/color-mode` : aucun
 * composable maison, qui serait une seconde source de vérité sur l'état du
 * thème. Le composant ne CALCULE jamais le thème au montage — la classe est
 * déjà posée par le script du `<head>` avant la première peinture, et la
 * recalculer produirait précisément le flash que FR-015 interdit.
 *
 * La bascule est binaire : `light` ↔ `dark`. Fondations ne livre pas de retour
 * explicite à « suivre le système » (data-model.md §2).
 */
withDefaults(defineProps<{ libelle?: boolean }>(), { libelle: true })

const colorMode = useColorMode()

/** Le thème effectivement affiché — `value`, jamais `preference`. */
const sombre = computed(() => colorMode.value === 'dark')

/** Libellé de l'action à venir, pas de l'état courant. */
const action = computed(() => (sombre.value ? 'Passer en clair' : 'Passer en sombre'))

function basculer() {
  colorMode.preference = sombre.value ? 'light' : 'dark'
}
</script>

<template>
  <button
    type="button"
    class="flex cursor-pointer items-center gap-2.5 text-ink"
    :aria-label="action"
    :aria-pressed="sombre"
    @click="basculer"
  >
    <!-- Demi-lune des maquettes, conservée telle quelle (constitution I). -->
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      class="shrink-0"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" stroke="none" />
    </svg>
    <span v-if="libelle" class="text-interface text-muted">
      {{ action }}
    </span>
  </button>
</template>
