# Contrat des tokens et du thème — Fondations

**Feature** : [spec.md](../spec.md) · **Date** : 2026-07-18

Ce que les features suivantes peuvent tenir pour acquis, et ce qu'elles n'ont pas le droit de
faire. Le raisonnement qui a conduit à cette architecture est en
[research.md](../research.md) D2 à D6.

---

## 1. Chaîne des valeurs

```text
docs/design/html/tokens.md      source de vérité — la seule
        │  transcription mécanique
        ▼
app/assets/css/tokens.css       variables CSS, :root et html.dark
        │  @theme inline (aucune valeur recopiée)
        ▼
utilitaires Tailwind            bg-paper, text-ink, border-line…
```

**Règle** : aucun code couleur, aucune cote ne s'écrit ailleurs que dans `tokens.css`. Un
littéral de couleur trouvé dans un composant est un défaut, pas un raccourci.

**Valeur manquante** : elle constitue une **lacune** de `tokens.md` au sens du principe II.
Elle se remonte pour amendement du fichier ; elle ne se fige pas en dur dans un composant.

---

## 2. Utilitaires de couleur disponibles

| Utilitaire | Token | Emploi |
|---|---|---|
| `bg-paper` · `text-paper` | `--paper` | Fond de page |
| `bg-surface` | `--surface` | Aplats, fonds de vignette 16:9 |
| `text-ink` · `bg-ink` · `border-ink` | `--ink` | Titres, corps, **repère de focus** |
| `text-muted` | `--muted` | Méta, dates, libellés secondaires |
| `border-line` | `--line` | Filets et séparateurs de 1 px |
| `text-accent` · `border-accent` | `--accent` | Accent rationné — voir §4 |

Ces utilitaires basculent avec le thème sans variante `dark:` : les variables changent sous
`html.dark`. La variante `dark:` reste disponible pour les cas qu'un token ne couvre pas.

---

## 3. Ce qui n'existe pas, et ne doit pas être recréé

Les familles d'utilitaires suivantes sont **supprimées** du projet (principe I) :

| Famille | État |
|---|---|
| Rayon de bordure (`rounded-*`) | Supprimée — l'écrire n'a aucun effet |
| Ombres (`shadow-*`, `inset-shadow-*`, `drop-shadow-*`) | Supprimées — sans effet |
| Dégradés (`bg-linear-*`, `from-*`, `via-*`, `to-*`) | **Toujours disponibles** — interdits par contrôle en intégration continue |

Les dégradés ne relevant d'aucun espace de noms de thème, ils ne peuvent pas être désactivés
et restent donc écrivables. Un contrôle textuel les rejette, dégradés en CSS brut compris. Ne
pas les employer, et ne pas contourner le contrôle.

Sont également proscrits : réintroduire un arrondi ou une ombre en CSS brut, et poser
l'accent en fond de bloc ou de bouton.

---

## 4. Emploi de l'accent

`tokens.md` §1 le rationne à trois emplacements ; les maquettes en constatent d'autres, et
le principe III tranche : **l'accent apparaît là où les fichiers de `docs/design/html/` le
placent, et nulle part ailleurs.**

En Fondations, l'accent apparaît à **deux endroits, et deux seulement** :

1. le **soulignement de 2 px** de la rubrique active dans la colonne de navigation
   (`accueil.html:61`) ;
2. le **spécimen** du nuancier de `/styleguide` — aplat de couleur et libellé hexadécimal
   (`guide-de-style.html:188,198`).

Le repère de focus est en `--ink`, pas en accent — voir §5.

**Le spécimen n'est pas une exception à la règle « jamais en fond ».** Un nuancier ne fait pas
un emploi décoratif de l'accent : il montre la couleur comme elle-même, dans une planche dont
c'est l'objet. La règle « ni fond de bloc ni fond de bouton » reste entière pour tout le
reste du site. Cette distinction est consignée ici parce qu'une lecture littérale de la règle
conduirait sinon à croire la planche fautive, ou à s'en écarter en silence.

**Écran sans maquette** : si l'accent y paraît nécessaire, la question se pose au porteur du
projet avant d'écrire la ligne. Pas d'extrapolation par analogie.

---

## 5. Repère de focus

| Propriété | Valeur | Raison |
|---|---|---|
| Couleur | `--ink` | Mesuré 19,80:1 en clair et 18,05:1 en sombre sur le fond de page |
| Épaisseur | 2 px | Cohérent avec l'épaisseur des états actifs de `tokens.md` §3 |
| Décalage | 2 px | Détache le repère du bord de l'élément |

**Interdit** : tracer le repère de focus en `--line`. Mesuré à **1,25:1** en clair et
**1,30:1** en sombre — très en dessous du seuil de 3:1, donc pratiquement invisible. La
cohérence visuelle avec les filets ne justifie pas un repère qu'on ne voit pas.

**Interdit** : supprimer le repère sans remplacement. Les maquettes le font neuf fois ; c'est
le premier défaut relevé par le principe VIII.

---

## 6. Contrat de thème

| Élément | Valeur |
|---|---|
| Fourni par | `@nuxtjs/color-mode` 4.0.1, en mode classe |
| Mécanisme | Classe `dark` sur `<html>` — obtenue par `classSuffix: ''` |
| Clé de stockage | `francometre-theme` |
| Valeurs enregistrées | `light`, `dark`, `system` (vocabulaire du module) |
| Préférence par défaut | `system` |
| Repli si le système ne se prononce pas | `light` |
| Résolution initiale | Script publié par le module dans le `<head>`, avant la première peinture |
| Lecture et écriture | `useColorMode()` du module — pas de composable maison |

**`classSuffix: ''` n'est pas un détail de confort.** Le module suffixe les classes par
`-mode` par défaut : sans cette option, `<html>` porte `dark-mode`, et **ni** les tokens de
`tokens.css` **ni** `@custom-variant dark` ne s'appliquent. Le site resterait en clair sans
qu'aucune erreur ne le signale.

**Garanties pour les features suivantes** :

1. À l'exécution d'une page, la classe de thème est **déjà posée** : aucun composant n'a à la
   calculer, et aucun ne doit le faire au montage — ce serait le flash que FR-015 interdit.
2. Tout écran livré est rendu dans les **deux** thèmes. Un écran mono-thème n'est pas
   livrable (principe IV).
3. Le contraste se mesure **deux fois**, une fois par thème. L'accent n'ayant pas la même
   valeur d'un thème à l'autre, une mesure unique ne vaut rien.

---

## 7. Point de rupture

| Nom | Valeur | Comportement |
|---|---|---|
| `socle` | 1000 px | ≥ 1000 px : colonne latérale permanente · < 1000 px : barre supérieure |

Décidé **une seule fois**, en Fondations (principe V). Les features suivantes s'y conforment
sans le rediscuter. Gouttière : 24 px au-dessus du point de rupture, 20 px en dessous
(`tokens.md` §6).

---

## 8. Rendre le thème opposé — le cas du nuancier

La planche de style affiche **les deux thèmes côte à côte** : la palette sombre est rendue à
l'intérieur du thème clair, et réciproquement (`guide-de-style.html:191`). Sans disposition
particulière, cela obligerait à écrire des valeurs en dur dans `styleguide.vue` — et à faire
échouer le contrôle « aucune valeur de couleur hors de `tokens.css` ».

**Disposition retenue** : `tokens.css` déclare les deux jeux sur des sélecteurs de portée en
plus des sélecteurs de thème.

```css
:root,     .theme-clair  { --paper:#FFFFFF; /* … */ }
html.dark, .theme-sombre { --paper:#0B0B0C; /* … */ }
```

Un sous-arbre portant `.theme-sombre` rend alors le thème sombre quel que soit le thème actif,
en n'employant que des utilitaires (`bg-paper`, `text-ink`…). Aucune valeur n'est recopiée, et
le contrôle CI passe **sans exemption**.

**Libellés hexadécimaux du nuancier** : ils sont lus à l'exécution depuis la valeur calculée
de la variable CSS, jamais saisis en texte. Deux bénéfices : aucun littéral dans
`styleguide.vue`, et un libellé qui ne peut pas diverger de la valeur réelle du token.

## 9. À amender avant la clôture de la feature

Trois valeurs décidées ici sont absentes de `tokens.md` et doivent y être ajoutées — le
principe II exige de combler les lacunes plutôt que de figer les valeurs en dur :

- le point de rupture de 1000 px ;
- le repère de focus (2 px `--ink`, décalage 2 px) ;
- l'absence de transition à la bascule de thème (la bascule est instantanée).
