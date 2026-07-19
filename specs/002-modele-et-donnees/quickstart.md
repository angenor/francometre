# Mise en route et vérification — Modèle et données

**Feature** : [spec.md](./spec.md) · **Plan** : [plan.md](./plan.md) · **Date** : 2026-07-19

Cette feature ne livre aucun écran. Elle se vérifie donc **par des appels programmatiques**,
comme la spécification le demande — pas en regardant le site, qui ne montrera rien de nouveau.

---

## Prérequis

Node.js 22.12+ ou 24.11+, comme le reste du projet. Aucun service externe : la base est un
fichier SQLite local.

## Installation

```bash
npm install
cp .env.example .env        # DATABASE_URL="file:./prisma/dev.db"
npx prisma migrate dev      # crée la base et applique les migrations
npm run db:seed             # joue le seed — étape SÉPARÉE, voir ci-dessous
```

> **Corrigé à l'implémentation.** Ce document affirmait que `migrate dev` jouait le seed,
> et research.md D4 que `migrate reset` le jouait aussi. **Ni l'un ni l'autre n'est vrai en
> Prisma 7.8.0** : `migrate reset` n'expose même plus d'option `--skip-seed`, et repart sur
> une base vide. Le seed déclaré dans `migrations.seed` se lance **explicitement**, par
> `npm run db:seed`. Vérifié le 2026-07-19 en exécutant les deux commandes.

`prisma generate` tourne dans le `postinstall`, avant `nuxt prepare` (research.md D2). Si le
client paraît absent ou périmé après un changement de schéma, c'est cette commande qu'il faut
rejouer, pas une réinstallation.

## Inspecter

```bash
npx prisma studio           # les données, dans le navigateur
```

---

## Vérification automatisée

```bash
npm run test:unit           # Vitest — les règles de gestion
npm run verifier            # contrôles de sobriété ET de portabilité
npm run typecheck
```

**Attendu** : tout au vert. Un échec est un défaut à corriger, jamais un test à assouplir.

### Le test qui compte le plus

Celui de la visibilité publique. Trois articles — un brouillon, un publié daté du passé, un
publié daté du futur — et une seule attente : **seul le deuxième apparaît**, sur les trois
chemins de lecture (liste, rubrique, demande directe par slug). C'est la règle dont la
violation serait un incident éditorial et non un défaut cosmétique.

Le test injecte l'instant plutôt que d'attendre (research.md D9) : il vérifie aussi qu'en
avançant l'instant au-delà de la date de publication, l'article du futur devient visible **sans
qu'aucune écriture n'ait eu lieu**.

### Le test le plus subtil

Celui du rang de Une. Il ne se contente pas de vérifier que deux articles ne partagent pas un
rang : il vérifie que **placer un article sur un rang occupé réussit** et déloge l'occupant
(FR-016a), et que l'état intermédiaire à deux articles au même rang n'est jamais observable.

### Contrôles de portabilité

`npm run verifier` gagne deux contrôles, qui rejoignent les trois de Fondations :

| Contrôle | Ce qu'il rejette | Porte |
|---|---|---|
| Aucune URL en base | `http://`, `https://`, `//`, `data:` dans les colonnes de médias | 9 |
| Aucun accès disque hors interface | tout import de `node:fs` hors de l'implémentation `Stockage` | 9 |
| Schéma portable | `enum`, `Json`, `autoincrement`, `@db.` dans `schema.prisma` | 10 |

Le tableau qui relie les fichiers de test aux exigences :

| Fichier | Ce qu'il prouve | Critères |
|---|---|---|
| `tests/unit/rubriques.test.ts` | Huit rubriques, dans l'ordre, seed rejouable | SC-001, SC-002 |
| `tests/unit/articles.test.ts` | Création, slug unique et dérivé, longueurs, refus | FR-005 à FR-009, FR-008a |
| `tests/unit/visibilite.test.ts` | Brouillon et futur invisibles, sur trois chemins | SC-003 |
| `tests/unit/une.test.ts` | Rangs 1–5, éviction, brouillon refusé, ordre | SC-004 |
| `tests/unit/eyebrow.test.ts` | Les trois cas de figure du libellé contextuel | SC-005 |
| `tests/unit/medias.test.ts` | Clé et non URL, suppression refusée si référencé | SC-006 |
| `tests/unit/comptes.test.ts` | Empreinte jamais retournée, identifiant unique | FR-021 |
| `tests/unit/seed.test.ts` | Cinq rubriques peuplées, cinq rangs, alt réels | SC-008 |
| `tests/unit/refus.test.ts` | Toute écriture refuse une entrée invalide, message français | SC-007 |

---

## La vérification qu'aucun test ne remplace

**Le serveur compilé démarre-t-il vraiment ?**

C'est la seule inconnue que la recherche a laissée ouverte (research.md D15) : `better-sqlite3`
est un module natif dont le binaire est localisé par une résolution dynamique que l'analyse de
dépendances rate régulièrement. **Une compilation qui réussit ne prouve rien** — la défaillance
est au démarrage.

```bash
npm run build
ls .output/server/node_modules/better-sqlite3/build/Release/*.node   # le binaire est-il là ?
node .output/server/index.mjs                                        # démarre-t-il ?
```

**Attendu** : un fichier `.node` listé, et un serveur qui répond. Si le démarrage échoue sur
`Could not locate the bindings file`, c'est le `traceInclude` de `nuxt.config.ts` qui est en
cause — pas le code applicatif.

---

## Vérification à la main

### Les huit rubriques (US1)

1. `npx prisma studio`, table `Rubrique`.
2. Compter : **huit** lignes, `ordre` de 1 à 8, dans l'ordre du rail — Environnement, Sport,
   Éducation, Santé, Diplomatie, Culture, Technologie, Économie.
3. Relancer `npx prisma db seed`. Recompter : toujours huit, et les identifiants n'ont pas
   changé.

### Les articles d'exemple (US7)

1. Table `Article`. Au moins cinq rubriques distinctes portent un article visible.
2. Exactement **cinq** articles ont un `rangUne` renseigné, valant 1, 2, 3, 4 et 5.
3. Au moins un article porte un `sousTheme`, au moins un n'en porte pas, au moins un est un
   brouillon.
4. **Aucun** `couvertureAlt` vide sur un article publié.

### La règle d'eyebrow (US5)

Sans interface, elle se regarde en console :

```bash
node --experimental-strip-types scripts/essai-eyebrow.ts
```

**Attendu** : pour un article de rubrique Environnement portant le sous-thème « Biodiversité »,
`Biodiversité` en contexte « dans la rubrique », `Environnement` hors contexte. Pour un article
sans sous-thème, `Environnement` dans les deux cas.

### Ce qu'il faut essayer de casser

Les refus valent les succès. Chacun doit produire une **erreur explicite**, jamais un
enregistrement silencieusement corrigé :

- publier un article sans couverture, ou avec un `alt` vide ;
- placer un brouillon à la Une ;
- assigner le rang 6, ou le rang 0 ;
- créer deux articles avec le même slug ;
- écrire un titre de 200 caractères ;
- supprimer un article qui occupe le rang 3 ;
- enregistrer un média dont la clé est `https://exemple.com/image.jpg`.

---

## Terminé quand

- [ ] `npm run test:unit` au vert, chaque règle de gestion couverte
- [ ] `npm run verifier` au vert, portabilité comprise
- [ ] `npm run typecheck` au vert
- [ ] La suite Playwright de Fondations passe toujours — le déplacement de `rubriques.ts` vers
      `shared/` touche la navigation
- [ ] `node .output/server/index.mjs` démarre après compilation
- [ ] Base vierge + `npx prisma migrate reset` puis `npm run db:seed` ⇒ huit rubriques et les
      articles d'exemple (le seed ne se déclenche plus seul, voir « Installation »)

---

## Écueils connus

| Symptôme | Cause probable |
|---|---|
| `PrismaClientInitializationError` au démarrage | Adaptateur absent : `new PrismaClient()` seul ne fonctionne plus en Prisma 7 (D3) |
| `DATABASE_URL` indéfinie | `import 'dotenv/config'` manquant en tête de `prisma.config.ts` (D4) |
| `Could not locate the bindings file` | Traçage de `better-sqlite3` : voir `traceInclude` (D15) |
| Module `PrismaBetterSQLite3` introuvable | La classe s'écrit `PrismaBetterSqlite3` (D3) |
| Le générateur échoue | `output` est obligatoire en Prisma 7, et le provider est `prisma-client` (D2) |
| La Une sort dans le désordre | Tri sans `nulls: 'last'` — inoffensif en SQLite, faux en PostgreSQL (D7) |
| Des centaines d'auto-imports inattendus | Le client a été généré sous `server/utils/` (D2) |
