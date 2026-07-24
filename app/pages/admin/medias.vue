<script setup lang="ts">
/**
 * Écran « Médias » — HORS PÉRIMÈTRE de cette feature (emplacement réservé vers
 * lequel le rail renvoie). Strictement sobre, SANS accent de sa propre
 * initiative (principe III) : un écran non maquetté.
 */
definePageMeta({ layout: 'admin' })
useHead({ title: 'Médias — Administration' })
</script>

<template>
  <div class="px-(--gouttiere-mobile) py-8 socle:px-12 socle:py-10">
    <h1 class="font-titre text-titre-admin leading-nul font-grasse tracking-titre text-ink">
      Médias
    </h1>
    <p class="mt-6 font-corps text-corps-courant text-muted">
      La bibliothèque des médias sera disponible dans une prochaine version.
    </p>
  </div>
</template>
