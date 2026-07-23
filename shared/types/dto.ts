// Les DTO de présentation — formes d'AFFICHAGE, jamais des tables (data-model §2).
//
// Ce module ne porte que des TYPES : il est partagé par le serveur, qui les
// produit (`server/utils/presentation.ts`), et par les composants publics, qui
// les consomment. Aucune forme brute Prisma ne franchit cette frontière.

import type { RubriqueId } from '../utils/rubriques.ts'

/** Une référence de rubrique, prête à afficher et à lier. */
export interface RubriqueRef {
  id: RubriqueId
  libelle: string
  chemin: string
}

/** La vignette (alimente `ArticleCard`). `image`/`imageAlt` forment un couple :
 *  jamais l'un sans l'autre. */
export interface CarteDTO {
  titre: string
  slug: string
  chemin: string
  rubrique: RubriqueId
  eyebrow: string
  date: string
  image?: string
  imageAlt?: string
}

/** L'article de rang 01 de la Une (héros). */
export interface UneHeroDTO extends CarteDTO {
  numero: '01'
  chapo: string
  tempsLecture: number
}

/** Un rang 02–05 de la Une — sans image. */
export interface UneSecondaireDTO {
  numero: string
  titre: string
  slug: string
  chemin: string
  rubrique: RubriqueId
  eyebrow: string
  date: string
}

/** Un maillon navigable du fil d'Ariane (ancêtre, jamais le titre courant). */
export interface FilArianeElement {
  libelle: string
  chemin: string
}

/** La page article complète. */
export interface ArticleDTO {
  titre: string
  slug: string
  rubrique: RubriqueRef
  sousTheme: string | null
  chapo: string
  corpsHtml: string
  auteur: string | null
  date: string
  tempsLecture: number
  couverture: { url: string, alt: string, legende: string | null } | null
  filAriane: FilArianeElement[]
}

/** Une liste paginée (rubrique ou « tous les articles »). */
export interface ListePagineeDTO {
  articles: CarteDTO[]
  page: number
  taille: number
  total: number
  totalPages: number
  rubrique: { id: RubriqueId, libelle: string } | null
}

/** Une section de rubrique sur l'accueil. */
export interface SectionAccueilDTO {
  rubrique: RubriqueRef
  articles: CarteDTO[]
}

/** L'accueil éditorialisé au complet. */
export interface AccueilDTO {
  une: { hero: UneHeroDTO | null, secondaires: UneSecondaireDTO[] }
  derniers: CarteDTO[]
  sections: SectionAccueilDTO[]
}

/** La réponse de la page article : l'article et ses « à lire aussi ». */
export interface ArticlePageDTO {
  article: ArticleDTO
  aLireAussi: CarteDTO[]
}
