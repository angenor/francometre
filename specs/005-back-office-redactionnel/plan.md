# Implementation Plan: Back-office rédactionnel

**Branch**: `005-back-office-redactionnel` | **Date**: 2026-07-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-back-office-redactionnel/spec.md`

## Summary

Donner une **interface** au modèle déjà bâti. Trois écrans sous `/admin`, derrière
l'authentification de la feature 004, dans un **layout d'administration** distinct du public
(rail de 240 px) mais taillé dans les mêmes tokens : la **liste** dense de tous les articles
(filtres texte/rubrique/état, pagination), l'**éditeur** riche (TipTap 3 headless, rendu
identique au site publié, panneau latéral de réglages, autosave), et **composer la Une**
(cinq emplacements 01–05, glisser-déposer accessible, épinglage depuis les articles publiés).

La feature **n'introduit aucune entité** ni aucune migration : `Article`, `Media`, `Rubrique`
portent déjà tous les champs (feature 002). Elle **ajoute** au serveur quelques opérations de
lecture/écriture d'administration au-dessus des services éprouvés (`creerArticle`,
`modifierArticle`, `supprimerArticle`, `publierArticle`, `depublierArticle`, `placerALaUne`,
`retirerDeLaUne`, `enregistrerMedia`), toutes **gardées par `exigerCompte`** ; le
**téléversement d'image** (multipart → `sharp` → `Stockage.put` → clé) ; une **route de
service des médias** (`/medias/<clé>`, adossée à `Stockage.get`) qui rend portables aussi
bien les couvertures que les **images intégrées au corps** ; et la **chaîne de sûreté**
inchangée : l'éditeur produit du HTML, la route d'écriture l'assainit sur liste blanche avant
tout stockage.

Elle referme l'**arbitrage 2** de la constitution : le back-office **n'emploie pas la Card**.
Il emploie trois dérivés en dimensions fixes (emplacement de Une, ligne d'article publié,
vignette de table), reproduits tels quels et **déclarés** comme composants d'administration —
jamais improvisés, jamais fondus dans la Card publique.

## Technical Context

**Language/Version** : TypeScript 5.9, Node.js LTS (ESM, `"type": "module"`).

**Primary Dependencies** : Nuxt 4.4 (SSR, Nitro preset node-server), Vue 3.5, Prisma 7.8 +
`@prisma/adapter-better-sqlite3`, Zod 4.4, `nuxt-auth-utils` 0.5 (session + `exigerCompte`),
Tailwind v4, `@nuxtjs/color-mode`, `@nuxt/image` (déjà configuré, `format: ['webp']`),
`sanitize-html` 2.17 (déjà installé). **À ajouter** : **TipTap 3.28** (`@tiptap/vue-3`,
`@tiptap/starter-kit`, `@tiptap/extension-link`, `@tiptap/extension-image`, `@tiptap/pm` —
tous **MIT**, aucune extension Pro), **`sharp` 0.35** (Apache-2.0, traitement d'image au
téléversement), **`@formkit/drag-and-drop` 0.6** (MIT, glisser-déposer Vue avec support
clavier) pour la réattribution des rangs de la Une.

**Storage** : SQLite via l'adaptateur Prisma — **aucune migration** (le schéma porte déjà
tout). Les fichiers image passent **uniquement** par l'interface `Stockage`
(`put`/`get`/`delete`/`url`) ; la base ne range que des **clés**. Le corps d'article ne
contient que des **adresses internes** (`/medias/<clé>`), jamais d'URL de fournisseur.

**Testing** : Vitest (nouveaux services d'administration — liste filtrée/paginée, réordonnancement
transactionnel de la Une, épinglage-qui-publie, assainissement à l'écriture — sur base SQLite
éphémère `tests/unit/harnais.ts`) ; Playwright + `@axe-core/playwright` (parcours créer →
éditer → publier → supprimer ; téléversement et affichage d'image ; composer la Une →
vérifier l'accueil ; **glisser-déposer au clavier** ; refus non authentifié ; deux thèmes ;
375 px sans défilement horizontal) ; `npm run verifier` (sobriété + portabilité) ;
`npm run typecheck`.

**Target Platform** : Serveur node-server (Nitro), navigateurs modernes, du mobile (≈390 px)
au grand écran, clair et sombre.

**Project Type** : Application web SSR (Nuxt) — un seul projet, `app/` (client) + `server/`
(Nitro) + `shared/` (pur).

**Performance Goals** : Autosave débouncé (≈ 1,5 s d'inactivité) sans à-coup de saisie ;
téléversement d'image traité en mémoire (jamais d'accès disque hors `Stockage`) ; thème appliqué
avant première peinture (aucun flash) ; Lighthouse ≥ 90 (a11y/SEO/perf) sur les écrans livrés.

**Constraints** : Assainissement **serveur** sur liste blanche **avant** stockage ;
**aucune URL de média en base** (couverture **et** corps) ; accès stockage **via l'interface
Storage seule** ; réattribution des rangs 1–5 **transactionnelle** ; Zod sur **toutes** les
mutations ; **refus par défaut** de `/admin/**` (affichage) **et** de toute route serveur
d'administration (`exigerCompte`) ; sobriété (rayon 0, sans ombre ni dégradé) ; contrastes AA
dans les deux thèmes ; **aucun défilement horizontal à 375 px** (tables et colonnes larges
replient/défilent dans leur propre conteneur) ; français partout, diacritiques corrects.

**Scale/Scope** : 3 écrans + 1 dialogue de confirmation (non maquetté) ; 1 layout admin ;
≈ 8 routes serveur d'administration + 1 route publique de service des médias ; 3 nouveaux
services (liste admin, réordonnancement de la Une, épinglage-qui-publie) ; ≈ 10 composants
d'administration (rail, éditeur riche, panneau de réglages, dépose de couverture, emplacement
de Une, ligne d'article publié, ligne de table, dialogue) ; **0 migration**.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Portes dérivées de `.specify/memory/constitution.md` v1.2.0.

| # | Porte | Principe | Statut |
|---|---|---|---|
| 1 | Aucun `border-radius` non nul, aucune `box-shadow`, aucun `gradient` | I | **OK** — les trois maquettes de back-office ne portent aucune de ces propriétés (filets à 0, boutons pleins sans ombre, `border-radius:0` explicite sur champs/boutons/case). Les écrans admin héritent des tokens. Contrôlé par `verifier`. |
| 2 | Composant Card unique ; toute variante déclarée dans le composant | I | **Écart déclaré (arbitrage 2 refermé)** — le back-office **n'emploie pas la Card** mais **trois dérivés en dimensions fixes** (emplacement de Une, ligne d'article publié, vignette de table), non documentés dans `tokens.md`. Justifié en « Complexity Tracking » ; à formaliser par amendement de la constitution (v1.3.0). La Card publique n'est **ni modifiée ni élargie** pour les absorber. |
| 3 | Coupe à 3,5° limitée au mot-symbole et au filet de séparation | I | **OK** — seul porteur présent dans le back-office : le mot-symbole `public/brand/*` du rail. Aucune coupe ajoutée aux vignettes, cards dérivées, filets de table ni poignées. |
| 4 | Chaque occurrence d'accent traçable à `docs/design/html/` ; jamais en fond (hors nav active du back-office) | III | **OK avec une correction de maquette** — accents tracés aux trois `.html` : numéros de rang 01–05 de la Une, rang à la une de la table (`t-rang--une`), **bouton actif** de la barre d'outils, **entrée active** du rail (`border-left` accent **+** fond `--surface`, seule exception admise), sous-lignement actif des segments d'état/rang, filet de champ au focus, `::selection`. **Correction** : `back-office-articles.html` fait survoler le bouton primaire **vers l'accent** — défaut de maquette contraire au principe III et à `AppButton` (« l'accent ne touche jamais un bouton »). On réutilise `AppButton` primaire (survol → `--primaire-survol`), comme `editeur`/`composer.html`. Écrans **non maquettés** (dialogue de suppression, état vide, champ sous-thème) : **aucun accent** de sa propre initiative. |
| 5 | Clair + sombre sur chaque écran ; suit l'OS ; choix persistant ; aucun flash | IV | **OK** — mécanisme de thème posé par Fondations ; les écrans admin passent par les tokens (`bg-paper text-ink`), aucun `dark:` sur les couleurs ; le mot-symbole bascule en CSS. La zone d'édition TipTap partage les styles `.corps` (tokens), donc bascule seule. |
| 6 | Contraste AA vérifié **dans les deux thèmes**, accent mesuré deux fois | IV | **OK** — couples réutilisés du socle. Contrôle e2e axe sur les trois écrans, dans les deux thèmes. |
| 7 | Aucun défilement horizontal à 375 px ; conforme aux décisions de Fondations | V | **OK — à concevoir (principe V)** — maquettes desktop only. Sous ~1000 px : rail replié (décision Fondations), colonnes de l'éditeur et du composer **empilées**, table dense **défilant dans son propre conteneur** (`overflow-x`), jamais la page. Test e2e `scrollWidth ≤ clientWidth` à 375 px sur les trois écrans. |
| 8 | Focus visible partout ; `prefers-reduced-motion` ; `aria-current` juste ; `alt` réel | VIII | **OK** — repère de focus sur **tout** interactif : boutons de barre d'outils, poignées de DnD, segments, sélecteurs, dépose, dialogue. **Glisser-déposer pilotable au clavier** (exigence dure, porte 8). `prefers-reduced-motion` neutralise l'indicateur d'autosave et les transitions de DnD. `aria-current` sur l'entrée de rail de la page réellement affichée. `alt` **réel exigé à la publication** ; vignettes de table présentationnelles (le titre porte le sens). Dialogue : piège de focus + `Échap`. |
| 9 | Aucune URL de média en base ; accès stockage via l'interface Storage seule | VI | **OK — cœur** — couvertures rangées **par clé** ; corps référençant `/medias/<clé>` (**adresse d'application**, pas une URL de fournisseur — ne matche pas `RESSEMBLE_A_UNE_URL`) ; téléversement écrivant **par `Stockage.put`** ; service des médias lisant **par `Stockage.get`** ; `sharp` traite un **buffer en mémoire**, aucun `node:fs` hors `stockage.ts`. Contrôlé par `verifier`. |
| 10 | Schéma sans enum de base, sans JSON, sans liste scalaire, sans auto-increment | VI | **OK — aucune migration** — la feature n'ajoute **aucun** champ ni table. `statut` reste texte validé Zod, `rangUne` entier unique nullable, `id` en `cuid()`. |
| 11 | HTML d'éditeur assaini côté serveur sur liste blanche avant stockage | VII | **OK — cœur** — `creerArticle`/`modifierArticle` appellent déjà `assainir()` **avant** écriture ; l'autosave passe par `modifierArticle`, donc par la même liste blanche (`p, h2, h3, ul, ol, li, blockquote, strong, em, a, figure, figcaption, img[src,alt]` ; aucun `style`, aucun script). Le HTML du client n'est **jamais** digne de confiance. |
| 12 | Routes d'administration refusées par défaut sans authentification | VII | **OK — cœur** — `admin.global.ts` garde l'**affichage** de `/admin/**` ; **`exigerCompte(event)` en première ligne de CHAQUE nouvelle route `/api/admin/**`** garde les **données et effets**. La route publique `/medias/<clé>` sert des octets par clé opaque (les couvertures sont publiques) — seule route non gardée, et à dessein. |
| 13 | Interface et contenus en français, diacritiques corrects | VIII | **OK** — libellés, messages Zod, messages de refus, dialogue de confirmation : français. |

**Verdict** : une seule porte en écart — **porte 2 (Card)**, écart **prévu par la constitution
elle-même** (arbitrage 2, « à trancher à la spécification du back-office »). Justifié ci-dessous.

**Ré-évaluation après conception (Phase 1).** Les artefacts `research.md`, `data-model.md`,
`contracts/` ne créent **aucun** nouvel écart : pas de migration (portes 9/10 intactes), les
images du corps restent des adresses d'application (`/medias/<clé>`, porte 9), l'assainissement
reste serveur-avant-stockage (porte 11), toutes les routes `/api/admin/**` sont gardées
(porte 12), le glisser-déposer est clavier-first (porte 8), le petit écran est conçu (porte 7,
D14). La **correction du survol accent** du bouton primaire (porte 4) est actée en réutilisant
`AppButton`. La porte 2 reste le **seul** écart, inchangé. **Aucune** nouvelle ligne de
« Complexity Tracking ». Prêt pour `/speckit.tasks`.

**Valeurs visuelles** : `docs/design/html/tokens.md` fait foi. **Structure d'écran et
emplacements de l'accent** : `back-office-articles.html`, `back-office-editeur.html`,
`back-office-composer-la-une.html` font foi. `lecture-maquettes.md` est un constat.

**Écrans sans maquette** (dialogue de suppression, état vide de liste, champ sous-thème) :
strictement sobres, **sans accent de sa propre initiative** (principe III) ; en cas de besoin
d'accent, la clause de consultation s'applique.

## Project Structure

### Documentation (this feature)

```text
specs/005-back-office-redactionnel/
├── plan.md              # Ce fichier
├── research.md          # Phase 0 — décisions techniques (TipTap, sharp, DnD, /medias, autosave…)
├── data-model.md        # Phase 1 — entités inchangées + nouveaux services + DTO admin + 3 dérivés
├── quickstart.md        # Phase 1 — guide de validation exécutable
├── contracts/           # Phase 1 — contrats
│   ├── routes-serveur.md     # /api/admin/** (articles, une, médias) + /medias/[...]
│   └── composants-ui.md      # layout admin, éditeur, panneau, 3 dérivés, dialogue
└── tasks.md             # Phase 2 (/speckit-tasks — NON créé ici)
```

### Source Code (repository root)

```text
app/
├── layouts/
│   └── admin.vue                       # NOUVEAU — rail 240 px, cohérent public, distinct
├── middleware/
│   └── admin.global.ts                 # existant (feature 004) — inchangé
├── pages/admin/
│   ├── index.vue                       # remplacé — redirige vers /admin/articles
│   ├── articles/
│   │   ├── index.vue                   # NOUVEAU — Liste (table, filtres, pagination)
│   │   ├── nouveau.vue                 # NOUVEAU — Éditeur (création)
│   │   └── [id].vue                    # NOUVEAU — Éditeur (édition)
│   └── une.vue                         # NOUVEAU — Composer la Une
├── components/admin/                   # NOUVEAU dossier (pathPrefix:false, à déclarer)
│   ├── AdminRail.vue                   # rail de nav back-office (240 px)
│   ├── BarreFiltres.vue                # recherche + rubrique + statut (liste)
│   ├── LigneTableArticle.vue           # dérivé 3 : vignette 64×36 en fond
│   ├── EditeurRiche.vue                # enveloppe TipTap 3 (headless, styles .corps)
│   ├── BarreOutils.vue                 # barre d'outils de l'éditeur
│   ├── PanneauReglages.vue             # statut, rubrique, SOUS-THÈME, date, à la une, couverture
│   ├── DeposeCouverture.vue            # zone de dépose + alt (upload → média)
│   ├── EmplacementUne.vue              # dérivé 1 : slot 213×120 / héros 320×180
│   ├── LigneArticlePublie.vue          # dérivé 2 : vignette 64×36, titre 14px, eyebrow 10px
│   └── DialogueConfirmation.vue        # suppression (non maquetté, sobre, focus piégé)
├── composables/                        # NOUVEAU
│   ├── useEditeurArticle.ts            # état d'édition + autosave débouncé
│   └── useCompositionUne.ts            # état des 5 emplacements + réordonnancement
└── assets/css/
    └── corps.css                       # NOUVEAU — styles .corps EXTRAITS, partagés éditeur↔public

server/
├── api/admin/                          # NOUVEAU — toutes gardées par exigerCompte()
│   ├── articles/
│   │   ├── index.get.ts                # liste filtrée + paginée (brouillons compris)
│   │   ├── index.post.ts               # créer
│   │   ├── [id].get.ts                 # lire (édition, brouillon compris)
│   │   ├── [id].patch.ts               # modifier (autosave + enregistrement explicite)
│   │   ├── [id].delete.ts              # supprimer
│   │   ├── [id]/publier.post.ts        # publier (+ à la une éventuelle)
│   │   └── [id]/depublier.post.ts      # repasser en brouillon
│   ├── medias.post.ts                  # téléverser (multipart → sharp → Stockage.put)
│   └── une/
│       ├── index.get.ts                # composition courante (5 emplacements) + publiables
│       └── index.put.ts                # enregistrer l'ordre (réattribution transactionnelle)
├── routes/
│   └── medias/[...cle].get.ts          # NOUVEAU — service des médias (Stockage.get), PUBLIC
├── services/
│   ├── articles.ts                     # + listerArticlesAdmin / compterArticlesAdmin / articleAdminParId
│   ├── une.ts                          # + reordonnerUne (transactionnel) / epinglerArticle (publie puis place)
│   └── medias.ts                       # existant (enregistrerMedia) — réutilisé
├── validation/
│   ├── article.ts                      # + schéma des filtres de liste (page, q, rubrique, statut)
│   ├── media.ts                        # existant — réutilisé
│   └── une.ts                          # NOUVEAU — schéma de l'ordre (≤5 cuid, uniques)
├── utils/
│   ├── image.ts                        # NOUVEAU — traitement sharp (buffer→webp, dims, poids)
│   └── stockage.ts                     # existant — seul accès disque, seul producteur d'URL
└── validation/assainir.ts              # existant — liste blanche déjà alignée sur TipTap

shared/types/
└── dto.ts                              # + DTO d'administration (LigneArticleAdmin, EmplacementUne…)

nuxt.config.ts                          # + { path: '~/components/admin', pathPrefix:false } ; + nitro externals sharp
```

**Structure Decision** : un seul projet Nuxt (déjà en place). La feature ajoute un **layout
admin**, quatre **pages** sous `app/pages/admin/`, un dossier **`app/components/admin/`** (les
trois dérivés y vivent, hors du dossier `ui/` de la Card), deux **composables**, une feuille
**`corps.css`** extraite pour que l'éditeur et le rendu public partagent une seule source de
typographie, et côté serveur les **routes `/api/admin/**`** gardées, la **route publique
`/medias/[...]`**, trois **services** additifs et un **util `image.ts`**. Aucune migration.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Porte 2** — le back-office **n'emploie pas la Card** (3 dérivés en dimensions fixes : emplacement de Une 213×120 / héros 320×180, ligne d'article publié 64×36 titre 14px eyebrow 10px, vignette de table 64×36) | Les trois maquettes de back-office sont dessinées en **pixels fixes**, pas en `aspect-ratio` comme la Card publique ; les densités (table dense, liste d'épinglage, emplacements ordonnés) n'ont **rien** de la vignette de lecture. La constitution **prévoit** cet arbitrage (arbitrage 2 : « à trancher à la spécification du back-office »). | **Étendre la Card** de variantes « slot », « pub », « table » : rejeté — chaque emploi divergerait des autres (dimensions fixes ≠ ratio, 2 lignes forcées, eyebrow 10px), ce qui est exactement la « divergence entre deux emplois » que le principe I proscrit. On introduirait dans la Card publique des variantes qui ne servent **jamais** le public. **Forcer les maquettes dans la Card** : rejeté — trahirait la source de structure (principe II, niveau 3). Les dérivés sont donc des composants d'administration **déclarés** (un fichier chacun, dimensions nommées), pas des Card improvisées. **Action** : amender la constitution en v1.3.0 pour consigner la fermeture de l'arbitrage 2. |
