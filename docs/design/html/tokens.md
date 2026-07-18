# Francomètre — Référence de design (tokens)

Valeurs relevées **telles qu'utilisées dans la maquette** (pas idéalisées). Baseline :
« L'actualité, mesurée. » Deux thèmes, bascule par `class="dark"` sur `<html>`.

---

## 1. Couleurs

### Thème clair (`:root`)

| Token | Hex | Usage |
|---|---|---|
| `--paper` | `#FFFFFF` | Fond de page |
| `--surface` | `#F5F5F5` | Blocs, aplats, cartes, fonds de vignette 16:9 |
| `--ink` | `#0A0A0A` | Titres, corps, texte principal |
| `--muted` | `#6F6F6F` | Méta, dates, légendes, libellés secondaires |
| `--line` | `#E6E6E6` | Filets, séparateurs 1 px, bordures de champ |
| `--accent` | `#1F35FF` | Accent rationné (voir plus bas) |

### Thème sombre (`.dark`)

| Token | Hex | Usage |
|---|---|---|
| `--paper` | `#0B0B0C` | Fond de page |
| `--surface` | `#151517` | Blocs, aplats, cartes, fonds de vignette |
| `--ink` | `#F5F5F5` | Titres, corps, texte principal |
| `--muted` | `#9A9A9A` | Méta, dates, légendes |
| `--line` | `#262628` | Filets, séparateurs, bordures |
| `--accent` | `#8A97FF` | Accent rationné |

### Règle de rationnement de l'accent

L'accent apparaît **uniquement** à ces trois emplacements :

1. **Numéros de la Une** — le classement 01→05 rendu visible.
2. **Soulignement de la rubrique active** — dans le rail de navigation (soulignement 2 px, jamais un fond).
3. **Liens dans le corps d'article** — y compris le lien souligné du chapô/corps.

**Interdit :** en fond de bloc, en fond de bouton, comme couleur de titre décoratif. Les **photos** apportent toute la couleur. (Voir §6 pour les extensions constatées de cette règle.)

### Couleurs de service (hors palette de tokens, relevées telles quelles)

| Hex | Où | Note |
|---|---|---|
| `#2A2A2A` | Survol du bouton primaire (clair) | éclaircissement du noir |
| `#E2E2E2` | Survol du bouton primaire (sombre) | assombrissement du blanc |
| `#C8C8C8` | Séparateurs `·`, points de pagination (clair) | gris intermédiaire |
| `#3A3A3D` | Séparateurs `·`, points de pagination (sombre) | |
| `#C81E1E` (clair) / `#FF6B6B` (sombre) | Message d'erreur de connexion, filet d'erreur des champs | **rouge hors palette** |
| `#D8D8D8` (clair) / `#33333A` (sombre) | Bordure de la carte en cours de glisser-déposer | |
| `#141416` / `#8A8A8D` / `#5F5F62` | Chrome des planches (titres et libellés d'écran) | hors interface publiée |
| `#D4D4D6` / `#EDEDED` / `#D0D0D0` | Fonds des planches de présentation | hors interface publiée |

---

## 2. Typographie

Deux familles, importées ensemble :
`Archivo:wght@400;500;600;700;800` + `Instrument+Sans:wght@400;500;600`.

- **Archivo** — titres et eyebrows. 600–800, tracking −0,02em, interligne serré.
- **Instrument Sans** — corps, interface, métadonnées. 400–600.

| Style | Famille | Graisse | Taille | Interligne | Tracking | Casse |
|---|---|---|---|---|---|---|
| Eyebrow (rubrique / kicker) | Archivo | 600 | 11px | 1 | +0.1em | MAJUSCULES |
| Titre de card | Archivo | 600 | 20px | 1.25 | −0.02em | normale |
| Titre de card « grand » (feature) | Archivo | 600 | 32px | 1.15 | −0.02em | normale |
| Titre héros — planche de style | Archivo | 800 | `clamp(2.5rem,4vw,4rem)` | 1.02 | −0.02em | normale |
| Titre héros — Une accueil (desktop) | Archivo | 700 | 52px | 1.04 | −0.02em | normale |
| Titre héros — Une accueil (mobile) | Archivo | 700 | 32px | 1.06 | −0.02em | normale |
| Titre de rubrique H1 (desktop) | Archivo | 800 | 72px | 1 | −0.02em | normale |
| Titre de rubrique H1 (mobile) | Archivo | 800 | 40px | 1.02 | −0.02em | normale |
| Titre d'article H1 (desktop) | Archivo | 800 | 56px | 1.05 | −0.02em | normale |
| Titre d'article H1 (mobile) | Archivo | 800 | 36px | 1.06 | −0.02em | normale |
| Titre de section (« Les derniers articles ») | Archivo | 700 | 28px (desktop) / 22px (mobile) | 1.05 | −0.02em | normale |
| Chapô d'article | Instrument Sans | 400 | 20px (desktop) / 18px (mobile) | 1.5 | — | normale |
| Corps d'article | Instrument Sans | 400 | 19px (desktop) / 18px (mobile) | 1.6 | — | normale |
| Corps courant (planche, chapô Une) | Instrument Sans | 400 | 17px | 1.6 | — | normale |
| Sous-titre H2 de corps | Archivo | 700 | 30px (desktop) / 26px (mobile) | 1.15 | −0.02em | normale |
| Sous-titre H3 de corps | Archivo | 600 | 22px (desktop) / 20px (mobile) | 1.2 | −0.01em | normale |
| Citation (blockquote) | Archivo | 500 italique | 24px (desktop) / 22px (mobile) | 1.3 | −0.01em | normale |
| Méta (date · rubrique · lecture) | Instrument Sans | 400 | 13px | 1.5 | — | normale |
| Titre admin / back-office (H1) | Archivo | 700 | 32px | 1 | −0.02em | normale |
| Titre de maquette admin (grand) | Archivo | 800 | 40px | 1.04–1.05 | −0.02em | normale |
| Label de formulaire (site) | Instrument Sans | 400 | 13px | — | — | normale |
| Label de formulaire (back-office, majuscule) | Archivo | 600 | 11px | — | +0.1em | MAJUSCULES |
| Saisie de champ | Instrument Sans | 400 | 16px (site) / 15px (admin) | — | — | normale |

Chiffres de tableaux/rangs : `font-variant-numeric: tabular-nums`.

---

## 3. Géométrie et espacement

| Cote | Valeur |
|---|---|
| Base | 4 px (échelle : 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 80) |
| Gouttière (desktop) | 24 px |
| Gouttière (mobile) | 20 px *(voir §6)* |
| Conteneur max | 1440 px |
| Largeur de contenu | 1280 px |
| Colonne de lecture d'article | 720–800 px |
| Écart entre sections | 80 px (bureau) / 48 px (mobile) — valeur système ; le padding réel des sections varie 40–64 px |
| Rayon de bordure | **0 partout** |
| Ombre | **aucune** |
| Dégradé | **aucun** |
| Épaisseur de filet | 1 px (soulignement de rubrique / champ focus / bordure active : 2 px) |
| Rail de navigation | 248 px (site) / 240 px (back-office) *(voir §6)* |
| Sidebar réglages (éditeur) | 320 px |

### Points de rupture et grille

| Rupture | Largeur cadre | Colonnes de grille de cards |
|---|---|---|
| Desktop | 1440 px (contenu 1280) | 12 colonnes de base ; cards en **4 colonnes** (grille des sections), Une en **7fr / 5fr** (héros + 2×2), feature de rubrique sur **span 2** d'une grille 4-col |
| Mobile | 390 px | 1 colonne empilée ; blocs de rubrique de l'accueil = **rail horizontal** (cards de 250 px) |

Grille de référence : 12 colonnes, gouttière 24 px, sur contenu 1280 px.

---

## 4. Signature « coupe »

- **Angle exact : 3,5°.** Cote : **4 px de dénivelé pour 64 px** parcourus horizontalement.
- La diagonale n'apparaît que **deux fois** dans tout le système :
  1. dans le **mot-symbole** (coupe intégrée au dessin, à 3,5°) ;
  2. dans le **filet coupé**, à la séparation de deux sections.
- Une 3ᵉ apparition = un tic. Donc : pas de photo coupée, pas de card cisaillée, pas de titre tranché, pas de diagonale décorative.

### Les deux filets (à ne pas confondre)

- **Filet ordinaire** — trait de 1 px parfaitement horizontal, **à l'intérieur** d'une section (sous une ligne de tableau, sous un champ, sous un titre de rubrique). Couleur `--line`.
- **Filet coupé** (la signature) — trait de 1 px qui se brise **une seule fois** à 3,5° : ligne gauche à `top:4px` sur une largeur variable, segment diagonal de 64 px de large (dénivelé 4 px), puis ligne droite qui reprend 4 px plus haut (`top:0`). **Uniquement entre deux sections.** Couleur `--line`. Position de la brisure variable selon l'écran (38 % à 72 % relevés).

---

## 5. Composant Card (le composant unique du site)

Réutilisé partout : accueil, rubrique, « à lire aussi », états d'erreur, back-office.

**Structure, dans l'ordre :**
1. **Image 16:9 stricte** en haut (`aspect-ratio:16/9`, fond `--surface`, `object-fit:cover`).
2. **Eyebrow** = rubrique (Archivo 11px MAJUSCULES). Optionnellement précédé d'un **numéro** de Une en accent (`01 · Rubrique`).
3. **Titre** — Archivo 20px, **3 lignes maximum** puis troncature (`-webkit-line-clamp:3`).
4. **Méta** = date (Instrument Sans 13px, couleur `--muted`).

**Règles :**
- Pas de chapô (sauf le héros de la Une), pas de bouton, pas de « lire la suite » : **la card entière est cliquable**.
- **Survol :** zoom image `scale(1.03)` + soulignement du titre, **150 ms**. Aucun autre effet, aucune ombre.
- **Cas sans image :** pas de vignette ; à la place un **filet supérieur 2 px en `--ink`** (`border-top`), puis eyebrow → titre → date.
- **Variante « grand » (feature) :** titre 32px, interligne 1.15, `padding-top` 20px.
- **Card sombre isolée (planche) :** encadrée d'un aplat `--paper` avec `padding:12px`.

---

## 6. Écarts constatés (maquette ≠ système idéal — conservés tels quels)

- **Gouttière mobile à 20 px** (et non 24 px) : tout le contenu mobile est en `padding:0 20px`.
- **Rail de navigation à deux largeurs :** 248 px côté site public, 240 px côté back-office.
- **Titre héros non uniforme :** la planche de style le définit en `clamp(2.5rem,4vw,4rem)/800`, mais l'accueil l'affiche en **52px/700** (desktop), la rubrique en **72px/800**, l'article en **56px/800**. Trois tailles distinctes pour un même rôle.
- **Accent au-delà des trois usages canoniques**, tel que relevé :
  - eyebrow **« À la une »** de l'accueil, et **kicker de rubrique** en tête d'article, colorés en accent (texte) ;
  - **rang** dans la table du back-office et **numéro de page actif** de la pagination, en accent ;
  - **cible d'insertion** du glisser-déposer (trait 2 px) et **« Déplacement en cours… »** en accent ;
  - lien **« Réessayer »** des pages d'erreur en accent ;
  - **H2 actif** de la barre d'outils de l'éditeur : fond `--surface` + texte accent (désigné comme « le seul endroit où l'accent touche l'interface »).
- **Rouge d'erreur hors palette :** `#C81E1E` (clair) / `#FF6B6B` (sombre) pour le message et les filets d'erreur de la connexion.
- **Padding de section réel** (40–64 px vertical) plus court que l'« écart de sections » nominal de 80 px, qui correspond en fait à l'espacement entre cadres sur les planches.
- **Numéro de héros surdimensionné :** « 01 » de la Une à **46px/800** (desktop) / 38px (mobile), au-delà de l'échelle typographique documentée.
- **Photos = placeholders `picsum.photos`** (`seed` stable par article) dans toute la maquette ; à remplacer par les vraies images.
