# Feature Specification: Référencement, performance, accessibilité

**Feature Branch**: `006-referencement-perf-a11y`

**Created**: 2026-07-24

**Status**: Draft

**Input**: User description : « Feature "Référencement, performance, accessibilité". Elle ne crée pas de page nouvelle : elle finit celles qui existent pour qu'elles soient trouvables, rapides et utilisables par tous. »

## Clarifications

### Session 2026-07-24

- Q: Quel profil d'appareil sert de référence pour l'audit ≥ 90 (performance surtout) ? → A: Les deux — **mobile ET bureau** ≥ 90.
- Q: Quelle forme d'adresse fait foi (sens de la redirection) ? → A: L'apex **`francometre.com`** ; `www.francometre.com` y redirige de façon permanente (301).
- Q: Comment fournir l'image de partage par défaut (pages sans couverture) ? → A: **Prise dans `public/brand`** — composée au format social 1200 × 630 à partir du mot-symbole existant (`NOIR.png`/`BLANC.png`). *Précision du porteur (stack) affinant la réponse initiale « le porteur fournit » : l'actif dérive du mot-symbole déjà présent, donc **plus de dépendance bloquante**.*
- Q: Les pages de liste paginées (page 2 et au-delà) sont-elles indexables ? → A: **Oui** — indexables et auto-canoniques (pas de `noindex`).

## User Scenarios & Testing *(mandatory)*

<!--
  Cette feature ne construit aucun écran. Elle achève les écrans livrés par les features
  précédentes (Pages publiques, Back-office) sur trois axes : trouvable, rapide, utilisable
  par tous. Chaque histoire est une tranche indépendamment vérifiable de cet achèvement.
-->

### User Story 1 - Chaque page est trouvable et non dupliquée (Priority: P1)

Un lecteur cherche le site dans un moteur de recherche, ou colle une adresse. Chaque page
répond sous une **seule** forme d'adresse, présente un **titre** et une **description**
propres, et se désigne elle-même comme la version de référence. La marque s'écrit toujours
« **Francomètre** » (avec accent) dans les titres, quand bien même le domaine s'écrit
`francometre.com` sans accent. Le plan du site et le flux de syndication existants sont
déclarés là où les moteurs et les lecteurs les attendent.

**Why this priority**: C'est le socle du référencement et la condition pour que le travail
éditorial soit trouvé. Sans adresse canonique unique ni titres propres, le site se
disperse en doublons et n'est pas indexable proprement — rien de ce qui suit ne compense
cette absence.

**Independent Test**: Ouvrir l'accueil, une rubrique et un article ; constater que chacun
porte un titre et une description distincts et non vides, marque « Francomètre » comprise ;
demander la forme d'adresse non canonique (avec/sans `www`) et constater qu'elle renvoie
définitivement vers la forme canonique ; constater que chaque page déclare son adresse
canonique et que le flux et le plan du site sont atteignables et annoncés.

**Acceptance Scenarios**:

1. **Given** n'importe quelle page publique, **When** un lecteur ou un moteur l'examine,
   **Then** elle expose un titre et une description propres, non vides, la marque écrite
   « Francomètre ».
2. **Given** le domaine répond sous deux formes d'hôte (avec et sans `www`), **When** un
   visiteur demande la forme non canonique, **Then** il est redirigé de façon permanente
   vers la forme canonique unique, sans doublon indexable.
3. **Given** une page quelconque, **When** on inspecte son en-tête, **Then** elle déclare
   son adresse canonique, construite sur l'origine canonique du site.
4. **Given** le flux de syndication et le plan du site existent déjà, **When** on ouvre une
   page ou un robot d'indexation explore le site, **Then** le flux est annoncé dans
   l'en-tête des pages et le plan du site est atteignable par les conventions attendues,
   tous deux exprimés sur l'adresse canonique.
5. **Given** une page qui ne doit pas être indexée (résultats de recherche, connexion,
   administration, adresse introuvable, service indisponible, article non encore publié),
   **When** un moteur l'explore, **Then** elle signale qu'elle ne doit pas être indexée.

---

### User Story 2 - Le site entier est utilisable au clavier et par les technologies d'assistance (Priority: P2)

Une personne navigue sans souris, ou avec un lecteur d'écran. Elle parcourt **toutes** les
pages — publiques comme d'administration — au clavier seul, dans un ordre de tabulation
logique, le repère de focus toujours visible. La structure de chaque page est sémantique :
un seul titre principal, une hiérarchie de titres correcte, des régions repérables, des
images décrites. Les contrastes sont conformes AA dans les **deux** thèmes.

**Why this priority**: L'accessibilité est le domaine où la constitution prime délibérément
sur les maquettes (principe VIII) et où le contrôle vaut pour tout écran, administration
comprise. C'est une exigence non négociable du projet, placée avant les enrichissements de
partage et de performance.

**Independent Test**: Ranger la souris. Parcourir l'accueil, un article, une rubrique, la
connexion et le back-office à la seule touche de tabulation ; vérifier que chaque élément
interactif se reçoit, dans un ordre logique, avec un focus visible. Mesurer les contrastes
en thème clair puis en thème sombre. Inspecter la structure : un unique titre principal par
page, une hiérarchie correcte, des régions nommées, un texte alternatif réel sur chaque
image de couverture.

**Acceptance Scenarios**:

1. **Given** n'importe quel écran, public ou d'administration, **When** l'utilisateur
   navigue au clavier seul, **Then** tout élément interactif (lien, bouton, champ,
   sélecteur, onglet, poignée) est atteignable et actionnable, dans un ordre de tabulation
   logique, avec un repère de focus visible.
2. **Given** le thème clair puis le thème sombre, **When** on mesure les contrastes du
   texte et des éléments d'interface, **Then** ils satisfont AA dans chaque thème, l'accent
   (valeur différente d'un thème à l'autre) étant mesuré séparément dans chacun.
3. **Given** une page quelconque, **When** on inspecte sa structure, **Then** elle porte un
   **unique** titre principal et une hiérarchie de titres correcte.
4. **Given** une page quelconque, **When** on inspecte ses régions, **Then** la navigation,
   le contenu principal, les compléments et le pied sont repérables et nommés.
5. **Given** toute image de couverture ou image de contenu d'un article, **When** un lecteur
   d'écran la rencontre, **Then** elle porte un texte alternatif réel ; une image purement
   décorative est marquée comme telle.
6. **Given** un utilisateur qui a demandé de réduire les animations, **When** une page
   comportant une animation s'affiche, **Then** l'animation est neutralisée.

---

### User Story 3 - Un article partagé montre un bel aperçu et s'expose en article de presse (Priority: P3)

Un lecteur partage un article sur un réseau ou une messagerie. Le lien se déplie en un
aperçu complet : titre, description, image de partage. Les moteurs qui comprennent les
articles de presse reçoivent les données structurées propres à l'article : titre, date de
publication, rubrique, auteur, image. Un article dépourvu de couverture propre affiche
l'image de partage par défaut.

**Why this priority**: C'est un enrichissement de diffusion qui démultiplie la portée d'un
article partagé et améliore sa présentation dans les résultats de recherche. Il suppose que
le socle « trouvable » (US1) soit en place, d'où sa position après lui.

**Independent Test**: Partager l'adresse d'un article doté d'une couverture et vérifier
l'aperçu (titre, description, image) ; partager l'adresse d'un article sans couverture et
vérifier que l'image de partage par défaut est utilisée ; inspecter les données
structurées de l'article et constater qu'elles décrivent bien un article de presse (titre,
date, rubrique, auteur, image).

**Acceptance Scenarios**:

1. **Given** un article publié doté d'une image de couverture, **When** son adresse est
   partagée, **Then** l'aperçu affiche le titre, la description et l'image de partage de
   l'article.
2. **Given** un article publié sans couverture propre, **When** son adresse est partagée,
   **Then** l'aperçu affiche l'image de partage **par défaut**.
3. **Given** une page d'article, **When** un moteur comprenant les articles de presse
   l'examine, **Then** il obtient des données structurées valides comportant le titre, la
   date de publication, la rubrique, l'auteur et l'image.
4. **Given** un article dont la couverture est stockée par sa clé, **When** l'aperçu ou les
   données structurées se construisent, **Then** l'adresse de l'image est **calculée** à la
   lecture depuis la clé de stockage et l'origine canonique, jamais lue depuis une URL
   persistée.

---

### User Story 4 - Les pages de liste restent rapides, l'accueil dense en images compris (Priority: P4)

Un visiteur ouvre l'accueil, riche en vignettes, puis une rubrique. Ces pages de liste
s'affichent vite parce qu'elles sont mises en cache et rafraîchies en arrière-plan — sans
pour autant servir du contenu périmé au-delà d'un court délai. Les images ne se chargent
qu'à l'approche de l'écran et sont dimensionnées au plus juste ; la première image
déterminante s'affiche sans attendre.

**Why this priority**: La performance conditionne la note d'audit et le confort de lecture,
mais elle affine des pages déjà fonctionnelles et correctement structurées. Elle vient donc
après le référencement et l'accessibilité.

**Independent Test**: Ouvrir l'accueil et mesurer que son contenu principal s'affiche vite,
que les images hors écran ne sont pas demandées avant l'approche du défilement, et que
chaque image est servie à une taille proche de son affichage. Publier ou réordonner un
article et vérifier qu'il apparaît sur les pages de liste dans un court délai, sans purge
manuelle.

**Acceptance Scenarios**:

1. **Given** l'accueil ou une page de rubrique, **When** un visiteur la demande à plusieurs
   reprises, **Then** elle est servie depuis un cache et rafraîchie en arrière-plan, sans
   servir de contenu plus vieux qu'un court délai borné.
2. **Given** une modification éditoriale (publication d'un article, réordonnancement de la
   Une), **When** elle est effectuée, **Then** elle apparaît sur les pages de liste
   concernées dans le délai borné, sans intervention manuelle.
3. **Given** une page dense en images, **When** elle s'affiche, **Then** seules les images
   proches de l'écran sont chargées d'emblée ; les autres se chargent à l'approche du
   défilement.
4. **Given** la première image déterminante d'une page (par exemple le héros de l'accueil),
   **When** la page s'affiche, **Then** cette image n'est pas différée et s'affiche
   rapidement.
5. **Given** n'importe quelle image, **When** elle est servie, **Then** elle l'est à une
   dimension proche de sa taille d'affichage, sans transporter des pixels inutiles.

---

### Edge Cases

- **Article sans couverture** : l'aperçu de partage et les données structurées retombent
  sur l'image de partage par défaut, aux bonnes dimensions.
- **Formes d'adresse multiples** : au-delà de `www`/apex, les variantes (barre oblique
  finale, casse, paramètres de suivi) ne doivent pas engendrer de pages canoniques
  distinctes ; l'adresse canonique déclarée reste unique et propre.
- **Pages paginées** (rubrique page 2, « tous les articles » page 2) : chaque page de
  pagination a une adresse propre, se déclare canonique d'elle-même et reste **indexable**,
  sans dupliquer le contenu de la première page ni le diluer.
- **Contenu non public partagé** : l'adresse d'un article non encore publié renvoie déjà
  « introuvable » (feature Pages publiques) ; elle ne doit produire aucun aperçu de partage
  ni figurer au plan du site.
- **Image déterminante hors écran au chargement** : le repli au chargement paresseux ne
  doit pas s'appliquer à l'image qui porte l'affichage initial, sous peine de ralentir
  l'apparence de la page.
- **Publication récente vs cache** : un article fraîchement publié ne doit pas rester
  invisible sur l'accueil au-delà du délai de rafraîchissement borné.
- **Réduction d'animation** : le squelette de chargement et toute transition se neutralisent
  quand l'utilisateur a demandé de réduire les animations.
- **Focus dans l'administration** : les écrans d'administration, non maquettés pour
  l'accessibilité, doivent recevoir le même niveau de parcours clavier et de focus visible
  que le public.

## Requirements *(mandatory)*

### Functional Requirements

**Trouvable — référencement et adresses**

- **FR-001**: Chaque page (accueil, rubrique, « tous les articles », article, connexion,
  écrans d'administration, pages système) MUST exposer un **titre** et une **description**
  qui lui sont propres et ne sont pas vides.
- **FR-002**: Les titres MUST écrire la marque « **Francomètre** » avec son accent, même si
  le domaine s'écrit `francometre.com` sans accent.
- **FR-003**: Le site MUST répondre sous une **seule** forme d'adresse canonique, l'**apex
  `francometre.com`** (sans `www`) ; toute autre forme d'hôte, `www.francometre.com` en
  particulier, MUST renvoyer vers elle par une redirection permanente.
- **FR-004**: Chaque page MUST déclarer son **adresse canonique**, construite sur l'origine
  canonique du site.
- **FR-005**: Le **flux de syndication** existant MUST être annoncé dans l'en-tête des pages,
  et le **plan du site** existant MUST être atteignable par les conventions d'exploration
  attendues ; l'un et l'autre MUST s'exprimer sur l'adresse canonique.
- **FR-006**: Les pages qui ne doivent pas être indexées (résultats de recherche, connexion,
  administration, adresse introuvable, service indisponible, article non publié) MUST
  signaler explicitement qu'elles ne doivent pas être indexées, et MUST être absentes du
  plan du site.
- **FR-007**: Les pages de liste paginées MUST porter une adresse propre par page et se
  déclarer canoniques d'elles-mêmes, sans engendrer de doublon de contenu. Elles restent
  **indexables** (aucune directive `noindex`).

**Trouvable — aperçu de partage et données structurées**

- **FR-008**: Les pages d'article MUST exposer les informations permettant un aperçu de
  partage correct : **titre**, **description**, **image de partage**.
- **FR-009**: Les pages d'article MUST exposer des **données structurées d'article de
  presse** comportant le titre, la date de publication, la rubrique, l'auteur et l'image.
- **FR-010**: Une **image de partage par défaut**, aux dimensions attendues d'un aperçu
  social, MUST être utilisée pour toute page dépourvue de couverture propre.
- **FR-011**: Toute adresse d'image utilisée par l'aperçu de partage ou les données
  structurées MUST être **calculée à la lecture** depuis la clé de stockage et l'origine
  canonique ; aucune URL de média n'est persistée (portabilité, principe VI).

**Utilisable par tous — accessibilité**

- **FR-012**: Sur **tout** écran, public comme d'administration, chaque élément interactif
  MUST être atteignable et actionnable au clavier seul, dans un ordre de tabulation logique,
  avec un repère de focus visible.
- **FR-013**: Les contrastes du texte et des éléments d'interface MUST satisfaire AA dans
  les **deux** thèmes ; l'accent MUST être mesuré séparément dans chaque thème.
- **FR-014**: Chaque page MUST porter un **unique** titre principal et une hiérarchie de
  titres correcte.
- **FR-015**: Chaque page MUST organiser son contenu en **régions repérables** (navigation,
  contenu principal, compléments, pied).
- **FR-016**: Toute image de couverture ou de contenu d'article MUST porter un **texte
  alternatif réel** ; une image purement décorative MUST être marquée comme telle.
- **FR-017**: Le site MUST s'ouvrir dans le thème du système d'exploitation, puis respecter
  le choix persisté sans flash ; l'état « page courante » MUST désigner la page réellement
  affichée ; toute animation MUST se neutraliser sous réduction d'animation. *(Réaffirmation
  des acquis des features précédentes, vérifiée ici sur tous les écrans, administration
  comprise.)*

**Rapide — performance**

- **FR-018**: Les pages de liste (accueil, rubrique, « tous les articles ») MUST être mises
  en cache et rafraîchies en arrière-plan, sans servir de contenu plus ancien qu'un délai
  borné.
- **FR-019**: Une modification éditoriale (publication, réordonnancement de la Une) MUST
  apparaître sur les pages de liste concernées dans le délai borné, sans purge manuelle.
- **FR-020**: Les images MUST se charger seulement à l'approche de l'écran, **à l'exception**
  de l'image déterminante de l'affichage initial, chargée sans délai.
- **FR-021**: Les images MUST être servies à une dimension proche de leur taille
  d'affichage, afin que les pages denses en images restent rapides.

**Vérifiable**

- **FR-022**: L'ensemble MUST atteindre le seuil d'audit défini aux critères de succès, sur
  l'accueil et sur une page d'article, dans les deux thèmes.

### Key Entities *(include if feature involves data)*

<!--
  Cette feature n'introduit AUCUNE entité persistée : la portabilité (principe VI) interdit
  d'ajouter des colonnes pour ce qui se calcule à la lecture. Les « entités » ci-dessous
  sont des objets de présentation dérivés à la volée, ou des actifs statiques.
-->

- **Métadonnées de page** (dérivées, non persistées) : titre, description, adresse
  canonique, image de partage, directive d'indexation. Calculées par page à partir de son
  contenu et de l'origine canonique.
- **Données structurées d'article** (dérivées) : titre, date de publication, rubrique,
  auteur, image — projetées depuis l'article et sa rubrique existants.
- **Image de partage par défaut** (actif statique) : une image aux dimensions d'un aperçu
  social, cohérente avec la marque, **fournie** (jamais inventée ; voir hypothèses).
- **Origine canonique du site** (configuration) : la forme d'adresse unique qui fait foi ;
  source de toute adresse absolue (canonique, flux, plan du site, images de partage).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un audit de qualité de page atteint **au moins 90** sur les volets
  performance, référencement et accessibilité, pour **l'accueil** et pour **une page
  d'article**, sur les profils **mobile** et **bureau**, dans le thème **clair** et dans le
  thème **sombre**.
- **SC-002**: Le partage de l'adresse d'un article affiche un aperçu complet — titre,
  description, image — ; un article sans couverture propre affiche l'**image de partage par
  défaut**.
- **SC-003**: Sur **toutes** les pages, administration comprise, l'intégralité de la
  navigation s'effectue **au clavier seul**, dans un ordre logique, le repère de focus
  restant visible à chaque étape.
- **SC-004**: Une seule forme d'adresse — l'apex `francometre.com` — répond directement ;
  `www.francometre.com` y renvoie par une redirection permanente, et chaque page déclare son
  adresse canonique.
- **SC-005**: Chaque page présente un titre et une description propres, non vides, la marque
  écrite « Francomètre ».
- **SC-006**: Les contrastes satisfont **AA dans les deux thèmes**, l'accent étant vérifié
  séparément dans chacun.
- **SC-007**: Chaque page d'article expose des données structurées d'article valides
  comportant titre, date, rubrique, auteur et image.
- **SC-008**: Sur l'accueil dense en images, le contenu principal s'affiche rapidement et
  les images hors écran ne sont chargées qu'à l'approche du défilement.
- **SC-009**: Une modification éditoriale (publication, réordonnancement de la Une) apparaît
  sur les pages de liste en **moins de 60 secondes**, sans purge manuelle.
- **SC-010**: Chaque page possède un unique titre principal et des régions repérables.

## Assumptions

- **Forme canonique** : l'apex `francometre.com` (sans `www`) est l'adresse canonique
  (décidé — Clarifications 2026-07-24) ; `www.francometre.com` y redirige de façon
  permanente.
- **Origine et diffusion existantes** : l'origine absolue du site est déjà configurée, et le
  **flux de syndication** comme le **plan du site** existent déjà (feature « Pages
  publiques »). Cette feature les **déclare** et les **annonce**, elle ne les recrée pas.
- **Image de partage par défaut** : **prise dans `public/brand`** (précision du porteur,
  stack) — composée au format social 1200 × 630 à partir du mot-symbole existant
  (`NOIR.png`/`BLANC.png`, 3230 × 970), centré sur le fond de surface, sans accent. Ce n'est
  pas un actif inventé mais un placement mécanique du mot-symbole sanctionné (constitution
  respectée). **Plus de dépendance bloquante** : SC-002 est vérifiable sans livraison
  externe.
- **Délai de fraîcheur** : le rafraîchissement en arrière-plan des caches de liste vise un
  court délai borné (de l'ordre de la minute) ; une modification éditoriale y devient
  visible en moins de 60 secondes (SC-009).
- **Descriptions** : la description d'un article dérive de son chapô ; les descriptions de
  page sont tronquées proprement dans les longueurs usuelles des aperçus et des moteurs.
- **Audit** : « audit de qualité de page » désigne un audit standard des volets performance,
  référencement et accessibilité, exécuté sur un build proche de la production, sur les
  profils **mobile et bureau**.
- **Aucune entité persistée nouvelle** : toutes les métadonnées se calculent à la lecture ;
  aucune colonne n'est ajoutée (principe VI, portabilité).
- **Acquis antérieurs** : thème selon l'OS sans flash, `aria-current` sur la page affichée,
  neutralisation des animations sous réduction de mouvement, texte alternatif obligatoire à
  la publication — établis par les features précédentes ; cette feature les vérifie et les
  étend aux écrans d'administration.
- **Une seule feuille de tokens** : aucune valeur visuelle n'est ajoutée en dur ; les
  ajustements de contraste éventuels remontent à `tokens.md` pour amendement, ils ne se
  recopient pas (principe II).

## Dependencies

- Route du **flux de syndication** et route du **plan du site** existantes (feature « Pages
  publiques »).
- **Interface Storage** unique pour calculer les adresses de média depuis leurs clés
  (feature « Modèle et données »).
- **Origine canonique** du site configurée (source des adresses absolues).
- **Image de partage par défaut** : composée au build depuis `public/brand/NOIR.png` (ou
  `BLANC.png`), mot-symbole déjà présent, vers `public/brand/partage-defaut.png`
  (1200 × 630). Aucune livraison externe : la dépendance n'est **plus bloquante**.

## Out of Scope

- La création de tout écran nouveau (aucune page n'est ajoutée).
- Toute mesure d'audience, traçage, bandeau de consentement.
- Le multilingue et les variantes de langue (le site est en français uniquement).
- Toute variante d'affichage accéléré propriétaire, application web installable, mode hors
  ligne ou cache de service.
- Tout service tiers de distribution ou de transformation d'images (contraire au principe de
  portabilité et au preset serveur retenu).
- Toute modification du parti pris visuel, des tokens ou de la Card publique.
