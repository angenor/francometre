<script setup lang="ts">
import type { CompositionUneDTO } from '#shared/types/dto'

/**
 * Écran 3 — Composer la Une (structure de `back-office-composer-la-une.html`).
 *
 * Cinq emplacements 01–05 (01 = héros) à gauche, articles publiables à droite.
 * Réordonnancement au POINTEUR (`@formkit/drag-and-drop`) ET au CLAVIER (flèches
 * Haut/Bas sur la poignée focalisée, annonce `aria-live`, porte 8). L'accueil ne
 * bouge qu'à « Enregistrer la Une » (FR-027) : tant qu'on n'a pas enregistré,
 * l'ordre est local.
 */
definePageMeta({ layout: 'admin' })
useHead({ title: 'À la une — Administration' })

const { data, error } = await useFetch<CompositionUneDTO>('/api/admin/une')
if (error.value || !data.value) {
  throw createError({
    statusCode: 500,
    statusMessage: 'Composition de la Une indisponible',
    fatal: true,
  })
}

const {
  conteneurUne, ordre, publiables, modifie,
  epingler, retirer, monter, descendre, rechercher, enregistrer,
} = useCompositionUne(data.value)

// Recherche débouncée dans les publiables.
const recherche = ref('')
let minuteurRecherche: ReturnType<typeof setTimeout> | undefined
watch(recherche, (q) => {
  clearTimeout(minuteurRecherche)
  minuteurRecherche = setTimeout(() => rechercher(q.trim()), 300)
})
onBeforeUnmount(() => clearTimeout(minuteurRecherche))

// Déplacement clavier : réordonne, annonce, et rend le focus à la poignée qui a
// bougé (pour enchaîner les flèches).
const annonce = ref('')
async function deplacer(index: number, sens: 'haut' | 'bas') {
  const article = ordre.value[index]
  if (!article) return
  if (sens === 'haut') monter(index)
  else descendre(index)
  const nouvelIndex = ordre.value.findIndex((a) => a.id === article.id)
  annonce.value = `« ${article.titre} » déplacé au rang ${nouvelIndex + 1}.`
  await nextTick()
  document.querySelector<HTMLElement>(`[data-poignee="${article.id}"]`)?.focus()
}

async function enregistrerUne() {
  await enregistrer()
  annonce.value = 'La Une est enregistrée.'
}

const rangsLibres = computed(() => {
  const libres: number[] = []
  for (let rang = ordre.value.length + 1; rang <= 5; rang += 1) libres.push(rang)
  return libres
})
</script>

<template>
  <div class="px-(--gouttiere-mobile) py-8 socle:px-10 socle:py-9">
    <div class="flex items-start justify-between gap-6">
      <div class="min-w-0">
        <h1 class="font-titre text-titre-admin leading-nul font-grasse tracking-titre text-ink">
          À la une
        </h1>
        <p class="mt-3 text-meta text-muted">
          L'ordre choisi ici est l'ordre affiché sur la page d'accueil.
        </p>
      </div>
      <AppButton variante="primaire" class="shrink-0" @click="enregistrerUne">
        Enregistrer la Une
      </AppButton>
    </div>

    <div class="mt-9 grid gap-10 socle:grid-cols-[1.5fr_1fr]">
      <!-- Colonne gauche — les cinq emplacements -->
      <div>
        <div class="mb-6 flex items-baseline justify-between border-b border-line pb-3">
          <span class="font-titre text-label-admin font-demi-grasse tracking-eyebrow uppercase text-muted">
            À la une
          </span>
          <span class="text-[12px] text-muted [font-variant-numeric:tabular-nums]">
            {{ ordre.length }} / 5 emplacements
          </span>
        </div>

        <div ref="conteneurUne" class="flex flex-col gap-5">
          <EmplacementUne
            v-for="(article, index) in ordre"
            :key="article.id"
            :article="article"
            :rang="index + 1"
            :hero="index === 0"
            @monter="deplacer(index, 'haut')"
            @descendre="deplacer(index, 'bas')"
            @retirer="retirer(index)"
          />
        </div>
        <div v-if="rangsLibres.length" class="mt-5 flex flex-col gap-5">
          <EmplacementUne
            v-for="rang in rangsLibres"
            :key="`libre-${rang}`"
            :article="null"
            :rang="rang"
            :hero="false"
          />
        </div>
      </div>

      <!-- Colonne droite — articles publiables -->
      <div>
        <div class="mb-4 border-b border-line pb-3">
          <span class="font-titre text-label-admin font-demi-grasse tracking-eyebrow uppercase text-muted">
            Articles publiés
          </span>
        </div>

        <div class="mb-1.5 flex items-center gap-2.5 border-b border-line py-2.25">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="shrink-0 text-muted" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="16.5" y1="16.5" x2="21" y2="21" />
          </svg>
          <input
            v-model="recherche"
            type="search"
            aria-label="Rechercher un article publié"
            placeholder="Rechercher un article"
            class="w-full bg-transparent text-saisie-admin text-ink placeholder:text-muted"
          >
        </div>

        <LigneArticlePublie
          v-for="article in publiables"
          :key="article.id"
          :article="article"
          @epingler="epingler(article)"
        />
        <p v-if="publiables.length === 0" class="py-8 text-center text-meta text-muted">
          Aucun article publié à épingler.
        </p>
      </div>
    </div>

    <div aria-live="polite" class="sr-only">{{ annonce }}</div>
  </div>
</template>
