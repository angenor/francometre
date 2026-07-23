<script setup lang="ts">
/**
 * Layout NU — un écran centré, sans aucune charpente de navigation.
 *
 * La connexion n'a ni colonne latérale, ni barre supérieure, ni pied de page
 * (FR-002 : « sans introduire de gabarit de navigation »). Ce layout reproduit
 * le `.screen` de `docs/design/html/connexion.html` : boîte flexible centrée,
 * hauteur d'au moins une fenêtre, gouttière de 24 px (40 px en haut et bas).
 *
 * `min-h-dvh` et non `min-h-screen` : sur mobile, `dvh` suit la barre d'adresse
 * rétractable, là où `vh` fige une hauteur qui déborde. Aucun rail, donc aucun
 * risque de défilement horizontal à 375 px (porte 7).
 */
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center px-6 py-10">
    <slot />
  </div>
</template>
