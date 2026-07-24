// Fournisseur d'images `medias` pour @nuxt/image (US4, D10).
//
// Il n'appelle AUCUN service tiers et ne fabrique aucune requête que le serveur
// s'adresserait à lui-même : il compose seulement l'adresse d'une VARIANTE que
// la route `/medias/[...cle]` sait produire en ligne (`?w=&f=&q=`). Les médias
// passent donc par l'interface `Stockage` (porte 9) et restent portables ;
// aucune couche d'images externe, conforme au preset node-server.
//
// Tout ce qui n'est PAS un média (`/medias/**`) passe INCHANGÉ : les SVG de la
// planche de style et les actifs de `public/` n'ont ni à être redimensionnés ni
// à être réencodés (un SVG est déjà indépendant de la résolution).

interface Modificateurs {
  width?: number | string
  format?: string
  quality?: number | string
}

export default () => ({
  getImage(src: string, { modifiers = {} }: { modifiers?: Modificateurs } = {}) {
    if (!src.startsWith('/medias/')) {
      return { url: src }
    }
    const parametres: string[] = []
    if (modifiers.width) parametres.push(`w=${modifiers.width}`)
    if (modifiers.format) parametres.push(`f=${modifiers.format}`)
    if (modifiers.quality) parametres.push(`q=${modifiers.quality}`)
    return { url: parametres.length ? `${src}?${parametres.join('&')}` : src }
  },
})
