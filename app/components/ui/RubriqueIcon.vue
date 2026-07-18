<script setup lang="ts">
/**
 * Pictogramme d'une rubrique.
 *
 * Enveloppe de la collection locale `rubrique:` servie par `@nuxt/icon` — les
 * huit tracés relevés dans les maquettes, pas les icônes approchantes d'une
 * bibliothèque générique : la constitution dit de ces pictogrammes qu'ils
 * « font partie du système » et que « les retirer est un défaut ».
 *
 * Monochrome, hérite de `currentColor`, masqué aux technologies d'assistance :
 * c'est le libellé voisin qui porte le sens.
 *
 * Les huit identifiants ont un tracé. Il n'y a pas de tracé de repli — un
 * identifiant inconnu est une erreur de construction, pas un cas d'exécution.
 */
defineProps<{
  rubrique: RubriqueId
}>()
</script>

<template>
  <Icon
    :name="`rubrique:${rubrique}`"
    class="shrink-0 opacity-55"
    :size="18"
    aria-hidden="true"
  />
</template>
