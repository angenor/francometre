# Contrat — Performance (cache et images)

Normatif. Cible : Lighthouse ≥ 90 (perf) sur `/` et `/article/**`, mobile **et** bureau, sans
servir de contenu périmé au-delà d'un délai borné.

## 1. Cache des pages de liste (`routeRules` `swr`)

| Route | Règle | Justification |
|---|---|---|
| `/` | `swr`, `maxAge: 30` | accueil dense — servi du cache, revalidé en fond |
| `/articles`, `/articles/**` | `swr`, `maxAge: 30` | liste toutes rubriques, paginée |
| `/rubrique/**` | `swr`, `maxAge: 30` | listes de rubrique, paginées |
| `/article/**` | `swr`, `maxAge: 30` (optionnel) | perf ; non exigé par la spec |
| `/admin`, `/admin/**` | `no-store` (existant) + `X-Robots-Tag: noindex` | jamais en cache (bfcache) |

Règles :
- La HTML mise en cache est **agnostique au thème** : la classe `.dark` est posée par
  `color-mode` **côté client avant peinture**. Le cache ne capture aucun thème (porte 5,
  aucun flash).
- Les pages de liste ne portent **aucune donnée par visiteur** : `swr` partagé est sûr.
- **Borne** : `maxAge: 30 s` garantit qu'un changement éditorial (publication,
  réordonnancement de la Une) apparaît en **< 60 s** (SC-009), sans invalidation explicite.

## 2. Images (`<NuxtImg>`, IPX, webp)

`@nuxt/image` est déjà configuré (`quality: 80`, `format: ['webp']`, `screens` incluant
375 et 1000). IPX traite les médias de **même origine** (`/medias/**`) ; `image.domains`
autorise cette origine au besoin.

| Emploi | Composant | `loading` | `fetchpriority` | `sizes` (indicatif) |
|---|---|---|---|---|
| Héros accueil (LCP) | `UneHero` | `eager` | `high` | `(max-width:1000px) 100vw, 58vw` |
| Couverture article (LCP) | `article/[slug].vue` | `eager` | `high` | `(max-width:1000px) 100vw, 720px` |
| Vignette grille/section | `ArticleCard` | `lazy` | — | `(max-width:1000px) 50vw, 25vw` |

### 2 bis. Cache long des médias servis — **déjà en place**

`server/routes/medias/[...cle].get.ts` émet déjà
`Cache-Control: public, max-age=31536000, immutable` (les clés sont immuables : un contenu,
une clé). La stack le confirme ; **rien à ajouter**. Les variantes produites par IPX héritent
d'un cache long côté `@nuxt/image`.

Règles :
- **Seul le LCP** (héros de l'accueil, couverture d'article) est `eager` ; tout le reste est
  `lazy` (FR-020).
- Chaque `<NuxtImg>` sort un `srcset` webp dimensionné (FR-021) ; le conteneur conserve son
  ratio **16:9** (aucun décalage cumulatif).
- Le **repli « sans image »** d'`ArticleCard` est préservé : `@error` reste branché ; en
  `lazy`, il se déclenche à l'approche de l'écran (research D10).
- `alt` **réel** obligatoire sur toute couverture (porte 8) — contrat `ArticleCard`
  inchangé.
- Aucune image ne provoque de défilement horizontal à 375 px (porte 7).

## 3. Critères de vérification (mappés aux SC)

- **SC-008** : sur l'accueil, le LCP peint rapidement ; les vignettes hors écran ne sont pas
  requises avant l'approche (observable au moniteur réseau / trace Lighthouse).
- **SC-009** : un article publié via l'administration apparaît sur `/` et sa rubrique en
  < 60 s.
- **SC-001 (perf)** : Lighthouse performance ≥ 90 sur `/` et `/article/**`, mobile et bureau.
