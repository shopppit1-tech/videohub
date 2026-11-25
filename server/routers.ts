import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { disconnectMeta, getMetaPagesWithTokens, hasMetaConnection, listMetaPages } from "./metaDb";
import { decryptSecret } from "./crypto";
import { getPageVideos } from "./metaApi";
import { z } from "zod";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  meta: router({
    status: publicProcedure.query(() => ({ configured: Boolean(process.env.META_APP_ID && process.env.META_APP_SECRET) })),
    accounts: protectedProcedure.query(async ({ ctx }) => listMetaPages(ctx.user.id)),
    videos: protectedProcedure.input(z.object({ pageIds: z.array(z.string()).max(9).default([]) })).query(async ({ ctx, input }) => {
      const pages = await getMetaPagesWithTokens(ctx.user.id, input.pageIds);
      const results = await Promise.all(pages.slice(0, 9).map(async page => {
        try {
          const videos = await getPageVideos(page.pageId, decryptSecret(page.encryptedPageToken));
          return videos.slice(0, 9).map(video => ({
            id: video.id,
            pageId: page.pageId,
            pageName: page.pageName,
            title: video.title || video.description || "Video tanpa judul",
            description: video.description || null,
            permalinkUrl: video.permalink_url || null,
            picture: video.picture || null,
            createdTime: video.created_time || null,
          }));
        } catch (error) {
          console.error(`[Meta Graph] Failed to load videos for ${page.pageId}`, error);
          return [];
        }
      }));
      return results.flat().slice(0, 9);
    }),
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      await disconnectMeta(ctx.user.id);
      return { success: true } as const;
    }),
  }),
});

export type AppRouter = typeof appRouter;
