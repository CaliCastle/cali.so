CREATE TABLE `newsletters` (
	`id` serial AUTO_INCREMENT PRIMARY KEY NOT NULL,
	`subject` varchar(200),
	`body` text,
	`sent_at` datetime,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()));
