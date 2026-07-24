<script setup lang="ts">
import type { ArticlePubliableDTO } from '#shared/types/dto'

/**
 * Un emplacement de « Composer la Une » — DÉRIVÉ 1, hors du composant Card
 * (arbitrage 2). Dimensions fixes des maquettes : vignette 213×120, HÉROS
 * 320×180 ; titre 18 px (héros 22), deux lignes ; rang 01–05 en accent.
 *
 * La poignée (`.js-poignee`) initie le glisser (pointeur) ET répond aux flèches
 * Haut/Bas (clavier) : le glisser-déposer est navigable au clavier (exigence
 * dure, porte 8). Un emplacement vide est un cadre pointillé.
 */
const props = defineProps<{
  article: ArticlePubliableDTO | null
  rang: number
  hero: boolean
}>()

const emit = defineEmits<{ monter: [], descendre: [], retirer: [] }>()

const rangAffiche = computed(() => String(props.rang).padStart(2, '0'))

function surTouche(evenement: KeyboardEvent) {
  if (evenement.key === 'ArrowUp') {
    evenement.preventDefault()
    emit('monter')
  }
  else if (evenement.key === 'ArrowDown') {
    evenement.preventDefault()
    emit('descendre')
  }
}
</script>

<template>
  <div class="flex items-stretch gap-5">
    <div
      class="w-11 shrink-0 pt-1 font-titre text-[32px] leading-nul font-extra-grasse tracking-titre text-accent [font-variant-numeric:tabular-nums]"
    >
      {{ rangAffiche }}
    </div>

    <!-- Emplacement occupé. Sous le socle, la carte s'empile (vignette au-dessus)
         et la vignette devient fluide (16/9) pour ne jamais déborder (D14). -->
    <div
      v-if="article"
      class="flex min-w-0 flex-1 flex-col gap-3 border border-line p-3.5 socle:flex-row socle:items-center socle:gap-[18px]"
    >
      <div
        class="relative aspect-video min-w-0 overflow-hidden bg-surface"
        :class="hero
          ? 'w-full socle:w-auto socle:max-w-[320px] socle:basis-[320px]'
          : 'w-full socle:w-auto socle:max-w-[213px] socle:basis-[213px]'"
      >
        <img
          v-if="article.image"
          :src="article.image"
          :alt="article.imageAlt ?? ''"
          class="absolute inset-0 h-full w-full object-cover"
        >
      </div>

      <div class="min-w-0 flex-1">
        <div class="font-titre text-[11px] font-demi-grasse tracking-eyebrow uppercase text-muted">
          {{ article.rubrique }}
        </div>
        <div
          class="mt-2 overflow-hidden font-titre font-demi-grasse leading-titre-card text-ink [-webkit-box-orient:vertical] [-webkit-line-clamp:2] [display:-webkit-box]"
          :class="hero ? 'text-[22px]' : 'text-[18px]'"
        >
          {{ article.titre }}
        </div>
        <button
          type="button"
          class="mt-2 cursor-pointer text-meta text-muted underline underline-offset-2 hover:text-ink"
          @click="emit('retirer')"
        >
          Retirer
        </button>
      </div>

      <button
        type="button"
        class="js-poignee flex shrink-0 cursor-grab flex-col gap-1 p-1.5"
        :data-poignee="article.id"
        :aria-label="`Déplacer « ${article.titre} » — rang ${rangAffiche}. Flèches haut et bas pour réordonner.`"
        @keydown="surTouche"
      >
        <span class="h-px w-4.5 bg-muted" />
        <span class="h-px w-4.5 bg-muted" />
        <span class="h-px w-4.5 bg-muted" />
      </button>
    </div>

    <!-- Emplacement libre -->
    <div
      v-else
      class="flex min-h-[152px] flex-1 items-center justify-center border border-dashed border-line"
    >
      <span class="text-interface text-muted">Emplacement libre</span>
    </div>
  </div>
</template>
