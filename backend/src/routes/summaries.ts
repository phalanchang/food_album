import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { getNutritionSummary } from "../services/summaries.js";

export const summariesRoute = new Hono();

summariesRoute.use("*", authMiddleware);

const validationHook = (
  result: { success: boolean },
  c: { json: (body: unknown, status: number) => Response }
) => {
  if (!result.success) {
    return c.json({ error: "入力内容に誤りがあります" }, 400);
  }
};

const querySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly"]),
  date: z.string().min(1),
});

summariesRoute.get(
  "/",
  zValidator("query", querySchema, validationHook),
  async (c) => {
    const user = c.get("user");
    const { period, date } = c.req.valid("query");
    const summary = await getNutritionSummary(user.userId, period, date);
    return c.json({ data: summary });
  }
);
