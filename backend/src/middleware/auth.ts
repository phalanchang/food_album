import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import { verifyToken } from "../services/auth.js";
import type { AuthUser } from "../types/auth.js";

type AuthEnv = {
  Variables: {
    user: AuthUser;
  };
};

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = getCookie(c, "token");
  if (!token) {
    return c.json({ error: "認証が必要です" }, 401);
  }
  try {
    const payload = verifyToken(token);
    c.set("user", { userId: payload.userId, email: payload.email });
    await next();
  } catch {
    return c.json({ error: "無効なトークンです" }, 401);
  }
});
