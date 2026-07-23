<script setup lang="ts">
/**
 * La page article complète (US2) — structure de `article.html`.
 *
 * Fil d'Ariane, rubrique (kicker accent), titre, chapô, métadonnées, couverture
 * légendée (légende DISTINCTE du texte alternatif), corps riche, « à lire
 * aussi » de la même rubrique. Consomme `/api/articles/[slug]` ; un brouillon ou
 * un slug inconnu remonte en 404 vers `app/error.vue`.
 */
const route = useRoute()

const { data, error } = await useFetch(() => `/api/articles/${route.params.slug}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 404,
    statusMessage: 'Adresse introuvable',
    fatal: true,
  })
}

// La rubrique de l'article n'est connue qu'après lecture : `definePageMeta` étant
// figé à la compilation, on renseigne `route.meta.rubrique` au rendu pour que la
// colonne marque la bonne rubrique « page courante » (principe VIII).
if (data.value) {
  route.meta.rubrique = data.value.article.rubrique.id
}

useHead(() => ({
  title: data.value ? `${data.value.article.titre} — Francomètre` : 'Francomètre',
}))

/** Métadonnées de la signature, dans l'ordre : date · temps de lecture · auteur. */
const meta = computed(() => {
  const article = data.value?.article
  if (!article) return []
  const parts = [dateLongueFr(article.date), `${article.tempsLecture} min de lecture`]
  if (article.auteur) parts.push(article.auteur)
  return parts
})
</script>

<template>
  <div v-if="data">
    <article class="pt-14">
      <!-- Tête, colonne de 800 px. -->
      <div class="mx-auto max-w-[800px]">
        <FilAriane :elements="data.article.filAriane" :courant="data.article.titre" />

        <!-- Kicker rubrique — accent tracé à `.article-kicker` d'`article.html`. -->
        <p class="mt-[26px] font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow uppercase text-accent">
          {{ data.article.rubrique.libelle }}
        </p>

        <h1 class="mt-4 font-titre text-titre-article-mobile socle:text-titre-article leading-titre-article font-extra-grasse tracking-titre text-ink text-balance">
          {{ data.article.titre }}
        </h1>

        <p class="mt-6 text-chapo-mobile socle:text-chapo leading-corps-serre text-muted">
          {{ data.article.chapo }}
        </p>

        <div class="mt-[26px] flex flex-wrap items-center gap-[10px] text-meta text-muted">
          <template v-for="(part, index) in meta" :key="index">
            <span v-if="index > 0" class="text-separateur" aria-hidden="true">·</span>
            <span>{{ part }}</span>
          </template>
        </div>

        <div class="mt-[22px] h-px bg-line" />
      </div>

      <!-- Couverture, largeur de contenu. -->
      <figure v-if="data.article.couverture" class="mt-10">
        <div class="relative aspect-video overflow-hidden bg-surface">
          <img
            :src="data.article.couverture.url"
            :alt="data.article.couverture.alt"
            class="absolute inset-0 h-full w-full object-cover"
          >
        </div>
        <figcaption
          v-if="data.article.couverture.legende"
          class="mt-[10px] text-meta leading-corps-serre text-muted"
        >
          {{ data.article.couverture.legende }}
        </figcaption>
      </figure>

      <!-- Corps, colonne de lecture de 720 px. -->
      <CorpsArticle :html="data.article.corpsHtml" class="mx-auto mt-12 max-w-[720px]" />
    </article>

    <!-- À LIRE AUSSI -->
    <template v-if="data.aLireAussi.length > 0">
      <div class="mt-16">
        <FiletCoupe :position="66" />
      </div>
      <section class="pt-12">
        <h2 class="font-titre text-titre-section-mobile socle:text-titre-section leading-[1.05] font-grasse tracking-titre text-ink">
          À lire aussi
        </h2>
        <div class="mt-8">
          <GrilleArticles :articles="data.aLireAussi" />
        </div>
      </section>
    </template>
  </div>
</template>
