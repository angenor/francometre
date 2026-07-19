# Implementation Plan: Modèle et données

**Branch**: `002-modele-et-donnees` | **Date**: 2026-07-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-modele-et-donnees/spec.md`

## Summary

Cette feature définit ce que le site manipule — rubriques, articles, Une, comptes, médias — et
rend ces objets lisibles et modifiables par des appels programmatiques éprouvés. **Aucune
interface, aucune route HTTP.** C'est aussi la première feature du projet qui persiste quelque
chose : les portes 9, 10, 11 et 12 de la constitution, déclarées sans objet par Fondations,
deviennent ici des contrôles réels.

L'approche technique tient en cinq décisions, détaillées dans [research.md](./research.md) :

1. **Prisma 7.8 sur SQLite**, avec l'objectif PostgreSQL tenu dès maintenant — non comme une
   intention, mais comme une contrainte vérifiée décision par décision.
2. **Les huit rubriques ont déjà une source** : `app/utils/rubriques.ts`, que Fondations pose
   comme « la définition UNIQUE du projet ». Elle est déplacée dans `shared/utils/` pour servir
   les deux côtés ; la table n'en est que le reflet, destiné à porter les clés étrangères.
3. **Le critère de visibilité publique est écrit une seule fois**, avec un instant injectable —
   ce qui rend testable, sans manipuler l'horloge, qu'un article daté du futur devienne visible
   du seul fait que le temps passe.
4. **Les invariants que le schéma ne sait pas exprimer vivent dans les services**, et rien
   n'appelle Prisma en dehors d'eux. Le principe VI interdisant les `enum` portés par la base,
   la contrainte se déplace mécaniquement vers le code : autant l'y placer délibérément.
5. **Vitest**, premier runner unitaire du projet. Fondations avait écarté toute couche
   unitaire ; la spécification demande ici de prouver des règles « sans interface », ce qu'un
   navigateur ne saurait faire ni économiquement, ni de manière probante.

Deux faits **mesurés** encadrent le plan. Le premier lève le risque principal : l'unicité sur
une colonne nullable — le rang de Une — se comporte **identiquement** sur SQLite 3.51 et
PostgreSQL 18.4. Le second en révèle un plus insidieux : l'**ordre des nuls au tri est opposé**
entre les deux moteurs. Un tri de la Une correct en développement retournerait, après migration,
tous les articles hors Une d'abord — sans erreur, sans avertissement, sur la page d'accueil.

## Technical Context

**Language/Version**: TypeScript 5.x · **Node.js 22.12+ ou 24.11+** (inchangé depuis Fondations)

**Primary Dependencies** — versions relevées le 2026-07-19 par `npm view`, non de mémoire :

| Paquet | Version | Rôle |
|---|---|---|
| `prisma` · `@prisma/client` | 7.8.0 | ORM, migrations. **Rupture forte** avec les versions ≤ 6 |
| `@prisma/adapter-better-sqlite3` | 7.8.0 | Adaptateur — **obligatoire**, `new PrismaClient()` seul échoue |
| `zod` | 4.4.3 | Validation de toute entrée d'écriture |
| `sanitize-html` | 2.17.6 | Assainissement serveur du corps riche, avant stockage |
| `argon2` | 0.45.0 | Hachage des secrets de compte |
| `dotenv` | — | **Requis** : Prisma 7 ne charge plus l'environnement implicitement |
| `vitest` | 4.1.10 | Premier runner unitaire du projet |
| `better-sqlite3` | 12.11.1 | `devDependency` **seulement** — l'adaptateur l'embarque déjà |

**Storage**: SQLite en fichier local, sans service externe. Médias sur disque, derrière une
interface `Stockage` unique. La base ne contient que des **clés**, jamais d'URL.

**Testing**: Vitest 4.1.10 sur base SQLite éphémère, une par fichier de test. Playwright reste
en place pour Fondations — il n'est pas remplacé, il ne couvre simplement pas ce périmètre.

**Target Platform**: Serveur Nitro, cible par défaut (Node), inchangé.

**Project Type**: Projet Nuxt unique. Aucune séparation front/back — décision de Fondations,
non rediscutée.

**Performance Goals**: Sans objet à cette échelle. Un site éditorial à volumétrie modeste ;
aucune requête de cette feature ne porte sur plus de quelques dizaines de lignes.

**Constraints**: Portabilité SQLite → PostgreSQL tenue **à tout moment**, pas au moment de la
migration · aucune URL en base · aucun accès disque hors interface `Stockage` · assainissement
avant stockage · pas d'`enum` de base, pas de `Json`, pas de liste scalaire, pas
d'auto-increment.

**Scale/Scope**: 5 entités persistées, 1 constante de code, ~20 fonctions de service, 9 fichiers
de test.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Portes dérivées de `.specify/memory/constitution.md` v1.2.0. Renseigner chaque ligne :
**OK**, **N/A** (avec raison), ou **Écart** (à justifier dans « Complexity Tracking »).

| # | Porte | Principe | Statut |
|---|---|---|---|
| 1 | Aucun `border-radius` non nul, aucune `box-shadow`, aucun `gradient` | I | **N/A** — aucune ligne de style dans le diff |
| 2 | Composant Card unique ; toute variante déclarée dans le composant | I | **N/A** — aucun composant livré. Une dette est néanmoins ouverte, voir « Suites à donner » |
| 3 | Coupe à 3,5° limitée au mot-symbole et au filet de séparation | I | **N/A** — aucun rendu |
| 4 | Chaque occurrence d'accent traçable à `docs/design/html/` ; jamais en fond (hors nav active du back-office) | III | **N/A** — aucune couleur employée |
| 5 | Clair + sombre sur chaque écran ; suit l'OS ; choix persistant ; aucun flash | IV | **N/A** — aucun écran |
| 6 | Contraste AA vérifié **dans les deux thèmes**, accent mesuré deux fois | IV | **N/A** — aucun rendu à mesurer |
| 7 | Aucun défilement horizontal à 375 px ; conforme aux décisions de Fondations | V | **N/A** — aucun écran |
| 8 | Focus visible partout ; `prefers-reduced-motion` ; `aria-current` juste ; `alt` réel | VIII | **OK, partiellement applicable** — le `alt` de couverture est **exigé à la publication** (FR-014), et son absence bloque la transition. Le reste de la porte est sans objet |
| 9 | Aucune URL de média en base ; accès stockage via l'interface Storage seule | VI | **OK** — la base ne porte que des clés ; `url()` calcule à la lecture ; deux contrôles automatisés (contracts/stockage.md §5) |
| 10 | Schéma sans enum de base, sans JSON, sans liste scalaire, sans auto-increment | VI | **OK** — statuts en `String` validés par Zod, identifiants en `cuid()`. L'unicité sur colonne nullable est **mesurée identique** sur les deux moteurs (research D6) |
| 11 | HTML d'éditeur assaini côté serveur sur liste blanche avant stockage | VII | **OK** — `sanitize-html` dans la couche d'écriture, liste blanche arrêtée (research D10). La base ne contient que du HTML déjà sûr |
| 12 | Routes d'administration refusées par défaut sans authentification | VII | **OK, par construction** — aucune route n'est montée. La fermeture par défaut est ici obtenue par l'**absence** de point d'entrée, ce qui est la forme la plus solide |
| 13 | Interface et contenus en français, diacritiques corrects | VIII | **OK** — libellés de rubrique, articles d'exemple et messages d'erreur en français |

**Résultat : aucun écart.** Six portes applicables passent, sept sont sans objet pour une
feature qui ne rend aucun pixel. Les quatre portes que Fondations avait renvoyées à « la
première feature qui persiste quelque chose » — 9, 10, 11, 12 — sont évaluées ici pour la
première fois, et passent.

### Réévaluation après conception (Phase 1)

La conception n'a créé aucun écart, mais elle a **durci deux portes** et en a nuancé une
troisième.

- **Porte 9 renforcée** : la règle « aucune URL en base » cesse d'être une convention pour
  devenir un contrôle. Deux vérifications automatisées rejoignent `scripts/verifier.mjs` — l'une
  constate l'absence d'URL dans les colonnes de médias, l'autre, plus utile, **rejette tout
  import de `node:fs` hors de l'implémentation `Stockage`**. La première observe un symptôme, la
  seconde empêche la cause.
- **Porte 10 renforcée** : le point de rupture potentiel — une contrainte d'unicité sur une
  colonne nulle dans la quasi-totalité des lignes — a été vérifié en exécutant le même SQL sur
  SQLite 3.51.0 et PostgreSQL 18.4. Comportement identique, migration sans adaptation. En
  revanche la conception a **découvert** un piège que la porte ne mentionne pas : l'ordre des
  nuls au tri diverge entre les deux moteurs (research D7). Il est neutralisé par un
  `nulls: 'last'` explicite, et signalé en « Suites à donner » comme candidat à un amendement de
  la porte.
- **Porte 12 nuancée** : elle passe « par construction », ce qui est plus fort qu'un contrôle
  mais ne vaut que tant qu'aucune route n'existe. Elle devra être **réévaluée pour de bon** à la
  feature 004, où des routes d'administration seront réellement montées.

Une valeur décidée ici n'existe dans aucune source de design, et c'est normal : les bornes de
longueur (titre 160, chapô 300, sous-thème 40) sont des règles de gestion, pas des valeurs
visuelles. Elles vivent dans la spécification et **n'ont pas à rejoindre `tokens.md`**, dont
l'autorité porte sur ce qui se voit.

## Project Structure

### Documentation (this feature)

```text
specs/002-modele-et-donnees/
├── plan.md                    # Ce fichier
├── spec.md                    # Le QUOI, clarifié le 2026-07-18
├── research.md                # Phase 0 — 17 décisions, D1 à D17
├── data-model.md              # Phase 1 — 5 entités, 1 constante, 1 règle d'affichage
├── contracts/
│   ├── services.md            # Les fonctions serveur — il n'y a AUCUNE route
│   └── stockage.md            # L'interface unique vers le disque (porte 9)
├── quickstart.md              # Comment vérifier une feature sans écran
├── checklists/requirements.md
└── tasks.md                   # Phase 2 — produit par /speckit.tasks, PAS par /speckit.plan
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma              # 5 modèles. Pas d'enum, pas de Json, pas d'autoincrement
├── migrations/                # La source du schéma appliqué en test (research D14)
├── seed.ts                    # Rejouable — rapproche par id, ne duplique jamais
└── generated/                 # Client généré — IGNORÉ PAR GIT, et surtout PAS sous server/

prisma.config.ts               # Configuration Prisma 7 — remplace la clé prisma de package.json

server/
├── utils/
│   ├── db.ts                  # LE client unique. Auto-importé par Nitro
│   ├── visibilite.ts          # LE critère « publié et date atteinte », défini UNE fois
│   └── stockage.ts            # L'interface unique — la SEULE à connaître node:fs
├── services/                  # Les invariants que le schéma ne sait pas exprimer
│   ├── articles.ts
│   ├── rubriques.ts
│   ├── une.ts
│   ├── medias.ts
│   └── comptes.ts
└── validation/
    ├── article.ts             # Zod — longueurs, statuts, rang 1-5
    ├── media.ts               # Zod — rejette toute valeur ressemblant à une URL
    └── assainir.ts            # sanitize-html, liste blanche stricte

shared/
└── utils/
    ├── rubriques.ts           # DÉPLACÉ depuis app/utils/ — la définition unique des huit
    └── eyebrow.ts             # Fonction PURE : sous-thème ou rubrique selon le contexte

tests/
├── e2e/                       # Fondations — inchangé, mais doit continuer de passer
└── unit/                      # NOUVEAU — 8 fichiers, une base SQLite éphémère chacun

# PAS de server/api/ — cette feature ne monte AUCUNE route (porte 12 par construction)
# PAS de sharp — aucun téléversement, donc aucune image à redimensionner
# PAS de :memory: en test — l'adaptateur ne prend qu'une URL, jamais une connexion ouverte
```

**Structure Decision**: le projet Nuxt unique de Fondations est étendu, jamais réorganisé.
Quatre séparations sont en revanche structurantes et délibérées :

- `prisma/generated/` est à la racine et **non sous `server/`** : Nitro auto-importe
  récursivement `server/utils/`, et y déverser le client généré exposerait des centaines de
  symboles en auto-import, avec des collisions garanties (research D2).
- `server/services/` **contre** un appel direct à Prisma depuis ailleurs : c'est la seule
  garantie des quatre invariants — rang dans 1–5, à la Une ⇒ publié, publié ⇒ couverture,
  éviction atomique — qu'aucune contrainte de base n'exprime.
- `shared/utils/` **contre** une duplication de la liste des rubriques : Nuxt 4.4.8 rend ce
  dossier accessible au client comme au serveur, ce qui permet de conserver **une** définition
  là où deux auraient dérivé.
- `server/utils/stockage.ts` **contre** un accès disque dispersé : c'est le seul fichier du
  projet autorisé à importer `node:fs`, et un contrôle automatisé le vérifie.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Aucun écart à justifier — les six portes applicables passent, les sept autres sont sans objet
et motivées dans le tableau ci-dessus.

## Suites à donner

| Quoi | Où | État |
|---|---|---|
| Amendement de la constitution refermant l'arbitrage du sous-thème | `.specify/memory/constitution.md` v1.2.0 | **Fait** — 2026-07-19, avant ce plan |
| Déplacement de `rubriques.ts` vers `shared/`, augmentation `RouteMeta` laissée côté app | `shared/utils/`, `app/` | À faire — la suite Playwright de Fondations doit continuer de passer |
| Deux contrôles de portabilité ajoutés au vérifieur | `scripts/verifier.mjs` | À faire |
| `postinstall` étendu à `prisma generate` | `package.json` | À faire |

### Ce qui reste ouvert

| Lacune | Constat | À trancher |
|---|---|---|
| `ArticleCard` ne sait pas rendre un eyebrow contextuel | Le composant accepte `rubrique: RubriqueId` et affiche son libellé. La constitution v1.2.0 impose désormais un eyebrow qui dépend du contexte de lecture. La fonction de calcul est livrée ici ; le composant devra recevoir un libellé **déjà calculé** | À la feature « pages publiques » |
| L'état « sans image » de la Card devient inatteignable en page publique | FR-014 exige une couverture sur tout article publié. L'état reste un filet de sécurité utile — image qui ne charge pas — mais aucun article publié ne l'atteindra par absence de donnée | Constat, rien à trancher |
| La porte 10 ne dit rien de l'ordre des nuls | La divergence SQLite/PostgreSQL au tri (research D7) est au moins aussi dangereuse que les quatre interdits déjà listés, et bien moins connue | Candidat à un amendement de la porte 10 |
| La recherche plein texte ne sera pas portable naïvement | `LIKE` est insensible à la casse en SQLite, sensible en PostgreSQL ; `mode: 'insensitive'` n'existe pas en SQLite ; le tri des accents diffère radicalement (research D8) | À concevoir en connaissant la limite, feature « recherche » |
| La chaîne Nuxt 4.4 + Nitro 2.13 + Prisma 7 + better-sqlite3 n'est documentée nulle part | Le `traceInclude` retenu est une précaution raisonnée, pas une recette validée. **Une compilation qui réussit ne prouve rien** : le point de rupture est au démarrage | À vérifier au premier `node .output/server/index.mjs` |
