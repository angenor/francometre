# Tasks: Modèle et données

**Input**: documents de conception de `/specs/002-modele-et-donnees/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests** : **inclus, et non optionnels ici.** FR-025 exige des opérations « couvertes par des
tests automatisés », SC-009 demande une suite qui passe sur base vierge, et la feature ne livre
aucun écran : le test *est* le seul moyen de vérification. Les neuf fichiers de
`tests/unit/` sont ceux du tableau de `quickstart.md`.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable — fichier distinct, aucune dépendance sur une tâche inachevée
- **[Story]** : rattachement à une user story (US1 … US7)
- Chaque description porte un chemin de fichier exact

## Conventions de chemins

Projet Nuxt unique (décision de Fondations, non rediscutée). Racine du dépôt :
`prisma/`, `server/`, `shared/`, `tests/`, `scripts/`.

**Rappel structurant** : cette feature ne crée **aucun** `server/api/`. Aucune route HTTP n'est
montée — c'est ainsi que la porte 12 passe « par construction ».

---

## Phase 1 : Setup (infrastructure partagée)

**Objectif** : installer et configurer la chaîne Prisma 7 + Vitest sans encore écrire de modèle.

- [X] T001 Ajouter les dépendances de production dans `package.json` : `prisma@7.8.0`, `@prisma/client@7.8.0`, `@prisma/adapter-better-sqlite3@7.8.0`, `zod@4.4.3`, `sanitize-html@2.17.6`, `argon2@0.45.0`, `dotenv` — versions relevées par `npm view`, jamais de mémoire (plan.md « Primary Dependencies »)
- [X] T002 Ajouter les dépendances de développement dans `package.json` : `vitest@4.1.10`, `better-sqlite3@12.11.1` (**devDependency seule** — l'adaptateur l'embarque déjà, research D3), `@types/sanitize-html`
- [X] T003 [P] Créer `prisma.config.ts` à la racine : `import 'dotenv/config'` en **première ligne**, `defineConfig`/`env` importés depuis **`prisma/config`** (et non `@prisma/config`), `schema`, `migrations.path`, `migrations.seed = "node --experimental-strip-types prisma/seed.ts"`, `datasource.url` (research D4)
- [X] T004 [P] Créer `.env.example` avec `DATABASE_URL="file:./prisma/dev.db"` et `STOCKAGE="disque"`, puis le copier en `.env` local
- [X] T005 [P] Ajouter à `.gitignore` : `prisma/generated/`, `prisma/*.db`, `prisma/*.db-journal` — le client généré n'entre jamais dans Git (research D2)
- [X] T006 Modifier les scripts de `package.json` : `postinstall` devient `prisma generate && nuxt prepare` (dans cet ordre), ajouter `test:unit: "vitest run"` et `db:seed: "prisma db seed"`
- [X] T007 [P] Ajouter le bloc `nitro.externals` dans `nuxt.config.ts` : `external: ['better-sqlite3', '@prisma/adapter-better-sqlite3']`, `traceInclude: ['better-sqlite3']` — interface **nitropack 2.13.4**, pas Nitro v3 : ni `noExternals` ni `traceDeps` n'existent (research D15)
- [X] T008 [P] Créer `vitest.config.ts` : environnement `node`, inclusion `tests/unit/**/*.test.ts`, **exclusion explicite de `tests/e2e/`** pour que Playwright et Vitest ne se marchent pas dessus

---

## Phase 2 : Fondations (prérequis bloquants)

**Objectif** : le schéma, le client, l'interface de stockage et le harnais de test. **Aucune user
story ne peut démarrer avant.**

**⚠️ CRITIQUE** : rien de la Phase 3 et au-delà ne compile sans T010 et T012.

- [X] T009 Créer `prisma/schema.prisma` avec le bloc `generator client` (`provider = "prisma-client"` — **pas** `prisma-client-js` —, `output = "../prisma/generated"`, `runtime = "nodejs"`, `moduleFormat = "esm"`) et le bloc `datasource db` SQLite (research D2)
- [X] T010 Déclarer les cinq modèles dans `prisma/schema.prisma` selon [data-model.md](./data-model.md) : `Rubrique` (`id` texte repris de la constante, `libelle`, `ordre`), `Article` (dont `statut` en `String`, `publieLe DateTime?` — **nullable**, voir data-model.md §2 —, `rangUne Int? @unique`, `couvertureId`/`couvertureAlt`, `sousTheme`, `auteur`), `Media` (`cle @unique`, `largeur`, `hauteur`, `poids`, `altParDefaut`), `Compte` (`identifiant @unique`, `motDePasseHache`, `nomAffichable`) — identifiants en `cuid()`, relation `Media → Article` en `onDelete: Restrict`. **Aucun `enum`, aucun `Json`, aucune liste scalaire, aucun `autoincrement`, aucun `@db.`** (principe VI, porte 10)
- [X] T011 Générer la migration initiale : `npx prisma migrate dev --name initial` — le SQL produit sous `prisma/migrations/` devient **la** source du schéma appliqué en test (research D14)
- [X] T012 Créer `server/utils/db.ts` : instanciation via `new PrismaBetterSqlite3({ url, timestampFormat: 'iso8601' })` (graphie `Sqlite`, pas `SQLite`) passée à `new PrismaClient({ adapter })`, mémorisée sur `globalThis` **sous `import.meta.dev` uniquement** (research D3, D16)
- [X] T013 [P] Créer `server/utils/stockage.ts` : l'interface `Stockage` (`put` / `get` / `delete` / `url`), l'implémentation disque, et la sélection par variable d'environnement. **Seul fichier du projet autorisé à importer `node:fs`** ; `url()` est pure et synchrone (contracts/stockage.md §2, §3)
- [X] T014 Déplacer `app/utils/rubriques.ts` vers `shared/utils/rubriques.ts` et mettre à jour les imports de `app/components/ui/ArticleCard.vue`, `app/components/ui/RubriqueIcon.vue`, `app/components/layout/AppRail.vue`, `app/components/layout/AppTopbar.vue`, `app/components/layout/AppMenuPanel.vue`, `app/components/layout/AppFooter.vue`, `app/layouts/default.vue` — la définition reste **unique** et sert désormais les deux côtés (research D5)
- [X] T015 Créer `tests/unit/harnais.ts` : ouverture d'une base SQLite éphémère par fichier de test via `mkdtempSync`, application du schéma par **concaténation des `prisma/migrations/*/migration.sql` dans l'ordre lexical** (jamais `migrate diff --from-empty`, research D14), et nettoyage inter-tests par `DELETE` avec `PRAGMA foreign_keys` désactivé le temps de l'opération
- [X] T016 Vérifier que `npx prisma generate` réussit et que `npm run typecheck` passe avec le client généré importé depuis `server/utils/db.ts`

**Point de contrôle** : le schéma existe, le client s'instancie, une base de test s'ouvre. Les
user stories peuvent démarrer.

---

## Phase 3 : User Story 1 — Le site dispose de ses huit rubriques (P1) 🎯 MVP

**Objectif** : les huit rubriques existent en base, dans leur ordre invariable, et l'initialisation
est rejouable.

**Test indépendant** : sur base vierge, une lecture retourne exactement huit rubriques dans
l'ordre attendu ; rejouer le seed ne change ni le nombre ni les identifiants.

- [X] T017 [US1] Créer `prisma/seed.ts` et y écrire l'insertion des huit rubriques **à partir de `shared/utils/rubriques.ts`** — jamais une seconde liste. Rapprochement par `id` en `upsert`, `ordre` dérivé de la position dans le tableau (FR-001 à FR-003, SC-002)
- [X] T018 [US1] Créer `server/services/rubriques.ts` avec `listerRubriques()` (tri `ordre` croissant) et `rubriqueParId(id)`. **N'exposer aucune création, modification ni suppression** — l'ensemble est figé par l'absence d'API, pas par une vérification (FR-004, contracts/services.md)
- [X] T019 [US1] Créer `tests/unit/rubriques.test.ts` : huit lignes exactement, ordre du rail, seed rejoué deux fois sans doublon ni changement d'identifiant, lecture par identifiant d'URL (SC-001, SC-002)
- [X] T020 [US1] Exécuter `npx prisma migrate reset` puis vérifier dans `npx prisma studio` que la table `Rubrique` porte les huit lignes attendues (quickstart.md « Les huit rubriques »)

**Point de contrôle** : US1 est complète et testable seule, sans aucun article.

---

## Phase 4 : User Story 2 — Un article se crée, se lit et se modifie (P1)

**Objectif** : le cycle création / lecture / modification / suppression de l'article, avec
validation, dérivation de slug et assainissement du corps.

**Test indépendant** : créer un article par appel, le relire par son slug, en modifier le titre,
vérifier la persistance ; puis vérifier que chaque refus attendu produit une erreur explicite.

- [X] T021 [P] [US2] Créer `server/validation/assainir.ts` : `sanitize-html` sur la liste blanche stricte de research D10 — `p`, `br`, `blockquote`, `ul`, `ol`, `li`, `h2`, `h3`, `strong`, `em`, `a`, `figure`, `figcaption`, `img`. **`h1` volontairement absent** ; attributs limités à `href`/`title` sur `a` et `src`/`alt` sur `img` ; schémas d'URL `http`, `https`, `mailto` (FR-011, porte 11)
- [X] T022 [P] [US2] Créer `server/utils/slug.ts` : normalisation `NFD`, retrait des diacritiques, minuscules, tout caractère non alphanumérique en tiret, tirets compactés et élagués, **repli `article`** si la sortie est vide (research D17, cas limite de la spec)
- [X] T023 [P] [US2] Créer `server/validation/article.ts` : schémas Zod de création et de modification — `titre` ≤ 160, `chapo` ≤ 300, `sousTheme` ≤ 40, `statut` ∈ {`brouillon`, `publie`}, `rangUne` entier 1–5. **Refus explicite, jamais de troncature silencieuse** (FR-008a, FR-010, FR-015). Chaque schéma porte un `message` Zod **rédigé en français**, avec diacritiques corrects — un message par défaut de la bibliothèque est en anglais et manquerait la porte « Langue » de la constitution
- [X] T024 [US2] Créer `server/services/articles.ts` avec `creerArticle(donnees)` : validation Zod, assainissement du corps **avant stockage**, dérivation du slug à défaut, suffixe de collision décidé **par relecture en base dans la transaction d'insertion** (jamais un compteur mémoire), refus si `rubriqueId` absent ou inconnu (FR-005, FR-006, FR-009, FR-011)
- [X] T025 [US2] Ajouter `modifierArticle(id, donnees)` dans `server/services/articles.ts` : mêmes garanties que la création, en partiel
- [X] T026 [US2] Ajouter `supprimerArticle(id)` dans `server/services/articles.ts` : suppression **définitive** — ni corbeille ni archivage — et **refusée tant que l'article occupe un rang de Une** (FR-029)
- [X] T027 [US2] Créer `tests/unit/articles.test.ts` : création puis relecture par slug, refus du slug en doublon, dérivation depuis le titre, collision produisant un identifiant distinct, refus de rubrique inconnue, corps assaini de son balisage hostile, refus des trois dépassements de longueur, suppression définitive d'un article hors Une (FR-005 à FR-009, FR-008a, US2 scénarios 1 à 8)
- [X] T028 [US2] Vérifier que le titre est stocké **tel quel** : un titre saisi « Biodiversité : le retour du lynx » ressort identique en base, sans qu'aucune composition d'affichage n'y soit écrite — assertion à ajouter dans `tests/unit/articles.test.ts` (FR-008, US5 scénario 5)

**Point de contrôle** : US1 et US2 fonctionnent indépendamment.

---

## Phase 5 : User Story 3 — Seuls les articles réellement parus sont visibles du public (P1)

**Objectif** : le critère de visibilité, écrit une seule fois, appliqué à tous les chemins de
lecture publique ; et les transitions de publication qui l'alimentent.

**Test indépendant** : trois articles — brouillon, publié daté du passé, publié daté du futur —
et une seule attente : seul le deuxième apparaît, sur les trois chemins de lecture.

- [X] T029 [US3] Créer `server/utils/visibilite.ts` : `filtreVisible(maintenant = new Date())` retournant `{ statut: 'publie', publieLe: { lte: maintenant } }`. **Un seul fragment, jamais recopié** ; comparaison `lte` et non `lt` — une date égale à l'instant courant est visible (FR-012, research D9)
- [X] T030 [US3] Ajouter `listerArticlesPublics(options?)` et `articlePublicParSlug(slug)` dans `server/services/articles.ts` : les deux consomment `filtreVisible`, l'instant est injectable. **Aucun paramètre ne permet de désactiver le filtre** — une fonction capable de montrer un brouillon sur simple argument serait une fuite en attente (FR-013, contracts/services.md)
- [X] T031 [US3] Ajouter `publierArticle(id, publieLe?)` dans `server/services/articles.ts` : **refus si la couverture ou son texte alternatif manquent ou sont vides** ; sans date fournie, poser l'instant du passage ; sur un article déjà publié une fois, **laisser `publieLe` inchangée** (FR-014, FR-014a)
- [X] T032 [US3] Ajouter `depublierArticle(id)` dans `server/services/articles.ts` : retour à `brouillon`, `publieLe` conservée pour que la republication ne redate pas (FR-014a)
- [X] T033 [US3] Créer `tests/unit/visibilite.test.ts` : les trois articles sur les **trois** chemins de lecture (liste, filtre par rubrique, demande directe par slug qui retourne `null` et non le contenu) ; l'article du futur devenu visible **en avançant l'instant injecté, sans aucune écriture** ; le cas limite de la date exactement égale à l'instant ; le refus de publier sans couverture et avec un `alt` vide ; la republication qui ne redate pas (SC-003, SC-004a, US3 scénarios 1 à 4)

**Point de contrôle** : la règle de sécurité éditoriale du site est prouvée. Les trois stories P1
sont livrées — c'est le périmètre MVP.

---

## Phase 6 : User Story 4 — La Une porte cinq articles ordonnés (P2)

**Objectif** : rangs 1 à 5, unicité garantie par la base, éviction atomique, lecture ordonnée.

**Test indépendant** : placer cinq articles publiés aux rangs 1 à 5, lire la Une, vérifier
l'ordre ; assigner un rang occupé et vérifier l'éviction ; tenter un rang hors intervalle et un
brouillon, vérifier les refus.

- [X] T034 [US4] Créer `server/services/une.ts` avec `placerALaUne(articleId, rang)` : rang validé 1–5 par Zod, **refus si l'article est un brouillon**, et **éviction dans une transaction** — l'occupant précédent est libéré et le nouvel article prend le rang dans la même transaction, sans quoi la contrainte `@unique` rejetterait l'instant intermédiaire (FR-015 à FR-017, FR-016a)
- [X] T035 [US4] Ajouter `retirerDeLaUne(articleId)` dans `server/services/une.ts` : `rangUne` remis à `null`
- [X] T036 [US4] Ajouter `lireUne(instant?)` dans `server/services/articles.ts` : filtre `rangUne: { not: null }`, tri par rang croissant avec **`nulls: 'last'` explicite** — inoffensif en SQLite, indispensable en PostgreSQL (FR-018, research D7)
- [X] T037 [US4] Modifier `depublierArticle` dans `server/services/articles.ts` pour **libérer le rang de Une** lors du retour à `brouillon` (FR-017, US4 scénario 4)
- [X] T038 [US4] Créer `tests/unit/une.test.ts` : cinq rangs lus dans l'ordre croissant ; assignation sur rang occupé qui **réussit** et déloge l'occupant, sans état intermédiaire à deux articles au même rang ; refus du rang 0 et du rang 6 ; refus d'un brouillon ; dépublication qui libère le rang ; suppression refusée sur un article occupant un rang (SC-004, US4 scénarios 1 à 5)

---

## Phase 7 : User Story 5 — L'eyebrow s'affiche selon le contexte de lecture (P2)

**Objectif** : la règle unique de calcul du libellé contextuel, pure et partagée.

**Test indépendant** : pour un article donné, demander l'eyebrow dans les deux contextes et
vérifier les deux résultats — appel programmatique pur, sans base.

- [X] T039 [P] [US5] Créer `shared/utils/eyebrow.ts` : `eyebrowDe(article, contexte?)` → sous-thème si le contexte est la rubrique de l'article **et** que le sous-thème existe, libellé de rubrique dans tous les autres cas. **Fonction pure** : aucun accès à la base, aucune dépendance serveur ; le résultat n'est **jamais** persisté (FR-019, FR-020)
- [X] T040 [P] [US5] Créer `tests/unit/eyebrow.test.ts` : les trois cas de figure — dans la rubrique avec sous-thème, hors rubrique avec sous-thème, sans sous-thème quel que soit le contexte (SC-005, US5 scénarios 1 à 3)
- [X] T041 [US5] Ajouter dans `tests/unit/eyebrow.test.ts` l'assertion négative du scénario 4 : deux articles partageant le même sous-thème ne sont rapprochés par **aucune** lecture — aucune table, aucun index, aucune fonction de regroupement sur `sousTheme`

---

## Phase 8 : User Story 6 — Comptes de rédaction et médias sont représentés (P3)

**Objectif** : les deux entités posées maintenant pour éviter une migration de schéma plus tard,
avec leurs garanties de non-fuite.

**Test indépendant** : créer un compte et un média, les relire, vérifier qu'aucune URL n'est
stockée et qu'aucune empreinte n'est retournée.

- [X] T042 [P] [US6] Créer `server/validation/media.ts` : schéma Zod qui **refuse toute valeur ressemblant à une URL** dans `cle` (`http://`, `https://`, `//`, `data:`), et exige `largeur`, `hauteur`, `poids` entiers positifs. Messages Zod **en français**, comme en T023 (FR-022, FR-023)
- [X] T043 [US6] Créer `server/services/medias.ts` : `enregistrerMedia(donnees)`, `mediaParId(id)`, `supprimerMedia(id)` — cette dernière **refusée tant qu'un article référence le média**. Aucune sortie ne contient d'URL ; l'adresse s'obtient en passant la clé à `Stockage.url()` (contracts/services.md, contracts/stockage.md)
- [X] T044 [P] [US6] Créer `server/services/comptes.ts` : `creerCompte(donnees)` hachant en **argon2id avant** d'atteindre la base, `compteParIdentifiant(id)`, `verifierMotDePasse(identifiant, motDePasse)` rendant un **booléen et rien d'autre** — ni compte, ni empreinte, ni message distinguant « compte inconnu » de « mot de passe faux ». Le type de retour des deux premières **exclut** `motDePasseHache` (FR-021, research D11)
- [X] T045 [P] [US6] Créer `tests/unit/medias.test.ts` : clé acceptée, URL refusée à la validation, aucune colonne ne contient d'adresse, suppression refusée si référencé, `Stockage.url()` calculant l'adresse à la lecture (SC-006, US6 scénarios 3 et 4)
- [X] T046 [P] [US6] Créer `tests/unit/comptes.test.ts` : identifiant unique, doublon refusé, **empreinte absente du type et de la valeur retournés**, `verifierMotDePasse` correct sur bon et mauvais mot de passe (FR-021, US6 scénarios 1 et 2)

---

## Phase 9 : User Story 7 — Des données d'exemple peuplent les pages à venir (P3)

**Objectif** : de quoi construire et regarder les pages publiques de la feature suivante sans
saisie manuelle.

**Test indépendant** : initialiser une base vierge, puis vérifier que l'accueil, une page de
rubrique et une page d'article disposeraient chacune d'assez de matière.

- [X] T047 [US7] Étendre `prisma/seed.ts` : quelques médias d'exemple (clés de stockage, jamais d'URL) puis des articles répartis sur **au moins cinq rubriques distinctes**, chacun avec un `couvertureAlt` **réel** — jamais une chaîne vide (FR-028, SC-008)
- [X] T048 [US7] Compléter `prisma/seed.ts` : exactement **cinq** articles occupant les rangs 1 à 5 de la Une, au moins un article avec `sousTheme`, au moins un sans, au moins un brouillon — et garder le seed **rejouable** par rapprochement sur `slug` (US7 scénarios 1 à 4)
- [X] T049 [US7] Créer `tests/unit/seed.test.ts` : après seed sur base vierge, cinq rubriques distinctes portent un article visible du public, cinq rangs de Une sont pourvus, les trois variantes d'article existent, et **aucun article publié ne présente un `couvertureAlt` vide** (SC-008, SC-004a)
- [X] T050 [US7] Exécuter `npx prisma migrate reset` et vérifier à la main dans `npx prisma studio` les quatre points de la section « Les articles d'exemple » de [quickstart.md](./quickstart.md)

**Point de contrôle** : les sept user stories sont indépendamment fonctionnelles.

---

## Phase 10 : Finitions et préoccupations transverses

- [X] T051 [P] Ajouter le contrôle « aucune URL en base » à `scripts/verifier.mjs` : parcourt les colonnes de médias et rejette `http://`, `https://`, `//`, `data:` (porte 9, SC-006)
- [X] T052 [P] Ajouter le contrôle « aucun accès disque hors interface » à `scripts/verifier.mjs` : rejette tout import de `node:fs` en dehors de `server/utils/stockage.ts`. **C'est le plus utile des deux — le premier constate un symptôme, celui-ci empêche la cause** (porte 9, contracts/stockage.md §5)
- [X] T053 [P] Ajouter le contrôle « schéma portable » à `scripts/verifier.mjs` : rejette `enum`, `Json`, `autoincrement` et `@db.` dans `prisma/schema.prisma` (porte 10)
- [X] T054 [P] Créer `scripts/essai-eyebrow.ts`, exécutable par `node --experimental-strip-types`, qui affiche l'eyebrow d'un article de rubrique Environnement portant le sous-thème « Biodiversité » dans les deux contextes (quickstart.md « La règle d'eyebrow »)
- [X] T055 [P] Brancher le hook `close` de Nitro dans `server/plugins/fermeture.ts` pour appeler `prisma.$disconnect()` — l'enjeu est mince avec SQLite en processus, il compte pour PostgreSQL (research D16)
- [X] T056 Exécuter `npm run test:unit` : les huit fichiers au vert sur base vierge, sans intervention manuelle (SC-009)
- [X] T057 Exécuter `npm run verifier` et `npm run typecheck` : tout au vert, portabilité comprise
- [X] T058 Exécuter `npm run test:e2e` : **la suite Playwright de Fondations doit toujours passer** — le déplacement de `rubriques.ts` vers `shared/` touche la navigation (T014)
- [X] T059 Vérifier le démarrage réel du serveur compilé : `npm run build`, puis `ls .output/server/node_modules/better-sqlite3/build/Release/*.node` et `node .output/server/index.mjs`. **Une compilation qui réussit ne prouve rien** — la défaillance de `better-sqlite3` est au démarrage (research D15, quickstart.md)
- [X] T060 Passer en revue la section « Ce qu'il faut essayer de casser » de [quickstart.md](./quickstart.md) : les sept refus doivent produire une **erreur explicite**, jamais un enregistrement silencieusement corrigé (SC-007)
- [X] T061 [P] Mettre à jour la section « Commandes » de `CLAUDE.md` avec `npm run test:unit` et `npm run db:seed`, et corriger la mention de `npx prisma db seed` si les scripts diffèrent
- [X] T062 [P] Créer `tests/unit/refus.test.ts` : un test paramétré sur les **dix** fonctions d'écriture exposées par `contracts/services.md` — `creerArticle`, `modifierArticle`, `publierArticle`, `depublierArticle`, `supprimerArticle`, `placerALaUne`, `retirerDeLaUne`, `enregistrerMedia`, `supprimerMedia`, `creerCompte`. Pour chacune, une entrée invalide doit produire une erreur portant un message **non vide et en français**, jamais un enregistrement silencieusement corrigé ni une erreur technique brute. Le tableau des cas est la source du « 100 % » de SC-007 : il se compare à la liste des exports des modules de service, de sorte qu'une onzième fonction d'écriture ajoutée un jour **fasse échouer le test** tant qu'elle n'y figure pas. **Écrire ce fichier après les stories US2 à US6**, dont il teste les refus ; l'exécuter avec T056 (SC-007, FR-026)

---

## Dépendances et ordre d'exécution

### Dépendances de phase

- **Setup (Phase 1)** : aucune dépendance, démarre immédiatement
- **Fondations (Phase 2)** : dépend de la Phase 1 — **bloque toutes les user stories**
- **US1 (Phase 3)** : dépend de la Phase 2
- **US2 (Phase 4)** : dépend de la Phase 2 ; ses tests supposent une rubrique existante, donc T017 en pratique
- **US3 (Phase 5)** : dépend de US2 — publier et lire suppose que créer existe
- **US4 (Phase 6)** : dépend de US3 — un article à la Une est nécessairement publié (FR-017)
- **US5 (Phase 7)** : dépend de la Phase 2 seulement — fonction pure, **parallélisable avec US2, US3 et US4**
- **US6 (Phase 8)** : dépend de la Phase 2 ; `supprimerMedia` refusée si référencé suppose l'existence d'articles pour être testée
- **US7 (Phase 9)** : dépend de US1, US2, US3, US4 et US6 — le seed les mobilise toutes
- **Finitions (Phase 10)** : dépend de tout ce qui précède

### Chaîne critique

```text
Setup → Fondations → US1 → US2 → US3 → US4 → US7 → Finitions
                       └──→ US5  (indépendante)
                       └──→ US6  (quasi indépendante)
```

### À l'intérieur d'une story

Validation → service → test. Les fichiers de validation d'une même story sont indépendants entre
eux ; les fonctions d'un même fichier de service, non.

### Occasions de parallélisme

- Phase 1 : T003, T004, T005, T007, T008 en parallèle
- Phase 2 : T013 en parallèle de T009–T012
- US2 : T021, T022, T023 en parallèle (trois fichiers distincts) avant T024
- US5 : T039 et T040 parallélisables avec toute la Phase 4 et la Phase 6
- US6 : T042 et T044 en parallèle ; T045 et T046 en parallèle
- Phase 10 : T051 à T055 en parallèle ; T056 à T060 sont séquentiels par nature (ce sont des vérifications)

**Attention aux fausses parallélisations** : T024, T025, T026, T030, T031, T032, T036 et T037
touchent **toutes** `server/services/articles.ts`. Aucune n'est marquée `[P]`, et ce n'est pas un
oubli.

---

## Exemple de lancement parallèle : User Story 2

```bash
# Les trois fichiers de préparation, ensemble :
Tâche : "server/validation/assainir.ts — liste blanche sanitize-html"
Tâche : "server/utils/slug.ts — dérivation NFD avec repli"
Tâche : "server/validation/article.ts — schémas Zod, longueurs et statuts"

# Puis, séquentiellement, le service qui les consomme (T024 → T025 → T026)
```

---

## Stratégie de mise en œuvre

### MVP d'abord (US1 + US2 + US3)

1. Phase 1 : Setup
2. Phase 2 : Fondations — **bloquant**
3. Phases 3, 4, 5 : les trois stories P1
4. **S'ARRÊTER ET VALIDER** : `npm run test:unit` doit prouver qu'un brouillon et un article daté
   du futur n'apparaissent dans aucune lecture publique. C'est la règle dont la violation serait
   un incident éditorial, pas un défaut cosmétique.

Le MVP n'est pas US1 seule : une base de rubriques sans article ne prouve rien d'utile aux
features suivantes. Les trois stories P1 forment le plus petit ensemble livrable.

### Livraison incrémentale

1. Setup + Fondations → socle prêt
2. US1 → les rubriques existent
3. US2 → les articles se manipulent
4. US3 → **la visibilité publique est prouvée (MVP)**
5. US4 → la Une se compose
6. US5 → l'eyebrow se calcule (livrable à tout moment après les Fondations)
7. US6 → comptes et médias sont représentés
8. US7 → les données d'exemple peuplent la feature suivante

### Ce qui reste à vérifier hors test

T059 est la seule vérification qu'aucun test ne remplace, et elle est **obligatoire avant de
clore la feature** : la chaîne Nuxt 4.4 + Nitro 2.13 + Prisma 7 + better-sqlite3 n'est
documentée nulle part, et le point de rupture est au démarrage du serveur compilé.

---

## Notes

- `[P]` = fichiers distincts, aucune dépendance
- Chaque story reste indépendamment vérifiable ; s'arrêter à un point de contrôle est valide
- Commit après chaque tâche ou groupe logique, message en français
- Un test qui échoue est un défaut à corriger, jamais un test à assouplir
- Rien n'appelle Prisma en dehors de `server/services/` — c'est la seule garantie des quatre
  invariants que le schéma ne sait pas exprimer
