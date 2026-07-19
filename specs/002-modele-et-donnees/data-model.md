# Modèle de données — Modèle et données

**Feature** : [spec.md](./spec.md) · **Recherche** : [research.md](./research.md) · **Date** : 2026-07-19

Cinq entités persistées, une constante de code, une règle d'affichage sans stockage. Tout ce
qui suit respecte le principe VI : aucun `enum` porté par la base, aucun type `Json`, aucune
liste scalaire, aucun identifiant auto-incrémenté. Les identifiants sont des `cuid()` produits
par l'application.

Les valeurs de statut sont des **chaînes** validées par Zod (research.md D13). C'est un
déplacement de responsabilité assumé, pas un relâchement : ce que la base ne contraint plus,
le code le contraint, et il le contraint là où la migration ne le remettra pas en cause.

---

## 1. Rubrique — reflet d'une constante, pas son original

La liste des huit rubriques vit dans `shared/utils/rubriques.ts`, déplacée depuis `app/utils/`
(research.md D5). La table existe **uniquement** pour porter les clés étrangères des articles.
Elle ne redéfinit rien.

| Champ | Type | Obligatoire | Règle |
|---|---|---|---|
| `id` | texte | oui | L'identifiant de `shared/utils/rubriques.ts` : `environnement`, `sport`… Sert aussi d'identifiant d'URL |
| `libelle` | texte | oui | Libellé affiché, diacritiques compris (« Éducation ») |
| `ordre` | entier | oui | 1 à 8, reproduit l'ordre du tableau source (FR-002) |

L'identifiant est **repris du fichier source** plutôt que généré : c'est déjà un identifiant
stable, sans diacritique ni espace, et il sert de segment d'URL (`/rubrique/environnement`). Y
substituer un `cuid()` ajouterait une indirection sans rien garantir de plus.

| Ordre | `id` | `libelle` |
|---|---|---|
| 1 | `environnement` | Environnement |
| 2 | `sport` | Sport |
| 3 | `education` | Éducation |
| 4 | `sante` | Santé |
| 5 | `diplomatie` | Diplomatie |
| 6 | `culture` | Culture |
| 7 | `technologie` | Technologie |
| 8 | `economie` | Économie |

**Règles de validation :**

- Exactement huit lignes, jamais plus, jamais moins (FR-001). L'ensemble est figé : aucune
  opération de création ni de suppression n'est exposée (FR-004).
- Le seed est **rejouable** : il rapproche par `id`, met à jour libellé et ordre si besoin, et
  ne crée jamais de doublon (FR-003, SC-002).
- La suppression d'une rubrique portant des articles est refusée. Comme aucune suppression
  n'est exposée, la garantie est structurelle plutôt que défensive.

**Consommateurs** : la colonne de navigation, le menu de petit écran et le pied de page lisent
la **constante**, pas la table — une requête par page pour huit entrées invariables serait un
coût sans contrepartie.

---

## 2. Article — l'entité centrale

| Champ | Type | Obligatoire | Règle |
|---|---|---|---|
| `id` | texte | oui | `cuid()` |
| `titre` | texte | oui | ≤ 160 caractères. Stocké **sans préfixe** (FR-008, FR-008a) |
| `slug` | texte | oui | Unique sur toute la table. Dérivé du titre à défaut (FR-009) |
| `chapo` | texte | oui | ≤ 300 caractères (FR-008a) |
| `corps` | texte | oui | HTML **déjà assaini** au moment de l'écriture (FR-011) |
| `statut` | texte | oui | `brouillon` ou `publie`. Chaîne validée, jamais un enum de base (FR-010) |
| `publieLe` | date | **non** | Nulle tant que l'article n'a jamais été publié. En temps universel. Posée au premier passage à `publie`, puis figée (FR-014a) |
| `sousTheme` | texte | non | ≤ 40 caractères. Texte libre, sans référentiel (FR-007) |
| `auteur` | texte | non | Attribut textuel, sans relation vers `Compte` |
| `rubriqueId` | référence | oui | Vers `Rubrique`. Exactement une (FR-006) |
| `couvertureId` | référence | non | Vers `Media`. **Obligatoire dès que `statut = publie`** (FR-014) |
| `couvertureAlt` | texte | non | Idem : obligatoire et non vide dès que publié (FR-014) |
| `rangUne` | entier | non | 1 à 5, **unique**. `null` = hors Une (FR-015, FR-016) |
| `creeLe` / `modifieLe` | date | oui | Tenues par l'ORM |

**Règles de validation :**

- `slug` est unique **par contrainte de base**, pas seulement par vérification préalable : deux
  écritures concurrentes ne doivent pas pouvoir passer toutes les deux (cas limite de la spec).
- La dérivation du slug retire les diacritiques, minusculise, remplace tout caractère non
  alphanumérique par un tiret, compacte et élague. Sortie vide ⇒ repli `article`. Collision ⇒
  suffixe numérique décidé **en base, dans la transaction d'insertion** (research.md D17).
- `couvertureId` et `couvertureAlt` forment un couple, exactement comme le contrat d'aperçu de
  Fondations : l'un sans l'autre est une erreur. Un `alt` vide est un défaut au sens du
  principe VIII, pas une valeur.
- Un brouillon **peut** être incomplet. C'est la publication qui exige la complétude — c'est la
  transition qui est contrôlée, pas l'état de repos.
- `publieLe` est **nulle** sur un article jamais publié. Une colonne `NOT NULL` obligerait à
  inventer une date pour chaque brouillon — soit une valeur fausse dans le seul champ que
  FR-014a interdit de redater. La nullité dit exactement ce qu'elle veut dire : cet article
  n'a pas de date de parution parce qu'il n'est jamais paru.
- `sousTheme` n'est ni normalisé, ni rapproché, ni indexé. Deux articles portant la même valeur
  ne sont liés par rien (FR-007, US5 scénario 4).

### États et transitions

| État | Visible du public | Peut être à la Une |
|---|---|---|
| `brouillon` | jamais | non |
| `publie`, `publieLe` à venir | pas encore | oui |
| `publie`, `publieLe` atteinte | oui | oui |

```text
brouillon --publier--> publie        (exige couverture + alt réels ; pose publieLe si absente)
publie    --depublier--> brouillon   (libère rangUne s'il y en a un)
publie    --republier--> publie      (publieLe INCHANGÉE — pas de remontée en tête)
```

La visibilité n'est pas un troisième état : c'est `statut = publie` **et** `publieLe` atteinte,
évalué à la lecture (FR-012). Un article devient donc visible sans qu'aucune écriture ne se
produise, du seul fait que le temps passe — propriété qui se teste en injectant l'instant
(research.md D9) plutôt qu'en attendant.

**Note de portabilité** : `rangUne` est `Int?` porteur d'un `@unique`. Le comportement des
valeurs nulles face à une contrainte d'unicité a été **mesuré identique** sur SQLite 3.51 et
PostgreSQL 18.4 (research.md D6). En revanche, l'ordre des nuls au tri est **opposé** entre les
deux moteurs : tout tri sur ce champ explicite `nulls: 'last'` (research.md D7).

---

## 3. Media — une clé, jamais une URL

| Champ | Type | Obligatoire | Règle |
|---|---|---|---|
| `id` | texte | oui | `cuid()` |
| `cle` | texte | oui | **Clé de stockage**, unique. Jamais une URL (FR-022, FR-023) |
| `largeur` | entier | oui | Pixels |
| `hauteur` | entier | oui | Pixels |
| `poids` | entier | oui | Octets |
| `altParDefaut` | texte | non | Proposition reprise à l'usage ; ne dispense pas du `alt` de l'article |
| `creeLe` | date | oui | |

**Règles de validation :**

- **Aucune colonne ne contient d'URL.** L'adresse d'affichage est calculée à la lecture par
  `Stockage.url(cle)` (FR-023, FR-024). La règle est vérifiée **automatiquement** — SC-006 —
  et non laissée à la vigilance.
- La suppression d'un média référencé par un article est refusée (`onDelete: Restrict`).
- Le fichier lui-même n'est pas géré ici : cette feature ne téléverse rien. Seule l'interface
  est posée (research.md D12).

**Consommateurs** : la couverture d'article, et plus tard les images de corps de texte.

---

## 4. Compte — représenté, pas encore employé

| Champ | Type | Obligatoire | Règle |
|---|---|---|---|
| `id` | texte | oui | `cuid()` |
| `identifiant` | texte | oui | Unique. Identifiant de connexion (FR-021) |
| `motDePasseHache` | texte | oui | argon2id. **Jamais retourné par une lecture** (research.md D11) |
| `nomAffichable` | texte | oui | |
| `creeLe` | date | oui | |

**Règles de validation :**

- Aucune opération de lecture exposée ne retourne `motDePasseHache`. La vérification est une
  fonction dédiée qui compare et rend un booléen — le contrat rend la fuite structurellement
  impossible, plutôt que simplement improbable.
- Aucun rôle différencié à ce stade. Le sujet se rouvre à la feature 003 si le besoin apparaît.
- L'authentification, les sessions et la fermeture des routes d'administration sont **hors
  périmètre**. Ce qui est livré, c'est la représentation.

---

## 5. Eyebrow — une règle d'affichage, jamais une colonne

Le libellé affiché au-dessus du titre d'une vignette n'est **pas stocké** (FR-020). Il se
calcule à partir de deux informations que l'article porte déjà, et d'un contexte fourni par
l'appelant.

| Entrée | Provenance |
|---|---|
| `rubriqueId` de l'article | l'article |
| `sousTheme` de l'article | l'article, facultatif |
| contexte de lecture | l'appelant : la rubrique où se trouve le lecteur, ou aucune |

```text
lecteur dans la rubrique de l'article ET sous-thème présent  --> le SOUS-THÈME
tout autre cas                                               --> le LIBELLÉ DE LA RUBRIQUE
```

**Règles de validation :**

- Trois cas de figure, tous testés (SC-005) : dans la rubrique avec sous-thème, hors rubrique
  avec sous-thème, sans sous-thème quel que soit le contexte.
- La fonction est **pure** : mêmes entrées, même sortie, aucun accès à la base. Elle vit dans
  `shared/utils/` et sert donc au serveur comme au client.
- Le titre n'est jamais préfixé par le résultat. La composition « Sous-thème : Titre » qu'on
  lit sur les maquettes est de l'affichage — la constitution v1.2.0 le pose désormais
  explicitement.

**Dette assumée pour la feature suivante** : `ArticleCard` accepte aujourd'hui
`rubrique: RubriqueId` et affiche son libellé. Il ne sait donc pas rendre un eyebrow
contextuel. Le composant devra recevoir un `eyebrow` déjà calculé — c'est une modification de
la feature « pages publiques », pas de celle-ci, qui ne livre aucune interface. La règle est
posée ici, son emploi viendra.

---

## Ce que cette feature ne modélise pas

- **Aucune session, aucun jeton, aucune trace de connexion.** Le compte existe, l'authentification
  n'existe pas (feature 003).
- **Aucune corbeille, aucun archivage, aucun historique de versions.** La suppression est
  définitive (FR-029).
- **Aucune table de sous-thèmes.** C'est un attribut textuel, et le rendre relationnel créerait
  précisément le lien entre articles homonymes que la spécification interdit.
- **Aucun compteur de vues, aucune donnée d'audience, aucun média de corps de texte.**
- **Aucune donnée de recherche ni d'indexation.** Et research.md D8 explique pourquoi elle ne
  pourra pas s'écrire naïvement le moment venu : `LIKE` et le tri des accents divergent entre
  les deux moteurs.
