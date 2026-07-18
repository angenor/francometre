# Implementation Plan: Fondations — socle visuel et structurel

**Branch**: `001-fondations-socle-ui` | **Date**: 2026-07-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-fondations-socle-ui/spec.md`

## Summary

Fondations pose la charpente réutilisée par tout le site : cadre borné, colonne de navigation
latérale, pied de page, vignette d'article unique, filet de séparation signature et bascule de
thème réellement fonctionnelle. Aucune page de contenu n'est livrée.

L'approche technique tient en quatre décisions, détaillées dans [research.md](./research.md) :

1. **Nuxt 4**, projet unique, rendu serveur — le seul moyen simple de poser le thème avant la
   première peinture, et la base des features serveur à venir (back-office, base, stockage).
2. **Tokens en deux couches** : `tokens.css` détient les valeurs, `@theme inline` les expose à
   Tailwind sans en recopier aucune. C'est ce qui réconcilie Tailwind avec le principe II,
   lequel n'admet qu'une seule source de valeurs.
3. **Sobriété appliquée par l'outillage** : les utilitaires de rayon et d'ombre sont
   supprimés du projet, donc inécrivables. Les dégradés, qui ne peuvent pas l'être, sont
   rejetés par un contrôle en intégration continue.
4. **Vérification automatisée** par Playwright et axe-core, seule façon de contrôler pour de
   bon l'absence de flash, le parcours clavier, le contraste AA dans les deux thèmes et
   l'absence de débordement de 375 à 1440 px.

Un point mesuré a valeur de contrainte : le repère de focus ne peut pas être tracé en
`--line` (1,25:1 en clair, 1,30:1 en sombre — pratiquement invisible). Il est en `--ink`.

## Technical Context

**Language/Version**: TypeScript 5.x · Vue 3.5 · **Node.js 22.12+ ou 24.11+** (runtime
serveur — plage exigée par Nuxt 4.4.8, déclarée dans `package.json`)

> **Amendement du 2026-07-18, rendu par le porteur du projet à l'implémentation.** Ce plan
> retenait initialement **Deno 2.9.x** via le preset Nitro `deno_server`. Le choix est
> **abandonné au profit de la cible Nitro par défaut, Node.js.**
>
> Motif : Deno n'apporte rien que la feature exige. Nitro — le moteur serveur de Nuxt, qui
> reste inchangé — produit un serveur Node sans dépendance supplémentaire à installer ni à
> déployer. Aucune exigence de la spécification, aucune porte de la constitution ne
> mentionne le runtime.
>
> Un fait mesuré à l'implémentation confirme le coût du choix initial : une compilation
> `deno_server` **ne démarre pas sous Node** (`ERR_MODULE_NOT_FOUND` sur
> `uncrypto/dist/crypto.node.mjs`), les deux runtimes ne résolvant pas les mêmes conditions
> d'export. Une compilation est faite *pour* une cible ; elle n'est pas portable après coup.
> Le socle reste néanmoins portable **avant** compilation : réviser `nitro.preset` suffit à
> viser Deno, Bun ou une plateforme d'hébergement, sans toucher au code applicatif.

**Primary Dependencies** — versions relevées le 2026-07-18 par `npm view`, non de mémoire :

| Paquet | Version | Rôle |
|---|---|---|
| `nuxt` | 4.4.8 | Framework, rendu serveur |
| `nitropack` | 2.13.4 | Moteur serveur de Nuxt, cible par défaut (Node) |
| `tailwindcss` · `@tailwindcss/vite` | 4.3.3 | Styles. **Aucun `tailwind.config.js`** — tout est en CSS |
| `@nuxtjs/color-mode` | 4.0.1 | Thème en mode classe, `classSuffix: ''` |
| `@nuxt/fonts` | 0.14.0 | Auto-hébergement d'Archivo et Instrument Sans |
| `@nuxt/image` | 2.0.0 | Configuré ici, exploité par les features de contenu |
| `@nuxt/icon` | 2.3.1 | Icônes fonctionnelles + collection locale des huit pictogrammes |
| `@playwright/test` | 1.61.1 | Vérification de bout en bout |
| `@axe-core/playwright` | 4.12.1 | Contrôle d'accessibilité |

Le module `@nuxtjs/tailwindcss` **n'est pas employé** : ce n'est pas la voie officielle pour
la v4.

**Storage**: aucune persistance serveur, aucune base, aucun média. Côté navigateur, une seule
donnée : la préférence de thème, sous la clé `francometre-theme` gérée par `@nuxtjs/color-mode`.

**Testing**: Playwright pour tout ce qui est observable — thème, clavier, largeurs,
accessibilité. Pas de couche de test unitaire pour cette feature : la seule logique non
visuelle est la résolution du thème, mieux couverte de bout en bout qu'isolée, puisque ce qui
doit être prouvé est l'absence de flash au chargement réel.

**Target Platform**: navigateurs à feuilles de style modernes (deux dernières versions) ;
rendu serveur Nitro sur Node.js, sortie de compilation `.output/server/index.mjs`, lancée
par `node .output/server/index.mjs`.

**Project Type**: application web éditoriale, projet Nuxt unique.

**Performance Goals**: l'exigence de tenue n'est pas un débit mais un **séquencement** — le
thème retenu doit être appliqué avant la première peinture, jamais après hydratation (FR-015).
Transition de survol de la vignette : 150 ms. Aucun objectif de charge à ce stade, la feature
ne servant aucune donnée.

**Constraints**: aucun défilement horizontal de 375 à 1440 px · AA dans les deux thèmes,
accent mesuré deux fois · aucun rayon de bordure, aucune ombre, aucun dégradé · interface en
français, diacritiques corrects · exactement deux porteurs de la coupe à 3,5°.

**Scale/Scope**: une page de démonstration · **douze composants**, aucun composable maison
(le thème vient de `useColorMode()` du module) · huit rubriques · deux thèmes · un point de
rupture.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Portes dérivées de `.specify/memory/constitution.md` v1.0.0.

| # | Porte | Principe | Statut |
|---|---|---|---|
| 1 | Aucun `border-radius` non nul, aucune `box-shadow`, aucun `gradient` | I | **OK** — familles `--radius-*`, `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*` supprimées dans `@theme` : les utilitaires n'existent plus. Les dégradés, non gouvernés par un espace de noms, sont rejetés par un contrôle textuel en CI (research D3) |
| 2 | Composant Card unique ; toute variante déclarée dans le composant | I | **OK** — un seul `ArticleCard`. L'état « sans image » découle de l'absence de la donnée, il n'est pas un paramètre : deux rendus divergents pour une même donnée deviennent impossibles (research D9) |
| 3 | Coupe à 3,5° limitée au mot-symbole et au filet de séparation | I | **OK** — deux porteurs, et deux seulement : l'image du mot-symbole et `FiletCoupe`. Aucune autre diagonale |
| 4 | Chaque occurrence d'accent traçable à `docs/design/html/` ; jamais en fond | III | **OK** — deux occurrences, toutes deux traçables : (a) le soulignement de 2 px de la rubrique active, `accueil.html:61` ; (b) le **spécimen** du nuancier de `/styleguide`, `guide-de-style.html:188,198`, où l'accent est montré en aplat et en libellé hexadécimal. Le spécimen n'est pas un emploi décoratif — c'est la couleur exposée comme elle-même, et il est présent dans la maquette, donc couvert par le principe III (« l'accent apparaît là où les fichiers de `docs/design/html/` le placent »). **Aucun emploi inventé.** Le repère de focus est en `--ink`, ce qui évite d'avoir à poser la question |
| 5 | Clair + sombre sur chaque écran ; suit l'OS ; choix persistant ; aucun flash | IV | **OK** — script inline bloquant dans le `<head>`, avant la première peinture (research D5) |
| 6 | Contraste AA vérifié dans les deux thèmes, accent mesuré deux fois | IV | **OK** — palette mesurée, tous les couples de texte passent AA dans les deux thèmes ; accent à 6,97 (clair) et 7,45 (sombre). Deux couples interdits identifiés et écartés (research D6) |
| 7 | Aucun défilement horizontal à 375 px ; conforme aux décisions de Fondations | V | **OK** — c'est ici que ces décisions se prennent : point de rupture 1000 px, repli de la colonne, gouttières. Vérifié à cinq largeurs |
| 8 | Focus visible partout ; `prefers-reduced-motion` ; `aria-current` juste ; `alt` réel | VIII | **OK** — repère en `--ink` mesuré à 19,80 / 18,05 ; animations neutralisées ; `aria-current` sur la page réellement affichée, jamais par défaut ; `imageAlt` obligatoire dès qu'une image est fournie |
| 9 | Aucune URL de média en base ; accès stockage via l'interface Storage seule | VI | **N/A** — aucune base, aucun média persisté, aucun accès disque. Le vocabulaire « clé de média » est néanmoins fixé dès maintenant pour que les features de contenu n'aient pas à le corriger |
| 10 | Schéma sans enum de base, sans JSON, sans liste scalaire, sans auto-increment | VI | **N/A** — aucun schéma. À évaluer à la première feature qui persiste quelque chose |
| 11 | HTML d'éditeur assaini côté serveur sur liste blanche | VII | **N/A** — aucun éditeur, aucun HTML reçu |
| 12 | Routes d'administration refusées par défaut sans authentification | VII | **N/A** — aucune route d'administration |
| 13 | Interface et contenus en français, diacritiques corrects | VIII | **OK** — `lang="fr"`, aucune internationalisation, relecture orthographique incluse dans la définition de terminé |

**Résultat : aucun écart.** Neuf portes applicables passent, quatre sont sans objet pour une
feature qui ne persiste rien et n'expose aucune route serveur.

### Réévaluation après conception (Phase 1)

Réévalué après production de `data-model.md`, `contracts/` et `quickstart.md` : **statuts
inchangés, aucun écart introduit par la conception.** Deux points se sont resserrés plutôt
qu'assouplis :

- Porte 2 renforcée : le contrat de `ArticleCard` refuse explicitement un paramètre
  `sansImage`, un paramètre de couleur, d'ombre, d'arrondi ou d'espacement, et tout
  emplacement de contenu libre. La divergence entre deux emplois devient difficile à produire.
- Porte 8 renforcée : `imageAlt` est déclaré obligatoire **dès que** `image` est fournie, et
  un `imageAlt` vide est un défaut à faire échouer en développement — pas une valeur tolérée.

**Quatre valeurs décidées ici sont absentes de `tokens.md`** (point de rupture 1000 px,
repère de focus, absence de transition à la bascule, texte d'interface à 14 px). Le principe II les qualifie de lacunes à
combler par amendement du fichier, pas à figer en dur. L'amendement fait partie de la feature.

## Project Structure

### Documentation (this feature)

```text
specs/001-fondations-socle-ui/
├── plan.md                     # Ce fichier
├── spec.md                     # Spécification (60 exigences, 6 user stories)
├── research.md                 # Phase 0 — décisions techniques
├── data-model.md               # Phase 1 — rubriques, thème, aperçu d'article, marque
├── quickstart.md               # Phase 1 — mise en route et vérification
├── contrastes.py               # Calcul rejouable des contrastes des deux thèmes
├── contracts/
│   ├── composants.md           # Contrat des douze composants et du thème
│   └── tokens-et-theme.md      # Chaîne des valeurs, utilitaires, focus, thème
├── checklists/
│   └── requirements.md         # Contrôle qualité de la spécification — 16/16
└── tasks.md                    # Phase 2 — produit par /speckit-tasks, pas ici
```

### Source Code (repository root)

```text
nuxt.config.ts                  # Plugin Vite Tailwind, modules, lang="fr"
playwright.config.ts            # Cinq largeurs · FRANCOMETRE_URL vise la compilation
scripts/verifier.mjs            # Dégradés, valeurs en dur, retour à Tailwind v3
package.json
# PAS de deno.json — Nitro vise sa cible par défaut, aucun runtime à configurer
# PAS de tailwind.config.js — la v4 se configure entièrement en CSS

app/
├── app.vue
├── assets/
│   ├── css/
│   │   ├── tokens.css          # LES VALEURS — couleurs, typo, géométrie, angle de coupe.
│   │   │                       # :root et .dark. Seul fichier du dépôt à porter des valeurs
│   │   └── main.css            # @import tailwindcss · @theme inline · @custom-variant dark
│   │                           # · suppression des familles rayon et ombre
│   └── icones/rubriques/       # Collection locale @nuxt/icon — les 8 tracés des maquettes
├── components/
│   ├── layout/
│   │   ├── AppShell.vue        # Cadre 1440 px cerné, deux zones
│   │   ├── AppRail.vue         # Colonne 248 px — marque, recherche, rubriques, thème
│   │   ├── AppTopbar.vue       # Barre supérieure sous 1000 px
│   │   ├── AppMenuPanel.vue    # Panneau de menu — échappement, focus piégé et restitué
│   │   └── AppFooter.vue       # Pied de page, dans la colonne de droite
│   └── ui/
│       ├── ArticleCard.vue     # LE composant unique de vignette
│       ├── FiletCoupe.vue      # Séparateur signature, position paramétrable
│       ├── ThemeToggle.vue     # Interrupteur — colonne et barre supérieure
│       ├── RubriqueIcon.vue    # Enveloppe des huit pictogrammes
│       ├── SearchEntry.vue     # Point d'entrée de recherche
│       ├── AppButton.vue       # Quatre variantes — l'accent n'y touche jamais
│       └── AppField.vue        # Ligne, multiligne, case à cocher, état d'erreur
├── layouts/
│   └── default.vue             # Assemble cadre, colonne, barre, contenu, pied de page
├── pages/
│   └── styleguide.vue          # Page de démonstration, calquée sur guide-de-style.html
└── utils/
    └── rubriques.ts            # Les huit rubriques — définition unique du projet

public/
├── brand/{NOIR,BLANC}.png      # Mot-symbole — les deux seules ressources de marque
└── demo/                       # Actifs locaux de la page de démonstration

tests/e2e/
├── theme.spec.ts               # Ouverture selon l'OS, bascule, persistance, absence de flash
├── navigation.spec.ts          # Ordre de la colonne, rubrique courante, clavier
├── responsive.spec.ts          # Cinq largeurs, débordement, menu et sa fermeture
├── card.spec.ts                # Trois états, troncature, mouvement réduit
├── filet.spec.ts               # Brisure unique, positions distinctes
├── footer.spec.ts              # Placement, rubriques, empilement
├── a11y.spec.ts                # axe-core, deux thèmes, menu ouvert inclus
└── _aides.ts                   # Ouverture de page attendant l'hydratation
```

Le thème est fourni par `@nuxtjs/color-mode` : pas de composable maison, `useColorMode()` du
module fait foi. Les polices ne sont pas dans `public/` — `@nuxt/fonts` les télécharge et les
sert depuis le projet.

**Structure Decision**: projet Nuxt unique, arborescence `app/` de Nuxt 4. Pas de séparation
front/back : le site public et les futures routes serveur (back-office, base, stockage)
vivent dans le même projet, ce que la portabilité exigée par le principe VI n'empêche en rien
— elle porte sur l'interface de stockage et le schéma, pas sur le découpage des dépôts.

Deux séparations sont en revanche structurantes et délibérées :

- `assets/css/tokens.css` **contre** tout le reste : un seul fichier porte des valeurs. Un
  littéral de couleur ailleurs est un défaut repérable d'un coup d'œil.
- `components/layout/` **contre** `components/ui/` : la charpente, qu'une page ne redéclare
  jamais, d'un côté ; les composants qu'elle emploie, de l'autre.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

Aucun écart à justifier — les neuf portes applicables passent, les quatre autres sont sans
objet et motivées dans le tableau ci-dessus.

## Suites à donner

Trois amendements découlent de cette feature et lui survivent. Ils ne sont pas facultatifs :
la constitution proscrit de refermer un arbitrage par usage tacite. **Les trois sont faits.**

| Quoi | Où | État |
|---|---|---|
| Consigner le point de rupture 1000 px, le repère de focus, l'absence de transition de thème **et le texte d'interface à 14 px** | `docs/design/html/tokens.md` §7 | **Fait** — quatre lacunes comblées, la quatrième relevée en cours d'implémentation |
| Retirer les arbitrages 3 et 4 des « Arbitrages en attente » et y consigner les règles retenues | `.specify/memory/constitution.md` (v1.1.0) | **Fait** — rapport de synchronisation en tête du fichier |
| Abandonner le runtime Deno au profit de la cible Nitro par défaut | ce fichier, `research.md`, `quickstart.md`, `README.md`, `nuxt.config.ts` | **Fait** — arbitrage rendu par le porteur du projet le 2026-07-18, voir « Technical Context » |

### Lacunes de `tokens.md` relevées et NON comblées

Elles sont laissées ouvertes délibérément : chacune demande un arbitrage de valeur, pas une
transcription. Écarts mesurés, pas supposés.

| Lacune | Constat | À trancher |
|---|---|---|
| Taille de lien de navigation | 16 px à la maquette ; le seul token à 16 px est `--taille-saisie`, de rôle « champ de saisie ». Valeur juste, nom mensonger | Ajouter `--taille-navigation` |
| Taille de lien de pied de page | 15 px à la maquette, rendu à 14 px (`--taille-interface`). **Écart réel de 1 px** | Ajouter un 15 px public, ou entériner 14 |
| Décollement de soulignement | 3 px à la maquette, hors base 4 ; Tailwind ne propose que 1/2/4/8 | Ajouter `--decollement-soulignement`, ou aligner sur 4 |
| Marge basse des `h3` du pied | 18 px à la maquette, rendu 20 px. **Écart de 2 px** | Accueillir 18 px, ou aligner la maquette sur la base 4 |
