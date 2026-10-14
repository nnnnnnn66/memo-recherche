# Guide de Déploiement — Serveur Contabo (Plateforme Mémoire de Recherche)

Ce guide détaille les étapes exactes pour installer la plateforme sur votre serveur Contabo (Ubuntu 22.04 / 24.04 LTS) sans impacter les services existants.

---

## 1. Inspection préalable du serveur
Connectez-vous en SSH à votre serveur Contabo et vérifiez les ports en écoute :

```bash
# Vérifier les ports déjà occupés
sudo ss -tulpn | grep LISTEN
```

Recherchez si les ports **3306** (MySQL), **4000** (Backend) ou **80/443** (Nginx) sont déjà utilisés.

---

## 2. Création du répertoire isolé
Conformément au cahier des charges, déployez dans un dossier dédié :

```bash
sudo mkdir -p /opt/memoire-recherche
sudo chown -R $USER:$USER /opt/memoire-recherche
cd /opt/memoire-recherche
```

---

## 3. Cloner ou transférer le code
```bash
git clone <votre-depot> .
npm install
```

---

## 4. Configuration des secrets (.env)
Créez le fichier `/opt/memoire-recherche/backend/.env` :
- Générez un `JWT_SECRET` aléatoire sécurisé (ex: `openssl rand -hex 32`)
- Configurez `ORCHESTRATOR_URL=http://127.0.0.1:8000` (l'orchestrateur Python local sur le serveur)
- Configurez `DATABASE_URL` avec l'utilisateur applicatif MySQL
- **Règle absolue :** Aucune clé de modèle de langage dans le backend du site (elles appartiennent à la plateforme Python).

---

## 5. Base de données & Migrations
```bash
cd /opt/memoire-recherche/backend
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

---

## 6. Automatisation des sauvegardes quotidiennes (Politique Zéro Perte)
Installez le script Cron de sauvegarde :

```bash
chmod +x /opt/memoire-recherche/ops/backup-mysql.sh
crontab -l | { cat; cat /opt/memoire-recherche/ops/crontab.txt; } | crontab -
```

---

## 7. Gestionnaire de processus PM2
Pour maintenir le backend actif en permanence :

```bash
sudo npm install -g pm2
cd /opt/memoire-recherche/backend
npm run build
pm2 start dist/index.js --name "memoire-backend" --time
pm2 save
pm2 startup
```

---

## 8. Configuration Nginx (Reverse Proxy & SSL)
Créez `/etc/nginx/sites-available/memoire-recherche` :

```nginx
server {
    server_name memoire.votre-domaine.com;

    # Frontend statique (build Vite)
    root /opt/memoire-recherche/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Backend & Streaming SSE
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Indispensable pour le streaming Server-Sent Events (mot à mot)
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 600s;
    }
}
```

Activez le site et générez le certificat Let's Encrypt :
```bash
sudo ln -s /etc/nginx/sites-available/memoire-recherche /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d memoire.votre-domaine.com
```
