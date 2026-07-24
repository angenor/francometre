import type { SeoArticleDTO } from '../types/dto.ts'

// Constructeur JSON-LD `NewsArticle` — fonction PURE, testable hors Nuxt
// (data-model §3, D8). Aucune fabrication d'URL ici : les adresses absolues
// arrivent déjà prêtes dans `seo` (calculées au serveur, porte 9). Le rendu
// injecte le résultat dans un `<script type="application/ld+json">`.

/** Ce que le constructeur lit de l'article — son titre NU (aucun préfixe). */
interface ArticleJsonLd {
  titre: string
}

/**
 * Bâtit l'objet `NewsArticle` (schema.org).
 *
 * Deux replis :
 *   · `author` = `Person(auteur)` si présent, sinon `Organization("Francomètre")` ;
 *   · `image` = `seo.imageAbsolue` si présente, sinon `imageDefaut` (l'image de
 *     partage par défaut absolue, D7).
 *
 * `headline` est le **titre nu** : la composition « Sous-thème : Titre » des
 * maquettes est de l'affichage, jamais du contenu (règle du modèle éditorial).
 * `imageDefaut` sert aussi de logo de l'éditeur (mot-symbole sur surface).
 */
export function jsonldArticle(
  seo: SeoArticleDTO,
  article: ArticleJsonLd,
  imageDefaut: string,
): Record<string, unknown> {
  const image = seo.imageAbsolue ?? imageDefaut

  const author = seo.auteur
    ? { '@type': 'Person', name: seo.auteur }
    : { '@type': 'Organization', name: 'Francomètre' }

  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.titre,
    datePublished: seo.publieISO,
    dateModified: seo.modifieISO,
    articleSection: seo.section,
    image: [image],
    mainEntityOfPage: { '@type': 'WebPage', '@id': seo.canonical },
    author,
    publisher: {
      '@type': 'Organization',
      name: 'Francomètre',
      logo: { '@type': 'ImageObject', url: imageDefaut },
    },
  }
}
