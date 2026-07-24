<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'

/**
 * La barre d'outils de l'éditeur (structure de `back-office-editeur.html`).
 *
 * COLLANTE (`sticky`) : elle suit la lecture. Chaque bouton est focusable,
 * porte un `aria-label`, et le bouton ACTIF prend l'accent — le SEUL endroit où
 * l'accent touche l'UI de l'éditeur (tracé maquette, porte 4). Les commandes
 * agissent sur l'instance TipTap reçue en prop ; l'état actif vient de `etats`
 * (calculé par le parent, réactif aux transactions).
 *
 * « Image » téléverse puis insère `<img src="/medias/<clé>">` — une adresse
 * d'application (D4), qui SURVIT à `assainir` (URL relative, sans schéma filtré,
 * porte 9). « Lien » demande une URL.
 */
const props = defineProps<{
  editeur: Editor | undefined
  etats: {
    gras: boolean
    italique: boolean
    h2: boolean
    h3: boolean
    puces: boolean
    numeros: boolean
    citation: boolean
    lien: boolean
    peutAnnuler: boolean
    peutRetablir: boolean
  }
}>()

const { televerser } = useTeleversementImage()
const champFichier = ref<HTMLInputElement | null>(null)
const messageErreur = ref('')

function chaine() {
  return props.editeur?.chain().focus()
}

function lien() {
  const e = props.editeur
  if (!e) return
  const actuel = (e.getAttributes('link').href as string | undefined) ?? ''
  const url = window.prompt('Adresse du lien (https://…)', actuel)
  if (url === null) return
  if (url.trim() === '') {
    e.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }
  e.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
}

function ouvrirFichier() {
  champFichier.value?.click()
}

async function surFichier(evenement: Event) {
  const champ = evenement.target as HTMLInputElement
  const fichier = champ.files?.[0]
  if (!fichier) return
  messageErreur.value = ''
  try {
    const media = await televerser(fichier)
    // `alt=""` : image de corps décorative par défaut (le corps porte le sens) —
    // valide pour l'accessibilité, et l'adresse est racine-relative (D4).
    props.editeur?.chain().focus().setImage({ src: media.url, alt: '' }).run()
  }
  catch (erreur) {
    messageErreur.value = messageTeleversement(erreur)
  }
  finally {
    champ.value = ''
  }
}

const BTN
  = 'flex h-8 min-w-[34px] cursor-pointer items-center justify-center px-2.25 '
    + 'font-titre text-saisie-admin leading-nul text-ink hover:bg-surface'
const ACTIF = 'text-accent bg-surface'
const SEP = 'mx-1.25 h-5 w-px shrink-0 bg-line'
</script>

<template>
  <div>
    <div
      role="toolbar"
      aria-label="Mise en forme"
      class="sticky top-0 z-10 flex min-h-11 flex-wrap items-center gap-px border-y border-line bg-paper px-1.5"
    >
      <button type="button" title="Gras" aria-label="Gras" :class="[BTN, 'font-grasse', etats.gras && ACTIF]" @click="chaine()?.toggleBold().run()">B</button>
      <button type="button" title="Italique" aria-label="Italique" :class="[BTN, 'font-demi-grasse italic', etats.italique && ACTIF]" @click="chaine()?.toggleItalic().run()">I</button>

      <span :class="SEP" aria-hidden="true" />

      <button type="button" title="Titre de niveau 2" aria-label="Titre de niveau 2" :class="[BTN, 'font-demi-grasse text-interface', etats.h2 && ACTIF]" @click="chaine()?.toggleHeading({ level: 2 }).run()">H2</button>
      <button type="button" title="Titre de niveau 3" aria-label="Titre de niveau 3" :class="[BTN, 'font-demi-grasse text-interface', etats.h3 && ACTIF]" @click="chaine()?.toggleHeading({ level: 3 }).run()">H3</button>

      <span :class="SEP" aria-hidden="true" />

      <button type="button" title="Liste à puces" aria-label="Liste à puces" :class="[BTN, etats.puces && ACTIF]" @click="chaine()?.toggleBulletList().run()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="9" y1="6" x2="20" y2="6" /><line x1="9" y1="12" x2="20" y2="12" /><line x1="9" y1="18" x2="20" y2="18" /><circle cx="4.5" cy="6" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="12" r="1.3" fill="currentColor" stroke="none" /><circle cx="4.5" cy="18" r="1.3" fill="currentColor" stroke="none" /></svg>
      </button>
      <button type="button" title="Liste numérotée" aria-label="Liste numérotée" :class="[BTN, etats.numeros && ACTIF]" @click="chaine()?.toggleOrderedList().run()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="10" y1="6" x2="20" y2="6" /><line x1="10" y1="12" x2="20" y2="12" /><line x1="10" y1="18" x2="20" y2="18" /><text x="2.5" y="8.6" font-size="8" font-family="Archivo, sans-serif" font-weight="700" fill="currentColor" stroke="none">1</text><text x="2.5" y="20.2" font-size="8" font-family="Archivo, sans-serif" font-weight="700" fill="currentColor" stroke="none">2</text></svg>
      </button>
      <button type="button" title="Citation" aria-label="Citation" :class="[BTN, etats.citation && ACTIF]" @click="chaine()?.toggleBlockquote().run()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M6 7h4v4c0 2.2-1.5 3.7-3.7 4L6 17.5c1.2-.3 2-1.1 2-2.5H6V7Z" /><path d="M14 7h4v4c0 2.2-1.5 3.7-3.7 4L14 17.5c1.2-.3 2-1.1 2-2.5h-2V7Z" /></svg>
      </button>
      <button type="button" title="Lien" aria-label="Lien" :class="[BTN, etats.lien && ACTIF]" @click="lien">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1 1" /><path d="M14 10a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1-1" /></svg>
      </button>
      <button type="button" title="Insérer une image" aria-label="Insérer une image" :class="BTN" @click="ouvrirFichier">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" /><path d="M3.5 16l4.5-4 3 2.5 4-4 5 5" /><circle cx="9" cy="9.5" r="1.4" /></svg>
      </button>

      <span :class="SEP" aria-hidden="true" />

      <button type="button" title="Annuler" aria-label="Annuler" :disabled="!etats.peutAnnuler" :class="[BTN, !etats.peutAnnuler && 'cursor-not-allowed text-muted hover:bg-transparent']" @click="chaine()?.undo().run()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h9a5 5 0 0 1 0 10H8" /><path d="M4 8l4-4M4 8l4 4" /></svg>
      </button>
      <button type="button" title="Rétablir" aria-label="Rétablir" :disabled="!etats.peutRetablir" :class="[BTN, !etats.peutRetablir && 'cursor-not-allowed text-muted hover:bg-transparent']" @click="chaine()?.redo().run()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 8h-9a5 5 0 0 0 0 10h5" /><path d="M20 8l-4-4M20 8l-4 4" /></svg>
      </button>

      <!-- Sélecteur de fichier caché, piloté par le bouton « image ». -->
      <input
        ref="champFichier"
        type="file"
        accept="image/*"
        class="hidden"
        data-testid="champ-image-corps"
        @change="surFichier"
      >
    </div>

    <p v-if="messageErreur" role="alert" class="mt-2 text-meta text-erreur">
      {{ messageErreur }}
    </p>
  </div>
</template>
