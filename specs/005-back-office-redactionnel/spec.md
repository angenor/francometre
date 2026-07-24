# Feature Specification: Back-office rédactionnel

**Feature Branch**: `005-back-office-redactionnel`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description : « Feature "Back-office rédactionnel". Derrière l'authentification, elle donne à la rédaction les outils pour gérer les articles et la Une. Trois écrans : liste des articles, éditeur d'article, composer la Une. »

## Contexte

Le modèle et ses règles de vie sont posés (feature `002-modele-et-donnees`) : article,
rubrique, une, média, avec la visibilité publique, l'éviction du rang de une, la
publication conditionnée à une couverture décrite, l'assainissement du corps. Les pages
publiques les affichent (`003-pages-publiques`). L'accès à l'administration est protégé
(`004-authentification-redaction`) : la rédaction se connecte, le préfixe `/admin` est
refusé par défaut à qui n'a pas de session.

Cette feature **donne enfin une interface** à ce socle. Elle n'invente aucune règle de
gestion : elle rend manipulables, à la souris et au clavier, des opérations déjà écrites
et testées. Trois écrans, tous derrière l'authentification, tous en thème clair comme
sombre, dans l'identité du site. Leur structure est fixée par les maquettes
`docs/design/html/back-office-articles.html`, `back-office-editeur.html` et
`back-office-composer-la-une.html`.

Elle referme aussi, en le tranchant, l'arbitrage 2 de la constitution (« la Card dans le
back-office ») : les trois dérivés en pixels fixes des maquettes (`.slot`, `.pub`,
`.thumb`) ne passent pas par le composant Card public et n'ont pas à y passer — ce sont
des vignettes d'outil, pas des cartes de lecture.

## Clarifications

### Session 2026-07-23

- Q: Le brouillon s'enregistre-t-il automatiquement, ou seulement sur action explicite ? → A: **Automatique** — sauvegarde périodique pendant la frappe, en plus des deux boutons « Enregistrer le brouillon » et « Publier ».
- Q: Comment une image intégrée au corps est-elle référencée dans le HTML stocké, vu l'interdiction d'URL de média en base ? → A: Par une **adresse interne à l'application** résolue à la lecture (média stocké par clé, comme la couverture) ; aucune URL de fournisseur en base.
- Q: Que fait le glisser-déposer quand on dépose une carte sur une position occupée de la Une ? → A: **Décalage par insertion** — la carte prend la position et les autres se décalent (permutation des cinq rangs), pas un échange deux à deux.
- Q: L'éditeur permet-il de programmer une parution future (embargo) ? → A: **Oui** — une date de publication future est autorisée ; l'article est publié mais reste invisible jusqu'à cette date, selon le modèle.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parcourir et retrouver les articles (Priority: P1)

Un membre de la rédaction ouvre l'administration et voit, dans un tableau dense, **tous**
les articles — brouillons compris. Chaque ligne montre une vignette, le titre, la
rubrique, l'état en un mot, le rang à la une s'il existe, et la date. Il restreint la liste
par une recherche texte, par rubrique, par état, et navigue de page en page quand les
articles sont nombreux. De là, il crée un nouvel article, ou choisit d'en modifier ou d'en
supprimer un.

**Why this priority**: C'est le hub de tout le back-office et le premier écran atteint
après connexion. Sans lui, aucun article n'est retrouvable ni sélectionnable ; les deux
autres écrans n'ont pas de point d'entrée. Il est vérifiable seul, sur les données
d'exemple, sans rien écrire.

**Independent Test**: Se connecter, ouvrir la liste, constater que les articles d'exemple
apparaissent tous (publiés **et** brouillons) avec leurs six colonnes ; filtrer par
rubrique puis par état puis par texte et constater la restriction ; paginer si le nombre
l'exige.

**Acceptance Scenarios**:

1. **Given** des articles d'exemple répartis en plusieurs rubriques, dont des brouillons,
   **When** la rédaction ouvre la liste, **Then** chaque article apparaît sur une ligne
   portant vignette, titre, rubrique, état, rang à la une et date.
2. **Given** un article à l'état brouillon, **When** on regarde sa ligne, **Then** l'état
   se lit en un mot (« Brouillon » / « Publié ») **sans pastille colorée**, et le rang à la
   une s'affiche en numéro (01–05) ou en tiret (« — ») s'il n'est pas à la une.
3. **Given** la liste complète, **When** on choisit une rubrique dans le filtre, **Then**
   seuls les articles de cette rubrique restent ; **When** on choisit un état, **Then** la
   restriction se cumule ; **When** on saisit du texte, **Then** seuls les titres
   correspondants restent.
4. **Given** plus d'articles qu'une page n'en contient, **When** on parcourt la
   pagination, **Then** on atteint chaque article, sans doublon ni disparition, l'ordre
   restant stable entre deux pages.
5. **Given** la liste affichée, **When** on actionne « Nouvel article », **Then** l'éditeur
   s'ouvre sur un article vierge ; **When** on actionne « Modifier » sur une ligne,
   **Then** l'éditeur s'ouvre sur cet article.

---

### User Story 2 - Rédiger un article et enregistrer un brouillon (Priority: P1)

Un membre de la rédaction ouvre l'éditeur, saisit un titre qui a déjà l'allure du titre
publié et un chapô, puis rédige le corps dans un éditeur riche : gras, italique,
intertitres de deux niveaux, listes à puces et numérotées, citation en exergue, lien,
image intégrée, annuler, rétablir. Le texte s'affiche pendant la frappe exactement comme
il paraîtra sur le site. Dans le panneau latéral, il choisit la rubrique, dépose une image
de couverture et en décrit le contenu, éventuellement fixe une date de publication. Il
enregistre le brouillon et le retrouve intact à la réouverture.

**Why this priority**: L'éditeur est le cœur de la feature — « le plus important » selon la
commande. Rédiger et conserver un brouillon est la première valeur livrable : on peut
travailler un article sans encore le publier. Vérifiable seul, sans toucher à la Une.

**Independent Test**: Créer un article, appliquer chaque mise en forme et vérifier qu'elle
s'affiche comme sur le site publié, déposer une couverture avec son texte alternatif,
enregistrer le brouillon, quitter, rouvrir : titre, chapô, corps mis en forme, couverture
et texte alternatif sont là.

**Acceptance Scenarios**:

1. **Given** l'éditeur ouvert sur un article vierge, **When** on saisit le titre et le
   chapô, **Then** ils s'affichent dans la typographie du titre et du chapô publiés, sans
   préfixe de rubrique ni de sous-thème ajouté au titre.
2. **Given** le curseur dans le corps, **When** on applique gras, italique, intertitre de
   niveau 2 ou 3, liste à puces, liste numérotée, citation, lien ou image, **Then** le
   rendu à l'écran est celui de l'article publié, et la barre d'outils indique la mise en
   forme active.
3. **Given** une action de mise en forme, **When** on actionne « annuler » puis
   « rétablir », **Then** l'état précédent revient puis se reprend, sans perte de contenu.
4. **Given** une image déposée en couverture, **When** on la regarde, **Then** elle
   s'affiche dans l'emplacement de couverture, et un champ de texte alternatif accompagne
   la dépose.
5. **Given** un article partiellement rempli, **When** on « enregistre le brouillon »,
   **Then** il est conservé à l'état brouillon même si des champs requis pour la
   publication manquent, et il réapparaît dans la liste comme brouillon.
6. **Given** un brouillon enregistré, **When** on rouvre l'éditeur sur cet article,
   **Then** titre, chapô, corps mis en forme, rubrique, couverture et texte alternatif
   sont restitués tels qu'enregistrés.
7. **Given** un brouillon en cours de frappe, **When** on cesse de saisir un moment sans
   actionner de bouton, **Then** le brouillon est enregistré automatiquement, à l'état
   brouillon, et l'indicateur d'enregistrement se met à jour — sans quitter l'éditeur et
   sans jamais publier.

---

### User Story 3 - Publier un article dans le respect des règles (Priority: P1)

Un membre de la rédaction, ayant complété un article, le publie. La publication n'aboutit
que si le titre, la rubrique, le chapô, le corps et une image de couverture **avec** texte
alternatif sont présents. À défaut, elle est refusée par un message clair désignant ce qui
manque, sans rien publier. Quel que soit le contenu saisi dans l'éditeur riche, seul un
balisage sûr est conservé.

**Why this priority**: Publier est l'aboutissement du travail éditorial et l'endroit où les
garde-fous du modèle deviennent visibles. C'est la règle qui empêche une page publique
trouée ou une couverture sans description. Elle vient après la rédaction, qu'elle
présuppose.

**Independent Test**: Tenter de publier un article auquel manque la couverture, puis le
texte alternatif, puis le chapô, et constater le refus explicite à chaque fois ; compléter
et publier ; vérifier que l'article devient visible du public et que son corps stocké ne
contient que des balises autorisées.

**Acceptance Scenarios**:

1. **Given** un article complet (titre, rubrique, chapô, corps, couverture décrite),
   **When** on actionne « Publier », **Then** l'article passe à l'état publié et devient
   visible du public une fois sa date de publication atteinte.
2. **Given** un article auquel manque la couverture, ou son texte alternatif, ou le chapô,
   ou le corps, ou la rubrique, **When** on actionne « Publier », **Then** la publication
   est refusée par un message qui nomme ce qui manque, et rien n'est publié.
3. **Given** un corps contenant du balisage hors de la liste blanche (par ex. un script ou
   un style collé), **When** on enregistre ou publie, **Then** le corps conservé ne
   contient que le balisage autorisé, l'assainissement se faisant côté serveur avant
   stockage.
4. **Given** un article publié sans date de publication saisie, **When** la publication
   aboutit, **Then** la date retenue est l'instant de la publication, et une dépublication
   suivie d'une republication ne la redate pas.
5. **Given** un article publié, **When** on le repasse à l'état brouillon depuis l'éditeur,
   **Then** il quitte la Une s'il y figurait et disparaît des lectures publiques.
6. **Given** un article complet daté d'une **date de publication future**, **When** on le
   publie, **Then** il passe à l'état publié mais n'apparaît **pas** au public avant que
   cette date soit atteinte (embargo), puis y apparaît sans autre action.

---

### User Story 4 - Composer la Une et fixer l'ordre de l'accueil (Priority: P2)

Un membre de la rédaction ouvre « Composer la Une ». Il voit cinq emplacements numérotés
01 à 05, le premier plus grand (le héros), chacun montrant l'article qui l'occupe ou
signalant qu'il est libre. À côté, une liste des articles publiés **non épinglés**, avec
recherche, d'où il épingle. Il réordonne les cinq par glisser-déposer ; l'ordre qu'il fixe
ici est exactement l'ordre affiché sur l'accueil. Il enregistre.

**Why this priority**: La Une est l'écran d'entrée du site, mais elle se compose au-dessus
d'articles déjà publiés. Elle vient donc après la création, l'édition et la publication.
Sa valeur — piloter la vitrine du site sans toucher au code — est réelle mais seconde.

**Independent Test**: Épingler un article publié sur un emplacement libre, en déplacer un
autre par glisser-déposer, enregistrer, puis ouvrir l'accueil et constater que l'ordre et
le héros correspondent à ce qui a été composé.

**Acceptance Scenarios**:

1. **Given** la Une composée d'articles aux rangs 1 à 5, **When** on ouvre l'écran,
   **Then** chaque emplacement 01–05 montre son article (vignette, rubrique, titre) ou la
   mention « Emplacement libre », l'emplacement 01 étant visiblement le héros.
2. **Given** un emplacement libre et un article publié non épinglé, **When** on l'épingle
   depuis la liste, **Then** il occupe l'emplacement et disparaît de la liste des non
   épinglés.
3. **Given** cinq emplacements déjà occupés, **When** on épingle un article sur un rang
   occupé, **Then** le nouvel article prend le rang et l'occupant précédent quitte la Une —
   jamais deux articles au même rang.
4. **Given** un article **brouillon** qu'on tente d'épingler, **When** on l'épingle,
   **Then** il est d'abord publié puis placé — la mise à la une publie ce qui ne l'était
   pas.
5. **Given** cinq emplacements pourvus, **When** on réordonne par glisser-déposer et qu'on
   enregistre, **Then** l'accueil affiche les articles dans le nouvel ordre, le rang 01
   devenant le héros de l'accueil.
6. **Given** une composition modifiée mais **non** enregistrée, **When** on quitte sans
   enregistrer, **Then** l'accueil reste sur l'ordre précédent — seule l'action
   d'enregistrer publie l'ordre.

---

### User Story 5 - Supprimer un article avec confirmation (Priority: P3)

Un membre de la rédaction supprime un article devenu inutile. Une confirmation lui est
demandée avant l'acte, irréversible. Si l'article occupait un rang de la Une, la
suppression l'en retire au passage plutôt que de laisser un trou.

**Why this priority**: La suppression est un geste d'entretien, moins fréquent que créer ou
publier, et destructeur — il mérite un garde-fou mais n'est pas le cœur de la valeur.

**Independent Test**: Depuis la liste, supprimer un article non épinglé après confirmation
et constater sa disparition ; supprimer un article épinglé et constater qu'il quitte la
Une sans laisser d'emplacement fantôme sur l'accueil.

**Acceptance Scenarios**:

1. **Given** un article dans la liste, **When** on actionne « Supprimer », **Then** une
   confirmation explicite est demandée avant tout effacement.
2. **Given** la confirmation refusée, **When** on l'annule, **Then** l'article demeure
   inchangé.
3. **Given** la confirmation acceptée, **When** on valide, **Then** l'article disparaît
   définitivement de la liste et n'est plus relisible.
4. **Given** un article qui occupe un rang de la Une, **When** on le supprime après
   confirmation, **Then** il est retiré de la Une puis effacé, et l'accueil ne présente
   aucun emplacement orphelin.

---

### Edge Cases

- **Filtres sans résultat** : une combinaison de filtres qui ne retourne aucun article
  affiche un état vide lisible (« aucun article ne correspond »), pas un tableau muet ni
  une erreur.
- **Recherche et pagination combinées** : filtrer réinitialise la pagination à la première
  page ; on ne reste jamais sur une page 5 devenue vide après un filtre.
- **Publication depuis un rang de une déjà plein** : épingler un sixième article n'ajoute
  pas de sixième rang ; il faut occuper l'un des cinq, l'occupant précédent étant évincé.
- **Rang hors intervalle** : aucun rang autre que 1 à 5 n'est proposé ni acceptable.
- **Image de couverture retirée sur un article publié** : retirer la couverture d'un
  article publié doit être empêché ou ramener l'article à l'état brouillon — un article
  publié n'est jamais sans couverture décrite (règle du modèle).
- **Texte alternatif vide à la publication** : un texte alternatif absent ou composé
  uniquement d'espaces vaut absence et fait échouer la publication.
- **Titre trop long** : un titre au-delà de 160 caractères, un chapô au-delà de 300, un
  sous-thème au-delà de 40, sont refusés par un message explicite, jamais tronqués en
  silence.
- **Deux onglets, même article** : deux enregistrements concurrents du même article ne
  produisent pas d'état incohérent ; le dernier enregistrement fait foi, sans perte
  silencieuse d'un rang de une (l'unicité du rang reste garantie côté serveur).
- **Glisser-déposer au clavier** : le réordonnancement de la Une reste réalisable sans
  souris, au clavier, avec un repère de focus visible sur les poignées (contrainte
  d'accessibilité, non dessinée dans la maquette).
- **Session expirée pendant l'édition** : une action d'écriture — y compris un
  enregistrement automatique — tentée après expiration de la session est refusée côté
  serveur et renvoie vers la connexion, sans effet partiel ni perte silencieuse de la
  saisie en cours.

## Requirements *(mandatory)*

### Functional Requirements

**Cadre commun aux trois écrans**

- **FR-001**: Les trois écrans MUST être accessibles uniquement derrière l'authentification
  de la rédaction ; toute route d'affichage et toute action serveur d'administration est
  refusée par défaut à qui n'a pas de session valide, et l'action refusée ne produit aucun
  effet.
- **FR-002**: Les trois écrans MUST reproduire la structure de leurs maquettes respectives
  (`back-office-articles.html`, `back-office-editeur.html`,
  `back-office-composer-la-une.html`) : rail de navigation latéral gauche de 240 px
  (Articles · À la une · Médias, plus la déconnexion), en-tête de page, et le corps propre
  à chaque écran.
- **FR-003**: Les trois écrans MUST fonctionner et respecter les contrastes en thème clair
  **et** sombre, sans flash au premier rendu.
- **FR-004**: Toute donnée affichée ou écrite par ces écrans MUST transiter par les
  opérations serveur éprouvées de la feature 002 ; aucun accès direct aux données depuis un
  composant client.

**Écran « Liste des articles »**

- **FR-005**: La liste MUST présenter **tous** les articles, brouillons compris, chacun sur
  une ligne portant : vignette, titre, rubrique, état, rang à la une, date.
- **FR-006**: L'état MUST se lire en un mot (« Brouillon » ou « Publié ») **sans pastille
  colorée** ; le rang à la une MUST s'afficher en numéro à deux chiffres (01–05) ou en
  tiret (« — ») quand l'article n'est pas à la une.
- **FR-007**: La liste MUST offrir trois filtres cumulables — recherche par texte sur le
  titre, sélection par rubrique, sélection par état — appliqués côté serveur.
- **FR-008**: La liste MUST être paginée ; parcourir les pages MUST atteindre chaque
  article une fois, dans un ordre stable, et changer de filtre MUST ramener à la première
  page.
- **FR-009**: La liste MUST offrir une action « Nouvel article » ouvrant l'éditeur sur un
  article vierge, et par ligne une action « Modifier » (ouvre l'éditeur sur l'article) et
  une action « Supprimer ».
- **FR-010**: Une combinaison de filtres sans résultat MUST afficher un état vide lisible,
  et non une erreur ni un tableau silencieux.

**Écran « Éditeur d'article »**

- **FR-011**: L'éditeur MUST présenter un champ titre rendu dans la typographie du titre
  publié et un champ chapô, le titre étant stocké **sans** préfixe de rubrique ni de
  sous-thème.
- **FR-012**: L'éditeur riche MUST permettre au moins : gras, italique, intertitre de
  niveau 2, intertitre de niveau 3, liste à puces, liste numérotée, citation en exergue,
  lien, image intégrée, annuler, rétablir.
- **FR-013**: Le corps MUST s'afficher pendant la frappe **exactement** comme il paraîtra
  sur le site publié (mêmes styles de paragraphe, titres, listes, citation, lien, image).
- **FR-014**: Le panneau latéral MUST offrir : le choix de l'état (brouillon ou publié), le
  choix d'une rubrique **unique**, la date de publication, la mise à la une avec choix d'un
  rang de 1 à 5, une zone de dépose d'image de couverture, et le champ de **texte
  alternatif** de cette couverture.
- **FR-014a**: Le panneau latéral MUST offrir un champ **sous-thème** facultatif, sous le
  sélecteur de rubrique — ce champ n'a pas de référence visuelle dans les maquettes et
  relève des points ouverts de la constitution.
- **FR-014b**: La date de publication MUST accepter une valeur **future** : l'éditeur ne
  bloque pas les dates à venir. Un article publié daté du futur reste invisible du public
  jusqu'à cette date (embargo), conformément au modèle ; passée cette date, il devient
  visible sans autre action.
- **FR-015**: L'éditeur MUST offrir deux actions : « Enregistrer le brouillon » et
  « Publier ».
- **FR-016**: « Enregistrer le brouillon » MUST conserver l'article même incomplet, à
  l'état brouillon, sans exiger les champs requis pour la publication.
- **FR-016a**: L'éditeur MUST **enregistrer automatiquement** le brouillon en cours de
  frappe, à intervalles raisonnables, en plus des deux actions explicites ; l'indicateur
  d'état reflète l'horodatage du dernier enregistrement. L'enregistrement automatique
  conserve l'article à l'état brouillon et ne publie jamais. En cas d'échec (réseau ou
  session expirée), il le signale sans détruire la saisie en cours.
- **FR-017**: « Publier » MUST être refusé, par un message qui nomme ce qui manque, tant
  que titre, rubrique, chapô, corps et image de couverture **avec** texte alternatif non
  vide ne sont pas tous présents ; rien n'est publié dans ce cas.
- **FR-018**: Le corps saisi MUST être assaini côté serveur sur liste blanche **avant**
  stockage ; le contenu conservé ne comporte que le balisage autorisé, quel que soit ce
  qui a été collé ou saisi.
- **FR-019**: Le dépôt d'une image de couverture MUST enregistrer le média par sa **clé de
  stockage** ; l'adresse d'affichage se calcule à la lecture, et **aucune URL de média
  n'est stockée en base** — ni pour la couverture, ni pour une image intégrée au corps.
- **FR-020**: Une image **intégrée au corps** MUST désigner un média stocké **par clé**
  (comme la couverture) et n'apparaître dans le corps conservé que sous une **adresse
  interne à l'application**, résolue en adresse d'affichage à la lecture. Le corps ne
  contient **jamais** d'URL de fournisseur de stockage qui se romprait à la migration
  disque → objet.
- **FR-021**: Depuis l'éditeur, cocher « À la une » et choisir un rang MUST publier
  l'article s'il ne l'était pas, et le placer au rang choisi selon les règles de la Une
  (unicité et éviction).

**Écran « Composer la Une »**

- **FR-022**: L'écran MUST présenter cinq emplacements numérotés 01 à 05, l'emplacement 01
  étant visiblement plus grand (le héros) ; chaque emplacement montre l'article qui
  l'occupe (vignette, rubrique, titre) ou la mention « Emplacement libre ».
- **FR-023**: L'écran MUST présenter une liste des articles **publiés non épinglés**, avec
  une recherche, depuis laquelle on épingle un article sur la Une.
- **FR-024**: Épingler un article publié sur un emplacement MUST le placer à ce rang et le
  retirer de la liste des non épinglés ; épingler sur un rang occupé MUST évincer
  l'occupant précédent, sans jamais deux articles au même rang.
- **FR-025**: Épingler un article **non publié** MUST le publier d'abord, puis le placer.
- **FR-026**: Les cinq emplacements MUST être réordonnables par glisser-déposer selon une
  sémantique de **décalage par insertion** : déposer une carte à une position l'y insère et
  décale les autres, les cinq rangs formant une permutation — jamais un échange deux à deux,
  jamais un emplacement perdu. Le réordonnancement MUST rester réalisable au clavier avec un
  repère de focus visible.
- **FR-027**: Une action « Enregistrer la Une » MUST valider l'ordre composé ; c'est cette
  action, et elle seule, qui fixe l'ordre affiché sur l'accueil (rang 01 = héros). Tant
  qu'on n'a pas enregistré, l'accueil conserve l'ordre précédent.

**Suppression**

- **FR-028**: Supprimer un article MUST demander une confirmation explicite avant l'acte,
  qui est définitif (ni corbeille, ni archive).
- **FR-029**: Supprimer un article qui occupe un rang de la Une MUST l'en retirer au
  passage, de sorte que l'accueil ne présente aucun emplacement orphelin.

**Accessibilité (prime sur les maquettes)**

- **FR-030**: Tout élément interactif de ces écrans — liens, boutons, champs, sélecteurs,
  onglets d'état, poignées de glisser-déposer, boutons de la barre d'outils — MUST porter
  un repère de focus visible ; toute animation MUST se neutraliser sous
  `prefers-reduced-motion` ; toute vignette d'article MUST porter un texte alternatif réel.
- **FR-031**: Les messages d'erreur et de confirmation MUST être en français, clairs et
  sobres, et ne jamais recourir au rouge d'erreur ailleurs que pour signaler une erreur de
  formulaire.

### Key Entities

Cette feature n'introduit **aucune entité nouvelle**. Elle manipule celles de la feature
002 :

- **Article** : créé, lu, modifié, publié, dépublié, supprimé depuis ces écrans.
- **Rubrique** : proposée en filtre (liste) et en sélecteur (éditeur) ; les huit rubriques
  figées.
- **Une** : composée par épinglage, éviction et réordonnancement des cinq rangs.
- **Média** : déposé comme couverture (et, le cas échéant, image intégrée au corps),
  désigné par clé de stockage, jamais par URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un article se crée, s'édite, se publie et se supprime **entièrement depuis
  l'interface**, sans intervention hors écran — parcours vérifié de bout en bout.
- **SC-002**: Une image déposée en couverture s'affiche dans l'éditeur puis, l'article
  publié, sur la page publique — la dépose et l'affichage sont vérifiés sur au moins un
  article.
- **SC-003**: L'ordre composé sur « Composer la Une », une fois enregistré, est
  **exactement** celui affiché sur l'accueil, héros compris — vérifié en comparant les cinq
  rangs à l'accueil.
- **SC-004**: Le corps d'un article enregistré ne contient **que** des balises de la liste
  blanche — vérifié automatiquement en soumettant du balisage interdit et en inspectant ce
  qui est stocké.
- **SC-005**: La publication échoue tant qu'un des cinq requis (titre, rubrique, chapô,
  corps, couverture décrite) manque, avec un message qui nomme le manquant — vérifié pour
  chacun des cinq cas.
- **SC-006**: Épingler sur un rang occupé laisse exactement un article à ce rang et libère
  l'occupant précédent — jamais deux articles au même rang, vérifié automatiquement.
- **SC-007**: Aucune chaîne ressemblant à une URL de fournisseur de stockage ne figure ni
  dans les colonnes de médias ni dans le corps stocké des articles — vérification
  automatisée.
- **SC-008**: Les trois écrans rendent en thème clair **et** sombre, sans flash au premier
  rendu, et passent le contraste AA dans les deux thèmes.
- **SC-009**: Les trois écrans sont entièrement pilotables au clavier — y compris le
  réordonnancement de la Une — avec un repère de focus visible sur chaque élément
  interactif.
- **SC-010**: Aucun des trois écrans ne produit de défilement horizontal à 375 px de large.
- **SC-011**: Un visiteur non authentifié qui demande l'une de ces routes, ou appelle l'une
  de ces actions d'écriture, est refusé et renvoyé vers la connexion, sans qu'aucun contenu
  d'administration ne s'affiche ni qu'aucun effet ne se produise.
- **SC-012**: Un brouillon en cours de frappe est retrouvé intact après fermeture inopinée
  de l'onglet, grâce à l'enregistrement automatique — vérifié sur au moins un article.

## Assumptions

Choix par défaut retenus là où la commande ne tranchait pas. Les quatre points tranchés à
`/speckit.clarify` (enregistrement automatique, référence des images du corps, sémantique
du réordonnancement, date de parution future) sont désormais dans « Clarifications » et les
exigences ; ne subsistent ici que les choix par défaut non soumis à question.

- **Images intégrées au corps** (clarifié) : la liste blanche d'assainissement (feature
  002) autorise déjà `img`/`figure`/`figcaption`. Une image intégrée au corps désigne un
  média stocké **par clé** et n'apparaît dans le corps que sous une **adresse interne à
  l'application**, résolue à la lecture (voir FR-020). La forme exacte de l'adresse et la
  route de service d'image relèvent du `plan`.
- **Taille de page de la liste** : une pagination de taille raisonnable (de l'ordre de 20
  articles par page) ; la valeur exacte est un détail de réalisation sans effet sur les
  règles.
- **Écran « Médias »** : le rail de navigation des maquettes comporte une entrée
  « Médias », mais la commande ne décrit que trois écrans. La gestion autonome des médias
  est **hors périmètre** de cette feature ; l'entrée peut rester présente en pointant un
  écran ultérieur ou un emplacement réservé, sans être développée ici.
- **Confirmation de suppression** : l'écran de confirmation n'est pas maquetté (il figure
  parmi les écrans à concevoir de la constitution). Il se conçoit sobre, en français, sans
  usage d'accent nouveau ; si un accent y paraissait nécessaire, la clause de consultation
  du principe III s'applique.
- **Réordonnancement de la Une** : le glisser-déposer réordonne les cinq rangs les uns par
  rapport aux autres ; la maquette montre une poignée par emplacement. Le comportement
  clavier équivalent est ajouté au titre de l'accessibilité, sans référence visuelle.
- **Dépendances** : cette feature s'appuie sur les features 002 (modèle et opérations),
  003 (rendu public de la Une et des articles) et 004 (authentification et refus par
  défaut du préfixe `/admin`), toutes réputées fusionnées.
