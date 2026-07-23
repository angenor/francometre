<script setup lang="ts">
/**
 * Le gabarit d'état (US4) — 404 / 503 / 500, structure de `etats.html`.
 *
 * `error.vue` est le SEUL point où Nuxt rend une erreur : l'y ancrer garantit un
 * gabarit unique (research D8). Il enveloppe `NuxtLayout` pour conserver la
 * charpente (colonne, barre, pied de page). Le chiffre est en filigrane
 * (couleur « filet »), la phrase en « ink ». Une 404 « ramène vers du contenu »
 * en présentant les derniers articles — une liste n'est jamais une impasse
 * (FR-020, FR-021).
 */
import type { CarteDTO } from '#shared/types/dto'

const props = defineProps<{ error: { statusCode?: number } }>()

const code = computed(() => props.error?.statusCode ?? 500)

/** Message d'état, adapté au code (FR-020/021/022). */
const message = computed(() => {
  if (code.value === 404) return 'Cette page n\'existe pas ou a été dépubliée.'
  if (code.value === 503) return 'Le service est temporairement indisponible. Réessayez dans quelques instants.'
  return 'Une erreur est survenue de notre côté. Réessayez dans quelques instants.'
})

/** Les 4xx introuvables ne se réessaient pas ; les erreurs de service, oui. */
const reessayable = computed(() => code.value !== 404)

// Les derniers articles, pour ne pas laisser la page en impasse. Un service
// indisponible peut faire échouer cette lecture aussi : on l'entoure, et la
// section disparaît simplement si rien ne remonte.
const derniers = ref<CarteDTO[]>([])
try {
  const reponse = await $fetch('/api/articles', { query: { page: 1 } })
  derniers.value = reponse.articles as CarteDTO[]
}
catch {
  derniers.value = []
}

function reessayer() {
  clearError()
  if (import.meta.client) window.location.reload()
}

useHead({ title: `Francomètre — ${code.value}` })
</script>

<template>
  <NuxtLayout>
    <section class="py-28 text-center">
      <div class="font-titre text-[96px] socle:text-[160px] leading-[0.86] font-extra-grasse tracking-[-0.03em] text-line [font-variant-numeric:tabular-nums]">
        {{ code }}
      </div>
      <p class="mx-auto mt-7 max-w-[40ch] font-titre text-[22px] socle:text-[27px] leading-[1.3] font-demi-grasse tracking-titre text-ink text-balance">
        {{ message }}
      </p>
      <!-- « Réessayer » — seul usage d'accent de la page, tracé à `etats.html`. -->
      <div v-if="reessayable" class="mt-7">
        <button
          type="button"
          class="font-corps text-[17px] font-demi-grasse text-accent underline decoration-1 underline-offset-4"
          @click="reessayer"
        >
          Réessayer
        </button>
      </div>
    </section>

    <template v-if="derniers.length > 0">
      <FiletCoupe :position="66" />
      <section class="py-14">
        <div class="flex items-baseline justify-between gap-6">
          <h2 class="font-titre text-titre-section-mobile socle:text-titre-section leading-[1.05] font-grasse tracking-titre text-ink">
            Les derniers articles
          </h2>
          <NuxtLink to="/articles" class="shrink-0 text-interface font-moyenne text-muted hover:text-ink">
            Tout voir
          </NuxtLink>
        </div>
        <div class="mt-8">
          <GrilleArticles :articles="derniers" />
        </div>
      </section>
    </template>
  </NuxtLayout>
</template>
