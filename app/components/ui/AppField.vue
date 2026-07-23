<script setup lang="ts">
/**
 * Champ du socle — saisie sur une ligne, saisie multiligne, case à cocher.
 *
 * Trois natures, un seul composant (FR-053). Tout champ porte un LIBELLÉ
 * ASSOCIÉ — `<label for>` pointant l'identifiant du contrôle —, jamais un
 * simple texte de substitution en guise d'étiquette : le texte de substitution
 * disparaît à la saisie et n'est pas un nom accessible.
 *
 * L'ACCENT NE SIGNALE RIEN DANS UN FORMULAIRE. Le filet ordinaire passe en
 * `--ink` à la prise de focus (FR-054) ; l'erreur passe dans le rouge d'erreur
 * HORS PALETTE, `--erreur`, qui bascule seul entre les deux thèmes (FR-056).
 * Ce rouge n'est pas de l'accent et ne s'étend nulle part ailleurs.
 *
 * Le repère de focus global de `main.css` s'applique EN PLUS du changement de
 * couleur du filet, et n'est pas redéclaré ici : un filet de 1 px qui change de
 * couleur ne suffit pas à signaler le focus (principe VIII, FR-055). Nulle part
 * `outline:none`, contrairement aux maquettes.
 */
const props = withDefaults(
  defineProps<{
    type?: 'ligne' | 'multiligne' | 'case'
    /**
     * Type HTML de la saisie sur une ligne — `email` / `password` appellent le
     * bon clavier et la bonne gestion du gestionnaire de mots de passe. Sans
     * effet sur les natures `multiligne` et `case`. Défaut `text` : les emplois
     * existants restent identiques (rétrocompatible).
     */
    typeHtml?: 'text' | 'email' | 'password'
    /** Valeur de l'attribut `autocomplete` (p. ex. `email`, `current-password`). */
    autocomplete?: string
    libelle: string
    erreur?: string | null
    /**
     * État d'erreur SANS message par champ : filet rouge et `aria-invalid`, mais
     * aucun texte sous le champ. Sert là où l'erreur est ANNONCÉE AILLEURS, en un
     * seul point — la connexion, dont le message unique et indistinct ne désigne
     * aucun champ (FR-021). `erreur` (message par champ) prime s'il est présent.
     */
    enErreur?: boolean
    placeholder?: string
  }>(),
  {
    type: 'ligne',
    typeHtml: 'text',
    autocomplete: undefined,
    erreur: null,
    enErreur: false,
    placeholder: undefined,
  },
)

/** Texte pour les deux saisies, état coché pour la case. */
const valeur = defineModel<string | boolean>()

/**
 * Deux vues typées du même modèle : les deux saisies échangent du texte, la
 * case un booléen. Sans elles, `v-model` recevrait une union que ni `<input>`
 * ni `<textarea>` n'acceptent.
 */
const texte = computed({
  get: () => (typeof valeur.value === 'string' ? valeur.value : ''),
  set: (nouvelle: string) => {
    valeur.value = nouvelle
  },
})

const coche = computed({
  get: () => valeur.value === true,
  set: (nouvelle: boolean) => {
    valeur.value = nouvelle
  },
})

/**
 * Identifiant stable entre le rendu serveur et le rendu client — `useId()` de
 * Nuxt, jamais un compteur maison qui divergerait à l'hydratation.
 */
const id = useId()
/** Le message d'erreur en dérive : `aria-describedby` doit pouvoir le viser. */
const idErreur = `${id}-erreur`

/**
 * Le filet du champ : ordinaire, puis `--ink` au focus ; rouge d'erreur dès
 * qu'un message est présent, focus compris — l'erreur prime sur l'état.
 */
const enErreur = computed(() => !!props.erreur || props.enErreur)

const filet = computed(() =>
  enErreur.value ? 'border-erreur' : 'border-line focus:border-ink',
)
</script>

<template>
  <div data-testid="champ">
    <!-- Case à cocher : le libellé enveloppe le contrôle ET le vise par `for`,
         la zone cliquable couvre alors les deux. -->
    <label
      v-if="type === 'case'"
      :for="id"
      class="flex cursor-pointer items-center gap-2.5"
    >
      <input
        :id="id"
        v-model="coche"
        type="checkbox"
        class="size-4.5 shrink-0 accent-ink"
        :aria-invalid="enErreur ? 'true' : undefined"
        :aria-describedby="erreur ? idErreur : undefined"
      >
      <span class="text-label text-ink">{{ libelle }}</span>
    </label>

    <template v-else>
      <label :for="id" class="mb-2 block text-label text-ink">{{ libelle }}</label>

      <!-- Multiligne : encadrée d'un filet de 1 px, redimensionnable en hauteur
           seulement — l'élargir romprait la colonne. -->
      <textarea
        v-if="type === 'multiligne'"
        :id="id"
        v-model="texte"
        rows="2"
        :placeholder="placeholder"
        class="w-full resize-y border-(length:--filet) bg-transparent px-3.5 py-3 font-corps text-saisie leading-corps-serre text-ink transition-colors duration-(--transition-survol) placeholder:text-muted"
        :class="filet"
        :aria-invalid="enErreur ? 'true' : undefined"
        :aria-describedby="erreur ? idErreur : undefined"
      />

      <!-- Ligne : aucun cadre, un seul soulignement de 1 px. -->
      <input
        v-else
        :id="id"
        v-model="texte"
        :type="typeHtml"
        :autocomplete="autocomplete"
        :placeholder="placeholder"
        class="w-full border-b-(length:--filet) bg-transparent py-2.5 font-corps text-saisie text-ink transition-colors duration-(--transition-survol) placeholder:text-muted"
        :class="filet"
        :aria-invalid="enErreur ? 'true' : undefined"
        :aria-describedby="erreur ? idErreur : undefined"
      >
    </template>

    <!-- Le message est ASSOCIÉ au champ : sans `aria-describedby`, il n'existe
         que pour l'œil. -->
    <p v-if="erreur" :id="idErreur" class="mt-2 text-meta text-erreur">
      {{ erreur }}
    </p>
  </div>
</template>
