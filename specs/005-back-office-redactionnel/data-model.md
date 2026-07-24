# Data Model — Back-office rédactionnel

**Aucune migration.** La feature 005 n'ajoute **ni table, ni colonne, ni index**. Le schéma
Prisma de la feature 002 (`Article`, `Media`, `Rubrique`, `Compte`) porte déjà tous les champs
manipulés. Ce document décrit donc : (§1) les entités **réutilisées** telles quelles, (§2) les
**nouvelles opérations de service**, (§3) les **DTO d'administration** (formes d'affichage,
jamais des tables), (§4) les **dimensions des trois dérivés** non-Card, (§5) les
**transitions d'état** couvertes.

---

## §1 — Entités réutilisées (rappel, source : `prisma/schema.prisma`)

- **Article** — `id` (cuid), `titre` (≤160), `slug` (unique), `chapo` (≤300), `corps` (HTML
  **déjà assaini**), `statut` (`brouillon`|`publie`, texte validé Zod), `publieLe`
  (`DateTime?`, nulle tant que jamais publié), `sousTheme` (≤40, nullable), `auteur`
  (nullable), `rubriqueId` (FK), `couvertureId` (FK `Media`, nullable), `couvertureAlt`
  (nullable), `couvertureLegende` (nullable), `rangUne` (`Int? @unique`, 1–5 par Zod),
  `creeLe`, `modifieLe`.
- **Media** — `id` (cuid), `cle` (unique, **jamais une URL**), `largeur`, `hauteur`, `poids`,
  `altParDefaut` (nullable). Référencé par `Article.couvertureId` (`onDelete: Restrict`).
- **Rubrique** — les huit, figées ; `id` (segment d'URL), `libelle`, `ordre`.
- **Compte** — inchangé ; sert `exigerCompte`.

**Invariants déjà tenus par les services 002** (la 005 s'appuie dessus, ne les réécrit pas) :
rang ∈ 1–5 (Zod), à la Une ⇒ publié, publié ⇒ couverture + `alt`, éviction atomique du rang,
slug unique, corps assaini avant écriture, suppression refusée si l'article occupe un rang.

---

## §2 — Nouvelles opérations de service

### `server/services/articles.ts` (ajouts)

```
listerArticlesAdmin(options): Promise<ArticleAdmin[]>
compterArticlesAdmin(options): Promise<number>
articleAdminParId(id): Promise<ArticleAdminComplet | null>
```

- **`options`** : `{ q?, rubriqueId?, statut?, page?, taille? }`.
- **Différence clé avec les lectures publiques** : **n'appliquent PAS** `filtreVisible` — l'admin
  voit brouillons et articles datés du futur. Filtres cumulables **côté serveur** :
  - `q` → `titre contains q` (insensible à la casse) ;
  - `rubriqueId` → égalité ;
  - `statut` → égalité (`brouillon`|`publie`).
- Tri : `orderBy: { modifieLe: 'desc' }`. Pagination : `skip=(page-1)*taille`, `take=taille`.
- `include: { couverture: true }` (clé pour la vignette de table).
- `articleAdminParId` retourne l'article **complet** (corps compris, couverture jointe) pour
  alimenter l'éditeur — **y compris un brouillon** (contrat d'administration, gardé).

### `server/services/une.ts` (ajouts)

```
reordonnerUne(ordre: string[]): Promise<Article[]>   // transactionnel — D10
epinglerArticle(articleId: string, rang: number): Promise<Article[]>  // publie puis place — D11
```

- **`reordonnerUne(ordre)`** — `ordre` = liste ordonnée (≤5) d'`id`. Une transaction :
  1. valider (Zod, §voir validation) : longueur ≤ 5, `id` **uniques** ;
  2. vérifier que chaque `id` existe **et** est `publie` (sinon `ErreurValidation`) ;
  3. `updateMany({ where: { rangUne: { not: null } }, data: { rangUne: null } })` — table rase ;
  4. pour chaque `id` à l'index `i` : `update rangUne = i+1`.
  Retourne l'état trié. L'ordre du tableau **est** l'ordre de l'accueil (FR-027).
- **`epinglerArticle(articleId, rang)`** — transaction : si `brouillon`, applique les gardes de
  publication (couverture + `alt` non vide) puis `statut='publie'`, `publieLe` posé si absent ;
  puis éviction du rang (comme `placerALaUne`) et placement. Sert le **chemin éditeur** (FR-021,
  FR-025).

### `server/utils/image.ts` (nouveau)

```
traiterImage(entree: Buffer): Promise<{ buffer: Buffer, largeur, hauteur, poids, typeMime }>
```

- `sharp(entree)` : refuse un type non-image (magic bytes), auto-oriente, **retire les
  métadonnées**, plafonne la largeur (~2000 px, `withoutEnlargement`), convertit en **WebP**.
- Retourne le buffer canonique + dimensions réelles + poids + `image/webp`. **Aucun** accès
  disque : le util ne touche jamais `node:fs` (porte 9) ; seul `Stockage.put` écrira.

---

## §3 — DTO d'administration (`shared/types/dto.ts`, ajouts)

Formes d'affichage produites par les routes serveur — **jamais** des entités brutes.

```ts
/** Une ligne de la table « Articles » (dérivé 3). */
export interface LigneArticleAdmin {
  id: string
  titre: string
  rubrique: { id: RubriqueId, libelle: string }
  statut: 'brouillon' | 'publie'
  rangUne: number | null        // 1..5 ou null (affiché « 01 » … ou « — »)
  date: string                  // publieLe si publié, sinon modifieLe (ISO)
  image?: string                // /medias/<clé> ou absent (brouillon sans couverture)
  imageAlt?: string
}

/** La liste paginée d'administration. */
export interface ListeAdminDTO {
  articles: LigneArticleAdmin[]
  page: number
  taille: number
  total: number
  totalPages: number
}

/** L'article complet chargé dans l'éditeur (brouillon compris). */
export interface ArticleEditionDTO {
  id: string
  titre: string
  slug: string
  chapo: string
  corpsHtml: string             // déjà assaini
  sousTheme: string | null
  auteur: string | null
  statut: 'brouillon' | 'publie'
  publieLe: string | null       // ISO ou null
  rubriqueId: RubriqueId
  rangUne: number | null
  couverture: { id: string, url: string, alt: string | null, legende: string | null } | null
  modifieLe: string             // pour l'indicateur d'autosave
}

/** Un des cinq emplacements de « Composer la Une » (dérivé 1). */
export interface EmplacementUneDTO {
  rang: number                  // 1..5 ; rang 1 = héros
  article: {
    id: string
    titre: string
    rubrique: string            // libellé (eyebrow de rubrique, contexte accueil)
    image?: string
    imageAlt?: string
  } | null                      // null = « Emplacement libre »
}

/** Un article publiable, proposé à l'épinglage (dérivé 2). */
export interface ArticlePubliableDTO {
  id: string
  titre: string
  rubrique: string              // libellé
  image?: string
  imageAlt?: string
}

/** La réponse de GET /api/admin/une. */
export interface CompositionUneDTO {
  emplacements: EmplacementUneDTO[]   // toujours 5, rang 1..5, article ou null
  publiables: ArticlePubliableDTO[]   // publiés NON épinglés, filtrables par recherche
}
```

Note : `image` reste une **adresse d'application** (`/medias/<clé>`, calculée par
`stockage.url`), jamais persistée — cohérent avec la couche `presentation.ts` existante.

---

## §4 — Dimensions des trois dérivés (non-Card, source : maquettes)

Reproduits **tels quels**, en **dimensions fixes** (pas d'`aspect-ratio`), **hors** du
composant Card (arbitrage 2, cf. `plan.md` Complexity Tracking). Aucune valeur n'est dans
`tokens.md` : elles proviennent des trois `.html` et y font foi pour la structure.

| Dérivé | Composant | Vignette | Titre | Autres cotes |
|---|---|---|---|---|
| **Emplacement de la Une** | `EmplacementUne.vue` | 213×120 ; **héros 320×180** | 18 px (héros 22 px), **2 lignes** (`-webkit-line-clamp:2`) | rang 01–05 en **accent** 32 px `Archivo` 800 ; poignée de DnD ; carte à filet 1 px, padding 14 px ; état libre : cadre pointillé, « Emplacement libre » |
| **Ligne d'article publié** | `LigneArticlePublie.vue` | 64×36 | 14 px, 2 lignes | eyebrow **10 px** `Archivo` 600 espacé ; lien « Épingler » |
| **Vignette de table** | `LigneTableArticle.vue` | 64×36 en `background-image` | titre 15 px (colonne dédiée) | grille 7 colonnes : `64px 1fr 148px 110px 78px 132px 150px` ; état en un mot (`t-statut--publie`/`--brouillon`) ; rang `t-rang--une` (accent) / `t-rang--non` (« — ») |

---

## §5 — Transitions d'état couvertes par les écrans

```
                 créer (POST, brouillon)
   (néant) ─────────────────────────────► brouillon
                                             │  ▲
             publier / epingler-qui-publie   │  │  dépublier
             (POST publier ; couverture+alt) ▼  │  (POST depublier ; libère rangUne)
                                           publié
                                             │
        rangUne ← 1..5 (placer / reordonner) │  (à la Une ⇒ publié)
                                             ▼
                                    publié + à la une (rang 1..5)

   supprimer (DELETE) : si rangUne ≠ null → retirerDeLaUne PUIS supprimer
                        (retrait de la Une AU PASSAGE — une seule action, FR-029/US5 sc.4)
```

- **Autosave / modifier** (PATCH) : reste **brouillon**, ne franchit aucune transition de
  publication ; assainit le corps à chaque écriture.
- **Publier** exige couverture + `alt` (refus explicite sinon) ; pose `publieLe` si absent,
  **sans redater** une republication.
- **Date future** : `publieLe` à venir ⇒ publié mais **invisible** du public jusqu'à l'échéance
  (embargo) — comportement du filtre de visibilité 002, inchangé.
