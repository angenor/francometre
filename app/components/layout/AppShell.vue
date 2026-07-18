<script setup lang="ts">
/**
 * Le cadre — la charpente que toute page réutilise sans la redéclarer.
 *
 * Centré, borné à 1440 px, cerné d'un filet de 1 px (FR-001). Il contient
 * exactement DEUX zones côte à côte et de même hauteur (FR-002) : la colonne
 * de navigation à gauche, le contenu à droite.
 *
 * Au-delà du point de rupture du socle (1000 px), la colonne est affichée en
 * permanence ; en dessous elle n'est pas rendue du tout et cède la place à la
 * barre supérieure, que la mise en page place en tête du contenu (FR-019,
 * FR-020, FR-023).
 *
 * Le cadre n'est pas paramétrable : il n'a aucun paramètre, délibérément.
 */
</script>

<template>
  <div
    data-testid="cadre"
    class="mx-auto flex min-h-screen w-full max-w-conteneur items-stretch border border-line bg-paper"
  >
    <!-- Colonne de navigation — permanente à partir de 1000 px, absente en dessous. -->
    <div class="hidden shrink-0 socle:block">
      <slot name="navigation" />
    </div>

    <!--
      Zone de contenu. La gouttière vaut 20 px sous le point de rupture et
      24 px au-dessus (`tokens.md` §3 et §6, FR-009).
    -->
    <div
      data-testid="colonne-contenu"
      class="flex min-w-0 flex-1 flex-col px-(--gouttiere-mobile) socle:px-(--gouttiere)"
    >
      <slot />
    </div>
  </div>
</template>
