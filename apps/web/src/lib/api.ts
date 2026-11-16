import axios from "axios";

/**
 * Shared axios instance. `withCredentials` sends the httpOnly auth cookie
 * on every request (same pattern as the original app).
 *
 * NEXT_PUBLIC_API_URL is baked into the browser bundle at build time, so it
 * must be set BEFORE `next build` (Vercel env / Docker build arg).
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api/v1",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});
