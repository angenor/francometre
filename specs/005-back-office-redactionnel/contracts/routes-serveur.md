# Contrat — Routes serveur

Toutes les routes `/api/admin/**` appellent **`exigerCompte(event)` en première ligne**
(porte 12) : sans session valide → **401**, aucun effet. Toute mutation valide son entrée par
**Zod** avant tout enregistrement ; un refus métier lève `ErreurValidation` → **400** avec un
message **français** explicite (jamais l'erreur Prisma brute, cf. `validation/erreurs.ts`).
Les corps de réponse sont des **DTO** (`shared/types/dto.ts`), jamais des entités brutes.

Convention d'erreurs : `401` non authentifié · `400` entrée/règle invalide (message clair) ·
`404` ressource inconnue · `413` fichier trop lourd (upload) · `415` type non image (upload).

---

## Articles

### `GET /api/admin/articles`  — Liste (FR-005/007/008)

- **Garde** : `exigerCompte`.
- **Query** (Zod) : `q?: string`, `rubriqueId?: RubriqueId`, `statut?: 'brouillon'|'publie'`,
  `page?: number≥1 = 1`, `taille?: number = 20`.
- **Effet** : `listerArticlesAdmin` + `compterArticlesAdmin` (mêmes filtres). **Sans**
  `filtreVisible` : brouillons et futurs inclus.
- **Réponse 200** : `ListeAdminDTO` `{ articles: LigneArticleAdmin[], page, taille, total, totalPages }`.
- **Notes** : changer un filtre repart à `page=1` (côté client). Liste vide → `articles: []`
  (l'écran affiche un état vide, FR-010).

### `POST /api/admin/articles`  — Créer (FR-009)

- **Garde** : `exigerCompte`.
- **Body** (Zod `schemaCreationArticle`) : `titre`, `chapo`, `corps`, `rubriqueId`, +
  facultatifs `slug`, `sousTheme`, `auteur`, `statut`, `couvertureId`, `couvertureAlt`.
  À la création paresseuse de l'autosave, le minimum peut se réduire au titre/à un corps vide —
  **statut défaut `brouillon`**.
- **Effet** : `creerArticle` (valide → **assainit** → écrit ; slug dérivé si absent).
- **Réponse 201** : `{ id }` (+ `ArticleEditionDTO` pour bascule immédiate en édition).
- **Erreurs** : 400 (titre vide/trop long, rubrique inconnue, slug pris).

### `GET /api/admin/articles/[id]`  — Lire pour édition

- **Garde** : `exigerCompte`.
- **Effet** : `articleAdminParId` (brouillon compris ; couverture jointe → `url` calculée).
- **Réponse 200** : `ArticleEditionDTO`. **404** si inconnu.

### `PATCH /api/admin/articles/[id]`  — Modifier / autosave (FR-016, FR-016a)

- **Garde** : `exigerCompte`.
- **Body** (Zod `schemaModificationArticle`, **partiel**) : tout sous-ensemble des champs.
- **Effet** : `modifierArticle` (mêmes garanties : bornes, **assainissement** du corps si
  fourni). **Ne publie jamais** (le statut ne passe à `publie` que par la route `publier`).
- **Réponse 200** : `ArticleEditionDTO` (dont `modifieLe`, pour l'indicateur d'autosave).
- **Erreurs** : 400 (bornes), 404 (inconnu). Un **401** (session expirée) est renvoyé tel quel :
  le client garde la saisie et redirige vers la connexion (edge « session expirée »).

### `POST /api/admin/articles/[id]/publier`  — Publier (FR-017, FR-021, FR-025)

- **Garde** : `exigerCompte`.
- **Body** (Zod, facultatif) : `publieLe?: ISO`, `aLaUne?: { rang: 1..5 }`.
- **Effet** :
  1. `publierArticle(id, publieLe?)` — **refuse** (400) si couverture absente ou `alt` vide ;
     pose `publieLe` si absent, **sans redater** une republication ; une **date future** est
     acceptée (embargo).
  2. si `aLaUne` : `epinglerArticle(id, rang)` (publie déjà fait ; éviction du rang).
- **Réponse 200** : `ArticleEditionDTO`.
- **Erreurs** : 400 (couverture/alt manquants, rang hors 1–5), 404.

### `POST /api/admin/articles/[id]/depublier`  — Repasser en brouillon (FR-017)

- **Garde** : `exigerCompte`.
- **Effet** : `depublierArticle` — statut `brouillon`, **libère `rangUne`** ; `publieLe`
  conservée (ne redate pas à la republication).
- **Réponse 200** : `ArticleEditionDTO`. **404** si inconnu.

### `DELETE /api/admin/articles/[id]`  — Supprimer (FR-028/029)

- **Garde** : `exigerCompte`.
- **Effet** : suppression **définitive**. Si l'article occupe un rang de la Une, la route le
  **retire de la Une au passage** — `retirerDeLaUne(id)` **puis** `supprimerArticle(id)` — de
  sorte que l'accueil ne présente **aucun emplacement orphelin** (FR-029, US5 sc.4). Sinon,
  `supprimerArticle(id)` directement. Le client demande **confirmation** avant l'appel (D15).
- **Réponse 204**. **404** si inconnu.
- **Note** : `supprimerArticle` (feature 002) refuse **seul** la suppression d'un article
  épinglé ; c'est **la route** qui orchestre le dépinglage préalable, pour tenir FR-029 **sans
  modifier** le service 002. Retrait de la Une et effacement forment **une seule action** pour
  la rédaction (pas de geste manuel préalable).

---

## Médias

### `POST /api/admin/medias`  — Téléverser (FR-019/020, D5)

- **Garde** : `exigerCompte`.
- **Body** : `multipart/form-data`, un champ fichier (`readMultipartFormData`).
- **Effet** : `traiterImage` (sharp : type réel, orientation, sans métadonnées, plafond ~2000 px,
  → WebP) → clé `cuid.webp` → **`Stockage.put(cle, buffer, 'image/webp')`** →
  `enregistrerMedia({ cle, largeur, hauteur, poids })`.
- **Réponse 201** : `{ id, cle, url }` avec `url = /medias/<clé>` (= `stockage.url(cle)`).
  - couverture : le client attache `couvertureId = id` à l'article (via PATCH).
  - image du corps : l'éditeur insère `<img src="url">` (adresse d'application, D4).
- **Erreurs** : 415 (type non image), 413 (trop lourd, seuil serveur), 400 (fichier absent).

### `GET /medias/[...cle]`  — Servir un média (D6) — **PUBLIC**

- **Garde** : aucune (les couvertures publiées sont publiques ; clés opaques non énumérables).
- **Effet** : `Stockage.get(cle)` → octets. **404** si `null`.
- **En-têtes** : `Content-Type` **dérivé de l'extension de la clé** (`.webp`→`image/webp`,
  `.jpg`/`.jpeg`→`image/jpeg`, `.png`→`image/png`, `.avif`→`image/avif` ; défaut
  `application/octet-stream`) — les téléversements produisent du WebP, mais les clés d'exemple
  du seed sont en `.jpg` ; `Cache-Control: public, max-age=31536000, immutable`.
- **Note portabilité** : c'est l'unique indirection ; disque aujourd'hui, objet demain, sans
  changer les adresses `/medias/<clé>` stockées dans les corps.

---

## Une

### `GET /api/admin/une`  — Composition courante + publiables (FR-022/023)

- **Garde** : `exigerCompte`.
- **Effet** : lit les 5 emplacements (articles `rangUne` 1..5) + les articles **publiés non
  épinglés** (pour la colonne d'épinglage, filtrables par `q`).
- **Query** : `q?: string` (recherche dans les publiables).
- **Réponse 200** : `CompositionUneDTO` `{ emplacements: EmplacementUneDTO[5], publiables: ArticlePubliableDTO[] }`.

### `PUT /api/admin/une`  — Enregistrer l'ordre (FR-024/026/027, D10)

- **Garde** : `exigerCompte`.
- **Body** (Zod `server/validation/une.ts`) : `{ ordre: string[] }` — `id` **uniques**, longueur
  **≤ 5**, chaînes non vides.
- **Effet** : `reordonnerUne(ordre)` — **une transaction** : table rase des rangs puis
  réassignation `rangUne = index+1`. **Refuse** (400) un `id` non publié, inconnu, ou un doublon.
  L'ordre du tableau **devient** l'ordre de l'accueil.
- **Réponse 200** : `CompositionUneDTO` (état recomposé).
- **Note** : c'est cette route, et elle seule, qui fixe l'accueil (FR-027) ; tant qu'elle n'est
  pas appelée, l'accueil garde l'ordre précédent.

---

## Traçabilité route → exigence → service

| Route | FR | Service |
|---|---|---|
| `GET /articles` | 005, 007, 008, 010 | `listerArticlesAdmin`, `compterArticlesAdmin` |
| `POST /articles` | 009, 011, 016 | `creerArticle` |
| `GET /articles/[id]` | 011 (édition) | `articleAdminParId` |
| `PATCH /articles/[id]` | 016, 016a, 018 | `modifierArticle` |
| `POST /articles/[id]/publier` | 014b, 017, 021, 025 | `publierArticle`, `epinglerArticle` |
| `POST /articles/[id]/depublier` | 017 | `depublierArticle` |
| `DELETE /articles/[id]` | 028, 029 | `supprimerArticle` |
| `POST /medias` | 019, 020 | `traiterImage`, `Stockage.put`, `enregistrerMedia` |
| `GET /medias/[...cle]` | 019, 020 | `Stockage.get` |
| `GET /une` | 022, 023 | lecture Une + publiables |
| `PUT /une` | 024, 026, 027 | `reordonnerUne` |
