-- Add nullable request idempotency token; existing progress history remains unchanged.
ALTER TABLE `ProjectProgressUpdate`
    ADD COLUMN `submissionId` VARCHAR(64) NULL,
    ADD UNIQUE INDEX `ProjectProgressUpdate_projectId_submissionId_key` (`projectId`, `submissionId`);
