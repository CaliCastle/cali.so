ALTER TABLE `comments` MODIFY COLUMN `user_info` json;
ALTER TABLE `comments` MODIFY COLUMN `body` json;
ALTER TABLE `comments` ADD `user_id` varchar(200) NOT NULL;