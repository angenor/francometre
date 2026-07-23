<script setup lang="ts">
/**
 * La grille de vignettes — employée par la page rubrique et « tous les articles ».
 *
 * Ce n'est PAS une variante de la Card : c'est une composition de structure
 * (porte 2). Chaque vignette est une `ArticleCard`, unique et inchangée. La
 * grille ne fait que disposer et transmettre les DTO, eyebrow contextuel compris.
 *
 * Quatre colonnes au-dessus du point de rupture, deux puis une en dessous. Le
 * défilement reste vertical : aucune de ces largeurs ne déborde la page (porte 7).
 */
import type { CarteDTO } from '#shared/types/dto'

defineProps<{ articles: CarteDTO[] }>()
</script>

<template>
  <div class="grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 socle:grid-cols-4">
    <ArticleCard
      v-for="carte in articles"
      :key="carte.slug"
      :titre="carte.titre"
      :rubrique="carte.rubrique"
      :eyebrow="carte.eyebrow"
      :date="carte.date"
      :chemin="carte.chemin"
      :image="carte.image"
      :image-alt="carte.imageAlt"
    />
  </div>
</template>
