<script setup lang="ts">
/**
 * Le panneau de menu de petit écran.
 *
 * Sous le point de rupture du socle, la colonne de navigation n'est pas rendue :
 * ce panneau la remplace. Il présente EXACTEMENT la même liste — même ordre,
 * mêmes pictogrammes, même signalement de la rubrique courante (FR-021) — parce
 * qu'il consomme la même source, `RUBRIQUES`, qu'il ne redéclare pas.
 *
 * Ce comportement n'est dessiné dans aucune maquette. Il est CONÇU ici, une
 * seule fois, dans le vocabulaire déjà posé par le rail : pictogramme à gauche,
 * libellé à droite, filet de 1 px, aucun arrondi, aucune ombre, aucune
 * diagonale (constitution, principe V).
 *
 * Le panneau est une fenêtre modale au sens propre : tant qu'il est ouvert, le
 * focus ne peut pas en sortir, la touche d'échappement le referme, et à la
 * fermeture le focus revient au bouton qui l'a ouvert. Le panneau ne referme
 * pas lui-même : il émet `fermeture` et c'est la barre — qui détient l'état et
 * le bouton — qui conclut (FR-022).
 */
const props = withDefaults(
  defineProps<{
    ouvert?: boolean
    rubriqueCourante?: RubriqueId | null
  }>(),
  { ouvert: false, rubriqueCourante: null },
)

const emit = defineEmits<{ fermeture: [] }>()

const panneau = ref<HTMLElement | null>(null)
const boutonFermer = ref<HTMLButtonElement | null>(null)

/* -------------------------------------------------------------------------
   Piège à focus
   ---------------------------------------------------------------------- */

/** Ce que le piège considère comme atteignable au clavier dans le panneau. */
const SELECTEUR_ATTEIGNABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

function atteignables(): HTMLElement[] {
  if (!panneau.value) return []
  return Array.from(panneau.value.querySelectorAll<HTMLElement>(SELECTEUR_ATTEIGNABLE))
}

/**
 * L'écouteur est posé sur la fenêtre, non sur le panneau : si le focus s'est
 * égaré au-dehors — au `body`, par exemple, après un clic dans le vide — un
 * écouteur local ne verrait jamais la touche et le piège serait sans effet.
 */
function surTouche(evenement: KeyboardEvent) {
  if (!props.ouvert) return

  if (evenement.key === 'Escape') {
    evenement.preventDefault()
    emit('fermeture')
    return
  }

  if (evenement.key !== 'Tab') return

  const cibles = atteignables()
  if (cibles.length === 0) return

  const premier = cibles[0]!
  const dernier = cibles[cibles.length - 1]!
  const actif = document.activeElement

  // Focus échappé : on le ramène dans le panneau plutôt que de le laisser filer.
  if (!(actif instanceof HTMLElement) || !panneau.value?.contains(actif)) {
    evenement.preventDefault()
    premier.focus()
    return
  }

  if (evenement.shiftKey && actif === premier) {
    evenement.preventDefault()
    dernier.focus()
  }
  else if (!evenement.shiftKey && actif === dernier) {
    evenement.preventDefault()
    premier.focus()
  }
}

/* -------------------------------------------------------------------------
   Franchissement du point de rupture
   ---------------------------------------------------------------------- */

/**
 * Au-dessus du point de rupture, le panneau ne subsiste pas.
 *
 * Le seuil n'est PAS recopié ici. La classe `socle:hidden` posée sur la racine
 * le porte déjà, et `main.css` en est la source unique : on observe donc son
 * EFFET — la racine cesse d'être affichée — plutôt que d'écrire une seconde
 * fois « 1000 px » dans un script, où il deviendrait un nombre magique
 * silencieusement désaccordé le jour où le seuil bouge (principe II).
 */
function surRedimensionnement() {
  if (!props.ouvert || !panneau.value) return
  if (getComputedStyle(panneau.value).display === 'none') emit('fermeture')
}

/* -------------------------------------------------------------------------
   Cycle de vie
   ---------------------------------------------------------------------- */

/** Le panneau couvre la fenêtre : le fond ne défile pas derrière lui. */
function verrouillerDefilement(actif: boolean) {
  document.documentElement.style.overflow = actif ? 'hidden' : ''
}

watch(
  () => props.ouvert,
  async (ouvert) => {
    if (!import.meta.client) return
    verrouillerDefilement(ouvert)
    if (!ouvert) return
    // À l'ouverture, le focus entre dans le panneau — sans quoi la première
    // tabulation le ferait sortir avant même que le piège ne s'applique.
    await nextTick()
    boutonFermer.value?.focus()
  },
)

// `window` n'existe pas au rendu serveur : on ne l'approche qu'une fois monté.
onMounted(() => {
  window.addEventListener('keydown', surTouche)
  window.addEventListener('resize', surRedimensionnement)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', surTouche)
  window.removeEventListener('resize', surRedimensionnement)
  verrouillerDefilement(false)
})
</script>

<template>
  <div
    v-show="ouvert"
    ref="panneau"
    data-testid="menu-panneau"
    class="fixed inset-0 z-50 flex flex-col bg-paper socle:hidden"
    role="dialog"
    aria-modal="true"
    aria-label="Menu"
  >
    <!-- Fermeture : un contrôle VISIBLE, en plus de la touche d'échappement. -->
    <div
      class="flex shrink-0 items-center justify-end border-b border-line px-(--gouttiere-mobile) py-3"
    >
      <button
        ref="boutonFermer"
        type="button"
        data-testid="menu-fermer"
        class="flex cursor-pointer items-center gap-2.5 text-ink"
        @click="emit('fermeture')"
      >
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          class="shrink-0"
          aria-hidden="true"
        >
          <path d="M6 6 18 18M18 6 6 18" />
        </svg>
        <span class="text-interface text-muted">Fermer</span>
      </button>
    </div>

    <!--
      La même liste que la colonne, dans le même ordre, depuis la même source.
      Le libellé vit dans son propre `span` : c'est lui, et non le lien entier,
      que souligne le signalement de la rubrique courante.

      Le signalement est celui de la colonne, au pixel près (FR-021) : filet de
      2 px en accent, décollé de 3 px — `pb-0.75`, comme `AppRail`. La maquette
      pose ce 3 px (`accueil.html`, `.nav a[aria-current="page"] span`) ; il
      n'est pas sur la base 4, mais l'échelle le sait exprimer, et un 4 px
      « arrondi » ferait diverger deux rendus du MÊME signalement.
    -->
    <nav
      aria-label="Rubriques"
      data-testid="rubriques"
      class="flex min-h-0 flex-1 flex-col overflow-y-auto px-(--gouttiere-mobile) py-6"
    >
      <NuxtLink
        v-for="rubrique in RUBRIQUES"
        :key="rubrique.id"
        :to="rubrique.chemin"
        :aria-current="rubrique.id === rubriqueCourante ? 'page' : undefined"
        class="group flex items-center gap-3 py-2 font-corps text-saisie font-moyenne text-ink"
      >
        <RubriqueIcon :rubrique="rubrique.id" />
        <span
          class="decoration-(length:--filet) underline-offset-(length:--base) group-hover:underline"
          :class="
            rubrique.id === rubriqueCourante
              ? 'border-b-(length:--filet-actif) border-accent pb-0.75'
              : ''
          "
        >{{ rubrique.libelle }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>
