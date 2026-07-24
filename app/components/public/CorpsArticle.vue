<script setup lang="ts">
/**
 * Le corps riche de l'article — rendu de `corpsHtml` DÉJÀ assaini au stockage
 * (porte 11, research 002 D10 / research D5). Aucun ré-assainissement à
 * l'affichage : le corps est sûr en base, le réassainir contredirait le choix
 * 002 (assainir à l'écriture) et coûterait à chaque rendu.
 *
 * La typographie `.corps` vit désormais dans `app/assets/css/corps.css`, feuille
 * NON scopée partagée mot pour mot avec l'éditeur (research.md D2, FR-013) : le
 * rendu de l'éditeur est celui du site publié, par construction. Ce composant ne
 * porte donc plus de styles — il pose la classe et injecte le HTML.
 */
defineProps<{ html: string }>()
</script>

<template>
  <!-- eslint-disable-next-line vue/no-v-html — corps déjà assaini côté serveur (porte 11). -->
  <div class="corps" v-html="html" />
</template>
