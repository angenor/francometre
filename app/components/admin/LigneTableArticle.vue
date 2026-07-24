<script setup lang="ts">
import type { LigneArticleAdmin } from '#shared/types/dto'

/**
 * Une ligne de la table « Articles » — DÉRIVÉ 3, hors du composant Card
 * (arbitrage 2). Dimensions fixes des maquettes : grille de sept colonnes,
 * vignette 64×36 en `background-image`. Aucun `aspect-ratio`.
 *
 * L'état est rendu EN UN MOT, sans pastille (« Publié » / « Brouillon ») ; le
 * rang à la une porte l'accent (`01`…`05`), « — » sinon. La vignette est
 * PRÉSENTATIONNELLE : le titre, dans sa colonne, porte le sens.
 *
 * « Supprimer » n'agit pas ici : la ligne émet l'intention, la page décide (elle
 * ouvre la confirmation, US5). « Modifier » mène à l'éditeur.
 */
const props = defineProps<{ ligne: LigneArticleAdmin }>()

const emit = defineEmits<{ supprimer: [ligne: LigneArticleAdmin] }>()

const rang = computed(() =>
  props.ligne.rangUne ? String(props.ligne.rangUne).padStart(2, '0') : '—',
)
const etat = computed(() => (props.ligne.statut === 'publie' ? 'Publié' : 'Brouillon'))
const dateCourte = computed(() => dateCourteFr(props.ligne.date))
</script>

<template>
  <div
    class="grid grid-cols-[64px_minmax(0,1fr)_148px_110px_78px_132px_150px] items-center gap-5 border-b border-line py-3.5 hover:bg-surface"
  >
    <!-- Vignette 64×36 — décorative (fond `--surface` en l'absence de couverture). -->
    <div
      class="h-9 w-16 shrink-0 bg-surface bg-cover bg-center"
      :style="ligne.image ? { backgroundImage: `url('${ligne.image}')` } : undefined"
    />

    <div
      class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-saisie-admin font-moyenne text-ink"
    >
      {{ ligne.titre }}
    </div>

    <div class="text-interface text-muted">{{ ligne.rubrique.libelle }}</div>

    <div
      class="font-titre text-label-admin font-demi-grasse tracking-[0.08em] uppercase"
      :class="ligne.statut === 'publie' ? 'text-ink' : 'text-muted'"
    >
      {{ etat }}
    </div>

    <div
      class="font-titre text-saisie-admin font-demi-grasse [font-variant-numeric:tabular-nums]"
      :class="ligne.rangUne ? 'text-accent' : 'text-muted'"
    >
      {{ rang }}
    </div>

    <div class="text-interface text-muted [font-variant-numeric:tabular-nums]">
      {{ dateCourte }}
    </div>

    <div class="flex justify-end gap-4 text-meta">
      <NuxtLink
        :to="`/admin/articles/${ligne.id}`"
        class="text-ink underline underline-offset-2"
      >
        Modifier
      </NuxtLink>
      <button
        type="button"
        class="cursor-pointer text-muted underline underline-offset-2 hover:text-ink"
        @click="emit('supprimer', ligne)"
      >
        Supprimer
      </button>
    </div>
  </div>
</template>
