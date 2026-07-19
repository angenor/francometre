# Recherche — Phase 0 — Modèle et données

**Feature** : [spec.md](./spec.md) · **Date** : 2026-07-19

Cette feature est la première à persister quoi que ce soit. Les portes 9, 10, 11 et 12 de la
constitution, déclarées sans objet par Fondations, deviennent ici des contrôles réels. La
recherche a donc porté d'abord sur ce qui les met en danger : le schéma, la frontière du
stockage, l'assainissement, et surtout la portabilité SQLite → PostgreSQL, qui est un
objectif tenu **à tout moment** et non une intention à honorer le jour de la migration.

Deux avertissements de méthode. D'une part, Prisma 7 rompt franchement avec les versions
antérieures : presque tout ce qu'on lit en ligne sur `PrismaClient` décrit la version 6 ou
antérieure. Chaque affirmation portant sur l'API a été vérifiée dans les fichiers `.d.ts` des
paquets réellement publiés en 7.8.0, pas dans la documentation générale ni de mémoire.
D'autre part, les divergences entre SQLite et PostgreSQL ont été **mesurées en exécutant le
même SQL sur les deux moteurs** (SQLite 3.51.0, PostgreSQL 18.4), parce que c'est précisément
le genre de sujet où une conviction raisonnable se révèle fausse.

---

## D1 — Prisma 7.8 sur SQLite, avec l'objectif PostgreSQL tenu dès maintenant

**Décision** : Prisma 7.8.0, source de données SQLite, adaptateur `@prisma/adapter-better-sqlite3`.
Le schéma n'emploie que ce qui existe **à l'identique** sur les deux moteurs.

**Justification** : la contrainte n'est pas « migrer un jour », c'est « migrer sans toucher au
code métier » (principe VI). Ce qui la met en danger n'est pas le choix de l'ORM mais les
petites divergences de comportement entre moteurs, invisibles en développement et visibles en
production. Elles sont l'objet de D6, D7 et D8, qui sont les décisions les plus importantes
de ce document.

### Versions épinglées

Relevées le 2026-07-19 par `npm view <paquet> version` — **pas de mémoire, mesure**.

| Paquet | Version | Rôle |
|---|---|---|
| `prisma` | 7.8.0 | CLI, migrations, génération |
| `@prisma/client` | 7.8.0 | Client, à la version exacte du CLI |
| `@prisma/adapter-better-sqlite3` | 7.8.0 | Adaptateur — **obligatoire**, voir D3 |
| `zod` | 4.4.3 | Validation de toute entrée d'écriture (FR-026) |
| `sanitize-html` | 2.17.6 | Assainissement serveur du corps riche (FR-011, porte 11) |
| `argon2` | 0.45.0 | Hachage des secrets de compte (FR-021) |
| `dotenv` | — | **Requis** : Prisma 7 ne charge plus l'environnement (D4) |
| `vitest` | 4.1.10 | Premier runner unitaire du projet (D14) |
| `better-sqlite3` | 12.11.1 | En `devDependency` **seulement**, pour les tests (D3, D14) |

**Note importante sur Prisma 7** : le moteur de requête Rust a disparu — plus de binaire
`query-engine-*` à embarquer, ce qui était l'écueil classique des versions ≤ 6 face aux
bundlers. Il est remplacé par un compilateur WASM livré **encodé en base64 dans un `.mjs`** et
décodé au démarrage. Pour Nitro et Rollup, ce n'est donc que du JavaScript : `nitro.experimental.wasm`
**n'est pas nécessaire**, contrairement à ce qu'on pourrait déduire du mot « WASM ». Le risque
de bundling est ailleurs, et il est réel — voir D15.

**Écarté** : Drizzle (excellent sur la portabilité, mais le projet n'a pas de raison de payer
la réécriture des habitudes Prisma que `CLAUDE.md` fixe déjà) ; un accès SQL direct (rendrait
la migration PostgreSQL entièrement manuelle, à rebours du principe VI) ; PostgreSQL dès
maintenant (la spécification demande un démarrage sans service externe, et c'est justement la
portabilité qui rend ce report sans risque).

---

## D2 — Le client généré vit hors de `server/`, et c'est structurant

**Décision** *(vérifié dans les `.d.ts` de `prisma@7.8.0`)* : générateur `prisma-client`,
sortie dans `prisma/generated/`, dossier **ignoré par Git**.

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../prisma/generated"
  runtime      = "nodejs"
  moduleFormat = "esm"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**Justification** : `output` est **obligatoire** en Prisma 7 — ce n'est plus une commodité, le
générateur échoue sans lui. Le provider est `prisma-client` et non `prisma-client-js` ;
l'ancien nom produit une erreur, pas un avertissement.

**Piège à éviter** : ne **jamais** générer sous `server/utils/`. Nitro auto-importe
récursivement ce répertoire ; y déverser un client généré exposerait des centaines de symboles
en auto-import global, avec des collisions de noms garanties le jour où une entité s'appellera
comme un utilitaire. La sortie est donc à la racine, sous `prisma/`, et s'importe par chemin
explicite.

**Conséquence** : `prisma/generated/` entre dans `.gitignore`, et `prisma generate` doit tourner
après chaque installation. Le script `postinstall` existant (`nuxt prepare`) devient
`prisma generate && nuxt prepare` — dans cet ordre, parce que `nuxt prepare` construit les types
et gagne à trouver le client déjà généré.

`moduleFormat = "esm"` est inférable du `"type": "module"` déjà présent dans `package.json` ;
il est déclaré explicitement parce qu'un fichier de schéma se lit sans le `package.json` sous
les yeux.

---

## D3 — L'adaptateur est obligatoire, et sa classe ne s'écrit pas comme on le croit

**Décision** *(vérifié dans le `.d.ts` réel de `@prisma/adapter-better-sqlite3@7.8.0`)* :

```ts
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL!,
  timestampFormat: 'iso8601',
})
const prisma = new PrismaClient({ adapter })
```

**Justification** : en Prisma 7, `new PrismaClient()` **sans adaptateur échoue**. Ce n'est pas
un réglage, c'est le nouveau contrat.

Trois faits mesurés, contraires à ce qu'on suppose spontanément :

1. **La classe s'appelle `PrismaBetterSqlite3`**, avec `Sqlite` et non `SQLite`. La graphie
   naturelle produit une erreur d'import que TypeScript signale, mais qui fait perdre un temps
   absurde si on la lit trop vite.
2. **`better-sqlite3` est une vraie dépendance de l'adaptateur** (`^12.6.0`), pas une
   *peer dependency*. Il ne faut donc **pas** l'installer pour faire tourner l'application.
   Il est ajouté en `devDependency` pour une seule raison : les tests ont besoin d'ouvrir une
   base en direct pour y appliquer le schéma (D14).
3. **Le constructeur ne prend qu'une URL, jamais un objet `Database` déjà ouvert.** Cette
   limite est sans conséquence en production et décisive en test — c'est elle qui interdit
   `:memory:` (D14).

**Rappel de configuration** : `timestampFormat` est figé à `'iso8601'` dès maintenant. SQLite
n'a pas de type date natif ; l'adaptateur peut écrire un entier epoch ou une chaîne ISO. Laisser
la valeur par défaut implicite, c'est accepter qu'une base relue après migration soit ambiguë.
Le choix ISO se lit à l'œil nu dans un client SQL, ce qui a de la valeur pour un contenu
éditorial daté.

---

## D4 — La configuration migre dans `prisma.config.ts`, l'environnement ne se charge plus seul

**Décision** *(vérifié : `prisma@7.8.0` expose `./config` dans son `exports`)* :

```ts
// prisma.config.ts
import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'node --experimental-strip-types prisma/seed.ts',
  },
  datasource: { url: env('DATABASE_URL') },
})
```

**Note de chemin** : l'import se fait depuis **`prisma/config`**, pas `@prisma/config`. Le
sous-chemin réexporte `defineConfig` et `env` depuis le paquet interne, et l'emprunter évite
d'ajouter une dépendance directe qu'il faudrait maintenir alignée.

**Piège à éviter** : Prisma 7 **ne charge plus `.env` implicitement**. Sans la première ligne,
`DATABASE_URL` est indéfinie et l'échec survient loin de sa cause. `dotenv` est donc une
dépendance à installer, pas un acquis.

**Conséquence** : la clé `prisma.seed` de `package.json` n'est plus lue. Le seed se déclare dans
`migrations.seed` ci-dessus et se lance toujours par `npx prisma db seed` — il tourne aussi
automatiquement après `prisma migrate reset`, ce dont FR-028 et la vérification de rejouabilité
(SC-002) tirent parti.

---

## D5 — Les huit rubriques ont déjà une source ; la base en est le reflet, pas l'original

**Décision** : `app/utils/rubriques.ts` est **déplacé** vers `shared/utils/rubriques.ts`. Il reste
la définition unique des huit rubriques. La table `Rubrique` est alimentée **à partir de lui**
par le seed, et n'existe que pour porter les clés étrangères.

**Justification** : Fondations a posé ce fichier comme « la définition UNIQUE du projet », et la
colonne de navigation, le menu de petit écran et le pied de page le consomment déjà. Créer une
table qui redéfinirait les mêmes libellés donnerait deux sources de vérité pour une donnée que
la constitution qualifie d'invariable — exactement ce que le principe II proscrit. Une neuvième
rubrique doit continuer de s'ajouter **à un seul endroit**.

Le dossier `shared/` est le bon emplacement : Nuxt 4.4.8 le prend en charge (`sharedDir`,
`sharedImports` — vérifié dans `node_modules/nuxt/dist/index.mjs`) et le rend accessible aux
deux côtés, alors qu'`app/utils/` ne sert que le client.

**Réserve importante** : le fichier actuel se termine par une augmentation de module
`declare module 'vue-router'`, qui n'a rien à faire côté serveur. Le déplacement **scinde** le
fichier : la donnée et les types vont dans `shared/utils/rubriques.ts`, l'augmentation de
`RouteMeta` reste côté application. Les imports existants ne changent pas de forme — l'auto-import
couvre les deux dossiers — mais le déplacement doit être vérifié par la suite de tests de
Fondations, qui touche la navigation.

**Écarté** : dupliquer la liste côté serveur (deux sources, dérive garantie) ; lire les rubriques
en base à chaque rendu du rail (une requête sur chaque page pour une constante de huit entrées) ;
supprimer la table et poser l'identifiant de rubrique en texte libre sur l'article (perte de
l'intégrité référentielle, et le principe VI ne l'exige pas).

---

## D6 — Le rang de Une : unicité sur colonne nullable, **portable, vérifié sur les deux moteurs**

**Décision** *(mesuré, pas déduit)* : le rang de Une est `rangUne Int? @unique` — une colonne
entière optionnelle, porteuse d'une contrainte d'unicité.

**Justification** : c'était le risque principal du plan. Une contrainte `UNIQUE` sur une colonne
qui vaut `NULL` pour la quasi-totalité des lignes est le genre de construction dont le
comportement varie d'un moteur à l'autre. Le même SQL a donc été exécuté réellement sur les deux :

```sql
CREATE TABLE "Article" (id TEXT PRIMARY KEY, rang INTEGER UNIQUE);
INSERT INTO "Article" VALUES ('a',1),('b',2),('c',NULL),('d',NULL),('e',NULL);
```

| | SQLite 3.51.0 | PostgreSQL 18.4 |
|---|---|---|
| Trois `NULL` dans une colonne `UNIQUE` | **5 lignes insérées** | **5 lignes insérées** |
| Doublon non nul (`rang = 1` bis) | rejeté (erreur 19) | rejeté (`duplicate key`) |

**Comportement identique**, conforme au standard : `NULL` n'étant jamais égal à `NULL`, les
valeurs nulles échappent à la contrainte. La porte 9 passe sans réserve sur ce point, et la
migration ne demandera aucune adaptation.

**Limite assumée — ce que la contrainte ne garantit pas.** L'unicité empêche deux articles au
rang 3. Elle n'empêche **ni un trou** (1, 2, 4, 5) **ni un rang hors de 1–5**. L'invariant
« cinq rangs, contigus, dans l'intervalle » relève de la validation Zod et d'une transaction
applicative (D13), jamais du schéma. Le confondre avec la contrainte d'unicité serait une
erreur de raisonnement : SC-004 porte sur l'absence de doublon, FR-015 sur l'intervalle, et ce
sont deux garanties de nature différente.

**Éviction (FR-016a)** : assigner un rang occupé libère l'occupant. L'opération s'exécute dans
**une transaction** — libérer puis assigner. Sans transaction, l'unicité rejetterait l'écriture
au moment où deux articles portent brièvement le même rang, ou pire, laisserait la Une trouée
si la seconde écriture échouait.

**Écarté** : une table `Une` séparée à cinq lignes (plus juste conceptuellement, mais elle
déplace le problème sans le résoudre et ajoute une jointure à l'écran le plus consulté du site) ;
un entier non nul avec `0` pour « hors Une » (rend l'intervalle 1–5 indissociable d'une valeur
sentinelle, et interdit l'unicité).

---

## D7 — L'ordre des `NULL` est **opposé** entre les deux moteurs — le piège le plus dangereux

**Décision** *(mesuré)* : **tout** tri portant sur une colonne optionnelle explicite sa place
des nuls. Pour la Une :

```ts
orderBy: { rangUne: { sort: 'asc', nulls: 'last' } }
```

**Justification** : c'est la divergence la plus sournoise rencontrée, et elle touche directement
la colonne la plus visible du site.

| `ORDER BY rang ASC` | SQLite | PostgreSQL |
|---|---|---|
| | `NULL, NULL, 1, 2, 3` | `1, 2, 3, NULL, NULL` |
| `ORDER BY rang DESC` | `3, 2, 1, NULL, NULL` | `NULL, NULL, 3, 2, 1` |

SQLite place les nuls **en tête** en ordre croissant, PostgreSQL **en queue**. Un
`orderBy: { rangUne: 'asc' }` qui donne une Une parfaitement correcte en développement
retournerait, après migration, **tous les articles hors Une d'abord**. Le défaut ne se
manifesterait ni à la compilation, ni aux tests s'ils tournent sur SQLite : uniquement en
production, sur la page d'accueil.

`nulls` est disponible depuis Prisma 4.16, **sur SQLite comme sur PostgreSQL**, et s'applique
aux scalaires optionnels — ce qui est exactement le cas ici. Sur un champ non optionnel il
lèverait `P2009`.

**Règle de frontière** : la lecture de la Une filtre de toute façon `rangUne: { not: null }`
(FR-018), ce qui rend le tri insensible aux nuls. Le `nulls: 'last'` est conservé malgré tout,
comme ceinture et bretelles : le jour où quelqu'un réutilisera ce tri sans le filtre, le
comportement restera juste. C'est une décision de robustesse, pas une nécessité logique.

---

## D8 — Ne pas trier les titres en base, et se passer de `mode: 'insensitive'`

**Décision** *(mesuré)* : aucun tri alphabétique n'est délégué à la base. Aucune recherche ne
s'appuie sur `LIKE` ni sur `mode: 'insensitive'`.

**Justification** : deux mesures, toutes deux disqualifiantes pour un site francophone.

**Tri des chaînes accentuées.** Sur le jeu `('Zebre', 'Ecole', 'Élan', 'avion', 'Être')` :

- SQLite, collation `BINARY` : `Ecole, Zebre, avion, Élan, Être` — les majuscules avant les
  minuscules, les accents rejetés en fin.
- PostgreSQL, collation `en_US.utf8` : `avion, Ecole, Élan, Être, Zebre` — ordre linguistique.

L'écart se voit à l'œil nu sur n'importe quelle liste. SQLite n'a pas de collation linguistique
intégrée : ce n'est pas un réglage à trouver, c'est une capacité absente. Un tri par titre se
fait donc **côté application**, avec `Intl.Collator('fr')`. Les tris que cette feature expose
portent sur la date de publication et le rang de Une, où la question ne se pose pas.

**Sensibilité à la casse.** `WHERE slug LIKE 'lynx'` sur `('Lynx', 'lynx')` retourne **2**
résultats en SQLite et **1** en PostgreSQL. Le `mode: 'insensitive'` de Prisma, qui corrigerait
l'asymétrie, **n'existe pas sur SQLite** : il ne peut donc pas servir de socle commun. L'égalité
stricte `=`, elle, est sensible à la casse sur les deux moteurs (vérifié) — c'est sur elle que
reposent les recherches par identifiant d'URL, qui sont les seules de cette feature.

**Conséquence pour plus tard** : la recherche plein texte, hors périmètre ici, ne pourra pas
s'écrire une fois pour les deux moteurs. Elle devra être conçue en connaissant cette limite,
pas en la découvrant.

**Note de production** : les résultats PostgreSQL ci-dessus valent pour `en_US.utf8`. Une base
créée en collation `C` trierait comme SQLite. **La collation doit être figée à la création de
la base de production**, sinon le tri dépendra de l'hébergeur — une variable qu'il vaut mieux
ne pas laisser flotter.

---

## D9 — Le critère de visibilité publique, écrit une seule fois

**Décision** : un unique fragment de filtre exporté, jamais recopié.

```ts
// server/utils/visibilite.ts
export function filtreVisible(maintenant = new Date()) {
  return { statut: 'publie', publieLe: { lte: maintenant } } as const
}
```

**Justification** : FR-012 l'impose, mais la vraie raison est qu'une règle de visibilité
recopiée est une fuite de brouillon en puissance. Trois chemins de lecture différents
(SC-003) doivent produire le même résultat ; la seule garantie mécanique est qu'ils partagent
la même expression.

L'instant est **injectable**. Sans cela, tester qu'un article daté du futur devient visible
lorsque sa date est atteinte (US3, scénario 3) supposerait d'attendre réellement, ou de
manipuler l'horloge du système. Le paramètre par défaut préserve l'ergonomie du cas courant.

**Piège à éviter** : la comparaison est `lte`, pas `lt`. Un article dont la date de publication
vaut exactement l'instant courant est **visible** — c'est le cas limite explicitement tranché
par la spécification, et il se teste.

---

## D10 — L'assainissement est une opération d'écriture, pas de lecture

**Décision** : `sanitize-html` 2.17.6, liste blanche stricte, appliqué **côté serveur avant
stockage**, dans la couche de validation.

**Justification** : le principe VII et la porte 11 l'exigent, et la formulation compte : « avant
stockage ». Assainir à l'affichage laisserait du HTML hostile en base, où il attendrait le
premier consommateur négligent — un flux, une exportation, un futur écran d'aperçu. La base ne
contient donc que du HTML déjà sûr.

Liste blanche retenue, alignée sur ce que TipTap produira à la feature 004 :

| Catégorie | Balises |
|---|---|
| Structure | `p`, `br`, `blockquote`, `ul`, `ol`, `li` |
| Titres | `h2`, `h3` |
| Enrichissement | `strong`, `em`, `a` |
| Média | `figure`, `figcaption`, `img` |

`h1` est **absent** délibérément : le titre de la page est le titre de l'article, un second
`h1` dans le corps casserait la hiérarchie de titres que le principe VIII impose. Les attributs
sont restreints à `href`/`title` sur `a` et `src`/`alt` sur `img` ; les schémas d'URL à
`http`, `https` et `mailto`. Tout attribut d'événement, tout `style`, tout `script` disparaît
sans que la balise porteuse soit conservée.

**Limite assumée** : la liste sera peut-être à ajuster quand l'éditeur existera. C'est un
élargissement à décider explicitement à la feature 004, jamais un contournement à improviser
dans un cas particulier.

---

## D11 — Les secrets de compte : argon2, et rien d'autre en base

**Décision** : `argon2` 0.45.0, variante `argon2id`, paramètres par défaut de la bibliothèque.

**Justification** : `CLAUDE.md` le fixe déjà. Le point qui relève de cette feature est ailleurs :
le champ stocké s'appelle `motDePasseHache` et **aucune opération de lecture exposée ne le
retourne**. Le contrat de service renvoie des comptes sans ce champ, de sorte qu'un secret ne
puisse pas fuiter par mégarde dans une réponse — la vérification du mot de passe est une
fonction dédiée qui compare et retourne un booléen, sans jamais rendre l'empreinte.

L'authentification elle-même reste hors périmètre (feature 003). Ce qui est livré ici, c'est la
représentation et l'impossibilité structurelle d'une fuite.

---

## D12 — Une seule porte vers le stockage, et la base n'y range que des clés

**Décision** : une interface `Stockage` à quatre opérations — `put`, `get`, `delete`, `url` —
avec une implémentation disque, sélectionnée par variable d'environnement.

**Justification** : porte 9. La règle « aucune URL de média en base » n'est pas une convention de
nommage, c'est ce qui rend la bascule vers S3 indolore : une URL persistée serait fausse le jour
du changement d'hébergement, sur toute la profondeur de l'historique. La base ne connaît que des
**clés de stockage** — vocabulaire déjà figé par le `data-model.md` de Fondations, et repris tel
quel.

`url(cle)` calcule l'adresse **à la lecture**. C'est la seule fonction qui sait ce qu'est une
URL, et rien d'autre dans le code n'a le droit d'en fabriquer une.

**Conséquence vérifiable** : SC-006 demande qu'aucune chaîne ressemblant à une URL ne figure
dans les colonnes de médias. Le contrôle est **automatisable** et rejoint `scripts/verifier.mjs`,
qui mécanise déjà trois portes de la constitution. Une porte contrôlée par un script vaut mieux
qu'une porte contrôlée par la vigilance.

**Écarté** : le module `storage` de Nitro (`useStorage`), séduisant parce qu'il est déjà là,
mais son abstraction porte sur des paires clé-valeur et non sur des fichiers binaires avec
métadonnées ; l'interface resterait à écrire par-dessus. À réévaluer à la feature qui
implémentera le téléversement.

---

## D13 — Zod à la frontière, et les invariants que le schéma ne sait pas exprimer

**Décision** : Zod 4.4.3 valide **toute** entrée d'écriture ; les invariants inexprimables en
schéma sont portés par la couche service, dans des transactions.

**Justification** : le principe VI interdit les `enum` portés par la base, ce qui déplace
mécaniquement la contrainte vers le code. `statut` est une colonne texte : rien, au niveau de la
base, n'empêche d'y écrire `'brouyon'`. C'est Zod qui l'empêche, et c'est pourquoi FR-026 exige
que la validation précède tout enregistrement.

Quatre invariants ne peuvent pas être délégués au schéma et vivent donc dans le service :

| Invariant | Exigence | Pourquoi pas le schéma |
|---|---|---|
| Rang dans 1–5 | FR-015 | Aucune contrainte `CHECK` exprimable en Prisma |
| À la Une ⇒ publié | FR-017 | Contrainte inter-colonnes |
| Publié ⇒ couverture et `alt` réels | FR-014 | Contrainte conditionnelle |
| Éviction atomique du rang | FR-016a | Deux écritures, une seule opération logique |

**Un point de vigilance** : ces quatre invariants sont exactement ceux qu'un accès direct à
Prisma contournerait. C'est la raison pour laquelle aucune route, aucun composant, aucun script
n'appelle `prisma.article.update` directement — tout passe par le service. La règle est déjà
posée par `CLAUDE.md` (« jamais d'accès Prisma depuis un composant client ») ; elle est ici
étendue au serveur lui-même.

---

## D14 — Vitest, premier runner unitaire du projet, et une base par fichier de test

**Décision** : Vitest 4.1.10. Chaque fichier de test ouvre **sa** base SQLite, dans un dossier
temporaire.

**Justification** : Fondations a écarté explicitement toute couche de test unitaire — c'était
juste pour une feature qui ne livrait que du rendu, entièrement vérifiable de bout en bout par
Playwright. Ici, la situation s'inverse : la spécification demande de prouver des règles
« par des appels programmatiques testés, sans interface » (FR-025). Passer par un navigateur
pour vérifier qu'un brouillon reste invisible serait un détour coûteux et moins probant.
Playwright reste en place pour ce qu'il fait bien ; Vitest s'ajoute, il ne le remplace pas.

**Réserve importante — `:memory:` est inutilisable**, pour deux raisons dont la seconde est
rédhibitoire :

1. Le CLI Prisma est un autre processus : une base en mémoire y vivrait et mourrait avec lui.
2. **Le constructeur de l'adaptateur ne prend qu'une URL** (D3). Chaque ouverture de `:memory:`
   crée une base privée et distincte ; il n'existe aucun moyen d'ouvrir une connexion, d'y
   appliquer le schéma, puis d'y brancher Prisma. L'échappatoire habituelle
   (`file:memdb?mode=memory&cache=shared`) n'est pas documentée par better-sqlite3.

D'où le fichier temporaire par fichier de test, via `mkdtempSync` — l'unicité est garantie par
la fonction elle-même, sans avoir à composer un identifiant de worker.

**Application du schéma** : par **concaténation des `prisma/migrations/*/migration.sql`** dans
l'ordre lexical, qui est l'ordre chronologique. C'est exactement ce que `migrate deploy`
appliquerait.

**Écarté, et pourquoi c'est important** : `prisma migrate diff --from-empty` dérive le SQL du
*datamodel* et non des migrations ; il **divergerait silencieusement** le jour où une migration
contiendrait du SQL édité à la main. Tester contre un schéma qui n'est pas celui de production
est pire que ne pas tester. L'API programmatique `@prisma/migrate` est écartée aussi : le paquet
déclare `"exports": null` et se documente comme interne, donc sans garantie de stabilité.

**Piège à éviter** : ni `db push` ni `migrate deploy` n'acceptent `--url` en Prisma 7. Les seuls
leviers sont `DATABASE_URL` dans l'environnement ou `--config`.

**Écarté également** : le rollback par transaction entre tests — Prisma n'expose pas de
`$rollback`, et le motif obligerait tout le code métier à accepter un client transactionnel
injecté. Le nettoyage se fait par `DELETE` sur les tables, `PRAGMA foreign_keys` désactivé le
temps de l'opération. `@quramy/prisma-fabbrica` a été examiné et rejeté : il déclare
`"@prisma/client": "^5 || ^6"`, donc incompatible.

---

## D15 — Le vrai risque de compilation : le binaire natif, pas le WASM

**Décision** : externaliser explicitement `better-sqlite3` et forcer son traçage.

```ts
nitro: {
  externals: {
    external: ['better-sqlite3', '@prisma/adapter-better-sqlite3'],
    traceInclude: ['better-sqlite3'],
  },
}
```

**Justification** : `better-sqlite3` est un module natif qui localise son binaire `.node` via le
paquet `bindings`, par une résolution **dynamique** que l'analyse statique de `node-file-trace`
rate régulièrement. Le symptôme est connu : `Could not locate the bindings file`, au démarrage
du serveur compilé et non à la compilation.

**Note de version** : la documentation `nitro.build/config` décrit **Nitro v3**. Nuxt 4.4.8
embarque **nitropack 2.13.4** — vérifié dans `node_modules`. Les options `noExternals` et
`traceDeps` qu'on y lit **n'existent pas** en 2.13.4 ; l'interface réelle est `inline`,
`external`, `traceInclude`. Toute recette copiée de cette page est à traduire avant usage.

**Ce qu'il ne faut pas faire** : inliner l'adaptateur (on n'inline pas un binding natif) ;
activer `nitro.experimental.wasm` (inutile, voir D1) ; toucher à `moduleSideEffects` ou à la
configuration Rollup (aucune recommandation documentée ; les réglages qu'on croise en ligne
répondent à d'autres problèmes).

**Une garantie qui reste à prouver par le test, pas à croire sur parole** : une compilation qui
réussit ne démontre rien ici, puisque la défaillance est au runtime. La vérification est donc
en deux temps, et elle est obligatoire avant de clore la feature :

```bash
npm run build
ls .output/server/node_modules/better-sqlite3/build/Release/*.node   # le binaire est-il là ?
node .output/server/index.mjs                                        # démarre-t-il vraiment ?
```

C'est le même raisonnement que Fondations a appliqué au flash de thème : un module qui annonce
résoudre un problème et un serveur qui démarre sont deux affirmations distinctes.

---

## D16 — Le singleton de client, et la seule vraie raison de s'en soucier

**Décision** : un client unique dans `server/utils/db.ts`, mémorisé sur `globalThis` en
développement uniquement.

```ts
const global_ = globalThis as unknown as { prisma?: ReturnType<typeof creerClient> }
export const prisma = global_.prisma ?? creerClient()
if (import.meta.dev) global_.prisma = prisma
```

**Justification** : le rechargement à chaud réévalue les modules serveur et créerait un client
par rechargement, chacun gardant sa connexion ouverte. `import.meta.dev` plutôt que
`process.env.NODE_ENV` : Nuxt le remplace statiquement, donc la branche disparaît entièrement
du bundle de production au lieu d'y subsister en test mort.

Aucun plugin Nitro : `server/utils/` est auto-importé, et il n'y a aucune initialisation
asynchrone à ordonnancer.

**Note sur la fermeture propre** : l'issue nitro#4015 (« node-server n'appelle jamais `close` »)
concerne **Nitro v3**. En 2.13.4, `setupGracefulShutdown` appelle bien le hook `close` sur
SIGTERM et SIGINT. Avec SQLite en processus, l'enjeu est mince — il n'y a pas de pool distant à
drainer — mais le hook est branché quand même, par hygiène et parce que PostgreSQL, lui, en
tirera parti.

---

## D17 — Décisions mineures

- **Identifiants** : `cuid()`, produits par l'application (principe VI, pas d'auto-increment).
- **Dérivation de l'identifiant d'URL** : minuscules, diacritiques retirés par normalisation
  `NFD`, tout ce qui n'est ni lettre ni chiffre remplacé par un tiret, tirets compactés et
  élagués. Chaîne vide en sortie ⇒ repli `article`. Collision ⇒ suffixe `-2`, `-3`… décidé par
  **relecture en base** dans la même transaction que l'insertion, jamais par un compteur en
  mémoire.
- **Dates** : toutes en temps universel. Le rendu en heure de Paris est déjà le fait de la Card
  (Fondations), et cette feature ne le refait pas.
- **Auteur** : attribut texte de l'article, sans relation vers `Compte` — signer n'est pas se
  connecter (hypothèse de la spécification).
- **Suppression de média** : refusée tant qu'un article le référence, par `onDelete: Restrict`.
  Le fichier lui-même n'est pas supprimé par cette feature : il n'y a pas encore de téléversement.
- **`chapo`** : le champ est nommé sans accent circonflexe, comme les autres identifiants du
  code, tandis que l'interface écrit « chapô ». Le code est sans diacritiques, les contenus ne
  le sont jamais.

---

## Inconnues restantes

Trois points ne seront tranchés que par l'implémentation, et sont **assumés comme tels** :

1. **La combinaison Nuxt 4.4 + Nitro 2.13 + Prisma 7 + adaptateur better-sqlite3 n'est
   documentée nulle part.** Le guide Prisma pour Nuxt cible PostgreSQL. Le `traceInclude` de D15
   est une précaution raisonnée, pas une recette validée ; son efficacité se mesure au premier
   `node .output/server/index.mjs`, et pas avant.
2. **La forme de l'URL pour un chemin absolu** n'est pas spécifiée par l'adaptateur 7.8. Les
   exemples emploient le préfixe `file:` ; le traitement d'un chemin nu est à vérifier au premier
   essai plutôt qu'à supposer.
3. **L'option de générateur `compilerBuild`** (`fast` / `small`, annoncée en 7.3.0) n'apparaît
   pas dans le tableau de référence. Elle n'est pas employée tant que son statut n'est pas confirmé.

**Vérifié le 2026-07-19 sur la documentation officielle et sur les paquets publiés :**

- <https://www.prisma.io/docs/orm/reference/prisma-config-reference> — forme de `prisma.config.ts`,
  champs `schema`, `migrations.seed`, `datasource.url`.
- <https://www.prisma.io/docs/orm/prisma-schema/overview/generators> — `provider = "prisma-client"`,
  `output` obligatoire, `runtime`, `moduleFormat`.
- <https://www.prisma.io/docs/orm/overview/databases/sqlite> — adaptateur, forme du constructeur.
- <https://www.prisma.io/docs/orm/prisma-client/queries/case-sensitivity> — `mode: 'insensitive'`
  absent de SQLite.
- <https://www.prisma.io/docs/orm/prisma-client/queries/filtering-and-sorting> — `nulls: 'first' | 'last'`.
- <https://www.prisma.io/docs/guides/testing> — n'offre que du mock sous Jest ; rien de réutilisable.
- Fichiers `.d.ts` de `prisma@7.8.0`, `@prisma/client@7.8.0` et
  `@prisma/adapter-better-sqlite3@7.8.0`, obtenus par `npm pack` — graphie `PrismaBetterSqlite3`,
  signature du constructeur, `better-sqlite3` en dépendance directe.
- `node_modules/nitropack/dist/` — interface `externals` réelle en 2.13.4, `setupGracefulShutdown`.
- `node_modules/nuxt/dist/index.mjs` — prise en charge de `shared/` (`sharedDir`, `sharedImports`).
- **Exécutions SQL réelles** sur SQLite 3.51.0 et PostgreSQL 18.4 — unicité sur colonne nullable,
  ordre des nuls, tri des chaînes accentuées, sensibilité de `LIKE` et de `=`.
