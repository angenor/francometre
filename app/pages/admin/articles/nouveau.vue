<script setup lang="ts">
/**
 * Éditeur en CRÉATION. La création paresseuse (research.md D8) fait qu'aucun
 * article n'existe encore : le premier enregistrement (auto ou explicite) crée
 * le brouillon, puis l'URL bascule sur `/admin/articles/<id>` sans recharger.
 */
definePageMeta({ layout: 'admin' })
useHead({ title: 'Nouvel article — Administration' })
</script>

<template>
  <EditeurArticle />
</template>
