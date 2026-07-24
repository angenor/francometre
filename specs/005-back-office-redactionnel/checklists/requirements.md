# Specification Quality Checklist: Back-office rédactionnel

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-07-23
**Feature**: [spec.md](../spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Notes

- Items marked incomplete require spec updates before `/speckit-clarify` or `/speckit-plan`
- Deux points ont été résolus par défaut plutôt que marqués `[NEEDS CLARIFICATION]`, et
  consignés en « Assumptions » pour arbitrage à `/speckit.clarify` : (1) enregistrement
  explicite vs automatique du brouillon ; (2) portabilité des images intégrées au corps.
  Tous deux disposent d'un défaut raisonnable dérivé de la commande et de la constitution.
- L'arbitrage 2 de la constitution (« la Card dans le back-office ») est refermé dans le
  Contexte : les trois dérivés en pixels fixes des maquettes ne passent pas par la Card
  publique. À confirmer à l'amendement de la constitution lors du `plan`.
