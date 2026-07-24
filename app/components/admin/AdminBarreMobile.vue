<script setup lang="ts">
/**
 * La barre d'administration de petit écran (décision Fondations, D14).
 *
 * Sous 1000 px, le rail latéral n'est pas rendu : cette barre minimale prend sa
 * place — le mot-symbole (lien vers l'accueil), un bouton de menu, la bascule de
 * thème, rien d'autre. Le menu révèle la même liste d'administration (source
 * unique `NAV_ADMIN`) ; il se referme au clavier (Échap), au clic sur le bouton,
 * et dès qu'on change de page.
 *
 * Le bouton expose son état (`aria-expanded`) et l'élément qu'il commande
 * (`aria-controls`), condition d'un menu accessible (porte 8).
 */
defineProps<{ courant: 'articles' | 'une' | 'medias' }>()

const { seDeconnecter } = useDeconnexion()
const route = useRoute()

const ouvert = ref(false)
const idPanneau = useId()

// Le menu ne subsiste pas à la navigation : changer de page le referme.
watch(() => route.fullPath, () => {
  ouvert.value = false
})

function surTouche(evenement: KeyboardEvent) {
  if (evenement.key === 'Escape' && ouvert.value) ouvert.value = false
}
onMounted(() => window.addEventListener('keydown', surTouche))
onBeforeUnmount(() => window.removeEventListener('keydown', surTouche))
</script>

<template>
  <div class="socle:hidden">
    <header
      class="flex items-center justify-between gap-4 border-b border-line px-(--gouttiere-mobile) py-3"
    >
      <NuxtLink to="/" data-testid="marque" class="flex shrink-0 items-center">
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
          type="button"
          data-testid="menu-admin-bouton"
          :aria-expanded="ouvert"
          :aria-controls="idPanneau"
          class="flex cursor-pointer items-center gap-2.5 text-ink"
          @click="ouvert = !ouvert"
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
    </header>

    <nav
      v-show="ouvert"
      :id="idPanneau"
      aria-label="Administration"
      class="flex flex-col border-b border-line px-(--gouttiere-mobile) py-2"
    >
      <NuxtLink
        v-for="entree in NAV_ADMIN"
        :key="entree.cle"
        :to="entree.chemin"
        :aria-current="entree.cle === courant ? 'page' : undefined"
        class="border-l-[3px] py-3 pl-4 text-saisie-admin text-ink"
        :class="entree.cle === courant
          ? 'border-accent bg-surface font-demi-grasse'
          : 'border-transparent font-moyenne'"
      >
        {{ entree.libelle }}
      </NuxtLink>
      <button
        type="button"
        class="mt-1 cursor-pointer py-3 pl-4 text-left text-interface font-moyenne text-muted hover:text-ink"
        @click="seDeconnecter"
      >
        Déconnexion
      </button>
    </nav>
  </div>
</template>
