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
 *
 * Deux familles de pictogrammes l'habitent, toutes deux locales et au même
 * trait : ceux des rubriques, déjà portés par la colonne, et ceux des liens à
 * suivre. Ils sont décoratifs — aucun ne remplace un libellé. Aucun accent
 * n'entre ici : le pied de page n'en porte pas dans les maquettes.
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

/**
 * Liens à suivre — mêmes réserves sur les destinations, à une exception : le
 * « Flux RSS » pointe vers la route `/rss.xml` réellement servie (FR-005).
 *
 * Chacun porte un pictogramme de la collection locale `reseau:`, dessiné au
 * trait des pictogrammes de rubrique. Il est décoratif : c'est le libellé
 * voisin qui porte le sens, comme dans la colonne de navigation.
 */
const reseaux = [
  { libelle: 'X', href: '#', icone: 'reseau:x' },
  { libelle: 'Instagram', href: '#', icone: 'reseau:instagram' },
  { libelle: 'LinkedIn', href: '#', icone: 'reseau:linkedin' },
  { libelle: 'YouTube', href: '#', icone: 'reseau:youtube' },
  { libelle: 'Flux RSS', href: '/rss.xml', icone: 'reseau:rss' },
] as const
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
          pied de page relevée dans `docs/design/html/accueil.html:116` ; sous
          le socle elle descend à 224 px, faute de quoi le mot-symbole occupe
          presque toute la gouttière à gouttière d'un écran de 390 px.
        -->
        <img
          src="/brand/NOIR.png"
          alt="Francomètre — accueil"
          class="block h-auto w-56 max-w-full dark:hidden socle:w-75"
        >
        <img
          src="/brand/BLANC.png"
          alt="Francomètre — accueil"
          class="hidden h-auto w-56 max-w-full dark:block socle:w-75"
        >
      </NuxtLink>
      <p class="mt-1 text-saisie text-muted">
        L’actualité, mesurée.
      </p>
    </div>

    <!-- 2. Filet ordinaire — la coupe à 3,5° n'a que deux porteurs, et ce n'est
         pas ici (FR-037). -->
    <div class="mt-5 border-t border-line" />

    <!--
      3. Les trois groupes — 2fr 1fr 1fr au-dessus du socle.

      Sous le socle, ils ne s'empilent PAS en une colonne unique : dix-huit
      liens à la file font un pied de page plus long que la page qu'il ferme, et
      toute la matière se tasse contre la gouttière gauche. La grille reste donc
      à deux colonnes — « Rubriques » en occupe les deux, « Informations » et
      « Suivre » se partagent la suivante. Un seul point de rupture est
      convoqué, `socle` : c'est le seul que le projet documente.
    -->
    <div class="grid grid-cols-2 gap-x-6 gap-y-10 pt-9 socle:grid-cols-[2fr_1fr_1fr]">
      <div class="col-span-2 min-w-0 socle:col-span-1">
        <h3 class="mb-5 font-titre text-eyebrow font-demi-grasse tracking-eyebrow text-muted uppercase">
          Rubriques
        </h3>
        <!--
          Les huit rubriques, dans l'ordre invariable de `RUBRIQUES`, deux
          colonnes à toute largeur : la paire tient dès 390 px, et la colonne
          de navigation qui les porte ailleurs a la même densité.

          Chacune reprend SON pictogramme, celui de la colonne : ces tracés
          « font partie du système », les répéter ici ne coûte aucun actif
          nouveau et rattache le pied de page au reste de la navigation.
        -->
        <div
          data-testid="rubriques"
          class="grid grid-cols-2 gap-x-6 gap-y-3"
        >
          <NuxtLink
            v-for="rubrique in RUBRIQUES"
            :key="rubrique.id"
            :to="rubrique.chemin"
            class="flex items-center gap-2.5 text-interface text-muted transition-colors duration-(--transition-survol) hover:text-ink"
          >
            <RubriqueIcon :rubrique="rubrique.id" />
            <span class="min-w-0">{{ rubrique.libelle }}</span>
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
            :key="reseau.libelle"
            :href="reseau.href"
            class="flex items-center gap-2.5 text-interface text-muted transition-colors duration-(--transition-survol) hover:text-ink"
          >
            <Icon
              :name="reseau.icone"
              class="shrink-0 opacity-55"
              :size="18"
              aria-hidden="true"
            />
            <span class="min-w-0">{{ reseau.libelle }}</span>
          </a>
        </div>
      </div>
    </div>

    <!--
      4. La ligne légale, séparée d'un filet supérieur. La maquette lui adjoint
      un « Édité à Paris » (`docs/design/html/accueil.html:326`) : mention
      retirée du projet, la disposition en deux bords lui survit.
    -->
    <div
      class="mt-11 flex flex-col gap-2 border-t border-line pt-5 pb-10 text-meta text-muted socle:flex-row socle:items-center socle:justify-between socle:gap-6"
    >
      <span>© 2026 Francomètre — francometre.com</span>
    </div>
  </footer>
</template>
