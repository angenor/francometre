<script setup lang="ts">
/**
 * Bouton du socle — le seul bouton du site.
 *
 * Quatre variantes DÉCLARÉES, et quatre seulement : primaire, secondaire,
 * tertiaire, indisponible (FR-050). Une cinquième se déclarerait ici, dans le
 * composant, jamais sur un écran : c'est pourquoi il n'existe aucun paramètre
 * de couleur, d'arrondi, d'ombre ni de taille libre. Un écran qui aurait besoin
 * d'autre chose fait amender ce fichier (principe I).
 *
 * L'ACCENT NE TOUCHE JAMAIS UN BOUTON — ni fond, ni bordure, ni libellé, dans
 * aucune variante (FR-052). La maquette l'énonce mot pour mot.
 *
 * Le survol du primaire ne change que sa couleur de fond : `--primaire-survol`
 * s'éclaircit en thème clair et s'assombrit en thème sombre, le token bascule
 * seul. Aucune ombre, aucun déplacement, aucun autre effet (FR-051).
 *
 * Le repère de focus n'est pas redéclaré ici : il est posé globalement dans
 * `main.css` sur `*:focus-visible`, et il s'applique EN PLUS de l'état de
 * survol. Les maquettes posent `outline:none` sans remplacement ; sur ce terrain
 * la constitution prime sur elles (principe VIII, FR-055).
 */
type Variante = 'primaire' | 'secondaire' | 'tertiaire'

const props = withDefaults(
  defineProps<{
    variante?: Variante
    indisponible?: boolean
  }>(),
  { variante: 'secondaire', indisponible: false },
)

/**
 * Assise commune aux quatre variantes — le dessin du bouton, invariable.
 *
 * L'appui vertical `py-3.25` vaut 13 px, l'appui horizontal `px-5.5` des trois
 * variantes encadrées 22 px : des MULTIPLES de la base de 4 px (`--base`,
 * tokens §3), non des nombres écrits en dur. La maquette relève 13 px 22 px.
 */
/*
 * La transition est ÉNUMÉRÉE — fond et bordure, comme la maquette les déclare
 * (`transition:background 150ms ease,border-color 150ms ease`) — et non prise à
 * `transition-colors`, qui y ajoute `outline-color`. Cet ajout n'est pas
 * anodin : au repos `outline-color` vaut `currentColor`, soit `--paper` sur le
 * primaire ; le repère de focus posé par `main.css` MET ALORS 150 ms À VIRER DU
 * BLANC AU NOIR, et reste invisible sur fond clair pendant ce temps. Un repère
 * de focus ne se fond pas en entrant (principe VIII).
 */
const assise
  = 'cursor-pointer font-titre text-interface font-demi-grasse tracking-bouton '
    + 'py-3.25 transition-[background-color,border-color] duration-(--transition-survol)'

/** Ce qui distingue une variante d'une autre : rien de plus que ces lignes. */
const variantes: Record<Variante, string> = {
  primaire:
    'px-5.5 border-(length:--filet) border-ink bg-ink text-paper '
    + 'hover:border-primaire-survol hover:bg-primaire-survol',
  secondaire:
    'px-5.5 border-(length:--filet) border-ink bg-transparent text-ink hover:bg-surface',
  // Sans bordure : l'appui horizontal se réduit à 4 px pour que le libellé
  // reste aligné sur le texte voisin. Le survol souligne, et c'est tout.
  tertiaire:
    'px-1 bg-transparent text-ink underline-offset-4 hover:underline',
}

/**
 * Indisponible : perceptible et annoncé comme tel, il ne disparaît pas.
 * Aucun état de survol — l'absence de réponse au pointeur fait partie du sens.
 *
 * Le curseur se pose sous la variante `disabled:` et non en `cursor-not-allowed`
 * nu : les deux utilitaires de curseur écriraient la même propriété, et c'est
 * l'ordre de la feuille produite, non celui de l'attribut, qui trancherait.
 */
const dessinIndisponible
  = 'px-5.5 border-(length:--filet) border-line bg-transparent text-muted '
    + 'disabled:cursor-not-allowed'

const classes = computed(() => [
  assise,
  props.indisponible ? dessinIndisponible : variantes[props.variante],
])
</script>

<template>
  <button
    type="button"
    data-testid="bouton"
    :class="classes"
    :disabled="indisponible"
  >
    <slot />
  </button>
</template>
