-- Déclencheurs de protection ZÉRO-PERTE au niveau moteur MySQL
-- Interdisent formellement l'instruction DELETE sur les tables métier
-- Seul le Soft Delete (mise à jour de deleted_at) est accepté

DELIMITER $$

DROP TRIGGER IF EXISTS trg_prevent_delete_users$$
CREATE TRIGGER trg_prevent_delete_users
BEFORE DELETE ON users
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'ZERO-PERTE: Suppression physique des utilisateurs interdite. Utiliser soft-delete.';
END$$

DROP TRIGGER IF EXISTS trg_prevent_delete_projects$$
CREATE TRIGGER trg_prevent_delete_projects
BEFORE DELETE ON research_projects
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'ZERO-PERTE: Suppression physique des projets interdite. Utiliser soft-delete.';
END$$

DROP TRIGGER IF EXISTS trg_prevent_delete_workspaces$$
CREATE TRIGGER trg_prevent_delete_workspaces
BEFORE DELETE ON step_workspaces
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'ZERO-PERTE: Revisions workspaces immuables. Suppression interdite.';
END$$

DROP TRIGGER IF EXISTS trg_prevent_delete_sessions$$
CREATE TRIGGER trg_prevent_delete_sessions
BEFORE DELETE ON consultation_sessions
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'ZERO-PERTE: Suppression physique des sessions interdite.';
END$$

DROP TRIGGER IF EXISTS trg_prevent_delete_messages$$
CREATE TRIGGER trg_prevent_delete_messages
BEFORE DELETE ON consultation_messages
FOR EACH ROW
BEGIN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'ZERO-PERTE: Suppression physique des messages interdite.';
END$$

DELIMITER ;
