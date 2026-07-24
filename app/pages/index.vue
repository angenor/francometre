<script setup lang="ts">
/**
 * L'accueil éditorialisé (US1) — structure de `accueil.html`.
 *
 * « À la une » (héros 01 + secondaires 02–05), un filet coupé, « Les derniers
 * articles » (grille + « Tout voir » → `/articles`), puis les sections des
 * rubriques mises en avant, séparées par des filets coupés.
 *
 * La page ne touche jamais Prisma : elle consomme `/api/accueil`, qui renvoie un
 * DTO déjà mappé (research D2). Aucune rubrique déclarée : l'accueil n'en occupe
 * aucune, rien n'est signalé « page courante » dans la colonne (principe VIII).
 */
const siteUrl = useRuntimeConfig().public.siteUrl

useHead({
  title: 'Francomètre — L\'actualité, mesurée.',
  // Canonique absolue de l'apex (D2). Une seule adresse fait foi pour la Une.
  link: [{ rel: 'canonical', href: urlCanonique(siteUrl, '/') }],
})
useSeoMeta({
  description: 'L\'actualité française, mesurée : une Une éditorialisée de cinq '
    + 'articles et huit rubriques, mises à jour au fil des publications.',
})

const { data: accueil } = await useFetch('/api/accueil')

/** Positions de brisure des filets coupés, reprises de `accueil.html`. */
const POSITIONS = [72, 38, 60]
</script>

<template>
  <div v-if="accueil">
    <!--
      Titre de page unique (SC-010). L'accueil éditorialisé n'affiche pas de
      grand titre — les sections sont des `h2` —, mais une page doit porter un
      `h1` : on le rend accessible aux technologies d'assistance sans le peindre
      (accessibilité qui prime sur la maquette, principe VIII).
    -->
    <h1 class="sr-only">Francomètre — l'actualité, mesurée.</h1>

    <!-- À LA UNE -->
    <section class="py-14" data-testid="une">
      <p class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow uppercase text-accent">
        À la une
      </p>
      <div class="mt-7 grid grid-cols-1 items-start gap-10 socle:grid-cols-[7fr_5fr]">
        <UneHero v-if="accueil.une.hero" :hero="accueil.une.hero" />
        <div class="grid grid-cols-2 gap-6">
          <UneSecondaire
            v-for="secondaire in accueil.une.secondaires"
            :key="secondaire.slug"
            :secondaire="secondaire"
          />
        </div>
      </div>
    </section>

    <FiletCoupe :position="50" />

    <!-- LES DERNIERS ARTICLES -->
    <section class="py-16">
      <div class="flex items-baseline justify-between gap-6">
        <h2 class="font-titre text-titre-section-mobile socle:text-titre-section leading-[1.05] font-grasse tracking-titre text-ink">
          Les derniers articles
        </h2>
        <NuxtLink to="/articles" class="shrink-0 text-interface font-moyenne text-muted hover:text-ink">
          Tout voir
        </NuxtLink>
      </div>
      <div class="mt-8">
        <GrilleArticles :articles="accueil.derniers" />
      </div>
    </section>

    <!-- SECTIONS DE RUBRIQUE -->
    <template v-for="(section, index) in accueil.sections" :key="section.rubrique.id">
      <FiletCoupe :position="POSITIONS[index % POSITIONS.length]" />
      <div class="py-14">
        <SectionRubrique :rubrique="section.rubrique" :articles="section.articles" />
      </div>
    </template>
  </div>
</template>
