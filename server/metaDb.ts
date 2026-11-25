import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { metaConnections, metaPages } from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

async function getDb() {
  if (!_db && ENV.databaseUrl) {
    _db = drizzle(ENV.databaseUrl);
  }
  return _db;
}

export type MetaPageInput = {
  pageId: string;
  pageName: string;
  category?: string | null;
  pictureUrl?: string | null;
  pageAccessToken: string;
};

export async function upsertMetaConnection(input: {
  userId: number;
  metaUserId: string;
  metaUserName?: string | null;
  encryptedUserToken: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  const existing = await db.select().from(metaConnections).where(
    and(eq(metaConnections.userId, input.userId), eq(metaConnections.metaUserId, input.metaUserId)),
  ).limit(1);

  if (existing[0]) {
    await db.update(metaConnections).set({
      metaUserName: input.metaUserName ?? null,
      encryptedUserToken: input.encryptedUserToken,
      updatedAt: new Date(),
    }).where(eq(metaConnections.id, existing[0].id));
    return existing[0].id;
  }

  const result = await db.insert(metaConnections).values({
    userId: input.userId,
    metaUserId: input.metaUserId,
    metaUserName: input.metaUserName ?? null,
    encryptedUserToken: input.encryptedUserToken,
  });
  return Number(result[0].insertId);
}

export async function replaceMetaPages(userId: number, connectionId: number, pages: MetaPageInput[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const existing = await db.select({ id: metaPages.id, pageId: metaPages.pageId })
    .from(metaPages).where(and(eq(metaPages.userId, userId), eq(metaPages.connectionId, connectionId)));
  const incomingIds = new Set(pages.slice(0, 9).map(page => page.pageId));

  for (const row of existing) {
    if (!incomingIds.has(row.pageId)) {
      await db.delete(metaPages).where(eq(metaPages.id, row.id));
    }
  }

  for (const page of pages.slice(0, 9)) {
    const current = await db.select().from(metaPages).where(
      and(eq(metaPages.userId, userId), eq(metaPages.pageId, page.pageId)),
    ).limit(1);
    const values = {
      userId,
      connectionId,
      pageId: page.pageId,
      pageName: page.pageName,
      category: page.category ?? null,
      pictureUrl: page.pictureUrl ?? null,
      encryptedPageToken: page.pageAccessToken,
      updatedAt: new Date(),
    };
    if (current[0]) {
      await db.update(metaPages).set(values).where(eq(metaPages.id, current[0].id));
    } else {
      await db.insert(metaPages).values(values);
    }
  }
}

export async function listMetaPages(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: metaPages.id,
    pageId: metaPages.pageId,
    pageName: metaPages.pageName,
    category: metaPages.category,
    pictureUrl: metaPages.pictureUrl,
    updatedAt: metaPages.updatedAt,
  }).from(metaPages).where(eq(metaPages.userId, userId)).orderBy(desc(metaPages.updatedAt)).limit(9);
}

export async function getMetaPagesWithTokens(userId: number, pageIds?: string[]) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(metaPages).where(eq(metaPages.userId, userId)).orderBy(desc(metaPages.updatedAt)).limit(9);
  if (!pageIds || pageIds.length === 0) return rows;
  const selected = new Set(pageIds.slice(0, 9));
  return rows.filter(row => selected.has(row.pageId));
}

export async function disconnectMeta(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(metaPages).where(eq(metaPages.userId, userId));
  await db.delete(metaConnections).where(eq(metaConnections.userId, userId));
}

export async function hasMetaConnection(userId: number) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select({ id: metaConnections.id }).from(metaConnections).where(eq(metaConnections.userId, userId)).limit(1);
  return rows.length > 0;
}
