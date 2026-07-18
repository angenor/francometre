# Recherche — Phase 0 — Fondations

**Feature** : [spec.md](./spec.md) · **Date** : 2026-07-18

Ce document résout les inconnues techniques du plan. Chaque décision porte sa justification
et les options écartées. Les points marqués **vérifié** l'ont été sur la documentation
officielle le 2026-07-18 ; les sources sont listées en fin de document.

---

## D1 — Pile technique et versions

**Décision** *(amendée le 2026-07-18 — voir l'encadré ci-dessous)* : Nuxt 4 (Vue 3,
TypeScript), un seul projet, rendu serveur, servi par **Nitro sur sa cible par défaut,
Node.js**.

**Justification** : la constitution engage bien au-delà de Fondations — back-office
authentifié (VII), base portable SQLite → PostgreSQL (VI), assainissement serveur du HTML
d'éditeur (VII). Nuxt couvre le site public et ces routes serveur dans un même projet, sans
second déploiement. Le rendu serveur sert directement la contrainte « aucun flash » (IV).

```bash
npm run build
node .output/server/index.mjs
```

> **Amendement — le runtime Deno est abandonné.**
>
> Ce document retenait initialement le preset Nitro `deno_server` sur Deno 2.9.x. Le porteur
> du projet a tranché à l'implémentation : **aucune exigence de la spécification et aucune
> porte de la constitution ne porte sur le runtime.** Deno ajoutait une dépendance à
> installer et à déployer sans rien apporter à la feature. Nitro reste le moteur serveur —
> il ne s'agit pas de l'échanger, seulement de le laisser viser sa cible par défaut.
>
> Deux faits **mesurés** à l'implémentation, non déduits, et qui contredisent ce que ce
> document affirmait :
>
> 1. La sortie de compilation n'est pas `.output/server/index.ts` mais
>    `.output/server/index.mjs`, et nitropack 2.13.4 génère lui-même un `.output/deno.json`
>    dont les permissions diffèrent de celles annoncées ici (`--allow-write`,
>    `--unstable-byonm`, `--unstable-node-globals` en plus).
> 2. Une compilation `deno_server` **ne démarre pas sous Node** :
>    `ERR_MODULE_NOT_FOUND` sur `uncrypto/dist/crypto.node.mjs`. Ce n'est pas un défaut de
>    la compilation — `uncrypto` déclare une condition d'export `"deno"` pointant sur
>    `crypto.web.mjs`, bel et bien présent. C'est la démonstration qu'une compilation est
>    faite **pour** une cible et n'est pas portable après coup.
>
> Le socle reste portable **avant** compilation : changer `nitro.preset` suffit à viser
> Deno, Bun, Cloudflare ou Vercel, sans toucher au code applicatif.
>
> Vérification effectuée sur la cible retenue : la compilation démarre, sert `/styleguide`
> en 200, et **les 225 tests de bout en bout passent contre le serveur compilé**, aux cinq
> largeurs et dans les deux thèmes.

**Constat historique — ce qui a été mesuré avant l'abandon de Deno (2026-07-18).** Conservé
parce qu'il documente *pourquoi* la voie Deno a été jugée coûteuse, et parce qu'il vaudra
encore le jour où un preset alternatif serait de nouveau envisagé. La documentation citée en
fin de document annonçait une sortie `.output/server/index.ts` et une commande à permissions
explicites. Ce n'est pas ce que produisait **nitropack 2.13.4** : la compilation écrivait
`.output/server/index.mjs` et générait elle-même un `.output/deno.json` portant la tâche de
lancement et son jeu de permissions — lequel comportait deux drapeaux que la documentation ne
mentionnait pas (`--unstable-byonm`, `--unstable-node-globals`) et un `--allow-write`
supplémentaire. Le fait est **mesuré sur la sortie de compilation**, pas déduit.

Aucune de ces commandes ne subsiste dans le dépôt : le runtime ayant été abandonné, elles
n'ont plus d'emploi. Ce paragraphe garde trace de la mesure, pas d'une consigne.

### Versions épinglées

Relevées le 2026-07-18 par `npm view <paquet> version` — **pas de mémoire, mesure**. La
consigne était explicite et elle était fondée : les versions réelles sont nettement en avance
sur ce qu'on pourrait supposer.

| Paquet | Version |
|---|---|
| `nuxt` | 4.4.8 |
| `tailwindcss` · `@tailwindcss/vite` | 4.3.3 |
| `@nuxtjs/color-mode` | 4.0.1 |
| `@nuxt/fonts` | 0.14.0 |
| `@nuxt/image` | 2.0.0 |
| `@nuxt/icon` | 2.3.1 |
| `@playwright/test` | 1.61.1 |
| `@axe-core/playwright` | 4.12.1 |
| `nitropack` | 2.13.4 |

*(La ligne « Deno 2.9.x » a été retirée par l'amendement ci-dessus : le runtime n'est plus
une dépendance du projet.)*

**Écarté** : Next.js et SvelteKit (couverture équivalente, mais rupture avec les conventions
Vue existantes) ; Astro (excellent pour l'éditorial, mais le back-office authentifié et
l'éditeur riche imposeraient un second projet ou une multiplication d'îlots).

**Rappel de configuration** : Tailwind v4 **n'a pas de `tailwind.config.js`**. Toute la
configuration tient dans la feuille CSS (`@import`, `@theme`, `@custom-variant`). Créer un
fichier de configuration JavaScript serait un retour à la v3, sans effet.

---

## D2 — Tokens et Tailwind : une seule source de valeurs

C'est le point qui demandait le plus d'attention. Le principe II impose **une seule** source
de valeurs (`tokens.md`), et interdit explicitement de recopier des valeurs en dur ailleurs.
Une configuration Tailwind classique aurait créé une seconde table de valeurs à maintenir en
parallèle — exactement ce que le principe interdit.

**Décision** : architecture en deux couches, sans duplication d'aucune valeur.

1. **`app/assets/css/tokens.css`** — les **valeurs**, transcrites de `tokens.md`, sous forme
   de variables CSS classiques, dans `:root` et `html.dark`. C'est le seul endroit du dépôt
   où figure un code couleur. Structure identique à celle des maquettes.

   ```css
   :root{
     --paper:#FFFFFF; --surface:#F5F5F5; --ink:#0A0A0A;
     --muted:#6F6F6F; --line:#E6E6E6; --accent:#1F35FF;
   }
   html.dark{
     --paper:#0B0B0C; --surface:#151517; --ink:#F5F5F5;
     --muted:#9A9A9A; --line:#262628; --accent:#8A97FF;
   }
   ```

2. **`app/assets/css/main.css`** — le **raccordement** à Tailwind, qui ne redéclare aucune
   valeur mais pointe vers les variables ci-dessus :

   ```css
   @import "tailwindcss";
   @import "./tokens.css";

   @theme inline {
     --color-paper:   var(--paper);
     --color-surface: var(--surface);
     --color-ink:     var(--ink);
     --color-muted:   var(--muted);
     --color-line:    var(--line);
     --color-accent:  var(--accent);
   }
   ```

**Le mot-clé `inline` est obligatoire ici, et c'est subtil** (vérifié). Sans lui, Tailwind
génère `background-color: var(--color-paper)`, et `--color-paper` est résolu **là où il est
défini** — dans `:root`, donc toujours avec la valeur du thème clair. La bascule serait sans
effet. Avec `inline`, Tailwind écrit directement `background-color: var(--paper)`, résolu au
point d'usage, donc sensible à `html.dark`. La documentation le formule ainsi : « Using the
`inline` option, the utility class will use the theme variable *value* instead of referencing
the actual theme variable. »

**Conséquence** : `tokens.md` reste seul dépositaire des valeurs ; `tokens.css` en est la
transcription mécanique ; Tailwind n'en détient aucune. Une correction de `tokens.md` se
répercute en un seul endroit.

### Portée de la feuille de tokens

Les six couleurs ne sont qu'une partie. **Chaque valeur de `tokens.md` devient une variable
CSS unique** — pas seulement la palette :

| Origine dans `tokens.md` | Ce qui devient variable |
|---|---|
| §1 Couleurs | Les six tokens, dans les deux thèmes |
| §2 Typographie | Les deux familles, et l'échelle complète : tailles, graisses, interlignes, approches |
| §3 Géométrie | Gouttières (24 / 20 px), conteneur 1440, contenu 1280, colonne de lecture, écarts de section (80 / 48 px), épaisseur de filet, largeur de rail |
| §4 Signature | L'angle de coupe : 4 px de dénivelé pour 64 px |

Les espaces de noms de thème de Tailwind couvrent la plupart de ces familles — `--text-*`,
`--font-*`, `--font-weight-*`, `--leading-*`, `--tracking-*`, `--spacing-*`, `--breakpoint-*`,
`--container-*` — ce qui rend les valeurs disponibles en utilitaires plutôt qu'en CSS écrit à
la main.

**Piège à éviter** : chaque fichier de `docs/design/html/` redéfinit ses propres variables en
tête de document. **Ces blocs ne se recopient pas.** Le projet n'a qu'une seule feuille de
tokens ; les maquettes servent à lire la **structure** des écrans, pas à sourcer des valeurs
(principe II, niveaux 2 et 3).

**Note de chemin** : la source est `docs/design/html/tokens.md`. La forme
`docs/design/tokens.md` circule mais ne correspond à aucun fichier — la constitution a déjà
relevé et corrigé cette confusion lors de sa ratification.

**Écarté** : `tailwind.config.js` avec un thème JavaScript (seconde table de valeurs, et
inopérant pour des tokens qui changent selon le thème) ; utilitaires arbitraires
`bg-[var(--paper)]` partout (illisible, et prive des variantes) ; CSS natif sans Tailwind
(écarté par le porteur du projet).

---

## D3 — Faire appliquer la sobriété par l'outillage plutôt que par la discipline

Le principe I interdit **partout** rayon de bordure, ombre et dégradé. La porte de qualité 1
le vérifie sur le diff — une vérification humaine, donc faillible.

**Décision** : supprimer purement et simplement les familles d'utilitaires concernées, dans
`@theme` (vérifié — la syntaxe astérisque supprime tout un espace de noms) :

```css
@theme {
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
}
```

`rounded-lg`, `shadow-md`, `drop-shadow-xl` **n'existent alors plus** : les écrire produit
une classe inconnue, sans effet. La porte 1 devient en grande partie impossible à enfreindre
par inadvertance, plutôt que simplement surveillée.

**Réserve importante** : les **dégradés ne relèvent d'aucun espace de noms de thème**
(vérifié — l'inventaire des espaces de noms ne comporte rien de tel). `bg-linear-to-r`,
`from-*`, `via-*`, `to-*` restent donc disponibles et ne peuvent pas être désactivés par
cette voie. Ils sont couverts par un contrôle textuel en intégration continue :

```bash
grep -rnE 'bg-(linear|radial|conic)-|(from|via|to)-\[|gradient\(' app/
```

Le contrôle couvre aussi les dégradés écrits en CSS brut, que la suppression d'utilitaires
n'aurait de toute façon pas attrapés.

**Écarté** : compter sur la relecture seule (la constitution qualifie un écart non déclaré de
défaut au même titre qu'une régression — autant le rendre difficile à produire).

---

## D4 — Bascule de thème par classe

**Décision** (vérifié) :

```css
@custom-variant dark (&:where(.dark, .dark *));
```

**Justification** : la constitution fixe le mécanisme — « le mécanisme de bascule reste
`class="dark"` sur `<html>` ». Par défaut, la variante `dark:` de Tailwind suit
`prefers-color-scheme`, ce qui rendrait le choix utilisateur inopérant. Cette directive la
raccorde à la classe. Elle vaut pour les utilitaires `dark:` ; les tokens de D2 basculent
déjà par `html.dark` dans `tokens.css`, indépendamment de Tailwind.

---

## D5 — Aucun flash au premier rendu

C'est l'exigence la plus délicate (FR-015, porte 5). Toute résolution du thème après
l'hydratation produit un flash visible.

**Décision** : `@nuxtjs/color-mode` 4.0.1, en mode classe, avec le suffixe de classe vidé.

```ts
modules: ['@nuxtjs/color-mode'],
colorMode: {
  preference: 'system',            // défaut : suit le système
  fallback: 'light',               // si le système ne se prononce pas
  classSuffix: '',                 // <html class="dark">, et non "dark-mode"
  storageKey: 'francometre-theme'
}
```

**Pourquoi `classSuffix: ''` est indispensable** (vérifié) : le module suffixe les classes par
`-mode` **par défaut**, produisant `<html class="dark-mode">`. Or la constitution fixe le
mécanisme — « le mécanisme de bascule reste `class="dark"` sur `<html>` » — et c'est aussi ce
que cible `@custom-variant dark` (D4). Laisser le défaut casserait les deux d'un coup, en
silence : les couleurs ne basculeraient pas et rien n'indiquerait pourquoi.

Le reste des valeurs par défaut du module correspond déjà à la résolution exigée par la
spécification : `preference: 'system'` puis `fallback: 'light'`, soit exactement l'ordre
choix enregistré → préférence système → clair ([data-model.md](./data-model.md) §2).

Le module publie un script identifié `nuxt-color-mode-script` dans le `<head>`, ce qui est
sa réponse au flash. **Cette garantie reste à prouver par le test**, pas à croire sur parole :
c'est précisément l'objet du test d'absence de flash (voir D7). Un module qui annonce
résoudre le FOUC et un site qui ne clignote pas sont deux affirmations distinctes.

**Conséquence sur le vocabulaire** : le stockage porte les valeurs du module — `light`,
`dark`, `system` — et non `clair` / `sombre`. C'est un détail interne, invisible de
l'interface, et le principe de langue française porte sur l'interface et les contenus, pas
sur une clé de stockage. Les contrats sont alignés sur ce vocabulaire.

**Écarté** : le script maison de huit lignes, retenu dans une première version de ce
document. Il était défendable — entièrement sous contrôle, auditable d'un coup d'œil — mais
il fallait alors écrire et maintenir soi-même la résolution, la persistance, le suivi de la
préférence système et la synchronisation entre onglets. Le module couvre l'ensemble et est
éprouvé sur ce point précis.

---

## D6 — Couleur du repère de focus : une contrainte mesurée, pas choisie

Le principe VIII impose un repère de focus visible sur **tout** élément interactif. La
tentation naturelle est de le dessiner dans la couleur des filets (`--line`), par cohérence
visuelle. **Les mesures l'interdisent.**

Contrastes calculés sur la palette de `tokens.md` (méthode WCAG 2.1, seuil 4,5:1 pour le
texte courant, 3:1 pour le texte large et les repères non textuels) :

| Couple | Clair | Sombre | Verdict |
|---|---|---|---|
| `ink` sur `paper` | 19,80 | 18,05 | ✅ |
| `ink` sur `surface` | 18,16 | 16,73 | ✅ |
| `muted` sur `paper` | 5,02 | 6,99 | ✅ |
| `muted` sur `surface` | **4,61** | 6,48 | ✅ *(marge faible en clair)* |
| `accent` sur `paper` | 6,97 | 7,45 | ✅ |
| `accent` sur `surface` | 6,40 | 6,91 | ✅ |
| **`line` sur `paper`** | **1,25** | **1,30** | ❌ **très en dessous de 3:1** |
| `accent` sur `ink` | 2,84 | 2,42 | ❌ |

**Décisions qui en découlent :**

1. Le repère de focus est tracé en **`--ink`**, épaisseur 2 px, avec un décalage — jamais en
   `--line` (1,25:1), qui serait quasi invisible. Mesuré à 19,80 / 18,05 sur le fond de page.
2. Aucun texte en `--accent` sur un fond `--ink`, ni l'inverse (2,84 / 2,42).
3. `muted` sur `surface` passe en clair, mais à 4,61 pour un seuil de 4,50 : **aucun nouvel
   emploi** de cette combinaison au-delà de ce que les maquettes prévoient déjà, et surtout
   pas en dessous de la taille de texte courante.
4. La palette est par ailleurs saine : l'accent passe largement dans les **deux** thèmes,
   comme l'exige la double mesure du principe IV.

Le calcul est rejouable : `python3 specs/001-fondations-socle-ui/contrastes.py`.

---

## D7 — Vérification automatisée

**Décision** : Playwright, avec `@axe-core/playwright` (vérifié).

Correspondance entre critères d'acceptation et moyens de vérification :

| Critère | Moyen |
|---|---|
| Thème d'ouverture suivant le système (SC-004) | `test.use({ colorScheme: 'dark' })` puis lecture de la classe sur `<html>` |
| Absence de flash (FR-015, SC-004) | Chargement avec le thème contraire enregistré, et vérification que la classe est déjà posée au tout premier état du document — jamais ajoutée après |
| Persistance sur dix rechargements (SC-004) | Boucle de rechargements, lecture de la classe et du stockage |
| Aucun débordement de 375 à 1440 px (SC-002) | `document.documentElement.scrollWidth <= clientWidth` à chaque largeur, dans les deux thèmes |
| Parcours clavier, focus visible (SC-003) | Enchaînement de `Tab`, relevé de l'élément actif, capture du repère de focus |
| Menu refermable, focus restitué (SC-006) | `Escape` puis vérification que le focus est revenu au bouton d'ouverture |
| Contraste AA dans les deux thèmes (SC-005) | `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze()`, joué deux fois |
| Mouvement neutralisé (SC-010) | `page.emulateMedia({ reducedMotion: 'reduce' })` |

`AxeBuilder.analyze()` examine la page **dans son état courant** : le menu de petit écran est
donc ouvert avant d'être analysé, sans quoi son contenu échapperait au contrôle.

**Limite assumée** : axe-core ne mesure pas le contraste d'un texte posé sur une image, et ne
juge pas de la pertinence d'un texte alternatif. Le tableau de D6 et une relecture couvrent
ces angles morts. À noter également qu'axe-core ne détecte pas tout : un passage sans
violation n'est pas une preuve d'accessibilité, seulement l'absence d'erreurs connues.

---

## D8 — Point de rupture, et une lacune à remonter

**Décision** : 1000 px, déclaré comme point de rupture nommé :

```css
@theme { --breakpoint-socle: 1000px; }
```

La colonne latérale s'affiche à partir de 1000 px inclus (FR-020), la barre supérieure en
dessous (FR-019).

**Conséquence constitutionnelle** : le principe II qualifie de **lacune** toute valeur absente
de `tokens.md`, à remonter pour amendement plutôt qu'à figer en dur. Fondations introduit
quatre valeurs nouvelles, légitimement décidées ici mais absentes de `tokens.md` :

| Valeur | Origine |
|---|---|
| Point de rupture 1000 px | Décision de Fondations (FR-019, FR-020) |
| Repère de focus : 2 px `--ink`, avec décalage | Décision de Fondations (D6, FR-044) |
| Durée de transition de thème | Aucune — la bascule est instantanée, sans transition |
| Texte d'interface : 14 px | Relevé à l'implémentation — employé six fois dans les maquettes sans figurer dans l'échelle de `tokens.md` §2 |

Elles doivent être **ajoutées à `tokens.md`** avant la clôture de la feature. C'est une tâche
de la feature, pas une note d'intention.

---

## D9 — Composant Card unique

**Décision** : un seul composant. L'état « sans image » **n'est pas un paramètre** : il
découle de l'absence de la donnée `image`.

**Justification** : le principe I proscrit toute divergence entre deux emplois de la Card. Un
paramètre `sansImage` permettrait d'afficher une vignette sans image alors qu'une image
existe — deux rendus possibles pour une même donnée, donc une divergence possible. En la
faisant découler de la donnée, la porte 2 tient par construction. Les variantes futures
(« grand », « squelette ») s'ajouteront comme variantes déclarées du même composant, jamais
comme composants distincts.

---

## D10 — Filet coupé

**Décision** : reprise de la structure des maquettes — deux segments horizontaux et un
segment diagonal en SVG de 64 × 5 px —, la position de la brisure étant l'unique paramètre du
composant, exprimé en pourcentage et transmis par variable CSS.

**Justification** : la cote est imposée (4 px pour 64 px, soit 3,5°). Un tracé SVG unique
garantit l'angle exact quelle que soit la largeur, là où une bordure inclinée en CSS varierait
avec la largeur du conteneur. Le composant est `aria-hidden` (FR-036).

**Règle de frontière** (FR-037, tranchée en session de clarification) : filet coupé entre deux
blocs **dont chacun porte son propre en-tête** ; filet ordinaire partout ailleurs. Contrôle
mécanique, sans jugement.

---

## D11 — Polices, images, icônes

### Polices — `@nuxt/fonts` 0.14.0

**Décision** : Archivo et Instrument Sans auto-hébergées par le module, qui télécharge et
sert les fichiers depuis le projet.

**Justification** : les maquettes chargent les polices depuis un CDN. En production, cela
crée une dépendance à un tiers au premier rendu et transmet l'adresse IP des lecteurs à un
service externe — inutile pour un site éditorial français. Le module supprime les deux et
gère au passage le sous-ensemble de caractères et les déclarations `@font-face`, y compris
les métriques de repli qui limitent le décalage de mise en page au chargement.

**Écarté** : le CDN (dépendance externe, confidentialité) ; les `@font-face` écrites à la
main (fonctionnel, mais laisse à faire soi-même le sous-ensemble et les métriques de repli).

Graisses à embarquer, et elles seules — `tokens.md` §2 : Archivo 400 à 800, Instrument Sans
400 à 600.

### Images — `@nuxt/image` 2.0.0

**Décision** : module configuré dans cette feature, **exploité plus tard**. Fondations n'a
pas d'images réelles : la page de démonstration emploie des actifs locaux, et les vraies
images viendront de la couche Storage livrée par une feature ultérieure.

Le format 16:9 strict de la vignette et l'obligation de texte alternatif (FR-031) ne dépendent
pas du module et restent portés par le composant.

### Icônes — `@nuxt/icon` 2.3.1

**Décision** : le module sert les icônes **fonctionnelles** (loupe de recherche, bascule de
thème, fermeture du menu). Les **huit pictogrammes de rubrique restent les tracés des
maquettes**, servis comme collection locale du module.

**Justification** : c'est le point où la demande d'une bibliothèque d'icônes et la
constitution devaient être conciliées. Le principe I dit des huit pictogrammes qu'ils « font
partie du système » et que « les retirer est un défaut » — les remplacer par les icônes
approchantes d'une bibliothèque générique serait une modification de la charte, pas un choix
d'outillage. `@nuxt/icon` acceptant des collections locales, les tracés d'origine sont
conservés **et** servis par la bibliothèque, arborescence secouée comprise. Aucun compromis
n'est nécessaire.

---

## D12 — Page de démonstration : `/styleguide`

**Décision** : la route est `/styleguide`, et elle **reprend les sections de
`docs/design/html/guide-de-style.html`** — mêmes sections, mêmes états de composants.

**Périmètre — arbitrage rendu le 2026-07-18** : la maquette du guide comporte une section
« Boutons & champs ». Ces composants ne figuraient dans aucune exigence ; le porteur du
projet a tranché en faveur de leur **intégration au socle**. La spécification a été amendée
en conséquence (FR-050 à FR-056) et les tâches ne sont plus suspendues.

Justification retenue : `connexion.html` et l'ensemble du back-office en dépendront. Les
découvrir plus tard aurait imposé de reprendre des écrans déjà livrés, ou de tolérer deux
dessins de bouton concurrents — exactement la divergence que le principe I proscrit.

**Valeurs relevées** dans `guide-de-style.html:83-97` : bouton Archivo 600 / 14 px, quatre
variantes ; champ souligné d'un filet `--line` passant en `--ink` au focus. Les couleurs de
survol (`#2A2A2A` clair, `#E2E2E2` sombre) et le rouge d'erreur (`#C81E1E` / `#FF6B6B`) sont
déjà documentés dans `tokens.md` §1 comme couleurs de service — rien n'est inventé.

**Un point où la maquette n'est pas suivie** : elle pose `outline:none` sur les champs sans
repère de remplacement. C'est le premier des six défauts relevés par le principe VIII, et le
seul domaine où la constitution prime sur les maquettes. Boutons et champs portent donc le
repère de focus du site **en plus** du traitement dessiné.

Les autres sections du guide (mot-symbole, palette, familles typographiques, filet coupé,
card, espacements, interdits absolus) relèvent toutes de Fondations sans discussion.

**Correspondance des sections, pas de l'enveloppe** : la maquette du guide est une planche
autonome, sans colonne de navigation. `/styleguide` est en revanche rendue dans le cadre et
la colonne, comme l'exige FR-048. La correspondance porte sur les sections et les états de
composants.

## D13 — Décisions mineures

- **Images de démonstration** : actifs locaux, aucun appel à un service d'images de
  remplacement en ligne — les maquettes en dépendent, pas le code. Les vraies images
  viendront de la couche Storage, livrée par une feature ultérieure.
- **Textes alternatifs sur `/styleguide`** : un aplat purement décoratif illustrant un
  rapport de forme n'est pas une image de couverture et n'appelle pas de texte alternatif.
  L'obligation de FR-031 porte sur les images de couverture d'article, et elle reste entière.
- **Actifs de marque** : les maquettes référencent `../assets/wordmark-*.png`, chemin qui
  n'existe pas dans le dépôt. Les fichiers réels sont sous `public/brand/`. Les chemins sont
  adaptés, jamais recopiés. Si un actif venait à manquer au moment de l'implémentation, on
  pose un emplacement réservé aux bonnes dimensions et on le signale — on n'invente pas de
  logo.
- **Internationalisation** : aucune. Le français est la seule langue ; `lang="fr"` sur
  `<html>`.
- **Accent en Fondations** : un seul emploi, le soulignement de la rubrique active
  (`tokens.md` §1, usage 2). Fondations **n'introduit aucun nouvel emploi de l'accent** — la
  clause de consultation du principe III n'a donc pas à jouer. Le repère de focus étant en
  `--ink` (D6), il ne pose pas la question.

---

## Inconnues restantes

Aucune. Les trois marqueurs de la spécification ont été tranchés en session de clarification
du 2026-07-18 ; les points techniques ci-dessus sont résolus et vérifiés.

**Vérifié le 2026-07-18 sur la documentation officielle :**

- <https://tailwindcss.com/docs/theme> — `@theme`, `@theme inline`, espaces de noms,
  suppression par `initial`, absence d'espace de noms pour les dégradés
- <https://tailwindcss.com/docs/dark-mode> — `@custom-variant`, script inline anti-FOUC
- <https://tailwindcss.com/docs/installation/framework-guides/nuxt> — installation par
  `@tailwindcss/vite`, sans le module `@nuxtjs/tailwindcss`
- <https://playwright.dev/docs/accessibility-testing> — `@axe-core/playwright`, `withTags`,
  `include`, analyse de l'état courant
- <https://nitro.build/deploy/runtimes/deno> — preset `deno_server`. **Source consultée pour
  la décision initiale, devenue sans objet** : le runtime Deno est abandonné (amendement en
  tête de D1). Conservée parce que l'amendement en relève deux inexactitudes
- <https://color-mode.nuxtjs.org/usage/basic> et <https://nuxt.com/modules/color-mode> —
  options du module, `classSuffix` valant `-mode` par défaut, `preference: 'system'`,
  `fallback: 'light'`, `storageKey`
- Versions relevées par `npm view <paquet> version` le 2026-07-18
