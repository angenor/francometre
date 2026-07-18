# Contrat des composants — Fondations

**Feature** : [spec.md](../spec.md) · **Date** : 2026-07-18

Fondations n'expose aucune interface réseau : elle n'a ni API, ni schéma de base, ni route
serveur. Son contrat est celui que les **features suivantes consommeront** — les composants
du socle, leur interface et leurs garanties d'accessibilité.

Règle générale : ce qui n'est pas déclaré ici n'est pas un point d'extension. Une page de
contenu qui aurait besoin d'un paramètre absent de ces tableaux doit **faire amender le
composant**, jamais le contourner localement (principe I).

---

## `AppShell` — le cadre

Le cadre centré, borné et cerné d'un filet, qui contient toute la page.

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| *(aucun)* | — | — | Le cadre n'est pas paramétrable |

| Emplacement | Contenu attendu |
|---|---|
| `navigation` | La colonne latérale |
| `default` | Le contenu de la page, pied de page compris |

**Garanties** : largeur maximale 1440 px, centré, filet de 1 px sur le pourtour (FR-001) ;
les deux zones sont côte à côte et de même hauteur (FR-002). Au-delà de 1000 px la colonne
est affichée en permanence ; en dessous elle cède la place à la barre supérieure (FR-019,
FR-020).

---

## `AppRail` — la colonne de navigation

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| `rubriqueCourante` | `id` de rubrique ou `null` | `null` | Rubrique à signaler comme page courante |

**Garanties** :

- Largeur fixe de 248 px, filet vertical de 1 px la séparant du contenu (FR-003).
- Ordre imposé : marque, accès à la recherche, les huit rubriques, puis l'interrupteur de
  thème poussé en bas de colonne (FR-004).
- Les huit rubriques dans l'ordre invariable, chacune précédée de son pictogramme (FR-005).
- La rubrique courante porte `aria-current="page"` **et** un signalement visuel ; au plus
  une à la fois ; aucune si `rubriqueCourante` vaut `null` (FR-007).
- Élément `<nav>` porteur d'un nom accessible.
- Si la colonne dépasse la hauteur de la fenêtre, elle défile sans recouvrir le contenu et
  l'interrupteur reste atteignable (cas limite de la spécification).

**Contrat d'appel** : `rubriqueCourante` doit valoir l'un des huit identifiants ou `null`.
Une valeur inconnue ne provoque pas d'erreur mais ne signale rien — le comportement
volontairement retenu plutôt qu'un signalement par défaut arbitraire.

---

## `AppTopbar` — la barre supérieure de petit écran

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| `rubriqueCourante` | `id` de rubrique ou `null` | `null` | Transmise au panneau de menu |

**Garanties** : affichée uniquement en dessous de 1000 px (FR-019) ; porte la marque, le
bouton d'ouverture du menu et l'interrupteur de thème, et rien d'autre. Le bouton d'ouverture
expose son état (`aria-expanded`) et l'élément qu'il commande.

---

## `AppMenuPanel` — le panneau de menu

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| `ouvert` | booléen | `false` | État d'ouverture |
| `rubriqueCourante` | `id` de rubrique ou `null` | `null` | Rubrique signalée |

| Événement | Charge | Quand |
|---|---|---|
| `fermeture` | — | Échappement, contrôle de fermeture, ou franchissement de 1000 px |

**Garanties** :

- Présente **la même** liste de rubriques que la colonne : même ordre, mêmes pictogrammes,
  même signalement de la rubrique courante (FR-021). La liste a une source unique — le
  panneau ne la redéclare pas.
- Refermable par la touche d'échappement **et** par un contrôle de fermeture visible (FR-022).
- Tant qu'il est ouvert, le focus reste à l'intérieur du panneau ; à la fermeture, il revient
  au bouton qui l'a ouvert (FR-022).
- Au franchissement de 1000 px vers le haut, le panneau ne subsiste pas en surimpression
  (cas limite de la spécification).

---

## `AppFooter` — le pied de page

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| *(aucun)* | — | — | Contenu identique sur toutes les pages |

**Garanties** : placé sous le contenu, **à l'intérieur de la colonne de droite** — jamais
sous la colonne de navigation (FR-039). Présente la marque et sa signature, les huit
rubriques, les liens d'information et les liens à suivre (FR-040). Les rubriques mènent aux
mêmes destinations que la colonne (FR-041). Les groupes s'empilent sans débordement à 375 px.

---

## `ArticleCard` — le composant unique de vignette

**Le composant unique du site** (principe I). Toute vignette du site en découle.

| Paramètre | Type | Obligatoire | Rôle |
|---|---|---|---|
| `titre` | texte | oui | Tronqué à trois lignes à l'affichage |
| `rubrique` | `id` de rubrique | oui | Affichée en petites capitales |
| `date` | date | oui | Rendue en français, en toutes lettres |
| `chemin` | texte | oui | Destination — la vignette entière est cliquable |
| `image` | clé de média | non | Absente ⇒ état « sans image » |
| `imageAlt` | texte | conditionnel | **Obligatoire dès que `image` est présente**, non vide |

**Garanties** :

- Structure imposée dans cet ordre : image 16:9, rubrique, titre, date (FR-026).
- Aucun bouton, aucun « lire la suite », aucun chapô. La vignette entière est cliquable
  (FR-027).
- Survol : léger agrandissement de l'image et soulignement du titre, en 150 ms, **et rien
  d'autre** (FR-028). Le focus clavier produit un retour équivalent (FR-029).
- Sans `image` : la zone d'image disparaît, remplacée par un filet supérieur de 2 px en
  `--ink`, suivi de la rubrique, du titre et de la date (FR-030).
- Une image qui échoue au chargement produit le rendu « sans image ».
- Sous `prefers-reduced-motion`, aucune animation (FR-046).

**Ce que le composant n'accepte pas, délibérément** :

- pas de paramètre `sansImage` — l'état découle de l'absence d'image, jamais d'un choix de
  l'appelant (voir [research.md](../research.md) D9) ;
- pas de paramètre de couleur, d'ombre, d'arrondi ou d'espacement — la sobriété n'est pas
  paramétrable ;
- pas de contenu libre : la vignette ne prend pas d'emplacement de contenu.

**Erreur de contrat** : fournir `image` sans `imageAlt`, ou avec un `imageAlt` vide. C'est un
défaut au sens du principe VIII, à faire échouer en développement plutôt qu'à afficher.

---

## `FiletCoupe` — le séparateur signature

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| `position` | pourcentage (`0`–`100`) | `66` | Position de la brisure sur la largeur |

**Garanties** : filet de 1 px se brisant **une seule fois**, 4 px de dénivelé pour 64 px, soit
3,5° — le même angle que la marque (FR-033, FR-034). Décoratif : `aria-hidden` (FR-036).

**Règle d'emploi** (FR-037) : entre deux blocs **dont chacun porte son propre en-tête**.
Partout ailleurs — titre → grille, grille → pagination, sous un champ, sous une ligne de
tableau — c'est le filet **ordinaire** qui s'applique, et non ce composant.

**Valeurs relevées dans les maquettes** : 38 %, 50 %, 60 %, 66 %, 72 %. La position doit
varier d'un filet à l'autre sur une même page (FR-035).

---

## `ThemeToggle` — l'interrupteur de thème

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| `libelle` | booléen | `true` | Afficher le libellé textuel à côté du pictogramme |

**Garanties** :

- Bouton réel, atteignable et actionnable au clavier, portant un libellé textuel décrivant
  l'action et exposant l'état courant du thème (FR-017).
- Une seule action : passer d'un thème à l'autre, et enregistrer le choix (FR-013, FR-014).
- Employé à la fois dans la colonne et dans la barre supérieure — un seul composant, deux
  emplacements.

---

## `RubriqueIcon` — les pictogrammes

| Paramètre | Type | Obligatoire | Rôle |
|---|---|---|---|
| `rubrique` | `id` de rubrique | oui | Tracé à rendre |

**Garanties** : tracé monochrome héritant de `currentColor`, masqué aux technologies
d'assistance — le libellé voisin porte le sens. Les huit identifiants ont un tracé ; il n'y a
pas de tracé de repli, un identifiant inconnu étant une erreur de construction.

---

## `AppButton` — le bouton

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| `variante` | `'primaire' \| 'secondaire' \| 'tertiaire'` | `'secondaire'` | Variante déclarée |
| `indisponible` | booléen | `false` | Rend le bouton inactif |

**Garanties** (FR-050 à FR-052, FR-055) :

| Variante | Fond | Libellé | Bordure | Survol |
|---|---|---|---|---|
| Primaire | `--ink` | `--paper` | 1 px `--ink` | Fond éclairci en clair, assombri en sombre |
| Secondaire | transparent | `--ink` | 1 px `--ink` | Fond `--surface` |
| Tertiaire | transparent | `--ink` | aucune | Soulignement |
| Indisponible | transparent | `--muted` | 1 px `--line` | aucun |

- **L'accent ne touche jamais un bouton** — ni fond, ni bordure, ni libellé. La maquette
  l'énonce explicitement : « L'accent ne touche jamais un bouton ».
- Au survol : aucune ombre, aucun déplacement, aucun autre effet.
- Repère de focus visible en plus de l'état de survol. Les maquettes posent `outline:none`
  sans remplacement ; le principe VIII prime.
- Un bouton indisponible reste perceptible et annoncé comme tel, il ne disparaît pas.

**Ce que le composant n'accepte pas** : paramètre de couleur, d'arrondi, d'ombre ou de
taille libre. Une cinquième variante se déclare **dans le composant**, jamais sur un écran.

---

## `AppField` — le champ

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| `type` | `'ligne' \| 'multiligne' \| 'case'` | `'ligne'` | Nature du champ |
| `libelle` | texte | — | **Obligatoire**, associé au champ |
| `erreur` | texte ou `null` | `null` | Message d'erreur à signaler |

**Garanties** (FR-053, FR-054, FR-056, FR-055) :

- Tout champ porte un libellé associé — jamais un simple texte de substitution en guise
  d'étiquette.
- Saisie sur une ligne : soulignée d'un filet ordinaire (`--line`) qui passe en `--ink` à la
  prise de focus. Saisie multiligne : encadrée d'un filet de 1 px. Case à cocher : 18 px,
  sans arrondi, dans la couleur du texte principal.
- **En plus** du traitement ci-dessus, le repère de focus visible du site s'applique — le
  changement de couleur d'un filet de 1 px ne suffit pas à signaler le focus (principe VIII).
- `erreur` non nul : message et filet dans le **rouge d'erreur hors palette**
  (`#C81E1E` clair / `#FF6B6B` sombre), et l'erreur est associée au champ pour les
  technologies d'assistance. Ce rouge n'est pas de l'accent et ne s'étend nulle part ailleurs.
- L'accent ne signale **rien** dans un formulaire.

---

## `SearchEntry` — le point d'entrée de recherche

| Paramètre | Type | Défaut | Rôle |
|---|---|---|---|
| *(aucun)* | — | — | — |

**Garanties** : contrôle réel, libellé « Rechercher », atteignable et actionnable au clavier,
menant vers la page de résultats de recherche (FR-008).

**Hors contrat** : ni champ de saisie, ni panneau, ni résultats — ils relèvent de la feature
de recherche (FR-008a). Le point d'entrée n'est pas pour autant un leurre : il est atteignable
et correctement annoncé.

---

## Thème — `useColorMode()` de `@nuxtjs/color-mode`

**Aucun composable maison.** Le thème est fourni par le module ; en écrire un doublon serait
une seconde source de vérité sur l'état du thème.

| Membre | Rôle |
|---|---|
| `preference` | Le choix exprimé : `'system'`, `'light'` ou `'dark'`. En lecture et en écriture |
| `value` | Le thème **effectivement affiché** : `'light'` ou `'dark'`. En lecture |

**Garanties** :

- La résolution suit `preference`, puis la préférence système, puis `light` — soit exactement
  l'ordre décrit dans [data-model.md](../data-model.md) §2.
- Tant que `preference` vaut `'system'`, un changement de préférence système se répercute
  (FR-016).
- Le stockage indisponible n'empêche ni l'affichage ni la bascule ; seule la persistance est
  perdue.
- **La résolution initiale n'appartient pas au code applicatif** : le module la fait dans le
  `<head>` avant la première peinture (FR-015). Ne jamais recalculer le thème au montage d'un
  composant — ce serait produire précisément le flash que l'on cherche à éviter.

**Vocabulaire** : le module raisonne en `light` / `dark` / `system`. C'est un état interne,
jamais affiché. Les libellés visibles restent en français, conformément au principe VIII.

---

## `rubriques` — la liste de référence

Liste ordonnée des huit rubriques, exportée comme constante unique et immuable. Détail des
champs et des valeurs : [data-model.md](../data-model.md) §1.

**Garantie** : c'est la **seule** définition des rubriques du projet. La colonne, le panneau
de menu et le pied de page la consomment ; aucun d'eux ne la redéclare. Une neuvième rubrique
s'ajouterait ici, et nulle part ailleurs.
