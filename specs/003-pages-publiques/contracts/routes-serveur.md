# Contrat — Routes serveur de lecture

Trois routes Nitro de lecture publique. Toutes appliquent la visibilité de 002 (aucun
paramètre ne la désactive), renvoient des **DTO** (voir `data-model.md`), et lèvent
`createError` avec le bon `statusCode`. Aucune n'accède au disque hors `stockage`.

Références DTO : `AccueilDTO`, `ListePagineeDTO`, `ArticleDTO`, `CarteDTO`
(`../data-model.md`).

---

## GET /api/accueil

Compose l'accueil (US1).

- **Entrée** : aucune.
- **Sortie** `200` : `AccueilDTO`
  - `une.hero` : `UneHeroDTO | null` (rang 1) ; `une.secondaires` : rangs 2–5 présents.
  - `derniers` : `CarteDTO[]` (derniers publiés, toutes rubriques ; `limite` = valeur
    d'affichage fixée à l'implémentation, alignée `accueil.html`).
  - `sections` : une entrée par rubrique mise en avant **ayant au moins un article publié**,
    dans l'ordre Environnement → Économie → Culture ; chaque entrée porte ses derniers
    articles (`CarteDTO[]`).
- **Sources** : `lireUne()`, `listerArticlesPublics({ limite })`,
  `listerArticlesPublics({ rubriqueId, limite })` par rubrique mise en avant.
- **Invariants** : jamais de héros vide ; jamais de vignette vide ; jamais de section vide.

---

## GET /api/articles

Liste paginée — sert **`/articles`** (toutes rubriques) et **`/rubrique/[id]`** (une rubrique).

- **Entrée** (query) :
  - `rubrique` : `RubriqueId` optionnel. Absent → toutes rubriques. Valeur inconnue → `404`.
  - `page` : entier ≥ 1, défaut `1`. Non entier / < 1 → `404`.
- **Sortie** `200` : `ListePagineeDTO`
  - `articles` : `CarteDTO[]` (≤ 12), `publieLe desc`.
  - `page`, `taille` (=12), `total`, `totalPages`.
  - `rubrique` : `{ id, libelle } | null` (renseigné si `rubrique` fourni).
- **Erreurs** :
  - `404` : `rubrique` inconnue ; `page` non entière ou < 1 ; `page > totalPages` avec
    `total > 0` (research D3).
  - `total = 0` **n'est pas** une erreur : `200` avec `articles: []`, `totalPages: 0` →
    l'appelant (page rubrique) rend l'`EtatVide`.
- **Sources** : `listerArticlesPublics({ rubriqueId?, limite: 12, decalage: (page-1)*12 })`,
  `compterArticlesPublics({ rubriqueId? })`, `rubriqueParId(id)` pour valider/étiqueter.
- **Contexte eyebrow** : `rubrique` fourni → contexte = cette rubrique (affiche le
  sous-thème) ; sinon `null` (affiche la rubrique).

---

## GET /api/articles/[slug]

Page article complète (US2).

- **Entrée** : `slug` (segment).
- **Sortie** `200` : `{ article: ArticleDTO, aLireAussi: CarteDTO[] }`
  - `aLireAussi` : autres articles publiés de **la même rubrique**, l'article courant exclu,
    `publieLe desc`, borné (valeur d'affichage). Peut être `[]` (section masquée).
  - Contexte eyebrow d'`aLireAussi` = la rubrique de l'article (affiche le sous-thème).
- **Erreurs** :
  - `404` : `articlePublicParSlug(slug)` renvoie `null` (inexistant **ou** non paru — indistinct
    par conception, research 002).
- **Sources** : `articlePublicParSlug(slug)` (avec `include couverture`), `tempsLecture(corps)`,
  `listerArticlesPublics({ rubriqueId, limite })` filtré sur `slug !== courant`.

---

## Codes de statut (rappel FR-022)

| Situation | Statut |
|---|---|
| Ressource servie | `200` |
| Slug / rubrique / page inconnus ou hors bornes | `404` |
| Indisponibilité momentanée | `503` |
| Erreur interne inattendue | `500` |

Les pages consomment ces routes par `useFetch` ; une erreur `4xx/5xx` remonte à
`app/error.vue`, qui rend le gabarit d'état correspondant dans la charpente (research D8).
