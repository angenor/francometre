<script setup lang="ts">
/**
 * Le fil d'Ariane de l'article — Accueil → Rubrique → titre courant
 * (structure `article.html` `.breadcrumb`).
 *
 * Les ancêtres sont des liens ; le titre courant est du texte, marqué
 * `aria-current="page"` (il désigne la page réellement affichée, principe VIII).
 * Focus visible hérité, libellés en français.
 */
import type { FilArianeElement } from '#shared/types/dto'

defineProps<{ elements: FilArianeElement[], courant: string }>()
</script>

<template>
  <nav aria-label="Fil d'Ariane" class="flex flex-wrap items-center gap-2 text-meta text-muted">
    <template v-for="element in elements" :key="element.chemin">
      <NuxtLink :to="element.chemin" class="text-muted hover:text-ink">
        {{ element.libelle }}
      </NuxtLink>
      <span class="text-separateur" aria-hidden="true">›</span>
    </template>
    <span aria-current="page" class="text-muted">{{ courant }}</span>
  </nav>
</template>
