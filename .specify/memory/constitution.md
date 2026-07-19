<!--
RAPPORT DE SYNCHRONISATION — v1.2.0
===================================
Version : 1.1.0 → 1.2.0
Date : 2026-07-19
Nature du changement : MINOR — portée matériellement précisée. Aucun principe ajouté,
retiré ni redéfini. Un arbitrage en attente est refermé par amendement, comme la
Gouvernance l'exige.

Arbitrage refermé, tranché par le porteur du projet le 2026-07-19 et mis en œuvre par la
feature Modèle et données (specs/002-modele-et-donnees) :

  1. Eyebrow = rubrique ou sous-thème ? → LES DEUX, selon le contexte de lecture.
     L'article gagne un champ sous-thème facultatif. Les 17 eyebrows de rubrique.html
     portant des libellés hors des huit rubriques (Forêts, Énergie, Biodiversité, Eau,
     Climat, Littoral, Territoires, Montagne, Mobilité, Déchets, Faune) sont donc
     valides en l'état et ne se corrigent pas. Consigné aux « Contraintes de
     conception ».

Reste ouvert : l'arbitrage 2 (la Card dans le back-office), à trancher à la
spécification du back-office, échéance inchangée.

Section d'accueil de la règle : le porteur du projet a désigné une section « Qualité et
cohérence », qui n'existe pas dans ce document. La règle a été placée aux « Contraintes
de conception », qui héberge déjà les huit rubriques et l'arbitrage refermé. Aucune
section nouvelle n'a été créée.

Portée volontairement limitée : les bornes de longueur (titre 160 / chapô 300 /
sous-thème 40), l'éviction du rang de Une et le cycle de la date de parution restent
dans specs/002-modele-et-donnees/spec.md. Ce sont des règles de gestion, pas des
principes ; la constitution est injectée dans chaque commande et doit rester courte.

Aucune porte de qualité n'a été ajoutée pour cette règle, conformément à la consigne
« n'ajoute rien d'autre ». Conséquence assumée : la règle d'eyebrow n'est pas contrôlée
par le tableau des portes ; elle se vérifie par les tests de la feature 002 (SC-005).

Modèles synchronisés :
  ✅ .specify/templates/plan-template.md — référence de version corrigée (v1.0.0 →
     v1.2.0) ; les treize portes dérivent de principes que cet amendement ne touche pas.
  ✅ .specify/templates/spec-template.md — relu, aucun changement requis.
  ✅ .specify/templates/tasks-template.md — relu, aucun changement requis.
  ✅ .specify/templates/checklist-template.md — relu, aucun changement requis.
  ✅ .claude/skills/speckit-*/SKILL.md — relus, aucune référence au sous-thème à mettre
     à jour, aucune référence propre à un autre agent.

Note de cohérence hors de ce fichier : CLAUDE.md décrit déjà la règle d'eyebrow
contextuel de manière identique ; aucune divergence à corriger.

---

RAPPORT DE SYNCHRONISATION — v1.1.0
===================================
Version : 1.0.0 → 1.1.0
Date : 2026-07-18
Nature du changement : MINOR — portée matériellement précisée. Aucun principe
retiré, aucun redéfini. Deux arbitrages en attente sont refermés par amendement,
comme la Gouvernance l'exige (« les arbitrages en attente se referment par
amendement, pas par usage tacite »).

Arbitrages refermés, tranchés par le porteur du projet le 2026-07-18 et mis en
œuvre par la feature Fondations (specs/001-fondations-socle-ui) :

  3. Frontière filet ordinaire / filet coupé → règle d'en-tête, contrôle
     mécanique. Consignée au principe I. Valide les maquettes en l'état :
     les passages titre → grille et grille → pagination de rubrique.html
     emploient à bon droit un filet ordinaire.
  4. Mot-symbole → les deux ressources de public/brand/ servent partout, à
     leur propre taille. Aucune déclinaison « bloc » n'est produite ; les 10
     références des maquettes à wordmark-bloc-*.png sont sans objet.
     Consignée au principe I et aux « Contraintes de conception ».

Restent ouverts : les arbitrages 1 (eyebrow = rubrique ou sous-thème ?) et
2 (la Card dans le back-office), à trancher aux échéances déjà indiquées.

Principes ajoutés, supprimés ou renommés : aucun.

Modèles synchronisés :
  ✅ .specify/templates/plan-template.md — relu ; le « Constitution Check »
     dérive des principes, que cet amendement ne modifie pas.
  ✅ .specify/templates/spec-template.md — relu, aucun changement requis.
  ✅ .specify/templates/tasks-template.md — relu, aucun changement requis.
  ✅ .specify/templates/checklist-template.md — relu, aucun changement requis.

Amendement connexe hors de ce fichier : docs/design/html/tokens.md gagne une
section §7 consignant le point de rupture du socle (1000 px), le repère de
focus (2 px --ink, décalage 2 px), l'absence de transition à la bascule de
thème et la taille du texte d'interface (14 px) — quatre lacunes relevées par
le principe II et comblées plutôt que figées en dur.

---

RAPPORT DE SYNCHRONISATION — v1.0.0
===================================
Version : gabarit non renseigné → 1.0.0
Nature du changement : ratification initiale (MAJOR). Les huit principes et les deux
sections de contraintes remplacent intégralement les jetons du gabarit.

Principes ajoutés :
  I.    Sobriété structurelle
  II.   Autorité des sources de design
  III.  Rationnement de l'accent
  IV.   Double thème obligatoire
  V.    Petit écran conçu, jamais recopié
  VI.   Portabilité du stockage et du schéma (NON NÉGOCIABLE)
  VII.  Assainissement serveur et administration fermée par défaut
  VIII. Accessibilité supérieure aux maquettes

Sections ajoutées :
  - Contraintes de conception (sources de vérité, rubriques, arbitrages en attente)
  - Portes de qualité (contrôle vérifiable avant clôture de toute feature)

Principes supprimés ou renommés : aucun (première ratification).

Modèles synchronisés :
  ✅ .specify/templates/plan-template.md — « Constitution Check » renseigné avec les
     huit portes dérivées des principes.
  ✅ .specify/templates/spec-template.md — relu, aucun changement requis : la
     constitution n'ajoute ni ne retire de section obligatoire de spécification.
  ✅ .specify/templates/tasks-template.md — relu, aucun changement requis : les tâches
     d'exemple sont remplacées à chaque génération ; les portes de qualité sont
     imposées par plan-template.md.
  ✅ .specify/templates/checklist-template.md — relu, aucun changement requis.
  ✅ .claude/skills/speckit-*/SKILL.md — relus, aucune référence obsolète ni propre à
     un autre agent.

Correction de chemin appliquée : la saisie initiale citait « docs/design/tokens.md » ;
le fichier réel est docs/design/html/tokens.md. Le chemin réel fait foi partout.

Reports assumés : voir « Arbitrages en attente ». Aucun jeton entre crochets ne subsiste.
-->

# Constitution de Francomètre

Francomètre est un site éditorial français, publié en deux thèmes, servi par un
back-office. Cette constitution s'applique à toute feature, publique comme
administrative, à partir de sa ratification.

## Core Principles

### I. Sobriété structurelle

La retenue n'est pas un style, c'est une contrainte de construction. Ces règles sont
absolues et ne connaissent pas d'exception locale :

- Rayon de bordure **0**, ombre **aucune**, dégradé **aucun** — nulle part, aucun écran,
  aucun état, aucun composant.
- Un **seul** composant Card, réutilisé partout. Toute divergence visuelle entre deux
  emplois de la Card est un défaut à corriger, pas une variante à tolérer. Les variantes
  légitimes sont déclarées explicitement dans le composant (« grand », « sans image »,
  « squelette »), jamais improvisées sur un écran.
- La navigation principale est une **colonne latérale gauche**, jamais une barre
  horizontale : 248 px côté public, 240 px côté back-office.
- Les **huit rubriques** portent chacune un pictogramme au trait, monochrome, héritant de
  la couleur du texte (`currentColor`). Ces pictogrammes font partie du système : les
  retirer est un défaut. Aucune autre icône **décorative** n'est admise ; les icônes
  fonctionnelles déjà présentes dans les maquettes (loupe de recherche, demi-lune de
  bascule de thème, barre d'outils de l'éditeur) sont conservées telles quelles.
- La signature « **coupe à 3,5°** » (cote exacte : 4 px de dénivelé pour 64 px parcourus)
  n'apparaît qu'à **deux** endroits : le mot-symbole et le filet de séparation entre deux
  sections. Une troisième occurrence est un défaut — pas de photo coupée, pas de card
  cisaillée, pas de titre tranché, pas de diagonale décorative.
- **Frontière entre les deux filets** (amendement v1.1.0, arbitrage 3 refermé) : le
  **filet coupé** sépare deux blocs **dont chacun porte son propre en-tête**. Partout
  ailleurs — titre → grille, grille → pagination, sous un champ, sous une ligne de
  tableau — c'est le **filet ordinaire** qui s'applique. Le contrôle est mécanique et ne
  demande aucun jugement : l'en-tête est là, ou il n'y est pas. Les passages relevés sur
  `rubrique.html` sont donc conformes en l'état.
- **Mot-symbole** (amendement v1.1.0, arbitrage 4 refermé) : `public/brand/NOIR.png` et
  `public/brand/BLANC.png` sont les **seules** ressources de marque du projet. Elles
  servent partout — rail de navigation **et** pied de page —, chacune à sa propre taille.
  **Aucune déclinaison « bloc » n'est produite** : les références des maquettes à
  `wordmark-bloc-noir.png` et `wordmark-bloc-blanc.png` sont sans objet et ne se
  reproduisent pas. La déclinaison affichée suit le thème, et ce basculement est **posé
  en CSS**, jamais recalculé au montage — sans quoi il produirait le flash que le
  principe IV interdit. Le mot-symbole est toujours enveloppé dans un lien vers
  l'accueil, avec un texte alternatif réel.

**Raison d'être** : la maquette ne porte aucun `border-radius`, aucune `box-shadow`,
aucun `gradient`. Ce vide est le parti pris du site ; il ne se remplit pas par commodité.

### II. Autorité des sources de design

Quatre niveaux, dans cet ordre. En cas de conflit, le niveau supérieur tranche :

1. **Cette constitution** — et uniquement sur l'accessibilité (principe VIII), seul
   domaine où elle contredit délibérément les maquettes.
2. **`docs/design/html/tokens.md`** — fait foi pour toute **valeur** : couleur, taille,
   graisse, interligne, tracking, espacement, angle, largeur de rail, point de rupture.
3. **`docs/design/html/*.html`** — font foi pour la **structure** de chaque écran et pour
   les **emplacements de l'accent** (principe III).
4. Rien d'autre. Aucune valeur, aucun composant, aucun écart ne s'invente.

Règles d'application :

- Une valeur présente dans une maquette mais **absente** de `tokens.md` est une **lacune**,
  pas une autorisation : elle se remonte pour amendement de `tokens.md`, elle ne se recopie
  pas en dur.
- Chaque `.html` redéfinit ses variables CSS en tête. Le projet n'a **qu'une seule** feuille
  de tokens, dérivée de `tokens.md`. Les redéfinitions par écran ne sont pas à recopier.
- `docs/design/lecture-maquettes.md` est un **constat**, pas une norme : il relève les
  écarts, il ne les arbitre pas. Il ne peut jamais être invoqué comme source de vérité.

### III. Rationnement de l'accent

La règle ne s'énonce pas par liste — toute énumération serait incomplète, les maquettes
comptant plus d'une douzaine d'usages là où `tokens.md` §1 n'en déclare trois. La règle est :

> **L'accent apparaît là où les fichiers de `docs/design/html/` le placent, et nulle part
> ailleurs.**

Il en découle, sans exception :

- **N'ajouter** aucun usage de l'accent de sa propre initiative.
- **Ne retirer** aucun usage présent dans une maquette au motif qu'il contredirait
  `tokens.md` — sur ce point précis, la maquette prime (principe II, niveau 3).
- L'accent n'est **jamais un fond de bloc ni un fond de bouton**. Seule exception constatée
  et conservée : l'entrée active de la navigation du back-office, qui combine
  `border-left: 3px solid var(--accent)` et `background: var(--surface)`.
- Le **rouge d'erreur** (`#C81E1E` clair / `#FF6B6B` sombre) est hors palette et assumé
  comme tel. Il est réservé aux messages et filets d'erreur de formulaire, et n'est pas de
  l'accent : il ne relève pas de la règle ci-dessus et ne s'étend nulle part ailleurs.

**Écran sans équivalent dans les maquettes** : si un écran à construire n'a pas de maquette
et qu'un usage de l'accent y paraît nécessaire, **la question se pose au porteur du projet
avant d'écrire la ligne**. Aucune extrapolation par analogie.

### IV. Double thème obligatoire

- Thème **clair et sombre** sur **chaque** écran, public comme administratif. Un écran
  mono-thème est incomplet, pas livrable.
- Le thème **suit la préférence du système d'exploitation** par défaut, et se surcharge par
  un choix utilisateur **persistant**.
- **Aucun flash** au premier rendu : le thème retenu est appliqué avant la première peinture,
  jamais après hydratation.
- Le contraste passe **AA dans les deux thèmes**. L'accent n'ayant pas la même valeur d'un
  thème à l'autre (`#1F35FF` clair / `#8A97FF` sombre), il se vérifie **deux fois** — une
  mesure faite dans un seul thème ne vaut rien.

**Raison d'être** : les neuf maquettes ne contiennent aucun `prefers-color-scheme` ; le
thème sombre n'y est atteignable qu'en posant `class="dark"` à la main. Le mécanisme de
bascule reste `class="dark"` sur `<html>`, mais sa mise en place est du ressort du code.

### V. Petit écran conçu, jamais recopié

Les maquettes sont dessinées pour le grand écran **uniquement** : elles ne contiennent
aucune media query, et le rail latéral n'y a aucun repli défini.

- Le comportement sur petit écran est donc **à concevoir**, pas à recopier.
- Il se décide **une seule fois**, dans la feature **Fondations** — repli du rail, gouttière,
  échelle typographique mobile, rail horizontal de cards. Toutes les pages suivantes s'y
  conforment sans le rediscuter.
- **Aucun écran ne produit de défilement horizontal à 375 px de large.**
- Là où `tokens.md` documente déjà une valeur mobile (cadre 390 px, gouttière 20 px, titres
  32/40/36 px, rail de cards 250 px, écart de sections 48 px), cette valeur s'applique : elle
  est spécifiée, seulement pas dessinée.

### VI. Portabilité du stockage et du schéma (NON NÉGOCIABLE)

**Objectif tenu à tout moment** : migrer SQLite → PostgreSQL et disque → S3 **sans toucher
au code métier**.

- La base ne stocke **jamais** d'URL de média — **uniquement des clés de stockage**. L'URL
  se calcule à la lecture, elle ne se persiste pas.
- **Aucun** accès au disque ni au stockage objet en dehors d'une **interface Storage unique**.
  Aucun appel direct au système de fichiers ni au SDK d'un fournisseur ailleurs dans le code.
- Le schéma n'emploie **rien** qui n'existe pas à la fois en SQLite **et** en PostgreSQL :
  - **pas d'enum applicatif porté par la base** — un statut est une colonne texte, validée
    par le code métier ;
  - **pas de type JSON** — des colonnes réelles, ou une table liée ;
  - **pas de liste scalaire** — une table d'association ;
  - **pas d'auto-increment** — les identifiants sont produits par l'application.

En cas de tension entre cette règle et une commodité de développement, cette règle gagne
(voir Gouvernance).

### VII. Assainissement serveur et administration fermée par défaut

- **Tout** HTML produit par un éditeur est **assaini côté serveur avant stockage**, sur une
  **liste blanche** de balises. Le HTML venu du client n'est jamais digne de confiance —
  un assainissement côté client est un confort d'affichage, jamais une mesure de sécurité,
  et ne dispense de rien.
- Les routes d'administration sont **refusées par défaut** à un visiteur non authentifié.
  L'autorisation s'accorde explicitement, route par route ; elle ne se déduit pas de
  l'absence d'interdiction.

### VIII. Accessibilité supérieure aux maquettes

**Les maquettes sont en défaut sur l'accessibilité, et cette constitution prime sur elles.**
C'est le **seul** domaine où elles ne doivent pas être copiées.

Socle : HTML sémantique, navigation clavier complète, focus visible, texte alternatif
obligatoire sur les images de couverture. Interface et contenus **en français**.

Six défauts relevés dans les maquettes, à corriger systématiquement :

| Défaut de la maquette | Règle qui s'applique |
|---|---|
| `outline:none` posé 9 fois sans remplacement | Repère de focus visible sur **tout** élément interactif : liens, boutons, champs, sélecteurs, onglets, poignées |
| Aucun `prefers-color-scheme` | Le site s'ouvre dans le thème de l'OS avant toute intervention de l'utilisateur |
| Squelette pulsé en boucle sans garde-fou | Toute animation se désactive sous `prefers-reduced-motion` |
| Mot-symbole enveloppé dans aucun lien | Le mot-symbole ramène à l'accueil |
| `aria-current="page"` sur « Environnement » depuis l'accueil | L'état courant désigne la page réellement affichée, et rien d'autre |
| `alt=""` sur les 60 vignettes du corpus | Toute image de couverture d'article porte un texte alternatif réel |

## Contraintes de conception

**Sources de vérité** (voir principe II pour leur hiérarchie) :

| Fichier | Rôle |
|---|---|
| `docs/design/html/tokens.md` | Toutes les valeurs visuelles |
| `docs/design/html/*.html` (9 écrans) | Structure de chaque écran, emplacements de l'accent |
| `docs/design/lecture-maquettes.md` | Constat des écarts — **non normatif** |
| `public/brand/NOIR.png`, `public/brand/BLANC.png` | Mot-symbole, porteur de la coupe à 3,5° |

**Les huit rubriques**, dans cet ordre invariable dans le rail : Environnement · Sport ·
Éducation · Santé · Diplomatie · Culture · Technologie · Économie.

**Rubrique, sous-thème et eyebrow** (amendement v1.2.0, arbitrage 1 refermé) : un article
porte une **rubrique unique** et un **sous-thème facultatif**. L'eyebrow d'une vignette est
**contextuel** : le **sous-thème** lorsque le lecteur est déjà dans la rubrique de
l'article, la **rubrique** partout ailleurs, la **rubrique** en l'absence de sous-thème. Le
titre est stocké **sans préfixe** : la composition « Sous-thème : Titre » relève de
l'affichage, jamais du contenu.

**Écrans couverts par une maquette** : accueil, rubrique, article, connexion, états
(404/500/squelettes), back-office articles, back-office composer la une, back-office éditeur,
guide de style. Tout autre écran — Médias, résultats de recherche, mot de passe oublié, page
auteur, confirmation de suppression, rubrique vide, 403 — est à concevoir, et déclenche la
clause de consultation du principe III si l'accent y paraît nécessaire.

### Arbitrages en attente

Un point reste ouvert. Il ne bloque aucune feature, mais **doit être tranché par le porteur
du projet** au moment indiqué, et non par défaut au fil du code.

*Les arbitrages 3 (frontière des filets) et 4 (mot-symbole) ont été refermés par
l'amendement v1.1.0 ; les règles retenues sont consignées au principe I. L'arbitrage 1
(eyebrow = rubrique ou sous-thème ?) a été refermé par l'amendement v1.2.0 ; la règle
retenue est consignée ci-dessus, aux « Contraintes de conception ».*

2. **La Card dans le back-office.** Le back-office n'emploie pas la Card mais trois dérivés
   en pixels fixes et non documentés (`.slot`, `.pub`, `.thumb`), ce que le principe I
   qualifie de divergence. → **À trancher à la spécification du back-office** : variantes
   déclarées de la Card unique, ou correction des écrans.
## Portes de qualité

Aucune feature n'est close tant que ces contrôles ne passent pas. Ils sont vérifiés sur les
écrans livrés par la feature, dans les deux thèmes.

| # | Porte | Contrôle |
|---|---|---|
| 1 | Sobriété | Aucun `border-radius` non nul, aucune `box-shadow`, aucun `gradient` dans le diff |
| 2 | Card unique | Tout emploi passe par le composant Card ; toute variante est déclarée dans le composant |
| 3 | Coupe à 3,5° | Exactement deux porteurs de la diagonale : mot-symbole et filet de séparation |
| 4 | Accent | Chaque occurrence est traçable à une maquette de `docs/design/html/` ; aucun accent en fond, hors l'entrée active de la nav back-office |
| 5 | Thème | Les deux thèmes rendus ; ouverture sur le thème de l'OS ; choix persistant ; aucun flash au premier rendu |
| 6 | Contraste | AA vérifié **dans les deux thèmes**, accent mesuré deux fois |
| 7 | Petit écran | Aucun défilement horizontal à 375 px ; conforme aux décisions de Fondations |
| 8 | Accessibilité | Focus visible sur tout élément interactif ; animations neutralisées sous `prefers-reduced-motion` ; `aria-current` sur la page réellement affichée ; `alt` réel sur toute image de couverture ; parcours clavier complet |
| 9 | Portabilité | Aucune URL de média en base ; aucun accès stockage hors interface Storage ; schéma sans enum de base, sans JSON, sans liste scalaire, sans auto-increment |
| 10 | Sécurité | HTML d'éditeur assaini côté serveur sur liste blanche avant stockage ; routes d'administration refusées par défaut sans authentification |
| 11 | Langue | Interface et contenus en français, orthographe et diacritiques corrects |

Une porte qui ne peut pas passer se déclare dans « Complexity Tracking » du plan, avec sa
justification et l'alternative plus simple écartée. Elle ne se contourne pas en silence.

## Governance

**Primauté.** Cette constitution prime sur toute autre pratique, habitude ou préférence
d'outillage. Toute décision technique se justifie au regard de ces principes.

**Résolution des conflits.** En cas de tension, l'ordre est le suivant :

1. La **portabilité** (principe VI) et la **sobriété** (principe I) l'emportent sur la
   commodité de développement — sans discussion.
2. L'**accessibilité** (principe VIII) l'emporte sur la fidélité aux maquettes — et sur ce
   seul terrain.
3. Pour toute **valeur** visuelle, `tokens.md` tranche ; pour toute **structure** d'écran et
   tout **emplacement d'accent**, les fichiers de `docs/design/html/` tranchent.

**Amendement.** Un amendement se documente dans ce fichier, s'accompagne du rapport de
synchronisation en tête, et propage ses effets aux gabarits de `.specify/templates/`. Les
arbitrages en attente se referment par amendement, pas par usage tacite.

**Versionnage.** Semver appliqué à la gouvernance :
**MAJOR** = retrait ou redéfinition incompatible d'un principe ;
**MINOR** = principe ou section ajouté, ou portée matériellement étendue ;
**PATCH** = clarification, reformulation, correction sans effet sémantique.

**Conformité.** Le contrôle « Constitution Check » de `plan-template.md` est évalué avant la
phase 0 puis réévalué après la phase 1 de chaque plan. Les portes de qualité sont vérifiées
avant clôture de chaque feature. Un écart non déclaré est un défaut, au même titre qu'une
régression.

**Version**: 1.2.0 | **Ratified**: 2026-07-18 | **Last Amended**: 2026-07-19
