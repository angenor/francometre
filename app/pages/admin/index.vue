<script setup lang="ts">
/**
 * `/admin` — point d'entrée du back-office : redirige vers la liste des articles.
 *
 * La destination après connexion (`/admin`) atterrit donc sur l'écran principal.
 * Le garde d'affichage (`admin.global.ts`) et le garde serveur (`exigerCompte`)
 * restent en amont : un visiteur non connecté est renvoyé à la connexion avant
 * même cette redirection.
 */
definePageMeta({ layout: false })

await navigateTo('/admin/articles', { redirectCode: 302, replace: true })
</script>

<template>
  <div />
</template>
