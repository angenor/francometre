# Contrat — interface de stockage

**Feature** : [../spec.md](../spec.md) · **Recherche** : [../research.md](../research.md) D12 · **Date** : 2026-07-19

La porte 9 de la constitution tient en deux affirmations : la base ne stocke **jamais** d'URL
de média, et **aucun** accès au disque ou au stockage objet n'a lieu hors d'une interface
unique. Ce document fixe cette interface.

Elle est posée maintenant, alors que rien ne téléverse encore. La raison est celle du principe
VI : l'objectif « migrer disque → S3 sans toucher au code métier » se tient **à tout moment**,
et une interface ajoutée après coup ne rattraperait jamais les appels directs déjà écrits.

---

## 1. La chaîne, de la base à l'écran

```text
  base de données
        │  ne contient QUE ceci :
        ▼
    cle : "articles/2026/07/lynx-boreal.jpg"
        │
        │  Stockage.url(cle)          ← la SEULE fonction qui sait ce qu'est une URL
        ▼
  "/medias/articles/2026/07/lynx-boreal.jpg"     (disque)
  "https://cdn.exemple.com/articles/…"           (S3, plus tard — même clé, même code appelant)
```

Le point qui compte : passer de la première à la seconde ligne ne change **rien** en base, et
rien dans le code métier. C'est exactement ce que la porte 9 protège.

---

## 2. L'interface

| Opération | Entrée | Sortie | Rôle |
|---|---|---|---|
| `put(cle, contenu, typeMime)` | clé, données binaires, type | — | Écrit ou remplace |
| `get(cle)` | clé | données binaires, ou `null` | Lit |
| `delete(cle)` | clé | — | Efface |
| `url(cle)` | clé | texte | Calcule l'adresse d'affichage |

**Garanties**

- `url()` est la **seule** fonction du projet autorisée à produire une URL de média. Toute autre
  construction d'adresse — concaténation, gabarit, préfixe en dur — est un défaut au sens de la
  porte 9.
- `url()` est **pure et synchrone** : elle calcule, elle n'interroge rien. C'est ce qui permet
  de l'appeler au rendu sans coût.
- Aucune opération ne retourne de chemin du système de fichiers. Un chemin absolu qui
  s'échapperait de l'interface serait aussi contraignant qu'une URL.
- Les clés sont **opaques** pour l'appelant : il les reçoit et les rend, il ne les compose pas
  et ne les interprète pas.

---

## 3. Sélection de l'implémentation

Une variable d'environnement, une implémentation. Cette feature en livre **une seule** :

| Valeur | Implémentation | État |
|---|---|---|
| `disque` (défaut) | Écrit sous un répertoire local, sert les fichiers en statique | Livrée ici |
| `s3` | Stockage objet | **Non livrée** — l'interface l'anticipe, rien ne l'implémente |

Déclarer la valeur `s3` sans l'implémenter serait une promesse creuse. Le tableau la mentionne
parce que c'est l'usage prévu de l'interface, et le statut est explicite pour que personne ne
la croie disponible.

---

## 4. Ce que cette feature n'implémente pas

- **Aucun téléversement.** Ni réception de fichier, ni redimensionnement, ni génération de
  variantes. `sharp` n'est pas installé par cette feature.
- **Aucune suppression de fichier réel.** `supprimerMedia` retire la ligne en base ; l'effacement
  du fichier viendra avec le téléversement, quand il y aura des fichiers à effacer.
- **Aucune implémentation S3.**

Ce qui est livré : l'interface, l'implémentation disque, et la garantie que rien dans le code
ne contourne l'une ni l'autre.

---

## 5. Comment la porte 9 se contrôle

Deux vérifications automatisées, parce qu'une porte contrôlée par la vigilance n'est pas
contrôlée :

1. **Aucune URL en base** (SC-006) : un contrôle parcourt les colonnes de médias et rejette
   toute valeur ressemblant à une adresse (`http://`, `https://`, `//`, `data:`). Il tourne sur
   les données de démarrage et dans la suite de tests.
2. **Aucun accès disque hors interface** : un contrôle statique rejette tout import de
   `node:fs` en dehors de l'implémentation de `Stockage`. Il rejoint `scripts/verifier.mjs`,
   qui mécanise déjà trois portes de la constitution.

Le second contrôle est le plus utile des deux : le premier constate un symptôme, celui-ci
empêche la cause.
