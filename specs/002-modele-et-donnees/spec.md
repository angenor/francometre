# Feature Specification: Modèle et données

**Feature Branch**: `002-modele-et-donnees`

**Created**: 2026-07-18

**Status**: Draft

**Input**: User description: "Feature « Modèle et données ». Elle définit les informations que le site manipule et leur cycle de vie. Aucune interface visible ici."

## Contexte

Le socle visuel est livré (feature `001-fondations-socle-ui`). Les pages publiques, puis
l'authentification, puis le back-office s'appuieront toutes sur les mêmes informations.
Cette feature définit ces informations, leurs règles de vie, et rend possible leur lecture
et leur écriture par des appels programmatiques éprouvés — **sans aucune interface**.

Elle referme aussi, en le tranchant, l'arbitrage 1 de la constitution
(« eyebrow = rubrique ou sous-thème ? ») : le sous-thème existe, il est facultatif, et il
sert uniquement à l'affichage contextuel de l'eyebrow.

## Clarifications

### Session 2026-07-18

- Q: Que se passe-t-il quand on assigne à un article un rang de Une déjà occupé ? → A: Éviction — le nouvel article prend le rang, l'occupant précédent quitte la Une.
- Q: L'image de couverture est-elle obligatoire pour publier, ou seulement son texte alternatif ? → A: Les deux sont obligatoires ; il n'existe pas d'article publié sans couverture.
- Q: Quelles bornes de longueur pour titre, chapô et sous-thème ? → A: Titre ≤ 160, chapô ≤ 300, sous-thème ≤ 40 caractères.
- Q: Que prévoit-on pour la suppression d'un article ? → A: Suppression définitive, refusée tant que l'article occupe un rang de Une.
- Q: Que devient la date de publication non fournie au passage à « publié » ? → A: L'instant du passage à « publié », figée ensuite — une republication ne la redate pas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Le site dispose de ses huit rubriques (Priority: P1)

Une installation neuve doit contenir les huit rubriques du site, dans leur ordre
d'affichage invariable, chacune avec un nom affichable et un identifiant d'URL. Sans
elles, aucune page ne peut se construire.

**Why this priority**: C'est le socle de tout le reste. Un article ne peut exister sans
rubrique, et le rail de navigation les énumère toutes.

**Independent Test**: Après initialisation d'une base vierge, un appel de lecture retourne
exactement huit rubriques, dans l'ordre attendu. Testable seul, sans article.

**Acceptance Scenarios**:

1. **Given** une base vierge, **When** l'initialisation des données de référence est
   exécutée, **Then** les huit rubriques Environnement, Sport, Éducation, Santé,
   Diplomatie, Culture, Technologie, Économie existent, dans cet ordre.
2. **Given** une base déjà initialisée, **When** l'initialisation est exécutée une seconde
   fois, **Then** il y a toujours exactement huit rubriques, sans doublon ni perte
   d'identifiant.
3. **Given** les huit rubriques en place, **When** on demande une rubrique par son
   identifiant d'URL, **Then** on obtient la rubrique correspondante avec son nom
   affichable.

---

### User Story 2 - Un article se crée, se lit et se modifie (Priority: P1)

La rédaction doit pouvoir déposer un article : titre, identifiant d'URL, chapô, corps de
texte riche, état, date de publication, image de couverture avec son texte alternatif,
auteur éventuel, rubrique unique, sous-thème facultatif. Puis le relire et le modifier.

**Why this priority**: L'article est l'objet central du site. Sans lui, ni Une, ni page de
rubrique, ni page d'article.

**Independent Test**: Créer un article par appel programmatique, le relire par son
identifiant d'URL, en modifier le titre, vérifier la persistance. Ne demande ni compte ni
interface.

**Acceptance Scenarios**:

1. **Given** une rubrique existante, **When** on crée un article complet et valide,
   **Then** il est enregistré et relisible par son identifiant d'URL.
2. **Given** un article existant, **When** on tente d'en créer un second avec le même
   identifiant d'URL, **Then** la création est refusée avec une erreur explicite.
3. **Given** un titre d'article, **When** l'identifiant d'URL n'est pas fourni, **Then**
   il est dérivé du titre sous une forme sûre pour une URL (minuscules, sans diacritiques,
   mots séparés par des tirets).
4. **Given** un titre déjà employé, **When** on dérive à nouveau l'identifiant d'URL,
   **Then** un identifiant distinct est produit plutôt qu'un conflit.
5. **Given** un article sans rubrique, ou avec une rubrique inconnue, **When** on tente de
   l'enregistrer, **Then** l'écriture est refusée.
6. **Given** un article dont le corps contient du balisage non autorisé, **When** on
   l'enregistre, **Then** le contenu stocké ne conserve que le balisage de la liste
   blanche.
7. **Given** un titre de plus de 160 caractères, un chapô de plus de 300 ou un sous-thème
   de plus de 40, **When** on enregistre, **Then** l'écriture est refusée avec un message
   explicite, sans troncature silencieuse.
8. **Given** un article qui n'occupe aucun rang de une, **When** on le supprime, **Then**
   il disparaît définitivement et n'est plus relisible.

---

### User Story 3 - Seuls les articles réellement parus sont visibles du public (Priority: P1)

Un article n'est visible du public que s'il est publié **et** que sa date de publication
est atteinte. Un brouillon, ou un article publié daté du futur, reste invisible.

**Why this priority**: C'est la règle de sécurité éditoriale du site. Une fuite de
brouillon ou d'embargo est un incident, pas un défaut cosmétique.

**Independent Test**: Créer trois articles — brouillon, publié daté du passé, publié daté
du futur — puis vérifier que la lecture publique n'en retourne qu'un.

**Acceptance Scenarios**:

1. **Given** un article à l'état brouillon, **When** on interroge la lecture publique,
   **Then** il n'apparaît pas.
2. **Given** un article publié dont la date de publication est passée, **When** on
   interroge la lecture publique, **Then** il apparaît.
3. **Given** un article publié dont la date de publication est à venir, **When** on
   interroge la lecture publique, **Then** il n'apparaît pas ; **When** cette date est
   atteinte, **Then** il apparaît, sans intervention manuelle.
4. **Given** un article invisible du public, **When** on le demande directement par son
   identifiant d'URL en lecture publique, **Then** on obtient une absence, pas le contenu.

---

### User Story 4 - La Une porte cinq articles ordonnés (Priority: P2)

Un article peut être « à la une » et porte alors un rang de 1 à 5, le rang 1 désignant
l'article héros. Deux articles à la une ne partagent jamais le même rang. Un article à la
une est nécessairement publié.

**Why this priority**: La Une est l'écran d'entrée du site, mais elle se construit
au-dessus d'articles qui doivent d'abord exister et être publiables.

**Independent Test**: Placer cinq articles publiés aux rangs 1 à 5, lire la Une, vérifier
l'ordre ; tenter un sixième rang ou un rang en double, vérifier le refus.

**Acceptance Scenarios**:

1. **Given** cinq articles publiés, **When** on leur assigne les rangs 1 à 5, **Then** la
   lecture de la Une les retourne dans l'ordre croissant de rang.
2. **Given** un article déjà au rang 2, **When** on assigne le rang 2 à un autre article,
   **Then** le nouvel article occupe le rang 2 et l'ancien occupant quitte la une — jamais
   deux articles au même rang, et l'opération n'échoue pas.
3. **Given** un article à l'état brouillon, **When** on tente de le mettre à la une,
   **Then** l'opération est refusée.
4. **Given** un article à la une, **When** on le repasse à l'état brouillon, **Then** il
   quitte la une (son rang est libéré).
5. **Given** une tentative d'assigner un rang hors de l'intervalle 1–5, **When** on
   enregistre, **Then** l'opération est refusée.

---

### User Story 5 - L'eyebrow s'affiche selon le contexte de lecture (Priority: P2)

Le libellé affiché au-dessus du titre d'une vignette dépend de l'endroit où le lecteur se
trouve : le **sous-thème** lorsqu'il est déjà dans la rubrique de l'article, la
**rubrique** partout ailleurs, et toujours la rubrique quand l'article n'a pas de
sous-thème.

**Why this priority**: Cette règle est portée par les données et doit être décidée ici,
mais elle ne se voit qu'aux features suivantes.

**Independent Test**: Pour un article donné, demander son eyebrow dans les deux contextes
et vérifier les deux résultats. Testable par appel programmatique pur.

**Acceptance Scenarios**:

1. **Given** un article de rubrique Environnement, sous-thème « Biodiversité », **When**
   on demande son eyebrow en contexte « dans la rubrique », **Then** on obtient
   « Biodiversité ».
2. **Given** ce même article, **When** on demande son eyebrow en contexte « hors
   rubrique », **Then** on obtient « Environnement ».
3. **Given** un article sans sous-thème, **When** on demande son eyebrow dans l'un ou
   l'autre contexte, **Then** on obtient toujours le nom de sa rubrique.
4. **Given** deux articles portant le même sous-thème, **When** on lit l'un d'eux, **Then**
   aucun lien, aucune liste et aucune navigation ne les rapproche.
5. **Given** un titre saisi avec un préfixe de type « Biodiversité : », **When** on
   l'enregistre, **Then** le titre est stocké tel quel, sans que la composition d'affichage
   ne soit jamais écrite en base.

---

### User Story 6 - Comptes de rédaction et médias sont représentés (Priority: P3)

Un compte de rédaction porte un identifiant de connexion et de quoi protéger
l'administration ; il est représenté sans être encore utilisé. Un média désigne un fichier
image stocké par sa **clé de stockage** — jamais par une URL — avec ses dimensions et son
poids.

**Why this priority**: Ces objets ne sont consommés qu'aux features 003 et 004, mais les
poser maintenant évite une migration de schéma plus tard.

**Independent Test**: Créer un compte et un média par appel programmatique, les relire,
vérifier qu'aucune URL n'est stockée et qu'aucun secret n'est lisible en clair.

**Acceptance Scenarios**:

1. **Given** un compte de rédaction créé, **When** on le relit, **Then** son identifiant de
   connexion est présent et aucun secret n'est lisible en clair.
2. **Given** deux comptes, **When** on tente d'employer deux fois le même identifiant de
   connexion, **Then** la création est refusée.
3. **Given** un média enregistré, **When** on inspecte ce qui est stocké, **Then** on
   trouve une clé de stockage, une largeur, une hauteur et un poids — et aucune URL.
4. **Given** un média enregistré, **When** on demande son adresse d'affichage, **Then**
   elle est calculée à la lecture à partir de la clé, jamais lue depuis la base.

---

### User Story 7 - Des données d'exemple peuplent les pages à venir (Priority: P3)

Après initialisation, quelques articles d'exemple répartis dans plusieurs rubriques, dont
cinq à la une, permettent de construire et de regarder les pages publiques sans saisie
manuelle.

**Why this priority**: Confort de développement pour la feature suivante ; sans valeur
pour le lecteur final.

**Independent Test**: Initialiser une base vierge, puis vérifier que l'accueil, une page
de rubrique et une page d'article disposeraient chacune d'assez de matière.

**Acceptance Scenarios**:

1. **Given** une base vierge, **When** l'initialisation est exécutée, **Then** au moins
   cinq rubriques distinctes portent au moins un article visible du public.
2. **Given** cette même initialisation, **Then** exactement cinq articles occupent les
   rangs 1 à 5 de la une.
3. **Given** cette même initialisation, **Then** au moins un article porte un sous-thème,
   au moins un n'en porte pas, et au moins un est un brouillon.
4. **Given** les articles d'exemple, **Then** chacun porte un texte alternatif réel sur son
   image de couverture — jamais une chaîne vide.

### Edge Cases

- Que se passe-t-il si un titre est composé uniquement de caractères qui disparaissent à la
  dérivation de l'identifiant d'URL (ponctuation, emoji) ? → un identifiant de repli non
  vide et unique est produit.
- Que se passe-t-il si deux articles différents produisent le même identifiant d'URL dérivé ?
  → un suffixe distinctif est ajouté ; l'unicité est garantie par la couche de données, pas
  seulement par la validation.
- Que se passe-t-il si l'on supprime une rubrique portant des articles ? → l'opération est
  refusée ; les huit rubriques sont figées et ne se suppriment pas.
- Que se passe-t-il si un article est publié sans image de couverture, ou sans son texte
  alternatif ? → la publication est refusée dans les deux cas. Un brouillon, lui, peut être
  incomplet.
- Que se passe-t-il si l'on supprime un article occupant le rang 3 de la une ? → la
  suppression est refusée ; il faut d'abord le retirer de la une, ce qui évite de trouer
  l'accueil sans s'en apercevoir.
- Que se passe-t-il si un article est dépublié puis republié ? → il retrouve l'état publié
  avec sa date de parution d'origine ; il ne remonte pas en tête des listes.
- Que se passe-t-il si un article publié voit sa date de publication repoussée dans le
  futur ? → il redevient invisible du public sans autre action.
- Que se passe-t-il aux limites d'une date de publication exactement égale à l'instant
  courant ? → l'article est visible (comparaison inclusive).
- Que se passe-t-il si un média est référencé par un article puis supprimé ? → la
  suppression est refusée tant qu'un article le référence.
- Que se passe-t-il si un chapô ou un titre dépasse la longueur admise ? → l'écriture est
  refusée avec un message explicite plutôt qu'une troncature silencieuse.

## Requirements *(mandatory)*

### Functional Requirements

**Rubriques**

- **FR-001**: Le système MUST porter exactement huit rubriques, connues d'avance :
  Environnement, Sport, Éducation, Santé, Diplomatie, Culture, Technologie, Économie.
- **FR-002**: Chaque rubrique MUST porter un nom affichable, un identifiant d'URL unique et
  un ordre d'affichage, l'ordre reproduisant celui de FR-001.
- **FR-003**: L'initialisation des rubriques MUST être rejouable sans créer de doublon ni
  changer les identifiants existants.
- **FR-004**: Les rubriques MUST NOT être créées ni supprimées par le code applicatif
  au-delà de ces huit ; leur ensemble est figé.

**Articles**

- **FR-005**: Un article MUST porter un titre, un identifiant d'URL, un chapô, un corps de
  texte riche, un état (brouillon ou publié), une image de couverture avec son texte
  alternatif, et un auteur éventuel. Il MAY porter une date de publication : celle-ci est
  absente tant que l'article n'a jamais été publié, et posée par FR-014a au premier passage
  à l'état publié.
- **FR-006**: Un article MUST appartenir à exactement une rubrique, existante.
- **FR-007**: Un article MAY porter un sous-thème facultatif, texte libre court, sans page
  dédiée, sans rôle de navigation, et sans créer de lien entre deux articles qui le
  partagent.
- **FR-008**: Le titre MUST être stocké tel qu'il s'affiche, sans préfixe de rubrique ni de
  sous-thème.
- **FR-008a**: Les longueurs maximales MUST être : titre 160 caractères, chapô 300,
  sous-thème 40. Un dépassement est refusé avec un message explicite, jamais tronqué.
- **FR-009**: L'identifiant d'URL MUST être unique sur l'ensemble des articles et se dériver
  du titre lorsqu'il n'est pas fourni.
- **FR-010**: L'état d'un article MUST être une valeur textuelle validée par le code métier
  parmi « brouillon » et « publié » — jamais un type énuméré porté par la base.
- **FR-011**: Le corps de texte riche MUST être assaini côté serveur, sur liste blanche
  stricte, **avant** stockage.

**Visibilité publique**

- **FR-012**: Le système MUST définir **une seule fois** le critère de visibilité publique
  — « publié **et** date de publication atteinte » — et le réutiliser partout, appliqué
  côté serveur.
- **FR-013**: Toute lecture publique MUST appliquer ce critère, y compris la demande d'un
  article isolé par son identifiant d'URL.
- **FR-014**: La publication d'un article MUST être refusée si son image de couverture est
  absente, ou si le texte alternatif de celle-ci est absent ou vide. Un article publié a
  donc toujours une couverture illustrée et décrite ; un brouillon peut être incomplet.
- **FR-014a**: Lors du passage à l'état « publié » sans date de publication fournie, le
  système MUST poser l'instant du passage. Cette date MUST ensuite rester inchangée : une
  dépublication suivie d'une republication ne la redate pas. Seule une saisie explicite la
  modifie.

**Une**

- **FR-015**: Un article MAY être « à la une » et porte alors un rang entier de 1 à 5, le
  rang 1 désignant l'article héros.
- **FR-016**: Deux articles MUST NOT partager le même rang à la une ; l'unicité est garantie
  par la couche de données.
- **FR-016a**: Assigner un rang déjà occupé MUST évincer l'occupant précédent — celui-ci
  quitte la une, le nouvel article prend le rang, et l'opération réussit. Elle est atomique :
  aucun état intermédiaire à deux articles au même rang n'est observable.
- **FR-017**: Un article à la une MUST être publié ; retirer la publication MUST le retirer
  de la une.
- **FR-018**: La lecture de la Une MUST retourner les articles par rang croissant.

**Eyebrow**

- **FR-019**: Le système MUST exposer une règle unique de calcul de l'eyebrow : le
  sous-thème lorsque le contexte de lecture est la rubrique de l'article, la rubrique
  partout ailleurs, et la rubrique en l'absence de sous-thème.
- **FR-020**: Cette règle MUST être une composition d'affichage — le libellé calculé n'est
  jamais persisté.

**Comptes et médias**

- **FR-021**: Un compte de rédaction MUST porter un identifiant de connexion unique et un
  secret d'authentification stocké sous forme hachée, jamais en clair.
- **FR-022**: Un média MUST être désigné par une clé de stockage, et porter sa largeur, sa
  hauteur et son poids.
- **FR-023**: Aucune URL de média MUST être stockée ; l'adresse d'affichage se calcule à la
  lecture à partir de la clé.
- **FR-024**: Tout accès au fichier lui-même MUST passer par une interface de stockage
  unique, sélectionnée par configuration.

**Accès programmatique et portabilité**

- **FR-025**: Le système MUST offrir des opérations de lecture et d'écriture couvrant
  rubriques, articles, une, comptes et médias, utilisables sans interface et couvertes par
  des tests automatisés.
- **FR-026**: Toute entrée d'écriture MUST être validée avant enregistrement, avec un
  message d'erreur explicite en cas de refus.
- **FR-027**: Le schéma MUST NOT employer de type énuméré porté par la base, de type JSON,
  de liste scalaire, ni d'identifiant auto-incrémenté ; les identifiants sont produits par
  l'application.
- **FR-028**: L'initialisation MUST poser les huit rubriques et des articles d'exemple
  répartis dans plusieurs rubriques, dont cinq occupant les rangs 1 à 5 de la une.
- **FR-029**: La suppression d'un article MUST être définitive — ni corbeille, ni état
  archivé — et MUST être refusée tant que l'article occupe un rang de la une. Le retrait de
  la une est un geste distinct et préalable.

### Key Entities

- **Rubrique** : l'une des huit sections figées du site. Nom affichable, identifiant d'URL,
  ordre d'affichage. Une rubrique porte plusieurs articles.
- **Article** : une publication éditoriale. Titre, identifiant d'URL, chapô, corps riche,
  état, date de publication, couverture et son texte alternatif, auteur éventuel,
  sous-thème facultatif, rang de une éventuel. Appartient à une rubrique et à une seule.
- **Sous-thème** : simple attribut textuel de l'article, pas une entité — pas de table, pas
  de page, pas de liste, pas de lien entre articles homonymes.
- **Compte de rédaction** : identifiant de connexion, secret haché, nom affichable. Sert à
  protéger l'administration ; représenté ici, employé à la feature 003.
- **Média** : un fichier image stocké. Clé de stockage, largeur, hauteur, poids, texte
  alternatif par défaut éventuel. Référencé par les articles comme couverture.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sur une installation neuve, les huit rubriques existent dans l'ordre attendu,
  vérifiable en une seule lecture.
- **SC-002**: Rejouer l'initialisation ne modifie ni le nombre de rubriques, ni leurs
  identifiants.
- **SC-003**: Un brouillon et un article daté du futur n'apparaissent dans **aucune** lecture
  publique — vérifié sur au moins trois chemins de lecture différents (liste, rubrique,
  article isolé).
- **SC-004**: Aucun jeu d'écritures concurrentes ne parvient à placer deux articles au même
  rang de une ; chaque assignation sur un rang occupé laisse exactement un article à ce rang
  et libère le précédent.
- **SC-004a**: Aucun article publié ne présente une couverture manquante ou un texte
  alternatif vide — la vérification est automatisée sur l'ensemble des articles visibles.
- **SC-005**: Pour un article donné, l'eyebrow retourné diffère entre les deux contextes dès
  lors qu'un sous-thème existe, et coïncide sinon — vérifié pour les trois cas de figure.
- **SC-006**: Aucune chaîne ressemblant à une URL ne figure dans les colonnes de médias — la
  vérification est automatisée.
- **SC-007**: 100 % des opérations d'écriture exposées refusent une entrée invalide avec un
  message explicite.
- **SC-008**: Après initialisation, au moins cinq rubriques portent un article visible du
  public, et cinq articles occupent les rangs 1 à 5 de la une.
- **SC-009**: La suite de tests automatisés couvre chaque règle de gestion énoncée et passe
  intégralement sur une base vierge, sans intervention manuelle.

## Assumptions

- **Arbitrage 1 de la constitution tranché ici** : le sous-thème est retenu comme champ
  facultatif de l'article. Les eyebrows hors des huit rubriques relevés dans
  `rubrique.html` sont donc valides. La constitution a été amendée en conséquence
  (v1.2.0, 2026-07-19) : la règle est consignée aux « Contraintes de conception » et
  l'arbitrage ne figure plus parmi les points en attente.
- Le sous-thème est un texte court libre, saisi par la rédaction, sans référentiel ni
  normalisation. Deux graphies voisines restent deux valeurs distinctes.
- Les huit rubriques ne sont ni créables ni supprimables par l'application : leur liste est
  une donnée de référence, pas un contenu administrable.
- Un article ne porte **qu'une** image de couverture. La gestion d'images à l'intérieur du
  corps de texte relève de la feature back-office, pas d'ici.
- L'auteur est un attribut textuel de l'article, indépendant du compte de rédaction :
  signer un article ne suppose pas d'avoir un compte.
- La date de publication est stockée en temps universel ; la comparaison de visibilité est
  inclusive à l'instant exact.
- Aucune corbeille ni historique de versions n'est prévu à cette feature : la suppression
  est définitive (FR-029).
- Un article publié étant toujours illustré (FR-014), aucune variante « sans image » de la
  Card n'est requise en page publique. Si le besoin apparaît plus tard, il faudra la
  déclarer explicitement dans le composant, comme la constitution l'exige.
- Aucun rôle différencié entre comptes de rédaction à ce stade ; le sujet se rouvre à la
  feature 003 si besoin.
- La liste blanche exacte des balises admises au corps de texte est arrêtée au plan, en
  cohérence avec l'éditeur de la feature 004.

## Dependencies

- La feature `001-fondations-socle-ui` est livrée et fusionnée.
- Aucune dépendance envers une interface : cette feature se valide entièrement par des
  appels programmatiques et des tests.
- Les features suivantes (pages publiques et au-delà) consomment le critère de visibilité
  publique, la règle d'eyebrow et la lecture de la Une définis ici.

## Out of Scope

- Toute page, tout écran, tout composant visuel.
- L'authentification effective et la protection des routes d'administration.
- Le téléversement de fichiers, le redimensionnement d'images et l'implémentation concrète
  d'un stockage distant (l'interface est posée, ses réalisations viendront).
- La recherche, la pagination avancée, les flux de syndication, les métadonnées SEO.
- La migration effective vers PostgreSQL ou S3 — seule la portabilité est garantie.
