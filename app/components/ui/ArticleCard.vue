<script setup lang="ts">
/**
 * La vignette d'article — LE composant unique du site (principe I).
 *
 * Toute vignette du site en découle : une divergence entre deux emplois est un
 * défaut, pas une variante. C'est pourquoi le composant n'accepte, délibérément,
 * AUCUN paramètre de couleur, d'ombre, d'arrondi, d'espacement ou de taille,
 * AUCUN emplacement de contenu libre, et AUCUN paramètre `sansImage` : la
 * sobriété n'est pas paramétrable, et l'état « sans image » découle
 * mécaniquement de l'absence de la donnée (research.md D9).
 *
 * Structure imposée, dans cet ordre : image 16:9, rubrique, titre, date
 * (FR-026). La vignette ENTIÈRE est cliquable — ni bouton, ni « lire la
 * suite », ni chapô (FR-027).
 */

const props = defineProps<{
  /** Titre de l'article. Tronqué à trois lignes à l'affichage. */
  titre: string
  /** L'un des huit identifiants de rubrique. Affiché par son LIBELLÉ. */
  rubrique: RubriqueId
  /** Date de publication : objet `Date` ou chaîne ISO. */
  date: Date | string
  /** Destination — la vignette entière y mène. */
  chemin: string
  /** Média de couverture. Absent ⇒ état « sans image ». */
  image?: string
  /** Texte alternatif. OBLIGATOIRE et non vide dès que `image` est fournie. */
  imageAlt?: string
}>()

/**
 * Fuseau ET locale figés, pour deux raisons qui n'en font qu'une : le rendu du
 * serveur et celui du navigateur doivent être IDENTIQUES, sans quoi
 * l'hydratation diverge sur la date. Le fuseau du visiteur ne doit donc jamais
 * entrer dans le calcul. Site éditorial français : c'est le jour parisien qui
 * fait foi, pas celui de la machine qui affiche.
 */
const FORMAT_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Paris',
})

/** Passe à vrai quand le média déclaré ne se charge pas : même rendu que sans image. */
const echecImage = ref(false)

/** Un nouveau média mérite une nouvelle tentative. */
watch(() => props.image, () => {
  echecImage.value = false
})

/**
 * Une image sans texte alternatif réel est une erreur de contrat (principe
 * VIII) : elle échoue bruyamment en développement plutôt que de s'afficher
 * dégradée. En production, la vignette bascule dans l'état « sans image » —
 * l'image ne s'affiche JAMAIS avec un `alt` vide.
 */
const imageDeclaree = computed(() => {
  if (!props.image) return false

  if (!props.imageAlt || props.imageAlt.trim() === '') {
    const message
      = `ArticleCard : « ${props.titre} » fournit une image sans texte alternatif. `
        + '`imageAlt` est obligatoire et non vide dès que `image` est présente.'
    if (import.meta.dev) throw new Error(message)
    console.error(message)
    return false
  }

  return true
})

/** L'image n'est rendue que si elle est déclarée correctement ET qu'elle se charge. */
const avecImage = computed(() => imageDeclaree.value && !echecImage.value)

/** La date, sous forme d'instant — ou `null` si la donnée est inexploitable. */
const instant = computed(() => {
  const valeur = props.date instanceof Date ? props.date : new Date(props.date)
  if (Number.isNaN(valeur.getTime())) {
    console.error(`ArticleCard : « ${props.titre} » porte une date illisible.`, props.date)
    return null
  }
  return valeur
})

/** Le libellé de la rubrique, jamais son identifiant. */
const libelle = computed(() => libelleRubrique(props.rubrique) ?? '')

/** « 14 juillet 2026 » — en français, en toutes lettres. */
const dateEnToutesLettres = computed(() => (instant.value ? FORMAT_DATE.format(instant.value) : ''))

/** Forme lisible par la machine, pour l'élément `<time>`. */
const dateMachine = computed(() => instant.value?.toISOString() ?? undefined)
</script>

<template>
  <!--
    La racine EST le lien : un seul point d'entrée, une seule tabulation, aucun
    contrôle imbriqué. Sans image, elle porte à la place de celle-ci le filet
    supérieur de 2 px en `--ink` (FR-030).

    `group` sert le survol ET le focus clavier, qui produisent exactement le
    même retour (FR-028, FR-029). Le repère de focus, lui, est posé
    globalement par `main.css` : il n'a pas à être redéclaré ici.
  -->
  <NuxtLink
    :to="chemin"
    class="group block"
    :class="{ 'border-t-(length:--filet-actif) border-ink': !avecImage }"
  >
    <div
      v-if="avecImage"
      data-role="image"
      class="relative aspect-video overflow-hidden bg-surface"
    >
      <!--
        Chargement immédiat, délibérément : un média différé qui n'est jamais
        demandé ne signale jamais son échec, et l'état de repli ne se
        déclencherait pas. Le format 16:9 du conteneur réserve la place, il n'y
        a donc aucun décalage à craindre.
      -->
      <img
        data-role="visuel"
        :src="image"
        :alt="imageAlt"
        class="absolute inset-0 h-full w-full object-cover transition-transform duration-(--transition-survol) group-hover:transform-[scale(1.03)] group-focus-visible:transform-[scale(1.03)]"
        @error="echecImage = true"
      >
    </div>

    <div class="pt-4">
      <p
        data-role="rubrique"
        class="font-titre text-eyebrow leading-nul font-demi-grasse tracking-eyebrow text-muted uppercase"
      >
        {{ libelle }}
      </p>

      <!--
        Tronqué à trois lignes : la vignette ne grandit pas avec la longueur du
        titre, et la grille reste régulière.
      -->
      <h3
        data-role="titre"
        class="mt-2 line-clamp-3 font-titre text-titre-card leading-titre-card font-demi-grasse tracking-titre text-ink decoration-1 underline-offset-3 group-hover:underline group-focus-visible:underline"
      >
        {{ titre }}
      </h3>

      <time
        data-role="date"
        :datetime="dateMachine"
        class="mt-3 block text-meta text-muted"
      >
        {{ dateEnToutesLettres }}
      </time>
    </div>
  </NuxtLink>
</template>
