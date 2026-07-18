# Francomètre

**L'actualité, mesurée.** Site éditorial français, publié en deux thèmes.

Ce dépôt contient le **socle** du site : la charpente, la colonne de navigation, le pied de
page, la vignette d'article unique, le filet de séparation signature et la bascule de thème.
Aucune page de contenu n'est encore livrée.

---

## Mise en route

**Prérequis** : Node.js **22.12+ ou 24.11+** et npm — la plage exigée par Nuxt 4.4.8, déclarée
dans `package.json` pour que `npm install` la fasse respecter. Node 20 ne convient pas.
`python3` est également requis, pour le seul contrôle de contrastes.

```bash
npm install
npx playwright install chromium
npm run dev
```

La seule page livrée est la planche de style : <http://localhost:3000/styleguide>.
Toute autre adresse renvoie une 404 — c'est le comportement attendu à ce stade.

### En production

Le serveur est produit par **Nitro**, le moteur serveur de Nuxt, sur sa cible par défaut :
**Node.js**. Aucun runtime supplémentaire à installer.

```bash
npm run build
node .output/server/index.mjs        # PORT=3100 pour changer de port
```

Nitro sait produire d'autres cibles (Deno, Bun, Cloudflare, Vercel…) en posant
`nitro.preset` dans `nuxt.config.ts`. **Attention** : une compilation est faite *pour* une
cible et n'est pas portable après coup — une sortie `deno_server` ne démarre pas sous Node,
les conditions de résolution des modules n'étant pas les mêmes.

### Tester la compilation, et pas seulement le développement

```bash
npm run build
FRANCOMETRE_BUILD=1 npm run test:e2e
```

Playwright démarre et arrête lui-même le serveur compilé. Pour viser un serveur déjà lancé
ailleurs : `FRANCOMETRE_URL=http://… npm run test:e2e`.

---

## Commandes

| Commande | Rôle |
|---|---|
| `npm run dev` | Développement |
| `npm run build` | Compilation |
| `npm run preview` | Prévisualisation de la compilation |
| `npm run typecheck` | Contrôle des types |
| `npm run verifier` | **Contrôles de sobriété** — dégradés, valeurs en dur, retour à Tailwind v3 |
| `npm run test:e2e` | Tests de bout en bout (Playwright + axe-core), cinq largeurs |

---

## Deux règles qui gouvernent tout le code

**1. Un seul fichier porte des valeurs.** `app/assets/css/tokens.css` est la transcription
de `docs/design/html/tokens.md`, qui fait seul foi. Un code couleur ou une cote écrits
ailleurs sont un défaut, pas un raccourci — `npm run verifier` les rejette. Une valeur
absente de `tokens.md` est une **lacune** : elle se remonte pour amendement du fichier,
elle ne se fige jamais en dur dans un composant.

**2. La sobriété est appliquée par l'outillage.** Les familles d'utilitaires `rounded-*`,
`shadow-*`, `inset-shadow-*` et `drop-shadow-*` sont **supprimées** du projet : les écrire
n'a aucun effet. Les dégradés, qui ne relèvent d'aucun espace de noms et ne peuvent donc
pas être supprimés, sont rejetés par `npm run verifier`.

### Deux absences volontaires

- **Pas de `tailwind.config.js`.** Tailwind v4 se configure entièrement en CSS. Ce fichier
  serait un retour à la v3 et n'aurait aucun effet.
- **Pas de `@nuxtjs/tailwindcss`.** Ce n'est pas la voie officielle pour la v4 ; le plugin
  Vite `@tailwindcss/vite` l'est.

---

## Sources de vérité

L'ordre compte : en cas de conflit, le niveau supérieur tranche.

| # | Fichier | Fait foi pour |
|---|---|---|
| 1 | [`.specify/memory/constitution.md`](.specify/memory/constitution.md) | Les principes — et, sur l'**accessibilité** seule, contre les maquettes |
| 2 | [`docs/design/html/tokens.md`](docs/design/html/tokens.md) | Toute **valeur** : couleur, taille, graisse, espacement, angle |
| 3 | [`docs/design/html/*.html`](docs/design/html/) | La **structure** de chaque écran et les **emplacements de l'accent** |
| 4 | — | Rien d'autre. Aucune valeur, aucun composant, aucun écart ne s'invente |

`docs/design/lecture-maquettes.md` est un **constat** des écarts, jamais une norme : il ne
peut pas être invoqué comme source de vérité.

**Les maquettes sont en défaut sur l'accessibilité** — elles posent `outline:none` neuf fois
sans remplacement, ne contiennent aucun `prefers-color-scheme` et laissent 60 vignettes avec
`alt=""`. C'est le seul terrain où la constitution prime sur elles, et elle y prime toujours.

---

## Structure

```text
app/
├── assets/css/tokens.css     # LES VALEURS — seul fichier du dépôt à en porter
├── assets/css/main.css       # Raccordement à Tailwind — aucune valeur recopiée
├── assets/icones/rubriques/  # Les huit pictogrammes, tracés des maquettes
├── components/layout/        # La charpente, qu'une page ne redéclare jamais
├── components/ui/            # Les composants qu'elle emploie
├── layouts/default.vue       # Cadre, colonne, barre, contenu, pied de page
├── pages/styleguide.vue      # La planche de style
└── utils/rubriques.ts        # Les huit rubriques — définition unique du projet

tests/e2e/                    # Thème, navigation, largeurs, vignette, filet, pied, a11y
specs/001-fondations-socle-ui/# Spécification, plan, contrats, tâches
```

La spécification du socle, ses contrats de composants et sa grille de vérification manuelle
sont dans [`specs/001-fondations-socle-ui/`](specs/001-fondations-socle-ui/) — voir en
particulier [`quickstart.md`](specs/001-fondations-socle-ui/quickstart.md).
