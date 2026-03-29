import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { setCookie } from "hono/cookie";
import {
  createUser,
  findUserByEmail,
  generateToken,
  verifyPassword,
} from "../services/auth.js";

export const authRoute = new Hono();

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const validationHook = (
  result: { success: boolean },
  c: { json: (body: unknown, status: number) => Response }
) => {
  if (!result.success) {
    return c.json({ error: "入力内容に誤りがあります" }, 400);
  }
};

authRoute.post(
  "/register",
  zValidator("json", registerSchema, validationHook),
  async (c) => {
    const { email, password, displayName } = c.req.valid("json");
    try {
      const user = await createUser(email, password, displayName);
      const token = generateToken({ userId: user.id, email: user.email });
      setCookie(c, "token", token, COOKIE_OPTIONS);
      return c.json(
        {
          data: {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
          },
        },
        201
      );
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code: string }).code === "23505"
      ) {
        return c.json(
          { error: "このメールアドレスは既に登録されています" },
          409
        );
      }
      throw err;
    }
  }
);

authRoute.post(
  "/login",
  zValidator("json", loginSchema, validationHook),
  async (c) => {
    const { email, password } = c.req.valid("json");
    const user = await findUserByEmail(email);

    if (!user || !user.password_hash) {
      return c.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        401
      );
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) {
      return c.json(
        { error: "メールアドレスまたはパスワードが正しくありません" },
        401
      );
    }

    const token = generateToken({ userId: user.id, email: user.email });
    setCookie(c, "token", token, COOKIE_OPTIONS);
    return c.json({
      data: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
      },
    });
  }
);
