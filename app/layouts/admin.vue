<script setup lang="ts">
/**
 * La mise en page d'administration — distincte du public (`default.vue`, rail
 * 248 px + topbar + footer), taillée dans les mêmes tokens.
 *
 * Deux zones côte à côte et de même hauteur : le rail de 240 px à gauche, le
 * contenu à droite. Au-delà du point de rupture du socle (1000 px) le rail est
 * permanent ; en dessous il n'est pas rendu et cède la place à la barre repliée
 * (décision Fondations, D14) que le contenu porte en tête.
 *
 * L'entrée de rail active se déduit du chemin réellement affiché : `aria-current`
 * désigne la page rendue, jamais une valeur par défaut (principe VIII).
 */
const route = useRoute()

const courant = computed<'articles' | 'une' | 'medias'>(() => {
  if (route.path.startsWith('/admin/une')) return 'une'
  if (route.path.startsWith('/admin/medias')) return 'medias'
  // `/admin/articles`, `/admin/articles/nouveau`, `/admin/articles/[id]`.
  return 'articles'
})
</script>

<template>
  <div
    class="mx-auto flex min-h-screen w-full max-w-conteneur items-stretch border border-line bg-paper"
  >
    <!-- Rail latéral — permanent à partir de 1000 px, absent en dessous. -->
    <div class="hidden shrink-0 border-r border-line socle:block">
      <AdminRail :courant="courant" />
    </div>

    <div class="flex min-w-0 flex-1 flex-col">
      <AdminBarreMobile :courant="courant" />

      <main class="min-w-0 flex-1">
        <slot />
      </main>
    </div>
  </div>
</template>
