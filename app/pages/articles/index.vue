<script setup lang="ts">
/**
 * « Tous les articles » (US1, clarification) — toutes rubriques, paginé.
 *
 * Consomme `/api/articles?page=N` (route partagée avec la page rubrique). La
 * grille et la pagination sont les primitives communes. Contexte d'eyebrow
 * `null` : hors de toute rubrique, le surtitre est la rubrique (FR-006a).
 */
const route = useRoute()

/** Page courante, telle qu'elle vit dans l'URL — réactive au changement de `?page`. */
const page = computed(() => route.query.page)

const { data: liste, error } = await useFetch('/api/articles', {
  query: { page },
})

// Une page hors bornes est une 404 (research D3) : on rend le gabarit d'état.
if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: 'Adresse introuvable',
    fatal: true,
  })
}

const siteUrl = useRuntimeConfig().public.siteUrl

// Canonique de « tous les articles », pagination conservée (?page=N si N>1, D5).
const cheminCanonique = computed(() => {
  const n = Number(route.query.page)
  return n > 1 ? `/articles?page=${n}` : '/articles'
})

useSeoMeta({
  title: 'Tous les articles — Francomètre',
  description: 'Tous les articles de Francomètre, toutes rubriques confondues, du plus récent au plus ancien.',
})
useHead(() => ({
  link: [{ rel: 'canonical', href: urlCanonique(siteUrl, cheminCanonique.value) }],
}))
</script>

<template>
  <div v-if="liste">
    <!-- En-tête sobre (structure d'en-tête de `rubrique.html`, sans eyebrow rubrique). -->
    <section class="pt-14">
      <h1 class="font-titre text-titre-rubrique-mobile socle:text-titre-rubrique leading-titre-rubrique-mobile socle:leading-nul font-extra-grasse tracking-titre text-ink">
        Tous les articles
      </h1>
      <div class="mt-7 h-px bg-line" />
    </section>

    <section class="pt-11">
      <GrilleArticles :articles="liste.articles" />
    </section>

    <section class="pt-13">
      <Pagination :page="liste.page" :total-pages="liste.totalPages" />
    </section>
  </div>
</template>
