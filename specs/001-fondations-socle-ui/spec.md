# Feature Specification: Fondations — socle visuel et structurel

**Feature Branch**: `001-fondations-socle-ui` *(répertoire de feature ; aucune branche créée — pas de hook `before_specify` configuré)*

**Created**: 2026-07-18

**Status**: Draft

**Input**: User description: « Feature Fondations. Elle met en place le socle visuel et structurel réutilisé par tout le site — sans aucune page de contenu réelle. La structure de référence est `docs/design/html/accueil.html`. »

## Contexte et portée

Fondations livre la **charpente** que toutes les pages du site réutiliseront : le cadre, la
colonne de navigation latérale, le pied de page, la vignette d'article, le filet de
séparation signature, et la bascule de thème. Aucune page éditoriale réelle (accueil,
rubrique, article, back-office) n'est livrée ici : elles constituent d'autres features et
se poseront sur ce socle sans le rediscuter.

La constitution du projet (v1.0.0) désigne explicitement Fondations comme le lieu où se
décident **une seule fois** deux points restés ouverts : la frontière entre filet ordinaire
et filet coupé (arbitrage 3) et le raccordement du mot-symbole (arbitrage 4). Cette
spécification les porte au niveau des exigences ; ils sont tranchés ci-dessous.

## Clarifications

### Session 2026-07-18

- **Mot-symbole** (constitution, arbitrage 4) → Les **deux** ressources de marque
  existantes servent partout : la déclinaison sombre sur fond clair, la claire sur fond
  sombre, dans la colonne de navigation comme dans le pied de page, à deux tailles.
  **Aucune déclinaison « bloc » n'est produite** ; les références des maquettes à des
  fichiers « bloc » sont sans objet. → FR-042, FR-042a.
- **Frontière filet ordinaire / filet coupé** (constitution, arbitrage 3) → Règle
  d'en-tête : le filet coupé sépare deux blocs dont **chacun est introduit par son propre
  en-tête** ; partout ailleurs le filet est ordinaire. Contrôle mécanique, sans jugement.
  Cette règle valide les maquettes en l'état — elle explique le filet *ordinaire* des
  passages titre → grille et grille → pagination de `rubrique.html`, et le filet *coupé*
  entre les blocs titrés de `accueil.html`, sans qu'aucun écran n'ait à être corrigé.
  → FR-037, FR-037a.
- **Périmètre de l'accès à la recherche** → Fondations ne livre que le **point d'entrée** :
  un contrôle réel, libellé, atteignable au clavier, menant vers la page de résultats. Ni
  champ de saisie, ni panneau, ni écran de résultats. → FR-008, FR-008a.

**Suite à donner hors de cette feature** : les deux premiers points ferment des arbitrages
de la constitution v1.0.0. Celle-ci exige qu'ils « se referment par amendement, pas par
usage tacite » : un amendement de `.specify/memory/constitution.md` devra retirer les
arbitrages 3 et 4 de la section « Arbitrages en attente » et y consigner les règles
retenues.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - La charpente et la navigation latérale (Priority: P1)

Un visiteur ouvre une page du site. Il voit une page tenue dans un cadre centré, borné en
largeur et cerné d'un filet. À l'intérieur, deux zones côte à côte : une colonne de
navigation à gauche qui court sur toute la hauteur, et le contenu à droite. Dans cette
colonne il trouve, de haut en bas, la marque, un accès à la recherche, la liste verticale
des huit rubriques — chacune précédée d'un pictogramme au trait — et, poussé tout en bas,
l'interrupteur de thème accompagné de son libellé. La rubrique correspondant à la page
qu'il consulte est signalée comme telle. Il peut parcourir toute cette colonne au clavier,
en voyant à chaque instant où se trouve le focus.

**Why this priority**: c'est la structure dont tout le reste dépend. Sans cadre ni colonne
de navigation, ni le pied de page, ni la vignette, ni le filet n'ont d'endroit où exister.
Livrée seule, elle constitue déjà un socle navigable et vérifiable.

**Independent Test**: ouvrir la page de démonstration au clavier uniquement et parcourir la
colonne de navigation de la marque jusqu'à l'interrupteur de thème ; vérifier la largeur du
cadre, la présence du filet vertical de séparation, l'ordre des huit rubriques et le
signalement de la rubrique courante.

**Acceptance Scenarios**:

1. **Given** une fenêtre de 1440 px de large, **When** le visiteur affiche une page,
   **Then** la page est contenue dans un cadre centré d'au plus 1440 px cerné d'un filet de
   1 px, avec la colonne de navigation à gauche et le contenu à droite.
2. **Given** une fenêtre plus large que 1440 px, **When** le visiteur affiche une page,
   **Then** le cadre reste centré et ne s'étire pas au-delà de sa largeur maximale.
3. **Given** la colonne de navigation affichée, **When** le visiteur la parcourt de haut en
   bas, **Then** il rencontre dans cet ordre : la marque, l'accès à la recherche, les huit
   rubriques (Environnement, Sport, Éducation, Santé, Diplomatie, Culture, Technologie,
   Économie), puis — détaché en bas de colonne — l'interrupteur de thème et son libellé.
4. **Given** une page rattachée à la rubrique « Culture », **When** elle s'affiche,
   **Then** « Culture » est la seule rubrique signalée comme courante, visuellement et pour
   les technologies d'assistance.
5. **Given** une page rattachée à aucune rubrique, **When** elle s'affiche, **Then** aucune
   rubrique n'est signalée comme courante.
6. **Given** le focus au clavier sur la marque, **When** le visiteur l'active, **Then** il
   est ramené à l'accueil.
7. **Given** une navigation exclusivement au clavier, **When** le visiteur tabule dans la
   colonne, **Then** chaque élément atteint porte un repère de focus visible, dans le thème
   clair comme dans le thème sombre.

---

### User Story 2 - Une bascule de thème qui fonctionne (Priority: P2)

Un visiteur dont le système est réglé en sombre ouvre le site : il s'affiche en sombre, dès
la première image affichée, sans passer par un état clair. Il préfère finalement le thème
clair : il actionne l'interrupteur en bas de la colonne, le site bascule. Il navigue vers
une autre page, ferme son navigateur, revient plus tard : le site est toujours clair.

**Why this priority**: la constitution impose le double thème sans flash et avec choix
persistant, et la maquette ne fournit qu'un dessin d'interrupteur sans comportement. C'est
le seul véritable comportement de cette feature, et celui qui présente le plus de risque.

**Independent Test**: régler le système en sombre, ouvrir la page de démonstration et
constater l'absence de tout affichage transitoire en clair ; basculer, recharger dix fois,
naviguer, revenir : le thème choisi tient.

**Acceptance Scenarios**:

1. **Given** un visiteur qui n'a jamais exprimé de choix et un système réglé en sombre,
   **When** il ouvre une page, **Then** la page s'affiche en sombre.
2. **Given** un visiteur qui n'a jamais exprimé de choix et un système réglé en clair,
   **When** il ouvre une page, **Then** la page s'affiche en clair.
3. **Given** une page affichée, **When** le visiteur actionne l'interrupteur de thème,
   **Then** l'ensemble de la page passe dans l'autre thème, colonne de navigation, contenu
   et pied de page compris.
4. **Given** un thème forcé par le visiteur, **When** il navigue vers une autre page puis
   recharge, **Then** le thème forcé est toujours celui affiché.
5. **Given** un thème forcé par le visiteur, **When** la page se charge, **Then** à aucun
   instant l'autre thème n'est visible, même brièvement.
6. **Given** un visiteur qui n'a jamais exprimé de choix, **When** il change la préférence
   de son système, **Then** le site suit ce changement.
7. **Given** l'interrupteur atteint au clavier, **When** le visiteur l'actionne au clavier,
   **Then** la bascule s'opère et l'état courant du thème est annoncé aux technologies
   d'assistance.

---

### User Story 3 - Le socle sur petit écran (Priority: P3)

Un visiteur sur téléphone ouvre le site. La colonne latérale n'occupe plus l'écran en
permanence : une barre supérieure minimale porte la marque, un bouton d'ouverture du menu
et l'interrupteur de thème. Le contenu occupe toute la largeur disponible. En ouvrant le
menu, il retrouve exactement la même liste de rubriques, dans le même ordre, avec les mêmes
pictogrammes, et peut la refermer au clavier.

**Why this priority**: les maquettes ne couvrent pas le petit écran, et la constitution
exige que ce comportement se décide **une seule fois, en Fondations**. Toutes les features
suivantes s'y conformeront sans le rediscuter — le décider tard coûterait une reprise de
chaque page.

**Independent Test**: afficher la page de démonstration à 375 px puis à 999 px et à
1000 px ; vérifier le basculement de la colonne vers la barre supérieure, l'ouverture et la
fermeture du menu au clavier, et l'absence de tout défilement horizontal.

**Acceptance Scenarios**:

1. **Given** une fenêtre de moins de 1000 px de large, **When** la page s'affiche,
   **Then** la colonne latérale n'est plus affichée en permanence et une barre supérieure
   portant la marque, le bouton d'ouverture du menu et l'interrupteur de thème la remplace.
2. **Given** une fenêtre de 1000 px de large ou plus, **When** la page s'affiche,
   **Then** la colonne latérale est affichée en permanence et la barre supérieure disparaît.
3. **Given** une fenêtre de moins de 1000 px, **When** la page s'affiche, **Then** le
   contenu occupe toute la largeur disponible, gouttières comprises.
4. **Given** la barre supérieure affichée, **When** le visiteur ouvre le menu, **Then** un
   panneau présente les huit rubriques dans le même ordre, avec les mêmes pictogrammes et
   le même signalement de la rubrique courante que la colonne latérale.
5. **Given** le menu ouvert, **When** le visiteur appuie sur la touche d'échappement,
   **Then** le panneau se ferme et le focus revient au bouton qui l'a ouvert.
6. **Given** le menu ouvert, **When** le visiteur tabule, **Then** le focus reste à
   l'intérieur du panneau tant qu'il est ouvert.
7. **Given** une largeur de 375 px, **When** la page s'affiche, **Then** aucun élément ne
   déborde, ne se chevauche, ni ne provoque de défilement horizontal.

---

### User Story 4 - La vignette d'article, un composant unique (Priority: P4)

Un intégrateur ouvre la page de démonstration et voit le composant de vignette dans ses
trois états côte à côte : au repos, au survol, et sans image. Chaque vignette montre une
image au format 16:9, la rubrique en petites capitales, un titre limité à trois lignes, et
une date. La vignette entière est cliquable ; aucun bouton, aucun « lire la suite ».

**Why this priority**: la constitution impose un composant Card **unique**, réutilisé
partout. Le fixer ici évite que chaque page suivante en invente une variante. Il n'est
toutefois utile qu'une fois la charpente en place.

**Independent Test**: constater sur la page de démonstration les trois états déclarés,
survoler puis atteindre la vignette au clavier, vérifier la troncature du titre à trois
lignes avec un titre long, et l'absence de vignette dans l'état « sans image ».

**Acceptance Scenarios**:

1. **Given** une vignette au repos, **When** elle s'affiche, **Then** elle présente dans
   cet ordre une image au format 16:9, la rubrique en petites capitales, un titre, une date.
2. **Given** un titre plus long que trois lignes, **When** la vignette s'affiche,
   **Then** le titre est tronqué à trois lignes et la hauteur de la vignette reste stable.
3. **Given** une vignette, **When** le pointeur la survole, **Then** l'image s'agrandit
   légèrement et le titre se souligne, en un mouvement bref ; aucun autre effet n'apparaît.
4. **Given** une vignette, **When** elle reçoit le focus au clavier, **Then** elle présente
   un retour visuel équivalent à celui du survol, en plus du repère de focus.
5. **Given** un article sans image, **When** sa vignette s'affiche, **Then** aucune zone
   d'image n'est réservée ; un filet supérieur épais la remplace, suivi de la rubrique, du
   titre et de la date.
6. **Given** la préférence système « mouvement réduit », **When** le visiteur survole une
   vignette, **Then** aucune animation ne se déclenche.
7. **Given** une vignette portant une image, **When** elle s'affiche, **Then** l'image
   porte un texte alternatif réel, jamais vide.
8. **Given** une vignette quelconque, **When** le visiteur clique n'importe où dessus,
   **Then** il est mené vers l'article ; la vignette ne comporte ni bouton ni lien « lire
   la suite ».

---

### User Story 5 - Le filet de séparation signature (Priority: P5)

Un visiteur parcourt une page comportant plusieurs sections. Entre deux sections, il ne
rencontre pas un trait droit ordinaire mais un filet qui se brise une seule fois, reprenant
l'angle de la marque. D'une section à l'autre, la brisure ne tombe pas au même endroit sur
la largeur.

**Why this priority**: c'est l'ornement signature du site, et la constitution en limite
strictement les apparitions. Le composant doit exister avant que les pages de contenu ne
s'en servent, mais il n'est pas bloquant pour le reste du socle.

**Independent Test**: afficher sur la page de démonstration plusieurs filets de séparation
avec des positions de brisure différentes, et vérifier que la brisure reproduit l'angle de
la marque et ne se produit qu'une seule fois.

**Acceptance Scenarios**:

1. **Given** deux sections successives, **When** la page s'affiche, **Then** elles sont
   séparées par un filet de 1 px qui se brise une seule fois, la partie droite reprenant
   plus haut que la partie gauche.
2. **Given** un filet de séparation, **When** on mesure la brisure, **Then** elle présente
   4 px de dénivelé sur 64 px parcourus, soit le même angle que la coupe de la marque.
3. **Given** plusieurs filets sur une même page, **When** la page s'affiche, **Then** la
   position de la brisure sur la largeur diffère d'un filet à l'autre, chacune étant
   réglable au cas par cas.
4. **Given** un lecteur d'écran, **When** il parcourt la page, **Then** le filet de
   séparation n'est pas annoncé : il est purement décoratif.
5. **Given** l'ensemble des écrans livrés, **When** on recense les éléments portant la
   diagonale, **Then** on n'en trouve que deux : la marque et le filet de séparation.

---

### User Story 6 - Le pied de page (Priority: P6)

Arrivé au bas d'une page, un visiteur trouve le pied de page sous le contenu, dans la
colonne de droite — jamais sous la colonne de navigation. Il y retrouve la marque, le
rappel des huit rubriques, des liens d'information et des liens à suivre.

**Why this priority**: complète la charpente et clôt visuellement la page. C'est la partie
la moins risquée et la moins bloquante du socle.

**Independent Test**: dérouler la page de démonstration jusqu'en bas et vérifier
l'alignement du pied de page sur la colonne de contenu, la présence des huit rubriques et
des deux groupes de liens, dans les deux thèmes.

**Acceptance Scenarios**:

1. **Given** une page sur grand écran, **When** le visiteur atteint le bas, **Then** le
   pied de page occupe la colonne de contenu et commence à droite du filet vertical de la
   colonne de navigation.
2. **Given** le pied de page affiché, **When** le visiteur le parcourt, **Then** il y trouve
   la marque accompagnée de sa signature, les huit rubriques, un groupe de liens
   d'information et un groupe de liens à suivre.
3. **Given** le pied de page affiché, **When** le visiteur active une rubrique, **Then** il
   est mené vers la même destination que depuis la colonne de navigation.
4. **Given** une largeur de 375 px, **When** le pied de page s'affiche, **Then** ses groupes
   s'empilent sans débordement ni chevauchement.

---

### Edge Cases

- **Titre de vignette anormalement long, ou sans espace** : le titre est tronqué à trois
  lignes et ne provoque ni débordement ni élargissement de la vignette.
- **Rubrique dont le libellé est le plus long (« Environnement »)** : elle tient sur une
  seule ligne dans la colonne de 248 px, sans coupure ni chevauchement du pictogramme.
- **Image de couverture absente ou impossible à charger** : la vignette bascule sur l'état
  « sans image » plutôt que d'afficher une zone vide ou un symbole d'image brisée.
- **Mémorisation du thème indisponible** (stockage refusé ou navigation privée) : le site
  reste utilisable et retombe sur la préférence du système, sans erreur visible.
- **Redimensionnement de la fenêtre en franchissant 1000 px alors que le menu est ouvert** :
  la colonne latérale reprend sa place et le menu ne subsiste pas en surimpression.
- **Fenêtre très basse en hauteur** : l'interrupteur de thème reste atteignable en bas de
  la colonne de navigation, celle-ci défilant si nécessaire, sans recouvrir le contenu.
- **Page rattachée à aucune rubrique connue** : aucune rubrique n'est signalée comme
  courante, plutôt qu'un signalement par défaut arbitraire.
- **Texte agrandi par le visiteur (jusqu'à 200 %)** : la colonne, le menu et la vignette
  restent lisibles et sans chevauchement.

## Requirements *(mandatory)*

### Exigences de charpente

- **FR-001**: Le site MUST présenter chaque page dans un cadre centré d'au plus 1440 px de
  large, cerné d'un filet de 1 px ; au-delà de cette largeur de fenêtre, le cadre reste
  centré sans s'étirer.
- **FR-002**: Le cadre MUST contenir exactement deux zones côte à côte : la colonne de
  navigation à gauche et la zone de contenu à droite, la colonne s'étendant sur toute la
  hauteur du cadre.
- **FR-003**: La navigation principale MUST être une colonne latérale gauche de 248 px de
  large, séparée du contenu par un filet vertical de 1 px — en aucun cas une barre
  horizontale supérieure, en aucun cas une colonne de droite.
- **FR-004**: La colonne de navigation MUST présenter ses éléments dans cet ordre, de haut
  en bas : la marque, l'accès à la recherche, la liste des huit rubriques, puis —
  positionné en bas de colonne, détaché du reste — l'interrupteur de thème accompagné de
  son libellé.
- **FR-005**: Les huit rubriques MUST apparaître dans l'ordre invariable Environnement,
  Sport, Éducation, Santé, Diplomatie, Culture, Technologie, Économie, chacune précédée
  d'un pictogramme au trait, monochrome, adoptant la couleur du texte voisin.
- **FR-006**: La marque MUST être un lien ramenant à l'accueil, dans la colonne de
  navigation comme dans la barre supérieure du petit écran.
- **FR-007**: Le site MUST signaler la rubrique de la page réellement affichée, à la fois
  visuellement et auprès des technologies d'assistance ; une seule rubrique au plus est
  signalée à la fois, et aucune lorsque la page n'appartient à aucune rubrique.
- **FR-008**: La colonne de navigation MUST offrir un point d'entrée vers la recherche : un
  contrôle réel, libellé « Rechercher », atteignable et actionnable au clavier, menant vers
  la page de résultats de recherche.
- **FR-008a**: Fondations MUST NOT livrer de champ de saisie, de panneau de recherche ni
  d'écran de résultats : ils relèvent de la feature de recherche. Le point d'entrée n'est
  pas pour autant un leurre — il est atteignable, correctement annoncé, et sa destination
  est celle que livrera cette feature.
- **FR-009**: La zone de contenu MUST borner sa largeur de lecture à 1280 px et appliquer
  une gouttière de 24 px sur grand écran, 20 px sur petit écran.
- **FR-010**: Le socle MUST être réutilisable tel quel par toute page ultérieure : une
  nouvelle page obtient le cadre, la colonne de navigation et le pied de page sans en
  redéclarer aucun élément, et déclare seulement la rubrique à laquelle elle se rattache.

### Exigences de thème

- **FR-011**: Le site MUST exister intégralement en thème clair et en thème sombre ; tout
  élément livré par cette feature est rendu dans les deux.
- **FR-012**: À la première visite, le site MUST adopter la préférence de thème du système
  d'exploitation du visiteur.
- **FR-013**: Le visiteur MUST pouvoir forcer l'autre thème depuis l'interrupteur de la
  colonne de navigation, et depuis celui de la barre supérieure sur petit écran.
- **FR-014**: Le choix de thème du visiteur MUST être mémorisé sur son appareil et survivre
  à une navigation, à un rechargement et à la fermeture du navigateur.
- **FR-015**: Le thème retenu MUST être celui du tout premier affichage : à aucun moment
  l'autre thème ne doit être visible, même brièvement, au chargement ou au rechargement.
- **FR-016**: Tant que le visiteur n'a exprimé aucun choix, le site MUST refléter les
  changements ultérieurs de la préférence système.
- **FR-017**: L'interrupteur de thème MUST porter un libellé textuel décrivant l'action, et
  exposer son état courant aux technologies d'assistance.
- **FR-018**: Les couples texte/fond MUST satisfaire le niveau AA dans les deux thèmes ; la
  couleur d'accent n'ayant pas la même valeur d'un thème à l'autre, elle est mesurée
  séparément dans chacun.

### Exigences de petit écran

- **FR-019**: En dessous de 1000 px de largeur de fenêtre, le site MUST cesser d'afficher la
  colonne latérale en permanence et la remplacer par une barre supérieure minimale portant
  la marque, un bouton d'ouverture du menu et l'interrupteur de thème.
- **FR-020**: À 1000 px et au-delà, le site MUST afficher la colonne latérale en permanence
  et masquer la barre supérieure.
- **FR-021**: Le menu de petit écran MUST présenter la même liste des huit rubriques, dans
  le même ordre, avec les mêmes pictogrammes et le même signalement de la rubrique courante
  que la colonne latérale.
- **FR-022**: Le menu de petit écran MUST être refermable au clavier par la touche
  d'échappement ainsi que par un contrôle de fermeture visible ; tant qu'il est ouvert, le
  focus reste à l'intérieur du panneau, et il revient au bouton d'ouverture à la fermeture.
- **FR-023**: En dessous de 1000 px, le contenu MUST occuper toute la largeur disponible.
- **FR-024**: Le site MUST NOT produire, entre 375 px et 1440 px de largeur, de défilement
  horizontal, de débordement ni de chevauchement d'éléments.

### Exigences de vignette d'article

- **FR-025**: Le site MUST fournir un composant de vignette d'article **unique** ; toute
  vignette du site en découle, et ses variantes légitimes sont déclarées dans le composant
  plutôt qu'improvisées page par page.
- **FR-026**: La vignette MUST présenter, dans cet ordre : une image au format 16:9 stricte,
  la rubrique en petites capitales, un titre limité à trois lignes puis tronqué, et une date.
- **FR-027**: La vignette entière MUST être cliquable ; elle ne comporte ni bouton, ni lien
  « lire la suite », ni chapô.
- **FR-028**: Au survol, la vignette MUST agrandir légèrement son image et souligner son
  titre, en un mouvement bref, sans aucun autre effet.
- **FR-029**: Le focus clavier MUST produire sur la vignette un retour visuel équivalent au
  survol, en plus du repère de focus.
- **FR-030**: En l'absence d'image, la vignette MUST supprimer la zone d'image et la
  remplacer par un filet supérieur épais dans la couleur du texte, suivi de la rubrique, du
  titre et de la date.
- **FR-031**: Toute image de couverture MUST porter un texte alternatif réel ; un texte
  alternatif vide est un défaut.
- **FR-032**: Les trois états de la vignette — repos, survol, sans image — MUST être
  observables simultanément sur la page de démonstration.

### Exigences de filet de séparation

- **FR-033**: Le séparateur entre deux sections MUST être un filet de 1 px se brisant une
  seule fois, la partie droite reprenant plus haut que la partie gauche.
- **FR-034**: La brisure MUST présenter 4 px de dénivelé pour 64 px parcourus, soit le même
  angle que la coupe portée par la marque.
- **FR-035**: La position de la brisure sur la largeur MUST être un paramètre du composant,
  réglable indépendamment à chaque emploi, afin qu'elle varie d'une section à l'autre.
- **FR-036**: Le filet de séparation MUST être décoratif et ignoré par les technologies
  d'assistance.
- **FR-037**: Le site MUST appliquer la règle de frontière suivante entre les deux filets :
  le **filet coupé** sépare deux blocs dont **chacun est introduit par son propre en-tête de
  bloc** — titre de section, kicker nommant le bloc, ou bloc de marque du pied de page.
  Partout ailleurs, y compris à l'intérieur d'un bloc déjà introduit (titre → grille,
  grille → pagination, sous un champ, sous une ligne de tableau), le filet est **ordinaire**.
- **FR-037a**: Le contrôle de cette règle MUST être mécanique et ne demander aucun
  jugement : un nouvel en-tête de bloc de part et d'autre du filet ⇒ filet coupé ; sinon ⇒
  filet ordinaire.
- **FR-038**: Sur l'ensemble des écrans livrés, la diagonale MUST n'apparaître qu'à deux
  endroits : la marque et le filet de séparation.

### Exigences de pied de page

- **FR-039**: Le pied de page MUST se placer sous le contenu, à l'intérieur de la colonne de
  droite, et jamais sous la colonne de navigation.
- **FR-040**: Le pied de page MUST présenter la marque accompagnée de sa signature, le
  rappel des huit rubriques, un groupe de liens d'information et un groupe de liens à suivre.
- **FR-041**: Les rubriques du pied de page MUST mener aux mêmes destinations que celles de
  la colonne de navigation.
- **FR-042**: Le mot-symbole MUST être servi depuis les **deux seules** ressources de marque
  existantes du projet : la déclinaison sombre sur fond clair, la déclinaison claire sur
  fond sombre. Ces deux mêmes ressources servent la colonne de navigation et le pied de
  page, à deux tailles distinctes.
- **FR-042a**: Le site MUST NOT employer de déclinaison « bloc » distincte pour le pied de
  page : celui-ci reprend le même dessin, à sa propre taille. Les références des maquettes à
  des fichiers « bloc » sont sans objet et ne doivent pas être reproduites.

### Exigences de boutons et de champs

*Ajoutées le 2026-07-18 après arbitrage du porteur du projet : boutons et champs sont des
composants du socle. Toutes les valeurs sont relevées dans `docs/design/html/guide-de-style.html`
et `docs/design/html/connexion.html`.*

- **FR-050**: Le site MUST fournir un composant de bouton unique, décliné en quatre variantes
  déclarées — primaire, secondaire, tertiaire, indisponible. Aucun écran n'improvise une
  cinquième variante.
- **FR-051**: Le bouton primaire MUST être plein dans la couleur du texte principal, son
  libellé dans la couleur du fond de page. Au survol, son fond s'éclaircit en thème clair et
  s'assombrit en thème sombre — sans ombre, sans déplacement, sans aucun autre effet.
- **FR-052**: L'accent MUST NOT toucher un bouton, dans aucune variante : ni en fond, ni en
  bordure, ni en libellé.
- **FR-053**: Le site MUST fournir un composant de champ couvrant la saisie sur une ligne, la
  saisie multiligne et la case à cocher, chacun associé à un libellé.
- **FR-054**: Le champ de saisie MUST se souligner d'un filet ordinaire ; à la prise de focus,
  ce filet passe dans la couleur du texte principal.
- **FR-055**: Tout bouton et tout champ MUST porter **en outre** le repère de focus visible du
  site. Les maquettes posent `outline:none` sans remplacement ; le principe VIII de la
  constitution prime et impose un repère visible — c'est le seul domaine où les maquettes ne
  sont pas suivies.
- **FR-056**: Le champ MUST pouvoir signaler une erreur, par un message et un filet dans le
  rouge d'erreur hors palette — jamais dans l'accent, qui ne signale rien.

### Exigences transverses de sobriété et d'accessibilité

- **FR-043**: Le site MUST NOT présenter de rayon de bordure non nul, d'ombre portée ni de
  dégradé, sur aucun élément livré.
- **FR-044**: Tout élément interactif MUST porter un repère de focus visible, dans les deux
  thèmes, sans exception.
- **FR-045**: L'intégralité du socle MUST être parcourable au clavier seul, dans un ordre de
  tabulation conforme à l'ordre visuel de lecture.
- **FR-046**: Toute animation MUST être neutralisée lorsque le visiteur exprime une
  préférence système pour un mouvement réduit.
- **FR-047**: L'interface MUST être rédigée en français, avec une orthographe et des
  diacritiques corrects.
- **FR-048**: Le site MUST offrir une page de démonstration, à la route `/styleguide`,
  montrant simultanément la colonne de navigation, le pied de page, la vignette dans ses
  trois états et le filet de séparation dans plusieurs positions de brisure.
- **FR-048a**: Cette page MUST reprendre **toutes** les sections de
  `docs/design/html/guide-de-style.html` — mêmes sections, mêmes états de composants, section
  « Boutons & champs » comprise. La correspondance porte sur les sections et les états, non
  sur l'enveloppe : la maquette du guide est une planche autonome, alors que `/styleguide` est
  rendue dans le cadre et la colonne de navigation exigés par FR-048.
- **FR-049**: Cette feature MUST NOT livrer de page de contenu réelle — ni accueil, ni
  rubrique, ni article, ni écran de back-office : elle livre le socle sur lequel ces pages
  se poseront.

### Key Entities

- **Rubrique** : l'une des huit catégories éditoriales du site. Porte un libellé, un rang
  invariable dans la liste, un pictogramme au trait et une destination. Sert à alimenter la
  colonne de navigation, le menu de petit écran et le pied de page, et à signaler la page
  courante.
- **Préférence de thème** : le choix de thème exprimé par un visiteur sur son appareil.
  Trois situations : aucun choix exprimé (le système décide), clair forcé, sombre forcé.
  Locale à l'appareil, elle n'est rattachée à aucun compte.
- **Aperçu d'article** : le jeu minimal d'informations dont la vignette a besoin — image de
  couverture et son texte alternatif (les deux facultatifs ensemble), rubrique, titre, date,
  destination. Fondations n'en définit que la présentation ; leur provenance relève des
  features de contenu.
- **Mot-symbole** : la marque du site, porteuse de la coupe signature, déclinée selon le
  thème actif et selon son emplacement (colonne de navigation, pied de page).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Une page de démonstration unique permet de constater les quatre livrables du
  socle — colonne de navigation, pied de page, vignette dans ses trois états, filet de
  séparation — sans avoir à naviguer ailleurs.
- **SC-002**: Aux largeurs 375, 768, 999, 1000 et 1440 px, dans les deux thèmes, aucune page
  ne produit de défilement horizontal, de débordement ni de chevauchement — 0 occurrence.
- **SC-003**: 100 % des éléments interactifs du socle sont atteignables et actionnables au
  clavier seul, avec un repère de focus visible à chaque étape, dans les deux thèmes.
- **SC-004**: Sur dix chargements consécutifs après un choix de thème, le thème affiché est
  le thème choisi dans 10 cas sur 10, et l'autre thème n'apparaît à aucun instant, y compris
  fugitivement.
- **SC-005**: Tous les couples texte/fond du socle atteignent au minimum 4,5:1 pour le texte
  courant et 3:1 pour le texte de grande taille et les repères non textuels, mesurés
  séparément dans le thème clair et dans le thème sombre.
- **SC-006**: Sur petit écran, le menu s'ouvre, se parcourt et se referme intégralement au
  clavier, et le focus revient au bouton d'ouverture dans 100 % des fermetures.
- **SC-007**: Le recensement des éléments portant la diagonale sur l'ensemble des écrans
  livrés en donne exactement deux : la marque et le filet de séparation.
- **SC-008**: Le recensement des rayons de bordure non nuls, des ombres portées et des
  dégradés sur les écrans livrés en donne 0 de chacun.
- **SC-009**: Aucune image de couverture de la page de démonstration ne porte de texte
  alternatif vide — 0 occurrence.
- **SC-010**: Sous préférence de mouvement réduit, aucune animation ne subsiste sur les
  écrans livrés — 0 occurrence.
- **SC-011**: Une page de contenu construite ultérieurement obtient le cadre, la colonne de
  navigation et le pied de page sans redéfinir aucun de leurs éléments, et se limite à
  déclarer sa rubrique courante.

## Assumptions

- **Point de rupture fixé à 1000 px.** L'énoncé indique « environ 1000 px » ; la valeur
  retenue est 1000 px exactement, la colonne latérale s'affichant à partir de cette largeur
  incluse. Cette décision vaut pour toutes les features suivantes.
- **Largeur de colonne à 248 px.** L'énoncé indique « environ 250 px » ; la valeur retenue
  est celle des sources de design du projet, soit 248 px côté site public.
- **La page de démonstration est la planche de style, à la route `/styleguide`.** Elle
  reprend les sections de `docs/design/html/guide-de-style.html` — mêmes sections, mêmes états
  de composants — et n'est pas référencée depuis la navigation publique.
  *Révision du 2026-07-18 : cette hypothèse remplace une version antérieure qui excluait la
  planche de style complète du périmètre. Voir aussi la réserve sur « Boutons & champs »
  ci-dessous.*
- **Boutons et champs font partie du socle** — arbitrage du porteur du projet, 2026-07-18.
  La planche de style les présente, et `connexion.html` comme le back-office en dépendront :
  les découvrir plus tard imposerait une reprise. Ils sont donc spécifiés ici (FR-050 à
  FR-056), avec leurs valeurs relevées dans les maquettes.
- **L'interrupteur de thème est binaire.** Il fait passer d'un thème à l'autre, conformément
  au dessin des maquettes qui ne montre qu'un seul contrôle et un seul libellé. Aucun moyen
  de revenir explicitement à « suivre le système » n'est livré ici ; l'ajouter plus tard
  reste possible sans remettre en cause ce socle.
- **Les rubriques pointent vers leurs destinations définitives** même si les pages
  correspondantes n'existent pas encore : Fondations pose les liens, les features de contenu
  livrent les pages.
- **Les pictogrammes des huit rubriques sont ceux des maquettes**, repris tels quels ; ils
  font partie du système et ne sont ni redessinés ni remplacés ici.
- **Les images de la page de démonstration sont des substituts neutres**, sans dépendance à
  un service externe ; les vraies images relèvent des features de contenu.
- **Hors périmètre** : toute page éditoriale (accueil, rubrique, article), tout écran de
  back-office, les états d'erreur et de chargement, la variante « squelette » de la vignette,
  la variante « grand » de la vignette, l'authentification, et toute base de données.
- **Le socle ne persiste rien d'autre que la préférence de thème**, et ne suppose aucun
  compte utilisateur ni aucune source de données.

## Dépendances

- Sources de design du projet : `docs/design/html/tokens.md` fait foi pour toute valeur ;
  `docs/design/html/accueil.html` fait foi pour la structure du cadre, de la colonne de
  navigation et du pied de page ; `docs/design/html/guide-de-style.html` fait foi pour la
  présentation des trois états de la vignette et du filet de séparation.
- Ressources de marque du projet (`public/brand/`) pour le mot-symbole : les deux fichiers
  existants suffisent, aucune ressource nouvelle n'est à produire (voir FR-042). Reste à
  vérifier à l'intégration que le dessin tient à la taille du pied de page.
- Constitution du projet v1.0.0, dont les portes de qualité 1 à 8 et 11 s'appliquent
  intégralement à cette feature.
