# Francomètre

Site éditorial minimaliste. Huit rubriques figées, une Une éditorialisée de 5 articles.
Interface et contenus en français. Domaine : `francometre.com`.

Ce fichier est chargé à chaque session. Il contient ce qui n'est pas déductible du code.
Les principes du projet sont dans `.specify/memory/constitution.md` ; les spécifications
dans `specs/`.

---

## Commandes

```bash
npm run dev              # serveur de développement
npm run build            # build de production (Nitro, preset node-server)
npm run preview          # servir le build

npx prisma migrate dev   # migration + régénération du client
npm run db:seed          # 8 rubriques + médias et articles d'exemple (rejouable)
npx prisma studio        # inspection de la base

npm run test:unit        # Vitest — les règles de gestion, base SQLite éphémère
npm run test:e2e         # Playwright — le socle visuel de Fondations
npm run verifier         # six contrôles : sobriété (3) et portabilité (3)
npm run typecheck
```

Il n'y a pas de `npm run lint` : le dépôt n'a pas d'ESLint. `verifier` et `typecheck`
tiennent ce rôle.

---

## Stack

| Couche | Choix | Contrainte |
|---|---|---|
| Framework | **Nuxt 4**, SSR | Serveur = Nitro, **preset par défaut (node-server)**. Ne configure aucun preset alternatif : ni `deno_server`, ni `bun`, ni edge. |
| Runtime | **Node.js LTS** | |
| Style | **Tailwind v4** via `@tailwindcss/vite` | Voir pièges ci-dessous. |
| Thème | `@nuxtjs/color-mode`, `classSuffix: ''` | Donne `<html class="dark">`. |
| ORM | **Prisma 7** + SQLite | Voir pièges. Driver adapter obligatoire. |
| Éditeur | **TipTap 3** (`@tiptap/vue-3`) | MIT. Aucune extension Pro. |
| Auth | `nuxt-auth-utils` | Cookie de session signé. |
| Divers | Zod, sharp, `sanitize-html`, `@nuxt/fonts`, `@nuxt/image` | |

Les **majeures** ci-dessus sont fermes : elles changent l'API, pas juste le numéro.
Pour les versions exactes, vérifie (`npm view <pkg> version`) plutôt que de te fier à ta
mémoire d'entraînement.

---

## Sources de design

| Fichier | Autorité |
|---|---|
| `docs/design/tokens.md` | **Fait foi** pour toute valeur : couleur, taille, graisse, interligne, espacement, angle. |
| `docs/design/html/*.html` | Montrent la **structure** de chaque écran : sections, ordre, composants. |
| `docs/design/LECTURE-MAQUETTES.md` | Audit des sources : écarts connus, ambiguïtés, ce qui manque. |

Les neuf `.html` sont autonomes et redéfinissent chacun leurs variables CSS en tête.
**Ne recopie pas ces blocs** : le projet a **une seule** feuille de tokens, dérivée de
`tokens.md`.

La section « Écarts constatés » de `tokens.md` n'est pas une liste de bugs : c'est
l'inventaire de ce qui dévie du système idéal **et qui est conservé volontairement**.
Respecte-la, ne l'uniformise pas.

---

## Pièges — à lire avant d'écrire du code

### Prisma 7 (rupture forte avec les versions antérieures)

- Générateur : `provider = "prisma-client"` (**pas** `prisma-client-js`), avec un `output`
  explicite, obligatoire.
- **Un driver adapter est obligatoire.** `new PrismaClient()` sans adapter échoue.
- Client ESM → `"type": "module"` dans `package.json`.
- Configuration dans `prisma.config.ts`. Les variables d'environnement ne sont **plus**
  chargées implicitement : importer `dotenv/config`.
- `$use()` (middleware) est supprimé.
- **`url` n'a plus sa place dans le bloc `datasource`** du schéma : la propriété y est
  refusée (erreur P1012). L'URL vit dans `prisma.config.ts` pour Migrate, et arrive au
  client par l'adaptateur.
- Par défaut le client généré s'importe lui-même en `.js` alors qu'il émet du `.ts`. Vite
  s'en accommode, `node --experimental-strip-types` non — d'où
  `importFileExtension = "ts"` sur le générateur. Le seed en dépend.
- `prisma migrate reset` est **refusé par un agent** sans consentement explicite de
  l'utilisateur (garde-fou de Prisma 7). Le demander, ne pas le contourner.
- **Ni `migrate dev` ni `migrate reset` ne jouent le seed** en 7.8 — `reset` n'a même plus
  d'option `--skip-seed`. Le seed déclaré dans `migrations.seed` se lance explicitement :
  `npm run db:seed`. Après un `reset`, la base est **vide**.

### Nitro — traçage du binaire natif

`nitro.externals.traceInclude` attend des **chemins de fichiers**, pas des noms de
paquets : `traceInclude: ['better-sqlite3']` échoue à la compilation sur
« File …/better-sqlite3 does not exist ». Résoudre le chemin
(`createRequire(import.meta.url).resolve('better-sqlite3')`).

### TypeScript — extensions `.ts` explicites

`shared/utils/eyebrow.ts` importe avec son extension réelle, parce qu'il est aussi chargé
par `node --experimental-strip-types`. Il faut donc `allowImportingTsExtensions` sur les
**trois** contextes que Nuxt 4 génère : `typescript.tsConfig` (application),
`typescript.sharedTsConfig` (`shared/`) et `nitro.typescript.tsConfig` (serveur). Le
premier seul ne suffit pas.

### Tailwind v4

- **Il n'y a pas de `tailwind.config.js`.** Toute la configuration est en CSS. N'en crée pas.
- Dark mode : `@custom-variant dark (&:where(.dark, .dark *));`
- Les tokens de couleur doivent passer par `@theme inline` — sans `inline`, la
  redéfinition sous `.dark` ne prend pas.
- Conséquence : `bg-paper text-ink border-line` basculent seuls. **N'écris pas de classes
  `dark:` sur les couleurs.** Réserve `dark:` aux rares cas non couverts par un token
  (`dark:prose-invert`, opacité d'image).

### Modèle éditorial : rubrique et sous-thème

Un article a **une** rubrique (parmi les 8) et **un sous-thème facultatif**, texte libre.
L'eyebrow d'une vignette est **contextuel** :

- le lecteur est **déjà dans la rubrique** (page rubrique, « à lire aussi » de même
  rubrique) → afficher le **sous-thème** ;
- **partout ailleurs** (accueil, listes toutes rubriques) → afficher la **rubrique** ;
- pas de sous-thème → afficher la rubrique.

**Le titre est stocké une seule fois, sans préfixe.** Les maquettes montrent parfois
« *Biodiversité :* le retour du lynx » : c'est de la composition d'affichage, pas du
contenu. Ne la mets jamais en base.

### Le back-office n'utilise pas le composant Card

Il emploie trois dérivés distincts, en **dimensions fixes** (pas de `aspect-ratio`), non
documentés dans `tokens.md` :

| Dérivé | Écran | Dimensions |
|---|---|---|
| Emplacement de la Une | Composer la Une | vignette 213×120 (héros 320×180), titre 18px (héros 22), 2 lignes |
| Ligne d'article publié | Composer la Une | vignette 64×36, titre 14px, eyebrow **10px** |
| Vignette de table | Articles | 64×36 en `background-image` |

Reproduis-les tels quels. **Ne les ramène pas à la Card**, et ne modifie pas la Card
publique pour les y faire entrer.

### Actifs de marque

Les maquettes pointent vers `../assets/wordmark-*.png`, **qui n'existe pas**.
Les actifs réels sont dans `public/brand/`. Adapte les chemins.
Si un actif manque, signale-le et pose un emplacement réservé aux bonnes dimensions —
n'invente pas de logo.

---

## Règles non négociables

**Portabilité** (l'objectif est de migrer SQLite → PostgreSQL et disque → S3 sans toucher
au code métier) :

- La base ne stocke **jamais d'URL de média**, uniquement des **clés de stockage**.
- Aucun accès au disque ou au stockage hors de l'interface `Storage` unique
  (`put` / `get` / `delete` / `url`), sélectionnée par variable d'environnement.
- Le schéma évite tout ce qui n'existe pas à la fois en SQLite et en PostgreSQL : pas
  d'`enum` porté par la base, pas de `Json`, pas de liste scalaire, pas d'`autoincrement`.
  Identifiants en `cuid()`. Statuts et rôles = `String` + validation Zod.

**Sécurité :**

- Le HTML produit par l'éditeur est **assaini côté serveur** avant stockage, sur liste
  blanche stricte. Jamais de confiance au HTML venu du client.
- Les routes `/admin` et les routes serveur d'administration sont **refusées par défaut**.
- Mots de passe hachés (argon2). Aucun secret en clair, nulle part.

**Sobriété visuelle :**

- Rayon de bordure `0` partout. Aucune ombre. Aucun dégradé.
- Un seul composant Card côté public.
- La navigation est une **colonne latérale gauche** (248px public / 240px back-office),
  jamais un en-tête horizontal.
- La signature « coupe » à 3,5° (4px de dénivelé pour 64px) n'apparaît qu'à **deux**
  endroits : le mot-symbole et le filet de séparation de sections. Une troisième
  occurrence est un défaut.
- L'accent apparaît **là où les fichiers de `docs/design/html/` le placent, et nulle part
  ailleurs**. N'en ajoute aucun usage de ta propre initiative ; n'en retire aucun au motif
  qu'il contredirait `tokens.md`. En cas de doute sur un écran sans équivalent dans les
  maquettes, demande.

---

## Accessibilité : les maquettes ont tort, la constitution prime

C'est le **seul** domaine où il ne faut pas copier les maquettes.

| Défaut des maquettes | Ce qu'il faut faire |
|---|---|
| `outline: none` posé 9 fois sans remplacement | Repère de focus visible sur **tout** élément interactif |
| Pas de `prefers-color-scheme` | Le site s'ouvre dans le thème de l'OS, puis respecte le choix persisté, sans flash |
| Squelette animé en boucle sans garde-fou | Toute animation se désactive sous `prefers-reduced-motion` |
| Mot-symbole sans lien | Il ramène à l'accueil |
| `aria-current="page"` sur une rubrique depuis l'accueil | L'état courant désigne la page réellement affichée |
| `alt=""` sur les vignettes | Texte alternatif réel sur toute couverture d'article ; obligatoire à la publication |

Cible : Lighthouse ≥ 90 (perf / SEO / a11y), contrastes AA vérifiés **dans les deux
thèmes** — l'accent n'a pas la même valeur en clair et en sombre, il se contrôle deux fois.

---

## Workflow

Le projet est construit avec **Spec Kit**, feature par feature, dans l'ordre :

```
000-fondations → 001-modele-et-donnees → 002-pages-publiques
→ 003-authentification → 004-back-office → 005-seo-perf-a11y
```

Cycle par feature :
`/speckit.specify` → `/speckit.clarify` → `/speckit.plan` → `/speckit.analyze` →
`/speckit.tasks` → `/speckit.implement`

- **`specify` dit le QUOI, `plan` dit le COMMENT.** Aucune techno dans un `specify`.
- Une feature à la fois. On ne démarre pas la suivante avant que la PR précédente soit
  fusionnée.
- Ne saute ni `clarify` ni `analyze` : ils coûtent moins cher que la reprise.

---

## Conventions

- Interface, contenus, commentaires et messages de commit **en français**.
- Composants Vue en PascalCase, un composant par fichier.
- Validation Zod sur **toutes** les entrées des routes serveur.
- Les requêtes de données passent par des routes serveur Nitro, jamais d'accès Prisma
  depuis un composant client.
- Le filtre « publié et date de publication atteinte » est défini **une seule fois**,
  réutilisable, appliqué côté serveur.

---

## Points ouverts

- Le champ **sous-thème** n'apparaît dans aucune maquette de back-office : à ajouter au
  panneau latéral de l'éditeur, sous le sélecteur de rubrique, sans référence visuelle.
- **Le mobile est spécifié mais pas dessiné.** `tokens.md` donne les valeurs (390px,
  gouttière 20px, titres réduits) ; aucun `.html` ne contient de media query. Sous ~1000px :
  le rail disparaît au profit d'une barre minimale (marque + menu + bascule de thème), le
  menu ouvre la même liste de rubriques en panneau, fermable au clavier.
- **Écrans non maquettés** : Médias (pointé par la navigation admin), résultats de
  recherche, mot de passe oublié, confirmation de suppression, rubrique vide, 403.
- **Divergences à arbitrer** : couleur du chapô (`--ink` sur l'accueil, `--muted` sur
  l'article), frontière filet ordinaire / filet coupé sur `rubrique.html`.
