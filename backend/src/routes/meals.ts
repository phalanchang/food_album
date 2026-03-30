import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { authMiddleware } from "../middleware/auth.js";
import {
  createMeal,
  findMealsByUser,
  findMealById,
  deleteMealById,
} from "../services/meals.js";

export const mealsRoute = new Hono();

mealsRoute.use("*", authMiddleware);

const UPLOAD_DIR = "/app/uploads";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const validationHook = (
  result: { success: boolean },
  c: { json: (body: unknown, status: number) => Response }
) => {
  if (!result.success) {
    return c.json({ error: "入力内容に誤りがあります" }, 400);
  }
};

const listQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
});

// POST / — 食事記録作成（写真アップロード）
mealsRoute.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();

  const photo = body["photo"];
  if (!(photo instanceof File)) {
    return c.json({ error: "写真ファイルが必要です" }, 400);
  }
  if (!photo.type.startsWith("image/")) {
    return c.json({ error: "画像ファイルのみアップロードできます" }, 400);
  }
  if (photo.size > MAX_FILE_SIZE) {
    return c.json({ error: "ファイルサイズは5MB以下にしてください" }, 400);
  }

  const mealType = body["mealType"];
  const eatenAt = body["eatenAt"];
  const memo = body["memo"];

  const schema = z.object({
    mealType: z.enum(["breakfast", "lunch", "dinner", "snack"]),
    eatenAt: z.string().min(1),
    memo: z.string().max(500).optional(),
  });

  const parsed = schema.safeParse({ mealType, eatenAt, memo: memo || undefined });
  if (!parsed.success) {
    return c.json({ error: "入力内容に誤りがあります" }, 400);
  }

  const ext = path.extname(photo.name || ".jpg");
  const filename = `${crypto.randomUUID()}${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  try {
    const buffer = Buffer.from(await photo.arrayBuffer());
    await fs.writeFile(filepath, buffer);
  } catch {
    return c.json({ error: "ファイルの保存に失敗しました" }, 500);
  }

  const meal = await createMeal(
    user.userId,
    `/uploads/${filename}`,
    parsed.data.mealType,
    parsed.data.eatenAt,
    parsed.data.memo
  );

  return c.json({ data: meal }, 201);
});

// GET / — 食事記録一覧
mealsRoute.get(
  "/",
  zValidator("query", listQuerySchema, validationHook),
  async (c) => {
    const user = c.get("user");
    const { from, to, mealType, limit, offset } = c.req.valid("query");

    const result = await findMealsByUser(user.userId, {
      from,
      to,
      mealType,
      limit,
      offset,
    });

    return c.json({ data: { ...result, limit, offset } });
  }
);

// GET /:id — 食事記録詳細
mealsRoute.get("/:id", async (c) => {
  const user = c.get("user");
  const meal = await findMealById(c.req.param("id"));

  if (!meal || meal.user_id !== user.userId) {
    return c.json({ error: "食事記録が見つかりません" }, 404);
  }

  return c.json({ data: meal });
});

// DELETE /:id — 食事記録削除
mealsRoute.delete("/:id", async (c) => {
  const user = c.get("user");
  const meal = await findMealById(c.req.param("id"));

  if (!meal || meal.user_id !== user.userId) {
    return c.json({ error: "食事記録が見つかりません" }, 404);
  }

  await deleteMealById(meal.id);

  // 写真ファイルを削除（失敗しても無視）
  try {
    const filepath = path.join("/app", meal.photo_url);
    await fs.unlink(filepath);
  } catch {
    // ファイルが既に存在しない場合は無視
  }

  return c.json({ data: { message: "食事記録を削除しました" } });
});
