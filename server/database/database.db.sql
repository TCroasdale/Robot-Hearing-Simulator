BEGIN TRANSACTION;
DROP TABLE IF EXISTS `sounds`;
CREATE TABLE IF NOT EXISTS `sounds` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`name`	TEXT NOT NULL,
	`pathToFile`	TEXT NOT NULL,
	`userID`	INTEGER NOT NULL
);
DROP TABLE IF EXISTS `simulations`;
CREATE TABLE IF NOT EXISTS `simulations` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`pathToConfig`	TEXT NOT NULL,
	`dateCreated`	TEXT,
	`dateFinished`	TEXT,
	`state`	TEXT DEFAULT 'scheduled',
	`seed`	INTEGER NOT NULL,
	`pathToZip`	INTEGER,
	`userID`	INTEGER NOT NULL,
	`taskID`	TEXT
);
DROP TABLE IF EXISTS `robots`;
CREATE TABLE IF NOT EXISTS `robots` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	`name`	TEXT NOT NULL,
	`pathToConfig`	TEXT NOT NULL,
	`userID`	INTEGER NOT NULL
);
DROP TABLE IF EXISTS `microphones`;
CREATE TABLE IF NOT EXISTS `microphones` (
	`ID`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`name`	TEXT NOT NULL,
	`pathToFile`	TEXT NOT NULL UNIQUE,
	`userID`	INTEGER
);
DROP TABLE IF EXISTS `user_liked_items`;
CREATE TABLE IF NOT EXISTS `user_liked_items` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	`userID`	INTEGER NOT NULL,
	`itemID`	INTEGER NOT NULL
);
DROP TABLE IF EXISTS `user_added_items`;
CREATE TABLE IF NOT EXISTS `user_added_items` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	`userID`	INTEGER NOT NULL,
	`itemID`	INTEGER NOT NULL
);
DROP TABLE IF EXISTS `public_items`;
CREATE TABLE IF NOT EXISTS `public_items` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
	`name`	TEXT NOT NULL,
	`description`	TEXT NOT NULL,
	`type`	TEXT NOT NULL,
	`itemID`	INTEGER NOT NULL,
	`likes`	INTEGER DEFAULT 1,
	`publisherID`	INTEGER,
	`publishDate`	TEXT DEFAULT 060320197
);
DROP TABLE IF EXISTS `users`;
CREATE TABLE IF NOT EXISTS `users` (
	`id`	INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT UNIQUE,
	`email`	TEXT NOT NULL UNIQUE,
	`passHash`	TEXT NOT NULL,
	`passSalt`	TEXT NOT NULL,
	`accessLevel`	INTEGER NOT NULL DEFAULT 0
);
COMMIT;
