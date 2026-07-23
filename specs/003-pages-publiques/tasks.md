---
description: "Task list — Pages publiques"
---

# Tasks: Pages publiques

**Input**: Design documents from `/specs/003-pages-publiques/`
**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/)

**Tests**: inclus. Le projet impose `npm run test:unit` et `npm run test:e2e` comme portes
de qualité (CLAUDE.md) ; la stratégie de test est fixée par research D12. Chaque récit porte
donc ses tests.

**Organization**: tâches groupées par récit utilisateur (US1→US5), livrables et testables
indépendamment. Réutilise le socle des Fondations (001) et les services de Modèle et
données (002) sans les modifier hors des ajouts rétrocompatibles listés en Phase 2.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichiers distincts, sans dépendance non satisfaite).
- **[Story]** : récit rattaché (US1…US5). Absent en Setup, Foundational et Polish.

---

## Phase 1: Setup (infrastructure partagée)

**Purpose**: préparer la configuration transverse. Le projet Nuxt/Prisma est déjà initialisé
(Fondations, Modèle et données) ; cette phase est minimale.

- [X] T001 Ajouter `runtimeConfig.public.siteUrl` (défaut `https://francometre.com`, surchargeable par variable d'environnement) dans `nuxt.config.ts` — origine absolue du flux et du plan du site (research D6/contrats diffusion).

---

## Phase 2: Foundational (prérequis bloquants)

**Purpose**: briques partagées par plusieurs récits. **Aucun récit ne démarre avant la fin
de cette phase.**

**⚠️ CRITICAL**: couche données + DTO + route de liste + primitives d'affichage communes.

### Données (schéma, migration, seed, services)

- [X] T002 Ajouter le champ `couvertureLegende String?` (nullable) au modèle `Article` dans `prisma/schema.prisma` — distinct de `couvertureAlt` (data-model §1, research D10, porte 10).
- [X] T003 Générer et appliquer la migration additive via `npx prisma migrate dev` (colonne nullable, sans défaut ; régénère le client Prisma).
- [X] T004 Renseigner `couvertureLegende` sur les articles d'exemple **publiés** dans `prisma/seed.ts` (le brouillon reste sans légende ; `db:seed` rejouable) — rend la légende testable (SC-003).
- [X] T005 Étendre les trois lectures publiques (`listerArticlesPublics`, `articlePublicParSlug`, `lireUne`) d'un `include: { couverture: true }` dans `server/services/articles.ts` — ajout rétrocompatible pour disposer de la clé de couverture au mappage (research D9).
- [X] T006 Ajouter `compterArticlesPublics(options)` (même `filtreVisible`, même `rubriqueId?`, `prisma.article.count`) dans `server/services/articles.ts` — total de pagination (research D3). *(même fichier que T005)*

### Couche de présentation (DTO)

- [X] T007 [P] Créer l'util pur `shared/utils/tempsLecture.ts` — débalise le corps, compte les mots, divise par 200 mots/min, arrondi supérieur, plancher 1 min (research D4, FR-014).
- [X] T008 [P] Test unitaire de `tempsLecture` dans `tests/unit/tempsLecture.test.ts` (mots/cadence/plancher/HTML débalisé).
- [X] T009 Créer `server/utils/presentation.ts` — mappeurs entité→DTO (`CarteDTO`, `UneHeroDTO`, `UneSecondaireDTO`, `ArticleDTO`, `ListePagineeDTO`), URL par `stockage.url(cle)`, eyebrow par `eyebrowDe(article, contexte)`, temps de lecture par `tempsLecture` (data-model §2). *(dépend T005, T007)*
- [X] T010 [P] Test unitaire de `presentation` dans `tests/unit/presentation.test.ts` — eyebrow selon contexte (rubrique vs `null`), URL de couverture, couple `image`/`imageAlt`, **titre restitué nu, sans préfixe de composition (FR-019)**, aucun champ Prisma brut ni brouillon dans un DTO.

### Route de liste partagée + primitives d'affichage

- [X] T011 Créer `server/api/articles/index.get.ts` — liste paginée (`rubrique?`, `page`), taille 12, `total`/`totalPages`, 404 sur rubrique inconnue / page non entière / hors bornes, `200` + `[]` si rubrique vide (contrats routes-serveur, research D3). *(dépend T006, T009)*
- [X] T012 [P] Test unitaire dans `tests/unit/articles-public.test.ts` — comptage, découpage des pages sans doublon ni omission, hors-bornes → 404, page vide non erronée (SC-002, base SQLite éphémère `tests/unit/harnais.ts`).
- [X] T013 [P] Créer `app/components/public/GrilleArticles.vue` — grille de `ArticleCard` (récit rubrique et « tous les articles »), sans variante de la Card.
- [X] T014 [P] Créer `app/components/public/Pagination.vue` — commandes de pagination (filet ordinaire, focus visible, libellés français), liens `?page=N`.

**Checkpoint**: données, DTO, route de liste et primitives prêtes — les récits peuvent commencer.

---

## Phase 3: User Story 1 - Accueil éditorialisé (Priority: P1) 🎯 MVP

**Goal**: l'accueil montre la Une ordonnée 01→05, « Les derniers articles » avec lien vers
« Tous les articles », et les sections Environnement/Économie/Culture.

**Independent Test**: ouvrir `/` — héros 01 + vignettes 02–05 dans l'ordre du rang ; grille
des derniers ; sections de rubrique ; « Tout voir » mène à `/articles` qui pagine.

- [X] T015 [US1] Créer `server/api/accueil.get.ts` — compose `AccueilDTO` : `lireUne()` (héros `null` si rang 1 absent, secondaires présents), derniers (`listerArticlesPublics`), sections des rubriques mises en avant **non vides** (Environnement→Économie→Culture) via `presentation.ts` (contrats routes-serveur, FR-004/006/007/008).
- [X] T016 [P] [US1] Créer `app/components/public/UneHero.vue` — image large 16:9, numéro `01` (accent), titre, chapô ; accent tracé à `accueil.html` (porte 4).
- [X] T017 [P] [US1] Créer `app/components/public/UneSecondaire.vue` — numéro 02–05 (accent) + eyebrow rubrique + titre, **sans image** (structure `accueil.html` `.une-secondary`).
- [X] T018 [P] [US1] Créer `app/components/public/SectionRubrique.vue` — titre + « Tout voir » ; grille au-dessus du point de rupture, **rail à défilement horizontal borné** en dessous (research D11, FR-028, porte 7).
- [X] T019 [US1] Créer `app/pages/index.vue` — `useFetch('/api/accueil')`, assemble Une (eyebrow accent « À la une ») + derniers (`GrilleArticles`, contexte eyebrow `null`) + sections ; `definePageMeta` sans rubrique. *(dépend T015–T018)*
- [X] T020 [US1] Créer `app/pages/articles/index.vue` — « Tous les articles » paginé (route T011, `GrilleArticles`, `Pagination`), contexte eyebrow `null` (FR-006a). *(dépend T011, T013, T014)*
- [X] T021 [P] [US1] E2E `tests/e2e/accueil.spec.ts` — Une ordonnée 01→05, sections présentes, « Tout voir » → `/articles` paginé, carrousel de rubriques qui défile en interne à 375 px sans débordement de page, dans les deux thèmes (SC-001, SC-007).

**Checkpoint**: US1 pleinement fonctionnel et testable seul (MVP).

---

## Phase 4: User Story 2 - Article complet (Priority: P2)

**Goal**: un article s'affiche entièrement — fil d'Ariane, métadonnées, couverture légendée,
corps riche, « à lire aussi ».

**Independent Test**: ouvrir un article publié ; vérifier en-tête, couverture + légende,
corps (paragraphes/intertitres/listes/citations/liens/images), « à lire aussi » même
rubrique ; un slug de brouillon renvoie 404.

- [X] T022 [US2] Créer `server/api/articles/[slug].get.ts` — `articlePublicParSlug` (404 si `null`), `ArticleDTO` (temps de lecture, couverture `{url,alt,legende}`, fil d'Ariane), `aLireAussi` = même rubrique, courant exclu, borné, contexte eyebrow = la rubrique (contrats routes-serveur, FR-013/015/017/018).
- [X] T023 [P] [US2] Créer `app/components/public/FilAriane.vue` — Accueil → Rubrique → titre courant ; focus visible, français.
- [X] T024 [P] [US2] Créer `app/components/public/CorpsArticle.vue` — rend `corpsHtml` déjà assaini via `v-html`, styles prose (h2/h3, p, ul/ol, blockquote, a, figure/figcaption, img) dérivés de `tokens.md` et de `.corps` d'`article.html`, dans les deux thèmes (research D5, FR-016).
- [X] T025 [US2] Créer `app/pages/article/[slug].vue` — `useFetch('/api/articles/[slug]')`, assemble fil d'Ariane, rubrique, titre, chapô, métadonnées (date · temps de lecture · auteur), `<figure>` couverture + `<figcaption>` légende (distincte du `alt`), `CorpsArticle`, « à lire aussi » (`GrilleArticles`) ; `definePageMeta({ rubrique })`. *(dépend T022–T024)*
- [X] T026 [P] [US2] E2E `tests/e2e/article.spec.ts` — rendu complet, légende visible ≠ texte alternatif, « à lire aussi » exclut le courant, slug de brouillon → 404, dans les deux thèmes (SC-003).

**Checkpoint**: US1 et US2 fonctionnent indépendamment.

---

## Phase 5: User Story 3 - Rubrique paginée + état vide (Priority: P3)

**Goal**: une rubrique liste ses articles publiés en grille paginée, du plus récent au plus
ancien, avec un état vide dédié.

**Independent Test**: ouvrir `/rubrique/environnement` (grille + pagination) ; une rubrique
sans article publié montre l'état vide ; `?page=999` → 404.

- [X] T027 [P] [US3] Créer `app/components/public/EtatVide.vue` — état « rubrique sans article » sobre (charpente conservée, tokens, français), sans accent inventé (FR-012, porte 4).
- [X] T028 [US3] Créer `app/pages/rubrique/[id].vue` — `useFetch('/api/articles?rubrique=[id]&page=')` (route T011), en-tête au nom de rubrique, `GrilleArticles` (contexte eyebrow = la rubrique → sous-thème) + `Pagination`, `EtatVide` si `total = 0`, 404 si rubrique inconnue ou hors bornes, `definePageMeta({ rubrique })`. *(dépend T011, T013, T014, T027)*
- [X] T029 [P] [US3] E2E `tests/e2e/rubrique.spec.ts` — grille ordonnée + pagination sans doublon, eyebrow = sous-thème dans la rubrique, état vide, `?page=999` → 404, deux thèmes (SC-002, SC-006).

**Checkpoint**: US1, US2, US3 indépendamment fonctionnels.

---

## Phase 6: User Story 4 - Pages système (Priority: P4)

**Goal**: 404 « adresse introuvable » (ramène aux derniers articles), 503 « service
indisponible » et 500 « erreur serveur », même charpente.

**Independent Test**: une URL inconnue → page 404 dans la charpente présentant les derniers
articles, statut HTTP 404 ; le gabarit 503 répond en 503.

- [X] T030 [US4] Créer `app/error.vue` — enveloppe `NuxtLayout` (charpente), lit `error.statusCode` : 404 affiche les derniers articles (`$fetch('/api/articles?page=1')`), 503/500 partagent le gabarit d'`etats.html` (chiffre en filigrane « filet », phrase `--ink`, pas d'accent), français, deux thèmes (research D8, FR-020/021/022).
- [X] T031 [P] [US4] E2E `tests/e2e/etats.spec.ts` — URL inconnue → 404 avec derniers articles et bon statut ; gabarit 503 ; charpente présente (SC-004).

**Checkpoint**: états système opérationnels ; les listes ne sont plus des impasses.

---

## Phase 7: User Story 5 - Diffusion (Priority: P5)

**Goal**: flux RSS 2.0 et plan du site XML, articles publiés uniquement, liens absolus.

**Independent Test**: `curl /rss.xml` → 200 `application/rss+xml` avec les derniers publiés ;
`curl /sitemap.xml` → 200 avec accueil + `/articles` + 8 rubriques + articles publiés ; aucun
brouillon.

- [X] T032 [P] [US5] Créer `server/routes/rss.xml.get.ts` — RSS 2.0, `Content-Type: application/rss+xml; charset=utf-8`, `<item>` (titre, lien absolu `siteUrl`, guid, `pubDate` RFC 822, description=chapô), échappement XML, `listerArticlesPublics` (contrats diffusion, FR-023/025).
- [X] T033 [P] [US5] Créer `server/routes/sitemap.xml.get.ts` — `<urlset>` : accueil, `/articles`, 8 rubriques (`listerRubriques`), articles publiés (`<loc>` absolu, `<lastmod>`), aucun brouillon (contrats diffusion, FR-024/025).
- [X] T034 [P] [US5] E2E `tests/e2e/diffusion.spec.ts` — `rss.xml` et `sitemap.xml` répondent (statut, type), listent les publiés, excluent le brouillon, liens absolus (SC-004).

**Checkpoint**: tous les récits livrés.

---

## Phase 8: Polish & transversal

**Purpose**: qualité transversale et portes du projet.

- [X] T035 [P] Vérifier l'accessibilité e2e (focus visible sur pagination/fil d'Ariane/liens, `prefers-reduced-motion`, `aria-current` sur la rubrique affichée, `alt` réel sur les vignettes **et sur la couverture d'article** — FR-030) dans `tests/e2e/a11y.spec.ts` (étendre l'existant), deux thèmes (porte 8, SC-008).
- [X] T036 [P] Vérifier l'absence de défilement horizontal de page à 375 px sur toutes les pages publiques (étendre `tests/e2e/responsive.spec.ts`), le carrousel restant borné (porte 7, SC-007).
- [X] T037 Exécuter `npm run verifier` et `npm run typecheck` ; corriger tout écart (sobriété, portabilité, types) — aucune URL de média en base, aucun import `node:fs` hors `stockage` (portes 9/10).
- [X] T038 Vérifier les contrastes AA dans les **deux** thèmes et viser Lighthouse ≥ 90 (perf/SEO/a11y) sur accueil, rubrique, article (SC-008, porte 6).
- [X] T039 Dérouler `quickstart.md` (7 scénarios) de bout en bout et cocher la définition de terminé.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (P1)** : immédiat.
- **Foundational (P2)** : dépend du Setup — **bloque tous les récits**.
- **US1→US5 (P3–P7)** : démarrent après P2. Priorité P1→P5 ou en parallèle si équipe.
- **Polish (P8)** : après les récits visés.

### User Story Dependencies

- **US1 (P1)** : après P2. Indépendant (MVP).
- **US2 (P2)** : après P2. Indépendant (route article + composants propres).
- **US3 (P3)** : après P2. Indépendant (réutilise route de liste, grille, pagination de P2).
- **US4 (P4)** : après P2. Le contenu « derniers articles » de la 404 s'appuie sur la route de liste (P2).
- **US5 (P5)** : après P2. Indépendant (routes de diffusion propres).

### Détail intra-Foundational

- T003 dépend de T002 ; T004 dépend de T003 ; T006 suit T005 (même fichier).
- T009 dépend de T005 + T007 ; T011 dépend de T006 + T009.

### Parallel Opportunities

- Setup : T001 seul.
- Foundational : {T007, T008} ∥ {T013, T014} ∥ (T005→T006→T009→T011 en chaîne) ; T010, T012 après leurs cibles.
- US1 : T016, T017, T018 en parallèle, puis T019 ; T020 en parallèle de T016–T018 (dépend de P2) ; T021 après le rendu.
- US2 : T023, T024 en parallèle, puis T025 ; T026 après.
- Une fois P2 terminé, US1–US5 peuvent avancer en parallèle par personnes distinctes.

---

## Parallel Example: User Story 1

```bash
# Composants de la Une en parallèle (fichiers distincts) :
Task: "UneHero.vue in app/components/public/UneHero.vue"
Task: "UneSecondaire.vue in app/components/public/UneSecondaire.vue"
Task: "SectionRubrique.vue in app/components/public/SectionRubrique.vue"
# Puis assemblage :
Task: "app/pages/index.vue"
```

---

## Implementation Strategy

### MVP d'abord (US1)

1. Phase 1 Setup → 2. Phase 2 Foundational (bloquant) → 3. Phase 3 US1 →
4. **STOP & VALIDER** : accueil 01→05 + `/articles` paginé → démo.

### Livraison incrémentale

Foundational prêt → US1 (MVP) → US2 → US3 → US4 → US5, chacun testé et démontrable
indépendamment, sans casser les précédents. Polish en clôture.

---

## Notes

- `[P]` = fichiers distincts, sans dépendance non satisfaite.
- La Card reste **unique** : les nouveaux composants sont des compositions de structure, pas
  des variantes (porte 2).
- Aucun composant des Fondations n'est modifié ; les services de 002 ne reçoivent que des
  ajouts rétrocompatibles (T005, T006).
- Commit après chaque tâche ou groupe logique ; messages en français.
- Vérifier que chaque test échoue avant d'implémenter la cible.
