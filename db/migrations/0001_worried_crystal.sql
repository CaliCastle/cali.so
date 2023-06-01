ALTER TABLE `subscribers` RENAME COLUMN `cuid` TO `id`;
ALTER TABLE `subscribers` MODIFY COLUMN `id` serial AUTO_INCREMENT NOT NULL;