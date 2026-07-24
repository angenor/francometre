# Recherche — Référencement, performance, accessibilité (Phase 0)

Contexte : feature de **finition**. Le socle existe déjà — `siteUrl` (apex) configuré,
routes `rss.xml`/`sitemap.xml` écrites à la main, `@nuxt/image` et `color-mode` en place,
interface `Stockage` unique, tests axe/responsive fournis. Ces décisions comblent ce qui
manque **sans** ajouter de module SEO ni de migration.

Aucune balise `NEEDS CLARIFICATION` : les quatre points ouverts ont été tranchés au
`/speckit-clarify` (voir `spec.md` § Clarifications).

---

## D1 — Métadonnées de page : `useSeoMeta`/`useHead`, sans module

**Décision.** Poser titre + description + canonique + robots + Open Graph + JSON-LD avec les
composables intégrés (`useHead`, `useSeoMeta` d'`unhead`, déjà fournis par Nuxt 4). **Aucun**
module ajouté (`@nuxtjs/seo`, `nuxt-og-image`, `@nuxtjs/sitemap`, `@nuxtjs/robots`).

- Défauts globaux dans `nuxt.config.ts` → `app.head` : `titleTemplate` implicite non retenu
  (les titres varient trop), une **description par défaut**, le **lien flux RSS**
  (`<link rel="alternate" type="application/rss+xml">`), `og:site_name`, `twitter:card`.
- Par page : `useSeoMeta({ title, description, ... })`. L'accueil garde
  « Francomètre — L'actualité, mesurée. » ; rubrique = « {Libellé} — Francomètre » ;
  article = « {Titre} — Francomètre » ; « tous les articles » = « Tous les articles —
  Francomètre ». Marque **accentuée** partout (FR-002).

**Rationale.** Le projet fabrique déjà `rss.xml` et `sitemap.xml` à la main et à la
`siteUrl` ; ajouter un méta-module dupliquerait cette logique, imposerait sa propre
configuration et son origine, et masquerait le contrôle. `unhead` suffit, est déjà chargé,
et rend un test DOM trivial.

**Alternatives.** `@nuxtjs/seo` (méga-module) : trop, et reprend en main sitemap/robots/og
qu'on maîtrise déjà. `nuxt-og-image` (génération d'images OG) : inutile — l'OG d'un article
est **sa couverture**, et le défaut est un actif **fourni** (D7).

---

## D2 — URL canonique et redirection `www` → apex

**Décision.**
- **Canonique** : chaque page déclare `<link rel="canonical" href="{siteUrl}{path}">`, l'apex
  `https://francometre.com` faisant foi (Clarifications). Construit par un helper
  (`app/utils/seo.ts`) à partir de `useRuntimeConfig().public.siteUrl` + `route.path`
  **normalisé** (sans barre finale superflue, pagination conservée car indexable — D5).
- **Redirection** : un middleware Nitro (`server/middleware/canonique.ts`) lit l'en-tête
  `Host` ; si l'hôte commence par `www.`, il répond **301** vers `siteUrl + event.path`.
  Actif seulement quand un `Host` en `www.` se présente (aucun effet en local ni en test).

**Rationale — pourquoi lire `Host` ici est légitime.** La règle du projet est : « ne jamais
**dériver l'origine canonique** de `Host` » (il n'est pas fiable). Ici `Host` sert seulement
à **détecter** la variante `www` à rediriger ; la **cible** reste la `siteUrl` configurée.
On ne fabrique aucune URL absolue à partir de `Host`. Le preset `node-server` (pas d'edge)
impose de garantir la redirection dans l'application plutôt qu'au proxy, pour qu'elle tienne
quel que soit l'hébergement.

**Alternatives.** Redirection au reverse-proxy : hors du dépôt, non garantie, non testable
ici. `routeRules` redirect : ne discrimine pas sur l'hôte, seulement sur le chemin —
inadapté.

---

## D3 — `robots.txt` et déclaration du plan du site / flux

**Décision.** Ajouter `server/routes/robots.txt.get.ts` :

```
User-agent: *
Allow: /
Disallow: /admin
Sitemap: {siteUrl}/sitemap.xml
```

Le **flux RSS** existant est annoncé dans l'en-tête HTML de toutes les pages (D1). Le **plan
du site** existant est pointé par `robots.txt`. Les deux emploient la `siteUrl` (apex).

**Rationale.** `sitemap.xml` et `rss.xml` existent (feature 003) mais rien ne les
**déclare** : c'est précisément la lacune « déclarés proprement » du cahier. Une route
`robots.txt` faite main s'aligne sur les deux routes de diffusion déjà faites main.

**Alternatives.** Fichier statique `public/robots.txt` : ne peut pas injecter la `siteUrl`
surchargée en production (`NUXT_PUBLIC_SITE_URL`). Route dynamique retenue.

---

## D4 — `noindex` sur les pages non publiques

**Décision.** Émettre `noindex, follow` là où l'indexation n'a pas lieu d'être :
- `/connexion` et `app/error.vue` (404/503) → `useSeoMeta({ robots: 'noindex, follow' })` ;
- `/admin/**` → en-tête **`X-Robots-Tag: noindex`** ajouté aux `routeRules` (déjà
  `no-store`), sans toucher au refus par défaut (porte 12) ;
- un article non publié renvoie déjà 404 (feature 003) et est **absent** du `sitemap.xml`.

Les **pages paginées restent indexables** (Clarifications, D5) — elles ne reçoivent pas
`noindex`.

**Rationale.** Empêche l'indexation de contenu mince ou privé sans dépendre d'une
robots-directive globale. `X-Robots-Tag` en en-tête convient à l'administration (rendue
côté client). La « page de résultats de recherche » citée par la spec **n'existe pas**
(il n'y a qu'un `SearchEntry`, pas de route `/recherche`) : la règle s'y appliquera si et
quand cette page est créée — hors périmètre ici.

---

## D5 — Pagination indexable et auto-canonique

**Décision.** `/rubrique/{id}?page=N` et `/articles?page=N` sont **indexables** ; chaque page
déclare sa **propre** canonique (incluant `?page=N`). Pas de `rel=prev/next` (abandonné par
les moteurs). Une page hors bornes reste un **404** (règle de la feature 003, inchangée).

**Rationale.** Choix du porteur (Clarifications). Auto-canonique = pratique moderne ; aucun
article joignable seulement par la pagination n'est masqué. Cohérent avec l'existant :
`sitemap.xml` liste déjà chaque article individuellement, donc l'indexabilité des pages de
liste ne conditionne pas l'indexation des articles.

**Alternatives.** `noindex` au-delà de la page 1, ou canonique de toutes les pages vers la
page 1 : écartés — masqueraient des pages de liste et compliqueraient sans bénéfice ici.

---

## D6 — URL absolue de média sans enfreindre la porte 9 (`urlAbsolue`)

**Décision.** **Étendre l'interface `Stockage`** d'une méthode
`urlAbsolue(cle: string, origine: string): string`.
- Impl disque : `origine + url(cle)` (soit `https://francometre.com/medias/<clé>`).
- Impl objet/S3 future : `url(cle)` (déjà absolue) — l'`origine` est ignorée.

L'URL absolue d'Open Graph / JSON-LD passe par cette méthode, appelée **au serveur** dans
le mappeur `metaSeoArticleDe` (D8). Aucune concaténation `origine + url()` ailleurs.

**Rationale.** La porte 9 (et le commentaire en tête de `stockage.ts`) réserve la
**fabrication d'URL de média** à l'interface `Stockage` : « toute autre construction —
concaténation, gabarit, préfixe en dur — est un défaut ». Prolonger l'interface tient la
règle **et** la portabilité : un simple `origine + url(cle)` produirait
`https://francometre.com https://cdn…/clé` (double préfixe) le jour du passage à S3, où
`url()` est déjà absolue. `urlAbsolue` encapsule cette différence au bon endroit. Le
`verifier.mjs` ne contrôle mécaniquement que « pas d'URL en base » et « pas de `node:fs`
hors `stockage.ts` » : la discipline d'URL de média reste un contrôle de revue — cette
décision la respecte à la lettre.

**Alternatives.** Concaténer `siteUrl + stockage.url(cle)` dans le mappeur SEO : passerait
le `verifier`, mais viole l'esprit de la porte 9 et casse S3. Rejeté.

---

## D7 — Image de partage par défaut : composée depuis `public/brand`

**Décision.** L'article sans couverture (et toute page hors article) référence une **image
de partage par défaut prise dans `public/brand`** (précision du porteur, stack). Comme le
dossier ne contient que les mots-symboles `NOIR.png`/`BLANC.png` en **3230 × 970** (ratio
~3,33:1, inadapté au 1,91:1 attendu d'un aperçu social), on **compose** au build un
`public/brand/partage-defaut.png` de **1200 × 630** : le mot-symbole centré sur le **fond de
surface**, sans accent. Génération reproductible par un petit script (`scripts/partage-defaut.mjs`,
`sharp` déjà présent), l'actif étant **committé**. Son URL absolue =
`{siteUrl}/brand/partage-defaut.png` (actif `public/`, pas une clé de média → **pas** de
passage par `Stockage`).

**Conséquence : la dépendance n'est plus bloquante.** SC-002 (article sans couverture) est
vérifiable sans livraison externe (supersède la réponse initiale « le porteur fournit » des
Clarifications).

**Rationale.** La constitution interdit d'**inventer** un actif de marque, pas de **placer**
le mot-symbole sanctionné : composer `NOIR/BLANC` (les seules ressources de marque) sur la
surface, sans accent ni diagonale ni ombre, est un placement mécanique — aucune création
visuelle. Cela respecte le principe I (sobriété : raster, aucun style), le principe III
(aucun accent ajouté) et le vœu du porteur d'employer `public/brand`.

**Alternatives.** Utiliser `NOIR.png`/`BLANC.png` **tels quels** (3230 × 970) : letterboxing
/ rognage par les réseaux — écarté pour la qualité de l'aperçu, mais reste une bascule
triviale si le porteur le préfère. Livraison d'un actif dédié par le porteur (réponse
initiale du clarify) : écartée au profit de `public/brand`, plus simple et non bloquante.
Générer une image OG **par article** (`nuxt-og-image`) : inutile — l'OG d'un article est sa
couverture.

---

## D8 — Données OG/JSON-LD calculées au serveur (`SeoArticleDTO`)

**Décision.** Un mappeur `metaSeoArticleDe(article, origine)` dans
`server/utils/presentation.ts` produit un `SeoArticleDTO` :
`{ canonical, imageAbsolue, publieISO, modifieISO, section, auteur }`. Il est ajouté à la
réponse de `GET /api/articles/[slug]` sous la clé `seo` (le handler passe `siteUrl`). La page
article consomme ce `seo` pour `useSeoMeta` (OG/Twitter) et le **constructeur JSON-LD pur**
`shared/utils/jsonldArticle.ts` (testable hors Nuxt), qui bâtit un `NewsArticle` :
`headline`, `datePublished`, `dateModified`, `articleSection`, `author`, `image`,
`mainEntityOfPage`, `publisher` (Organisation « Francomètre » + logo). **Repli auteur** :
`Person(auteur)` si présent, sinon `Organization("Francomètre")`. **Repli image** : couverture
absolue, sinon image de partage par défaut (D7).

**Rationale.** La construction d'URL absolue et le choix de l'image doivent rester **au
serveur** (portabilité, porte 9) ; la page ne reçoit que des chaînes prêtes. Séparer le
constructeur JSON-LD en util **pur** permet un test unitaire Vitest sans navigateur.

**Alternatives.** Tout construire dans le composant : forcerait une fabrication d'URL de
média côté client (contraire à D6). Rejeté.

---

## D9 — Cache `swr` des pages de liste (fraîcheur bornée < 60 s)

**Décision.** `routeRules` Nitro en `swr` (stale-while-revalidate) sur les **pages de
liste** — `/`, `/articles`, `/articles/**`, `/rubrique/**` — avec une borne **`maxAge: 30`
secondes**. Le cache sert la HTML instantanément et revalide en arrière-plan ; un changement
éditorial (publication, réordonnancement de la Une) apparaît en **< 60 s** (SC-009), la marge
de 30 s couvrant le décalage de revalidation `swr`. `/admin/**` reste `no-store` (inchangé).
Les pages `/article/**` peuvent aussi passer en `swr` (perf), sans obligation de spec.

**Rationale — compatibilité thème (porte 5).** La HTML mise en cache est **agnostique au
thème** : `color-mode` (preference `system`) pose la classe `.dark` **côté client avant
peinture**, indépendamment de la HTML servie. Le cache ne capture donc aucun thème et ne
réintroduit pas de flash. Les pages de liste ne portent **aucune donnée par visiteur**
(contenu public), donc `swr` partagé est sûr. Borne 30 s < 60 s pour tenir SC-009 sans
mécanisme d'invalidation explicite (qui coupleraient publication et cache).

**Alternatives.** `cachedEventHandler` sur les routes `/api/**` : cache la donnée mais pas la
HTML rendue — gain moindre sur le LCP. Invalidation par clé au moment de publier : couplage
et complexité que la borne 30 s rend inutiles. ISR/edge : indisponible sous `node-server`.

---

## D10 — Images : `<NuxtImg>`, dimensionnées, paresseuses hors LCP

**Décision.** Remplacer les `<img>` de couverture par `<NuxtImg>` (fournisseur IPX, webp,
`quality: 80` déjà configuré) avec `sizes` par usage, et `loading`/`fetchpriority` ainsi :

| Emploi | Composant | `loading` | Note |
|---|---|---|---|
| Héros de l'accueil (LCP) | `UneHero` | `eager` + `fetchpriority="high"` | jamais différé (FR-020) |
| Couverture d'article (LCP) | `article/[slug].vue` | `eager` + `fetchpriority="high"` | jamais différée |
| Vignette de grille / section | `ArticleCard` | `lazy` | hors écran → différée |

IPX traite les médias servis en **même origine** (`/medias/**`) ; `image.domains` est
complété au besoin pour autoriser cette origine. Les conteneurs gardent leur ratio 16:9
(aucun décalage cumulatif — CLS déjà maîtrisé).

**Rationale — réconciliation avec le repli d'erreur d'`ArticleCard`.** Le commentaire du
composant justifie le chargement immédiat : « un média différé jamais demandé ne signale
jamais son échec ». Avec `loading="lazy"` **natif**, une vignette hors écran finit par être
demandée **à l'approche du défilement**, et l'événement `@error` se déclenche alors — le repli
« sans image » reste fiable **pour les vignettes que le lecteur atteint** (les seules qui
comptent visuellement). Les vignettes jamais atteintes ne s'affichent jamais : leur repli est
sans objet. Le héros et la couverture, eux, restent `eager` : ce sont les LCP, et leur repli
doit rester immédiat.

**Alternatives.** Générer les variantes à l'upload (sharp) : alourdit le modèle de média et
le stockage, hors périmètre. Garder `<img>` + tailles fixes : ne satisfait pas « dimensionné
au plus juste » (FR-021, `srcset`). Service d'images tiers : interdit (portabilité).

---

## D11 — Vérification de l'audit ≥ 90 : `playwright-lighthouse`

**Décision.** Un test `tests/e2e/audit.spec.ts` exécute Lighthouse (via `playwright-lighthouse`,
qui réutilise le Chromium de Playwright) contre le build de **preview**, pour `/` et une page
`/article/**`, sur profils **mobile et bureau**, et **échoue sous 90** en performance,
référencement et accessibilité. L'a11y (sensible au thème) est de plus couverte par axe dans
les deux thèmes (test existant, étendu). Commande dédiée (hors `test:e2e` par défaut, l'audit
étant plus lent) documentée au quickstart.

**Rationale.** SC-001 est le critère vérifiable phare ; une porte automatisée le rend
répétable. Réutiliser le Chromium de Playwright évite d'ajouter `chrome-launcher`/Puppeteer.
Perf et référencement ne dépendent pas du thème → deux profils suffisent pour ces volets ;
l'a11y se mesure dans les deux thèmes.

**Alternatives.** Audit manuel Lighthouse : documenté en secours au quickstart, mais non
répétable en intégration. `unlighthouse` : orienté crawl multi-pages, plus lourd que le
besoin (deux pages).

---

## D12 — Passe d'accessibilité : vérifier l'éditeur et le glisser-déposer de la Une

**Décision.** La passe clavier d'US2 couvre explicitement les deux points durs de
l'administration, tous deux **déjà implémentés** — il s'agit de les **vérifier**, pas de les
construire :

- **Éditeur riche (TipTap)** — la barre d'outils est atteignable au clavier et ses boutons
  s'actionnent (Tab pour parcourir, Entrée/Espace pour basculer) ; la zone d'édition reçoit
  le focus. Le repère de focus sur la barre d'outils est déjà testé (`a11y.spec.ts`) ; on
  ajoute l'**opérabilité** (bascule d'un format au clavier).
- **Réordonnancement de la Une** — `app/pages/admin/une.vue` fournit déjà un chemin clavier :
  flèches **Haut/Bas** sur la poignée focalisée (`[data-poignee]`), réordonne, **annonce**
  via une région `aria-live="polite"`, puis **rend le focus** à la poignée déplacée. Le
  `@formkit/drag-and-drop` est le confort pointeur ; le clavier en est l'**alternative
  accessible**, à vérifier de bout en bout (focus poignée → ArrowUp/Down → ordre changé →
  annonce → focus conservé).

**Rationale.** Le glisser-déposer est le motif d'interaction le moins accessible ; la
constitution (porte 8) exige un parcours clavier complet **partout, administration comprise**.
Le chemin existe déjà (feature 005) : cette feature le met sous test automatisé
(`tests/e2e/clavier.spec.ts`) pour qu'une régression le casse bruyamment.

**Alternatives.** Réécrire le réordonnancement : inutile, le chemin clavier existe.
Se contenter d'axe : axe ne pilote pas une séquence clavier — un test de parcours dédié est
nécessaire.

## Synthèse des impacts

- **Aucune migration, aucune table, aucune colonne** (porte 10 : N/A).
- **Interface `Stockage`** : +`urlAbsolue` (D6).
- **DTO** : +`SeoArticleDTO`, `ArticlePageDTO.seo` (D8).
- **Nouveaux fichiers serveur** : middleware canonique (D2), `robots.txt` (D3), mappeur SEO
  (D8).
- **`nuxt.config.ts`** : `routeRules` `swr` + `noindex` (D4, D9), `app.head` (D1, D3),
  `image.domains` au besoin (D10).
- **Composants** : `ArticleCard`, `UneHero`, couverture d'article → `<NuxtImg>` (D10).
- **Pages** : métadonnées par page (D1, D2, D4).
- **DevDeps** : `playwright-lighthouse`, `lighthouse` (D11).
- **Image de partage par défaut** : `public/brand/partage-defaut.png` **composée** depuis le
  mot-symbole (script `sharp`), committée — **non bloquante** (D7).
- **Cache long des médias** : **déjà en place** — `server/routes/medias/[...cle].get.ts`
  émet `Cache-Control: public, max-age=31536000, immutable`. La stack le confirme ; rien à
  ajouter (voir `contracts/performance.md` §2 bis).
- **A11y** : parcours clavier de l'éditeur et de la Une **déjà implémentés** — mis sous test
  (D12).
