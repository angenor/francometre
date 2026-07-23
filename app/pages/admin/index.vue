<script setup lang="ts">
/**
 * Atterrissage de l'administration — écran NON maquetté, volontairement sobre.
 *
 * C'est la destination après connexion et l'emplacement de la déconnexion : le
 * seam du back-office à venir, pas un outil d'édition. Strictement textuel,
 * SANS accent de sa propre initiative (principe III) ; la colonne latérale du
 * back-office (240px) relève d'une feature ultérieure.
 *
 * La sécurité tient au garde serveur `exigerCompte` sur les routes de données ;
 * cette page, elle, est gardée à l'affichage par `admin.global.ts`.
 */
definePageMeta({ layout: false })
useHead({ title: 'Administration — Francomètre' })

const { user, fetch: rafraichirSession } = useUserSession()

async function seDeconnecter() {
  await $fetch('/api/auth/deconnexion', { method: 'POST' })
  await rafraichirSession()
  await navigateTo('/connexion')
}
</script>

<template>
  <div class="mx-auto min-h-dvh w-full max-w-2xl px-6 py-16">
    <h1 class="font-titre text-titre-admin leading-[1.05] font-grasse tracking-titre text-ink">
      Espace d'administration
    </h1>

    <p v-if="user" class="mt-4 font-corps text-corps-courant text-muted">
      Connecté en tant que {{ user.nomAffichable }}.
    </p>

    <div class="mt-10">
      <AppButton variante="secondaire" type="button" @click="seDeconnecter">
        Se déconnecter
      </AppButton>
    </div>
  </div>
</template>
