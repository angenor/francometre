<script setup lang="ts">
/**
 * Les commandes de pagination (structure de `rubrique.html` `.pagination`).
 *
 * « Précédent · 1 2 3 … 8 · Suivant » : la page courante en accent, les autres
 * en liens `?page=N`, les extrémités toujours présentes, les trous comblés par
 * une ellipse. Filet ordinaire au-dessus, focus visible hérité, libellés en
 * français. Aucune coupe, aucun accent hors la page courante.
 *
 * Rien n'est rendu tant qu'il n'y a qu'une page : une pagination d'une seule
 * page serait un ornement sans fonction.
 */
const props = defineProps<{ page: number, totalPages: number }>()

const route = useRoute()

/** Conserve les autres paramètres et ne déplace que `page`. */
function lien(n: number) {
  return { query: { ...route.query, page: String(n) } }
}

/**
 * La fenêtre de pages : les extrémités (1 et la dernière), la page courante et
 * ses voisines immédiates, séparées par une ellipse là où un intervalle est sauté.
 */
const elements = computed<(number | 'ellipse')[]>(() => {
  const total = props.totalPages
  const retenues = new Set<number>([1, total])
  for (let p = props.page - 1; p <= props.page + 1; p += 1) {
    if (p >= 1 && p <= total) retenues.add(p)
  }

  const triees = [...retenues].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)

  const items: (number | 'ellipse')[] = []
  let precedent = 0
  for (const p of triees) {
    if (p - precedent > 1) items.push('ellipse')
    items.push(p)
    precedent = p
  }
  return items
})
</script>

<template>
  <nav
    v-if="totalPages > 1"
    aria-label="Pagination"
    class="flex items-center justify-center gap-[22px] border-t border-line pt-8 text-[15px] font-moyenne [font-variant-numeric:tabular-nums]"
  >
    <NuxtLink
      v-if="page > 1"
      :to="lien(page - 1)"
      rel="prev"
      class="text-muted hover:text-ink"
    >
      Précédent
    </NuxtLink>
    <span v-else class="text-muted" aria-hidden="true">Précédent</span>

    <span class="text-separateur" aria-hidden="true">·</span>

    <span class="flex items-center gap-5">
      <template v-for="(element, index) in elements" :key="index">
        <span v-if="element === 'ellipse'" class="text-muted" aria-hidden="true">…</span>
        <span
          v-else-if="element === page"
          class="text-accent font-demi-grasse"
          aria-current="page"
        >
          {{ element }}
        </span>
        <NuxtLink
          v-else
          :to="lien(element)"
          :aria-label="`Page ${element}`"
          class="text-ink underline-offset-3 hover:underline"
        >
          {{ element }}
        </NuxtLink>
      </template>
    </span>

    <span class="text-separateur" aria-hidden="true">·</span>

    <NuxtLink
      v-if="page < totalPages"
      :to="lien(page + 1)"
      rel="next"
      class="text-ink underline-offset-3 hover:underline"
    >
      Suivant
    </NuxtLink>
    <span v-else class="text-muted" aria-hidden="true">Suivant</span>
  </nav>
</template>
