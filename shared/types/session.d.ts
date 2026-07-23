// Forme du `user` de session — augmente le module `#auth-utils`.
//
// La « Session » de la spec n'est PAS une table : c'est un cookie scellé porté
// par nuxt-auth-utils (data-model §2). Ce fichier type son contenu applicatif
// pour que `setUserSession` / `useUserSession` / `requireUserSession` exposent
// un `user` précis, et non le `{}` par défaut du module.
//
// AUCUN secret n'entre dans le cookie : ni empreinte, ni mot de passe. Seuls
// les quatre champs ci-dessous, tous non sensibles. `identifiant` sert de clé de
// revérification d'existence du compte à chaque accès protégé (FR-016).

declare module '#auth-utils' {
  interface User {
    id: string
    identifiant: string
    nomAffichable: string
    role: string
  }

  // Aucune donnée de session hors `user`.
  interface UserSession {}
}

export {}
