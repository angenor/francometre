<script setup lang="ts">
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'

/**
 * L'enveloppe TipTap 3 — HEADLESS : la zone d'édition porte la classe `.corps`,
 * donc rend EXACTEMENT comme le site publié (research.md D2, FR-013).
 *
 * Les extensions sont bornées à la liste blanche de `assainir.ts`
 * (`p, h2, h3, ul, ol, li, blockquote, strong, em, a, figure/figcaption, img`) :
 * StarterKit fournit gras/italique/listes/citation/lien/historique, `heading`
 * limité à [2, 3] ; ce que le serveur n'accepte pas est DÉSACTIVÉ (barré, code,
 * souligné, filet), pour que l'éditeur ne puisse produire que ce que le serveur
 * garde — sans quoi une mise en forme survivrait à l'écran mais pas au stockage.
 *
 * L'image est ajoutée à part (hors StarterKit) ; elle n'accepte pas le base64
 * (les images passent par le téléversement → `/medias/<clé>`, D4).
 *
 * Ce composant possède l'instance et en dérive l'ÉTAT ACTIF des marques/nœuds
 * (`etats`) pour la barre d'outils — un `computed` ne se recalculerait pas aux
 * transactions de l'éditeur, d'où la mise à jour explicite aux évènements.
 */
const modele = defineModel<string>({ required: true })

const etats = ref({
  gras: false,
  italique: false,
  h2: false,
  h3: false,
  puces: false,
  numeros: false,
  citation: false,
  lien: false,
  peutAnnuler: false,
  peutRetablir: false,
})

// `useEditor` (@tiptap/vue-3 3.28) crée l'instance dans `onMounted` : l'éditeur
// n'existe donc QUE côté client, sans rendu serveur ni écart d'hydratation. Rien
// à configurer pour le SSR.
const editeur = useEditor({
  content: modele.value,
  extensions: [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      // Hors liste blanche de `assainir.ts` : désactivés pour ne rien produire
      // que le serveur retirerait à l'enregistrement.
      strike: false,
      code: false,
      codeBlock: false,
      horizontalRule: false,
      underline: false,
      // Le lien ne s'ouvre pas au clic dans l'éditeur (on édite, on ne suit pas).
      link: { openOnClick: false },
    }),
    Image.configure({ inline: false, allowBase64: false }),
  ],
  editorProps: {
    attributes: {
      class: 'corps tiptap-corps',
      'aria-label': 'Corps de l\'article',
      role: 'textbox',
      'aria-multiline': 'true',
    },
  },
  onUpdate: ({ editor }) => {
    modele.value = editor.getHTML()
    rafraichirEtats()
  },
  onSelectionUpdate: rafraichirEtats,
  onTransaction: rafraichirEtats,
})

function rafraichirEtats() {
  const e = editeur.value
  if (!e) return
  etats.value = {
    gras: e.isActive('bold'),
    italique: e.isActive('italic'),
    h2: e.isActive('heading', { level: 2 }),
    h3: e.isActive('heading', { level: 3 }),
    puces: e.isActive('bulletList'),
    numeros: e.isActive('orderedList'),
    citation: e.isActive('blockquote'),
    lien: e.isActive('link'),
    peutAnnuler: e.can().undo(),
    peutRetablir: e.can().redo(),
  }
}

// Synchronisation descendante : si le modèle change d'ailleurs (chargement d'un
// article, autosave qui recale), on recharge le contenu SANS réémettre `update`
// (le second argument `false`), pour ne pas boucler.
watch(modele, (valeur) => {
  const e = editeur.value
  if (e && valeur !== e.getHTML()) {
    e.commands.setContent(valeur, { emitUpdate: false })
  }
})
</script>

<template>
  <div>
    <BarreOutils :editeur="editeur" :etats="etats" />
    <EditorContent :editor="editeur" class="mt-10" />
  </div>
</template>

<style scoped>
/* La zone d'édition reste cliquable même vide. Aucune couleur : le style de
   contenu vit dans `.corps` (feuille partagée). */
:deep(.tiptap-corps) {
  min-height: 320px;
}
</style>
