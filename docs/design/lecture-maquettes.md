# Francomètre — Lecture des maquettes

**Objet :** relevé de ce que spécifient réellement les sources de design, avant toute
implémentation. Aucun arbitrage n'est pris ici : les écarts sont remontés, pas corrigés.

**Sources analysées** (18 juillet 2026) :

- `docs/design/html/tokens.md` — **fait foi pour toute valeur** (couleur, taille, espacement, angle) ;
- `docs/design/html/*.html` — neuf fichiers, montrent la **structure** de chaque écran :
  `guide-de-style`, `accueil`, `rubrique`, `article`, `connexion`, `etats`,
  `back-office-articles`, `back-office-composer-la-une`, `back-office-editeur`.

Chaque `.html` est autonome et redéfinit ses variables CSS en tête. Le projet aura **une
seule** feuille de tokens, dérivée de `tokens.md` — les redéfinitions par écran ne sont pas
à recopier.

---

## 1. Les six rôles de couleur

| Rôle | Clair | Sombre | Usage |
|---|---|---|---|
| `--paper` | `#FFFFFF` | `#0B0B0C` | Fond de page |
| `--surface` | `#F5F5F5` | `#151517` | Aplats, fonds de vignette 16:9, survol de ligne |
| `--ink` | `#0A0A0A` | `#F5F5F5` | Titres, corps, bouton primaire |
| `--muted` | `#6F6F6F` | `#9A9A9A` | Méta, dates, légendes |
| `--line` | `#E6E6E6` | `#262628` | Filets 1 px, bordures |
| `--accent` | `#1F35FF` | `#8A97FF` | Accent rationné |

**Aucune divergence.** Les douze valeurs sont strictement identiques dans les neuf fichiers.

Seul écart, structurel : `guide-de-style.html` ne déclare pas `html.dark` — les valeurs
sombres y sont **en commentaire** (lignes 23-25). La planche est mono-thème et ses
échantillons sombres sont des hex codés en dur.

Quatre fichiers ajoutent des variables **hors des six rôles** :

| Variable | Fichier(s) | Valeurs |
|---|---|---|
| `--error` | `connexion` | `#C81E1E` / `#FF6B6B` |
| `--dot` | `back-office-articles` | `#C8C8C8` / `#3A3A3D` |
| `--primary-hover` | `composer-la-une`, `editeur` | `#2A2A2A` / `#E2E2E2` |
| `--disabled` | `editeur` | `#9A9A9A` / `#5A5A5D` |

⚠️ La valeur sombre `#5A5A5D` de `--disabled` **n'apparaît nulle part dans `tokens.md`**.

---

## 2. Les trois usages autorisés de l'accent

Selon `tokens.md` §1 et la planche §02 :

1. **Numéros de la Une** — le classement 01→05 rendu visible.
2. **Soulignement de la rubrique active** dans le rail — `border-bottom: 2px`, **jamais un fond**.
3. **Liens dans le corps d'article** — y compris le lien du chapô.

Interdits : fond de bloc, fond de bouton, titre décoratif. « Les photos apportent toute la couleur. »

**Dans les faits, la règle est largement débordée.** `tokens.md` §6 recense cinq extensions
(eyebrow « À la une », kicker d'article, rang de table + pagination, glisser-déposer, H2 actif
de la barre d'outils). **Sept autres, non recensées** — voir §7-A.

---

## 3. La signature « coupe »

- **Angle : 3,5°**, coté **4 px de dénivelé pour 64 px** parcourus horizontalement.
  La valeur géométrique exacte de `atan(4/64)` est 3,576° — l'angle affiché est arrondi vers
  le bas. C'est la cote 4/64 qui fait foi, et le SVG la respecte : `line x1=0 y1=4.5 x2=64 y2=0.5`.
- **Deux apparitions seulement :**
  1. le **mot-symbole** — coupe intégrée au dessin ;
  2. le **filet coupé**, à la séparation de deux sections.

  Une 3ᵉ apparition = un tic. Pas de photo coupée, pas de card cisaillée, pas de titre tranché,
  pas de diagonale décorative.

Implémentation identique dans les cinq fichiers concernés : ligne gauche à `top:4px`, segment
diagonal de 64 px, ligne droite qui reprend à `top:0`. Couleur `--line`, épaisseur 1 px.

Positions de brisure relevées : **38 %, 50 %, 60 %, 66 %, 72 %** — cohérent avec la fourchette
annoncée par `tokens.md` §4.

| Fichier | Occurrences | Positions |
|---|---|---|
| `guide-de-style` | 12 | 66 % ×11, 60 % |
| `accueil` | 5 | 50 %, 72 %, 38 %, 60 %, 66 % |
| `etats` | 5 | 66 %, 50 %, 66 %, 50 %, 50 % |
| `article` | 2 | 66 %, 50 % |
| `rubrique` | 1 | 66 % |

**Zéro occurrence dans tout le back-office et dans la connexion** — logique, ces écrans
n'empilent pas de sections.

### Les deux filets, à ne pas confondre

- **Filet ordinaire** — 1 px parfaitement horizontal, *à l'intérieur* d'une section. Couleur `--line`.
- **Filet coupé** — 1 px qui se brise **une seule fois** à 3,5°, *entre deux sections*.

---

## 4. Le composant Card

**Structure, dans l'ordre :**

1. **Image 16:9 stricte** — `aspect-ratio:16/9`, fond `--surface`, `object-fit:cover` ;
2. **Eyebrow** — Archivo 11 px/600, `+0.1em`, majuscules ; optionnellement précédé du **numéro
   de Une en accent** (`01 · Rubrique`) ;
3. **Titre** — Archivo 20 px/600, `-0.02em`, interligne 1,25, **3 lignes maximum**
   (`-webkit-line-clamp:3`) ;
4. **Méta** — date, Instrument Sans 13 px, `--muted`.

**Règles :** pas de chapô (sauf héros de la Une), pas de bouton, pas de « lire la suite » — la
card entière est un `<a>`. Survol : `scale(1.03)` sur l'image + soulignement du titre,
**150 ms**. Aucun autre effet, aucune ombre.

**Variantes :**

| Variante | Spécification |
|---|---|
| « grand » (feature) | titre 32 px, interligne 1,15, `padding-top:20px` |
| sans image | pas de vignette ; `border-top:2px solid --ink`, puis eyebrow → titre → date |
| squelette | blocs `--surface` aux dimensions exactes, pulsation d'opacité 1,8 s |
| card sombre isolée | aplat `--paper` avec `padding:12px` *(planche)* |

### Réutilisation

| Écran | Emploi |
|---|---|
| `accueil` | héros 01 (variante chapô) + 4 secondaires + 8 « derniers articles » + 3 blocs de 4 = **25** |
| `rubrique` | 1 feature `--grand span-2` + 11 standard = **12** |
| `article` | « À lire aussi » = **3** |
| `etats` | 4 sur la 404, 4 sur la 500, + squelettes accueil (13) et rubrique (12) |
| `guide-de-style` | 3 démonstrations (repos / survol / sans image) |

⚠️ **Deux variantes documentées ne sont jamais employées :**

- la card **« sans image »** n'existe que dans la démo du guide de style — aucun écran réel ne l'utilise ;
- la **« card sombre isolée »** (`padding:12px` sur aplat `--paper`) est introuvable dans le corpus.

⚠️ **Le back-office n'utilise pas la Card** mais trois dérivés distincts, aucun documenté :

| Dérivé | Fichier | Spécification |
|---|---|---|
| `.slot` | `composer-la-une` | vignette 213×120 px (héros : 320×180), titre 18 px (héros : 22), `line-clamp:2` |
| `.pub` | `composer-la-une` | vignette 64×36, titre 14 px, eyebrow **10 px** |
| `.thumb` | `back-office-articles` | 64×36 en `background-image` |

Aucun n'utilise `aspect-ratio` — tous sont en pixels fixes. 213×120 n'est d'ailleurs pas
exactement 16:9 (213,33 le serait).

---

## 5. La navigation

**Colonne latérale gauche** — `<aside>`, premier enfant d'un `.frame` en flex. Jamais un
en-tête horizontal.

### Côté public — 248 px

`accueil`, `rubrique`, `article`, `etats` : `flex:0 0 248px`, `border-right:1px solid --line`,
`padding:26px 28px 30px`, contenu réparti haut/bas par `justify-content:space-between`.

Dans l'ordre :

1. **Mot-symbole** — hauteur 30 px, bascule `wm-noir` / `wm-blanc` selon le thème ;
2. **« Rechercher »** — icône loupe + libellé, souligné d'un filet, `margin-top:34px` ;
3. **Les 8 rubriques** — icône + libellé, 16 px/500, `padding:8px 0`, toujours dans cet ordre :
   **Environnement · Sport · Éducation · Santé · Diplomatie · Culture · Technologie · Économie** ;
4. *(poussé en bas)* **bascule de thème** — icône demi-lune + « Passer en sombre ».

Rubrique active : `border-bottom:2px solid var(--accent)` sur le libellé, `padding-bottom:3px`.

### Côté back-office — 240 px

`back-office-articles`, `composer-la-une`, `editeur` : `flex:0 0 240px`, `padding:26px 0 30px`.

Mot-symbole (marge latérale 24 px) → **Articles · À la une · Médias** (15 px/500,
`padding:12px 24px`) → *(en bas)* **Déconnexion**.

Entrée active : `background:var(--surface)` + `border-left:3px solid var(--accent)`.

### Sans rail

`connexion.html` (écran centré, `max-width:400px`) et `guide-de-style.html` (masthead horizontal).

---

## 6. Ce que les maquettes ne couvrent pas

### Dessiné mais non fonctionnel

Aucun `<script>`, aucun `onclick`, aucun `addEventListener` dans les neuf fichiers.

- **Bascule de thème** — un `<div>` avec `cursor:pointer`, sans lien ni bouton. Le thème sombre
  n'est atteignable qu'en ajoutant `class="dark"` à la main sur `<html>` ;
- **Recherche du rail** — un `<div>`, pas un `<input>`. Celles du back-office sont de vrais
  inputs, mais sans traitement ;
- **Glisser-déposer** de la Une — `cursor:grab` seul, pas d'attribut `draggable` ;
- **Éditeur entier** — titre et chapô explicitement `contenteditable="false"`, zone de corps non
  éditable. Les 12 boutons de la barre d'outils, les segmentés Statut/Rang, les puces
  Remplacer/Retirer, Publier, Enregistrer : tous inertes ;
- **Erreur de connexion** — variante CSS `is-error` à poser manuellement sur le `<form>` ;
- **Pagination, filtres, sélecteurs, Épingler, Supprimer** — 144 `href="#"` au total.

Seuls comportements réels du corpus : l'animation CSS `fmpulse` du squelette (1,8 s, pulsation
d'opacité, `etats.html:111`) et la barre d'outils en `position:sticky` (`editeur`).

### Totalement absent

- **Zéro media query** dans les neuf fichiers, alors que `tokens.md` spécifie une douzaine de
  valeurs mobiles (390 px, gouttière 20 px, titres 32/40/36 px, rail horizontal de cards 250 px,
  écart de sections 48 px). **Le petit écran est spécifié mais pas dessiné.** Le rail latéral n'a
  aucun repli défini : ni tiroir, ni bouton hamburger, ni empilement ;
- **`../assets/` n'existe pas.** Les quatre fichiers `wordmark-*.png` sont référencés 26 fois et
  manquent tous. Le mot-symbole — support de la signature à 3,5° — est introuvable dans le dépôt ;
- **Aucun état de focus visible.** `outline:none` est posé neuf fois ; seuls les deux champs de
  connexion et de la planche redéfinissent un repère. Boutons, `.tb-btn`, `.seg`, `.chip`,
  `.select` : rien. Défaut d'accessibilité, pas oubli cosmétique ;
- **Aucun `prefers-reduced-motion`** alors que le squelette pulse en boucle infinie ;
  **aucun `prefers-color-scheme`** — le thème ne suit pas la préférence système ;
- **Écrans manquants** : « Médias » (pointé par la nav BO), résultats de recherche, mot de passe
  oublié, page auteur, confirmation de suppression, rubrique vide, 403 ;
- **États manquants** : le glisser-déposer *en cours*, le hover/focus de la nav BO, le survol
  *réel* de la card dans la planche (le guide anime `.card__ratio`, pas une image).

---

## 7. Incohérences, valeurs manquantes, ambiguïtés

### A. Usages d'accent non recensés par `tokens.md` §6

| Où | Quoi |
|---|---|
| `article`, `editeur` | **Filet de citation** `blockquote` : `border-left:2px solid --accent` |
| les 9 fichiers | **`::selection`** : fond accent, texte blanc |
| `connexion` | **Focus de champ** : `border-bottom:2px solid --accent` |
| `BO articles`, `composer`, `editeur` | **Entrée de nav active** : `border-left:3px` accent **+ fond `--surface`** |
| `editeur` | **Segmentés actifs** (Statut, Rang 01-05) : texte accent + soulignement 2 px |
| `editeur` | **Case à cocher** : `accent-color:var(--accent)` |
| `connexion`, `BO articles` | **Survol du bouton primaire** |

Le point le plus net : `tokens.md` dit « soulignement 2 px, **jamais un fond** », et le
back-office fait exactement l'inverse — bordure gauche de **3 px** (pas 2) **plus** un fond
`--surface`.

Le commentaire de `back-office-editeur.html:82` affirme que le H2 actif est « le seul endroit où
l'accent touche l'interface » : le même fichier le contredit quatre fois.

### B. Commentaires auto-contradictoires

- `connexion.html:56` — « Bouton primaire : noir plein, **jamais en accent** (survol → accent) » ;
- `connexion.html:49` — « Champ : soulignement d'un filet ordinaire ; focus en 2 px (couleur
  accent) », alors que la planche de référence spécifie un focus en `--ink`.

### C. Documenté dans `tokens.md`, absent des maquettes

- **Cible d'insertion du glisser-déposer** (trait 2 px) et libellé **« Déplacement en cours… »** :
  introuvables. Le mot « déplacement » n'apparaît qu'une fois dans le corpus, dans la planche, au
  sens opposé (« sans ombre ni déplacement ») ;
- **Bordure de carte en cours de glisser-déposer** `#D8D8D8` / `#33333A` : `#D8D8D8` n'existe que
  comme ligne de cote pointillée dans le schéma SVG du guide ; `#33333A` n'existe nulle part ;
- **Chrome des planches** (`#141416`, `#8A8A8D`, `#5F5F62`) et **fonds de présentation**
  (`#D4D4D6`, `#EDEDED`, `#D0D0D0`) : absents des neuf fichiers — `etats.html` habille ses
  légendes avec `--ink` / `--muted`. Ces valeurs viennent probablement d'exports images non fournis.

### D. Valeurs hors échelle, non documentées

| Valeur | Où |
|---|---|
| `27px` | message d'erreur 404/500 — **occurrence unique** dans tout le corpus |
| `160px` | chiffre 404/500 en filigrane |
| `10px` | eyebrow de la colonne « Articles publiés » (l'eyebrow standard est à 11 px) |
| `18px` / `22px` | titres de slot (`composer-la-une`) |
| `0.08em` | tracking du statut de table, là où l'eyebrow standard est à `0.1em` |

### E. Divergences entre écrans, à arbitrer

- **Titre de maquette admin** — `tokens.md` annonce un interligne de 1,04–1,05 ; l'éditeur est à **1,08** ;
- **Couleur du chapô** — `--ink` sur l'accueil, `--muted` sur l'article et l'éditeur ;
- **Case à cocher** — noire (`#0A0A0A`) dans la planche, accent dans l'éditeur ;
- **Focus de champ** — `--ink` 1 px dans la planche, accent 2 px en connexion ;
- **Pied de page** — trois colonnes de liens sur accueil/rubrique/article, version **compacte**
  (marque + légal seulement) sur les états : variante non documentée ;
- **Titre héros de la planche** — rendu en `800` / interligne 1,02, mais son propre échantillon
  d'échelle typographique l'annonce en `700` / 1,05.

### F. Navigation — trois défauts

- Le mot-symbole porte `alt="Francomètre — accueil"` mais **n'est enveloppé dans aucun lien**, sur
  les quatre écrans publics : aucun retour à l'accueil depuis le rail ;
- `accueil.html:144` marque **« Environnement » comme `aria-current="page"` alors qu'on est sur
  l'accueil** — le soulignement accent s'affiche sur la mauvaise entrée. Même chose sur
  `article.html:148` (défendable comme rubrique parente, mais `aria-current="page"` est le mauvais
  jeton) ;
- `etats.html` **ne contient pas la règle `.nav a[aria-current="page"]`** : l'état actif y serait
  sans style.

### G. Contenu incohérent d'un écran à l'autre

- L'article en position 01 s'appelle « Paris et Berlin scellent un pacte industriel… » sur
  l'accueil et « Alliance franco-allemande sur les batteries… » dans les deux écrans de back-office ;
- `tokens.md` promet un « seed stable par article » : **cinq articles ont deux seeds différents**
  — lynx (`fm-env3` / `fm-env-lynx`), éoliennes (`fm-env2` / `fm-env-eolien`), canicule
  (`fm-env-top` / `fm-env-canicule`), littoral (`fm-d5` / `fm-env-cote`), forêt (`fm-env1` /
  `fm-env-foret`). Donc deux photos pour un même article ;
- `composer-la-une` affiche « 4 / 5 emplacements » avec le 05 vide, tandis que la table BO et
  l'accueil montrent cinq positions remplies ;
- L'éditeur exige un texte alternatif (« Requis pour l'accessibilité ») que **toutes les cards
  publiques jettent** : `alt=""` systématiquement.

### H. Deux ambiguïtés de fond, non tranchées

- Les **icônes de rubrique du rail** cohabitent mal avec l'interdit n°05 de la planche,
  « icônes décoratives » ;
- La frontière **filet ordinaire / filet coupé** : sur `rubrique.html`, les passages titre → grille
  et grille → pagination utilisent un filet *ordinaire*, alors que ce sont des sections distinctes.
  La définition « à l'intérieur d'une section » vs « entre deux sections » ne suffit pas à décider.

---

## 8. Points de contrôle vérifiés

| # | Affirmation | Verdict |
|---|---|---|
| 1 | La navigation est une colonne latérale gauche, 248 px public / 240 px back-office | ✅ **Confirmé** — `flex:0 0 248px` sur les 4 écrans publics, `240px` sur les 3 écrans de back-office. Aucun en-tête horizontal nulle part. |
| 2 | Aucune media query dans les neuf fichiers, alors que `tokens.md` documente des valeurs mobiles | ✅ **Confirmé** — `grep -c "@media"` retourne 0 partout. |
| 3 | L'interrupteur de thème est un dessin sans comportement, aucun JavaScript | ✅ **Confirmé** — zéro `<script>`, zéro `onclick`, zéro `addEventListener`. La bascule est un `<div>` avec `cursor:pointer`. |
| 4 | Le survol du bouton primaire n'est pas identique partout : accent dans deux fichiers, gris foncé dans un troisième | ⚠️ **Confirmé, décompte à corriger** — voir ci-dessous. |
| 5 | Certaines vignettes affichent en eyebrow un libellé qui n'est pas l'une des huit rubriques | ⚠️ **Confirmé, liste incomplète** — voir ci-dessous. |

### Point 4 — survol du bouton primaire

**Accent dans deux fichiers :**

- `connexion.html:60` — `.btn-primary:hover{background:var(--accent);}`
- `back-office-articles.html:62` — `.btn-primary:hover{background:var(--accent);border-color:var(--accent);}`

**Gris foncé dans trois fichiers, pas un :**

- `back-office-composer-la-une.html:63` — via `--primary-hover` (`#2A2A2A` / `#E2E2E2`, thème-aware)
- `back-office-editeur.html:146` — via `--primary-hover`, idem
- `guide-de-style.html:86` — `#2A2A2A` **codé en dur**, sans variante sombre

C'est la planche de référence qui porte la troisième occurrence — utile à savoir, puisque c'est
elle qui fait autorité visuellement.

### Point 5 — eyebrows hors des huit rubriques

Rubriques réelles : **Environnement, Sport, Éducation, Santé, Diplomatie, Culture, Technologie,
Économie**.

**17 occurrences, 11 libellés distincts :**

| Écran | Occurrences | Libellés |
|---|---|---|
| `rubrique.html` | **12 / 12 cards** | Forêts *(feature)*, Énergie ×2, Biodiversité, Eau, Climat, Littoral, Territoires, Montagne, Mobilité, Déchets, Faune |
| `article.html` — « À lire aussi » | **3 / 3 cards** | Énergie, Biodiversité, Eau |
| `composer-la-une` — « Articles publiés » | **2 / 7 lignes** | Biodiversité, Énergie |

Les libellés **Forêts, Littoral, Territoires, Montagne** s'ajoutent aux sept habituellement cités.

**Fait corrélé, décisif pour l'arbitrage :** ce ne sont pas des erreurs isolées, c'est un système
à deux niveaux. Les mêmes articles portent l'eyebrow « Environnement » sur l'accueil et dans la
table du back-office, avec le sous-thème déplacé **dans le titre** :

| Accueil | Rubrique |
|---|---|
| eyebrow **Environnement** — « **Biodiversité :** le retour discret du lynx dans les Vosges » | eyebrow **Biodiversité** — « Le retour discret du lynx dans les forêts des Vosges » |
| eyebrow **Environnement** — « **Eau :** les nappes phréatiques sous le niveau de saison » | eyebrow **Eau** — « Les nappes phréatiques repassent sous le niveau de saison » |
| eyebrow **Environnement** — « **Littoral :** le recul du trait de côte s'accélère… » | eyebrow **Littoral** — « Le recul du trait de côte s'accélère… » |

Autrement dit : eyebrow = rubrique quand on est hors rubrique, eyebrow = sous-thème quand on est
déjà dans la rubrique. Défendable éditorialement, mais contredit frontalement `tokens.md` §5, qui
pose « **Eyebrow = rubrique** » sans nuance — et implique un champ « sous-thème » qui n'existe
dans aucun écran de back-office : ni la table, ni l'éditeur ne permettent de le saisir.

**Arbitrage requis :** soit la Card gagne un second champ optionnel, soit les eyebrows de
`rubrique.html` sont à corriger.
