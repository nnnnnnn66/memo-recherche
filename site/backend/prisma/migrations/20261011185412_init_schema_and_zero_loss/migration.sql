-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(30) NOT NULL,
    `name` VARCHAR(120) NOT NULL,
    `email` VARCHAR(190) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_deleted_at_idx`(`deleted_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `research_projects` (
    `id` VARCHAR(30) NOT NULL,
    `owner_id` VARCHAR(30) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `domain` VARCHAR(160) NOT NULL,
    `status` ENUM('draft', 'in_progress', 'completed', 'archived') NOT NULL DEFAULT 'draft',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `research_projects_owner_id_deleted_at_updated_at_idx`(`owner_id`, `deleted_at`, `updated_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `methodology_steps` (
    `id` INTEGER NOT NULL,
    `position` INTEGER NOT NULL,
    `slug` VARCHAR(60) NOT NULL,
    `title` VARCHAR(120) NOT NULL,
    `description` TEXT NOT NULL,
    `guidance` TEXT NOT NULL,

    UNIQUE INDEX `methodology_steps_position_key`(`position`),
    UNIQUE INDEX `methodology_steps_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `step_workspaces` (
    `id` VARCHAR(30) NOT NULL,
    `project_id` VARCHAR(30) NOT NULL,
    `step_id` INTEGER NOT NULL,
    `revision` INTEGER NOT NULL,
    `content` LONGTEXT NOT NULL,
    `word_count` INTEGER NOT NULL DEFAULT 0,
    `note` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `step_workspaces_project_id_step_id_created_at_idx`(`project_id`, `step_id`, `created_at`),
    INDEX `step_workspaces_step_id_idx`(`step_id`),
    UNIQUE INDEX `step_workspaces_project_id_step_id_revision_key`(`project_id`, `step_id`, `revision`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultation_sessions` (
    `id` VARCHAR(30) NOT NULL,
    `project_id` VARCHAR(30) NOT NULL,
    `step_id` INTEGER NULL,
    `title` VARCHAR(255) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `consultation_sessions_project_id_deleted_at_updated_at_idx`(`project_id`, `deleted_at`, `updated_at`),
    INDEX `consultation_sessions_step_id_idx`(`step_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultation_messages` (
    `id` VARCHAR(30) NOT NULL,
    `session_id` VARCHAR(30) NOT NULL,
    `role` ENUM('student', 'guide') NOT NULL,
    `content` LONGTEXT NOT NULL,
    `status` ENUM('complete', 'interrupted', 'error') NOT NULL DEFAULT 'complete',
    `engine` VARCHAR(60) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deleted_at` DATETIME(3) NULL,

    INDEX `consultation_messages_session_id_created_at_idx`(`session_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `research_projects` ADD CONSTRAINT `research_projects_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `step_workspaces` ADD CONSTRAINT `step_workspaces_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `research_projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `step_workspaces` ADD CONSTRAINT `step_workspaces_step_id_fkey` FOREIGN KEY (`step_id`) REFERENCES `methodology_steps`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultation_sessions` ADD CONSTRAINT `consultation_sessions_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `research_projects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultation_sessions` ADD CONSTRAINT `consultation_sessions_step_id_fkey` FOREIGN KEY (`step_id`) REFERENCES `methodology_steps`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultation_messages` ADD CONSTRAINT `consultation_messages_session_id_fkey` FOREIGN KEY (`session_id`) REFERENCES `consultation_sessions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
