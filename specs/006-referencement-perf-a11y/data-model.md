# Modèle de données — Référencement, performance, accessibilité (Phase 1)

**Aucune entité persistée. Aucune migration.** La portabilité (principe VI) interdit
d'ajouter une colonne pour ce qui se calcule à la lecture. Ce document décrit donc des
**objets de présentation dérivés** et **une extension d'interface**, pas des tables.

Le `verifier.mjs` (portes 9 et 10) reste vert sans intervention : le schéma Prisma n'est pas
touché, et aucune URL n'entre en base.

---

## 1. Extension de l'interface `Stockage` (D6)

`server/utils/stockage.ts` — l'interface unique gagne une méthode, seule fabrique légitime
d'URL **absolue** de média.

```ts
export interface Stockage {
  put(cle: string, contenu: Buffer, typeMime: string): Promise<void>
  get(cle: string): Promise<Buffer | null>
  delete(cle: string): Promise<void>
  url(cle: string): string                          // existant — relatif « /medias/<clé> »
  urlAbsolue(cle: string, origine: string): string  // NOUVEAU — absolu pour Open Graph/JSON-LD
}
```

| Implémentation | `urlAbsolue(cle, origine)` |
|---|---|
| Disque (aujourd'hui) | `origine + url(cle)` → `https://francometre.com/medias/<clé>` |
| Objet/S3 (demain) | `url(cle)` (déjà absolue) — `origine` ignorée |

**Règles.**
- `origine` est **sans barre finale** ; `url(cle)` commence par `/` : la jonction ne double
  jamais le séparateur.
- Méthode **pure et synchrone**, comme `url` : appelable au rendu sans coût.
- Aucun appelant hors `Stockage` ne compose d'URL de média (porte 9).

---

## 2. `SeoArticleDTO` (nouveau) — métadonnées d'article dérivées (D8)

`shared/types/dto.ts`. Produit **au serveur** par `metaSeoArticleDe(article, origine)` ;
consommé par la page article pour Open Graph/Twitter et le constructeur JSON-LD.

```ts
export interface SeoArticleDTO {
  canonical: string          // {origine}/article/{slug} — absolu
  imageAbsolue: string | null // couverture absolue (Stockage.urlAbsolue) ou null → défaut
  publieISO: string          // date de parution, ISO 8601
  modifieISO: string         // dernière modification, ISO 8601 (dateModified NewsArticle)
  section: string            // libellé de la rubrique (articleSection)
  auteur: string | null      // nom de l'auteur, ou null → repli Organisation
}
```

**Champs et provenance.**

| Champ | Source | Notes |
|---|---|---|
| `canonical` | `origine + '/article/' + slug` | même origine que la canonique de page (D2) |
| `imageAbsolue` | `Stockage.urlAbsolue(couverture.cle, origine)` | `null` si pas de couverture → l'affichage retombe sur l'image de partage par défaut (D7) |
| `publieISO` | `article.publieLe` | garanti non nul sur un article publié |
| `modifieISO` | `article.modifieLe` | expose `modifieLe`, déjà lu par `sitemap.xml` |
| `section` | `libelleRubrique(rubriqueId)` | libellé français |
| `auteur` | `article.auteur` | `null` ⇒ auteur JSON-LD = Organisation « Francomètre » |

**Intégration.** `ArticlePageDTO` gagne un champ `seo` :

```ts
export interface ArticlePageDTO {
  article: ArticleDTO
  aLireAussi: CarteDTO[]
  seo: SeoArticleDTO   // NOUVEAU
}
```

Le handler `GET /api/articles/[slug]` passe `useRuntimeConfig(event).public.siteUrl` au
mappeur. Aucune autre route n'est modifiée (l'accueil et les listes n'ont pas d'OG propre :
elles emploient l'image de partage par défaut).

---

## 3. Objet JSON-LD `NewsArticle` (dérivé, non typé DTO) (D8)

`shared/utils/jsonldArticle.ts` — **fonction pure** `jsonldArticle(seo, article, defautImg)`
retournant l'objet sérialisé dans `<script type="application/ld+json">`. Testable hors Nuxt.

Forme (schema.org `NewsArticle`) :

```jsonc
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "<titre nu, sans préfixe>",
  "datePublished": "<publieISO>",
  "dateModified": "<modifieISO>",
  "articleSection": "<section>",
  "image": ["<imageAbsolue ou defautImg>"],
  "mainEntityOfPage": { "@type": "WebPage", "@id": "<canonical>" },
  "author":    { "@type": "Person", "name": "<auteur>" },      // sinon Organization
  "publisher": {
    "@type": "Organization",
    "name": "Francomètre",
    "logo": { "@type": "ImageObject", "url": "<siteUrl>/brand/partage-defaut.png" }
  }
}
```

**Replis.**
- `author` = `Person(auteur)` si `auteur` non nul, sinon `Organization("Francomètre")`.
- `image` = `imageAbsolue` si présent, sinon l'image de partage par défaut absolue (D7).
- `headline` = **titre nu** (la composition « Sous-thème : Titre » est de l'affichage, jamais
  du contenu — règle du modèle éditorial).

---

## 4. Métadonnées de page (non typées, posées par `useSeoMeta`) (D1, D2, D4)

Vue d'ensemble de ce que chaque page **déclare** dans son `<head>`. Détail normatif :
`contracts/seo.md`.

| Page | `title` | `description` | `canonical` | `robots` | OG/JSON-LD |
|---|---|---|---|---|---|
| Accueil `/` | Francomètre — L'actualité, mesurée. | propre | `{siteUrl}/` | (index) | OG défaut |
| Rubrique | {Libellé} — Francomètre | propre | `{siteUrl}/rubrique/{id}[?page=N]` | (index) | OG défaut |
| Tous les articles | Tous les articles — Francomètre | propre | `{siteUrl}/articles[?page=N]` | (index) | OG défaut |
| Article | {Titre} — Francomètre | = chapô | `seo.canonical` | (index) | **OG article + JSON-LD** |
| Connexion | Connexion — Francomètre | propre | `{siteUrl}/connexion` | **noindex, follow** | — |
| 404 / 503 (`error.vue`) | selon état | propre | — | **noindex, follow** | — |
| `/admin/**` | (interface) | — | — | **`X-Robots-Tag: noindex`** (routeRules) | — |

Globaux (`app.head`) : `og:site_name = Francomètre`, `twitter:card = summary_large_image`,
`description` par défaut, `<link rel="alternate" type="application/rss+xml">` vers
`{siteUrl}/rss.xml`.

---

## 5. Invariants préservés

- **Aucune URL de média en base** (porte 9) : `urlAbsolue` calcule, ne persiste pas.
- **Schéma inchangé** (porte 10) : `verifier.mjs` reste vert.
- **Titre nu** : ni la canonique, ni le JSON-LD, ni l'OG ne préfixent le titre du sous-thème.
- **`image`/`imageAlt` restent un couple** dans les DTO de vignette : le SEO n'y touche pas.
- **Deux dates** : `publieLe` (datePublished) et `modifieLe` (dateModified) proviennent
  toutes deux de l'entité déjà lue ; aucune date nouvelle n'est stockée.
