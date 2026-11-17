import { CookieOptions } from "express";

/**
 * Cookie options สำหรับ auth tokens
 * prod: web (Vercel) กับ api (Railway/Render) คนละ domain → cookie ต้อง
 *       SameSite=None + Secure ถึงจะส่งข้าม site ได้; dev ใช้ Lax บน http
 *
 * แยก 2 cookie:
 * - accessToken  : อายุสั้น (15m) ส่งทุก request (path "/")
 * - refreshToken : อายุยาว (7d) ส่งเฉพาะ endpoint refresh (path จำกัด)
 *   → จำกัด path เพื่อให้ refresh token ไม่ถูกแนบไปทุก request (ลด exposure)
 */

const REFRESH_PATH = "/api/v1/users/auth/cookie";

function base(isProd: boolean, cookieDomain?: string): CookieOptions {
  return {
    httpOnly: true, // JS อ่านไม่ได้ → กัน XSS ขโมย token
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    ...(isProd && cookieDomain ? { domain: cookieDomain } : {}),
  };
}

export function accessCookieOptions(
  isProd: boolean,
  cookieDomain?: string,
): CookieOptions {
  return {
    ...base(isProd, cookieDomain),
    path: "/",
    maxAge: 15 * 60 * 1000, // 15 นาที
  };
}

export function refreshCookieOptions(
  isProd: boolean,
  cookieDomain?: string,
): CookieOptions {
  return {
    ...base(isProd, cookieDomain),
    path: REFRESH_PATH,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 วัน
  };
}
