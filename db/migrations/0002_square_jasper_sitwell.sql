CREATE TABLE `comments` (
	`id` serial AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`user_id` varchar(200) NOT NULL,
	`post_id` varchar(100) NOT NULL,
	`body` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()));

ALTER TABLE `subscribers` ADD `unsubscribed_at` datetime;
ALTER TABLE `subscribers` ADD `updated_at` timestamp DEFAULT (now());