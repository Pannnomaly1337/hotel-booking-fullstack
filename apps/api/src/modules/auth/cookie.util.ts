import { CookieOptions } from "express";

/**
 * Cookie options for the auth token.
 * In production the web app (Vercel) and api (Render) live on different
 * domains, so the cookie must be SameSite=None + Secure to be sent
 * cross-site. In dev we use Lax over http.
 */
export function authCookieOptions(
  isProd: boolean,
  cookieDomain?: string,
): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
    ...(isProd && cookieDomain ? { domain: cookieDomain } : {}),
    maxAge: 60 * 60 * 1000, // 1h
  };
}
