# Specification Quality Checklist: Référencement, performance, accessibilité

**Purpose**: Valider la complétude et la qualité de la spécification avant de passer à la planification
**Created**: 2026-07-24
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] Aucun détail d'implémentation (langages, frameworks, API)
- [x] Centrée sur la valeur pour l'utilisateur et le besoin métier
- [x] Rédigée pour des parties prenantes non techniques
- [x] Toutes les sections obligatoires sont remplies

## Requirement Completeness

- [x] Aucun marqueur [NEEDS CLARIFICATION] ne subsiste
- [x] Les exigences sont testables et non ambiguës
- [x] Les critères de succès sont mesurables
- [x] Les critères de succès sont indépendants de la technologie
- [x] Tous les scénarios d'acceptation sont définis
- [x] Les cas limites sont identifiés
- [x] La portée est clairement bornée
- [x] Les dépendances et hypothèses sont identifiées

## Feature Readiness

- [x] Chaque exigence fonctionnelle a des critères d'acceptation clairs
- [x] Les scénarios utilisateur couvrent les parcours principaux
- [x] La feature satisfait les résultats mesurables des critères de succès
- [x] Aucun détail d'implémentation ne s'infiltre dans la spécification

## Notes

- Les éléments marqués incomplets exigent une mise à jour de la spec avant `/speckit-clarify`
  ou `/speckit-plan`.
- Les deux points d'arbitrage sont **tranchés** au `/speckit-clarify` (session 2026-07-24) :
  (1) forme canonique = apex `francometre.com`, `www` → apex en 301 ; (2) image de partage
  par défaut, d'abord « fournie par le porteur », **affinée par la stack du porteur** en
  « prise dans `public/brand` » — composée au format 1200 × 630 depuis le mot-symbole
  existant. La session a en outre fixé le profil d'audit (mobile ET bureau) et l'indexabilité
  des pages paginées.
- **Plus de dépendance externe bloquante** : l'image de partage par défaut dérive du
  mot-symbole déjà présent dans `public/brand` ; SC-002 est vérifiable sans livraison
  externe.
