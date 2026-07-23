<script setup lang="ts">
/**
 * L'état « rubrique sans article publié » (US3, FR-012) — écran NON maquetté.
 *
 * Conçu sobre, dans la charpente conservée par la page : une phrase claire, en
 * couleur « méta », aucun accent inventé (porte 4), aucun ornement. Ce n'est ni
 * une grille vide ni une erreur — la rubrique existe, elle n'a simplement rien à
 * montrer pour l'instant.
 */
</script>

<template>
  <div data-testid="etat-vide" class="py-24 text-center">
    <p class="text-chapo-mobile socle:text-chapo leading-corps-serre text-muted">
      Aucun article n'est publié dans cette rubrique pour l'instant.
    </p>
    <p class="mt-3 text-meta text-muted">
      Revenez bientôt, ou parcourez les autres rubriques.
    </p>
  </div>
</template>
