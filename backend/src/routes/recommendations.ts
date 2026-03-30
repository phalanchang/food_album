import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { authMiddleware } from "../middleware/auth.js";
import { getRecommendations } from "../services/recommendations.js";

export const recommendationsRoute = new Hono();

recommendationsRoute.use("*", authMiddleware);

const validationHook = (
  result: { success: boolean },
  c: { json: (body: unknown, status: number) => Response }
) => {
  if (!result.success) {
    return c.json({ error: "入力内容に誤りがあります" }, 400);
  }
};

const bodySchema = z.object({
  period: z.enum(["daily", "weekly", "monthly"]),
  date: z.string().min(1),
});

recommendationsRoute.post(
  "/",
  zValidator("json", bodySchema, validationHook),
  async (c) => {
    const user = c.get("user");
    const { period, date } = c.req.valid("json");
    const result = await getRecommendations(user.userId, period, date);
    return c.json({ data: result });
  }
);
