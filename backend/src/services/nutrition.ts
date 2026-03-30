import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";
import { query } from "../db/client.js";

export interface NutritionResult {
  foods: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  comment: string;
}

const SYSTEM_PROMPT = `あなたは栄養士です。食事の写真を見て、栄養評価を行ってください。
以下のJSON形式で回答してください。他の文字は一切含めないでください。

{
  "foods": ["料理名1", "料理名2"],
  "calories": 推定カロリー(kcal, 整数),
  "protein": 推定タンパク質(g, 小数点1桁),
  "fat": 推定脂質(g, 小数点1桁),
  "carbs": 推定炭水化物(g, 小数点1桁),
  "comment": "評価コメント（良い点・改善点を含む、2〜3文）"
}

精度は目安レベルで構いません。料理の種類はある程度細かく判定し、量はざっくり推定してください。`;

function getMediaType(photoUrl: string): "image/jpeg" | "image/png" | "image/gif" | "image/webp" {
  const ext = path.extname(photoUrl).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".gif") return "image/gif";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

export async function evaluateNutrition(
  mealId: string,
  photoUrl: string
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    await query(
      `UPDATE meals SET nutrition_status = 'skipped' WHERE id = $1`,
      [mealId]
    );
    return;
  }

  try {
    const filePath = path.join("/app", photoUrl);
    const imageBuffer = await fs.readFile(filePath);
    const base64 = imageBuffer.toString("base64");
    const mediaType = getMediaType(photoUrl);

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: base64 },
            },
            {
              type: "text",
              text: "この食事写真の栄養評価をお願いします。",
            },
          ],
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const result: NutritionResult = JSON.parse(textBlock.text);

    await query(
      `UPDATE meals
       SET nutrition_status = 'completed',
           nutrition_result = $1,
           evaluated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(result), mealId]
    );
  } catch (err) {
    console.error(`Nutrition evaluation failed for meal ${mealId}:`, err);
    await query(
      `UPDATE meals SET nutrition_status = 'failed' WHERE id = $1`,
      [mealId]
    );
  }
}
