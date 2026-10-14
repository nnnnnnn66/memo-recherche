#!/bin/bash
set -e
echo "Installation de MySQL Server dans WSL Ubuntu..."
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update -qq
sudo apt-get install -y -qq mysql-server
sudo service mysql start

echo "Configuration des utilisateurs et de la base..."
sudo mysql <<EOF
CREATE DATABASE IF NOT EXISTS memoire_recherche CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'memoire_app'@'%' IDENTIFIED WITH mysql_native_password BY 'memoire_dev_password';
ALTER USER 'memoire_app'@'%' IDENTIFIED WITH mysql_native_password BY 'memoire_dev_password';
GRANT ALL PRIVILEGES ON *.* TO 'memoire_app'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
EOF

# Permettre l'écoute sur 0.0.0.0 pour que Windows puisse y accéder via localhost
sudo sed -i 's/bind-address.*/bind-address = 0.0.0.0/' /etc/mysql/mysql.conf.d/mysqld.cnf 2>/dev/null || true
sudo service mysql restart

echo "MYSQL_LOCAL_READY_SUCCESS"
