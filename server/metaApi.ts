import { ENV } from "./_core/env";

export class MetaApiError extends Error {
  constructor(message: string, public readonly code?: number) {
    super(message);
    this.name = "MetaApiError";
  }
}

function graphUrl(path: string) {
  return `https://graph.facebook.com/${ENV.metaGraphVersion}${path}`;
}

async function graphGet<T>(path: string, accessToken: string, params: Record<string, string | number>) {
  const url = new URL(graphUrl(path));
  url.searchParams.set("access_token", accessToken);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  const response = await fetch(url);
  const payload = await response.json() as T & { error?: { message?: string; code?: number } };
  if (!response.ok || payload.error) {
    throw new MetaApiError(payload.error?.message || `Meta Graph API request failed (${response.status})`, payload.error?.code);
  }
  return payload;
}

export async function exchangeMetaCode(code: string, redirectUri: string) {
  if (!ENV.metaAppId || !ENV.metaAppSecret) throw new MetaApiError("Meta OAuth belum dikonfigurasi di server");
  const url = new URL(graphUrl("/oauth/access_token"));
  url.searchParams.set("client_id", ENV.metaAppId);
  url.searchParams.set("client_secret", ENV.metaAppSecret);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("code", code);
  const response = await fetch(url);
  const payload = await response.json() as { access_token?: string; token_type?: string; expires_in?: number; error?: { message?: string; code?: number } };
  if (!response.ok || payload.error || !payload.access_token) {
    throw new MetaApiError(payload.error?.message || "Meta tidak mengembalikan access token", payload.error?.code);
  }
  return payload;
}

export async function getMetaUser(accessToken: string) {
  return graphGet<{ id: string; name?: string }>("/me", accessToken, { fields: "id,name" });
}

export type MetaPageResponse = {
  id: string;
  name: string;
  category?: string;
  access_token: string;
  picture?: { data?: { url?: string } };
};

export async function getMetaPages(accessToken: string) {
  const result = await graphGet<{ data?: MetaPageResponse[] }>("/me/accounts", accessToken, {
    fields: "id,name,category,access_token,picture",
    limit: 50,
  });
  return result.data ?? [];
}

export type MetaVideo = {
  id: string;
  title?: string;
  description?: string;
  permalink_url?: string;
  picture?: string;
  created_time?: string;
  source?: string;
};

async function getVideoEdge(pageId: string, edge: "video_reels" | "videos", accessToken: string) {
  return graphGet<{ data?: MetaVideo[] }>(`/${pageId}/${edge}`, accessToken, {
    fields: "id,title,description,permalink_url,picture,created_time,source",
    limit: 9,
  });
}

export async function getPageVideos(pageId: string, accessToken: string) {
  try {
    const reels = await getVideoEdge(pageId, "video_reels", accessToken);
    if ((reels.data ?? []).length > 0) return reels.data ?? [];
  } catch (error) {
    if (!(error instanceof MetaApiError) || ![100, 200, 190].includes(error.code ?? -1)) throw error;
  }
  const videos = await getVideoEdge(pageId, "videos", accessToken);
  return videos.data ?? [];
}
