# Modèle de données — Fondations

**Feature** : [spec.md](./spec.md) · **Date** : 2026-07-18

Fondations ne livre **aucune base de données**. Les principes VI (portabilité du stockage et
du schéma) et VII (assainissement, administration fermée) de la constitution ne trouvent pas
d'application ici : rien n'est persisté côté serveur, aucun HTML d'éditeur n'est reçu, aucune
route d'administration n'est ouverte.

Les « entités » de cette feature sont donc de trois natures :

1. des **constantes de code** (les huit rubriques) ;
2. un **état local au navigateur** (la préférence de thème) ;
3. un **contrat de présentation** (les données que la vignette sait afficher), dont la
   provenance relève des features de contenu.

---

## 1. Rubrique — constante de code

Les huit rubriques sont figées dans le code, pas en base. Leur ordre est invariable
(constitution, « Contraintes de conception »).

| Champ | Type | Règle |
|---|---|---|
| `id` | texte | Identifiant stable, sans diacritique ni espace. Sert de clé de pictogramme et de segment d'URL |
| `libelle` | texte | Libellé affiché, en français, diacritiques compris |
| `chemin` | texte | Destination de navigation, dérivée de `id` |

**Valeurs, dans l'ordre imposé :**

| Rang | `id` | `libelle` | `chemin` |
|---|---|---|---|
| 1 | `environnement` | Environnement | `/rubrique/environnement` |
| 2 | `sport` | Sport | `/rubrique/sport` |
| 3 | `education` | Éducation | `/rubrique/education` |
| 4 | `sante` | Santé | `/rubrique/sante` |
| 5 | `diplomatie` | Diplomatie | `/rubrique/diplomatie` |
| 6 | `culture` | Culture | `/rubrique/culture` |
| 7 | `technologie` | Technologie | `/rubrique/technologie` |
| 8 | `economie` | Économie | `/rubrique/economie` |

**Règles de validation :**

- La liste comporte **exactement huit** entrées ; l'ordre du tableau **est** l'ordre
  d'affichage, dans la colonne de navigation, dans le menu de petit écran et dans le pied de
  page (FR-005, FR-021, FR-040).
- Chaque `id` possède un pictogramme correspondant. Un `id` sans pictogramme est une erreur
  de construction, pas un cas à traiter à l'exécution.
- Les chemins sont posés dès Fondations bien que les pages n'existent pas encore
  (« Assumptions » de la spécification).

**Consommateurs** : colonne de navigation, panneau de menu, pied de page, et le signalement
de la rubrique courante.

---

## 2. Préférence de thème — état local au navigateur

Aucune persistance serveur, aucun rattachement à un compte (FR-014, entité « Préférence de
thème » de la spécification).

La préférence est gérée par `@nuxtjs/color-mode`, sous la clé `francometre-theme`. Les états
ci-dessous emploient donc le vocabulaire du module — état interne, jamais affiché.

### États

| État | Signification | Origine |
|---|---|---|
| `system` | Aucun choix exprimé — le système décide | Situation initiale (valeur par défaut) |
| `light` | Thème clair forcé par le visiteur | Action sur l'interrupteur |
| `dark` | Thème sombre forcé par le visiteur | Action sur l'interrupteur |

### Transitions

```text
system --actionne l'interrupteur--> light | dark   (le contraire du thème affiché)
light  --actionne l'interrupteur--> dark
dark   --actionne l'interrupteur--> light
```

Aucune transition ne ramène à `system` : l'interrupteur est binaire et Fondations ne livre pas
de retour explicite à « suivre le système » (« Assumptions »). Le module en serait capable —
il suffirait d'écrire `system` dans `preference` —, ce qui rend l'ajout ultérieur d'un
troisième état peu coûteux si le besoin apparaît.

### Résolution du thème affiché

Dans cet ordre, premier applicable :

1. préférence enregistrée, si elle vaut `light` ou `dark` ;
2. préférence du système d'exploitation ;
3. `light`, en dernier recours (`fallback` du module).

### Règles

- Tant que l'état vaut `system`, un changement de préférence système se répercute
  immédiatement sur l'affichage (FR-016). Dès qu'un choix est enregistré, il l'emporte.
- Une valeur enregistrée inconnue ou corrompue retombe sur `system` : on ne fait jamais
  confiance au contenu du stockage.
- Le stockage peut être indisponible (navigation privée, stockage refusé). Le site reste
  alors pleinement utilisable et retombe sur la préférence système ; la seule conséquence est
  que le choix ne survit pas au rechargement (cas limite de la spécification).
- La résolution s'effectue **avant la première peinture** (FR-015). C'est une contrainte de
  séquencement, pas de modèle : elle est traitée dans [research.md](./research.md).

---

## 3. Aperçu d'article — contrat de présentation

Ce n'est pas une entité persistée : c'est le jeu minimal d'informations que la vignette sait
afficher. Fondations en définit la **forme**, jamais la provenance.

| Champ | Type | Obligatoire | Règle |
|---|---|---|---|
| `titre` | texte | oui | Tronqué à trois lignes à l'affichage (FR-026) ; jamais tronqué dans la donnée |
| `rubrique` | `id` de rubrique | oui | Doit correspondre à l'une des huit rubriques |
| `date` | date | oui | Rendue en français, en toutes lettres (« 14 juillet 2026 ») |
| `chemin` | texte | oui | Destination de la vignette entière, qui est intégralement cliquable (FR-027) |
| `image` | clé de média | non | Absente ⇒ la vignette bascule sur son état « sans image » (FR-030) |
| `imageAlt` | texte | conditionnel | **Obligatoire dès que `image` est présente**, et non vide (FR-031) |

**Règles de validation :**

- `image` et `imageAlt` forment un couple : l'un sans l'autre est une erreur. Un `imageAlt`
  vide est un défaut au sens de la constitution (principe VIII), pas une valeur acceptable.
- L'état « sans image » n'est pas un choix de mise en page laissé à l'appelant : il découle
  mécaniquement de l'absence d'`image` (FR-030).
- Une image qui échoue au chargement produit le même rendu que l'absence d'image, plutôt
  qu'une zone vide ou un symbole d'image brisée (cas limite de la spécification).

**Note de portabilité (principe VI, par anticipation)** : le champ est nommé *clé de média*
et non *URL*. Fondations n'ayant pas de base, la règle « aucune URL de média en base » ne
s'applique pas encore ; le vocabulaire est néanmoins fixé dès maintenant pour que les
features de contenu n'aient pas à le corriger. Sur la page de démonstration, les images sont
des substituts locaux — aucun service externe.

---

## 4. Mot-symbole — ressource de marque

| Déclinaison | Fichier | Emploi |
|---|---|---|
| Sombre sur fond clair | `public/brand/NOIR.png` | Thème clair, colonne de navigation **et** pied de page |
| Claire sur fond sombre | `public/brand/BLANC.png` | Thème sombre, colonne de navigation **et** pied de page |

**Règles** (FR-042, FR-042a, décision de la session de clarification du 2026-07-18) :

- Ces deux fichiers sont les **seules** ressources de marque du projet. Aucune déclinaison
  « bloc » n'est produite : le pied de page reprend le même dessin, à sa propre taille.
- Les références des maquettes à `wordmark-bloc-noir.png` et `wordmark-bloc-blanc.png` sont
  **sans objet** et ne doivent pas être reproduites.
- La déclinaison affichée suit le thème actif. Le basculement doit rester correct au premier
  rendu, sans reprise après coup — même contrainte que le thème lui-même (FR-015).
- Le mot-symbole est toujours enveloppé dans un lien vers l'accueil (FR-006), et porte un
  texte alternatif décrivant la marque, jamais vide.

---

## Ce que cette feature ne modélise pas

- Aucun compte, aucune session, aucune authentification.
- Aucun article réel, aucun contenu éditorial, aucune source de données.
- Aucune table, aucun schéma, aucune migration — les portes 9 et 10 de la constitution sont
  sans objet ici et seront évaluées à la première feature qui persiste quelque chose.
