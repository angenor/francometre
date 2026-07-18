<script setup lang="ts">
/**
 * Le pied de page.
 *
 * Aucun paramètre : son contenu est identique sur toutes les pages. Il ferme la
 * colonne de DROITE — la mise en page le place à l'intérieur de la zone de
 * contenu, jamais sous la colonne de navigation (FR-039).
 *
 * Il présente la marque et sa signature, le rappel des huit rubriques, les
 * liens d'information et les liens à suivre (FR-040). Les rubriques viennent de
 * `RUBRIQUES`, définition unique du projet : leurs destinations sont donc, par
 * construction, celles de la colonne de navigation (FR-041).
 *
 * Le mot-symbole est servi par les DEUX seules ressources de marque du projet,
 * celles-là mêmes qu'emploie la colonne, à une autre taille (FR-042). Aucune
 * déclinaison « bloc » : les références des maquettes à `wordmark-bloc-*.png`
 * sont sans objet (FR-042a). Le basculement se fait par la variante `dark:`,
 * jamais par un `v-if` sur le thème — une condition évaluée en JavaScript
 * produirait exactement le flash que FR-015 interdit.
 */

/**
 * Liens d'information. Fondations ne livre aucune de ces pages (FR-049) : la
 * destination reste celle des maquettes en attendant les features de contenu.
 */
const informations = [
  'Mentions légales',
  'Confidentialité',
  'Conditions d’utilisation',
  'Cookies',
  'Contact',
] as const

/** Liens à suivre — mêmes réserves sur les destinations. */
const reseaux = ['X', 'Instagram', 'LinkedIn', 'YouTube', 'Flux RSS'] as const
</script>

<template>
  <footer
    data-testid="pied"
    class="mx-auto w-full max-w-contenu"
  >
    <!-- 1. La marque et sa signature -->
    <div class="pt-13 pb-2">
      <NuxtLink
        to="/"
        data-role="mot-symbole"
        class="inline-block"
      >
        <!--
          Les deux ressources sont détourées : le dessin occupe toute la
          hauteur du fichier. Aucun cadrage, aucun décalage à rattraper — le
          mot-symbole se dimensionne comme n'importe quelle image. Largeur du
          pied de page relevée dans `docs/design/html/accueil.html:116`.
        -->
        <img
          src="/brand/NOIR.png"
          alt="Francomètre — accueil"
          class="block h-auto w-75 dark:hidden"
        >
        <img
          src="/brand/BLANC.png"
          alt="Francomètre — accueil"
          class="hidden h-auto w-75 dark:block"
        >
      </NuxtLink>
      <p class="mt-1 text-saisie text-muted">
        L’actualité, mesurée.
      </p>
    </div>

    <!-- 2. Filet ordinaire — la coupe à 3,5° n'a que deux porteurs, et ce n'est
         pas ici (FR-037). -->
    <div class="mt-5 border-t border-line" />

    <!-- 3. Les trois groupes — 2fr 1fr 1fr au-dessus du socle, empilés dessous -->
    <div class="grid grid-cols-1 gap-x-6 gap-y-10 pt-9 socle:grid-cols-[2fr_1fr_1fr]">
      <div class="min-w-0">
        <h3 class="mb-5 font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-muted uppercase">
          Rubriques
        </h3>
        <!-- Les huit rubriques, dans l'ordre invariable de `RUBRIQUES`. -->
        <div
          data-testid="rubriques"
          class="grid grid-cols-1 gap-x-6 gap-y-3 socle:grid-cols-2"
        >
          <NuxtLink
            v-for="rubrique in RUBRIQUES"
            :key="rubrique.id"
            :to="rubrique.chemin"
            class="text-interface text-muted transition-colors duration-(--transition-survol) hover:text-ink"
          >
            {{ rubrique.libelle }}
          </NuxtLink>
        </div>
      </div>

      <div class="min-w-0">
        <h3 class="mb-5 font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-muted uppercase">
          Informations
        </h3>
        <div class="flex flex-col gap-3">
          <a
            v-for="information in informations"
            :key="information"
            href="#"
            class="text-interface text-muted transition-colors duration-(--transition-survol) hover:text-ink"
          >
            {{ information }}
          </a>
        </div>
      </div>

      <div class="min-w-0">
        <h3 class="mb-5 font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-muted uppercase">
          Suivre
        </h3>
        <div class="flex flex-col gap-3">
          <a
            v-for="reseau in reseaux"
            :key="reseau"
            href="#"
            class="text-interface text-muted transition-colors duration-(--transition-survol) hover:text-ink"
          >
            {{ reseau }}
          </a>
        </div>
      </div>
    </div>

    <!-- 4. La ligne légale, séparée d'un filet supérieur -->
    <div
      class="mt-11 flex flex-col gap-3 border-t border-line pt-5 pb-10 text-meta text-muted socle:flex-row socle:items-center socle:justify-between"
    >
      <span>© 2026 Francomètre — francometre.com</span>
      <span>Édité à Paris</span>
    </div>
  </footer>
</template>
