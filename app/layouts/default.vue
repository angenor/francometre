<script setup lang="ts">
/**
 * La mise en page du socle — assemblée une fois, réutilisée par toute page.
 *
 * Une page de contenu obtient le cadre, la colonne de navigation, la barre de
 * petit écran et le pied de page sans rien redéclarer (FR-010). Elle déclare
 * seulement la rubrique qu'elle occupe, par `definePageMeta({ rubrique })`.
 */
const route = useRoute()

/**
 * Rubrique de la page réellement affichée, ou `null`.
 *
 * `aria-current` ne se pose jamais par défaut : une page sans rubrique ne
 * signale rien (constitution VIII, défaut relevé n° 5). Une valeur inconnue ne
 * provoque pas d'erreur mais ne signale rien non plus.
 */
const rubriqueCourante = computed<RubriqueId | null>(() => {
  const declaree = route.meta.rubrique
  return RUBRIQUES.some((r) => r.id === declaree) ? (declaree as RubriqueId) : null
})
</script>

<template>
  <AppShell>
    <template #navigation>
      <AppRail :rubrique-courante="rubriqueCourante" />
    </template>

    <!-- Barre supérieure — rendue sous le point de rupture uniquement. -->
    <AppTopbar :rubrique-courante="rubriqueCourante" />

    <main class="mx-auto w-full max-w-contenu flex-1">
      <slot />
    </main>

    <!--
      Le pied de page ferme la colonne de DROITE. Il est à l'intérieur de la
      zone de contenu, jamais sous la colonne de navigation (FR-039).
    -->
    <AppFooter />
  </AppShell>
</template>
