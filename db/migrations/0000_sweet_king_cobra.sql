CREATE TABLE `subscribers` (
	`cuid` text PRIMARY KEY NOT NULL,
	`email` varchar(120),
	`token` varchar(50),
	`subscribed_at` datetime);
