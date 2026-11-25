import { parse as parseCookieHeader } from "cookie";
import { randomUUID } from "node:crypto";
import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { upsertUser } from "./db";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";

const GOOGLE_STATE_COOKIE = "google_oauth_state";
const STATE_MAX_AGE = 10 * 60 * 1000;

type GoogleUser = { sub: string; name?: string; email?: string; picture?: string };

function queryString(req: Request, key: string) {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function redirectUri(req: Request) {
  if (ENV.googleRedirectUri) return ENV.googleRedirectUri;
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol).split(",")[0];
  const host = String(req.headers["x-forwarded-host"] || req.get("host") || "").split(",")[0];
  if (!host) throw new Error("Public host is not available for Google OAuth");
  return `${proto}://${host}/api/google/callback`;
}

function redirectError(res: Response, message: string) {
  res.redirect(302, `/?google_error=${encodeURIComponent(message.slice(0, 180))}`);
}

export function registerGoogleOAuthRoutes(app: Express) {
  app.get("/api/google/connect", (_req: Request, res: Response) => {
    if (!ENV.googleClientId || !ENV.googleClientSecret) {
      redirectError(res, "Google OAuth belum dikonfigurasi. Tambahkan GOOGLE_CLIENT_ID dan GOOGLE_CLIENT_SECRET di secret proyek.");
      return;
    }
    try {
      const state = randomUUID();
      res.cookie(GOOGLE_STATE_COOKIE, state, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: STATE_MAX_AGE,
      });
      const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      url.searchParams.set("client_id", ENV.googleClientId);
      url.searchParams.set("redirect_uri", redirectUri(_req));
      url.searchParams.set("response_type", "code");
      url.searchParams.set("scope", "openid email profile");
      url.searchParams.set("state", state);
      url.searchParams.set("access_type", "offline");
      url.searchParams.set("prompt", "select_account");
      res.redirect(302, url.toString());
    } catch (error) {
      console.error("[Google OAuth] Connect failed", error);
      redirectError(res, "Tidak dapat memulai login Google.");
    }
  });

  app.get("/api/google/callback", async (req: Request, res: Response) => {
    const code = queryString(req, "code");
    const state = queryString(req, "state");
    const errorDescription = queryString(req, "error_description");
    const savedState = parseCookieHeader(req.headers.cookie ?? "")[GOOGLE_STATE_COOKIE];
    res.clearCookie(GOOGLE_STATE_COOKIE, { httpOnly: true, secure: true, sameSite: "none", path: "/" });

    if (errorDescription) {
      redirectError(res, errorDescription);
      return;
    }
    if (!code || !state || !savedState || state !== savedState) {
      redirectError(res, "State OAuth Google tidak valid atau sudah kedaluwarsa.");
      return;
    }

    try {
      const callbackUri = redirectUri(req);
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: callbackUri,
          grant_type: "authorization_code",
        }),
      });
      const tokens = await tokenResponse.json() as { access_token?: string; error?: string; error_description?: string };
      if (!tokenResponse.ok || !tokens.access_token) throw new Error(tokens.error_description || tokens.error || "Google token exchange gagal");

      const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const profile = await profileResponse.json() as GoogleUser & { error?: string };
      if (!profileResponse.ok || !profile.sub) throw new Error(profile.error || "Profil Google tidak tersedia");

      const openId = `google:${profile.sub}`;
      await upsertUser({
        openId,
        name: profile.name || null,
        email: profile.email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });
      const sessionToken = await sdk.createSessionToken(openId, {
        name: profile.name || profile.email || "Google user",
        expiresInMs: ONE_YEAR_MS,
      });
      res.cookie(COOKIE_NAME, sessionToken, { ...getSessionCookieOptions(req), maxAge: ONE_YEAR_MS });
      res.redirect(302, "/?google=connected");
    } catch (error) {
      console.error("[Google OAuth] Callback failed", error instanceof Error ? error.message : "unknown error");
      redirectError(res, error instanceof Error ? error.message : "Login Google gagal.");
    }
  });
}
