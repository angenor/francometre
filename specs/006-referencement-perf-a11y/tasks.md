---
description: "Liste de tâches — Référencement, performance, accessibilité"
---

# Tasks: Référencement, performance, accessibilité

**Input**: Documents de conception dans `specs/006-referencement-perf-a11y/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [contracts/](contracts/)

**Tests** : INCLUS. Le projet est piloté par les tests (Vitest + Playwright + axe) et la
feature est « vérifiable » par construction (SC-001). Chaque histoire porte ses tests.

**Organisation** : par histoire utilisateur, dans l'ordre de priorité de `spec.md`
(US1 P1 → US4 P4). Chaque histoire est un incrément indépendamment testable.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichiers distincts, aucune dépendance sur une tâche incomplète).
- **[Story]** : US1..US4. Aucune étiquette en Setup, Foundational et Polish.
- Chemins de fichiers exacts inclus.

**Rappels du projet** : commentaires et messages en français ; validation Zod sur toute
entrée de route serveur ; jamais d'accès Prisma depuis un composant ; jamais d'URL de média
en base ; deux thèmes ; `npm run verifier` + `typecheck` tiennent lieu de lint.

---

## Phase 1 : Setup (infrastructure partagée)

**Objectif** : outillage de la feature.

- [X] T001 [P] Ajouter les devDeps d'audit `playwright-lighthouse` et `lighthouse` à `package.json` (réutilisent le Chromium de Playwright ; servent l'audit ≥ 90 en Polish — research D11).

**Checkpoint** : outillage prêt.

---

## Phase 2 : Foundational (prérequis bloquant partagé)

**Objectif** : l'utilitaire canonique, partagé par US1 (toutes les pages) et US3 (article).

**⚠️ À terminer avant US1 et US3.**

- [X] T002 Créer `app/utils/seo.ts` : fonction **pure** `urlCanonique(siteUrl, path)` (jonction sans double `/`, sans barre finale superflue, paramètre `?page=N` conservé) et constante `ROBOTS_NOINDEX = 'noindex, follow'` (research D2, contrat `contracts/seo.md`).
- [X] T003 [P] Test unitaire `tests/unit/seo-url.test.ts` : `urlCanonique` (apex + chemin, `?page=2` conservé, aucune double barre, barre finale normalisée).

**Checkpoint** : base canonique disponible ; US1 et US3 peuvent démarrer.

---

## Phase 3 : User Story 1 — Chaque page est trouvable et non dupliquée (Priority: P1) 🎯 MVP

**Goal** : titre + description propres sur chaque page (marque « Francomètre »), adresse
canonique unique sur l'apex, redirection `www` → apex, `robots.txt` déclarant le plan du
site, lien flux RSS dans l'en-tête, `noindex` sur les pages non publiques. (FR-001→007,
SC-004, SC-005)

**Independent Test** : ouvrir `/`, `/rubrique/environnement`, `/articles`, un article —
titre + description propres et marqués « Francomètre » ; `curl -I -H "Host: www.francometre.com"`
renvoie 301 vers l'apex ; `GET /robots.txt` déclare le sitemap ; `/connexion` et une 404
signalent `noindex`.

### Tests (US1)

- [X] T004 [P] [US1] Créer `tests/e2e/seo.spec.ts` : titres + descriptions non vides et marqués « Francomètre » sur `/`, `/rubrique/environnement`, `/articles`, `/article/le-retour-du-lynx-dans-le-jura` ; `<link rel="canonical">` absolu sur l'apex ; `?page=2` auto-canonique ; **301** `www` → apex ; contenu de `/robots.txt` (Sitemap + `Disallow: /admin`) ; `noindex` sur `/connexion`, page d'erreur et en-tête `X-Robots-Tag` sur `/admin` (contrat `contracts/seo.md`).

### Implémentation (US1)

- [X] T005 [US1] `nuxt.config.ts` → `app.head` : description par défaut, `og:site_name = Francomètre`, `twitter:card = summary_large_image`, `<link rel="alternate" type="application/rss+xml" title="Francomètre" href="{siteUrl}/rss.xml">` (FR-005 ; construire l'URL depuis `runtimeConfig.public.siteUrl`).
- [X] T006 [US1] `nuxt.config.ts` → `routeRules` : ajouter l'en-tête `X-Robots-Tag: noindex` à `/admin` et `/admin/**` (conserver `cache-control: no-store` existant) (FR-006). *(même fichier que T005 → séquentiel)*
- [X] T007 [P] [US1] Créer `server/middleware/canonique.ts` : si l'en-tête `Host` commence par `www.`, **301** vers `{siteUrl}{event.path}` (cible = `siteUrl`, `Host` sert seulement à détecter — research D2). Aucun effet hors `www.`.
- [X] T008 [P] [US1] Créer `server/routes/robots.txt.get.ts` : `User-agent: *` / `Allow: /` / `Disallow: /admin` / `Sitemap: {siteUrl}/sitemap.xml` ; `Content-Type: text/plain; charset=utf-8` (FR-005, contrat §6).
- [X] T009 [P] [US1] `app/pages/index.vue` : `useSeoMeta` — description propre + `link` canonique `{siteUrl}/` (via `app/utils/seo.ts`). Titre existant conservé.
- [X] T010 [P] [US1] `app/pages/rubrique/[id].vue` : `useSeoMeta` — titre « {Libellé} — Francomètre », description propre, canonique `{siteUrl}/rubrique/{id}` (+`?page=N` si N>1).
- [X] T011 [P] [US1] `app/pages/articles/index.vue` : `useSeoMeta` — titre « Tous les articles — Francomètre », description propre, canonique `{siteUrl}/articles` (+`?page=N`).
- [X] T012 [P] [US1] `app/pages/article/[slug].vue` : ajouter description (= chapô) + canonique `{siteUrl}/article/{slug}` au `useHead`/`useSeoMeta` existant (l'OG et le JSON-LD viennent en US3).
- [X] T013 [P] [US1] `app/pages/connexion.vue` : `useSeoMeta` — titre « Connexion — Francomètre », description propre, `robots: ROBOTS_NOINDEX` (FR-006).
- [X] T014 [P] [US1] `app/error.vue` : `useSeoMeta` — `robots: ROBOTS_NOINDEX` + description propre selon l'état (404/503) (FR-006).
- [X] T015 [P] [US1] `app/components/layout/AppFooter.vue` : l'entrée « Flux RSS » pointe vers `/rss.xml` (FR-005).

**Checkpoint** : le site est trouvable, non dupliqué, non ambigu. MVP livrable.

---

## Phase 4 : User Story 2 — Utilisable au clavier et par les technologies d'assistance (Priority: P2)

**Goal** : parcours clavier complet sur toutes les pages (administration comprise, éditeur
TipTap et réordonnancement de la Une inclus), focus visible, AA dans les deux thèmes, un seul
`h1` par page, régions repérables, `alt` réels. (FR-012→017, SC-003, SC-006, SC-010)

**Independent Test** : ranger la souris ; parcourir `/`, un article, une rubrique,
`/connexion` et le back-office à la tabulation ; axe sans violation en clair et en sombre
(dont `/articles`, `/connexion`, page système) ; un seul `h1` et repères nommés par page.

### Tests (US2)

- [X] T016 [US2] Étendre `tests/e2e/a11y.spec.ts` : axe sans violation sur `/articles`, `/connexion` et une page système (404), dans les **deux** thèmes ; contrôle « exactement un `h1` » et « repères `nav`/`main`/`contentinfo` présents et nommés » sur les pages publiques et d'administration (FR-014, FR-015, SC-006, SC-010) ; assertion « toute couverture d'article porte un `alt` réel non vide » sur l'accueil et `/articles` (FR-016) ; contrôle « sous `prefers-reduced-motion: reduce`, le squelette de chargement et les transitions sont neutralisés » (FR-017, porte 8).
- [X] T017 [P] [US2] Créer `tests/e2e/clavier.spec.ts` : parcours **au clavier seul** de `/`, un article, une rubrique, `/connexion` et le back-office (ordre logique, focus visible à chaque pas) ; **éditeur TipTap** (`/admin/articles/nouveau`) : barre d'outils atteignable au Tab et un format basculable au clavier ; **réordonnancement de la Une** (`/admin/une`) : focus sur `[data-poignee]` → `ArrowUp`/`ArrowDown` → l'ordre change, la région `aria-live` annonce, le focus revient à la poignée (research D12, FR-012, SC-003).

### Implémentation (US2)

- [X] T018 [US2] Corriger les écarts révélés par T016/T017 : garantir un `h1` unique et des repères nommés dans `app/components/layout/AppShell.vue`, `app/layouts/admin.vue` et les pages concernées ; focus visible et opérabilité clavier partout où un test échoue. *(Chemins précis selon les échecs ; ne modifier aucune valeur de couleur hors `tokens.css` — porte 2 du verifier.)*

**Checkpoint** : tout le site est opérable au clavier et conforme AA dans les deux thèmes.

---

## Phase 5 : User Story 3 — Aperçu de partage riche et données structurées (Priority: P3)

**Goal** : Open Graph / Twitter Card sur les articles, données structurées `NewsArticle`,
image de partage par défaut (composée depuis le mot-symbole) en repli. URL absolue de média
par l'interface `Stockage`. (FR-008→011, SC-002, SC-007)

**Independent Test** : partager un article **avec** couverture → aperçu (titre, description,
image absolue) ; partager un article **sans** couverture → image de partage par défaut ; le
`NewsArticle` de la page est un JSON valide (titre, date, rubrique, auteur, image).

### Préparation de l'actif (US3)

- [X] T019 [P] [US3] Créer `scripts/partage-defaut.mjs` : composer `public/brand/partage-defaut.png` (1200 × 630) — mot-symbole `public/brand/NOIR.png`/`BLANC.png` centré sur le fond de surface via `sharp`, sans accent — puis l'exécuter et **committer** l'actif (research D7).

### Modèle et présentation serveur (US3)

- [X] T020 [US3] `server/utils/stockage.ts` : ajouter `urlAbsolue(cle, origine)` à l'interface `Stockage` **et** à l'implémentation disque (`origine + url(cle)`) — seule fabrique d'URL absolue de média (porte 9, research D6).
- [X] T021 [P] [US3] Test unitaire `tests/unit/stockage-url.test.ts` : `urlAbsolue` (jonction sans double `/`, préfixe d'origine ; documente le comportement idempotent attendu d'une future URL déjà absolue).
- [X] T022 [US3] `shared/types/dto.ts` : ajouter `SeoArticleDTO` (`canonical`, `imageAbsolue`, `publieISO`, `modifieISO`, `section`, `auteur`) et le champ `seo: SeoArticleDTO` à `ArticlePageDTO` (data-model §2).
- [X] T023 [US3] `server/utils/presentation.ts` : ajouter `metaSeoArticleDe(article, origine)` → `SeoArticleDTO` (image via `stockage.urlAbsolue`, `null` si pas de couverture ; `section` via `libelleRubrique`). *(dépend de T020, T022)*
- [X] T024 [P] [US3] Test unitaire `tests/unit/seo-article.test.ts` : `metaSeoArticleDe` (image absolue quand couverture, `null` sinon ; ISO de `publieLe`/`modifieLe` ; section = libellé ; auteur pass-through).
- [X] T025 [US3] `server/api/articles/[slug].get.ts` : passer `useRuntimeConfig(event).public.siteUrl` et inclure `seo` dans la réponse `ArticlePageDTO`. *(dépend de T023 ; aucune autre route touchée)*
- [X] T026 [P] [US3] Créer `shared/utils/jsonldArticle.ts` : fonction **pure** bâtissant le `NewsArticle` (headline nu, datePublished, dateModified, articleSection, image, mainEntityOfPage, publisher Organisation « Francomètre ») ; **repli auteur** `Person`→`Organization`, **repli image** couverture→défaut (data-model §3).
- [X] T027 [P] [US3] Test unitaire `tests/unit/jsonld-article.test.ts` : replis auteur (null → Organization) et image (null → image par défaut) ; titre nu (aucun préfixe de sous-thème).

### Rendu (US3)

- [X] T028 [US3] `app/pages/article/[slug].vue` : `useSeoMeta` OG/Twitter depuis `data.seo` (`og:type=article`, `og:image = seo.imageAbsolue ?? défaut`, `article:published_time/modified_time/section/author`) + injecter le JSON-LD via `useHead({ script: [{ type: 'application/ld+json', innerHTML: jsonldArticle(...) }] })`. L'`og:image` **et** l'`og:type` d'article **remplacent** le défaut de T029 (`useSeoMeta` déduplique par propriété : **une seule** balise `og:image`, `og:type=article` et non `website`). *(dépend de T025, T026 ; même fichier que T012 → après US1)*
- [X] T029 [US3] `nuxt.config.ts` → `app.head` : `og:image` par défaut = `{siteUrl}/brand/partage-defaut.png` et `og:type = website` (surchargés par l'article) (FR-010). *(même fichier que T005/T006 → séquentiel)*

### Test de bout en bout (US3)

- [X] T030 [US3] Créer `tests/e2e/partage.spec.ts` : article avec couverture → `og:image` absolue ; article sans couverture → `…/brand/partage-defaut.png` ; **exactement une** balise `og:image` et `og:type=article` sur l'article (aucun doublon avec le défaut de T029) ; présence d'un unique `NewsArticle` JSON valide sur la page article ; absence sur les pages non-article (SC-002, SC-007).

**Checkpoint** : un article partagé montre un bel aperçu et s'expose en article de presse.

---

## Phase 6 : User Story 4 — Pages de liste rapides, accueil dense compris (Priority: P4)

**Goal** : cache `swr` (borné < 60 s) sur les listes, images `<NuxtImg>` dimensionnées,
paresseuses hors héros/couverture. (FR-018→021, SC-008, SC-009)

**Independent Test** : recharger `/` sert du cache et revalide en fond ; publier un article →
visible sur `/` en < 60 s ; au moniteur réseau, images hors écran différées, héros/couverture
immédiats ; `<NuxtImg>` émet un `srcset` webp.

### Implémentation (US4)

- [X] T031 [US4] `nuxt.config.ts` → `routeRules` : `swr` `maxAge: 30` sur `/`, `/articles`, `/articles/**`, `/rubrique/**` (FR-018, FR-019 ; borne 30 s < 60 s pour SC-009 ; `/admin/**` reste `no-store`). SC-009 (fraîcheur < 60 s) se vérifie **manuellement** au quickstart B1 — la revalidation swr n'est pas testable en e2e de façon déterministe (finding M2, assumé). *(même fichier que T005/T006/T029 → séquentiel)*
- [X] T032 [US4] `nuxt.config.ts` → `image` : autoriser IPX à traiter les médias de même origine `/medias/**` (`domains` / réglage provider au besoin — research D10). *(même fichier → séquentiel)*
- [X] T033 [P] [US4] `app/components/ui/ArticleCard.vue` : `<img>` → `<NuxtImg>` `loading="lazy"` + `sizes` (contrat performance §2) ; **préserver** le repli `@error` (research D10) et le contrat `alt` obligatoire.
- [X] T034 [P] [US4] `app/components/public/UneHero.vue` : `<img>` → `<NuxtImg>` `loading="eager"` `fetchpriority="high"` + `sizes` (LCP accueil, FR-020).
- [X] T035 [US4] `app/pages/article/[slug].vue` : couverture `<img>` → `<NuxtImg>` `eager`/`high` + `sizes` (LCP article). *(même fichier que T012/T028 → après US3)*
- [X] T036 [US4] Créer `tests/e2e/images.spec.ts` : le héros de l'accueil et la couverture d'article portent `loading="eager"` ; les vignettes de grille portent `loading="lazy"` ; `<NuxtImg>` émet un `srcset` webp ; aucun débordement à 375 px (SC-008).

**Checkpoint** : listes rapides, images dimensionnées et paresseuses, fraîcheur < 60 s.

---

## Phase 7 : Polish & vérification transverse

**Purpose** : verrouiller SC-001 et la non-régression du socle.

- [X] T037 [P] Créer `tests/e2e/audit.spec.ts` : Lighthouse via `playwright-lighthouse` sur `/` et une page `/article/**`, profils **mobile** et **bureau** ; échoue si performance, référencement ou accessibilité < **90** (SC-001, research D11).
- [X] T038 Ajouter le script `"audit"` à `package.json` (lance l'audit contre `npm run preview`) et documenter au besoin dans `CLAUDE.md` la commande.
- [X] T039 Exécuter `npm run verifier` (porte 9 verte — aucune URL de média en base, `node:fs` confiné), `npm run typecheck`, `npm run test:unit`, `npm run test:e2e` ; corriger toute régression.
- [X] T040 Dérouler `quickstart.md` (A→E) et confirmer SC-001 à SC-010 — dont la **vérification manuelle de SC-009** (publier un article → visible sur `/` en < 60 s, non automatisée, cf. M2) ; vérifier qu'aucune migration n'a été introduite.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : aucune dépendance.
- **Foundational (Phase 2)** : après Setup. **Bloque US1 et US3** (utilitaire canonique).
- **US1 (Phase 3)** : après Foundational.
- **US2 (Phase 4)** : après Foundational ; indépendante d'US1 (mais souvent après, priorité).
- **US3 (Phase 5)** : après Foundational ; **T028/T035 touchent `article/[slug].vue`** déjà édité par US1 (T012) → US3 après US1 sur ce fichier.
- **US4 (Phase 6)** : après Foundational ; **T035 touche `article/[slug].vue`** → après US3 (T028) sur ce fichier.
- **Polish (Phase 7)** : après toutes les histoires visées (l'audit mesure le résultat cumulé).

### Fichiers à écritures multiples (sérialiser, jamais `[P]` entre eux)

- `nuxt.config.ts` : T005 → T006 → T029 → T031 → T032.
- `app/pages/article/[slug].vue` : T012 (US1) → T028 (US3) → T035 (US4).

### Within Each User Story

- **Tests d'acceptation / bout en bout d'abord** (T004, T016, T017, T030), écrits et vus
  échouer avant l'implémentation de leur histoire.
- **Tests unitaires** de fonctions/méthodes pures (T003, T021, T024, T027) : écrits **en
  regard de leur cible**, une fois sa signature posée, et vus échouer avant que son corps ne
  soit rempli (d'où leur position juste après la création du fichier cible — ce n'est pas du
  test-après).
- Interface/DTO (T020, T022) avant les mappeurs (T023) avant la route (T025) avant le rendu (T028).
- Histoire complète avant de passer à la priorité suivante.

### Parallel Opportunities

- **US1** : T007, T008, T009, T010, T011, T012, T013, T014, T015 en parallèle (fichiers
  distincts ; l'utilitaire T002 est déjà fait). T004 (test) en parallèle aussi.
- **US3** : T021, T024, T026, T027 (tests, fichiers distincts) et T019 (script) en parallèle ;
  T020/T022 séquencent T023 → T025 → T028.
- **US4** : T033 et T034 en parallèle (composants distincts).
- Les quatre histoires peuvent être menées en parallèle par plusieurs personnes **après**
  la Phase 2, à l'exception des fichiers à écritures multiples ci-dessus.

---

## Parallel Example: User Story 1

```bash
# Après T002/T003 (Foundational), lancer en parallèle les fichiers distincts d'US1 :
Task T007: "server/middleware/canonique.ts — redirection www → apex"
Task T008: "server/routes/robots.txt.get.ts — robots.txt + Sitemap"
Task T010: "app/pages/rubrique/[id].vue — titre + description + canonique"
Task T011: "app/pages/articles/index.vue — titre + description + canonique"
Task T013: "app/pages/connexion.vue — noindex"
Task T014: "app/error.vue — noindex"
Task T015: "app/components/layout/AppFooter.vue — lien Flux RSS"
# (T005/T006 sur nuxt.config.ts restent séquentiels)
```

---

## Implementation Strategy

### MVP First (US1 seule)

1. Phase 1 (Setup) + Phase 2 (Foundational).
2. Phase 3 (US1) — trouvable, non dupliqué.
3. **STOP et VALIDER** : titres/descriptions, canonique, 301 `www`, `robots.txt`, `noindex`.
4. Livrable : le site est proprement indexable.

### Incremental Delivery

1. Setup + Foundational → base prête.
2. US1 → tester → livrer (**MVP** : trouvable).
3. US2 → tester → livrer (utilisable par tous).
4. US3 → tester → livrer (partage riche + données structurées).
5. US4 → tester → livrer (rapide).
6. Polish → audit ≥ 90 verrouillé, socle non régressé.

### Notes

- `[P]` = fichiers distincts, aucune dépendance incomplète.
- Écrire les tests avant l'implémentation ; les voir échouer d'abord.
- Committer après chaque tâche ou groupe logique, en français.
- **Dépendance externe** : aucune — l'image de partage par défaut est composée en T019
  (research D7, plus bloquante).
- Ne modifier **aucune** valeur de couleur hors `app/assets/css/tokens.css` (verifier, porte 2) ;
  aucune migration ; aucune URL de média en base (porte 9).
