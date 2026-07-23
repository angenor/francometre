# Research — Pages publiques (Phase 0)

Décisions techniques qui résolvent les inconnues du plan et les points reportés par la
clarification. Format : Décision / Rationale / Alternatives.

---

## D1 — Schéma d'URL

**Décision** : préfixes explicites, sans collision.

| Écran | URL |
|---|---|
| Accueil | `/` |
| Tous les articles | `/articles` (page via `?page=N`) |
| Rubrique | `/rubrique/[id]` (`?page=N`) — `id` = identifiant de rubrique figé |
| Article | `/article/[slug]` |
| Flux | `/rss.xml` |
| Plan du site | `/sitemap.xml` |

**Rationale** : le schéma est déjà annoncé dans `schema.prisma` (« sert de segment d'URL :
`/rubrique/environnement` »). Les préfixes `/rubrique/` et `/article/` évitent toute
ambiguïté avec `/articles` et avec d'éventuelles pages futures, et gardent des URL
stables et lisibles pour le SEO.

**Alternatives** : rubrique à la racine `/[id]` — rejeté : un segment dynamique racine
happerait `/articles`, `/rss.xml` et toute page future, au prix d'une préséance implicite
fragile. Article sous la rubrique `/rubrique/[id]/[slug]` — rejeté : lie l'URL d'un article
à sa rubrique, alors que le slug est déjà unique globalement (contrainte de base 002).

---

## D2 — Où passe la lecture : routes serveur Nitro

**Décision** : les pages ne touchent jamais Prisma. Chaque page consomme une route
`server/api/*` par `useFetch`/`$fetch` (SSR), qui appelle les services de 002 et renvoie
un **DTO d'affichage**. Trois routes de lecture : `accueil.get.ts`, `articles/index.get.ts`,
`articles/[slug].get.ts`. Deux routes de diffusion : `routes/rss.xml`, `routes/sitemap.xml`.

**Rationale** : convention du projet (CLAUDE.md : « Les requêtes de données passent par des
routes serveur Nitro, jamais d'accès Prisma depuis un composant client »). Le mappage
entité→DTO (URL de média, eyebrow, temps de lecture) se fait **au serveur**, une seule fois,
et n'expose jamais la forme brute Prisma au client.

**Alternatives** : appeler les services directement dans le `<script setup>` d'une page —
rejeté : coule Prisma dans le bundle client potentiel et contourne la convention. Un
`useAsyncData` appelant le service en `server: true` uniquement fonctionnerait mais reste
moins net que des routes nommées, testables et réutilisables par la diffusion.

---

## D3 — Pagination : comptage et hors bornes

**Décision** : ajouter `compterArticlesPublics(options)` à `server/services/articles.ts`
(même filtre `filtreVisible`, même `rubriqueId` optionnel, `prisma.article.count`). La route
liste renvoie `{ articles, page, taille: 12, total, totalPages }`. Une `page` < 1 ou
> `totalPages` (avec `total > 0`) lève `createError({ statusCode: 404 })`. `page=1` sur une
rubrique vide n'est **pas** une erreur : c'est l'état vide (US3), `totalPages` valant 0.

**Rationale** : le test SC-002 (« toutes les pages restituent l'ensemble sans doublon ni
omission ») exige un total fiable ; `count` avec le même `where` que `findMany` garantit la
cohérence. Le hors-bornes → 404 a été tranché à la clarification (Q3), correct pour le SEO
(pas de 200 sur une page inexistante). `skip/take` sont déjà exposés par
`listerArticlesPublics` (`decalage`/`limite`) : `decalage = (page - 1) * 12`.

**Alternatives** : pagination par curseur — rejeté : sur-dimensionné pour un site
éditorial, casse la navigation « page N » directe attendue par la pagination visible.

---

## D4 — Temps de lecture

**Décision** : util pur `shared/utils/tempsLecture.ts`. Débalise le corps (compte les mots
du texte, hors balises), divise par **200 mots/minute**, arrondit au supérieur, plancher
1 minute. Renvoie un entier ; l'affichage compose « X min de lecture ».

**Rationale** : valeur dérivée, jamais stockée (FR-014). 200 mots/min est une cadence de
lecture usuelle pour du texte courant en français. Fonction pure → testable en unité,
utilisable serveur (DTO) comme client, cohérente avec `shared/utils/eyebrow.ts`.

**Alternatives** : 230–250 mots/min — écart négligeable sur des articles courts ; 200
donne une estimation légèrement prudente, préférable pour une promesse au lecteur.
Compter les caractères — rejeté : moins fidèle que les mots. Stocker le temps — rejeté :
viole FR-014 et se désynchronise à chaque édition.

---

## D5 — Rendu du corps riche et images intégrées (portabilité)

**Décision** : le corps est rendu par `v-html` dans un composant `CorpsArticle.vue`, stylé
par une feuille prose dédiée (valeurs de `tokens.md`, structure de `.corps` d'`article.html`).
Aucun ré-assainissement à l'affichage : le corps est **déjà** sûr en base (porte 11,
research 002 D10). Les images intégrées éventuelles sont rendues telles qu'assainies.

**Point de portabilité signalé (non bloquant ici)** : la liste blanche 002 autorise
`img[src]`. Le jour où l'éditeur (004) produira des images de corps, la question « src =
clé de stockage à résoudre, ou URL ? » devra être tranchée **dans la 004** pour ne pas
persister d'URL de média (porte 9). Le seed actuel ne contient **aucune** image de corps
(uniquement des `<p>`), donc cette feature n'a rien à résoudre et n'introduit aucune
violation. Consigné pour la 004.

**Rationale** : `v-html` sur du HTML déjà filtré côté serveur est la voie sûre et simple.
Réassainir au rendu contredirait le choix 002 (assainir à l'écriture) et coûterait à chaque
affichage.

**Alternatives** : ré-assainir au rendu — rejeté (déjà fait à l'écriture). Rendre le corps
via un arbre de composants (parser maison) — rejeté : complexité sans bénéfice tant que la
liste blanche est stable et l'entrée déjà sûre.

---

## D6 — Format du flux de syndication

**Décision** : **RSS 2.0**, servi à `/rss.xml`, `Content-Type: application/rss+xml;
charset=utf-8`. `<item>` : titre, lien absolu, `guid` (lien), `pubDate` (RFC 822 depuis
`publieLe`), `description` (chapô). Les liens et l'URL de couverture éventuelle sont
**absolus**, préfixés par l'origine du site issue de `runtimeConfig.public.siteUrl`
(défaut `https://francometre.com`).

**Rationale** : RSS 2.0 est le format le plus universellement consommé par les agrégateurs,
et suffit à « lister les derniers articles publiés » (FR-023). L'origine configurable garde
la portabilité (aucune URL en dur, aucune dépendance à l'hôte de développement).

**Alternatives** : Atom — équivalent fonctionnel, légèrement plus verbeux, moins attendu par
défaut ; rejeté par simplicité. JSON Feed — moins consommé par les agrégateurs classiques.

---

## D7 — Plan du site

**Décision** : `sitemap.xml` généré à `/sitemap.xml`, `<urlset>` conforme, `<url>` pour :
l'accueil, `/articles`, les 8 rubriques, et chaque article **publié et daté**
(`<loc>` absolu, `<lastmod>` depuis `modifieLe`/`publieLe`). Aucun brouillon (FR-025).

**Rationale** : XML `sitemaps.org` standard, lisible par les moteurs (FR-024). Même filtre
de visibilité que partout, même origine configurée que le flux.

**Alternatives** : plan du site HTML lisible par l'humain — le mot « plan du site » ici vise
l'indexation ; un plan HTML pourrait s'ajouter plus tard sans coût, hors périmètre.

---

## D8 — Pages système (404 / 503 / 500)

**Décision** : `app/error.vue` (convention Nuxt) enveloppe `NuxtLayout` pour garder la
charpente. Il lit `error.statusCode` : **404** « adresse introuvable » affiche les derniers
articles (récupérés par `$fetch('/api/articles?page=1')`) ; **503** « service indisponible »
et **500** « erreur serveur » partagent le gabarit d'`etats.html` (chiffre en filigrane
« filet », phrase en `--ink`, pas d'accent). Les routes serveur lèvent `createError` avec
le bon `statusCode` (404 slug/rubrique/page inconnus ; 503 indisponibilité).

**Rationale** : `error.vue` est le seul point où Nuxt rend les erreurs ; l'y ancrer garantit
un gabarit unique. La 404 « ramène vers du contenu » (FR-020) comme le prescrit `etats.html`.
Codes justes → FR-022, bon comportement SEO.

**Alternatives** : pages d'erreur par route — rejeté : Nuxt centralise l'erreur dans
`error.vue` ; multiplier les gabarits contredirait la porte 2.

---

## D9 — Inclusion de la couverture dans les lectures publiques

**Décision** : étendre les trois lectures publiques de `server/services/articles.ts`
(`listerArticlesPublics`, `articlePublicParSlug`, `lireUne`) d'un `include: { couverture:
true }`, pour disposer de la **clé** de couverture (`couverture.cle`) au mappage DTO.
`presentation.ts` calcule alors `stockage.url(cle)`.

**Rationale** : ajout **rétrocompatible** (les appelants existants reçoivent un champ en
plus). Sans la relation, le DTO ne pourrait pas produire l'URL sans une seconde requête. La
base ne stocke toujours que la clé ; l'URL reste calculée à la lecture (porte 9).

**Alternatives** : requête média séparée par article — rejeté : N+1 inutile. Stocker l'URL —
interdit (porte 9).

---

## D10 — Légende de couverture (delta de schéma, décidé par le porteur)

**Décision** : ajouter `Article.couvertureLegende String?` (nullable). Migration additive.
Le seed alimente une légende sur les articles d'exemple publiés (l'`altParDefaut` du média
reste distinct, réservé à l'accessibilité). Le DTO article expose `legende`.

**Rationale** : `article.html` montre une `<figcaption>` sous la couverture (« *…à l'été
2025. — Photo d'illustration* ») — la légende relève de la structure (principe II, niveau 3),
mais 002 ne l'a pas modélisée. Le porteur a tranché le 2026-07-22 : champ dédié plutôt que
détourner `couvertureAlt` (qui confondrait accessibilité et légende, principe VIII).
`String?` respecte la porte 10 (ni enum, ni JSON, ni liste, ni auto-increment).

**Alternatives** (soumises au porteur, écartées) : réutiliser `couvertureAlt` comme légende
visible — dégrade l'a11y et interdit un crédit photo distinct ; reporter la légende à la
004 — contredit FR-015/SC-003.

---

## D11 — Carrousel horizontal des sections de rubrique (mobile)

**Décision** : `SectionRubrique.vue` affiche ses vignettes en **grille** au-dessus du point
de rupture et en **rail à défilement horizontal borné** en dessous (`overflow-x-auto`,
largeur de card mobile de `tokens.md`, `scroll-snap` facultatif). Le défilement est **interne
au conteneur**, jamais celui de la page.

**Rationale** : FR-028 demande le défilement horizontal des sections sur mobile ; la porte 7
interdit le défilement horizontal **de page**. Les deux se concilient car le rail est borné —
c'est exactement la « décision de rail horizontal de cards » prise par Fondations (principe V,
`tokens.md` §mobile). Test e2e : la page ne déborde pas à 375 px, mais le rail, oui, en
interne.

**Alternatives** : empilement vertical sur mobile — rejeté : contredit FR-028. Débordement
de page — interdit (porte 7).

---

## D12 — Stratégie de test

**Décision** :
- **Unit (Vitest, SQLite éphémère `harnais.ts`)** : `tempsLecture` (mots/cadence/plancher) ;
  `presentation` (eyebrow selon contexte, URL via stockage, DTO complet) ; `compter` +
  pagination + hors-bornes ; non-régression de visibilité (aucun brouillon dans un DTO).
- **E2E (Playwright, deux thèmes + mobile 375 px)** : Une ordonnée 01→05 ; grille+pagination
  de rubrique ; état vide ; article complet (fil d'Ariane, couverture+légende, corps, « à
  lire aussi ») ; 404 ramène aux derniers ; `rss.xml`/`sitemap.xml` répondent ; aucun
  débordement horizontal de page mais carrousel qui défile.
- `npm run verifier` et `npm run typecheck` restent verts.

**Rationale** : reprend l'outillage et les conventions déjà en place (001/002). Chaque
critère de succès de la spec a un test associé.

**Alternatives** : tests de composants isolés (Vue Test Utils) — utiles mais l'e2e couvre
mieux le rendu réel en deux thèmes ; on s'en tient à unit (logique) + e2e (rendu).
