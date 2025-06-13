-- CreateTable
CREATE TABLE `FeedbackRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `batch_number` INTEGER NOT NULL,
    `note` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
