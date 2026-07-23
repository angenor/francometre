# Feature Specification: Pages publiques

**Feature Branch**: `003-pages-publiques`

**Created**: 2026-07-22

**Status**: Draft

**Input**: User description : « Feature "Pages publiques". Elle donne à voir les articles aux visiteurs. Elle réutilise la charpente et la vignette des Fondations, et lit les objets définis dans Modèle et données. »

## Clarifications

### Session 2026-07-22

- Q: Cible du lien « Tout voir » des derniers articles, l'ensemble des articles n'ayant pas de page ? → A: Ajouter une page « Tous les articles » (toutes rubriques), grille paginée, même gabarit que la page rubrique.
- Q: Taille de page de la pagination (rubrique et « tous les articles ») ? → A: 12 articles par page (3 rangées de 4).
- Q: Comportement d'une page de pagination hors bornes ? → A: « adresse introuvable » (404).
- Q: Code de statut de la page « service indisponible » ? → A: 503 (une page d'erreur inattendue reste possible en 500, même gabarit).
- Q: La légende de couverture est dans la maquette (`article.html`, `<figcaption>`) mais absente du modèle 002 (`Article` n'a que `couvertureAlt`). Comment la traiter ? → A: Ajouter un champ dédié `couvertureLegende` (nullable, portable) à `Article` via une migration additive, et l'alimenter au seed. Distinct du texte alternatif d'accessibilité. Décidé par le porteur le 2026-07-22.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - L'accueil donne à voir la Une éditorialisée (Priority: P1)

Un visiteur arrive sur l'accueil et découvre, de haut en bas : une section « À la une » qui met l'article de rang 1 en héros (grande image, numéro 01, titre, chapô) suivi des articles de rang 2 à 5 en vignettes numérotées 02 à 05 ; une section « Les derniers articles » toutes rubriques confondues ; puis une section par rubrique mise en avant (au moins Environnement, Économie, Culture), chacune avec son nom, un lien « Tout voir » et ses derniers articles.

**Why this priority**: C'est la vitrine du site et la promesse de la marque (« L'actualité, mesurée »). Sans elle, il n'y a pas de porte d'entrée éditoriale. La vérification demandée par le porteur commence explicitement par « l'accueil montre une Une ordonnée 01→05 ».

**Independent Test**: À partir des articles d'exemple du seed, ouvrir l'accueil et constater que la Une s'affiche dans l'ordre 01→05, que « Les derniers articles » liste les publications les plus récentes toutes rubriques confondues, et que chaque section de rubrique mise en avant montre ses derniers articles avec un lien vers la rubrique.

**Acceptance Scenarios**:

1. **Given** cinq articles portent les rangs de Une 1 à 5, **When** le visiteur ouvre l'accueil, **Then** l'article de rang 1 s'affiche en héros avec le numéro 01, son image, son titre et son chapô, et les articles de rangs 2 à 5 s'affichent en vignettes numérotées 02 à 05, dans l'ordre du rang.
2. **Given** des articles publiés de plusieurs rubriques, **When** le visiteur consulte « Les derniers articles », **Then** il voit les articles publiés les plus récents toutes rubriques confondues, du plus récent au plus ancien, et un lien menant à l'ensemble des articles.
3. **Given** les rubriques Environnement, Économie et Culture contiennent des articles publiés, **When** le visiteur fait défiler l'accueil, **Then** chacune apparaît en section nommée, avec un lien « Tout voir » vers sa page et ses derniers articles publiés.
4. **Given** un article de rang 2 à 5 possède un sous-thème, **When** sa vignette s'affiche sur l'accueil, **Then** l'eyebrow affiche la rubrique (le lecteur n'est pas encore dans la rubrique), conformément à la règle d'eyebrow contextuel.
5. **Given** aucun article ne porte de rang de Une, **When** le visiteur ouvre l'accueil, **Then** la section « À la une » n'affiche pas de héros vide et le reste de l'accueil (derniers articles, rubriques) reste consultable.

---

### User Story 2 - Un article se lit entièrement (Priority: P2)

Un visiteur ouvre un article et le lit dans son intégralité : fil d'Ariane, rubrique, titre, chapô, métadonnées (date, temps de lecture, auteur éventuel), image de couverture avec sa légende, puis le corps rendu proprement (paragraphes, intertitres, listes, citations, liens, images intégrées), et enfin une section « à lire aussi » de la même rubrique.

**Why this priority**: Lire un article est la finalité du site ; toutes les listes y conduisent. Sans cette page, la Une et les rubriques ne mènent nulle part.

**Independent Test**: Ouvrir un article d'exemple publié et vérifier que l'en-tête, la couverture, le corps riche et la section « à lire aussi » s'affichent correctement ; ouvrir un article non publié ou dont la date n'est pas atteinte et vérifier qu'il est introuvable.

**Acceptance Scenarios**:

1. **Given** un article publié et daté, **When** le visiteur l'ouvre, **Then** il voit le fil d'Ariane, la rubrique, le titre, le chapô, la date, le temps de lecture estimé, l'auteur s'il existe, et l'image de couverture avec sa légende.
2. **Given** le corps de l'article contient paragraphes, intertitres, listes, citations, liens et images intégrées, **When** le visiteur le parcourt, **Then** chacun de ces éléments s'affiche dans une colonne de lecture lisible, sans élément brut ni balise apparente.
3. **Given** d'autres articles publiés existent dans la même rubrique, **When** le visiteur atteint le bas de l'article, **Then** une section « à lire aussi » propose des articles de la même rubrique, l'article courant exclu.
4. **Given** un article non publié, ou publié mais dont la date de parution n'est pas atteinte, **When** un visiteur tente d'y accéder par son URL, **Then** il obtient la page « adresse introuvable ».
5. **Given** un article affiché depuis sa rubrique, **When** une vignette de « à lire aussi » possède un sous-thème, **Then** l'eyebrow affiche le sous-thème (le lecteur est dans la rubrique).

---

### User Story 3 - Une rubrique liste et pagine ses articles (Priority: P3)

Un visiteur ouvre une rubrique et voit un en-tête sobre à son nom, puis la liste de ses articles publiés en grille, du plus récent au plus ancien, paginée. Lorsque la rubrique n'a aucun article publié, un état particulier le lui indique plutôt qu'une page vide.

**Why this priority**: Les rubriques sont l'ossature de navigation figée du site (huit rubriques). Elles rendent le catalogue parcourable au-delà de la Une.

**Independent Test**: Ouvrir une rubrique fournie du seed, vérifier la grille ordonnée et la pagination ; ouvrir une rubrique sans article publié et vérifier l'état vide.

**Acceptance Scenarios**:

1. **Given** une rubrique contient plus d'articles qu'une page n'en affiche, **When** le visiteur l'ouvre, **Then** il voit un en-tête au nom de la rubrique et la première page d'articles, du plus récent au plus ancien, avec des commandes de pagination.
2. **Given** le visiteur est sur la première page d'une rubrique, **When** il passe à la page suivante, **Then** il voit les articles suivants dans le même ordre, sans doublon ni saut.
3. **Given** une rubrique n'a aucun article publié, **When** le visiteur l'ouvre, **Then** un état vide dédié s'affiche à la place de la grille, avec l'en-tête de la rubrique conservé.
4. **Given** le visiteur est dans une rubrique, **When** une vignette possède un sous-thème, **Then** l'eyebrow affiche le sous-thème.
5. **Given** un identifiant de rubrique inconnu dans l'URL, **When** un visiteur y accède, **Then** il obtient la page « adresse introuvable ».

---

### User Story 4 - Les pages système ramènent vers le contenu (Priority: P4)

Face à une adresse introuvable ou à un service momentanément indisponible, le visiteur voit une page du même gabarit que le site qui, plutôt que de s'excuser, le ramène vers les derniers articles.

**Why this priority**: Une URL inconnue ou une panne ne doivent pas être une impasse. C'est un filet de sécurité éditorial, moins central que le contenu lui-même.

**Independent Test**: Demander une URL inexistante et constater la page « adresse introuvable » avec les derniers articles ; provoquer une indisponibilité et constater le même gabarit.

**Acceptance Scenarios**:

1. **Given** une URL qui ne correspond à aucun article, rubrique ni page connue, **When** le visiteur y accède, **Then** il obtient la page « adresse introuvable », dans la charpente du site, présentant les derniers articles publiés.
2. **Given** le service est momentanément indisponible, **When** le visiteur charge une page, **Then** il obtient une page « service indisponible » (statut 503) du même gabarit, indiquant quoi faire ensuite.
3. **Given** l'une ou l'autre de ces pages, **When** elle s'affiche, **Then** elle porte le code de statut approprié pour ne pas être indexée comme du contenu valide.

---

### User Story 5 - Diffusion : flux de syndication et plan du site (Priority: P5)

Un lecteur ou un moteur récupère un flux de syndication listant les derniers articles publiés, et un plan du site listant l'accueil, les rubriques et les articles publiés.

**Why this priority**: La diffusion élargit l'audience (agrégateurs, indexation) mais n'est pas nécessaire pour lire le site ; elle vient après le socle de lecture.

**Independent Test**: Récupérer le flux et vérifier qu'il liste les derniers articles publiés ; récupérer le plan du site et vérifier qu'il liste l'accueil, les rubriques et les articles publiés.

**Acceptance Scenarios**:

1. **Given** des articles publiés existent, **When** un client récupère le flux de syndication, **Then** il obtient les derniers articles publiés, du plus récent au plus ancien, avec de quoi rejoindre chaque article.
2. **Given** le site comporte des rubriques et des articles publiés, **When** un client récupère le plan du site, **Then** il y trouve l'accueil, les huit rubriques et les articles publiés.
3. **Given** un article non publié ou non encore daté, **When** le flux et le plan du site sont générés, **Then** cet article n'y figure pas.

---

### Edge Cases

- **Une incomplète** : si les rangs de Une ne sont pas tous pourvus (moins de 5), l'accueil affiche les emplacements réellement attribués sans afficher de trous ni de vignette vide. Si le rang 1 (héros) n'est pas attribué, la section « À la une » ne montre pas de héros.
- **Section rubrique vide sur l'accueil** : une rubrique mise en avant sans article publié n'affiche pas de section vide sur l'accueil.
- **« À lire aussi » insuffisant** : si la même rubrique n'offre pas assez d'autres articles publiés, la section affiche ce qui existe, ou disparaît s'il n'y en a aucun.
- **Article sans couverture ou sans légende** : la mise en page reste correcte ; l'absence de légende ne laisse pas de bloc vide. (À la publication, un texte alternatif de couverture est exigé — règle de la feature Modèle et données.)
- **Corps contenant une image dont le média manque** : l'article reste lisible ; l'image manquante ne casse pas la colonne.
- **Pagination hors bornes** : une page au-delà de la dernière page (rubrique ou « Tous les articles ») mène à « adresse introuvable » (404), sans erreur brute.
- **Article publié dont la date de parution est exactement l'instant courant** : il est visible (cas limite déjà tranché par la règle de visibilité de la feature Modèle et données).
- **Corps riche contenant un type de contenu hors liste blanche** : il n'apparaît pas ; seuls les éléments autorisés sont rendus (le corps est déjà assaini au stockage).

## Requirements *(mandatory)*

### Functional Requirements

**Visibilité et ordre (transversal)**

- **FR-001**: Partout où des articles apparaissent (accueil, rubrique, article, « à lire aussi », flux, plan du site), le système NE DOIT montrer QUE les articles publiés dont la date de parution est atteinte.
- **FR-002**: Toute liste d'articles DOIT être ordonnée du plus récent au plus ancien, sauf la Une, ordonnée par rang décidé par la rédaction.
- **FR-003**: Le critère « publié et date atteinte » DOIT être appliqué de manière uniforme et cohérente sur toutes les surfaces publiques.

**Accueil**

- **FR-004**: L'accueil DOIT présenter une section « À la une » plaçant l'article de rang 1 en héros (image, numéro 01, titre, chapô) puis les articles de rangs 2 à 5 en vignettes numérotées 02 à 05, dans l'ordre du rang.
- **FR-005**: Les numéros 01→05 affichés DOIVENT refléter le rang de Une attribué par la rédaction, pas l'ordre chronologique.
- **FR-006**: L'accueil DOIT présenter une section « Les derniers articles » listant les articles publiés les plus récents toutes rubriques confondues, avec un lien « Tout voir » menant à la page « Tous les articles » (FR-006a).
- **FR-006a**: Le système DOIT exposer une page « Tous les articles » listant, toutes rubriques confondues, les articles publiés du plus récent au plus ancien, en grille paginée par tranches de 12, avec le même gabarit que la page rubrique (en-tête sobre, grille, pagination).
- **FR-007**: L'accueil DOIT présenter une section par rubrique mise en avant — au moins Environnement, Économie et Culture — comportant le nom de la rubrique, un lien « Tout voir » vers sa page, et ses derniers articles publiés.
- **FR-008**: Une rubrique mise en avant sans article publié NE DOIT PAS produire de section vide sur l'accueil ; un emplacement de Une non pourvu NE DOIT PAS produire de vignette vide.

**Page rubrique**

- **FR-009**: La page d'une rubrique DOIT afficher un en-tête sobre au nom de la rubrique.
- **FR-010**: La page d'une rubrique DOIT lister ses articles publiés en grille, du plus récent au plus ancien, paginés par tranches de 12.
- **FR-011**: La pagination DOIT permettre d'atteindre l'ensemble des articles publiés de la rubrique, sans doublon ni omission entre pages ; une page demandée au-delà de la dernière page valide DOIT mener à « adresse introuvable » (404).
- **FR-012**: Lorsqu'une rubrique n'a aucun article publié, le système DOIT afficher un état vide dédié en conservant l'en-tête de la rubrique.

**Page article**

- **FR-013**: La page d'un article DOIT afficher un fil d'Ariane, la rubrique, le titre, le chapô et les métadonnées : date de parution, temps de lecture estimé, et auteur s'il existe.
- **FR-014**: Le système DOIT calculer un temps de lecture estimé à partir du corps de l'article (valeur dérivée, non stockée).
- **FR-015**: La page d'un article DOIT afficher l'image de couverture avec sa légende lorsqu'elle existe, et rester correctement mise en page en son absence.
- **FR-016**: Le corps DOIT être rendu dans une colonne de lecture lisible, avec paragraphes, intertitres, listes, citations, liens et images intégrées correctement présentés.
- **FR-017**: La page d'un article DOIT proposer une section « à lire aussi » d'articles publiés de la même rubrique, l'article courant exclu, et s'effacer s'il n'existe aucun autre article de la rubrique.
- **FR-018**: L'eyebrow d'une vignette DOIT suivre la règle contextuelle : sous-thème quand le lecteur est déjà dans la rubrique (page rubrique, « à lire aussi » de même rubrique), rubrique partout ailleurs, et rubrique à défaut de sous-thème.
- **FR-019**: Le titre affiché NE DOIT PAS recevoir de préfixe de composition en base ; toute mise en forme de type « *Sous-thème :* titre » relève de l'affichage.

**Pages système**

- **FR-020**: À toute adresse ne correspondant à aucun article, rubrique ni page connue, le système DOIT servir une page « adresse introuvable », dans la charpente du site, présentant les derniers articles publiés.
- **FR-021**: En cas d'indisponibilité momentanée, le système DOIT servir une page « service indisponible » du même gabarit, portant le statut **503**, et indiquant la marche à suivre. Une erreur interne inattendue reste possible en **500** avec le même gabarit.
- **FR-022**: Les pages système DOIVENT porter un code de statut approprié — 404 pour l'adresse introuvable, 503 pour le service indisponible, 500 pour une erreur interne — afin de ne pas être traitées comme du contenu valide par les moteurs.

**Diffusion**

- **FR-023**: Le système DOIT exposer un flux de syndication listant les derniers articles publiés, du plus récent au plus ancien, avec de quoi rejoindre chaque article.
- **FR-024**: Le système DOIT exposer un plan du site listant l'accueil, la page « Tous les articles », les huit rubriques et les articles publiés.
- **FR-025**: Ni le flux ni le plan du site NE DOIVENT inclure d'article non publié ou non encore daté.

**Présentation, thèmes et adaptation**

- **FR-026**: Toutes les pages publiques DOIVENT réutiliser la charpente (colonne latérale gauche) et la vignette (Card unique) issues des Fondations, sans introduire de second gabarit de navigation.
- **FR-027**: Toutes les pages DOIVENT exister en thème clair et en thème sombre, du mobile au grand écran, en respectant les tokens et la sobriété (rayon 0, sans ombre ni dégradé).
- **FR-028**: Sur mobile, les sections par rubrique de l'accueil DOIVENT défiler horizontalement.
- **FR-029**: Tout élément interactif DOIT porter un repère de focus visible ; l'ouverture du site DOIT respecter le thème du système d'exploitation puis le choix persisté sans flash ; toute animation DOIT se désactiver sous réduction de mouvement (la charpente prime sur les défauts des maquettes).
- **FR-030**: Toute couverture d'article affichée DOIT porter un texte alternatif réel.

### Key Entities *(lecture seule — définies par la feature Modèle et données)*

- **Article** : la publication lue et listée. Cette feature en lit le titre, l'identifiant d'URL, le chapô, le corps riche assaini, la date de parution, la couverture et son texte alternatif, la légende, l'auteur éventuel, le sous-thème éventuel et le rang de Une éventuel. Elle ne modifie aucun champ **existant** ; elle **ajoute** un unique champ additif — `couvertureLegende` (nullable) — pour porter la légende visible de la couverture montrée par les maquettes, distincte du texte alternatif d'accessibilité (voir Clarifications, 2026-07-22). Aucune autre entité (Rubrique, Média, Compte) n'est touchée.
- **Rubrique** : l'une des huit sections figées. Cette feature en lit le nom affichable et l'identifiant d'URL, et l'emploie comme en-tête et comme axe de navigation.
- **Sous-thème** : attribut textuel de l'article, employé comme eyebrow contextuel ; jamais une page, une liste ni un lien.
- **Média** : le fichier image référencé comme couverture ; lu par sa clé de stockage via l'interface de stockage unique, jamais par une URL en base.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Depuis les articles d'exemple, l'accueil montre une Une ordonnée exactement 01→05 (héros puis vignettes), reflétant les rangs de Une attribués.
- **SC-002**: Une rubrique fournie liste ses articles du plus récent au plus ancien et se pagine ; parcourir toutes les pages restitue l'ensemble des articles publiés de la rubrique, sans doublon ni omission.
- **SC-003**: Un article d'exemple s'affiche entièrement — en-tête, couverture et légende, corps riche complet, « à lire aussi » — dans les deux thèmes.
- **SC-004**: Une URL inconnue mène à la page « adresse introuvable » qui présente les derniers articles publiés ; le flux et le plan du site répondent et ne listent que des articles publiés et datés.
- **SC-005**: Sur 100 % des surfaces publiques, aucun article non publié ou non encore daté n'apparaît.
- **SC-006**: Une rubrique sans article publié affiche son état vide dédié, jamais une grille vide ou une erreur.
- **SC-007**: Chaque page publique s'affiche correctement du mobile (≈390 px) au grand écran, dans les deux thèmes ; sur mobile, les sections par rubrique de l'accueil défilent horizontalement.
- **SC-008**: Les pages passent le seuil Lighthouse ≥ 90 (performance, SEO, accessibilité) et les contrastes AA sont vérifiés dans les deux thèmes.

## Assumptions

- **Réutilisation du socle** : la charpente (rail gauche 248 px, bascule de thème, recherche esquissée), la Card unique et les tokens sont livrés par la feature Fondations et réutilisés tels quels ; cette feature n'en redéfinit pas les valeurs.
- **Lecture via les services existants** : la feature Modèle et données fournit déjà les chemins de lecture publique (articles visibles, article par identifiant, articles de Une) et le filtre de visibilité unique ; cette feature s'appuie dessus et n'accède pas au stockage hors de l'interface unique.
- **Rubriques mises en avant sur l'accueil** : un sous-ensemble ordonné commençant par Environnement, Économie et Culture (les trois nommées), et non les huit ; l'ordre suit les maquettes.
- **Volumes d'affichage** : la pagination (rubrique et « Tous les articles ») est fixée à **12 par page** (clarifié le 2026-07-22). Les autres nombres suivent les maquettes — Une à 5 emplacements (1 héros + 4), « Les derniers articles » et sections de rubrique en grille courte, « à lire aussi » à quelques articles ; ces derniers sont des réglages d'affichage, non des règles de gestion, et seront fixés au plan.
- **Temps de lecture** : estimé à partir du volume de texte du corps selon une cadence de lecture usuelle ; c'est une valeur indicative, non un champ stocké.
- **Format de diffusion** : le flux de syndication et le plan du site adoptent des formats standard et interopérables ; le choix précis (type de flux, plan lisible par machine et/ou humain) relève du plan, pas de la spécification.
- **Éléments non maquettés** : l'état « rubrique vide », la page « Tous les articles » et la page « service indisponible » n'ont pas de maquette dédiée au-delà du gabarit d'états et de la page rubrique dont ils reprennent la charpente ; ils suivent les tokens et la sobriété du site.
- **Recherche hors périmètre** : le champ « Rechercher » du rail est esquissé dans les maquettes mais la page de résultats de recherche n'est pas dans cette feature.
