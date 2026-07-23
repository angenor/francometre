# Data Model — Pages publiques (Phase 1)

Cette feature est **essentiellement en lecture**. Elle ne définit pas d'entité nouvelle :
elle lit celles de Modèle et données (002). Le modèle ci-dessous décrit (1) le **seul delta
de schéma**, et (2) les **DTO de présentation** produits par les routes serveur — des formes
d'affichage, pas des tables.

---

## 1. Delta de schéma (unique)

### Article — champ ajouté

| Champ | Type | Contrainte | Raison |
|---|---|---|---|
| `couvertureLegende` | `String?` | Nullable, texte libre. Borne de longueur validée par Zod à la 004 (écriture) ; ici lecture seule. | Légende visible de la couverture montrée par `article.html` (`<figcaption>`), absente de 002. Décidé par le porteur le 2026-07-22 (research D10). |

- **Distinct de `couvertureAlt`** : `couvertureAlt` est le texte alternatif d'accessibilité
  (lecteurs d'écran) ; `couvertureLegende` est la légende éditoriale visible, pouvant porter
  un crédit (« — Photo d'illustration »). Ne jamais confondre (principe VIII).
- **Portabilité (porte 10)** : `String?` nullable — ni enum de base, ni JSON, ni liste
  scalaire, ni auto-increment. Identique SQLite/PostgreSQL.
- **Migration** : additive, colonne nullable, sans valeur par défaut imposée. Aucun impact
  sur les lignes existantes. Rejouable via `npx prisma migrate dev`.
- **Seed** : renseigner `couvertureLegende` sur les articles d'exemple **publiés** (les six
  du seed 002), pour que la légende soit visible et testable (SC-003). Le brouillon reste
  sans légende.

Aucun autre champ, aucune autre table, aucune autre relation. `Rubrique`, `Media`, `Compte`
sont lus tels quels ; `Compte` n'est pas touché.

---

## 2. DTO de présentation (formes d'affichage, non persistées)

Produits par `server/utils/presentation.ts` à partir des entités lues. **Aucune** forme
brute Prisma ne franchit la frontière serveur→client. Toute URL de média provient de
`stockage.url(cle)` ; tout eyebrow de `eyebrowDe(article, contexte)` ; tout temps de lecture
de `tempsLecture(corps)`.

### CarteDTO — la vignette (alimente `ArticleCard`)

| Champ | Type | Source |
|---|---|---|
| `titre` | `string` | `article.titre` (nu, sans préfixe) |
| `slug` | `string` | `article.slug` |
| `chemin` | `string` | `/article/${slug}` |
| `rubrique` | `RubriqueId` | `article.rubriqueId` |
| `eyebrow` | `string` | `eyebrowDe(article, contexte)` — contexte = rubrique de la page, ou `null` |
| `date` | `string (ISO)` | `article.publieLe` |
| `image` | `string \| undefined` | `stockage.url(article.couverture.cle)` si couverture |
| `imageAlt` | `string \| undefined` | `article.couvertureAlt` |

> `image`/`imageAlt` forment un couple : jamais l'un sans l'autre (contrat `ArticleCard`).

### UneHeroDTO — l'article de rang 01

`CarteDTO` + `{ numero: '01', chapo: string }`. Rendu par `UneHero.vue` (image large, numéro
accent, titre 52 px, chapô). L'eyebrow « À la une » (accent) est posé par la section, pas par
le DTO.

### UneSecondaireDTO — rangs 02–05

| Champ | Type | Source |
|---|---|---|
| `numero` | `'02' … '05'` | rang formaté sur 2 chiffres |
| `titre`, `slug`, `chemin`, `rubrique`, `eyebrow` | | comme `CarteDTO` |

Rendu par `UneSecondaire.vue` : numéro (accent) + eyebrow rubrique + titre, **sans image**
(conforme `accueil.html` `.une-secondary`).

### ArticleDTO — la page article

| Champ | Type | Source |
|---|---|---|
| `titre` | `string` | `article.titre` |
| `slug` | `string` | `article.slug` |
| `rubrique` | `{ id: RubriqueId, libelle: string, chemin: string }` | `libelleRubrique`, `/rubrique/${id}` |
| `sousTheme` | `string \| null` | `article.sousTheme` |
| `chapo` | `string` | `article.chapo` |
| `corpsHtml` | `string` | `article.corps` (déjà assaini — rendu tel quel) |
| `auteur` | `string \| null` | `article.auteur` |
| `date` | `string (ISO)` | `article.publieLe` |
| `tempsLecture` | `number` | `tempsLecture(article.corps)` (minutes) |
| `couverture` | `{ url, alt, legende } \| null` | `stockage.url(cle)`, `couvertureAlt`, `couvertureLegende` |
| `filAriane` | `{ libelle, chemin }[]` | Accueil → Rubrique → (titre courant) |

### ListePagineeDTO — rubrique & « tous les articles »

| Champ | Type | Source |
|---|---|---|
| `articles` | `CarteDTO[]` | `listerArticlesPublics({ rubriqueId?, limite: 12, decalage })` |
| `page` | `number` | requête (défaut 1) |
| `taille` | `number` | `12` |
| `total` | `number` | `compterArticlesPublics({ rubriqueId? })` |
| `totalPages` | `number` | `ceil(total / 12)` |
| `rubrique` | `{ id, libelle } \| null` | présent sur la page rubrique |

> Page hors bornes (`page > totalPages` avec `total > 0`, ou `page < 1`) → 404 (research D3).
> `total = 0` sur une rubrique → `EtatVide` (US3), pas une erreur.

### AccueilDTO — l'accueil

```text
{
  une: { hero: UneHeroDTO | null, secondaires: UneSecondaireDTO[] },   // lireUne(), rangs 1..5
  derniers: CarteDTO[],                                                // listerArticlesPublics({ limite })
  sections: { rubrique: { id, libelle, chemin }, articles: CarteDTO[] }[]  // Environnement, Économie, Culture
}
```

- `hero` = `null` si le rang 1 n'est pas pourvu (la section « À la une » n'affiche pas de
  héros vide — FR-008, edge case « Une incomplète »).
- Un emplacement 02–05 non pourvu est simplement absent du tableau (pas de vignette vide).
- Une section de rubrique sans article publié est **omise** du tableau `sections` (FR-008).
- L'eyebrow des `derniers` et des sections suit `eyebrowDe` : contexte `null` pour les
  derniers (toutes rubriques), contexte = la rubrique de la section pour ses cartes.

---

## 3. Règles transverses (rappel, appliquées par la couche serveur)

- **Visibilité** : tout DTO dérive exclusivement des lectures publiques de 002, qui
  appliquent `filtreVisible` sans échappatoire. Aucun brouillon ne peut entrer dans un DTO.
- **Ordre** : listes du plus récent au plus ancien (`publieLe desc`) ; Une par rang croissant.
- **Portabilité** : aucune URL de média en DTO n'est stockée ; toutes sont calculées à la
  lecture par `stockage.url`. Le flux/plan du site préfixent l'origine configurée.
