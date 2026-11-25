import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with relations as your product grows.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const metaConnections = mysqlTable("meta_connections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  metaUserId: varchar("metaUserId", { length: 128 }).notNull(),
  metaUserName: varchar("metaUserName", { length: 255 }),
  encryptedUserToken: text("encryptedUserToken").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userMetaUnique: uniqueIndex("meta_connections_user_meta_unique").on(table.userId, table.metaUserId),
}));

export type MetaConnection = typeof metaConnections.$inferSelect;

export const metaPages = mysqlTable("meta_pages", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  connectionId: int("connectionId").notNull(),
  pageId: varchar("pageId", { length: 128 }).notNull(),
  pageName: varchar("pageName", { length: 255 }).notNull(),
  category: varchar("category", { length: 255 }),
  pictureUrl: text("pictureUrl"),
  encryptedPageToken: text("encryptedPageToken").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  userPageUnique: uniqueIndex("meta_pages_user_page_unique").on(table.userId, table.pageId),
}));

export type MetaPage = typeof metaPages.$inferSelect;
