import { parse as parseCookieHeader } from "cookie";
import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { encryptSecret } from "./crypto";
import { upsertMetaConnection, replaceMetaPages } from "./metaDb";
import { exchangeMetaCode, getMetaPages, getMetaUser } from "./metaApi";
import { ENV } from "./_core/env";
import { sdk } from "./_core/sdk";

const META_STATE_COOKIE = "meta_oauth_state";
const META_STATE_MAX_AGE = 10 * 60 * 1000;

function queryString(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getRedirectUri(req: Request) {
  if (ENV.metaRedirectUri) return ENV.metaRedirectUri;
  const forwardedProto = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0];
  const forwardedHost = String(req.headers["x-forwarded-host"] || req.get("host") || "").split(",")[0];
  if (!forwardedHost) throw new Error("Public host is not available for Meta OAuth");
  return `${forwardedProto}://${forwardedHost}/api/meta/callback`;
}

function redirectWithError(res: Response, message: string) {
  const safeMessage = encodeURIComponent(message.slice(0, 180));
  res.redirect(302, `/?meta_error=${safeMessage}`);
}

export function registerMetaOAuthRoutes(app: Express) {
  app.get("/api/meta/connect", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        redirectWithError(res, "Masuk ke aplikasi terlebih dahulu.");
        return;
      }
      if (!ENV.metaAppId || !ENV.metaAppSecret) {
        redirectWithError(res, "Meta OAuth belum dikonfigurasi. Tambahkan META_APP_ID dan META_APP_SECRET di secret proyek.");
        return;
      }

      const state = randomUUID();
      const redirectUri = getRedirectUri(req);
      res.cookie(META_STATE_COOKIE, state, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: META_STATE_MAX_AGE,
      });

      const url = new URL(`https://www.facebook.com/${ENV.metaGraphVersion}/dialog/oauth`);
      url.searchParams.set("client_id", ENV.metaAppId);
      url.searchParams.set("redirect_uri", redirectUri);
      url.searchParams.set("state", state);
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "public_profile,pages_show_list,pages_read_engagement,pages_read_user_content");
      res.redirect(302, url.toString());
    } catch (error) {
      console.error("[Meta OAuth] Connect failed", error);
      redirectWithError(res, "Tidak dapat memulai koneksi Meta.");
    }
  });

  app.get("/api/meta/callback", async (req: Request, res: Response) => {
    const code = queryString(req, "code");
    const state = queryString(req, "state");
    const errorDescription = queryString(req, "error_description");
    const cookieState = parseCookieHeader(req.headers.cookie ?? "")[META_STATE_COOKIE];
    res.clearCookie(META_STATE_COOKIE, { httpOnly: true, secure: true, sameSite: "none", path: "/" });

    if (errorDescription) {
      redirectWithError(res, errorDescription);
      return;
    }
    if (!code || !state || !cookieState || state !== cookieState) {
      redirectWithError(res, "State OAuth Meta tidak valid atau sudah kedaluwarsa.");
      return;
    }

    try {
      const user = await sdk.authenticateRequest(req);
      if (!user) {
        redirectWithError(res, "Sesi aplikasi berakhir. Masuk kembali lalu coba lagi.");
        return;
      }
      const redirectUri = getRedirectUri(req);
      const token = await exchangeMetaCode(code, redirectUri);
      const metaUser = await getMetaUser(token.access_token!);
      const connectionId = await upsertMetaConnection({
        userId: user.id,
        metaUserId: metaUser.id,
        metaUserName: metaUser.name,
        encryptedUserToken: encryptSecret(token.access_token!),
      });
      const pages = await getMetaPages(token.access_token!);
      await replaceMetaPages(user.id, connectionId, pages.map(page => ({
        pageId: page.id,
        pageName: page.name,
        category: page.category,
        pictureUrl: page.picture?.data?.url,
        pageAccessToken: encryptSecret(page.access_token),
      })));
      res.redirect(302, "/?meta=connected");
    } catch (error) {
      console.error("[Meta OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      redirectWithError(res, error instanceof Error ? error.message : "Koneksi Meta gagal.");
    }
  });
}
