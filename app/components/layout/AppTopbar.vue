<script setup lang="ts">
/**
 * La barre supérieure de petit écran.
 *
 * Sous le point de rupture du socle, la colonne de navigation n'est pas rendue
 * et cette barre prend sa place (FR-019, FR-020). Elle ne la résume pas : elle
 * porte TROIS choses et rien d'autre — la marque, l'ouverture du menu, la
 * bascule de thème. Les huit rubriques et la recherche vivent dans le panneau,
 * qui est le vrai équivalent de la colonne.
 *
 * C'est la barre qui détient l'état d'ouverture, parce que c'est elle qui
 * détient le bouton : à la fermeture, le focus doit revenir à ce bouton précis
 * (FR-022). Le panneau signale seulement qu'il veut se fermer ; la conclusion —
 * refermer, puis rendre le focus — appartient à celui qui a ouvert.
 */
withDefaults(defineProps<{ rubriqueCourante?: RubriqueId | null }>(), { rubriqueCourante: null })

const ouvert = ref(false)
const bouton = ref<HTMLButtonElement | null>(null)

/** L'identifiant que `aria-controls` désigne — le panneau le reçoit tel quel. */
const idPanneau = useId()

async function fermer() {
  if (!ouvert.value) return
  ouvert.value = false
  // Le panneau vient d'être masqué : le focus s'y trouvait, il est retombé sur
  // le document. On attend la mise à jour du DOM avant de le rendre au bouton.
  await nextTick()
  bouton.value?.focus()
}

function basculer() {
  if (ouvert.value) void fermer()
  else ouvert.value = true
}
</script>

<template>
  <header
    data-testid="barre"
    class="flex items-center justify-between gap-4 border-b border-line py-3 socle:hidden"
  >
    <!--
      Le mot-symbole en deux exemplaires, l'un pour chaque thème, permutés par
      la seule CSS. Un `v-if` sur le thème produirait le flash que FR-015
      interdit : la classe de thème est posée avant la première peinture, une
      condition JavaScript arriverait toujours après.
    -->
    <NuxtLink
      to="/"
      data-testid="marque"
      data-role="mot-symbole"
      class="flex shrink-0 items-center"
    >
      <img
        src="/brand/NOIR.png"
        alt="Francomètre — accueil"
        class="block h-7.5 w-auto dark:hidden"
      >
      <img
        src="/brand/BLANC.png"
        alt="Francomètre — accueil"
        class="hidden h-7.5 w-auto dark:block"
      >
    </NuxtLink>

    <div class="flex shrink-0 items-center gap-5">
      <button
        ref="bouton"
        type="button"
        data-testid="menu-bouton"
        :aria-expanded="ouvert"
        :aria-controls="idPanneau"
        class="flex cursor-pointer items-center gap-2.5 text-ink"
        @click="basculer"
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
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        <span class="text-interface text-muted">Menu</span>
      </button>

      <ThemeToggle :libelle="false" data-testid="bascule-theme" />
    </div>

    <AppMenuPanel
      :id="idPanneau"
      :ouvert="ouvert"
      :rubrique-courante="rubriqueCourante"
      @fermeture="fermer"
    />
  </header>
</template>
