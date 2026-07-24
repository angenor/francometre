# Déploiement — Francomètre

Hébergement **Docker**, temporairement sur le **même VPS qu'africans**
(`161.97.92.63`), **derrière le nginx d'africans**. Francomètre tourne en
conteneur applicatif seul (aucun port publié) ; le nginx d'africans reçoit un
vhost `francometre.com` et proxifie vers lui via un réseau Docker partagé.

> **Provisoire.** Un VPS dédié est prévu. La conception est faite pour que la
> bascule soit triviale : voir « Migration vers un VPS dédié » en bas.

---

## Fichiers

| Fichier | Rôle |
|---|---|
| `deploy/Dockerfile` | Image de prod, 2 étapes. Compile `better-sqlite3`/`sharp`, produit `.output`, embarque la boîte à outils Prisma (migrations + seed). |
| `deploy/docker-entrypoint.sh` | Au boot : `prisma migrate deploy` (toujours) ; seed si `FRANCOMETRE_SEED=1` ; puis démarre Nitro. |
| `docker-compose.prod.yml` | Le service `francometre` (port 3000 interne), 2 volumes, réseau partagé `francometre_net`. |
| `deploy/deploy.sh` | Pilotage à distance (setup, deploy, ssl, seed, backup…). |
| `deploy/nginx/francometre.conf` | **Vhost à greffer sur le nginx d'africans** (voir plus bas). |
| `deploy/backup-db.mjs` | Sauvegarde SQLite cohérente (API `.backup`). |
| `.env.production.example` | Variables d'exécution attendues (le vrai `.env` est généré sur le serveur). |

Persistance (volumes Docker, survivent aux redéploiements) :
- `francometre_db` → `/data/db/francometre.db` (base SQLite)
- `francometre_medias` → `/app/stockage/medias` (couvertures téléversées + exemples)

---

## Prérequis : DNS

`francometre.com` pointe aujourd'hui vers **91.216.107.201** (ailleurs). Avant
tout, repointer chez le registraire, vers le VPS d'africans :

```
A   francometre.com       →  161.97.92.63
A   www.francometre.com   →  161.97.92.63
```

Let's Encrypt (étape `ssl`) échouera tant que le DNS n'a pas propagé.

---

## Premier déploiement, dans l'ordre

Depuis ce dossier (`deploy/`), sur ton poste (accès SSH par clé à `root@161.97.92.63`) :

```bash
./deploy.sh setup      # clone, réseau partagé, attache du nginx d'africans, .env + secrets
                       # → NOTE le mot de passe de rédaction affiché

./deploy.sh deploy     # build de l'image + démarrage (migrations jouées au boot)

./deploy.sh ssl        # certificat Let's Encrypt (apex + www)
                       # ⚠ arrête le nginx d'africans quelques secondes
```

Puis **greffer le vhost sur le nginx d'africans** (une seule fois) :

1. Copier les blocs `server {}` de `deploy/nginx/francometre.conf` **dans le
   `http {}`** du `nginx.conf` d'africans, **dans le dépôt africans** (son
   `deploy.sh` réécrit ce fichier à chaque déploiement — un ajout fait seulement
   sur le serveur serait perdu).
2. Vérifier que le dossier ssl monté par le nginx d'africans est bien
   `/etc/nginx/ssl` (sinon, ajuster les deux chemins `ssl_certificate*` du vhost).
   `deploy.sh ssl` y a déposé `francometre-fullchain.pem` / `francometre-privkey.pem`.
3. Recharger : `docker exec uafricas_nginx nginx -s reload`
   (ou redéployer africans, qui rechargera avec le vhost).

Enfin, **amorcer la base** (une fois) :

```bash
./deploy.sh seed       # 8 rubriques (indispensables) + compte de rédaction + exemples
```

`https://francometre.com` doit alors répondre. Connexion au back-office :
`redaction@francometre.com` + le mot de passe affiché au `setup`.

---

## Deux retouches à faire côté dépôt africans (persistance)

`deploy.sh` attache le nginx d'africans au réseau partagé à chaque exécution,
mais pour que ce soit **durable** (indépendant de l'ordre des déploiements),
ajouter dans le dépôt africans :

- **`docker-compose.prod.yml`** — déclarer le réseau externe et l'attacher au nginx :
  ```yaml
  services:
    nginx:                     # le service nginx d'africans
      networks: [default, francometre_net]
  networks:
    francometre_net:
      external: true
  ```
- **`nginx/nginx.conf`** — coller les blocs de `deploy/nginx/francometre.conf`.

Sans ces retouches, ça marche quand même (le script recolle le réseau à chaque
`deploy`), mais un redéploiement d'africans seul pourrait détacher le vhost
jusqu'au prochain `./deploy.sh deploy` de francomètre.

---

## Exploitation courante

```bash
./deploy.sh update      # git pull + rebuild + redémarrage
./deploy.sh logs        # journaux en continu
./deploy.sh status      # conteneur, ressources, réseau, santé
./deploy.sh restart
./deploy.sh backup      # instantané SQLite rapatrié dans deploy/backups/
./deploy.sh connect     # SSH direct dans /opt/francometre
./deploy.sh rebuild     # rebuild --no-cache
```

Le **seed n'est pas rejoué** au boot (il retraiterait les images d'exemple) :
c'est `./deploy.sh seed`, à la demande. Les migrations, elles, sont jouées à
chaque démarrage (`migrate deploy`, idempotent).

---

## Migration vers un VPS dédié (plus tard)

Le couplage à africans se limite à trois choses, toutes côté hébergeur :
le vhost nginx, le réseau partagé, l'emplacement du certificat. Sur un VPS dédié,
francomètre reprend ses propres ports 80/443. Marche à suivre :

1. Dans `deploy.sh`, changer `REMOTE_HOST` (nouveau VPS) ; `REMOTE_DIR` peut rester.
2. Ajouter à francomètre son **propre nginx** (service dans le compose,
   ports `80:80`/`443:443`) — ou demander : un `docker-compose.standalone.yml`
   avec nginx + Certbot intégrés se génère en quelques minutes à partir du vhost
   existant.
3. `./deploy.sh setup && ./deploy.sh deploy && ./deploy.sh ssl` sur le nouveau VPS.
4. **Reprendre les données** : restaurer la base (une sauvegarde `./deploy.sh backup`)
   et copier le volume `francometre_medias` (tar) vers le nouveau serveur.
5. Repointer le DNS vers le nouveau VPS ; retirer le vhost francomètre du nginx
   d'africans.

Rien dans le **code métier** ne change : ni la base (clé de stockage, pas d'URL),
ni le stockage (interface unique `Stockage`). C'est exactement ce que visent les
règles de portabilité du projet.
