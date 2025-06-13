/*
  Warnings:

  - A unique constraint covering the columns `[product_id]` on the table `stocks` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `histories` DROP FOREIGN KEY `histories_stock_id_fkey`;

-- DropIndex
DROP INDEX `histories_stock_id_fkey` ON `histories`;

-- CreateIndex
CREATE UNIQUE INDEX `stocks_product_id_key` ON `stocks`(`product_id`);

-- AddForeignKey
ALTER TABLE `histories` ADD CONSTRAINT `histories_stock_id_fkey` FOREIGN KEY (`stock_id`) REFERENCES `stocks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
