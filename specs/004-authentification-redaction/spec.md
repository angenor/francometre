# Feature Specification: Authentification de la rédaction

**Feature Branch**: `004-authentification-redaction`

**Created**: 2026-07-23

**Status**: Draft

**Input**: User description : « Feature "Authentification de la rédaction". Elle protège l'accès à l'administration. Elle ne contient aucun outil d'édition — seulement l'entrée. Une page de connexion (identifiant + mot de passe), un message d'erreur clair et non culpabilisant qui ne révèle pas lequel des deux champs est faux ; une fois connecté, l'accès aux pages d'administration est ouvert ; déconnecté, il est refusé et renvoie vers la connexion ; une action de déconnexion ; une session qui persiste raisonnablement puis expire. La page de connexion respecte l'identité visuelle : sa structure est dans docs/design/html/connexion.html. »

## Clarifications

### Session 2026-07-23

- Q: Durée et mode d'expiration de la session ? → A: Durée absolue de 30 jours (le terme est fixé à la connexion, indépendant de l'activité).
- Q: Protection contre les tentatives de connexion répétées ? → A: Limitation de débit par adresse IP sur la route de connexion (fenêtre glissante, refus temporaire au-delà d'un seuil) ; pas de verrouillage de compte.
- Q: Provisionnement du compte de rédaction ? → A: Compte(s) stocké(s) en base (identifiant + empreinte du mot de passe hachée argon2), initialisé(s) par le seed rejouable ; pas de secret en configuration.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un membre de la rédaction se connecte (Priority: P1)

Un membre de la rédaction ouvre la page de connexion, saisit son identifiant (son adresse e-mail) et son mot de passe, valide, et se trouve admis dans l'espace d'administration. La page respecte l'identité visuelle du site : écran centré, mot-symbole, titre « Connexion », deux champs soulignés d'un filet, bouton noir plein, dans les deux thèmes.

**Why this priority**: C'est la porte d'entrée de tout le back-office. Sans elle, aucun écran d'administration n'est atteignable par la rédaction, et les features suivantes (composer la Une, éditer un article) n'ont pas de point d'accès. C'est le premier maillon vérifiable : « se connecter avec le compte de la rédaction donne accès ».

**Independent Test**: Ouvrir la page de connexion à partir du compte d'exemple, saisir des identifiants valides, valider, et constater l'arrivée dans l'espace d'administration ; recharger une page d'administration et constater que l'accès reste ouvert.

**Acceptance Scenarios**:

1. **Given** un compte de rédaction existe, **When** un visiteur ouvre la page de connexion et saisit l'identifiant et le mot de passe corrects, **Then** il est admis et redirigé vers l'espace d'administration.
2. **Given** un membre vient de se connecter, **When** il navigue vers une autre page d'administration ou recharge la page, **Then** l'accès reste ouvert sans nouvelle demande d'identifiants.
3. **Given** la page de connexion s'affiche, **When** on la compare à la maquette `connexion.html`, **Then** elle présente le mot-symbole, le titre « Connexion », le champ « E-mail », le champ « Mot de passe » et le bouton « Se connecter », en thème clair comme en thème sombre.

---

### User Story 2 - L'accès à l'administration est refusé à qui n'est pas connecté (Priority: P1)

Un visiteur non connecté tente d'atteindre une adresse d'administration. Plutôt que de voir le moindre écran d'administration, il est renvoyé vers la page de connexion. Après s'être connecté, il poursuit vers l'espace demandé.

**Why this priority**: C'est la raison d'être de la feature — « qui n'est pas connecté ne voit pas l'administration ». Sans ce refus, la protection n'existe pas, quel que soit le soin apporté à la page de connexion. La constitution l'impose : les routes d'administration sont refusées par défaut.

**Independent Test**: Sans être connecté, demander une adresse d'administration et constater le renvoi vers la connexion ; se connecter et constater l'arrivée dans l'espace d'administration.

**Acceptance Scenarios**:

1. **Given** un visiteur non connecté, **When** il demande une adresse d'administration, **Then** il est renvoyé vers la page de connexion sans qu'aucun contenu d'administration ne s'affiche.
2. **Given** une action serveur d'administration, **When** elle est appelée sans session valide, **Then** elle est refusée et ne produit aucun effet.
3. **Given** un visiteur renvoyé vers la connexion depuis une adresse d'administration, **When** il se connecte avec des identifiants valides, **Then** il est admis dans l'espace d'administration.

---

### User Story 3 - Une erreur de connexion est signalée sans culpabiliser ni renseigner (Priority: P2)

Un membre saisit un identifiant inconnu, ou un mot de passe erroné, ou laisse un champ vide. Il obtient un message clair, sobre et non accusateur, identique quel que soit le champ fautif : il n'apprend jamais lequel des deux est incorrect. Le formulaire conserve l'identifiant saisi (jamais le mot de passe) et signale l'erreur visuellement selon la maquette (filet et message en rouge d'erreur).

**Why this priority**: Un message qui distingue « e-mail inconnu » de « mot de passe faux » renseigne un attaquant sur les comptes existants ; un message accusateur dégrade l'expérience d'un membre légitime qui s'est trompé. Le comportement est essentiel mais vient après l'admission et le refus, qui constituent le socle vérifiable.

**Independent Test**: Soumettre un identifiant inconnu puis un mot de passe erroné pour un identifiant connu, et vérifier que le message affiché est le même dans les deux cas et ne désigne aucun champ.

**Acceptance Scenarios**:

1. **Given** la page de connexion, **When** un membre soumet un identifiant inconnu, **Then** il obtient un message d'erreur unique (« E-mail ou mot de passe incorrect. ») qui ne précise pas quel champ est en cause.
2. **Given** la page de connexion, **When** un membre soumet un identifiant connu avec un mot de passe erroné, **Then** il obtient exactement le même message que pour un identifiant inconnu.
3. **Given** un membre a soumis une combinaison erronée, **When** le formulaire se réaffiche, **Then** l'identifiant saisi est conservé, le champ mot de passe est vidé, et l'erreur est signalée selon la maquette (filet et message en rouge d'erreur).
4. **Given** un ou deux champs laissés vides, **When** le membre valide, **Then** il obtient un message d'erreur sans être admis, sans distinction du champ manquant.

---

### User Story 4 - Un membre se déconnecte (Priority: P2)

Un membre connecté déclenche la déconnexion. Sa session prend fin ; il est ramené à un état non connecté, et toute nouvelle tentative d'atteindre l'administration le renvoie de nouveau vers la connexion.

**Why this priority**: Fermer l'accès est le pendant de l'ouvrir — indispensable sur un poste partagé et pour la maîtrise de la session. Il complète le cycle vérifiable « se déconnecter le referme », juste après l'admission et le refus.

**Independent Test**: Connecté, déclencher la déconnexion, puis demander une adresse d'administration et constater le renvoi vers la connexion.

**Acceptance Scenarios**:

1. **Given** un membre connecté, **When** il déclenche la déconnexion, **Then** sa session prend fin et il est ramené à un état non connecté.
2. **Given** un membre venant de se déconnecter, **When** il demande une adresse d'administration, **Then** il est renvoyé vers la page de connexion.
3. **Given** un membre déconnecté, **When** il utilise le bouton « précédent » du navigateur pour revenir sur une page d'administration, **Then** il n'obtient aucun contenu d'administration et est renvoyé vers la connexion.

---

### User Story 5 - La session persiste raisonnablement puis expire (Priority: P3)

Un membre qui s'est connecté n'a pas à ressaisir ses identifiants à chaque page ni à chaque courte interruption : sa session persiste sur une durée raisonnable. Passé ce délai, elle expire d'elle-même ; le membre est alors traité comme non connecté et doit se reconnecter pour poursuivre.

**Why this priority**: Le confort d'une session persistante et la sûreté d'une expiration sont réels mais secondaires par rapport à l'admission, au refus et à la déconnexion, qui suffisent à démontrer la feature.

**Independent Test**: Se connecter, revenir après une courte absence et constater que l'accès reste ouvert ; simuler l'atteinte de la durée d'expiration et constater que l'accès est de nouveau refusé et renvoie vers la connexion.

**Acceptance Scenarios**:

1. **Given** un membre connecté, **When** il revient après une courte interruption au sein de la durée de session, **Then** il accède à l'administration sans ressaisir ses identifiants.
2. **Given** une session dont la durée d'expiration est atteinte, **When** le membre demande une adresse d'administration, **Then** il est traité comme non connecté et renvoyé vers la connexion.
3. **Given** une session expirée, **When** le membre se reconnecte, **Then** une nouvelle session est ouverte et l'accès est de nouveau accordé.

---

### Edge Cases

- **Déjà connecté sur la page de connexion** : un membre déjà connecté qui ouvre la page de connexion est mené à l'espace d'administration plutôt que de revoir le formulaire.
- **Retour après connexion vers la page demandée** : un visiteur renvoyé vers la connexion depuis une adresse d'administration précise est, après connexion, mené vers cet espace, et non vers une destination arbitraire — sans qu'une adresse de retour fournie puisse le diriger hors du site.
- **Casse et espaces de l'identifiant** : l'identifiant est comparé sans sensibilité à la casse ni aux espaces de début et de fin, pour ne pas refuser un membre légitime sur une différence typographique.
- **Double soumission / double déconnexion** : soumettre deux fois la connexion, ou se déconnecter deux fois, ne produit ni erreur brute ni état incohérent.
- **Session révoquée ou compte supprimé** : une session dont le compte n'existe plus est traitée comme non connectée à la première demande d'administration.
- **Champ mot de passe et journaux** : le mot de passe n'est jamais réaffiché ni consigné en clair, y compris après une erreur.
- **Requête d'administration sans page (action serveur)** : une action serveur d'administration appelée sans session valide est refusée par défaut, indépendamment de tout affichage de page.

## Requirements *(mandatory)*

### Functional Requirements

**Page de connexion**

- **FR-001**: Le système DOIT exposer une page de connexion demandant un identifiant (adresse e-mail) et un mot de passe, et un moyen de valider la saisie.
- **FR-002**: La page de connexion DOIT reprendre la structure de la maquette `docs/design/html/connexion.html` — écran centré, mot-symbole ramenant à l'accueil, titre « Connexion », champ « E-mail », champ « Mot de passe », bouton « Se connecter » — dans les deux thèmes et sans introduire de gabarit de navigation.
- **FR-003**: Le mot de passe saisi NE DOIT jamais être réaffiché après une soumission, ni exposé dans l'adresse, ni consigné en clair.

**Admission et refus**

- **FR-004**: Le système DOIT admettre un visiteur qui présente un identifiant et un mot de passe correspondant à un compte de rédaction, et lui ouvrir l'accès aux pages d'administration.
- **FR-005**: Le système DOIT refuser toute demande de page d'administration émanant d'un visiteur non connecté et la renvoyer vers la page de connexion, sans exposer aucun contenu d'administration.
- **FR-006**: Le système DOIT refuser toute action serveur d'administration émanant d'une demande sans session valide, indépendamment de l'affichage des pages ; l'autorisation s'accorde explicitement, jamais par défaut d'interdiction.
- **FR-007**: Après une connexion réussie faisant suite à un renvoi depuis une adresse d'administration précise, le système DOIT mener le membre vers l'espace d'administration ; une adresse de retour NE DOIT pouvoir désigner qu'une destination interne au site.
- **FR-008**: Un membre déjà connecté qui ouvre la page de connexion DOIT être mené à l'espace d'administration plutôt que de revoir le formulaire.

**Message d'erreur**

- **FR-009**: En cas d'identifiant inconnu, de mot de passe erroné, ou de champ manquant, le système DOIT afficher un message d'erreur unique, clair et non culpabilisant, identique dans tous ces cas, NE révélant PAS lequel des deux champs est en cause.
- **FR-010**: Après une erreur, le système DOIT réafficher le formulaire en conservant l'identifiant saisi et en vidant le champ mot de passe, et signaler l'erreur selon la maquette (filet et message en rouge d'erreur, hors palette d'accent).
- **FR-011**: Le système NE DOIT pas laisser le message d'erreur, le temps de réponse ni tout autre signal distinguer « identifiant inconnu » de « mot de passe erroné ».
- **FR-011a**: Le système DOIT limiter le débit des tentatives de connexion par adresse IP (fenêtre glissante) et refuser temporairement les tentatives au-delà d'un seuil, sans verrouiller le compte visé. Le refus temporaire NE DOIT PAS révéler l'existence ou non d'un compte (même indistinction que FR-009/FR-011).

**Déconnexion**

- **FR-012**: Le système DOIT offrir une action de déconnexion à un membre connecté ; elle met fin à sa session et le ramène à un état non connecté.
- **FR-013**: Après déconnexion, toute demande de page d'administration DOIT être refusée et renvoyée vers la connexion, y compris via l'historique du navigateur.

**Session**

- **FR-014**: Le système DOIT maintenir l'état connecté d'un membre d'une page à l'autre sur une durée de session raisonnable, sans redemander les identifiants à chaque navigation.
- **FR-015**: La session DOIT expirer d'elle-même au terme d'une **durée absolue de 30 jours** fixée à la connexion (indépendante de l'activité) ; passé ce terme, le membre DOIT être traité comme non connecté et renvoyé vers la connexion.
- **FR-016**: Une session dont le compte associé n'existe plus DOIT être traitée comme non connectée à la première demande d'administration.

**Comptes de rédaction**

- **FR-017**: Le système DOIT reconnaître au moins un compte de rédaction **stocké en base** — identifiant (adresse e-mail) et **empreinte du mot de passe hachée (argon2)**, jamais le mot de passe en clair — **initialisé par le seed rejouable**, hors de toute inscription publique, gestion de comptes ou réinitialisation de mot de passe dans ce périmètre. Aucun secret de compte n'est porté par la configuration serveur.
- **FR-018**: L'identifiant DOIT être comparé sans sensibilité à la casse ni aux espaces de début et de fin.

**Présentation, thèmes et accessibilité**

- **FR-019**: La page de connexion DOIT exister en thème clair et en thème sombre, du mobile au grand écran, en respectant les tokens et la sobriété (rayon 0, sans ombre ni dégradé), sans défilement horizontal à 375 px.
- **FR-020**: Tout élément interactif de la page (champs, bouton, mot-symbole, lien éventuel) DOIT porter un repère de focus visible ; l'ouverture DOIT respecter le thème du système d'exploitation puis le choix persisté sans flash ; toute animation DOIT se désactiver sous réduction de mouvement (la constitution prime sur les défauts de la maquette).
- **FR-021**: Le message d'erreur DOIT être annoncé de façon accessible (perceptible au lecteur d'écran) et associé au formulaire, sans reposer uniquement sur la couleur.

### Key Entities *(include if feature involves data)*

- **Compte de rédaction** : l'entité qui autorise l'accès à l'administration. Attributs pertinents ici : un identifiant (adresse e-mail) unique servant à la connexion, et un mot de passe conservé sous forme non réversible (jamais en clair). Aucune autre donnée de profil n'est requise par cette feature. Le rôle éventuel est un attribut texte validé par le code, jamais un type porté par la base (portabilité).
- **Session** : l'état « ce visiteur est ce membre connecté », établi à la connexion, présenté à chaque demande d'administration, détruit à la déconnexion et caduc à l'expiration. Elle porte de quoi identifier le compte, de quoi vérifier son intégrité, et son terme d'expiration. Elle ne stocke aucun secret en clair côté visiteur.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Sans être connecté, 100 % des demandes d'adresses d'administration sont renvoyées vers la page de connexion, aucun contenu d'administration n'étant exposé.
- **SC-002**: Avec les identifiants du compte de rédaction d'exemple, un membre se connecte et atteint l'espace d'administration en moins de trois étapes (ouvrir la page, saisir, valider).
- **SC-003**: Après déconnexion, 100 % des demandes d'adresses d'administration sont de nouveau renvoyées vers la connexion, y compris via l'historique du navigateur.
- **SC-004**: Pour un identifiant inconnu et pour un mot de passe erroné sur un identifiant connu, le message affiché est identique au caractère près et ne désigne aucun champ.
- **SC-005**: Le mot de passe n'apparaît jamais réaffiché dans le formulaire, ni dans l'adresse, ni dans les journaux en clair.
- **SC-006**: Une session reste valide pendant toute la durée retenue et est refusée dès son terme atteint ; une session dont le compte n'existe plus est refusée.
- **SC-007**: La page de connexion s'affiche conformément à la maquette dans les deux thèmes, du mobile (≈390 px) au grand écran, sans défilement horizontal à 375 px, et passe le seuil Lighthouse ≥ 90 (accessibilité, contrastes AA vérifiés dans les deux thèmes).

## Assumptions

- **Périmètre strictement limité à l'entrée** : cette feature n'apporte aucun écran d'administration (composer la Une, éditer un article, médias) ni aucun outil d'édition ; elle établit uniquement la frontière connecté / non connecté. Les écrans protégés viennent aux features suivantes.
- **Provisionnement des comptes hors périmètre** : au moins un compte de rédaction est établi par le **seed rejouable**, stocké **en base** avec l'empreinte argon2 de son mot de passe (clarification du 2026-07-23). Il n'y a ni inscription publique, ni écran de création/gestion de comptes, ni réinitialisation de mot de passe — ce dernier étant explicitement un écran non maquetté renvoyé à plus tard par la constitution. Le mot de passe d'amorçage employé par le seed est un secret d'exploitation, hors périmètre de modélisation.
- **Identifiant = adresse e-mail** : la maquette `connexion.html` porte un champ « E-mail » ; l'« identifiant » de la demande est donc l'adresse e-mail du membre. La validité formelle de l'adresse n'est pas un critère d'admission (seule compte la correspondance avec un compte).
- **Durée de session** : fixée (clarification du 2026-07-23) à une **durée absolue de 30 jours** à compter de la connexion, sans repoussement par l'activité et sans option « se souvenir de moi » distincte.
- **Limitation des tentatives** : fixée (clarification du 2026-07-23) à une **limitation de débit par adresse IP** sur la route de connexion (fenêtre glissante, refus temporaire au-delà d'un seuil), sans verrouillage de compte. Le seuil exact, la taille de la fenêtre et la durée du refus temporaire sont des réglages à fixer au plan ; FR-011a en pose le comportement.
- **Réutilisation du socle visuel** : la page de connexion réutilise les tokens, le mot-symbole (`public/brand/`) et le mécanisme de thème livrés par les Fondations ; elle ne redéfinit aucune valeur. La maquette pointe vers des `wordmark-*.png` inexistants : les actifs réels de `public/brand/` s'y substituent.
- **Pas de « se souvenir de moi » distinct** : aucune case « rester connecté » n'apparaît dans la maquette ; la persistance de session est le comportement par défaut unique, sans option supplémentaire dans ce périmètre.
