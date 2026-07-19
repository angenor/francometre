-- CreateTable
CREATE TABLE "Rubrique" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "libelle" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "titre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "chapo" TEXT NOT NULL,
    "corps" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "publieLe" DATETIME,
    "sousTheme" TEXT,
    "auteur" TEXT,
    "rubriqueId" TEXT NOT NULL,
    "couvertureId" TEXT,
    "couvertureAlt" TEXT,
    "rangUne" INTEGER,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modifieLe" DATETIME NOT NULL,
    CONSTRAINT "Article_rubriqueId_fkey" FOREIGN KEY ("rubriqueId") REFERENCES "Rubrique" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Article_couvertureId_fkey" FOREIGN KEY ("couvertureId") REFERENCES "Media" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cle" TEXT NOT NULL,
    "largeur" INTEGER NOT NULL,
    "hauteur" INTEGER NOT NULL,
    "poids" INTEGER NOT NULL,
    "altParDefaut" TEXT,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Compte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifiant" TEXT NOT NULL,
    "motDePasseHache" TEXT NOT NULL,
    "nomAffichable" TEXT NOT NULL,
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Article_rangUne_key" ON "Article"("rangUne");

-- CreateIndex
CREATE INDEX "Article_rubriqueId_idx" ON "Article"("rubriqueId");

-- CreateIndex
CREATE INDEX "Article_statut_publieLe_idx" ON "Article"("statut", "publieLe");

-- CreateIndex
CREATE UNIQUE INDEX "Media_cle_key" ON "Media"("cle");

-- CreateIndex
CREATE UNIQUE INDEX "Compte_identifiant_key" ON "Compte"("identifiant");
