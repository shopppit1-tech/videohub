import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ENV } from "./_core/env";

function getKey() {
  const material = ENV.metaAppSecret || ENV.cookieSecret;
  if (!material) throw new Error("A server encryption secret is not configured");
  return createHash("sha256").update(material).digest();
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map(part => part.toString("base64url")).join(".");
}

export function decryptSecret(value: string) {
  const [ivPart, tagPart, encryptedPart] = value.split(".");
  if (!ivPart || !tagPart || !encryptedPart) throw new Error("Invalid encrypted secret");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivPart, "base64url"));
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(encryptedPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
