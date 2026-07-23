# Implementation Plan: Pages publiques

**Branch**: `003-pages-publiques` | **Date**: 2026-07-22 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-pages-publiques/spec.md`

## Summary

Rendre visibles au public les articles déjà modélisés par la feature 002 : accueil (Une
01→05, derniers articles, sections de rubrique), page « Tous les articles » paginée, page
rubrique paginée avec état vide, page article complète (fil d'Ariane, métadonnées,
couverture légendée, corps riche, « à lire aussi »), pages système (404 / 503 / 500) et
diffusion (flux RSS 2.0, plan du site XML).

L'approche réutilise **intégralement** la charpente et la vignette des Fondations (001) et
les services de lecture publique de Modèle et données (002) : `listerArticlesPublics`,
`articlePublicParSlug`, `lireUne`, `listerRubriques`, `eyebrowDe`, `filtreVisible`,
`stockage.url`. La feature n'ajoute au socle 002 que le strict nécessaire : un champ de
légende de couverture (décidé par le porteur le 2026-07-22), un compteur d'articles pour
la pagination, et l'inclusion de la couverture dans les lectures publiques. Tout le reste
est de la **présentation** : composants Vue, routes serveur Nitro qui mappent les entités
en DTO d'affichage (URL de média calculée à la lecture, eyebrow contextuel, temps de
lecture dérivé), pages Nuxt.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js LTS (ESM, `"type": "module"`).

**Primary Dependencies**: Nuxt 4 (SSR, Nitro preset node-server), Tailwind v4
(`@tailwindcss/vite`, config CSS pure), `@nuxtjs/color-mode` (`classSuffix: ''`),
Prisma 7 + `@prisma/adapter-better-sqlite3`, `@nuxt/image`, `@nuxt/fonts`. Lecture seule
côté public : ni TipTap, ni nuxt-auth-utils dans cette feature.

**Storage**: SQLite via l'adaptateur Prisma. Médias via l'interface `Storage` unique
(`server/utils/stockage.ts`) — `url(cle)` calcule l'adresse à la lecture, jamais persistée.

**Testing**: Vitest (règles de gestion, base SQLite éphémère via `tests/unit/harnais.ts`),
Playwright (socle visuel, deux thèmes, mobile), `npm run verifier` (6 contrôles sobriété +
portabilité), `npm run typecheck`.

**Target Platform**: Serveur node-server (Nitro), navigateurs modernes, du mobile (≈390 px)
au grand écran, en clair et en sombre.

**Project Type**: Application web SSR (Nuxt) — un seul projet, `app/` (client) + `server/`
(Nitro) + `shared/` (pur, partagé).

**Performance Goals**: Lighthouse ≥ 90 (perf / SEO / a11y). Rendu serveur, thème appliqué
avant première peinture (aucun flash), images en 16:9 réservant la place (aucun décalage).

**Constraints**: Contrastes AA vérifiés **dans les deux thèmes** ; aucun défilement
horizontal de page à 375 px (le carrousel de rubriques défile en interne, décision de
Fondations) ; rayon 0, aucune ombre, aucun dégradé ; accent uniquement là où
`docs/design/html/` le place.

**Scale/Scope**: Site éditorial, 8 rubriques figées. Pagination 12/page. 5 pages
publiques + 3 états système + 2 flux de diffusion. ~8 composants, ~5 routes serveur.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Portes dérivées de `.specify/memory/constitution.md` v1.2.0.

| # | Porte | Principe | Statut |
|---|---|---|---|
| 1 | Aucun `border-radius` non nul, aucune `box-shadow`, aucun `gradient` | I | **OK** — pages et composants héritent des tokens ; aucune de ces propriétés introduite. Vérifié par `verifier` (sobriété). |
| 2 | Composant Card unique ; toute variante déclarée dans le composant | I | **OK** — les vignettes à image réutilisent `ArticleCard`. Le héros de Une, la ligne numérotée 02–05, la section de rubrique, la pagination, le fil d'Ariane et l'état vide sont des **compositions de structure** définies par `accueil.html`/`article.html`/`rubrique.html`, pas des variantes de la Card. Aucune divergence entre deux emplois de la Card. |
| 3 | Coupe à 3,5° limitée au mot-symbole et au filet de séparation | I | **OK** — la coupe reste portée par le mot-symbole (Fondations) et le `FiletCoupe` de séparation de sections. Aucune photo/carte/titre coupé ajouté. |
| 4 | Chaque occurrence d'accent traçable à `docs/design/html/` ; jamais en fond | III | **OK** — les seuls accents publics sont ceux d'`accueil.html` : l'eyebrow « À la une » et les numéros 01–05 (`.card__num`, `color: var(--accent)`). Aucun accent inventé, aucun en fond. `etats.html` place le chiffre en filigrane « filet », pas en accent. |
| 5 | Clair + sombre sur chaque écran ; suit l'OS ; choix persistant ; aucun flash | IV | **OK** — mécanisme de thème posé par Fondations (`color-mode`, classe `dark`, sans transition à la bascule) ; toutes les pages en héritent. Les couleurs passent par tokens, aucun `dark:` sur les couleurs. |
| 6 | Contraste AA vérifié **dans les deux thèmes**, accent mesuré deux fois | IV | **OK** — texte, muted, accent (`#1F35FF` clair / `#8A97FF` sombre) déjà validés dans Fondations ; les pages n'introduisent pas de nouveau couple couleur/fond. Contrôle e2e a11y étendu. |
| 7 | Aucun défilement horizontal à 375 px | V | **OK** — le carrousel horizontal des sections de rubrique est un **conteneur borné** (`overflow-x` interne, rail de cards mobile déjà décidé par Fondations, `tokens.md` §mobile), pas un débordement de page. Test e2e : `document.scrollingElement.scrollWidth ≤ clientWidth` à 375 px. |
| 8 | Focus visible partout ; `prefers-reduced-motion` ; `aria-current` juste ; `alt` réel | VIII | **OK** — focus global posé par `main.css` (Fondations) ; `aria-current` via `definePageMeta({ rubrique })` (rubrique réellement affichée) ; `alt` réel exigé par `ArticleCard` et par la couverture de l'article ; animations sous `prefers-reduced-motion`. |
| 9 | Aucune URL de média en base ; accès stockage via l'interface Storage seule | VI | **OK** — les DTO calculent l'URL de couverture par `stockage.url(cle)` à la lecture ; la base ne stocke que la clé. Le flux RSS préfixe l'origine configurée, sans persister d'URL. Corps riche : images intégrées rendues telles qu'assainies (aucune écriture ici) — voir research D5. |
| 10 | Schéma sans enum de base, sans JSON, sans liste scalaire, sans auto-increment | VI | **OK** — seul ajout : `Article.couvertureLegende String?` (nullable, texte). Aucun enum/JSON/liste/auto-increment. Migration additive. |
| 11 | HTML d'éditeur assaini côté serveur sur liste blanche avant stockage | VII | **N/A (respecté par construction)** — cette feature ne **produit** aucun HTML ; elle rend le corps **déjà assaini** au stockage par 002. Elle n'ajoute aucun chemin d'écriture de HTML. |
| 12 | Routes d'administration refusées par défaut sans authentification | VII | **N/A** — aucune route `/admin` ni route serveur d'administration dans cette feature. Toutes les routes ajoutées sont publiques en lecture seule. |
| 13 | Interface et contenus en français, diacritiques corrects | VIII | **OK** — libellés, métadonnées, états système, messages : français, diacritiques respectés. |

**Verdict** : aucune porte en écart. La section « Complexity Tracking » reste vide.

**Valeurs visuelles** : `docs/design/html/tokens.md` fait foi. **Structure d'écran et
emplacements de l'accent** : `docs/design/html/*.html` font foi.

## Project Structure

### Documentation (this feature)

```text
specs/003-pages-publiques/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions techniques
├── data-model.md        # Phase 1 — DTO de présentation + delta de schéma
├── quickstart.md        # Phase 1 — guide de validation exécutable
├── contracts/           # Phase 1 — contrats des routes serveur
│   ├── routes-serveur.md
│   └── diffusion.md
└── tasks.md             # Phase 2 (/speckit-tasks — NON créé ici)
```

### Source Code (repository root)

```text
app/
├── pages/
│   ├── index.vue                 # Accueil (US1) — Une, derniers, sections rubrique
│   ├── articles/
│   │   └── index.vue             # « Tous les articles » paginé (US1 clarif)
│   ├── rubrique/
│   │   └── [id].vue              # Page rubrique paginée + état vide (US3)
│   └── article/
│       └── [slug].vue            # Page article complète (US2)
├── error.vue                     # 404 / 503 / 500 même charpente (US4)
└── components/
    └── public/
        ├── UneHero.vue           # Article de rang 01 (héros)
        ├── UneSecondaire.vue     # Rangs 02–05 (numérotés, sans image)
        ├── SectionRubrique.vue   # Section d'accueil : titre + « Tout voir » + carrousel
        ├── GrilleArticles.vue    # Grille de ArticleCard (rubrique / tous les articles)
        ├── Pagination.vue        # Commandes de pagination (filet ordinaire)
        ├── FilAriane.vue         # Fil d'Ariane de l'article
        ├── CorpsArticle.vue      # Rendu du corps assaini (prose, tokens)
        └── EtatVide.vue          # Rubrique sans article

server/
├── api/
│   ├── accueil.get.ts            # Une + derniers + sections rubrique (DTO)
│   ├── articles/
│   │   ├── index.get.ts          # Liste paginée (rubrique? + page) + total
│   │   └── [slug].get.ts         # Article + « à lire aussi »
├── routes/
│   ├── rss.xml.get.ts            # Flux RSS 2.0
│   └── sitemap.xml.get.ts        # Plan du site XML
├── services/
│   └── articles.ts               # + compterArticlesPublics ; + include couverture
└── utils/
    └── presentation.ts           # Mappage entité → DTO (URL, eyebrow, temps de lecture)

shared/
└── utils/
    └── tempsLecture.ts           # Estimation pure du temps de lecture (mots/cadence)

prisma/
├── schema.prisma                 # + Article.couvertureLegende String?
├── migrations/…                  # Migration additive
└── seed.ts                       # + légendes d'exemple

tests/
├── unit/
│   ├── tempsLecture.test.ts
│   ├── presentation.test.ts      # eyebrow contextuel, URL, DTO
│   └── articles-public.test.ts   # comptage, pagination, hors bornes
└── e2e/
    ├── accueil.spec.ts           # Une 01→05, sections, carrousel mobile
    ├── rubrique.spec.ts          # pagination, état vide, hors bornes 404
    ├── article.spec.ts           # rendu complet, « à lire aussi », légende
    ├── etats.spec.ts             # 404 ramène aux derniers, 503
    └── diffusion.spec.ts         # rss.xml + sitemap.xml répondent
```

**Structure Decision**: Un seul projet Nuxt, découpage `app/` / `server/` / `shared/`
déjà en place (Fondations, Modèle et données). Cette feature ajoute des **pages**
(`app/pages/`), des **composants publics** (`app/components/public/`), des **routes
serveur** de lecture (`server/api/`) et de diffusion (`server/routes/`), un **mappeur de
présentation** (`server/utils/presentation.ts`), un **util pur** partagé
(`shared/utils/tempsLecture.ts`), et un **delta de schéma minimal**. Aucun composant de
Fondations n'est modifié ; les services de 002 ne reçoivent que des ajouts rétrocompatibles.

## Complexity Tracking

> Aucune violation de la Constitution à justifier. Section volontairement vide.
