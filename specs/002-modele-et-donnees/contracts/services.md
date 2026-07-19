# Contrat — services de données

**Feature** : [../spec.md](../spec.md) · **Modèle** : [../data-model.md](../data-model.md) · **Date** : 2026-07-19

Cette feature n'expose aucune route HTTP : elle expose des **fonctions serveur**, appelées
plus tard par les routes Nitro des features suivantes. Ce document en fixe le contrat.

Règle générale : **ce qui n'est pas déclaré ici n'est pas un point d'entrée.** En particulier,
`prisma.article.update` et ses semblables ne sont appelés nulle part ailleurs que dans ces
services — c'est ce qui garantit les quatre invariants que le schéma ne sait pas exprimer
(research.md D13).

Toute fonction d'écriture valide son entrée par Zod **avant** d'atteindre la base (FR-026), et
lève une erreur explicite en cas de refus. Aucune ne tronque, aucune ne corrige en silence.

---

## `rubriques` — lecture seule

| Fonction | Entrée | Sortie |
|---|---|---|
| `listerRubriques()` | — | Les huit rubriques, par `ordre` croissant |
| `rubriqueParId(id)` | identifiant | La rubrique, ou `null` |

**Garanties**

- Exactement huit entrées, toujours dans l'ordre du rail (FR-001, FR-002).
- **Aucune fonction de création, de modification ou de suppression n'existe** (FR-004).
  L'ensemble n'est pas protégé par une vérification : il est figé par l'absence d'API.
- La source de vérité reste `shared/utils/rubriques.ts` ; ces fonctions lisent la table, qui en
  est le reflet (research.md D5).

---

## `articles` — lecture publique

Ces fonctions appliquent **toutes** le critère de visibilité (FR-012, FR-013). Il n'existe
aucun paramètre pour le désactiver : une fonction qui pourrait montrer un brouillon sur simple
argument serait une fuite en attente d'un appel négligent.

| Fonction | Entrée | Sortie |
|---|---|---|
| `listerArticlesPublics(options?)` | rubrique, pagination, instant | Articles visibles, plus récents d'abord |
| `articlePublicParSlug(slug)` | identifiant d'URL | L'article, ou `null` s'il n'est pas visible |
| `lireUne(instant?)` | instant | Les articles à la Une, **par rang croissant** |

**Garanties**

- Un brouillon, ou un article publié daté du futur, n'apparaît dans **aucune** de ces sorties —
  y compris la demande directe par slug, qui retourne `null` et non le contenu (FR-013, US3
  scénario 4).
- Le critère est **le même fragment de filtre** dans les trois cas, jamais réécrit (FR-012).
- L'instant est injectable, par défaut « maintenant ». C'est ce qui rend testable le passage
  d'un article daté du futur à l'état visible, sans manipuler l'horloge (research.md D9).
- La comparaison est inclusive : une date de publication égale à l'instant courant est visible.
- `lireUne` filtre `rangUne: { not: null }` et trie avec `nulls: 'last'` explicite — voir
  research.md D7 pour la raison, qui n'est pas cosmétique.

**Contrat d'appel** : ces fonctions sont les seules que les pages publiques auront le droit
d'employer. Une page qui aurait besoin de voir un brouillon relève de l'administration, donc
d'un autre contrat, fermé par défaut (principe VII).

---

## `articles` — écriture

| Fonction | Entrée | Sortie |
|---|---|---|
| `creerArticle(donnees)` | voir ci-dessous | L'article créé |
| `modifierArticle(id, donnees)` | idem, partiel | L'article modifié |
| `publierArticle(id, publieLe?)` | identifiant, date facultative | L'article publié |
| `depublierArticle(id)` | identifiant | L'article repassé en brouillon |
| `supprimerArticle(id)` | identifiant | — |

**Garanties**

- `corps` est **assaini avant stockage**, sur liste blanche stricte (FR-011, porte 11). Le HTML
  reçu n'est jamais tenu pour sûr, même venant d'un appel serveur.
- `slug` absent ⇒ dérivé du titre. Collision ⇒ suffixe distinctif, décidé dans la transaction
  d'insertion et non par une vérification préalable qui laisserait une fenêtre de concurrence
  (FR-009).
- `titre` > 160, `chapo` > 300 ou `sousTheme` > 40 caractères ⇒ **refus explicite**, jamais de
  troncature (FR-008a).
- `publierArticle` refuse si la couverture ou son texte alternatif manquent (FR-014). Sans date
  fournie, elle pose l'instant du passage ; sur un article déjà publié une première fois, elle
  **laisse `publieLe` inchangée** (FR-014a) — republier ne fait pas remonter un article en tête
  de liste.
- `depublierArticle` **libère le rang de Une** s'il y en a un (FR-017, US4 scénario 4).
- `supprimerArticle` est **refusée tant que l'article occupe un rang de Une** (FR-029). La
  suppression est définitive : ni corbeille, ni archivage.
- `rubriqueId` absent ou inconnu ⇒ refus (FR-006).

---

## `une` — composition

| Fonction | Entrée | Sortie |
|---|---|---|
| `placerALaUne(articleId, rang)` | identifiant, rang 1–5 | L'état de la Une après opération |
| `retirerDeLaUne(articleId)` | identifiant | idem |

**Garanties**

- Le rang est un entier de **1 à 5** ; hors de cet intervalle, refus (FR-015). L'intervalle est
  vérifié par Zod : aucune contrainte de base ne l'exprime (research.md D6).
- **Éviction** : placer un article sur un rang occupé déloge l'occupant, qui quitte la Une.
  L'opération réussit, elle n'échoue pas (FR-016a). Elle s'exécute **dans une transaction** —
  sans quoi la contrainte d'unicité rejetterait l'instant où deux articles portent le même rang.
- Aucun état intermédiaire à deux articles au même rang n'est observable (SC-004).
- Placer un brouillon à la Une est **refusé** (FR-017).
- L'unicité du rang est garantie par la **base** (`@unique`), pas seulement par le service :
  deux écritures concurrentes ne peuvent pas passer toutes les deux (FR-016).

**Limite explicite** : rien ne garantit que les cinq rangs soient tous pourvus. Un trou
(1, 2, 4, 5) est un état valide du modèle. C'est au back-office de le rendre visible ; ce n'est
pas un invariant de données, et le prétendre reviendrait à interdire tout état transitoire de
composition.

---

## `medias`

| Fonction | Entrée | Sortie |
|---|---|---|
| `enregistrerMedia(donnees)` | clé, largeur, hauteur, poids, alt facultatif | Le média |
| `mediaParId(id)` | identifiant | Le média, ou `null` |
| `supprimerMedia(id)` | identifiant | — |

**Garanties**

- L'entrée porte une **clé de stockage**. Une valeur ressemblant à une URL est **refusée à la
  validation** (FR-023) — le contrôle est actif, pas seulement documentaire.
- La sortie ne contient pas d'URL non plus. L'adresse s'obtient en passant la clé à
  `Stockage.url()` (voir [stockage.md](./stockage.md)).
- `supprimerMedia` est refusée tant qu'un article référence le média.

---

## `comptes`

| Fonction | Entrée | Sortie |
|---|---|---|
| `creerCompte(donnees)` | identifiant, mot de passe en clair, nom | Le compte, **sans l'empreinte** |
| `compteParIdentifiant(id)` | identifiant | Le compte, **sans l'empreinte**, ou `null` |
| `verifierMotDePasse(identifiant, motDePasse)` | — | booléen |

**Garanties**

- Le mot de passe est haché en argon2id **avant** d'atteindre la base. Aucun secret en clair,
  nulle part (FR-021).
- **Aucune de ces fonctions ne retourne `motDePasseHache`.** Le type de retour l'exclut : ce
  n'est pas une omission de politesse, c'est une impossibilité de contrat (research.md D11).
- `identifiant` est unique ; un doublon est refusé (US6 scénario 2).
- `verifierMotDePasse` rend un booléen et rien d'autre — ni le compte, ni l'empreinte, ni un
  message distinguant « compte inconnu » de « mot de passe faux ».

---

## `eyebrow` — fonction pure, partagée

| Fonction | Entrée | Sortie |
|---|---|---|
| `eyebrowDe(article, contexte?)` | l'article, la rubrique où se trouve le lecteur | Le libellé à afficher |

**Garanties**

- Sous-thème si le contexte est la rubrique de l'article **et** que le sous-thème existe ;
  libellé de rubrique dans tous les autres cas (FR-019).
- **Aucun accès à la base, aucune dépendance au serveur.** La fonction vit dans `shared/utils/`
  et sert des deux côtés.
- Le résultat n'est **jamais persisté** (FR-020).

---

## Ce qu'aucun de ces contrats n'expose

- **Aucune route HTTP.** Cette feature ne monte aucun point d'entrée réseau ; les routes Nitro
  viendront avec les pages publiques et le back-office, et s'appuieront sur ces fonctions.
- **Aucune fonction d'administration ouverte.** Les fonctions d'écriture existent, mais rien ne
  les expose au réseau — la fermeture par défaut du principe VII est ici obtenue par l'absence
  de route, ce qui est la forme la plus solide.
- **Aucun accès direct au client Prisma depuis l'extérieur de `server/services/`.**
