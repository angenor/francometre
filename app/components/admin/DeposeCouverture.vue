<script setup lang="ts">
/**
 * La dépose de couverture (structure du panneau de `back-office-editeur.html`).
 *
 * Glisser OU cliquer pour téléverser (→ `/medias/<clé>`), aperçu au format 16/9,
 * champ de TEXTE ALTERNATIF (obligatoire à la publication, contrôlé côté serveur),
 * et actions « Remplacer » / « Retirer ». La zone de dépose est un vrai bouton,
 * donc atteignable au clavier (principe VIII).
 */
const couverture = defineModel<{ id: string, url: string } | null>('couverture', {
  default: null,
})
const alt = defineModel<string>('alt', { default: '' })

const { televerser } = useTeleversementImage()
const champFichier = ref<HTMLInputElement | null>(null)
const messageErreur = ref('')
const survol = ref(false)

function ouvrir() {
  champFichier.value?.click()
}

async function traiter(fichier: File | undefined | null) {
  if (!fichier) return
  messageErreur.value = ''
  try {
    const media = await televerser(fichier)
    couverture.value = { id: media.id, url: media.url }
  }
  catch (erreur) {
    messageErreur.value = messageTeleversement(erreur)
  }
}

async function surFichier(evenement: Event) {
  const champ = evenement.target as HTMLInputElement
  await traiter(champ.files?.[0])
  champ.value = ''
}

async function surDepose(evenement: DragEvent) {
  survol.value = false
  await traiter(evenement.dataTransfer?.files?.[0])
}

function retirer() {
  couverture.value = null
  alt.value = ''
  messageErreur.value = ''
}
</script>

<template>
  <div>
    <span class="mb-3 block font-titre text-label-admin font-demi-grasse tracking-eyebrow uppercase text-muted">
      Image de couverture
    </span>

    <!-- Aperçu + actions -->
    <template v-if="couverture">
      <div class="relative aspect-video overflow-hidden bg-surface">
        <img :src="couverture.url" alt="" class="absolute inset-0 h-full w-full object-cover">
        <div class="absolute top-2 right-2 flex gap-1.5">
          <button
            type="button"
            class="cursor-pointer border border-line bg-paper px-2.5 py-1 text-meta text-ink hover:bg-surface"
            @click="ouvrir"
          >
            Remplacer
          </button>
          <button
            type="button"
            class="cursor-pointer border border-line bg-paper px-2.5 py-1 text-meta text-ink hover:bg-surface"
            @click="retirer"
          >
            Retirer
          </button>
        </div>
      </div>

      <div class="mt-4">
        <AppField v-model="alt" libelle="Texte alternatif" placeholder="Décrivez brièvement l'image" />
        <p class="mt-2 text-meta text-muted">
          Requis à la publication — décrivez l'image pour l'accessibilité.
        </p>
      </div>
    </template>

    <!-- Zone de dépose -->
    <button
      v-else
      type="button"
      class="flex min-h-[132px] w-full cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 text-center"
      :class="survol ? 'border-ink bg-surface' : 'border-glisser-bordure'"
      @click="ouvrir"
      @dragover.prevent="survol = true"
      @dragleave.prevent="survol = false"
      @drop.prevent="surDepose"
    >
      <span class="text-saisie-admin text-ink">Déposez une image, ou cliquez</span>
      <span class="text-meta text-muted">JPEG, PNG ou WebP · 10 Mo maximum</span>
    </button>

    <p v-if="messageErreur" role="alert" class="mt-2 text-meta text-erreur">
      {{ messageErreur }}
    </p>

    <input
      ref="champFichier"
      type="file"
      accept="image/*"
      class="hidden"
      data-testid="champ-couverture"
      @change="surFichier"
    >
  </div>
</template>
