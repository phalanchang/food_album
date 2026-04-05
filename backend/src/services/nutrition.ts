import Anthropic from "@anthropic-ai/sdk";
import fs from "fs/promises";
import path from "path";
import { query } from "../db/client.js";

export interface NutrientDetail {
  name: string;
  value: number;
  unit: string;
}

export interface NutritionResult {
  foods: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  comment: string;
  details?: NutrientDetail[];
}

const NUTRITION_JSON_SCHEMA = `{
  "foods": ["料理名1", "料理名2"],
  "calories": 推定カロリー(kcal, 整数),
  "protein": 推定タンパク質(g, 小数点1桁),
  "fat": 推定脂質(g, 小数点1桁),
  "carbs": 推定炭水化物(g, 小数点1桁),
  "comment": "評価コメント（良い点・改善点を含む、2〜3文）",
  "details": [
    { "name": "食物繊維", "value": 推定値(小数点1桁), "unit": "g" },
    { "name": "塩分", "value": 推定値(小数点1桁), "unit": "g" },
    { "name": "鉄分", "value": 推定値(小数点1桁), "unit": "mg" },
    { "name": "カルシウム", "value": 推定値(整数), "unit": "mg" },
    { "name": "ビタミンA", "value": 推定値(整数), "unit": "μg" },
    { "name": "ビタミンB1", "value": 推定値(小数点2桁), "unit": "mg" },
    { "name": "ビタミンB2", "value": 推定値(小数点2桁), "unit": "mg" },
    { "name": "ビタミンC", "value": 推定値(整数), "unit": "mg" },
    { "name": "ビタミンD", "value": 推定値(小数点1桁), "unit": "μg" },
    { "name": "ビタミンE", "value": 推定値(小数点1桁), "unit": "mg" },
    { "name": "亜鉛", "value": 推定値(小数点1桁), "unit": "mg" },
    { "name": "カリウム", "value": 推定値(整数), "unit": "mg" }
  ]
}`;

const SYSTEM_PROMPT_PHOTO = `あなたは栄養士です。食事の写真を見て、栄養評価を行ってください。
以下のJSON形式で回答してください。他の文字は一切含めないでください。

${NUTRITION_JSON_SCHEMA}

精度は目安レベルで構いません。料理の種類はある程度細かく判定し、量はざっくり推定してください。`;

const SYSTEM_PROMPT_FOODS = `あなたは栄養士です。食品名のリストから、栄養評価を行ってください。
以下のJSON形式で回答してください。他の文字は一切含めないでください。

${NUTRITION_JSON_SCHEMA}

一般的な1人前の量を想定して推定してください。`;

function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  return match ? match[1].trim() : text.trim();
}

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
  console.log(`[Nutrition] Starting evaluation for meal ${mealId}, photo: ${photoUrl}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`[Nutrition] No API key set, skipping meal ${mealId}`);
    await query(
      `UPDATE meals SET nutrition_status = 'skipped' WHERE id = $1`,
      [mealId]
    );
    return;
  }

  try {
    const filePath = path.join("/app", photoUrl);
    console.log(`[Nutrition] Reading image file: ${filePath}`);
    const imageBuffer = await fs.readFile(filePath);
    const base64 = imageBuffer.toString("base64");
    const mediaType = getMediaType(photoUrl);
    console.log(`[Nutrition] Sending to Claude API (${mediaType}, ${imageBuffer.length} bytes)`);

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
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
      system: SYSTEM_PROMPT_PHOTO,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const result: NutritionResult = JSON.parse(extractJson(textBlock.text));
    console.log(`[Nutrition] Evaluation completed for meal ${mealId}:`, JSON.stringify(result));

    await query(
      `UPDATE meals
       SET nutrition_status = 'completed',
           nutrition_result = $1,
           evaluated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(result), mealId]
    );
    console.log(`[Nutrition] Saved to DB for meal ${mealId}`);
  } catch (err) {
    console.error(`[Nutrition] Evaluation FAILED for meal ${mealId}:`, err);
    await query(
      `UPDATE meals SET nutrition_status = 'failed' WHERE id = $1`,
      [mealId]
    );
  }
}

export async function reevaluateNutritionByFoods(
  mealId: string,
  foods: string[]
): Promise<NutritionResult> {
  console.log(`[Nutrition] Re-evaluating meal ${mealId} by foods: ${foods.join(", ")}`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `以下の食品リストの栄養評価をお願いします。\n\n${foods.map((f, i) => `${i + 1}. ${f}`).join("\n")}`,
      },
    ],
    system: SYSTEM_PROMPT_FOODS,
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude");
  }

  const result: NutritionResult = JSON.parse(extractJson(textBlock.text));
  console.log(`[Nutrition] Re-evaluation completed for meal ${mealId}:`, JSON.stringify(result));

  await query(
    `UPDATE meals
     SET nutrition_status = 'completed',
         nutrition_result = $1,
         evaluated_at = NOW()
     WHERE id = $2`,
    [JSON.stringify(result), mealId]
  );

  return result;
}
