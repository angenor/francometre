<script setup lang="ts">
/**
 * La colonne de navigation — la charpente de gauche, permanente à partir du
 * point de rupture du socle (FR-003 à FR-007).
 *
 * Ordre imposé, et non négociable : le mot-symbole, l'accès à la recherche,
 * les huit rubriques, puis l'interrupteur de thème poussé en bas de colonne.
 *
 * La liste des rubriques vient de `RUBRIQUES`, définition unique du projet :
 * la colonne la CONSOMME, elle ne la redéclare pas. Une neuvième rubrique
 * s'ajouterait là-bas, et nulle part ailleurs.
 *
 * Si la colonne dépasse la hauteur de la fenêtre, elle défile pour son propre
 * compte (`sticky` + `h-screen` + `overflow-y-auto`) : elle ne recouvre jamais
 * le contenu et l'interrupteur reste atteignable.
 */
withDefaults(
  defineProps<{
    /**
     * Rubrique de la page réellement affichée, ou `null`.
     *
     * `null` ne signale RIEN : `aria-current` désigne la page affichée, il ne
     * se pose jamais par défaut (constitution VIII). Une valeur inconnue ne
     * provoque pas d'erreur et ne signale rien non plus.
     */
    rubriqueCourante?: RubriqueId | null
  }>(),
  { rubriqueCourante: null },
)
</script>

<template>
  <aside
    data-testid="rail"
    class="sticky top-0 flex h-screen w-(--rail) flex-none flex-col justify-between gap-12 overflow-y-auto border-r border-line pt-6.5 pr-7 pb-7.5 pl-7"
  >
    <div>
      <!--
        Le mot-symbole — l'un des deux seuls porteurs de la coupe à 3,5°, qui
        est ici dans le tracé lui-même : aucune transformation ne s'y ajoute.

        Les DEUX déclinaisons de `public/brand/`, superposées et départagées
        par la seule feuille de style (`dark:hidden` / `dark:block`), comme le
        font `AppTopbar` et `AppFooter`. Jamais un rendu conditionnel :
        recalculer le thème au montage produirait précisément le flash que
        FR-015 interdit.
      -->
      <NuxtLink to="/" data-testid="marque" data-role="mot-symbole" class="block">
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

      <SearchEntry class="mt-8.5" />

      <nav aria-label="Rubriques" data-testid="rubriques" class="mt-6 flex flex-col">
        <NuxtLink
          v-for="rubrique in RUBRIQUES"
          :key="rubrique.id"
          :to="rubrique.chemin"
          :aria-current="rubrique.id === rubriqueCourante ? 'page' : undefined"
          class="group flex items-center gap-3 py-2 text-saisie font-moyenne text-ink"
        >
          <RubriqueIcon :rubrique="rubrique.id" />
          <!--
            Le libellé SEUL dans ce `span` : c'est lui qui porte le sens, le
            pictogramme voisin étant masqué aux technologies d'assistance.

            Le soulignement de la rubrique courante est l'UN DES DEUX SEULS
            emplois de l'accent dans tout le socle (principe III).
          -->
          <span
            class="group-hover:underline group-hover:decoration-1 group-hover:underline-offset-2"
            :class="
              rubrique.id === rubriqueCourante
                ? 'border-b-(length:--filet-actif) border-accent pb-0.75'
                : ''
            "
          >{{ rubrique.libelle }}</span>
        </NuxtLink>
      </nav>
    </div>

    <!-- Poussé en bas de colonne par `justify-between`, détaché du reste. -->
    <ThemeToggle data-testid="bascule-theme" />
  </aside>
</template>
