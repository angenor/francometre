<script setup lang="ts">
/**
 * La page rubrique (US3) — structure de `rubrique.html`.
 *
 * En-tête au nom de la rubrique, grille paginée du plus récent au plus ancien,
 * état vide dédié si la rubrique ne publie rien. Consomme `/api/articles` avec
 * la rubrique en query : une rubrique inconnue ou une page hors bornes remonte
 * en 404. Contexte d'eyebrow = la rubrique → les vignettes affichent le sous-thème.
 */
import type { RubriqueId } from '#shared/utils/rubriques'

const route = useRoute()

const page = computed(() => route.query.page)

const { data: liste, error } = await useFetch('/api/articles', {
  query: {
    rubrique: computed(() => route.params.id),
    page,
  },
})

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: 'Adresse introuvable',
    fatal: true,
  })
}

// La rubrique affichée marque la colonne « page courante » (principe VIII).
if (liste.value?.rubrique) {
  route.meta.rubrique = liste.value.rubrique.id as RubriqueId
}

const siteUrl = useRuntimeConfig().public.siteUrl

// Canonique = la rubrique, la page de pagination CONSERVÉE (?page=N si N>1,
// pagination indexable et auto-canonique, D5).
const cheminCanonique = computed(() => {
  const n = Number(route.query.page)
  const suffixe = n > 1 ? `?page=${n}` : ''
  return `/rubrique/${route.params.id}${suffixe}`
})

useSeoMeta({
  title: () => liste.value?.rubrique
    ? `${liste.value.rubrique.libelle} — Francomètre`
    : 'Francomètre',
  description: () => liste.value?.rubrique
    ? `Toute l'actualité « ${liste.value.rubrique.libelle} » sur Francomètre, du plus récent au plus ancien.`
    : undefined,
})
useHead(() => ({
  link: [{ rel: 'canonical', href: urlCanonique(siteUrl, cheminCanonique.value) }],
}))
</script>

<template>
  <div v-if="liste">
    <!-- En-tête de rubrique. -->
    <section class="pt-14">
      <p class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow uppercase text-muted">
        Rubrique
      </p>
      <h1 class="mt-[14px] font-titre text-titre-rubrique-mobile socle:text-titre-rubrique leading-titre-rubrique-mobile socle:leading-nul font-extra-grasse tracking-titre text-ink">
        {{ liste.rubrique?.libelle }}
      </h1>
      <div class="mt-7 h-px bg-line" />
    </section>

    <!-- Grille paginée, ou état vide dédié. -->
    <template v-if="liste.total > 0">
      <section class="pt-11">
        <GrilleArticles :articles="liste.articles" />
      </section>
      <section class="pt-13">
        <Pagination :page="liste.page" :total-pages="liste.totalPages" />
      </section>
    </template>
    <EtatVide v-else />
  </div>
</template>
