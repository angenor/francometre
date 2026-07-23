<script setup lang="ts">
/**
 * Une section de rubrique de l'accueil — titre + « Tout voir » + vignettes.
 *
 * Au-dessus du point de rupture : une grille à quatre colonnes. En dessous : un
 * RAIL à défilement horizontal BORNÉ (research D11, FR-028). Le défilement est
 * interne au conteneur, jamais celui de la page — la porte 7 (aucun débordement
 * horizontal de page à 375 px) tient parce que `overflow-x-auto` clôt le rail.
 */
import type { CarteDTO, RubriqueRef } from '#shared/types/dto'

defineProps<{ rubrique: RubriqueRef, articles: CarteDTO[] }>()
</script>

<template>
  <section>
    <div class="flex items-baseline justify-between gap-6">
      <h2 class="font-titre text-titre-section-mobile socle:text-titre-section leading-titre-card socle:leading-nul font-grasse tracking-titre text-ink">
        {{ rubrique.libelle }}
      </h2>
      <NuxtLink
        :to="rubrique.chemin"
        class="shrink-0 text-interface font-moyenne text-muted hover:text-ink"
      >
        Tout voir
      </NuxtLink>
    </div>

    <!--
      Un seul jeu de vignettes : rail horizontal (flex + overflow) sous le point
      de rupture, grille à quatre colonnes au-dessus. Les cartes prennent une
      largeur fixe de rail sur mobile, automatique en grille.
    -->
    <div
      data-testid="rail-rubrique"
      class="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto socle:grid socle:grid-cols-4 socle:overflow-x-visible"
    >
      <div
        v-for="carte in articles"
        :key="carte.slug"
        class="w-(--rail-cards-mobile) shrink-0 snap-start socle:w-auto socle:shrink"
      >
        <ArticleCard
          :titre="carte.titre"
          :rubrique="carte.rubrique"
          :eyebrow="carte.eyebrow"
          :date="carte.date"
          :chemin="carte.chemin"
          :image="carte.image"
          :image-alt="carte.imageAlt"
        />
      </div>
    </div>
  </section>
</template>
