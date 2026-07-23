<script setup lang="ts">
/**
 * Un rang 02–05 de la Une — numéro (accent) + eyebrow rubrique + titre, SANS
 * image (data-model §2, T017 : décision de conception, la Une secondaire est une
 * liste numérotée sobre).
 *
 * Le numéro est le seul accent, comme sur `accueil.html`. La vignette entière
 * est le lien. Composition de structure, pas une variante de la Card (porte 2).
 */
import type { UneSecondaireDTO } from '#shared/types/dto'

const props = defineProps<{ secondaire: UneSecondaireDTO }>()

const dateFr = computed(() => dateLongueFr(props.secondaire.date))
</script>

<template>
  <NuxtLink
    :to="secondaire.chemin"
    class="group block border-t-(length:--filet-actif) border-ink pt-4"
  >
    <p class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow uppercase text-muted">
      <span data-testid="une-numero" class="text-accent [font-variant-numeric:tabular-nums]">{{ secondaire.numero }}</span>
      · {{ secondaire.eyebrow }}
    </p>

    <h3 class="mt-2 line-clamp-3 font-titre text-titre-card leading-titre-card font-demi-grasse tracking-titre text-ink decoration-1 underline-offset-3 group-hover:underline group-focus-visible:underline">
      {{ secondaire.titre }}
    </h3>

    <time :datetime="secondaire.date" class="mt-3 block text-meta text-muted">
      {{ dateFr }}
    </time>
  </NuxtLink>
</template>
