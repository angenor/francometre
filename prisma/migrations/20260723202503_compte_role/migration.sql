-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Compte" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifiant" TEXT NOT NULL,
    "motDePasseHache" TEXT NOT NULL,
    "nomAffichable" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'redaction',
    "creeLe" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Compte" ("creeLe", "id", "identifiant", "motDePasseHache", "nomAffichable") SELECT "creeLe", "id", "identifiant", "motDePasseHache", "nomAffichable" FROM "Compte";
DROP TABLE "Compte";
ALTER TABLE "new_Compte" RENAME TO "Compte";
CREATE UNIQUE INDEX "Compte_identifiant_key" ON "Compte"("identifiant");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
