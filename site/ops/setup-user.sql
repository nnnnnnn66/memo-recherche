CREATE DATABASE IF NOT EXISTS memoire_recherche CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'memoire_app'@'%' IDENTIFIED BY 'memoire_dev_password';
ALTER USER 'memoire_app'@'%' IDENTIFIED BY 'memoire_dev_password';
GRANT ALL PRIVILEGES ON *.* TO 'memoire_app'@'%' WITH GRANT OPTION;
FLUSH PRIVILEGES;
