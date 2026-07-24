<script setup lang="ts">
import type { LigneArticleAdmin, ListeAdminDTO } from '#shared/types/dto'

/**
 * Écran 1 — Liste des articles (structure de `back-office-articles.html`).
 *
 * Table dense de TOUS les articles, brouillons compris (chemin d'administration,
 * gardé). Filtres cumulables et pagination passent par les `query` de l'URL :
 * la lecture est ainsi partageable, rejouable, et le rendu SSR reprend côté
 * client sans état caché.
 *
 * La suppression demande CONFIRMATION (US5) : `LigneTableArticle` émet
 * l'intention, la page ouvre le dialogue, puis `DELETE` (la route retire de la
 * Une au passage si nécessaire — aucun emplacement orphelin sur l'accueil).
 */
definePageMeta({ layout: 'admin' })
useHead({ title: 'Articles — Administration' })

const route = useRoute()

/** Les filtres courants, lus des `query` (toujours des chaînes). */
function premier(valeur: unknown): string | undefined {
  const v = Array.isArray(valeur) ? valeur[0] : valeur
  return typeof v === 'string' && v !== '' ? v : undefined
}
const qCourant = computed(() => premier(route.query.q))
const rubriqueCourante = computed(() => premier(route.query.rubriqueId))
const statutCourant = computed(
  () => premier(route.query.statut) as 'brouillon' | 'publie' | undefined,
)

// La liste suit les `query` : `useFetch` refait la requête à chaque changement.
const { data, refresh } = await useFetch<ListeAdminDTO>('/api/admin/articles', {
  query: computed(() => route.query),
})

// — Suppression avec confirmation (US5) —
const articleASupprimer = ref<LigneArticleAdmin | null>(null)
const suppressionEnCours = ref(false)

function demanderSuppression(ligne: LigneArticleAdmin) {
  articleASupprimer.value = ligne
}

async function confirmerSuppression() {
  const ligne = articleASupprimer.value
  if (!ligne || suppressionEnCours.value) return
  suppressionEnCours.value = true
  try {
    await $fetch(`/api/admin/articles/${ligne.id}`, { method: 'DELETE' })
    articleASupprimer.value = null
    await refresh()
  }
  catch (erreur) {
    if ((erreur as { statusCode?: number })?.statusCode === 401) {
      await navigateTo('/connexion?retour=' + encodeURIComponent('/admin/articles'))
    }
    // Sinon on laisse le dialogue ouvert ; l'article n'a pas été supprimé.
  }
  finally {
    suppressionEnCours.value = false
  }
}

/** Un filtre change : on repart à la page 1 (les `query` sans `page`). */
function surFiltres(filtres: { q?: string, rubriqueId?: string, statut?: string }) {
  const query: Record<string, string> = {}
  if (filtres.q) query.q = filtres.q
  if (filtres.rubriqueId) query.rubriqueId = filtres.rubriqueId
  if (filtres.statut) query.statut = filtres.statut
  navigateTo({ path: '/admin/articles', query })
}
</script>

<template>
  <div class="px-(--gouttiere-mobile) py-8 socle:px-12 socle:py-10 socle:pb-14">
    <div class="flex items-center justify-between gap-6">
      <h1 class="font-titre text-titre-admin leading-nul font-grasse tracking-titre text-ink">
        Articles
      </h1>
      <AppButton variante="primaire" @click="navigateTo('/admin/articles/nouveau')">
        Nouvel article
      </AppButton>
    </div>

    <div class="mt-9">
      <BarreFiltres
        :q="qCourant"
        :rubrique-id="rubriqueCourante"
        :statut="statutCourant"
        @update="surFiltres"
      />
    </div>

    <!-- Table dense : elle défile dans son propre conteneur sous petit écran
         (D14), jamais la page. -->
    <div class="mt-10 overflow-x-auto" data-testid="table-articles">
      <div
        class="grid grid-cols-[64px_minmax(0,1fr)_148px_110px_78px_132px_150px] items-center gap-5 border-b border-line pb-3 font-titre text-label-admin font-demi-grasse tracking-eyebrow uppercase text-muted"
      >
        <div aria-hidden="true" />
        <div>Titre</div>
        <div>Rubrique</div>
        <div>Statut</div>
        <div>À la une</div>
        <div>Date</div>
        <div class="text-right">Actions</div>
      </div>

      <div v-if="data && data.articles.length > 0">
        <LigneTableArticle
          v-for="ligne in data.articles"
          :key="ligne.id"
          :ligne="ligne"
          @supprimer="demanderSuppression"
        />
      </div>
    </div>

    <!-- État vide (FR-010) : filtres sans résultat. Sobre, sans accent. -->
    <div v-if="data && data.articles.length === 0" data-testid="etat-vide" class="py-24 text-center">
      <p class="text-corps-courant leading-corps-serre text-muted">
        Aucun article ne correspond.
      </p>
      <p class="mt-3 text-meta text-muted">
        Modifiez les filtres, ou créez un nouvel article.
      </p>
    </div>

    <Pagination
      v-if="data"
      :page="data.page"
      :total-pages="data.totalPages"
      class="mt-10"
    />

    <DialogueConfirmation
      :ouvert="articleASupprimer !== null"
      titre="Supprimer cet article ?"
      :message="articleASupprimer
        ? `« ${articleASupprimer.titre} » sera supprimé définitivement. Cette action est irréversible.`
        : ''"
      libelle-confirmer="Supprimer"
      @confirmer="confirmerSuppression"
      @annuler="articleASupprimer = null"
    />
  </div>
</template>

