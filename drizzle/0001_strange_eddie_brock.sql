CREATE TABLE `meta_connections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`metaUserId` varchar(128) NOT NULL,
	`metaUserName` varchar(255),
	`encryptedUserToken` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_connections_id` PRIMARY KEY(`id`),
	CONSTRAINT `meta_connections_user_meta_unique` UNIQUE(`userId`,`metaUserId`)
);
--> statement-breakpoint
CREATE TABLE `meta_pages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`connectionId` int NOT NULL,
	`pageId` varchar(128) NOT NULL,
	`pageName` varchar(255) NOT NULL,
	`category` varchar(255),
	`pictureUrl` text,
	`encryptedPageToken` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `meta_pages_id` PRIMARY KEY(`id`),
	CONSTRAINT `meta_pages_user_page_unique` UNIQUE(`userId`,`pageId`)
);
