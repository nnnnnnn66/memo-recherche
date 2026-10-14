-- Exécuté une seule fois à la création du conteneur MySQL.
-- Prisma Migrate a besoin d'une "shadow database" en développement :
-- on autorise l'utilisateur applicatif à la créer.
GRANT CREATE, ALTER, DROP, REFERENCES, INDEX, TRIGGER ON *.* TO 'memoire_app'@'%';
FLUSH PRIVILEGES;
