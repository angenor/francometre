<script setup lang="ts">
/**
 * Connexion — structure de `docs/design/html/connexion.html`, layout NU (sans
 * navigation, FR-002).
 *
 * Un principe gouverne l'échec : il ne se raconte pas. Quelle qu'en soit la
 * cause — identifiant inconnu, mot de passe faux, champ vide, débit dépassé,
 * réseau — le MÊME message unique, dans un conteneur `role="alert"`, et AUCUN
 * champ désigné (FR-021). Les deux champs passent en état d'erreur (filet rouge,
 * signal non porté par la seule couleur), l'identifiant est CONSERVÉ, le mot de
 * passe VIDÉ.
 *
 * Le repère de focus (main.css) s'applique sur les champs, le bouton et le
 * mot-symbole : la maquette pose `outline:none`, la constitution le rétablit
 * (principe VIII).
 */
definePageMeta({ layout: 'nu' })
// Page non publique : titre propre, mais `noindex` — rien à indexer d'un accès
// réservé (FR-006). `follow` laisse néanmoins suivre le lien vers l'accueil.
useSeoMeta({
  title: 'Connexion — Francomètre',
  description: 'Accès réservé à la rédaction de Francomètre.',
  robots: ROBOTS_NOINDEX,
})

const route = useRoute()
const { loggedIn, fetch: rafraichirSession } = useUserSession()

// Déjà connecté : droit à l'administration, sans revoir le formulaire (FR-008).
if (loggedIn.value) {
  await navigateTo('/admin')
}

/** Le message d'échec — identique à celui du serveur, jamais distinctif. */
const MESSAGE_ECHEC = 'E-mail ou mot de passe incorrect.'

const identifiant = ref('')
const motDePasse = ref('')
const aEchoue = ref(false)
const enCours = ref(false)

async function soumettre() {
  if (enCours.value) return
  enCours.value = true
  aEchoue.value = false

  try {
    const reponse = await $fetch('/api/auth/connexion', {
      method: 'POST',
      body: {
        identifiant: identifiant.value,
        motDePasse: motDePasse.value,
        // Le middleware pose `?retour=…` ; le serveur le REVALIDE (chemin interne
        // seul) et renvoie la destination sûre. Le client ne redirige que vers elle.
        retour: route.query.retour,
      },
    })
    await rafraichirSession()
    await navigateTo(reponse.redirection ?? '/admin')
  }
  catch {
    aEchoue.value = true
    motDePasse.value = ''
  }
  finally {
    enCours.value = false
  }
}
</script>

<template>
  <form class="w-full max-w-[400px]" novalidate @submit.prevent="soumettre">
    <!-- Mot-symbole : deux exemplaires permutés par la seule CSS (aucun flash),
         enveloppés d'un lien vers l'accueil, `alt` réel (principe VIII). -->
    <NuxtLink to="/" class="mb-11 block w-fit">
      <img src="/brand/NOIR.png" alt="Francomètre — accueil" class="block h-5 w-auto dark:hidden">
      <img src="/brand/BLANC.png" alt="Francomètre — accueil" class="hidden h-5 w-auto dark:block">
    </NuxtLink>

    <h1 class="mb-9 font-titre text-titre-admin leading-[1.05] font-grasse tracking-titre text-ink">
      Connexion
    </h1>

    <div class="mb-7">
      <AppField
        v-model="identifiant"
        libelle="E-mail"
        type-html="email"
        autocomplete="email"
        placeholder="prenom@exemple.fr"
        :en-erreur="aEchoue"
      />
    </div>

    <div class="mb-8">
      <AppField
        v-model="motDePasse"
        libelle="Mot de passe"
        type-html="password"
        autocomplete="current-password"
        placeholder="••••••••"
        :en-erreur="aEchoue"
      />
    </div>

    <AppButton variante="primaire" type="submit" class="w-full">
      Se connecter
    </AppButton>

    <!-- Message unique, ANNONCÉ (`role="alert"`), en rouge d'erreur. Il ne
         désigne aucun champ : c'est là toute l'indistinction. -->
    <p v-if="aEchoue" role="alert" class="mt-4 text-meta text-erreur">
      {{ MESSAGE_ECHEC }}
    </p>
  </form>
</template>
