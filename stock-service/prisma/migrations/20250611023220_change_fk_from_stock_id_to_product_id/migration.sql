/*
  Warnings:

  - You are about to drop the column `stock_id` on the `histories` table. All the data in the column will be lost.
  - Added the required column `product_id` to the `histories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `histories` DROP FOREIGN KEY `histories_stock_id_fkey`;

-- DropIndex
DROP INDEX `histories_stock_id_fkey` ON `histories`;

-- AlterTable
ALTER TABLE `histories` DROP COLUMN `stock_id`,
    ADD COLUMN `product_id` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `histories` ADD CONSTRAINT `histories_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `stocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
