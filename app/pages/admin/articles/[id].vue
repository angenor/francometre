<script setup lang="ts">
import type { ArticleEditionDTO } from '#shared/types/dto'

/**
 * Éditeur en ÉDITION — l'article complet (brouillon compris) est chargé par
 * `GET /api/admin/articles/[id]` puis remis à `EditeurArticle`. Un identifiant
 * inconnu remonte en 404.
 */
definePageMeta({ layout: 'admin' })

const route = useRoute()
const { data, error } = await useFetch<ArticleEditionDTO>(
  `/api/admin/articles/${route.params.id}`,
)

if (error.value || !data.value) {
  throw createError({ statusCode: 404, statusMessage: 'Article introuvable', fatal: true })
}

useHead({ title: () => `${data.value?.titre || 'Article'} — Administration` })
</script>

<template>
  <EditeurArticle v-if="data" :key="data.id" :initial="data" />
</template>
