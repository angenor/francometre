<script setup lang="ts">
/**
 * Le rail d'administration — colonne latérale de 240 px (principe I : jamais un
 * en-tête horizontal). Distinct du rail public (248 px, recherche, huit
 * rubriques) mais taillé dans les mêmes tokens.
 *
 * Structure des trois `.html` de back-office : le mot-symbole enveloppé d'un
 * lien vers l'accueil (porte 8), les liens « Articles / À la une / Médias »
 * (source unique `NAV_ADMIN`), la « Déconnexion » poussée en bas de colonne.
 *
 * L'entrée active porte `aria-current="page"`, un filet gauche d'accent ET un
 * fond `--surface` — la SEULE exception d'accent en fond admise (principe III,
 * porte 4). Les valeurs de cote (240 px, 3 px de filet, 21 px) proviennent des
 * maquettes, qui font foi pour la structure.
 */
defineProps<{ courant: 'articles' | 'une' | 'medias' }>()

const { seDeconnecter } = useDeconnexion()
</script>

<template>
  <aside
    data-testid="rail-admin"
    class="flex h-full w-(--rail-admin) flex-col justify-between pt-6.5 pb-7.5"
  >
    <div>
      <!-- Les DEUX déclinaisons de `public/brand/`, permutées par la seule CSS
           (jamais un rendu conditionnel : il produirait le flash proscrit). -->
      <NuxtLink to="/" data-testid="marque" class="mx-6 block w-fit">
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

      <nav aria-label="Administration" class="mt-10 flex flex-col">
        <NuxtLink
          v-for="entree in NAV_ADMIN"
          :key="entree.cle"
          :to="entree.chemin"
          :aria-current="entree.cle === courant ? 'page' : undefined"
          class="border-l-[3px] py-3 pr-6 text-saisie-admin text-ink hover:underline hover:underline-offset-2"
          :class="entree.cle === courant
            ? 'border-accent bg-surface pl-[21px] font-demi-grasse'
            : 'border-transparent pl-6 font-moyenne'"
        >
          {{ entree.libelle }}
        </NuxtLink>
      </nav>
    </div>

    <!-- Une ACTION (POST de déconnexion), pas une navigation : un vrai bouton. -->
    <button
      type="button"
      class="mx-6 w-fit cursor-pointer text-left text-interface font-moyenne text-muted hover:text-ink"
      @click="seDeconnecter"
    >
      Déconnexion
    </button>
  </aside>
</template>
