<script setup lang="ts">
import type { ArticlePubliableDTO } from '#shared/types/dto'

/**
 * Un article publiable, proposé à l'épinglage — DÉRIVÉ 2, hors du composant Card.
 * Dimensions fixes des maquettes : vignette 64×36, titre 14 px (deux lignes),
 * eyebrow 10 px. « Épingler » place l'article sur le premier rang libre.
 */
defineProps<{ article: ArticlePubliableDTO }>()
const emit = defineEmits<{ epingler: [] }>()
</script>

<template>
  <div class="flex items-start gap-3.5 border-b border-line py-3.5">
    <div class="relative h-9 w-16 shrink-0 overflow-hidden bg-surface">
      <img
        v-if="article.image"
        :src="article.image"
        :alt="article.imageAlt ?? ''"
        class="absolute inset-0 h-full w-full object-cover"
      >
    </div>

    <div class="min-w-0 flex-1">
      <div
        class="overflow-hidden text-[14px] font-moyenne leading-titre-card text-ink [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]"
      >
        {{ article.titre }}
      </div>
      <div class="mt-1.5 font-titre text-[10px] font-demi-grasse tracking-eyebrow uppercase text-muted">
        {{ article.rubrique }}
      </div>
    </div>

    <button
      type="button"
      class="shrink-0 cursor-pointer pt-0.5 text-meta font-moyenne whitespace-nowrap text-ink underline underline-offset-2"
      @click="emit('epingler')"
    >
      Épingler
    </button>
  </div>
</template>
