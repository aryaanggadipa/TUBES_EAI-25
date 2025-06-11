/*
  Warnings:

  - Added the required column `status` to the `FeedbackRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `FeedbackRequest` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `status` ENUM('PENDING', 'COMPLETED') NOT NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
