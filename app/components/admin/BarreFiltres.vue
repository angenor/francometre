<script setup lang="ts">
/**
 * La barre de filtres de la liste (structure de `back-office-articles.html`).
 *
 * Trois filtres CUMULABLES : recherche par titre, rubrique (les huit +
 * « Toutes »), statut (Tous / Brouillon / Publié). Le composant est CONTRÔLÉ —
 * il reçoit l'état courant en props (issus des `query`) et émet `update` ; la
 * page écrit les `query` et remet `page=1` (edge case du spec : changer un
 * filtre repart à la première page).
 *
 * La recherche est débouncée pour ne pas relancer une requête à chaque frappe ;
 * les sélecteurs s'appliquent au changement. Aucun `outline:none` : le repère de
 * focus global (main.css) s'applique sur l'entrée et les sélecteurs (principe VIII,
 * contre les maquettes).
 */
const props = defineProps<{
  q?: string
  rubriqueId?: string
  statut?: 'brouillon' | 'publie'
}>()

const emit = defineEmits<{
  update: [filtres: { q?: string, rubriqueId?: string, statut?: string }]
}>()

const q = ref(props.q ?? '')
const rubriqueId = ref(props.rubriqueId ?? '')
const statut = ref(props.statut ?? '')

// Resynchronisation si la page modifie les `query` d'ailleurs (navigation
// arrière, effacement) : les champs suivent l'état réel de l'URL.
watch(
  () => [props.q, props.rubriqueId, props.statut] as const,
  ([nq, nr, ns]) => {
    q.value = nq ?? ''
    rubriqueId.value = nr ?? ''
    statut.value = ns ?? ''
  },
)

function appliquer() {
  emit('update', {
    q: q.value.trim() || undefined,
    rubriqueId: rubriqueId.value || undefined,
    statut: statut.value || undefined,
  })
}

// Débounce de la recherche (~300 ms d'inactivité).
let minuteur: ReturnType<typeof setTimeout> | undefined
function surRecherche() {
  clearTimeout(minuteur)
  minuteur = setTimeout(appliquer, 300)
}
onBeforeUnmount(() => clearTimeout(minuteur))
</script>

<template>
  <div class="flex flex-col gap-5 socle:flex-row socle:items-end socle:gap-7">
    <!-- Recherche -->
    <div class="flex flex-1 items-center gap-2.5 border-b border-line py-2.25">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        class="shrink-0 text-muted"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="16.5" y1="16.5" x2="21" y2="21" />
      </svg>
      <input
        v-model="q"
        type="search"
        aria-label="Rechercher un article"
        placeholder="Rechercher un article"
        class="w-full bg-transparent text-saisie-admin text-ink placeholder:text-muted"
        @input="surRecherche"
        @keydown.enter.prevent="appliquer"
      >
    </div>

    <!-- Rubrique -->
    <label class="block shrink-0 socle:w-[220px]">
      <span class="mb-1.5 block text-label-admin text-muted">Rubrique</span>
      <div class="relative border-b border-line">
        <select
          v-model="rubriqueId"
          class="w-full cursor-pointer appearance-none bg-transparent py-2 pr-6 text-saisie-admin text-ink"
          @change="appliquer"
        >
          <option value="">Toutes les rubriques</option>
          <option v-for="rubrique in RUBRIQUES" :key="rubrique.id" :value="rubrique.id">
            {{ rubrique.libelle }}
          </option>
        </select>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-muted"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </label>

    <!-- Statut -->
    <label class="block shrink-0 socle:w-[180px]">
      <span class="mb-1.5 block text-label-admin text-muted">Statut</span>
      <div class="relative border-b border-line">
        <select
          v-model="statut"
          class="w-full cursor-pointer appearance-none bg-transparent py-2 pr-6 text-saisie-admin text-ink"
          @change="appliquer"
        >
          <option value="">Tous</option>
          <option value="brouillon">Brouillon</option>
          <option value="publie">Publié</option>
        </select>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-muted"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </div>
    </label>
  </div>
</template>
