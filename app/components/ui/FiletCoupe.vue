<script setup lang="ts">
/**
 * Le filet coupé — séparateur signature, et seul ornement du site.
 *
 * Un filet de 1 px qui se brise UNE SEULE FOIS, à 3,5° : 4 px de dénivelé pour
 * 64 px parcourus (`--coupe-denivele` / `--coupe-parcours`). Avec le
 * mot-symbole, il est l'un des deux — et seulement deux — porteurs de la coupe
 * dans tout le système (FR-033, FR-034). Une troisième occurrence ferait de la
 * signature un tic.
 *
 * La brisure est tracée en SVG, non par une bordure inclinée en CSS : l'angle
 * d'une bordure dépendrait de la largeur rendue du conteneur, alors qu'un
 * segment de 64 × 4 dans un `viewBox` fixe garantit la cote exacte quelle que
 * soit la place disponible.
 *
 * Décoratif : `aria-hidden` (FR-036). Il ne porte aucun sens qu'un lecteur
 * d'écran doive restituer — le sens est dans les en-têtes qu'il sépare.
 *
 * Emploi (FR-037) : entre deux blocs dont CHACUN porte son propre en-tête.
 * Partout ailleurs — titre → grille, grille → pagination, sous un champ —
 * c'est le filet ordinaire qui s'applique, pas ce composant.
 */
const props = withDefaults(defineProps<{ position?: number }>(), { position: 66 })

/**
 * Position de la brisure, en pourcentage de la largeur. Bornée à [0 ; 100] pour
 * qu'un appel fautif ne projette pas la brisure loin hors du filet.
 *
 * Cette borne ne suffit pas à la garder entièrement DANS le filet : la boîte de
 * brisure occupe `--coupe-parcours` après `--pos`, si bien que le dernier
 * emplacement pleinement contenu est `100% - --coupe-parcours` — une valeur qui
 * dépend de la largeur rendue, donc inconnue ici. À 100 %, la diagonale déborde
 * de 64 px et le segment droit se réduit à rien (mesuré). Les positions
 * employées restent très en deçà ; si un jour il en fallait une près du bord,
 * c'est `left: min(var(--pos), 100% - var(--coupe-parcours))` qu'il faudrait
 * poser sur la diagonale ET sur la largeur du segment gauche.
 *
 * Elle voyage par variable CSS parce que les trois pièces du filet en
 * dépendent — c'est une géométrie, pas une couleur : les couleurs, elles,
 * restent exclusivement dans les utilitaires.
 */
const pos = computed(() => `${Math.min(100, Math.max(0, props.position))}%`)
</script>

<template>
  <!--
    Hauteur du filet : le dénivelé de la coupe plus l'épaisseur du trait, soit
    la boîte qu'il faut pour contenir la brisure entière.
  -->
  <div
    data-testid="filet"
    aria-hidden="true"
    class="relative h-[calc(var(--coupe-denivele)_+_var(--filet))] w-full text-line"
    :style="{ '--pos': pos }"
  >
    <!-- Segment gauche : part du bord, s'arrête à la brisure, au niveau bas. -->
    <span
      data-role="segment"
      class="absolute left-0 top-(--coupe-denivele) h-(--filet) w-(--pos) bg-current"
    />

    <!-- La brisure — l'unique diagonale du filet. -->
    <span
      data-role="diagonale"
      class="absolute top-0 left-(--pos) h-[calc(var(--coupe-denivele)_+_var(--filet))] w-(--coupe-parcours)"
    >
      <!--
        Le tracé occupe toute la boîte de brisure, laquelle est déjà cotée par
        les tokens : le SVG n'écrit donc aucune dimension en pixels. Seul le
        `viewBox` porte des nombres, et ce ne sont pas des cotes — c'est le
        repère unitaire dans lequel la pente est dessinée. Il suit le rapport
        `--coupe-parcours` / `--coupe-denivele` + `--filet` ; l'ajuster ici sans
        ajuster les tokens décrocherait la diagonale de ses deux segments.
      -->
      <svg
        viewBox="0 0 64 5"
        class="size-full overflow-visible"
        aria-hidden="true"
      >
        <line x1="0" y1="4.5" x2="64" y2="0.5" stroke="currentColor" stroke-width="1" />
      </svg>
    </span>

    <!-- Segment droit : reprend après la coupe, au niveau haut, jusqu'au bord. -->
    <span
      data-role="segment"
      class="absolute top-0 right-0 left-[calc(var(--pos)_+_var(--coupe-parcours))] h-(--filet) bg-current"
    />
  </div>
</template>
