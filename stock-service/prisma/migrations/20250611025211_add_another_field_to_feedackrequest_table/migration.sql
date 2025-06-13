/*
  Warnings:

  - Added the required column `product_id` to the `FeedbackRequest` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quantity` to the `FeedbackRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `FeedbackRequest` ADD COLUMN `product_id` INTEGER NOT NULL,
    ADD COLUMN `quantity` INTEGER NOT NULL;
