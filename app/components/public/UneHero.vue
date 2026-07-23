<script setup lang="ts">
/**
 * Le héros de la Une — l'article de rang 01 (structure `accueil.html` `.hero`).
 *
 * Image large 16:9, numéro `01` en accent (le seul accent de la vignette, tracé
 * par `accueil.html`), titre, chapô, métadonnées. La vignette ENTIÈRE est le
 * lien. Ce n'est pas une variante de la Card : c'est une composition de
 * structure propre à la Une (porte 2).
 */
import type { UneHeroDTO } from '#shared/types/dto'

const props = defineProps<{ hero: UneHeroDTO }>()

const rubriqueLibelle = computed(() => libelleRubrique(props.hero.rubrique) ?? '')
const dateFr = computed(() => dateLongueFr(props.hero.date))
</script>

<template>
  <NuxtLink :to="hero.chemin" class="group block">
    <div class="relative aspect-video overflow-hidden bg-surface">
      <img
        :src="hero.image"
        :alt="hero.imageAlt"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-(--transition-survol) group-hover:transform-[scale(1.03)] group-focus-visible:transform-[scale(1.03)]"
      >
    </div>

    <div class="pt-[22px]">
      <div
        data-testid="une-numero"
        class="font-titre text-[46px] leading-nul font-extra-grasse tracking-titre text-accent [font-variant-numeric:tabular-nums]"
      >
        {{ hero.numero }}
      </div>

      <h2 class="mt-[10px] font-titre text-titre-heros-une-mobile leading-titre-heros-une-mobile socle:text-titre-heros-une socle:leading-titre-heros-une font-grasse tracking-titre text-ink text-balance group-hover:underline group-focus-visible:underline decoration-1 underline-offset-3">
        {{ hero.titre }}
      </h2>

      <p class="mt-[18px] max-w-[62ch] text-corps-courant leading-corps text-ink line-clamp-2">
        {{ hero.chapo }}
      </p>

      <div class="mt-4 text-meta text-muted">
        {{ dateFr }} · {{ rubriqueLibelle }} · {{ hero.tempsLecture }} min de lecture
      </div>
    </div>
  </NuxtLink>
</template>
