-- AlterTable User: Safe column addition
ALTER TABLE `User` ADD COLUMN `isProfileCompleted` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable CustomerProfile: Safe column additions
ALTER TABLE `CustomerProfile` ADD COLUMN `organizationType` VARCHAR(191) NULL,
    ADD COLUMN `useCase` VARCHAR(191) NULL,
    ADD COLUMN `website` VARCHAR(191) NULL,
    ADD COLUMN `linkedinUrl` VARCHAR(191) NULL;

-- AlterTable FreelancerProfile: Safe column additions
ALTER TABLE `FreelancerProfile` ADD COLUMN `linkedinUrl` VARCHAR(191) NULL,
    ADD COLUMN `githubUrl` VARCHAR(191) NULL,
    ADD COLUMN `websiteUrl` VARCHAR(191) NULL,
    ADD COLUMN `yearsOfExperience` INTEGER NULL,
    ADD COLUMN `experienceSummary` TEXT NULL;

-- CreateTable Certification
CREATE TABLE IF NOT EXISTS `Certification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `freelancerProfileId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `issuingOrg` VARCHAR(191) NOT NULL,
    `issueYear` VARCHAR(191) NULL,
    `credentialUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Certification_freelancerProfileId_idx`(`freelancerProfileId`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Certification_freelancerProfileId_fkey` FOREIGN KEY (`freelancerProfileId`) REFERENCES `FreelancerProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable ProjectProgressUpdate
CREATE TABLE IF NOT EXISTS `ProjectProgressUpdate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projectId` INTEGER NOT NULL,
    `contractId` INTEGER NULL,
    `updatedById` INTEGER NOT NULL,
    `stage` VARCHAR(191) NOT NULL,
    `progressPercentage` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(191) NOT NULL DEFAULT 'IN_PROGRESS',
    `note` TEXT NULL,
    `actionRequired` BOOLEAN NOT NULL DEFAULT false,
    `actionNote` TEXT NULL,
    `expectedCompletion` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProjectProgressUpdate_projectId_idx`(`projectId`),
    INDEX `ProjectProgressUpdate_contractId_idx`(`contractId`),
    INDEX `ProjectProgressUpdate_updatedById_idx`(`updatedById`),
    INDEX `ProjectProgressUpdate_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `ProjectProgressUpdate_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `ProjectProgressUpdate_contractId_fkey` FOREIGN KEY (`contractId`) REFERENCES `Contract`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `ProjectProgressUpdate_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable Notification
CREATE TABLE IF NOT EXISTS `Notification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'INFO',
    `link` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Notification_userId_idx`(`userId`),
    INDEX `Notification_isRead_idx`(`isRead`),
    INDEX `Notification_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`),
    CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;


-- Backfill the backend-owned completion flag for profiles that were valid before
-- the onboarding fields were introduced. New accounts are not affected.
UPDATE `User` AS u
INNER JOIN `FreelancerProfile` AS fp ON fp.`userId` = u.`id`
SET u.`isProfileCompleted` = true
WHERE u.`role` = 'FREELANCER'
  AND TRIM(COALESCE(u.`name`, '')) <> ''
  AND TRIM(COALESCE(u.`professionalTitle`, '')) <> ''
  AND TRIM(COALESCE(fp.`bio`, '')) <> '';

UPDATE `User` AS u
INNER JOIN `CustomerProfile` AS cp ON cp.`userId` = u.`id`
SET u.`isProfileCompleted` = true
WHERE u.`role` = 'CUSTOMER'
  AND TRIM(COALESCE(u.`name`, '')) <> ''
  AND (TRIM(COALESCE(cp.`companyName`, '')) <> '' OR TRIM(COALESCE(cp.`bio`, '')) <> '');
