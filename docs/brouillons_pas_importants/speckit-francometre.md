# Francomètre — Prompts Spec Kit / Claude Code

Vérifié le 14/07/2026 contre Spec Kit **v0.12.16** (dernière release, 15/07/2026).

---

## Avant de lire les prompts : trois choses qui changent tout

**1. Spec Kit ne fabrique pas un projet, il fabrique une *feature* à la fois.**
Chaque `/speckit.specify` crée une branche numérotée (`001-…`, `002-…`) et un dossier `specs/00X-…/`. Un « site complet » en une seule spec produit un `tasks.md` de 150 lignes que l'agent exécute en pilote automatique, sans point de contrôle : c'est exactement le mode d'échec de l'outil. On découpe donc Francomètre en **6 features** livrées dans l'ordre. Chacune passe par le cycle complet et se termine par une PR que tu relis.

**2. Le cycle réel, par feature, a plus d'étapes que « specify → plan → tasks → implement ».**
La séquence saine est : `specify` → **`clarify`** → `plan` → **`analyze`** → `tasks` → `implement`. Les deux étapes en gras sont optionnelles dans l'outil mais pas dans les faits — `clarify` force l'agent à poser ses questions *avant* d'écrire du code sur de mauvaises hypothèses, `analyze` vérifie la cohérence spec/plan/tasks *avant* que l'implémentation ne parte de travers. Les sauter, c'est payer le double en corrections.

**3. La règle d'or : `specify` dit le QUOI, `plan` dit le COMMENT.**
Ne mets aucune techno dans un `specify` — pas de « Nuxt », pas de « Prisma ». La stack arrive au `plan`. Si tu mélanges, l'agent fige des choix techniques avant d'avoir compris le besoin, et la spec devient illisible pour l'humain qui doit la valider. Les prompts ci-dessous respectent scrupuleusement cette frontière ; garde-la quand tu improvises.

**4. La maquette est lisible — sers-t'en.** L'export initial de Claude Design était un bundle React compilé, illisible par un agent. Tu l'as remplacé par du HTML statique écrit à la main plus un `tokens.md`. Conséquence directe : Claude Code peut désormais **lire la structure réelle de chaque écran**, et il ne reste plus rien à « extraire ». Les deux artefacts n'ont pas le même statut :

- `docs/design/tokens.md` — **fait foi.** Couleurs, typo, géométrie, coupe, spec de la Card. En cas de divergence avec un HTML, c'est lui qui gagne.
- `docs/design/html/*.html` — **montrent la structure** de chaque écran : sections, ordre, composants réutilisés. À citer par leur chemin dans les prompts, pour que l'agent aille les lire.

Les neuf fichiers sont nommés sans espace ni accent (`accueil.html`, `rubrique.html`, `article.html`, `connexion.html`, `etats.html`, `guide-de-style.html`, `back-office-articles.html`, `back-office-editeur.html`, `back-office-composer-la-une.html`) — c'est sous cette forme que les prompts les citent.

### ⚠️ Ce que la reconnaissance a établi

Un audit complet des neuf fichiers a été mené (voir `docs/design/LECTURE-MAQUETTES.md`).
Trois arbitrages en sortent, plus un blocage matériel.

**1. Le double niveau rubrique / sous-thème est un système, pas une erreur.**
17 vignettes portent un eyebrow qui n'est pas l'une des huit rubriques (Forêts, Énergie,
Biodiversité, Eau, Climat, Littoral, Territoires, Montagne, Mobilité, Déchets, Faune).
Le fait décisif : **les mêmes articles** portent l'eyebrow « Environnement » sur l'accueil,
avec le sous-thème déplacé dans le titre (« *Biodiversité :* le retour discret du lynx »),
et l'eyebrow « Biodiversité » sur la page rubrique, titre nu. La règle sous-jacente est
contextuelle : *hors* de la rubrique on affiche la rubrique, *dans* la rubrique on affiche
le sous-thème. C'est cohérent éditorialement et ça se tient sur 3 exemples sur 3.
→ **Le modèle gagne un champ « sous-thème », facultatif, texte libre.** Voir la feature 1.

**2. L'accent ne peut plus être défini par énumération.** `tokens.md` en autorise 3 usages,
en recense 5 dérogations au §6, et l'audit en a trouvé **7 autres non recensées** (filet de
citation, `::selection`, focus de champ, nav admin active, segmentés, case à cocher, survol
de bouton). Une liste sera toujours incomplète. → **La règle change de forme** : voir la
constitution ci-dessous.

**3. La maquette est en défaut sur l'accessibilité, et la constitution doit primer.**
`outline:none` est posé neuf fois ; seuls deux champs redéfinissent un repère de focus.
Aucun `prefers-color-scheme` (le thème ne suit pas l'OS), aucun `prefers-reduced-motion`
(alors que le squelette pulse en boucle). Le mot-symbole n'est enveloppé dans aucun lien :
aucun retour à l'accueil depuis le rail. Et `aria-current="page"` marque « Environnement »
sur la page d'accueil. → **Ce sont les seuls points où l'agent ne doit PAS copier la
maquette.** Clause ajoutée à la constitution.

**4. Blocage matériel : `../assets/` n'existe pas.** Les quatre `wordmark-*.png` sont
référencés 26 fois et manquent tous. Le mot-symbole est le support de la signature à 3,5° :
sans lui, la feature 0 ne peut pas rendre le rail. À produire avant `/speckit.implement`
de la feature 0 (le SVG serait mieux, le PNG détouré suffit pour démarrer).

**Arbitrages mineurs, tranchés par le nombre :**

| Sujet | Décision |
|---|---|
| Survol du bouton primaire | `--primary-hover` (#2A2A2A / #E2E2E2). 3 fichiers dont **la planche de style**, contre 2 en accent. Corriger `connexion` et `back-office-articles`. |
| Nav admin active | Garde le fond `--surface` + bordure 3px, malgré le « jamais un fond » de `tokens.md` : 3 fichiers sur 3 le font. |
| Rail 248 / 240 px | Écart assumé par `tokens.md` §6. On le garde. |
| Couleur du chapô | `--muted` (article + éditeur) contre `--ink` (accueil). À trancher au `clarify` de la feature 2. |

**Reste à ta main :** le champ « sous-thème » n'existe dans aucun écran de back-office — ni
la table, ni l'éditeur ne permettent de le saisir. Il faudra l'ajouter au panneau latéral de
l'éditeur (feature 4), sans maquette de référence.

---

## Découpage en features

| # | Branche | Ce qu'elle livre | Dépend de |
|---|---|---|---|
| 0 | `000-fondations` | Repo, Nuxt 4 / Nitro (Node), Tailwind v4 + thème, tokens, layout (rail latéral + footer), Card | — |
| 1 | `001-modele-et-donnees` | Prisma 7 + SQLite via adapter, schéma, seed des 8 rubriques, couche `Storage` | 0 |
| 2 | `002-pages-publiques` | Home (Une + derniers + blocs), rubrique paginée, article, 404/500, RSS, sitemap | 0, 1 |
| 3 | `003-authentification` | Login admin, session cookie, protection des routes `/admin` | 1 |
| 4 | `004-back-office` | CRUD article, éditeur TipTap + assainissement, upload image, composition de la Une | 1, 3 |
| 5 | `005-seo-perf-a11y` | JSON-LD, OG, métadonnées, cache SWR, audit Lighthouse, recette a11y bi-thème | 2, 4 |

Livre-les dans l'ordre. On ne lance pas la feature *n+1* avant que la PR de la feature *n* soit fusionnée : sinon les branches numérotées divergent et l'agent perd le fil.

---

## Phase 0 — Bootstrap (hors Spec Kit, une seule fois)

À faire dans un terminal, **avant** d'ouvrir Claude Code.

```bash
# 1. Le dépôt
mkdir francometre && cd francometre
git init

# 2. Ta maquette et tes actifs, aux emplacements attendus
mkdir -p docs/design/html public/brand
#  → tokens.md          → docs/design/tokens.md      (la référence qui fait foi)
#  → les 9 .html écrits à la main → docs/design/html/
#    (PAS les exports React compilés : ils sont illisibles par l'agent)
#  → francometre-noir-detoure.png, -blanc-detoure.png,
#    favicon-512.png, og-image-1200x630.png → public/brand/
#  → dès que tu l'as, dépose le LOGO SVG dans public/brand/ (voir note en fin de doc)

# 3. Spec Kit, épinglé à une version (ne prends pas 'latest' à l'aveugle)
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git@v0.12.16
specify init . --integration claude
#  → crée .specify/, .claude/commands/, les templates

# 4. Vérifie l'install : lance 'claude' puis tape '/' — tu dois voir
#    /speckit.constitution, /speckit.specify, /speckit.plan, /speckit.tasks,
#    /speckit.clarify, /speckit.analyze, /speckit.implement
```

> Si `specify init` te dit que l'outil `claude` est introuvable et que tu veux juste les templates, ajoute `--ignore-agent-tools`.

---

## §0 — Reconnaissance de la maquette (à faire dire à Claude Code en premier)

Il n'y a plus rien à extraire : `tokens.md` est déjà la référence. Cette étape sert à
autre chose — vérifier que l'agent a bien lu, et le forcer à annoncer les pièges *avant*
d'écrire du code. Prompt normal (pas une commande Spec Kit) :

```
Lis docs/design/tokens.md, puis parcours les fichiers de docs/design/html/.
N'écris aucun code applicatif à ce stade : je veux d'abord vérifier que tu as compris.

Ces deux sources n'ont pas le même statut :
- tokens.md FAIT FOI pour toute valeur (couleur, taille, espacement, angle). En cas de
  divergence avec un fichier HTML, c'est tokens.md qui gagne.
- les .html montrent la STRUCTURE de chaque écran : sections, ordre, composants réutilisés.

Attention : chaque .html est autonome et redéfinit ses variables CSS en tête. Ce n'est
pas une invitation à recopier les valeurs écran par écran — le projet aura UNE seule
feuille de tokens, dérivée de tokens.md.

Réponds-moi par écrit, en français, sur ces cinq points :
1. Les six rôles de couleur et leurs deux valeurs (clair / sombre). Signale tout rôle
   dont la valeur diffère entre tokens.md et un fichier HTML.
2. Les trois seuls usages autorisés de la couleur d'accent.
3. L'angle exact de la signature « coupe », sa cote en pixels, et les deux seuls
   endroits où elle apparaît.
4. La spec du composant Card, et la liste des écrans où tu le vois réutilisé.
5. La structure de navigation : où se trouve-t-elle sur la page, que contient-elle,
   dans quel ordre.
6. Ce que les maquettes NE couvrent PAS : cherche activement les media queries, les
   scripts, les comportements interactifs. Dis-moi ce qui est dessiné mais non
   fonctionnel, et ce qui manque totalement.
7. Toute incohérence, valeur manquante ou ambiguïté que tu as relevée entre les
   fichiers — ne la corrige pas de toi-même, remonte-la moi.

Cinq choses que je sais déjà et que tu dois CONFIRMER, pas découvrir. Si ton analyse
en contredit une, dis-le moi : c'est que l'une des deux lectures est fausse.
- la navigation est une COLONNE LATÉRALE GAUCHE, 248px côté public et 240px côté
  back-office, et non un en-tête horizontal ;
- il n'y a AUCUNE media query dans les neuf fichiers, alors que tokens.md documente des
  valeurs mobiles : le petit écran est spécifié mais pas dessiné ;
- l'interrupteur de thème est un dessin sans comportement, il n'y a aucun JavaScript ;
- le survol du bouton primaire n'est pas identique partout (accent dans deux fichiers,
  gris foncé dans un troisième) ;
- certaines vignettes affichent en eyebrow un libellé qui n'est pas l'une des huit
  rubriques (Biodiversité, Énergie, Climat, Déchets, Faune, Mobilité, Eau).
  Ne tranche pas cette question toi-même : recense les occurrences et rends-les moi.
```

Sa réponse est un test : s'il te sort un accent différent de celui de `tokens.md`, ou
s'il ne repère pas la Card comme composant unique, c'est que la lecture a échoué —
reprends-le maintenant, pas après trois features.

---

## Feature 0 — Fondations · `000-fondations`

### `/speckit.constitution`
La constitution vaut pour **tout** le projet ; on ne la réécrit pas à chaque feature. C'est ici qu'on grave les règles non négociables du cadrage.

```
/speckit.constitution Établis les principes directeurs de Francomètre, un site
éditorial. Ils s'appliquent à toutes les features suivantes.

Qualité et cohérence
- La sobriété prime : aucun rayon de bordure, aucune ombre, aucun dégradé, nulle part.
- Un seul composant Card, réutilisé partout. Toute divergence visuelle est un défaut.
- La navigation principale est une colonne latérale gauche, pas une barre horizontale.
- Les huit rubriques portent chacune un pictogramme au trait, monochrome, hérité de la
  couleur du texte : ils font partie du système, ce ne sont pas des ornements à retirer.
  Aucune autre icône décorative ailleurs.
- La couleur d'accent est rationnée, mais sa règle ne s'énonce pas par liste : les
  maquettes en comptent plus d'une douzaine d'usages, et toute énumération sera
  incomplète. La règle est donc : L'ACCENT APPARAÎT LÀ OÙ LES FICHIERS DE
  docs/design/html/ LE PLACENT, ET NULLE PART AILLEURS. N'en ajoute aucun usage de ta
  propre initiative ; n'en retire aucun au motif qu'il contredirait tokens.md. Si un
  écran que tu construis n'a pas d'équivalent dans les maquettes et que tu penses y
  avoir besoin de l'accent, demande-le-moi.
- L'accent n'est jamais un fond de bloc ni un fond de bouton. Seule exception constatée
  et conservée : l'entrée active de la navigation du back-office, qui combine une
  bordure gauche à l'accent et un fond --surface.
- Le rouge d'erreur est hors palette et assumé comme tel ; il est réservé aux messages
  et filets d'erreur de formulaire.
- La signature « coupe à 3,5° » n'apparaît qu'à deux endroits : le logo et le filet
  de séparation. Une troisième occurrence est un défaut.
- docs/design/tokens.md fait foi pour toute décision visuelle ; les fichiers de
  docs/design/html/ montrent la structure attendue de chaque écran.

Thème
- Thème clair et sombre obligatoires sur chaque écran, public comme admin.
- Le thème suit l'OS par défaut, se surcharge par un choix persistant, sans flash au
  premier rendu.
- Tout contraste doit passer AA dans LES DEUX thèmes ; l'accent n'ayant pas la même
  valeur d'un thème à l'autre, il se vérifie deux fois.

Responsive
- Les maquettes sont dessinées pour le grand écran uniquement. Le comportement sur
  petit écran est donc à concevoir, pas à recopier : il se décide une fois, dans la
  feature Fondations, et toutes les pages suivantes s'y conforment. Aucun écran ne
  produit de défilement horizontal à 375px.

Portabilité (règle structurante, à ne jamais enfreindre)
- La base ne stocke JAMAIS d'URL de média, seulement des clés de stockage.
- Aucun accès au disque ni au stockage hors d'une interface Storage unique.
- Le schéma de données évite tout ce qui n'existe pas en SQLite ET en PostgreSQL :
  pas d'enum applicatif porté par la base, pas de type JSON, pas de liste scalaire,
  pas d'auto-increment. Objectif : migrer SQLite→Postgres et disque→S3 sans toucher
  au code métier.

Sécurité
- Tout HTML produit par un éditeur est assaini CÔTÉ SERVEUR avant stockage, sur une
  liste blanche de balises. Jamais de confiance au HTML client.
- Les routes d'administration sont refusées par défaut à un visiteur non authentifié.

Accessibilité et contenu
- HTML sémantique, navigation clavier, focus visible, alt obligatoire sur les images
  de couverture.
- LES MAQUETTES SONT EN DÉFAUT SUR L'ACCESSIBILITÉ, ET CETTE CONSTITUTION PRIME SUR
  ELLES. C'est le seul domaine où tu ne dois pas les copier. En particulier :
  * elles suppriment le contour de focus sans le remplacer : tu rétabliras un repère de
    focus visible sur TOUT élément interactif (liens, boutons, champs, sélecteurs,
    onglets, poignées) ;
  * elles ne détectent pas la préférence de thème du système : le site doit s'ouvrir
    dans le thème de l'OS avant toute intervention de l'utilisateur ;
  * elles animent un squelette de chargement en boucle sans garde-fou : toute animation
    doit se désactiver sous prefers-reduced-motion ;
  * le mot-symbole n'y est enveloppé dans aucun lien : il doit ramener à l'accueil ;
  * l'accueil y marque une rubrique comme page courante : l'état courant doit désigner
    la page réellement affichée, et rien d'autre ;
  * les vignettes y portent un texte alternatif vide : toute image de couverture
    d'article porte un texte alternatif réel.
- Interface et contenus en français.

Gouvernance
- Toute décision technique se justifie au regard de ces principes ; en cas de conflit,
  la portabilité et la sobriété l'emportent sur la commodité.
```

### `/speckit.specify`

```
/speckit.specify Feature « Fondations ». Elle met en place le socle visuel et
structurel réutilisé par tout le site — sans aucune page de contenu réelle.

La structure de référence est docs/design/html/accueil.html — lis-la avant de spécifier.

Résultat attendu, du point de vue de quelqu'un qui regarde le site :
- La page tient dans un cadre centré, borné en largeur, cerné d'un filet. À l'intérieur,
  deux zones côte à côte : une colonne de navigation à gauche, sur toute la hauteur, et
  le contenu à droite.
- LA NAVIGATION EST UNE COLONNE LATÉRALE GAUCHE, PAS UNE BARRE HORIZONTALE EN HAUT.
  Largeur fixe d'environ 250px, séparée du contenu par un filet vertical. Elle contient,
  de haut en bas : la marque, un accès à la recherche, la liste verticale des huit
  rubriques (Environnement, Sport, Éducation, Santé, Diplomatie, Culture, Technologie,
  Économie), chacune précédée d'un pictogramme au trait ; et, poussé tout en bas de la
  colonne, l'interrupteur de thème clair/sombre accompagné de son libellé.
- La rubrique de la page courante est signalée comme telle, y compris pour les
  technologies d'assistance.
- Le pied de page est sous le contenu, dans la colonne de droite : il rappelle les huit
  rubriques, des liens d'information, des liens à suivre, et la marque.
- Un composant de vignette d'article unique, décliné en trois états visibles sur une
  page de démonstration : au repos, au survol, et sans image. Cette vignette montre
  une image en 16:9, la rubrique en petites capitales, un titre sur trois lignes
  maximum, et une date.
- Le séparateur entre deux sections n'est pas un trait droit ordinaire mais un filet
  qui se brise une fois, reprenant l'angle de la marque. La position de la brisure sur
  la largeur est un paramètre du composant : elle varie d'une section à l'autre.
- Une bascule de thème qui FONCTIONNE : le site s'ouvre dans le thème du système,
  l'utilisateur peut forcer l'autre, son choix est mémorisé, et il n'y a pas de
  clignotement au chargement. Dans la maquette, cet interrupteur n'est qu'un dessin
  sans comportement ; ici il doit réellement basculer le thème.
- Tout ceci existe en clair ET en sombre.

Comportement sur petit écran — la maquette ne le couvre pas, applique ceci :
- En dessous d'environ 1000px, la colonne latérale n'est plus affichée en permanence.
  Elle laisse place à une barre supérieure minimale portant la marque, un bouton
  d'ouverture du menu et l'interrupteur de thème ; le menu ouvre la même liste de
  rubriques en panneau, fermable au clavier.
- Le contenu passe alors sur toute la largeur disponible.

Critères d'acceptation :
- Une page de démonstration montre la colonne de navigation, le pied de page, la
  vignette dans ses trois états, et le filet de séparation.
- Basculer le thème ne provoque aucun flash au rechargement, et le choix survit à une
  navigation et à un rechargement.
- À 375px de large comme à 1440px, rien ne déborde ni ne se chevauche.
- Toute la navigation se fait au clavier, focus visible, menu mobile refermable.
- Les contrastes passent AA dans les deux thèmes.
Ne décris aucune page de contenu (accueil, article…) : ce sont d'autres features.
```

### `/speckit.clarify`
```
/speckit.clarify
```
Réponds à ses questions. Attends-toi à : comportement exact de l'interrupteur (icône ? position ?), contenu des liens légaux, gestion du menu mobile. Renseigne, puis :

### `/speckit.plan`

```
/speckit.plan Stack et contraintes techniques de la feature Fondations. Respecte
docs/design/tokens.md et la constitution.

- Framework : Nuxt 4, rendu SSR. Le serveur est Nitro, le moteur intégré de Nuxt.
- Runtime : Node.js, c'est-à-dire le preset Nitro par défaut (node-server). Ne configure
  AUCUN preset alternatif : pas de deno_server, pas de bun, pas d'edge. Le preset par
  défaut convient et se déploie partout où Node tourne.
- Node.js en version LTS active ; Nuxt en dernière 4.x stable. Vérifie les versions
  courantes plutôt que de les épingler de mémoire.
- Style : Tailwind CSS v4 via le plugin @tailwindcss/vite. IMPORTANT : Tailwind v4
  n'a PAS de fichier tailwind.config.js ; toute la configuration est en CSS dans un
  seul fichier (@import "tailwindcss", @theme, @custom-variant). Ne crée pas de
  tailwind.config.js.
- Thème : @nuxtjs/color-mode en mode classe (classSuffix vide, donc <html class="dark">).
  Le dark mode Tailwind s'écrit @custom-variant dark (&:where(.dark, .dark *)).
  Les tokens de couleur sont des variables CSS redéfinies sous .dark, exposées à
  Tailwind via @theme inline pour que bg-paper / text-ink basculent seuls sans
  classes dark: sur les couleurs.
- Polices : @nuxt/fonts pour auto-héberger Archivo et Instrument Sans (pas de CDN
  Google Fonts, pour la perf et la vie privée).
- Images : @nuxt/image (composant, formats modernes) — configuré ici, exploité plus tard.
- Icônes : une librairie d'icônes légère pour Vue, tree-shakée.
- Avant d'épingler une version, vérifie la dernière stable de chaque paquet
  (npm view <pkg> version) ; ne te fie pas à ta mémoire, elle date.
- Structure : layout par défaut (rail de navigation latéral + footer), composant Card,
  composant du filet
  coupé, plugin/composable de thème, feuille de tokens CSS. Une page de démonstration
  /styleguide qui rend tout.
- ACTIFS DE MARQUE : les maquettes référencent ../assets/wordmark-{noir,blanc}.png, qui
  n'existent pas dans le dépôt. Les fichiers réels sont dans public/brand/. Adapte les
  chemins ; si un actif manque encore au moment de l'implémentation, signale-le et pose
  un emplacement réservé aux bonnes dimensions plutôt que d'inventer un logo.
- ORIGINE DES TOKENS : la feuille de tokens se dérive de docs/design/tokens.md, et
  d'elle seule. Chaque valeur du fichier (couleurs des deux thèmes, familles et échelle
  typographiques, gouttière, largeurs, écarts de section, épaisseur de filet, angle de
  coupe) devient une variable CSS unique. Les fichiers de docs/design/html/ servent à
  lire la STRUCTURE des écrans ; ils redéfinissent chacun leurs variables en tête, ne
  recopie surtout pas ces blocs — il n'y a qu'une feuille de tokens dans le projet.
- Le /styleguide doit correspondre à docs/design/html/guide-de-style.html (adapte le nom
  au fichier réel) : mêmes sections, mêmes états de composants.
- Détails relevés dans la maquette, à respecter :
  * le filet coupé est un composant paramétrable — la position de la brisure sur la
    largeur est une propriété (elle vaut 50%, 72%, 38%, 60%, 66% selon les sections de
    l'accueil). Ne la fige pas.
  * la maquette charge les polices depuis un CDN ; ici, auto-héberge-les via @nuxt/fonts.
  * la maquette utilise un service d'images de remplacement en ligne ; ici, les images
    viennent de la couche Storage (feature 1) ou d'actifs locaux.
  * les images de la maquette ont un attribut alt vide ; c'est acceptable pour un
    placeholder décoratif, pas pour une image de couverture d'article, où il est requis.
  * les actifs de marque sont dans public/brand/, pas dans ../assets/ : adapte les
    chemins au lieu de les recopier.
- Pas de base de données, pas d'authentification dans cette feature.
```

### `/speckit.analyze` puis `/speckit.tasks` puis `/speckit.implement`
```
/speckit.analyze
```
```
/speckit.tasks
```
```
/speckit.implement
```
Puis lance le site, ouvre `/styleguide`, compare à `docs/design/html/guide-de-style.html`. Tu corriges par prompts normaux (« le survol de la Card doit souligner le titre, pas l'image »). Quand c'est bon : commit, PR, merge.

---

## Feature 1 — Modèle et données · `001-modele-et-donnees`

### `/speckit.specify`

```
/speckit.specify Feature « Modèle et données ». Elle définit les informations que le
site manipule et leur cycle de vie. Aucune interface visible ici.

Les objets du domaine :
- Une RUBRIQUE a un nom affichable, un identifiant d'URL, et un ordre d'affichage.
  Il en existe exactement huit, connues d'avance : Environnement, Sport, Éducation,
  Santé, Diplomatie, Culture, Technologie, Économie.
- Un article porte en outre un SOUS-THÈME facultatif : un mot ou deux, saisis librement
  par la rédaction (Biodiversité, Énergie, Littoral, Mobilité…). Le sous-thème précise le
  sujet à l'intérieur de la rubrique. Il n'a pas de page dédiée, ne sert pas à la
  navigation, et deux articles peuvent porter le même sans que cela crée de lien entre eux.
  Sa seule fonction est l'affichage : sur une vignette, on montre le SOUS-THÈME lorsque le
  lecteur se trouve déjà dans la rubrique de l'article (page de rubrique, « à lire aussi »
  d'un article de la même rubrique), et la RUBRIQUE partout ailleurs (accueil, résultats
  toutes rubriques confondues). Quand l'article n'a pas de sous-thème, on montre toujours
  la rubrique. Le titre de l'article ne porte jamais de préfixe : il est stocké une fois,
  tel qu'il s'affiche.
- Un ARTICLE a un titre, un identifiant d'URL, un chapô court, un corps de texte
  riche, un état (brouillon ou publié), une date de publication, une image de
  couverture avec son texte alternatif, et un auteur éventuel. Un article appartient
  à exactement une rubrique.
- Un article peut être « à la une » et porter alors un rang de 1 à 5, 1 étant l'article
  héros. Deux articles à la une ne partagent pas le même rang.
- Un COMPTE de rédaction a un identifiant de connexion et sert à protéger
  l'administration. On peut le représenter dès maintenant sans encore l'utiliser.
- Un MÉDIA représente un fichier image stocké, désigné par une clé de stockage — jamais
  par une URL — avec ses dimensions et son poids.

Règles de gestion :
- Un article n'est visible du public que s'il est publié et que sa date de publication
  est atteinte.
- Un article « à la une » est nécessairement publié.
- Un identifiant d'URL est unique et se dérive du titre.

Résultat vérifiable : au démarrage, les huit rubriques existent, dans le bon ordre, et
quelques articles d'exemple répartis dans plusieurs rubriques permettent de peupler les
pages qui viendront. On peut lire et écrire ces objets par des appels programmatiques
testés, sans interface.
```

### `/speckit.clarify` → `/speckit.plan`

```
/speckit.plan Stack de la feature Modèle et données. Respecte impérativement la
constitution (règles de portabilité).

- ORM : Prisma 7. Attention, Prisma 7 diffère fortement des versions antérieures :
  * le générateur est "prisma-client" (pas "prisma-client-js") et exige un chemin
    'output' explicite ;
  * le client est ESM ; le package.json doit avoir "type": "module" ;
  * un driver adapter est OBLIGATOIRE — instancier PrismaClient sans adapter échoue ;
  * la configuration passe par un fichier prisma.config.ts (les variables d'env ne
    sont plus chargées implicitement : importer dotenv) ;
  * il n'y a plus de moteur Rust, ce qui est justement ce qui rend Prisma viable
    sous n'importe quel runtime, y compris les environnements contraints.
- Base : SQLite en développement, via @prisma/adapter-better-sqlite3, en mode WAL.
- Le provider Prisma reste 'sqlite' mais le schéma est écrit pour être compatible
  PostgreSQL sans modification : identifiants en cuid (jamais autoincrement), pas
  d'enum porté par la base (utiliser une chaîne + validation), pas de JSON, pas de
  liste scalaire, pas de type natif spécifique à un moteur.
- Validation : Zod, en dernière version stable, pour tous les objets en entrée.
- COUCHE STORAGE : définis une interface Storage unique (put, get, delete, url) et
  une seule implémentation ici, sur disque local, écrivant sous un dossier de stockage
  et exposant les fichiers par une URL locale. Le choix de l'implémentation se fait par
  variable d'environnement (local pour l'instant, s3 plus tard). AUCUN autre code du
  projet ne doit toucher au disque directement.
- Vérifie les dernières versions stables avant d'épingler (npm view).
- Fournis un script de seed qui crée les huit rubriques et des articles d'exemple, et
  des tests qui lisent/écrivent chaque objet.
- Prévois, dans le plan, un point de contrôle : « la chaîne Nuxt/Nitro + Prisma 7 +
  SQLite lit et écrit réellement, en développement comme en build de production ».
  C'est une vérification de routine, pas un risque : better-sqlite3 est un module natif
  Node, il est ici dans son environnement d'origine.
```

> ✅ **Le risque n°1 du cadrage initial a disparu avec le choix de Node.** La chaîne
> Deno + `better-sqlite3` (module natif) était le point le moins balisé du projet ; sur
> Node, `better-sqlite3` est chez lui. Si malgré tout la compilation du module natif
> échoue sur ta machine (build tools manquants sous Windows, ou architecture exotique),
> le repli reste `@prisma/adapter-libsql`, qui lit le même fichier SQLite sans module
> natif — un simple changement d'adapter, sans toucher au schéma ni à la couche Storage.

### `/speckit.analyze` → `/speckit.tasks` → `/speckit.implement`
Idem : les trois commandes, puis tu vérifies que le seed tourne et que les tests passent. PR, merge.

---

## Feature 2 — Pages publiques · `002-pages-publiques`

### `/speckit.specify`

```
/speckit.specify Feature « Pages publiques ». Elle donne à voir les articles aux
visiteurs. Elle réutilise la charpente et la vignette des Fondations, et lit les
objets définis dans Modèle et données.

La page d'ACCUEIL, de haut en bas :
- Une section « À la une » : l'article de rang 1 en héros, large, avec son image, son
  numéro 01, son titre et son chapô ; puis les articles de rang 2 à 5 en vignettes plus
  petites, numérotées 02 à 05. Les numéros traduisent le rang décidé par la rédaction.
- Une section « Les derniers articles » : les articles publiés les plus récents, toutes
  rubriques confondues, en grille, avec un lien vers l'ensemble.
- Une section par rubrique mise en avant (au moins Environnement, Économie, Culture) :
  le nom de la rubrique, un lien « tout voir », et ses derniers articles.

La page d'une RUBRIQUE :
- Un en-tête sobre au nom de la rubrique.
- La liste de ses articles publiés, du plus récent au plus ancien, en grille, paginée.
- Un état particulier lorsque la rubrique n'a aucun article.

La page d'un ARTICLE :
- Fil d'Ariane, rubrique, titre, chapô, métadonnées (date, temps de lecture, auteur
  éventuel), image de couverture avec sa légende.
- Le corps de l'article, en colonne lisible, rendant proprement paragraphes, intertitres,
  listes, citations, liens et images intégrées.
- Une section « à lire aussi » avec des articles de la même rubrique.

Pages système :
- Une page « adresse introuvable » qui, plutôt que de s'excuser, ramène vers les
  derniers articles.
- Une page « service indisponible » du même gabarit.

Diffusion :
- Un flux de syndication listant les derniers articles publiés.
- Un plan du site listant l'accueil, les rubriques et les articles publiés.

Règles :
- Seuls les articles publiés et dont la date est atteinte apparaissent, partout.
- Chaque liste est ordonnée du plus récent au plus ancien.
- Tout existe en clair et en sombre, du mobile au grand écran ; sur mobile, les
  sections par rubrique défilent horizontalement.

Vérifiable : depuis les articles d'exemple, l'accueil montre une Une ordonnée 01→05,
les rubriques listent et paginent, un article s'affiche entièrement, une URL inconnue
mène à la page « introuvable », le flux et le plan du site répondent.
```

### `/speckit.clarify` → `/speckit.plan`

```
/speckit.plan Stack de la feature Pages publiques. Respecte docs/design/tokens.md et la constitution.

- Pages Nuxt en rendu serveur. Réutilise le layout, la Card et le filet des Fondations ;
  n'en crée pas de variante.
- Récupère les données via la couche Prisma de la feature 1, à travers des server routes
  Nitro. Le filtre « publié et date atteinte » est appliqué côté serveur, une seule fois,
  de façon réutilisable.
- Pagination par tranche raisonnable (par ex. 12), en query string, avec liens
  précédent/suivant.
- Le corps d'article est du HTML déjà assaini en base (voir feature 4) ; ici on se
  contente de le rendre dans un conteneur typographique (plugin typography de Tailwind,
  variante sombre incluse).
- Le flux de syndication et le plan du site sont générés par des routes serveur au bon
  type de contenu.
- Prépare (sans forcément câbler tout le SEO, réservé à la feature 5) des URLs propres :
  /, /<rubrique>, /<rubrique>/<identifiant-article>.
- Images d'article servies via @nuxt/image à partir des clés résolues par la couche
  Storage — jamais d'URL en dur.
```

### `/speckit.analyze` → `/speckit.tasks` → `/speckit.implement`
Vérifie chaque page contre sa maquette : `docs/design/html/accueil.html`, `rubrique.html`, `article.html`, `etats.html`. PR, merge.

---

## Feature 3 — Authentification · `003-authentification`

### `/speckit.specify`

```
/speckit.specify Feature « Authentification de la rédaction ». Elle protège l'accès à
l'administration. Elle ne contient aucun outil d'édition — seulement l'entrée.

- Une page de connexion demandant un identifiant et un mot de passe. En cas d'erreur,
  un message clair et non culpabilisant, sans révéler lequel des deux champs est faux.
- Une fois connecté, l'accès aux pages d'administration est ouvert ; déconnecté, il est
  refusé et renvoie vers la connexion.
- Une action de déconnexion.
- La session persiste raisonnablement puis expire.

Cette feature établit seulement : « qui n'est pas connecté ne voit pas l'administration,
qui l'est y accède ». Les écrans d'administration eux-mêmes viennent ensuite.

Vérifiable : visiter une adresse d'administration sans être connecté renvoie à la
connexion ; se connecter avec le compte de la rédaction y donne accès ; se déconnecter
le referme. La page de connexion respecte l'identité visuelle : sa structure est dans
docs/design/html/connexion.html.
```

### `/speckit.clarify` → `/speckit.plan`

```
/speckit.plan Stack de la feature Authentification. Respecte la constitution.

- Session par cookie signé, via nuxt-auth-utils (dernière version stable). Cookie
  httpOnly, sécurisé, SameSite strict.
- Les mots de passe sont hachés avec un algorithme fort (argon2 de préférence).
  Aucun mot de passe en clair, nulle part, jamais.
- Un middleware serveur protège toutes les routes /admin et toutes les server routes
  d'administration : refus par défaut, accès seulement si session valide.
- Un seul rôle de rédaction au MVP ; prévois le champ rôle sans le sur-concevoir.
- La page de connexion réutilise les composants de formulaire du styleguide (champ à
  filet unique, bouton plein). Clair et sombre.
- Pas de création de compte en ligne : le compte de la rédaction est créé par le seed
  ou une commande, avec un mot de passe fourni par variable d'environnement.
```

### `/speckit.analyze` → `/speckit.tasks` → `/speckit.implement`
Teste : `/admin` déconnecté → redirige ; connexion → accès ; déconnexion → referme. PR, merge.

---

## Feature 4 — Back-office · `004-back-office`

C'est la feature la plus lourde. Sa spec est volontairement détaillée par écran.

### `/speckit.specify`

```
/speckit.specify Feature « Back-office rédactionnel ». Derrière l'authentification,
elle donne à la rédaction les outils pour gérer les articles et la Une. Trois écrans.

Écran « Liste des articles » :
- Un tableau dense de tous les articles : vignette, titre, rubrique, état
  (brouillon/publié), rang à la une éventuel, date. Un état se lit d'un mot, sans
  pastille colorée. Le rang à la une s'affiche en numéro, ou un tiret si absent.
- Filtres par texte, par rubrique, par état.
- Un bouton pour créer un article ; sur chaque ligne, modifier et supprimer.
- Pagination.

Écran « Éditeur d'article » (le plus important) :
- Un champ titre qui ressemble déjà au titre publié, un champ chapô.
- Un éditeur de texte riche permettant : gras, italique, intertitres de deux niveaux,
  listes à puces et numérotées, citation en exergue, lien, image intégrée, annuler,
  rétablir. Le texte s'affiche pendant l'écriture exactement comme il paraîtra publié.
- Un panneau latéral : l'état (brouillon ou publié), la rubrique (une seule), la date
  de publication, la mise à la une avec choix du rang de 1 à 5, et une zone de dépôt
  pour l'image de couverture avec son texte alternatif OBLIGATOIRE.
- Deux actions : enregistrer le brouillon, publier.

Écran « Composer la Une » :
- Cinq emplacements numérotés 01 à 05, le premier plus grand (le héros). Chacun montre
  l'article qui l'occupe ou signale qu'il est libre.
- Une liste des articles publiés non épinglés, avec recherche, d'où l'on épingle.
- On réordonne les cinq par glisser-déposer ; l'ordre choisi ici est l'ordre affiché
  sur l'accueil. Une action pour enregistrer.

Règles de gestion :
- Publier un article exige un titre, une rubrique, un chapô, un corps et une image de
  couverture avec texte alternatif.
- Mettre un article à la une le publie s'il ne l'est pas.
- Un rang à la une est occupé par au plus un article ; épingler sur un rang occupé
  déplace l'occupant précédent.
- Supprimer un article demande confirmation et le retire de la Une le cas échéant.
- Le texte riche saisi est nettoyé avant d'être conservé : seules quelques mises en
  forme sûres sont gardées.

Tout en clair et en sombre, dans l'identité du site. La structure des trois écrans est
dans docs/design/html/ : back-office-articles.html, back-office-editeur.html,
back-office-composer-la-une.html.

Vérifiable : créer, éditer, publier, supprimer un article fonctionne ; l'image se
dépose et s'affiche ; composer la Une réordonne bien l'accueil ; le corps enregistré
ne contient que des balises autorisées.
```

### `/speckit.clarify`
Cette feature *mérite* le `clarify`. Questions probables : que faire d'un article à la une qu'on repasse en brouillon ? autorise-t-on l'upload de plusieurs images dans le corps ? taille max d'image ? Réponds avec soin.

### `/speckit.plan`

```
/speckit.plan Stack de la feature Back-office. Respecte la constitution — en
particulier l'assainissement serveur et l'interface Storage.

- Écrans sous /admin, protégés par le middleware de la feature 3. Layout admin
  (barre latérale de 240px, contre 248 côté public) distinct du layout public mais
  visuellement cohérent avec lui (mêmes tokens, même sobriété).
- ATTENTION : le back-office n'utilise PAS le composant Card. Les maquettes y emploient
  trois dérivés distincts, tous en dimensions fixes plutôt qu'en ratio, et aucun n'est
  documenté dans tokens.md : la ligne d'emplacement de la Une (vignette 213×120, ou
  320×180 pour le héros ; titre sur 2 lignes), la ligne d'article publié (vignette 64×36,
  eyebrow à 10px), et la vignette de table (64×36 en image de fond). Reproduis-les tels
  quels ; n'essaie pas de les ramener au composant Card, et ne modifie pas la Card
  publique pour les y faire entrer.
- L'éditeur doit permettre de saisir le SOUS-THÈME de l'article (champ facultatif, texte
  court) dans le panneau latéral. Aucune maquette ne le montre : place-le sous le
  sélecteur de rubrique, dans le même style que les autres champs du panneau.
- Éditeur riche : TipTap 3 (bindings Vue 3 officiels, licence MIT), avec StarterKit
  plus les extensions lien et image. TipTap est « headless » : il ne fournit aucun
  style, il adopte notre typographie ; la zone d'édition rend le texte exactement
  comme la page publique (mêmes styles typography). N'installe AUCUNE extension
  TipTap Pro (payantes, hors périmètre).
- Chaîne de sûreté du contenu : l'éditeur produit du HTML → à l'enregistrement, une
  server route l'assainit avec sanitize-html (liste blanche stricte : paragraphes,
  intertitres h2/h3, listes, citation, lien, image avec alt, gras, italique ; rien
  d'autre, aucun attribut de style, aucun script) → seul ce HTML nettoyé est stocké.
  Ne jamais faire confiance au HTML venu du client.
- Upload d'image : réception multipart côté serveur, redimensionnement avec sharp en
  quelques largeurs, conversion en format moderne, écriture VIA la couche Storage
  (donc jamais d'accès disque direct), et on ne stocke que la clé retournée.
- Glisser-déposer de la Une : une librairie de dnd pour Vue, accessible au clavier.
  La réattribution des rangs 1..5 est transactionnelle côté serveur.
- Validation Zod sur toutes les mutations. Confirmations destructives côté client.
- Vérifie les dernières versions stables (npm view) avant d'épingler.
```

### `/speckit.analyze` → `/speckit.tasks` → `/speckit.implement`
Vérifie contre `Back-office - Articles.html`, `Back-office - Éditeur.html`, `Back-office - Composer la Une.html`. Teste surtout l'assainissement : colle du `<script>` dans l'éditeur, publie, vérifie qu'il a disparu du HTML stocké. PR, merge.

---

## Feature 5 — SEO, performance, accessibilité · `005-seo-perf-a11y`

### `/speckit.specify`

```
/speckit.specify Feature « Référencement, performance, accessibilité ». Elle ne crée
pas de page nouvelle : elle finit celles qui existent pour qu'elles soient trouvables,
rapides et utilisables par tous.

Trouvable :
- Chaque page a un titre et une description propres. La marque s'écrit « Francomètre »
  (avec accent) dans les titres, même si le domaine s'écrit sans accent.
- Les pages d'article exposent les informations qui permettent un bel aperçu lorsqu'on
  les partage (titre, description, image de partage) et les données structurées propres
  à un article de presse (titre, date, rubrique, auteur, image).
- Une seule forme d'adresse fait foi (pas de doublon avec/sans www) ; les autres y
  renvoient.
- Une image de partage par défaut est fournie pour les pages sans couverture propre.
- Le plan du site et le flux de la feature 2 sont déclarés proprement.

Rapide :
- Les pages de liste (accueil, rubriques) sont mises en cache et rafraîchies en
  arrière-plan, pour rester rapides sans servir du contenu périmé.
- Les images ne chargent que lorsqu'elles approchent de l'écran et sont dimensionnées
  au plus juste. La page d'accueil, dense en images, reste rapide à afficher.

Utilisable par tous :
- Navigation entièrement au clavier, ordre de tabulation logique, focus toujours
  visible, sur tous les écrans y compris l'administration.
- Contrastes conformes AA vérifiés dans les DEUX thèmes.
- Structure sémantique (un seul titre principal par page, hiérarchie correcte),
  images décrites, régions repérables.

Vérifiable : un audit de qualité de page atteint au moins 90 sur les volets
performance, référencement et accessibilité, pour l'accueil et pour une page d'article,
dans les deux thèmes ; le partage d'un article montre un aperçu correct ; toute la
navigation se fait au clavier.
```

### `/speckit.clarify` → `/speckit.plan`

```
/speckit.plan Stack de la feature SEO/perf/a11y.

- Métadonnées et données structurées via les utilitaires SEO de Nuxt (useSeoMeta,
  useHead) ; JSON-LD de type NewsArticle sur les pages d'article.
- Cache de rendu : routeRules Nitro en stale-while-revalidate sur l'accueil et les
  pages de rubrique ; en-têtes de cache longue durée sur les médias servis.
- Redirection canonique vers l'apex, image OG par défaut prise dans public/brand.
- Images : réglages @nuxt/image (tailles responsives, formats modernes, lazy sous la
  ligne de flottaison).
- Audit : intègre un passage Lighthouse (CI ou script local) et corrige jusqu'à ≥ 90
  sur perf/SEO/a11y pour l'accueil et un article, dans les deux thèmes.
- Passe d'accessibilité : focus visibles, aria là où c'est nécessaire, vérif clavier
  de l'éditeur et du glisser-déposer de la Une.
```

### `/speckit.analyze` → `/speckit.tasks` → `/speckit.implement`
Dernière PR. Après merge, tu as le MVP.

---

## Rappels d'usage (colle-les au mur)

- **Un cycle complet par feature** : `specify` → `clarify` → `plan` → `analyze` → `tasks` → `implement`. Ne saute ni `clarify` ni `analyze`, ce sont eux qui t'évitent de réimplémenter.
- **Ne lance pas deux features en parallèle.** Merge la PR de l'une avant d'ouvrir la suivante ; les branches numérotées de Spec Kit se marchent dessus sinon.
- **`specify` = le quoi, `plan` = le comment.** Aucune techno dans un `specify`.
- **Relis chaque artefact.** Après `specify`, lis `spec.md`. Après `plan`, lis `research.md` et `plan.md` — c'est là que l'agent fige des versions ; c'est là qu'il se trompe le plus. Après `tasks`, survole `tasks.md`.
- **`tokens.md` fait foi, les HTML montrent la structure.** L'agent peut lire les deux : cite-lui le chemin exact du fichier concerné (`docs/design/html/article.html`) plutôt que de décrire l'écran de mémoire. Toi, ouvre le même fichier dans un navigateur pour juger le rendu.
- **Une seule feuille de tokens, jamais neuf.** Chaque HTML redéfinit ses variables en tête ; si tu vois l'agent recopier des hex écran par écran, arrête-le : tout descend de `tokens.md`.
- **La section « Écarts constatés » de `tokens.md` n'est pas une liste de bugs.** C'est l'inventaire de ce qui s'écarte du système idéal et qui a été conservé volontairement. L'agent doit la respecter, pas la « corriger » : sans cette consigne, il uniformisera les trois tailles de titre héros et retirera l'accent de ses usages non canoniques.
- **Le mobile n'existe qu'en valeurs, pas en dessin.** L'agent l'implémentera depuis `tokens.md` sans référence visuelle : relis ce rendu-là de près, c'est celui qui a le plus de chances de dériver.
- **Les versions que tu m'as vu citer datent forcément un peu.** À chaque `plan`, exige `npm view <pkg> version` plutôt qu'une version de mémoire. La note Prisma 7 (adapter obligatoire, générateur `prisma-client`, ESM, `prisma.config.ts`) reste vraie et reste le piège principal.
- **`/speckit.taskstoissues`** (optionnel) : après un `tasks` que tu valides, il crée les issues GitHub correspondantes si tu veux suivre le travail dans l'onglet Issues. Utile pour la feature 4, surdimensionné pour la feature 0.

## Le point encore ouvert : le logo

La colonne latérale a réglé la moitié du problème : large d'environ 250px, elle accueille
le bloc deux lignes sans le comprimer. **Le verrou une ligne n'est donc plus nécessaire.**

Il reste le format. La maquette charge deux images bitmap, permutées par CSS selon le
thème :

```html
<img class="rail__logo wm-noir"  src="../assets/wordmark-noir.png"  alt="Francomètre — accueil">
<img class="rail__logo wm-blanc" src="../assets/wordmark-blanc.png" alt="Francomètre — accueil">
```

Ça fonctionne, mais ça coûte trois choses : un rendu flou sur écran haute densité, deux
fichiers à charger au lieu d'un, et une bascule de thème qui repose sur du CSS d'affichage
plutôt que sur la couleur du texte. Avec un SVG en `fill: currentColor`, un seul fichier
sert les deux thèmes et suit automatiquement le token `ink`.

Deux points d'attention pour la feature 0 :
- **Le chemin change.** La maquette pointe vers `../assets/` ; dans le projet Nuxt, les
  actifs de marque vivent dans `public/brand/`. L'agent doit adapter, pas recopier.
- **L'attribut alt.** Dans la maquette il vaut « Francomètre — accueil » sur les deux
  images. En production, une seule doit porter le nom du site ; si les deux restent, un
  lecteur d'écran annoncera la marque deux fois.

Tant que le SVG n'est pas là, garde le montage bitmap. Le jour où tu l'as, un simple
prompt suffit — « remplace les deux images de marque du rail par public/brand/logo.svg
en fill:currentColor, supprime la permutation CSS .wm-noir/.wm-blanc » — sans rejouer
la moindre feature.
