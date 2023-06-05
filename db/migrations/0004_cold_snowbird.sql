ALTER TABLE `comments` RENAME COLUMN `user_id` TO `user_info`;
ALTER TABLE `comments` MODIFY COLUMN `user_info` text NOT NULL;