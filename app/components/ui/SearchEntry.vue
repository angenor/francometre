<script setup lang="ts">
/**
 * Point d'entrée de recherche.
 *
 * Un lien RÉEL vers la page de résultats — pas un `div` cliquable, pas un
 * leurre : il est atteignable au clavier et correctement annoncé (FR-008).
 *
 * Ce qu'il n'est PAS, délibérément : ni champ de saisie, ni panneau, ni
 * résultats. Ces trois-là relèvent de la feature de recherche (FR-008a), et
 * les esquisser ici reviendrait à livrer une promesse creuse.
 *
 * Aucun paramètre : le point d'entrée est le même partout où il paraît.
 */
</script>

<template>
  <NuxtLink
    to="/recherche"
    data-testid="recherche"
    class="flex items-center gap-2.5 border-b border-line pb-3 text-ink"
  >
    <!-- Loupe des maquettes, conservée telle quelle (constitution I). -->
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      class="shrink-0"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
    <span class="text-interface text-muted">Rechercher</span>
  </NuxtLink>
</template>
