# Mise en route et vérification — Fondations

**Feature** : [spec.md](./spec.md) · **Plan** : [plan.md](./plan.md) · **Date** : 2026-07-18

Comment lancer le socle et **prouver** qu'il satisfait ses critères d'acceptation. Ce guide ne
contient pas de code d'implémentation : les composants sont décrits dans
[contracts/composants.md](./contracts/composants.md), les valeurs dans
[contracts/tokens-et-theme.md](./contracts/tokens-et-theme.md).

---

## Prérequis

- **Node.js 22.12+ ou 24.11+** et npm — la plage exigée par Nuxt 4.4.8, désormais déclarée
  dans `package.json` (`engines`) pour que `npm install` la fasse respecter. **Node 20 ne
  convient pas.** Aucun runtime serveur supplémentaire : Nitro produit le serveur sur sa
  cible par défaut (amendement du 2026-07-18, [plan.md](./plan.md))
- **python3** — pour le contrôle de contrastes (`contrastes.py`), plus bas
- Un navigateur permettant de changer la préférence de thème du système d'exploitation
- Les deux ressources de marque déjà présentes : `public/brand/NOIR.png` et
  `public/brand/BLANC.png`

## Installation

```bash
npm install
npx playwright install chromium
```

Dépendances attendues et versions épinglées : voir [plan.md](./plan.md),
« Primary Dependencies ».

Deux absences sont volontaires et à vérifier :

- **pas de `@nuxtjs/tailwindcss`** — ce n'est pas la voie officielle pour Tailwind v4 ;
- **pas de `tailwind.config.js`** — la v4 se configure entièrement en CSS. Ce fichier, s'il
  apparaît, est un retour à la v3 et n'a aucun effet.

## Lancer

```bash
npm run dev                       # développement
```

```bash
npm run build                     # compilation Nitro, cible Node par défaut
node .output/server/index.mjs     # PORT=3100 pour changer de port
```

Et pour jouer la vérification **contre la compilation** plutôt que contre le serveur de
développement — ce que la définition de terminé exige :

```bash
npm run build
FRANCOMETRE_BUILD=1 npm run test:e2e
```

Playwright démarre et arrête lui-même le serveur compilé, sur le port 3100. Lancer ce serveur
à la main en arrière-plan est déconseillé : rien ne garantit qu'il survive à toute la suite,
et une chute en cours de route se lit comme une avalanche de faux échecs.

La seule page livrée est la planche de style :
<http://localhost:3000/styleguide>. Toute autre adresse renvoie une 404 — c'est le
comportement attendu, Fondations ne livrant aucune page de contenu (FR-049).

---

## Vérification automatisée

```bash
npm run test:e2e          # l'ensemble
npx playwright test tests/e2e/theme.spec.ts --headed   # une famille, en observant
```

| Fichier | Ce qu'il prouve | Critères |
|---|---|---|
| `theme.spec.ts` | Ouverture sur le thème du système, bascule, persistance sur dix rechargements, **absence de flash** | FR-012 à FR-016, SC-004 |
| `navigation.spec.ts` | Ordre de la colonne, huit rubriques, rubrique courante annoncée, parcours clavier | FR-004 à FR-007, SC-003 |
| `responsive.spec.ts` | Cinq largeurs, aucun débordement, repli de la colonne, menu refermable au clavier | FR-019 à FR-024, SC-002, SC-006 |
| `card.spec.ts` | Trois états, troncature à trois lignes, mouvement neutralisé | FR-025 à FR-032, SC-010 |
| `filet.spec.ts` | Brisure unique, cote de 64 px, positions distinctes, filet hors de l'arbre d'accessibilité | FR-033 à FR-038 |
| `footer.spec.ts` | Placement dans la colonne de droite, huit rubriques aux mêmes destinations, empilement | FR-039 à FR-041 |
| `a11y.spec.ts` | axe-core sur les deux thèmes, menu ouvert compris | FR-043 à FR-046, SC-005 |

**Attendu** : tout au vert. Un échec est un défaut à corriger, jamais un test à assouplir.

Les tests visent le serveur de développement par défaut. Pour les rejouer **contre la
compilation** — ce que la définition de terminé exige — voir la section « Lancer » ci-dessus.

### Le test qui compte le plus

L'absence de flash est le critère le plus facile à croire acquis à tort. Un test qui se
contente de lire la classe de thème **après** chargement passera même si la page a clignoté.
Il faut vérifier que la classe est posée dès le tout premier état du document, avant toute
peinture — donc enregistrer le thème contraire à celui du système, charger, et constater
qu'aucun état intermédiaire n'a montré l'autre thème.

### Contrôles de sobriété

```bash
npm run verifier
```

Trois contrôles, dans `scripts/verifier.mjs` :

1. **Dégradés** — ils ne relèvent d'aucun espace de noms de thème, ne peuvent donc pas être
   supprimés comme les autres familles, et sont rejetés textuellement (research D3).
2. **Valeurs de couleur hors de `tokens.css`** — aucune exemption de fichier. Le nuancier de
   la planche passe grâce aux sélecteurs de portée et à des libellés lus à l'exécution, pas
   grâce à une dérogation.
3. **Retour à Tailwind v3** — ni `tailwind.config.*`, ni `@nuxtjs/tailwindcss`.

> **Ne pas remplacer le contrôle n° 2 par un `grep` de `#[0-9a-fA-F]{3,8}`.** Ce motif lit les
> entités HTML numériques comme des couleurs — `&#8239;`, l'espace fine insécable, y ressemble
> à s'y méprendre. Le script les neutralise avant de chercher.

`rounded-*`, `shadow-*` et `drop-shadow-*` n'ont pas besoin de contrôle : ces utilitaires
sont supprimés du projet et n'ont aucun effet s'ils sont écrits.

### Contrastes

```bash
python3 specs/001-fondations-socle-ui/contrastes.py
```

**Attendu** : tous les couples de texte à « oui » dans les deux thèmes. Deux lignes sont
volontairement au rouge et doivent le rester — `line sur paper` (1,25) et `accent sur ink`
(2,84) : ce sont les deux combinaisons interdites, pas des régressions
([research.md](./research.md) D6).

---

## Vérification à la main

Ce qu'aucun outil ne juge à votre place. À dérouler dans les **deux** thèmes.

### La charpente (US1)

1. Ouvrir `/styleguide` en 1440 px de large.
2. Le cadre est centré, borné, cerné d'un filet ; la colonne est **à gauche**, sur toute la
   hauteur, séparée du contenu par un filet vertical.
3. Élargir la fenêtre au-delà de 1440 px : le cadre reste centré, sans s'étirer.
4. Parcourir la colonne de haut en bas : marque, recherche, les huit rubriques dans l'ordre
   (Environnement, Sport, Éducation, Santé, Diplomatie, Culture, Technologie, Économie),
   puis l'interrupteur de thème **en bas de colonne**, détaché.
5. Au clavier seul, depuis la barre d'adresse : chaque arrêt montre un repère de focus net.
   Un repère à peine visible signale un tracé en `--line` — c'est le défaut à ne pas laisser
   passer.

### Le thème (US2)

1. Régler le système en sombre, vider le stockage du site, recharger : la page s'ouvre en
   sombre, sans passer par le clair, même brièvement.
2. Basculer, naviguer, recharger, fermer et rouvrir le navigateur : le choix tient.
3. Vider le stockage, puis changer la préférence système pendant que la page est ouverte :
   l'affichage suit. Refaire l'essai **après** avoir choisi un thème : l'affichage ne suit
   plus — le choix l'emporte.
4. En navigation privée avec stockage refusé : le site reste utilisable, sans erreur ; seule
   la persistance est perdue.

### Le petit écran (US3)

1. À 375 px : la colonne a cédé la place à une barre supérieure minimale — marque, bouton de
   menu, interrupteur. Le contenu occupe toute la largeur.
2. Ouvrir le menu : mêmes rubriques, même ordre, mêmes pictogrammes.
3. Tabuler dans le menu ouvert : le focus n'en sort pas. Appuyer sur Échap : il se ferme et
   le focus **revient au bouton d'ouverture**.
4. Menu ouvert, élargir la fenêtre au-delà de 1000 px : la colonne reprend sa place et le
   panneau ne subsiste pas par-dessus.
5. Passer par 999 px puis 1000 px : la bascule se fait au bon endroit.

### La vignette (US4)

1. Les trois états sont visibles côte à côte : repos, survol, sans image.
2. Survoler : l'image s'agrandit légèrement, le titre se souligne — **et rien d'autre**. Pas
   d'ombre, pas de déplacement, pas de changement de fond.
3. Atteindre une vignette au clavier : le retour visuel est équivalent au survol.
4. L'état sans image ne réserve aucune zone d'image : un filet supérieur épais la remplace.
5. Un titre très long s'arrête à trois lignes, sans changer la hauteur de la vignette.
6. Activer « mouvement réduit » au niveau du système, survoler : plus aucune animation.

### Le filet et le pied de page (US5, US6)

1. Les filets de séparation se brisent **une seule fois**, et la brisure ne tombe pas au même
   endroit d'un filet à l'autre.
2. Recenser les diagonales de la page : il y en a exactement **deux** sortes de porteurs — le
   mot-symbole et les filets de séparation. Toute autre diagonale est un défaut.
3. Le pied de page commence **à droite du filet vertical**, jamais sous la colonne.
4. À 375 px, ses groupes s'empilent sans débordement.

---

## Terminé quand

- [X] `npm run test:e2e` au vert — **225 tests**, cinq largeurs, deux thèmes
- [X] Les **trois** contrôles de `npm run verifier` renvoient `OK` (dégradés, valeurs de
      couleur en dur, retour à Tailwind v3)
- [X] `npx nuxt typecheck` : code 0, zéro erreur
- [X] `contrastes.py` : tous les couples de texte au vert, les deux couples interdits toujours
      au rouge (`line sur paper` 1,25 · `accent sur ink` 2,84)
- [X] La grille manuelle ci-dessus est passée **dans les deux thèmes**
- [X] La suite est rejouée **contre le serveur compilé**, pas seulement en développement :
      `npm run build && FRANCOMETRE_BUILD=1 npm run test:e2e` — 225 au vert
- [X] `docs/design/html/tokens.md` amendé des **quatre** valeurs décidées ici (point de
      rupture, repère de focus, absence de transition, texte d'interface 14 px) — §7
- [X] `.specify/memory/constitution.md` amendé en v1.1.0 : arbitrages 3 et 4 refermés
- [X] Relecture orthographique du français, diacritiques compris (porte 11)

## Écueils connus

| Symptôme | Cause probable |
|---|---|
| La bascule de thème n'a aucun effet sur les couleurs | `@theme` employé sans `inline` : les utilitaires figent la valeur du thème clair ([research.md](./research.md) D2) |
| La variante `dark:` suit le système et ignore le choix | `@custom-variant dark` absent — la variante est restée sur `prefers-color-scheme` |
| Flash au rechargement | Résolution du thème faite au montage d'un composant plutôt que par le script inline du `<head>` |
| `rounded-lg` sans effet | Comportement voulu : la famille est supprimée du projet |
| Repère de focus quasi invisible | Tracé en `--line` (1,25:1) au lieu de `--ink` |
