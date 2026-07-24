# Implementation Plan: Référencement, performance, accessibilité

**Branch**: `006-referencement-perf-a11y` | **Date**: 2026-07-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-referencement-perf-a11y/spec.md`

## Summary

Cette feature ne crée aucun écran : elle **achève** les pages existantes sur trois axes.
**Trouvable** — chaque page pose un titre et une description propres, une adresse canonique
absolue construite sur `siteUrl` (apex `francometre.com`), une redirection permanente
`www` → apex, un `robots.txt` déclarant le plan du site, un lien vers le flux RSS dans
l'en-tête, une directive `noindex` sur les pages non publiques ; les articles exposent
Open Graph / Twitter Card et des données structurées `NewsArticle`. **Rapide** — les pages
de liste passent en `swr` (cache rafraîchi en arrière-plan, borne < 60 s) et les couvertures
passent à `<NuxtImg>` (webp, `srcset` dimensionné, chargement paresseux hors héros).
**Utilisable par tous** — la couverture de tests a11y (axe, clavier, repères, un seul `h1`)
s'étend à `/articles`, `/connexion`, aux pages système et à un parcours clavier complet, **y
compris l'éditeur TipTap et le réordonnancement clavier de la Une** (flèches + `aria-live`,
déjà implémenté en 005, ici mis sous test), et un audit Lighthouse ≥ 90 (perf/réf/a11y,
mobile **et** bureau, deux thèmes) verrouille SC-001.

Deux décisions de conception structurantes, tranchées en Phase 0 :

1. **URL absolue de média** (Open Graph exige de l'absolu, la porte 9 réserve la
   fabrication d'URL de média à `Stockage`) → on **étend l'interface** d'un
   `urlAbsolue(cle, origine)`, jamais une concaténation ailleurs.
2. **Chargement paresseux vs repli d'erreur de `ArticleCard`** (qui charge en immédiat
   *à dessein* pour détecter l'échec) → le `loading="lazy"` natif déclenche quand même
   l'événement `error` à l'approche de l'écran, donc le repli « sans image » reste fiable
   pour les vignettes que le lecteur atteint ; seul le héros/couverture LCP reste `eager`.

Aucune migration, **aucune entité persistée nouvelle** : toutes les métadonnées se calculent
à la lecture.

## Technical Context

**Language/Version** : TypeScript 5.9, Node.js LTS (22/24), Nuxt 4.4.8 (Vue 3.5), SSR.

**Primary Dependencies** : Nitro (preset `node-server`, `routeRules` `swr`) ; `unhead` via
`useHead`/`useSeoMeta` (intégrés à Nuxt, **aucun module SEO ajouté** — on prolonge les routes
`rss.xml`/`sitemap.xml` déjà écrites à la main) ; `@nuxt/image` 2.0 (déjà configuré : webp,
`quality: 80`, `screens`) ; `@nuxtjs/color-mode` 4 (thème sans flash, inchangé) ; `sharp`
0.35 (déjà présent) ; `zod` 4 (validation des paramètres). **Nouveau devDep** :
`playwright-lighthouse` + `lighthouse` pour l'audit automatisé (réutilise le Chromium de
Playwright).

**Storage** : SQLite (inchangé, **aucune migration**) ; médias sur disque via l'interface
`Stockage` unique, **étendue** d'`urlAbsolue`.

**Testing** : Vitest (règles de présentation : `urlAbsolue`, mappeur SEO, constructeur
JSON-LD) ; Playwright + `@axe-core/playwright` (a11y, clavier, repères SEO dans le DOM) ;
`playwright-lighthouse` (audit ≥ 90).

**Target Platform** : serveur Node (Nitro `node-server`) ; navigateurs modernes, mobile et
bureau.

**Project Type** : application web Nuxt 4 pleine pile, projet unique (`app/` + `server/` +
`shared/`).

**Performance Goals** : Lighthouse ≥ 90 en performance, référencement et accessibilité, pour
`/` et une page `/article/**`, sur profils **mobile et bureau**, dans les **deux** thèmes ;
LCP rapide sur l'accueil dense en images ; images hors écran différées ; changement éditorial
visible en < 60 s.

**Constraints** : preset `node-server` seul (ni edge, ni service d'images tiers — portabilité,
principe VI) ; Tailwind v4 tout-CSS ; aucun actif de marque inventé (image de partage par
défaut **composée depuis le mot-symbole de `public/brand`**) ; URL de média par l'interface
`Stockage` seule (porte 9) ;
deux thèmes AA (porte 6) ; français, diacritiques (porte 13).

**Scale/Scope** : 8 rubriques, Une de 5, site éditorial. Feature de finition touchant
l'ensemble des pages publiques + la vérification a11y de l'administration ; **aucune page
nouvelle**.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Portes dérivées de `.specify/memory/constitution.md` v1.3.0. Réévaluées après Phase 1 :
inchangées.

| # | Porte | Principe | Statut |
|---|---|---|---|
| 1 | Aucun `border-radius` non nul, aucune `box-shadow`, aucun `gradient` | I | **OK** — la feature ajoute des balises `<head>`, du cache et des attributs d'image ; aucun style. L'image de partage par défaut est un raster fourni, pas du CSS. |
| 2 | Composant Card unique ; toute variante déclarée dans le composant | I | **OK** — `ArticleCard` passe de `<img>` à `<NuxtImg>` (même rendu, même unique composant) ; **aucune variante** ajoutée, aucun paramètre visuel. Idem `UneHero` (composition de Une existante). |
| 3 | Coupe à 3,5° limitée au mot-symbole et au filet | I | **N/A** — rien ne touche la diagonale. |
| 4 | Accent traçable à `docs/design/html/` ; jamais en fond | III | **OK** — la feature n'ajoute **aucun** usage d'accent. L'image de partage par défaut (mot-symbole sur surface) n'en porte pas. |
| 5 | Clair + sombre ; suit l'OS ; persistant ; aucun flash | IV | **OK** — le cache `swr` porte une HTML **sans thème figé** ; la classe de thème reste posée par le script `color-mode` avant peinture. Vérifié en Phase 1 (research D-cache). |
| 6 | Contraste AA **dans les deux thèmes**, accent mesuré deux fois | IV | **OK** — étendu et re-vérifié (axe + Lighthouse a11y clair et sombre). |
| 7 | Aucun défilement horizontal à 375 px ; conforme à Fondations | V | **OK** — `<NuxtImg>` reste dans le conteneur `aspect-video` ; `srcset`/`sizes` bornés. Couverture responsive existante préservée. |
| 8 | Focus visible partout ; `prefers-reduced-motion` ; `aria-current` juste ; `alt` réel | VIII | **OK — cœur d'US2.** Renforcé : parcours clavier complet (dont éditeur TipTap et réordonnancement clavier de la Une, déjà implémentés, mis sous test — D12), un seul `h1`, repères nommés, `alt` déjà obligatoire à la publication. |
| 9 | Aucune URL de média en base ; accès stockage via l'interface seule | VI | **OK** — l'URL absolue Open Graph passe par `Stockage.urlAbsolue`, **producteur unique** ; rien n'est persisté (research D-storage-url). |
| 10 | Schéma sans enum de base, sans JSON, sans liste scalaire, sans auto-increment | VI | **N/A** — **aucune** modification de schéma. |
| 11 | HTML d'éditeur assaini côté serveur avant stockage | VII | **N/A** — hors périmètre ; rien n'y touche. |
| 12 | Routes d'administration refusées par défaut sans authentification | VII | **OK** — on **ajoute** `X-Robots-Tag: noindex` à `/admin/**` sans toucher au refus par défaut. |
| 13 | Interface et contenus en français, diacritiques corrects | VIII | **OK** — titres, descriptions, JSON-LD en français ; marque « Francomètre » accentuée. |

**Valeurs visuelles** : `docs/design/html/tokens.md` fait foi. **Structure et accent** :
`docs/design/html/*.html` font foi. Aucun écran nouveau : la clause de consultation du
principe III n'est **pas** déclenchée — la feature n'ajoute aucun accent.

**Verdict** : aucun écart. « Complexity Tracking » reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/006-referencement-perf-a11y/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions D1..D9
├── data-model.md        # Phase 1 — additions DTO + interface (aucune table)
├── quickstart.md        # Phase 1 — guide de vérification (audit, partage, clavier)
├── contracts/
│   ├── seo.md           # Contrat des balises <head>, robots.txt, canonique, redirection
│   └── performance.md   # Contrat de cache (swr) et d'images (NuxtImg)
└── tasks.md             # Phase 2 — /speckit-tasks (NON créé ici)
```

### Source Code (repository root)

```text
app/
├── pages/
│   ├── index.vue                 # ~ + description, canonique, og:image par défaut
│   ├── rubrique/[id].vue         # ~ titre « {Rubrique} — Francomètre » + description + canonique
│   ├── articles/index.vue        # ~ titre + description + canonique (pagination indexable)
│   ├── article/[slug].vue        # ~ description, canonique, OG/Twitter, JSON-LD ; couverture → NuxtImg eager
│   ├── connexion.vue             # ~ noindex
│   └── admin/**                  # (a11y clavier vérifiée ; noindex via routeRules)
├── error.vue                     # ~ noindex sur 404/503
├── components/
│   ├── ui/ArticleCard.vue        # ~ <img> → <NuxtImg> lazy + sizes (repli d'erreur préservé)
│   └── public/UneHero.vue        # ~ <img> → <NuxtImg> eager (LCP accueil)
└── utils/
    └── seo.ts                    # + helpers client : canonique absolue, defaults <head>

shared/
├── types/dto.ts                  # + SeoArticleDTO ; ArticlePageDTO gagne `seo`
└── utils/jsonldArticle.ts        # + constructeur pur NewsArticle (testable hors Nuxt)

server/
├── utils/
│   ├── stockage.ts               # + urlAbsolue(cle, origine) sur l'interface + impl disque
│   └── presentation.ts           # + metaSeoArticleDe(article, origine) → SeoArticleDTO
├── api/articles/[slug].get.ts    # ~ compose `seo` (passe siteUrl)
├── middleware/canonique.ts       # + redirection 301 www → apex (lit Host, cible = siteUrl)
└── routes/
    └── robots.txt.get.ts         # + robots.txt (Sitemap: {siteUrl}/sitemap.xml, Disallow /admin)

public/brand/partage-defaut.png   # + composée (1200×630) depuis le mot-symbole — non bloquante
scripts/partage-defaut.mjs        # + génère l'image de partage par défaut (sharp), reproductible

nuxt.config.ts                    # ~ routeRules swr (listes) + noindex (/admin) ; app.head (description, rss, titleTemplate) ; image.domains si IPX

tests/
├── e2e/
│   ├── seo.spec.ts               # + titre/description/canonique/OG/JSON-LD/robots/redirection/noindex
│   ├── clavier.spec.ts           # + parcours clavier (public + admin) : éditeur TipTap opérable, réordonnancement Une (flèches, aria-live, focus rendu), ordre logique
│   ├── a11y.spec.ts              # ~ + /articles, /connexion, error ; un seul h1 ; repères
│   └── audit.spec.ts             # + Lighthouse ≥ 90 (accueil + article, mobile+bureau, 2 thèmes)
└── unit/
    ├── stockage-url.test.ts      # + urlAbsolue (disque : origine + clé ; idempotent sur absolu)
    ├── seo-article.test.ts       # + metaSeoArticleDe (image absolue, ISO, section, auteur, repli)
    └── jsonld-article.test.ts    # + NewsArticle (repli auteur → Organization, image par défaut)
```

**Structure Decision** : structure Nuxt 4 existante (projet unique). La feature **modifie**
surtout des pages et deux composants d'image, et **ajoute** une poignée d'utilitaires serveur
(middleware canonique, `robots.txt`, mappeur SEO, `urlAbsolue`) et des tests. Aucun nouveau
dossier de premier niveau.

## Complexity Tracking

> Aucune violation. La feature n'introduit ni schéma, ni dépendance lourde, ni écart aux
> portes. Table volontairement vide.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
