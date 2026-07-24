import { z } from 'zod'

// Validation des entrées d'écriture d'article (FR-026).
//
// Le principe VI interdit les `enum` portés par la base, ce qui déplace
// mécaniquement la contrainte vers le code : rien, au niveau de SQLite,
// n'empêche d'écrire `'brouyon'` dans `statut`. C'est Zod qui l'empêche, et
// c'est pourquoi la validation précède TOUT enregistrement (research.md D13).
//
// Chaque règle porte un message en français : le message par défaut de la
// bibliothèque est en anglais (« Too big: expected string… ») et manquerait la
// porte « Langue » de la constitution.
//
// Aucune règle ne tronque ni ne corrige en silence. Un dépassement est un REFUS
// explicite (FR-008a) : tronquer un titre à 160 caractères reviendrait à
// publier un texte que personne n'a écrit.

/** Les deux seuls statuts. Chaîne validée, jamais un enum de base (FR-010). */
export const STATUTS = ['brouillon', 'publie'] as const
export type Statut = (typeof STATUTS)[number]

export const RANG_UNE_MIN = 1
export const RANG_UNE_MAX = 5

const titre = z
  .string({ error: 'Le titre est obligatoire.' })
  .trim()
  .min(1, { error: 'Le titre ne peut pas être vide.' })
  .max(160, { error: 'Le titre ne peut pas dépasser 160 caractères.' })

// Un brouillon PEUT être incomplet : le chapô vide est TOLÉRÉ à l'écriture (le
// rédacteur enregistre en cours de route). La complétude — chapô, corps,
// couverture décrite — est exigée non pas à l'écriture mais à la PUBLICATION,
// où le manquant est nommé (`verifierCompletudePublication`, FR-014/US3). Seul
// le plafond de longueur reste un refus d'écriture (FR-008a).
const chapo = z
  .string({ error: 'Le chapô est obligatoire.' })
  .trim()
  .max(300, { error: 'Le chapô ne peut pas dépasser 300 caractères.' })

const corps = z.string({ error: 'Le corps est obligatoire.' })

const sousTheme = z
  .string()
  .trim()
  .max(40, { error: 'Le sous-thème ne peut pas dépasser 40 caractères.' })

const statut = z.enum(STATUTS, {
  error: 'Le statut doit valoir « brouillon » ou « publie ».',
})

const rubriqueId = z
  .string({ error: 'La rubrique est obligatoire.' })
  .min(1, { error: 'La rubrique est obligatoire.' })

/**
 * Le rang de Une. L'intervalle 1–5 relève de Zod et de lui seul : aucune
 * contrainte de base ne l'exprime, et la contrainte d'unicité qui existe
 * empêche les doublons sans rien dire de l'intervalle (research.md D6).
 */
export const rangUne = z
  .number({ error: 'Le rang de Une doit être un nombre.' })
  .int({ error: 'Le rang de Une doit être un entier.' })
  .min(RANG_UNE_MIN, { error: 'Le rang de Une doit être compris entre 1 et 5.' })
  .max(RANG_UNE_MAX, { error: 'Le rang de Une doit être compris entre 1 et 5.' })

/**
 * Le slug est facultatif à l'entrée : absent, il se dérive du titre. Fourni, il
 * doit déjà respecter la forme d'un segment d'URL — on ne le « répare » pas en
 * silence, sans quoi l'auteur croirait avoir choisi une adresse qu'il n'a pas.
 */
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    error: 'Le slug ne peut contenir que des minuscules, des chiffres et des tirets.',
  })

/**
 * Filtres de la liste d'ADMINISTRATION (FR-005/007/008). Les valeurs arrivent
 * de la requête, donc en chaînes : `z.coerce` convertit `page`/`taille`. Un
 * champ vide est retiré en amont (route) plutôt que refusé — un filtre effacé
 * n'est pas une erreur. `statut` réutilise les deux seuls statuts.
 */
export const schemaFiltresListe = z.object({
  q: z.string().trim().min(1).optional(),
  rubriqueId: z.string().trim().min(1).optional(),
  statut: z.enum(STATUTS, {
    error: 'Le statut doit valoir « brouillon » ou « publie ».',
  }).optional(),
  page: z.coerce
    .number({ error: 'La page doit être un nombre.' })
    .int({ error: 'La page doit être un entier.' })
    .min(1, { error: 'La page doit être supérieure ou égale à 1.' })
    .optional()
    .default(1),
  taille: z.coerce
    .number({ error: 'La taille de page doit être un nombre.' })
    .int({ error: 'La taille de page doit être un entier.' })
    .min(1, { error: 'La taille de page doit être supérieure ou égale à 1.' })
    .max(100, { error: 'La taille de page ne peut pas dépasser 100.' })
    .optional()
    .default(20),
})

export type FiltresListe = z.infer<typeof schemaFiltresListe>

export const schemaCreationArticle = z.object({
  titre,
  chapo,
  corps,
  rubriqueId,
  slug: slug.optional(),
  sousTheme: sousTheme.optional(),
  auteur: z.string().trim().optional(),
  statut: statut.optional(),
  // Nullable pour permettre de RETIRER la couverture depuis l'éditeur (« Retirer »
  // du panneau) : `null` détache le média et efface l'`alt`. Additif — un appel
  // qui ne fournit pas ces champs reste inchangé.
  couvertureId: z.string().nullable().optional(),
  couvertureAlt: z.string().nullable().optional(),
})

/**
 * La modification est partielle, avec les MÊMES garanties que la création :
 * `.partial()` rend chaque champ facultatif sans relâcher aucune de ses règles.
 */
export const schemaModificationArticle = schemaCreationArticle.partial()

export type DonneesCreationArticle = z.infer<typeof schemaCreationArticle>
export type DonneesModificationArticle = z.infer<typeof schemaModificationArticle>

/**
 * Corps de la requête de publication (FR-017/021/025). La date de parution est
 * FACULTATIVE et le FUTUR est accepté (embargo, FR-014b) : aucune borne haute.
 * `aLaUne` demande un placement à un rang 1–5.
 */
export const schemaPublication = z.object({
  publieLe: z
    .string()
    .datetime({ error: 'La date de publication doit être une date ISO valide.' })
    .optional(),
  aLaUne: z.object({ rang: rangUne }).optional(),
})

export type DonneesPublication = z.infer<typeof schemaPublication>
