---

description: "Liste de tâches — Fondations, socle visuel et structurel"
---

# Tasks: Fondations — socle visuel et structurel

**Input**: Documents de conception de `/specs/001-fondations-socle-ui/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md),
[data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: inclus. Les critères d'acceptation sont pour l'essentiel visuels et
d'accessibilité — absence de flash, parcours clavier, contraste AA dans les deux thèmes,
aucun débordement de 375 à 1440 px. Les tâches de test ne sont pas optionnelles ici : elles
**sont** le moyen de prouver ces critères.

**Organization**: tâches groupées par user story, pour permettre une implémentation et une
vérification indépendantes.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : parallélisable (fichiers distincts, aucune dépendance en attente)
- **[Story]** : user story de rattachement (US1 → US6)
- Chaque tâche porte son chemin de fichier exact

---

## À lire avant de commencer

### Trois pièges qui coûtent cher s'ils sont découverts tard

1. **`@theme inline`, pas `@theme`.** Sans le mot-clé `inline`, les utilitaires figent la
   valeur du thème clair et la bascule reste sans effet sur les couleurs
   ([research.md](./research.md) D2).
2. **`classSuffix: ''` sur `@nuxtjs/color-mode`.** Le module suffixe par `-mode` par défaut :
   sans cette option, `<html>` porte `dark-mode`, et ni les tokens ni `@custom-variant dark`
   ne s'appliquent. Le site reste en clair sans qu'aucune erreur ne le signale.
3. **Aucun `tailwind.config.js`.** Tailwind v4 se configure entièrement en CSS. Créer ce
   fichier est un retour à la v3 : il n'aura aucun effet et fera croire à une configuration
   qui n'existe pas.

### Deux écarts délibérés au découpage par story

- **Les deux thèmes sont fondationnels, la bascule ne l'est pas.** Le principe IV interdit de
  livrer un écran mono-thème : la phase 2 pose donc les tokens des deux thèmes. US2 ajoute ce
  qui distingue un dessin d'un mécanisme — ouverture sur le thème du système, persistance,
  absence de flash.
- **`ThemeToggle` et `RubriqueIcon` sont fondationnels** parce que deux stories distinctes les
  placent (US1 dans la colonne, US3 dans la barre supérieure). Les créer dans l'une créerait
  une dépendance croisée.

### Un point d'attention en phase 9

Boutons et champs font partie du socle (arbitrage du 2026-07-18, FR-050 à FR-056). Sur ces
deux composants, **les maquettes sont en défaut sur l'accessibilité** : elles posent
`outline:none` sans remplacement. Le principe VIII prime — d'où T078a, qui n'est pas une
option de confort.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: initialisation du projet, modules et outillage

- [X] T001 Initialiser Nuxt 4.4.8 à la racine du dépôt (`package.json`, `nuxt.config.ts`, `app/app.vue`) en préservant `docs/`, `public/brand/`, `specs/` et `.specify/`
- [X] T002 Installer `tailwindcss` et `@tailwindcss/vite` en 4.3.3, et les épingler dans `package.json` — **ne pas créer de `tailwind.config.js`**
- [X] T003 Installer les modules Nuxt dans `package.json` : `@nuxtjs/color-mode` 4.0.1, `@nuxt/fonts` 0.14.0, `@nuxt/image` 2.0.0, `@nuxt/icon` 2.3.1
- [X] T004 [P] Installer `@playwright/test` 1.61.1 et `@axe-core/playwright` 4.12.1, puis `npx playwright install chromium`
- [X] T005 Raccorder Tailwind dans `nuxt.config.ts` : plugin Vite `tailwindcss()` et `css: ['~/assets/css/main.css']` — sans le module `@nuxtjs/tailwindcss`, qui n'est pas la voie officielle pour la v4
- [X] T006 Déclarer les quatre modules dans `nuxt.config.ts`, avec `app.head.htmlAttrs.lang = 'fr'` — **amendé le 2026-07-18** : plus de `nitro: { preset: 'deno_server' }`, Nitro vise sa cible par défaut ([plan.md](./plan.md))
- [X] T007 [P] ~~Créer `deno.json`~~ — **sans objet** : le runtime Deno est abandonné au profit de la cible Nitro par défaut (amendement du 2026-07-18, [plan.md](./plan.md)). Aucun fichier de runtime n'est nécessaire
- [X] T008 [P] Activer TypeScript strict et ajouter les scripts `dev`, `build`, `preview`, `typecheck`, `verifier`, `test:e2e` dans `package.json`
- [X] T009 [P] Configurer `@nuxt/fonts` dans `nuxt.config.ts` pour auto-héberger Archivo (400 à 800) et Instrument Sans (400 à 600) — aucun CDN
- [X] T010 [P] Configurer `@nuxt/image` dans `nuxt.config.ts` — employé par les features de contenu, pas par Fondations
- [X] T011 [P] Créer les actifs locaux de démonstration sous `public/demo/` — aucun service d'images de remplacement en ligne
- [X] T012 [P] Créer `playwright.config.ts` : `baseURL` local, `webServer`, projets aux largeurs 375, 768, 999, 1000 et 1440 px
- [X] T013 Vérifier que `npm run build` produit `.output/server/index.mjs` et que `node .output/server/index.mjs` sert la page — **fait**, HTTP 200 sur `/styleguide`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: tokens, thèmes, cadre — tout ce dont les stories dépendent

**⚠️ CRITIQUE** : aucune story ne peut démarrer avant la fin de cette phase

- [X] T014 Créer `app/assets/css/tokens.css` — **toutes** les valeurs de `docs/design/html/tokens.md`, pas seulement les couleurs : les six couleurs des deux thèmes (§1), les deux familles et l'échelle typographique complète (§2), gouttières, conteneur, contenu, colonne de lecture, écarts de section, épaisseur de filet, largeur de rail (§3), angle de coupe (§4). **Seul fichier du dépôt autorisé à porter une valeur**
- [X] T014a Déclarer dans `app/assets/css/tokens.css` les sélecteurs de portée `.theme-clair` et `.theme-sombre` en plus de `:root` et `html.dark`, afin qu'un sous-arbre puisse rendre le thème opposé sans qu'aucune valeur soit écrite en dur — condition pour que le nuancier de la planche passe le contrôle CI de T081 ([contracts/tokens-et-theme.md](./contracts/tokens-et-theme.md) §8)
- [X] T015 Vérifier que `app/assets/css/tokens.css` ne contient **aucun** bloc recopié depuis les fichiers de `docs/design/html/` — ces fichiers redéfinissent chacun leurs variables en tête, et le projet n'a qu'une seule feuille de tokens (principe II)
- [X] T016 Créer `app/assets/css/main.css` avec `@import "tailwindcss";` puis `@import "./tokens.css";`
- [X] T017 Ajouter le bloc `@theme inline` dans `app/assets/css/main.css` : couleurs, familles, tailles, graisses, interlignes, approches, espacements et conteneurs pointant vers les variables de `tokens.css`. **Le mot-clé `inline` est obligatoire**
- [X] T018 Ajouter `@custom-variant dark (&:where(.dark, .dark *));` dans `app/assets/css/main.css`
- [X] T019 Supprimer les familles d'utilitaires interdites dans `app/assets/css/main.css` : `--radius-*`, `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*` à `initial`
- [X] T020 Déclarer `--breakpoint-socle: 1000px` dans `app/assets/css/main.css`
- [X] T021 Définir le repère de focus global dans `app/assets/css/main.css` : 2 px en `--ink`, décalage 2 px, sur tout élément interactif — **jamais en `--line`**, mesuré à 1,25:1 ([research.md](./research.md) D6)
- [X] T022 Configurer `@nuxtjs/color-mode` dans `nuxt.config.ts` : `preference: 'system'`, `fallback: 'light'`, **`classSuffix: ''`**, `storageKey: 'francometre-theme'`
- [X] T023 [P] Créer `app/utils/rubriques.ts` : les huit rubriques dans l'ordre invariable, définition unique du projet ([data-model.md](./data-model.md) §1)
- [X] T024 [P] Créer la collection locale `app/assets/icones/rubriques/` : les huit tracés SVG relevés dans `docs/design/html/accueil.html`, déclarée auprès de `@nuxt/icon` — les pictogrammes des maquettes font partie du système et ne sont pas remplacés par ceux d'une bibliothèque générique (principe I)
- [X] T025 [P] Créer `app/components/ui/RubriqueIcon.vue` : enveloppe de la collection locale, en `currentColor`, masquée aux technologies d'assistance
- [X] T026 Créer `app/components/ui/ThemeToggle.vue` : bouton réel avec pictogramme et libellé, s'appuyant sur `useColorMode()` du module — **aucun composable de thème maison**
- [X] T027 Créer `app/components/layout/AppShell.vue` : cadre centré de 1440 px maximum, cerné d'un filet de 1 px, deux zones côte à côte de même hauteur
- [X] T028 Créer `app/layouts/default.vue` et `app/pages/styleguide.vue` (squelette avec la section d'ouverture de `guide-de-style.html`)
- [X] T029 Vérifier dans les deux thèmes que le cadre s'affiche, que `<html>` porte bien `dark` — **et non `dark-mode`** —, que les couleurs basculent, et que `rounded-lg` et `shadow-md` n'ont aucun effet

**Checkpoint** : le cadre s'affiche dans les deux thèmes, les tokens basculent, les utilitaires interdits sont neutralisés

---

## Phase 3: User Story 1 - La charpente et la navigation latérale (Priority: P1) 🎯 MVP

**Goal**: une page tenue dans un cadre borné, avec la colonne de navigation à gauche sur toute
la hauteur, ses huit rubriques et le signalement de la page courante.

**Independent Test**: ouvrir `/styleguide` au clavier seul, parcourir la colonne de la marque
jusqu'à l'interrupteur, vérifier la largeur du cadre, le filet vertical, l'ordre des huit
rubriques et le signalement de la rubrique courante.

### Tests for User Story 1

- [X] T030 [P] [US1] Créer `tests/e2e/navigation.spec.ts` : ordre des éléments de la colonne, huit rubriques dans l'ordre imposé, `aria-current` sur la seule rubrique courante, absence de signalement quand la page n'a pas de rubrique, parcours clavier complet avec repère de focus visible

### Implementation for User Story 1

- [X] T031 [US1] Créer `app/components/layout/AppRail.vue` : colonne de 248 px, filet vertical de 1 px, ordre imposé marque → recherche → rubriques → interrupteur poussé en bas (FR-003, FR-004)
- [X] T032 [US1] Ajouter le mot-symbole en tête de `app/components/layout/AppRail.vue` : lien vers l'accueil, déclinaison selon le thème depuis **`public/brand/`** — adapter le chemin, ne pas recopier `../assets/` des maquettes. Si un actif manque, poser un emplacement réservé aux bonnes dimensions et **le signaler**, sans inventer de logo (FR-006, FR-042)
- [X] T033 [P] [US1] Créer `app/components/ui/SearchEntry.vue` : contrôle réel libellé « Rechercher », atteignable au clavier, menant vers la page de résultats — ni champ, ni panneau (FR-008, FR-008a)
- [X] T034 [US1] Rendre la liste des huit rubriques dans `app/components/layout/AppRail.vue` depuis `app/utils/rubriques.ts`, chacune précédée de son `RubriqueIcon` (FR-005)
- [X] T035 [US1] Signaler la rubrique courante dans `app/components/layout/AppRail.vue` : `aria-current="page"` et soulignement de 2 px en `--accent` — **seul emploi de l'accent en Fondations** (FR-007)
- [X] T036 [US1] Placer `ThemeToggle` en bas de `app/components/layout/AppRail.vue`, détaché du reste, avec son libellé (FR-004)
- [X] T037 [US1] Brancher `AppRail` dans `app/layouts/default.vue` et transmettre la rubrique courante déclarée par la page (FR-010)
- [X] T038 [US1] Rendre la colonne défilante si elle dépasse la hauteur de la fenêtre, sans recouvrir le contenu et en gardant l'interrupteur atteignable (cas limite)
- [X] T039 [US1] Ajouter la section « Le mot-symbole » à `app/pages/styleguide.vue`, calquée sur `docs/design/html/guide-de-style.html`

**Checkpoint** : US1 est vérifiable seule — le socle est navigable au clavier dans les deux thèmes

---

## Phase 4: User Story 2 - Une bascule de thème qui fonctionne (Priority: P2)

**Goal**: le site s'ouvre dans le thème du système, l'utilisateur peut forcer l'autre, son
choix est mémorisé, et rien ne clignote au chargement.

**Independent Test**: régler le système en sombre, ouvrir `/styleguide` et constater l'absence
de tout affichage transitoire en clair ; basculer, recharger dix fois, naviguer, revenir.

### Tests for User Story 2

- [X] T040 [P] [US2] Créer `tests/e2e/theme.spec.ts` : ouverture selon `colorScheme`, bascule, persistance sur dix rechargements, suivi de la préférence système tant que `preference` vaut `system`, stockage indisponible, et **absence de flash** — vérifier que la classe est posée dès le premier état du document, jamais ajoutée après. Le module annonce résoudre le FOUC ; **c'est ce test qui le prouve**, pas la documentation

### Implementation for User Story 2

- [X] T041 [US2] Vérifier dans `nuxt.config.ts` que la résolution du module correspond à celle exigée : choix enregistré, sinon préférence système, sinon clair ([data-model.md](./data-model.md) §2)
- [X] T042 [US2] Brancher la bascule dans `app/components/ui/ThemeToggle.vue` sur `useColorMode().preference`, en binaire : `light` ↔ `dark`, sans retour explicite à `system` (FR-013)
- [X] T043 [US2] Exposer l'état courant du thème aux technologies d'assistance dans `app/components/ui/ThemeToggle.vue`, avec un libellé français décrivant l'action (FR-017)
- [X] T044 [US2] Faire basculer les déclinaisons du mot-symbole avec le thème dans `app/components/layout/AppRail.vue`, sans reprise après coup — même contrainte de premier rendu que le thème (FR-042)
- [X] T045 [US2] Vérifier qu'aucun composant ne recalcule le thème à son montage — ce serait produire le flash que FR-015 interdit
- [X] T046 [US2] Ajouter la section « Palette » à `app/pages/styleguide.vue` : les deux thèmes **côte à côte**, chaque colonne portant `.theme-clair` ou `.theme-sombre` (T014a) et n'employant que des utilitaires. Les libellés hexadécimaux sont lus à l'exécution depuis la valeur calculée des variables — **aucun littéral de couleur dans le fichier**, sans quoi T081 échouera

**Checkpoint** : la bascule est un mécanisme, plus un dessin

---

## Phase 5: User Story 3 - Le socle sur petit écran (Priority: P3)

**Goal**: sous 1000 px, la colonne cède la place à une barre supérieure et à un menu en
panneau, refermable au clavier ; le contenu prend toute la largeur.

**Independent Test**: afficher `/styleguide` à 375, 999 et 1000 px ; vérifier le basculement,
l'ouverture et la fermeture du menu au clavier, et l'absence de défilement horizontal.

### Tests for User Story 3

- [X] T047 [P] [US3] Créer `tests/e2e/responsive.spec.ts` : absence de débordement aux cinq largeurs dans les deux thèmes, bascule à 999/1000 px, ouverture du menu, focus piégé, fermeture par échappement et focus restitué, fermeture au franchissement de 1000 px

### Implementation for User Story 3

- [X] T048 [P] [US3] Créer `app/components/layout/AppTopbar.vue` : marque, bouton d'ouverture du menu avec `aria-expanded`, interrupteur de thème — et rien d'autre (FR-019)
- [X] T049 [P] [US3] Créer `app/components/layout/AppMenuPanel.vue` : les huit rubriques depuis `app/utils/rubriques.ts`, mêmes pictogrammes et même signalement que la colonne, sans redéclarer la liste (FR-021)
- [X] T050 [US3] Implémenter le piégeage du focus, la fermeture par échappement et par contrôle visible, et la restitution du focus au bouton d'ouverture dans `app/components/layout/AppMenuPanel.vue` (FR-022)
- [X] T051 [US3] Basculer entre colonne et barre supérieure à 1000 px dans `app/components/layout/AppShell.vue` et `app/layouts/default.vue`, contenu sur toute la largeur en dessous (FR-019, FR-020, FR-023)
- [X] T052 [US3] Fermer le panneau au franchissement de 1000 px vers le haut dans `app/components/layout/AppMenuPanel.vue` (cas limite)
- [X] T053 [US3] Appliquer la gouttière de 20 px sous le point de rupture et de 24 px au-dessus dans `app/components/layout/AppShell.vue` (FR-009)

**Checkpoint** : le socle tient de 375 à 1440 px, au clavier comme au pointeur

---

## Phase 6: User Story 4 - La vignette d'article, un composant unique (Priority: P4)

**Goal**: le composant unique de vignette, observable dans ses trois états sur la planche.

**Independent Test**: constater les trois états côte à côte, survoler puis atteindre une
vignette au clavier, vérifier la troncature à trois lignes et l'état sans image.

### Tests for User Story 4

- [X] T054 [P] [US4] Créer `tests/e2e/card.spec.ts` : structure et ordre des éléments, troncature à trois lignes avec un titre long et hauteur stable, survol, focus équivalent, état sans image, repli en cas d'échec de chargement, animations neutralisées sous `reducedMotion`

### Implementation for User Story 4

- [X] T055 [US4] Créer `app/components/ui/ArticleCard.vue` : image 16:9, rubrique en petites capitales, titre à trois lignes maximum, date — vignette entièrement cliquable, sans bouton ni « lire la suite » (FR-026, FR-027)
- [X] T056 [US4] Implémenter le survol dans `app/components/ui/ArticleCard.vue` : agrandissement de l'image à 1,03 et soulignement du titre en 150 ms, **et rien d'autre** (FR-028)
- [X] T057 [US4] Donner au focus clavier un retour équivalent au survol dans `app/components/ui/ArticleCard.vue` (FR-029)
- [X] T058 [US4] Implémenter l'état sans image dans `app/components/ui/ArticleCard.vue` : dérivé de l'absence de la donnée et **non d'un paramètre**, filet supérieur de 2 px en `--ink` à la place de la vignette ([research.md](./research.md) D9)
- [X] T059 [US4] Basculer sur l'état sans image quand l'image échoue au chargement (cas limite)
- [X] T060 [US4] Neutraliser les animations sous `prefers-reduced-motion` dans `app/components/ui/ArticleCard.vue` (FR-046)
- [X] T061 [US4] Rendre obligatoire le texte alternatif dès qu'une image est fournie dans `app/components/ui/ArticleCard.vue`, et faire échouer en développement un `imageAlt` vide — l'obligation porte sur les images de couverture, pas sur les aplats décoratifs de la planche (FR-031)
- [X] T062 [US4] Ajouter la section « La card » à `app/pages/styleguide.vue` : les trois états côte à côte, avec les mêmes libellés que `guide-de-style.html` (FR-032)

**Checkpoint** : le composant unique existe, ses trois états sont observables

---

## Phase 7: User Story 5 - Le filet de séparation signature (Priority: P5)

**Goal**: le séparateur qui se brise une fois, à l'angle de la marque, avec une position de
brisure paramétrable.

**Independent Test**: afficher plusieurs filets aux positions différentes sur `/styleguide` et
vérifier l'angle et l'unicité de la brisure.

### Tests for User Story 5

- [X] T063 [P] [US5] Créer `tests/e2e/filet.spec.ts` : brisure unique, positions distinctes sur une même page, filet absent de l'arbre d'accessibilité

### Implementation for User Story 5

- [X] T064 [US5] Créer `app/components/ui/FiletCoupe.vue` : deux segments horizontaux de 1 px et un segment diagonal SVG de 64 × 5 px, soit 4 px de dénivelé pour 64 px — l'angle exact quelle que soit la largeur du conteneur (FR-033, FR-034)
- [X] T065 [US5] Exposer la position de brisure en pourcentage comme unique paramètre de `app/components/ui/FiletCoupe.vue`, transmise par variable CSS, et poser `aria-hidden`. **Ne pas figer la position** : elle vaut 50 %, 72 %, 38 %, 60 % et 66 % selon les sections de l'accueil (FR-035, FR-036)
- [X] T066 [US5] Ajouter la section « Le filet coupé » à `app/pages/styleguide.vue` : le schéma coté, la taille réelle, et la comparaison filet ordinaire / filet coupé qui rend la règle de frontière visible (FR-037)

**Checkpoint** : l'ornement signature existe et ne se produit qu'une fois par filet

---

## Phase 8: User Story 6 - Le pied de page (Priority: P6)

**Goal**: le pied de page sous le contenu, dans la colonne de droite.

**Independent Test**: dérouler `/styleguide` jusqu'en bas, vérifier l'alignement sur la
colonne de contenu et la présence des huit rubriques et des deux groupes de liens.

### Tests for User Story 6

- [X] T067 [P] [US6] Créer `tests/e2e/footer.spec.ts` : placement dans la colonne de droite, huit rubriques menant aux mêmes destinations que la colonne, empilement sans débordement à 375 px

### Implementation for User Story 6

- [X] T068 [US6] Créer `app/components/layout/AppFooter.vue` : mot-symbole et signature, les huit rubriques depuis `app/utils/rubriques.ts`, liens d'information, liens à suivre, ligne légale (FR-040)
- [X] T069 [US6] Employer les mêmes ressources de `public/brand/` qu'ailleurs dans `app/components/layout/AppFooter.vue`, à la taille du pied de page — **aucune déclinaison « bloc »** (FR-042a)
- [X] T070 [US6] Placer `AppFooter` sous le contenu **à l'intérieur de la colonne de droite** dans `app/layouts/default.vue`, jamais sous la colonne de navigation (FR-039)
- [X] T071 [US6] Empiler les groupes du pied de page sans débordement à 375 px dans `app/components/layout/AppFooter.vue`

**Checkpoint** : les six stories sont livrées et vérifiables indépendamment

---

## Phase 9: Planche de style — sections restantes

**Purpose**: compléter `/styleguide` pour qu'il corresponde à `guide-de-style.html`

- [X] T072 [P] Ajouter la section « Deux familles » à `app/pages/styleguide.vue` : Archivo et Instrument Sans, échelle typographique rendue depuis les tokens — aucune valeur écrite à la main
- [X] T073 [P] Ajouter la section « Espacements » à `app/pages/styleguide.vue` : base 4 px, gouttière, conteneur, contenu, écarts de section, lus depuis les tokens
- [X] T074 [P] Ajouter la section « Interdits absolus » à `app/pages/styleguide.vue`, reprenant l'énoncé de `guide-de-style.html`
- [X] T075 Vérifier section par section que `app/pages/styleguide.vue` correspond à `docs/design/html/guide-de-style.html` — mêmes sections, mêmes états de composants (FR-048a)

### Boutons et champs

> Arbitrage rendu le 2026-07-18 : ces deux composants **font partie du socle** et sont
> désormais spécifiés (FR-050 à FR-056). Ils ne sont plus suspendus.

- [X] T076 Créer `app/components/ui/AppButton.vue` : quatre variantes déclarées — primaire (fond `--ink`, libellé `--paper`), secondaire (bordure `--ink`), tertiaire (sans bordure, soulignement au survol), indisponible (`--muted` sur bordure `--line`). Aucun arrondi, aucune ombre, **l'accent ne touche jamais un bouton** (FR-050 à FR-052)
- [X] T077 Créer `app/components/ui/AppField.vue` : saisie sur une ligne soulignée d'un filet `--line` passant en `--ink` au focus, saisie multiligne encadrée d'un filet de 1 px, case à cocher de 18 px sans arrondi, libellé associé obligatoire (FR-053, FR-054)
- [X] T078 Ajouter l'état d'erreur à `app/components/ui/AppField.vue` : message et filet dans le rouge hors palette (`#C81E1E` clair / `#FF6B6B` sombre), associé au champ pour les technologies d'assistance — jamais dans l'accent (FR-056)
- [X] T078a Appliquer le repère de focus visible du site à `AppButton` et `AppField`, **en plus** du traitement des maquettes : celles-ci posent `outline:none` sans remplacement, et le principe VIII prime (FR-055)
- [X] T078b Ajouter la section « Boutons & champs » à `app/pages/styleguide.vue` : les quatre variantes de bouton et les quatre champs de la maquette, y compris l'état de focus montré au repos

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: contrôles transverses et fermeture des dettes ouvertes par la feature

- [X] T079 [P] Créer `tests/e2e/a11y.spec.ts` : `AxeBuilder` avec `withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa'])` sur `/styleguide`, joué dans les **deux** thèmes, **menu de petit écran ouvert compris** — `analyze()` n'examine que l'état courant de la page
- [X] T080 [P] Ajouter au script `verifier` de `package.json` le contrôle des dégradés : rejet de `bg-linear-*`, `bg-radial-*`, `bg-conic-*`, `from-[`, `via-[`, `to-[` et `gradient(` sous `app/` — les dégradés ne relèvent d'aucun espace de noms de thème et ne peuvent pas être supprimés
- [X] T081 [P] Ajouter au script `verifier` de `package.json` le contrôle des valeurs en dur : aucune valeur de couleur hors de `app/assets/css/tokens.css`. **Aucune exemption de fichier** — le nuancier de la planche passe grâce aux sélecteurs de portée de T014a et aux libellés lus à l'exécution, pas grâce à une dérogation
- [X] T082 [P] Ajouter au script `verifier` de `package.json` le contrôle d'absence de `tailwind.config.js` et de `@nuxtjs/tailwindcss`
- [X] T083 Recenser les porteurs de la diagonale sur `/styleguide` et vérifier qu'il n'y en a que deux — le mot-symbole et `FiletCoupe` (porte 3)
- [X] T084 Amender `docs/design/html/tokens.md` des quatre valeurs décidées ici : point de rupture de 1000 px, repère de focus (2 px `--ink`, décalage 2 px), absence de transition à la bascule de thème, texte d'interface à 14 px — le principe II impose de combler la lacune plutôt que de figer la valeur en dur
- [X] T085 Amender `.specify/memory/constitution.md` en v1.1.0 : retirer les arbitrages 3 et 4 de « Arbitrages en attente » et y consigner la règle de frontière des filets et le raccordement du mot-symbole, avec le rapport de synchronisation en tête
- [X] T086 Exécuter `python3 specs/001-fondations-socle-ui/contrastes.py` et vérifier que les couples de texte passent dans les deux thèmes et que les deux couples interdits restent au rouge
- [X] T087 Dérouler la grille manuelle de [quickstart.md](./quickstart.md) **dans les deux thèmes** et consigner le résultat
- [X] T088 Vérifier la compilation et son exécution, et rejouer les tests de bout en bout **contre le serveur compilé** — `FRANCOMETRE_URL` vise le serveur lancé : **225 tests au vert**, cinq largeurs, deux thèmes
- [X] T089 [P] Relire l'ensemble des textes d'interface livrés — français, orthographe et diacritiques corrects (porte 11)
- [X] T090 [P] Mettre à jour `README.md` : lancement en développement et en production (Nitro/Node), adresse de la planche de style, renvoi vers la constitution et les sources de design

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : aucune dépendance
- **Foundational (Phase 2)** : dépend de la phase 1 — **bloque toutes les stories**
- **User Stories (Phases 3 à 8)** : dépendent de la phase 2, puis indépendantes entre elles
- **Planche de style (Phase 9)** : dépend des stories dont elle documente les composants
- **Polish (Phase 10)** : dépend des stories que l'on souhaite livrer

### User Story Dependencies

- **US1 (P1)** : après la phase 2. Aucune dépendance envers une autre story
- **US2 (P2)** : après la phase 2. Configure et branche `@nuxtjs/color-mode` posé en phase 2
- **US3 (P3)** : après la phase 2. Consomme `rubriques.ts` et `RubriqueIcon` — pas `AppRail`, ce qui la rend indépendante d'US1
- **US4 (P4)**, **US5 (P5)**, **US6 (P6)** : après la phase 2, indépendantes entre elles

Aucune story ne dépend d'une autre. Deux points de contact à sérialiser si plusieurs
personnes travaillent en parallèle : `app/pages/styleguide.vue` (chaque story y ajoute sa
section) et `app/layouts/default.vue` (US1, US3, US6).

### Within Each User Story

- Le test de la story est écrit **avant** son implémentation et doit échouer d'abord
- Composants avant leur branchement dans la mise en page
- Section de planche ajoutée en dernier

### Parallel Opportunities

- Phase 1 : T004, T008, T009, T010, T011, T012 en parallèle après T003 (T007 est sans objet)
- Phase 2 : T023, T024, T025 en parallèle. **T016 à T021 non parallélisables** — même fichier `main.css`
- Phase 3 : T030 et T033 en parallèle
- Phase 5 : T047, T048, T049 en parallèle
- Phase 9 : T072, T073, T074 en parallèle
- Phase 10 : T079 à T082, T089, T090 en parallèle
- Une fois la phase 2 close, les six stories sont attribuables à six personnes

---

## Parallel Example: Phase 2

```bash
# Après T022, les trois éléments indépendants ensemble :
Task: "Créer app/utils/rubriques.ts — les huit rubriques"
Task: "Créer la collection locale app/assets/icones/rubriques/ — les 8 tracés"
Task: "Créer app/components/ui/RubriqueIcon.vue — enveloppe de la collection"
```

## Parallel Example: Phase 5

```bash
Task: "Créer tests/e2e/responsive.spec.ts"
Task: "Créer app/components/layout/AppTopbar.vue"
Task: "Créer app/components/layout/AppMenuPanel.vue"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 : Setup
2. Phase 2 : Foundational — **bloque tout le reste**
3. Phase 3 : US1
4. **ARRÊT et VALIDATION** : `/styleguide` s'affiche dans les deux thèmes, la colonne se
   parcourt entièrement au clavier, la rubrique courante est annoncée
5. Démonstration possible

À ce stade le socle est déjà réutilisable : une page de contenu obtiendrait le cadre et la
colonne sans rien redéclarer (FR-010).

### Incremental Delivery

1. Setup + Foundational → le cadre s'affiche dans les deux thèmes
2. + US1 → socle navigable **(MVP)**
3. + US2 → la bascule devient un mécanisme
4. + US3 → le socle tient sur téléphone
5. + US4 → le composant unique de vignette
6. + US5 → l'ornement signature
7. + US6 → le pied de page ferme la page
8. + Phase 9 → la planche correspond à la maquette
9. + Phase 10 → contrôles transverses, vérification contre le serveur compilé, et fermeture des amendements

### Parallel Team Strategy

Après la phase 2, les six stories sont indépendantes. Sérialiser `app/pages/styleguide.vue`
et `app/layouts/default.vue`.

---

## Notes

- Les tâches [P] portent sur des fichiers distincts, sans dépendance en attente
- Chaque story est complétable et vérifiable seule ; s'arrêter à un point de contrôle est un
  état livrable, pas un travail interrompu
- Vérifier que le test d'une story échoue avant de l'implémenter
- Commiter par tâche ou par groupe cohérent
- **T084 et T085 ne sont pas optionnelles** : la constitution proscrit de refermer un
  arbitrage par usage tacite, et qualifie de lacune toute valeur absente de `tokens.md`
- **T078a n'est pas une option** : sur les boutons et les champs, les maquettes posent
  `outline:none` sans remplacement, et le principe VIII prime sur la fidélité aux maquettes
